# Server Software Playbook (PostgreSQL, Caddy, Node 26, Bun)

Prerequisite: [server-base-playbook.md](./server-base-playbook.md) is complete (user `ph`, firewall, DNS, service user `aquateamhub`).
Run as `ph` using `sudo`. `<...>` marks values you must replace.

## 1. PostgreSQL (local only)

### 1.1 Install
```bash
sudo apt update
apt policy postgresql          # note the candidate version
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```
**Verify:** `sudo -u postgres psql -c "select version();"`

### 1.2 Confirm it only listens locally
```bash
sudo -u postgres psql -c "show listen_addresses;"   # expect: localhost
ss -ltnp | grep 5432                                # expect 127.0.0.1 / ::1 only
```
Do not change `listen_addresses`, and do not open 5432 in `ufw`.

### 1.3 Create role and database
Generate a password and keep it for `/etc/aquateamhub/env`:
```bash
openssl rand -base64 32 | tr -d '/+=' | cut -c1-32
```
```bash
sudo -u postgres psql <<'EOF'
CREATE ROLE aquateamhub LOGIN PASSWORD '<DB_PASSWORD>';
CREATE DATABASE aquateamhub OWNER aquateamhub ENCODING 'UTF8';
EOF
```
Use a different role name if you prefer (e.g. `aquateamhub`); it only has to match `DATABASE_URL`.

**Verify:**
```bash
PGPASSWORD='<DB_PASSWORD>' psql -h 127.0.0.1 -U aquateamhub -d aquateamhub -c "select current_user;"
```
Connection string for the app:
`DATABASE_URL="postgresql://aquateamhub:<DB_PASSWORD>@127.0.0.1:5432/aquateamhub?schema=public"`
(URL-encode the password if it contains special characters; the command above avoids them.)

### 1.4 Backups
```bash
sudo chown postgres:postgres /var/backups/aquateamhub
sudo tee /etc/cron.d/aquateamhub-backup >/dev/null <<'EOF'
15 3 * * * postgres pg_dump -Fc aquateamhub > /var/backups/aquateamhub/aquateamhub-$(date +\%F).dump && find /var/backups/aquateamhub -name '*.dump' -mtime +7 -delete
EOF
```
This is a local backup only. Copy it off the server with `rclone` or `restic` later.
**Verify:** `sudo -u postgres bash -c 'pg_dump -Fc aquateamhub > /var/backups/aquateamhub/test.dump' && ls -lh /var/backups/aquateamhub`, then delete `test.dump`.

## 2. Caddy

### 2.1 Install from the official repo
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```
If the repo does not work on 26.04 yet, `sudo apt install -y caddy` from Ubuntu's own repo is an acceptable fallback (check `caddy version`).

**Verify:** `caddy version` and `systemctl status caddy` (active).

### 2.2 Pre-flight checks for Let's Encrypt
Caddy obtains and renews Let's Encrypt certificates automatically (HTTP-01 challenge on port 80, or TLS-ALPN-01 on 443). Before it can, all of these must be true:
```bash
# 1. Every hostname resolves to this server's public IP
for h in aquateamhub.com www.aquateamhub.com auth.aquateamhub.com my.aquateamhub.com myclub.aquateamhub.com results.aquateamhub.com api.aquateamhub.com; do echo -n "$h -> "; dig +short $h | tr '\n' ' '; echo; done
curl -4 -s ifconfig.me; echo           # this server's public IP, must match the above

# 2. Ports 80 and 443 are open locally (and in any one.com panel firewall)
sudo ufw status | grep -E '80|443'

# 3. Nothing else is bound to 80/443
sudo ss -ltnp | grep -E ':80 |:443 '   # only caddy should appear
```
If `dig` is missing: `sudo apt install -y dnsutils`. Remove any stale AAAA records that don't point at this server, since Let's Encrypt prefers IPv6 and will fail validation.

### 2.3 Test against the staging CA first
Let's Encrypt production limits failed validations (5 per hostname per hour), so test with staging while setting up.
```bash
sudo tee /etc/caddy/Caddyfile >/dev/null <<'EOF'
{
  email tepe.hughes@gmail.com
  acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
}

www.aquateamhub.com, auth.aquateamhub.com, my.aquateamhub.com, myclub.aquateamhub.com, results.aquateamhub.com, api.aquateamhub.com {
  respond "aquateamhub up" 200
}

aquateamhub.com {
  redir https://www.aquateamhub.com{uri} permanent
}
EOF
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
journalctl -u caddy -f --no-pager        # Ctrl+C when done
```
Look for `certificate obtained successfully` for each hostname.
**Verify:** `curl -kI https://www.aquateamhub.com` returns `HTTP/2 200`. `-k` is needed because staging certificates are not trusted by browsers.

### 2.4 Switch to production certificates
Remove the `acme_ca` line, then clear the staging certificates so Caddy requests real ones:
```bash
sudo sed -i '/acme_ca/d' /etc/caddy/Caddyfile
sudo systemctl stop caddy
sudo rm -rf /var/lib/caddy/.local/share/caddy/certificates/acme-staging-v02.api.letsencrypt.org-directory
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl start caddy
journalctl -u caddy -n 50 --no-pager
```
**Verify:**
```bash
curl -I https://www.aquateamhub.com                       # no -k needed, HTTP/2 200
curl -I http://www.aquateamhub.com                        # 308 redirect to https
echo | openssl s_client -connect www.aquateamhub.com:443 -servername www.aquateamhub.com 2>/dev/null | openssl x509 -noout -issuer -dates
```
The issuer should be Let's Encrypt (`R10`, `R11` or similar), not "(STAGING)". Also open the site in a browser and check the padlock.

### 2.5 Renewal and persistence
- Caddy renews automatically about 30 days before expiry. No cron job or certbot is needed.
- Certificates and the ACME account live in `/var/lib/caddy/.local/share/caddy`. Back this directory up and never delete it casually, otherwise you risk Let's Encrypt rate limits.
- Keep ports 80 and 443 open permanently, as renewal needs them.
- Check expiry any time with the `openssl` command above, or `sudo caddy list-modules >/dev/null && journalctl -u caddy | grep -i renew`.

### 2.6 Troubleshooting
| Symptom in `journalctl -u caddy` | Cause and fix |
|---|---|
| `NXDOMAIN` / `no valid A records` | DNS not created or not propagated yet. Wait, then re-check with `dig`. |
| `Timeout during connect` / `Connection refused` | Port 80 or 443 blocked. Check `ufw` and the one.com network firewall. |
| `Invalid response ... 404/403` | Another web server (apache2/nginx) is answering. `sudo systemctl disable --now apache2 nginx`. |
| `rateLimited` | Too many failures. Wait an hour (or a week for duplicate certificates), and use staging while debugging. |
| Works on IPv4 but fails | Wrong AAAA record. Fix or delete it. |

Real `reverse_proxy` rules replace the `respond` lines once the apps are running (see the deployment playbook). Keep the `email` global option, since Let's Encrypt uses it for expiry notices.
## 3. Node.js 26
```bash
curl -fsSL https://deb.nodesource.com/setup_26.x | sudo -E bash -
sudo apt install -y nodejs build-essential
```
**Verify:** `node -v` (v26.x), `npm -v`.
If NodeSource has no 26.x setup script yet, use `nvm`-free alternative: download the official Linux x64 tarball from https://nodejs.org/dist/ and extract to `/usr/local` (`sudo tar -xJf node-v26.*-linux-x64.tar.xz -C /usr/local --strip-components=1`).

## 4. Bun (system-wide)
```bash
sudo apt install -y unzip
curl -fsSL https://bun.sh/install | sudo BUN_INSTALL=/usr/local bash
```
**Verify:** `bun --version` and `which bun` (`/usr/local/bin/bun`), also `sudo -u aquateamhub /usr/local/bin/bun --version`.
Upgrade later with `sudo bun upgrade`. Pin the version on the server to match what you use in development.

## 5. Final checks
- [ ] `sudo -u postgres psql -c "select 1"` works; port 5432 is not reachable from outside
- [ ] `PGPASSWORD=... psql -h 127.0.0.1 -U aquateamhub -d aquateamhub` connects
- [ ] Nightly backup cron file exists at `/etc/cron.d/aquateamhub-backup`
- [ ] `https://www.aquateamhub.com` returns "aquateamhub up" with a trusted Let's Encrypt certificate (issuer not "STAGING")
- [ ] `node -v` is 26.x, `bun --version` works for `ph` and `aquateamhub`
- [ ] VPS snapshot labelled "software-installed"

## Next
1. Clone the repo to `/srv/aquateamhub/repo` as `aquateamhub`; create `/etc/aquateamhub/env` (chmod 640, `root:aquateamhub`).
2. Run `bun install`, `prisma generate`, `prisma migrate deploy`, and build the Next.js apps.
3. Add the systemd units and replace the placeholder Caddyfile with `reverse_proxy` rules.
