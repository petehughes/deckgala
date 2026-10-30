# Application Deployment Playbook (systemd + Caddy, no Docker)

Prerequisites: [server-base-playbook.md](./server-base-playbook.md) and [server-software-playbook.md](./server-software-playbook.md) are complete (PostgreSQL, Caddy with working certificates, Node 26, Bun, service user `aquateamhub`).
Run as `ph` using `sudo` unless stated. `<...>` marks values you must replace.

## Port map

| App | Package | Port | Hostname |
|---|---|---|---|
| myclub | `@aquateamhub/myclub` | 3000 | myclub.aquateamhub.com |
| auth | `@aquateamhub/auth` | 3001 | auth.aquateamhub.com |
| my | `@aquateamhub/my` | 3002 | my.aquateamhub.com |
| results | `@aquateamhub/results` | 3003 | results.aquateamhub.com |
| www | `@aquateamhub/www` | 3004 | www.aquateamhub.com |
| api | `@aquateamhub/api` (Bun) | 8080 | api.aquateamhub.com |

Gotchas found in the repo:
- The API defaults to port **3001** (`apps/api/src/index.ts`), which clashes with `auth`. Always set `PORT=8080` for it.
- `myclub`, `results` and `www` `start` scripts have no `--port`, so they default to 3000. Always set `PORT` per service.
- `auth` and `my` fall back to a hardcoded `BETTER_AUTH_SECRET`. Always set a real one.
- `NEXT_PUBLIC_*` values (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`) are baked in at **build** time, so they must be set when running `next build`.
- `results` falls back to `http://localhost:3001` for the API if `NEXT_PUBLIC_API_URL` is unset at build.

## 1. Clone the repository
Use a read-only deploy key so the server can pull without your personal credentials.
```bash
sudo -u aquateamhub ssh-keygen -t ed25519 -N "" -f /srv/aquateamhub/.ssh/id_ed25519 -C "aquateamhub-deploy"
sudo -u aquateamhub cat /srv/aquateamhub/.ssh/id_ed25519.pub
```
If `/srv/aquateamhub/.ssh` does not exist: `sudo -u aquateamhub mkdir -m 700 /srv/aquateamhub/.ssh` first.
Add the public key in GitHub: repo, Settings, Deploy keys, Add (leave write access off). Then:
```bash
sudo -u aquateamhub bash -c 'ssh-keyscan github.com >> /srv/aquateamhub/.ssh/known_hosts'
sudo -u aquateamhub git clone git@github.com:petehughes/deckgala.git /srv/aquateamhub/repo
```
(Use the actual repository path if it has been renamed.)
**Verify:** `ls /srv/aquateamhub/repo/apps`

## 2. Production environment files
Shared secrets live in one file, per-app values in small files next to it.
```bash
openssl rand -base64 48        # BETTER_AUTH_SECRET
openssl rand -base64 48        # API_BEARER_TOKEN
```
```bash
sudo tee /etc/aquateamhub/env >/dev/null <<'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://aquateamhub:<DB_PASSWORD>@127.0.0.1:5432/aquateamhub?schema=public
BETTER_AUTH_SECRET=<GENERATED_SECRET>
COOKIE_DOMAIN=.aquateamhub.com
AUTH_URL=https://auth.aquateamhub.com
MY_URL=https://my.aquateamhub.com
MYCLUB_URL=https://myclub.aquateamhub.com
RESULTS_URL=https://results.aquateamhub.com
WWW_URL=https://www.aquateamhub.com
API_URL=https://api.aquateamhub.com
API_BEARER_TOKEN=<GENERATED_TOKEN>
CORS_ORIGIN=https://www.aquateamhub.com,https://results.aquateamhub.com,https://myclub.aquateamhub.com,https://my.aquateamhub.com
EOF
sudo chown root:aquateamhub /etc/aquateamhub/env && sudo chmod 640 /etc/aquateamhub/env
```
Per-app overrides (each file sets the port and, where the code reads it, the app's own base URL):
```bash
cd /etc/aquateamhub
echo -e "PORT=3000\nBETTER_AUTH_URL=https://myclub.aquateamhub.com" | sudo tee myclub.env
echo -e "PORT=3001\nBETTER_AUTH_URL=https://auth.aquateamhub.com"   | sudo tee auth.env
echo -e "PORT=3002\nBETTER_AUTH_URL=https://my.aquateamhub.com"     | sudo tee my.env
echo -e "PORT=3003"                                                 | sudo tee results.env
echo -e "PORT=3004"                                                 | sudo tee www.env
echo -e "PORT=8080"                                                 | sudo tee api.env
sudo chown root:aquateamhub *.env && sudo chmod 640 *.env
```
Optional integrations, append to `/etc/aquateamhub/env` or the relevant app file only when you use them:
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CLUBS_PRICE_ID`, `PLATFORM_ADMIN_EMAILS`, `SWIM_ENGLAND_API_KEY`, `SWIM_ENGLAND_API_URL`.

**CORS note:** `CORS_ORIGIN="*"` from `.env.example` is for development only. Check how `apps/api/src/index.ts` parses the value (single origin vs list) and adjust before going live.

## 3. Build-time environment
Build variables are exported in the shell that runs `next build`. Create a file the deploy script sources:
```bash
sudo tee /srv/aquateamhub/build.env >/dev/null <<'EOF'
export NEXT_PUBLIC_AUTH_URL=https://auth.aquateamhub.com
export NEXT_PUBLIC_API_URL=https://api.aquateamhub.com
export NEXT_PUBLIC_SITE_URL=https://www.aquateamhub.com
EOF
sudo chown aquateamhub:aquateamhub /srv/aquateamhub/build.env && sudo chmod 600 /srv/aquateamhub/build.env
```

## 4. First build and database migration
Run as the service user, with the env files loaded. If the box has under 4 GB RAM, make sure swap from the base playbook is active.
```bash
sudo -u aquateamhub bash -lc '
  set -euo pipefail
  cd /srv/aquateamhub/repo
  set -a; source /etc/aquateamhub/env; set +a
  source /srv/aquateamhub/build.env
  bun install --frozen-lockfile
  bun run --filter @aquateamhub/database db:generate
  bun run --filter @aquateamhub/database db:migrate:deploy
  for a in auth my myclub results www; do bun run --filter @aquateamhub/$a build; done
'
```
`/etc/aquateamhub/env` is group-readable by `aquateamhub`, so this works. If a build runs out of memory, build one app at a time and watch `free -h`.

**Verify:**
```bash
PGPASSWORD='<DB_PASSWORD>' psql -h 127.0.0.1 -U aquateamhub -d aquateamhub -c '\dt' | head
ls /srv/aquateamhub/repo/apps/*/.next -d
```
Always use `migrate deploy` in production, never `migrate dev`.

## 5. systemd units
Next.js template unit, one instance per app (`%i` is the app folder name):
```bash
sudo tee /etc/systemd/system/aquateamhub-next@.service >/dev/null <<'EOF'
[Unit]
Description=AquaTeamHub %i (Next.js)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=aquateamhub
Group=aquateamhub
WorkingDirectory=/srv/aquateamhub/repo/apps/%i
EnvironmentFile=/etc/aquateamhub/env
EnvironmentFile=/etc/aquateamhub/%i.env
ExecStart=/usr/bin/node /srv/aquateamhub/repo/node_modules/next/dist/bin/next start --port ${PORT} --hostname 127.0.0.1
Restart=always
RestartSec=3
MemoryMax=700M
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF
```
API unit:
```bash
sudo tee /etc/systemd/system/aquateamhub-api.service >/dev/null <<'EOF'
[Unit]
Description=AquaTeamHub API (Bun)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=aquateamhub
Group=aquateamhub
WorkingDirectory=/srv/aquateamhub/repo/apps/api
EnvironmentFile=/etc/aquateamhub/env
EnvironmentFile=/etc/aquateamhub/api.env
ExecStart=/usr/local/bin/bun src/index.ts
Restart=always
RestartSec=3
MemoryMax=500M
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF
```
Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aquateamhub-api
for a in auth my myclub results www; do sudo systemctl enable --now aquateamhub-next@$a; done
```
**Verify:**
```bash
systemctl --no-pager status aquateamhub-api 'aquateamhub-next@*' | grep -E '●|Active'
for p in 3000 3001 3002 3003 3004 8080; do echo -n "$p: "; curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:$p/; done
```
A `200`, `3xx` or `401` means the process is up. `000` means it is not listening, so check `journalctl -u aquateamhub-next@<app> -n 50`.

If a Next app cannot find `next`, confirm the path: `ls /srv/aquateamhub/repo/node_modules/next/dist/bin/next` (Bun hoists to the repo root; if missing, it will be under `apps/<app>/node_modules`).

## 6. Caddy reverse proxy
Replace the placeholder Caddyfile (keep the global `email` block):
```bash
sudo tee /etc/caddy/Caddyfile >/dev/null <<'EOF'
{
  email <YOUR_EMAIL>
}

(common) {
  encode zstd gzip
  header {
    Strict-Transport-Security "max-age=31536000"
    X-Content-Type-Options nosniff
    Referrer-Policy strict-origin-when-cross-origin
    -Server
  }
}

aquateamhub.com {
  redir https://www.aquateamhub.com{uri} permanent
}

www.aquateamhub.com {
  import common
  reverse_proxy 127.0.0.1:3004
}

auth.aquateamhub.com {
  import common
  reverse_proxy 127.0.0.1:3001
}

my.aquateamhub.com {
  import common
  reverse_proxy 127.0.0.1:3002
}

myclub.aquateamhub.com {
  import common
  reverse_proxy 127.0.0.1:3000
}

results.aquateamhub.com {
  import common
  reverse_proxy 127.0.0.1:3003
}

api.aquateamhub.com {
  import common
  reverse_proxy 127.0.0.1:8080
}
EOF
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```
**Verify:** `curl -I https://www.aquateamhub.com`, and the same for `auth`, `my`, `myclub`, `results` and `api`. Then sign in through the browser and confirm the session cookie (domain `.aquateamhub.com`) is shared across `my` and `myclub`.

## 7. Deploy script (updates)
```bash
sudo tee /srv/aquateamhub/deploy.sh >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd /srv/aquateamhub/repo
set -a; source /etc/aquateamhub/env; set +a
source /srv/aquateamhub/build.env

git fetch --prune origin
git checkout "${1:-main}"
git pull --ff-only

bun install --frozen-lockfile
bun run --filter @aquateamhub/database db:generate
bun run --filter @aquateamhub/database db:migrate:deploy
for a in auth my myclub results www; do bun run --filter @aquateamhub/$a build; done

sudo /bin/systemctl restart aquateamhub-api 'aquateamhub-next@auth' 'aquateamhub-next@my' 'aquateamhub-next@myclub' 'aquateamhub-next@results' 'aquateamhub-next@www'
echo "Deployed $(git rev-parse --short HEAD)"
EOF
sudo chown aquateamhub:aquateamhub /srv/aquateamhub/deploy.sh && sudo chmod 750 /srv/aquateamhub/deploy.sh
```
Allow only the restart command without a password:
```bash
sudo tee /etc/sudoers.d/91-aquateamhub-deploy >/dev/null <<'EOF'
aquateamhub ALL=(root) NOPASSWD: /bin/systemctl restart aquateamhub-api aquateamhub-next@auth aquateamhub-next@my aquateamhub-next@myclub aquateamhub-next@results aquateamhub-next@www
EOF
sudo chmod 440 /etc/sudoers.d/91-aquateamhub-deploy && sudo visudo -c
```
Because the service account has `nologin`, run it with: `sudo -u aquateamhub /srv/aquateamhub/deploy.sh`.
Building in place means each app is briefly unavailable while restarting. That is acceptable at this scale. Take a database dump before any deploy that includes a migration:
`sudo -u postgres pg_dump -Fc aquateamhub > /var/backups/aquateamhub/pre-deploy-$(date +%F-%H%M).dump`

## 8. Automating from GitHub Actions (optional)
- Create a dedicated SSH key pair for CI. Put the private key in the repo secret `DEPLOY_SSH_KEY`, plus `DEPLOY_HOST` and `DEPLOY_USER=ph`.
- Add the public key to `/home/ph/.ssh/authorized_keys`, ideally restricted: `command="sudo -u aquateamhub /srv/aquateamhub/deploy.sh",no-port-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA...`
- The workflow runs tests, then `ssh ph@$DEPLOY_HOST`. Ask me to generate it.

## 9. Operations cheat sheet
```bash
journalctl -u aquateamhub-next@auth -f           # live logs for one app
journalctl -u aquateamhub-api -n 100 --no-pager
sudo systemctl restart aquateamhub-next@myclub   # restart one app
systemctl list-units 'aquateamhub-*'             # overview
sudo systemctl reload caddy                      # after Caddyfile edits
```
Rollback: `sudo -u aquateamhub bash -c 'cd /srv/aquateamhub/repo && git checkout <previous-sha>' && sudo -u aquateamhub /srv/aquateamhub/deploy.sh <previous-sha>`. Migrations are not reversed automatically, so restore the pre-deploy dump if a migration must be undone.

## 10. Final checklist
- [ ] All six services `active (running)` and survive `sudo reboot`
- [ ] All six `https://` hostnames respond with valid certificates
- [ ] Ports 3000-3004 and 8080 are not reachable from outside (`ss -ltn` shows them on `127.0.0.1` only for Next apps)
- [ ] Sign-in works and the session is shared across `my` and `myclub`
- [ ] `/etc/aquateamhub/*` are `640 root:aquateamhub`, with no secrets left in the repo
- [ ] `CORS_ORIGIN` is not `*`
- [ ] Deploy script runs end to end once
- [ ] VPS snapshot labelled "apps-deployed"
