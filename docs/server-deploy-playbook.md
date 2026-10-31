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
WorkingDirectory=/srv/aquateamhub/current/apps/%i
EnvironmentFile=/etc/aquateamhub/env
EnvironmentFile=/etc/aquateamhub/%i.env
ExecStart=/usr/bin/node /srv/aquateamhub/current/node_modules/next/dist/bin/next start --port ${PORT} --hostname 127.0.0.1
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
WorkingDirectory=/srv/aquateamhub/current/apps/api
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
Enable and start (point `/srv/aquateamhub/current` to `/srv/aquateamhub/repo` for initial setup):
```bash
sudo -u aquateamhub ln -sfn /srv/aquateamhub/repo /srv/aquateamhub/current
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

If a Next app cannot find `next`, confirm the path: `ls /srv/aquateamhub/current/node_modules/next/dist/bin/next` (Bun hoists to the repo root; if missing, it will be under `apps/<app>/node_modules`).

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

(proxy_buffered) {
  lb_try_duration 10s
  lb_try_interval 250ms
}

# Holding page: active while /var/www/maintenance/ACTIVE exists (checked per request, no reload needed)
(maintenance) {
  @maintenance file /var/www/maintenance/ACTIVE
  handle @maintenance {
    root * /var/www/maintenance
    rewrite * /maintenance.html
    header Cache-Control "no-store"
    header Retry-After "120"
    file_server {
      status 503
    }
  }
}

(maintenance_api) {
  @maintenance file /var/www/maintenance/ACTIVE
  handle @maintenance {
    header Cache-Control "no-store"
    header Retry-After "120"
    respond `{"error":"maintenance","message":"Service is being updated, please retry shortly"}` 503
  }
}

aquateamhub.com {
  redir https://www.aquateamhub.com{uri} permanent
}

www.aquateamhub.com {
  import common
  import maintenance
  reverse_proxy 127.0.0.1:3004 {
    import proxy_buffered
  }
}

auth.aquateamhub.com {
  import common
  import maintenance
  reverse_proxy 127.0.0.1:3001 {
    import proxy_buffered
  }
}

my.aquateamhub.com {
  import common
  import maintenance
  reverse_proxy 127.0.0.1:3002 {
    import proxy_buffered
  }
}

myclub.aquateamhub.com {
  import common
  import maintenance
  reverse_proxy 127.0.0.1:3000 {
    import proxy_buffered
  }
}

results.aquateamhub.com {
  import common
  import maintenance
  reverse_proxy 127.0.0.1:3003 {
    import proxy_buffered
  }
}

api.aquateamhub.com {
  import common
  import maintenance_api
  reverse_proxy 127.0.0.1:8080 {
    import proxy_buffered
  }
}
EOF
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```
### 6.1 Holding page
Create the page in a world-readable directory (not under `/srv`, so the `caddy` user can always read it). Do this **before** reloading Caddy with the config above.
```bash
sudo mkdir -p /var/www/maintenance
sudo chown aquateamhub:aquateamhub /var/www/maintenance
sudo -u aquateamhub tee /var/www/maintenance/maintenance.html >/dev/null <<'EOF'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="30">
<title>AquaTeamHub - updating</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#0b2a4a;color:#fff;text-align:center}
  main{padding:2rem;max-width:32rem}
  h1{margin:0 0 .75rem;font-size:1.75rem}
  p{margin:0;opacity:.85;line-height:1.5}
</style>
</head>
<body>
<main>
  <h1>We'll be right back</h1>
  <p>AquaTeamHub is being updated. This page refreshes automatically, and the site will return in a few minutes.</p>
</main>
</body>
</html>
EOF
```
Test it manually (no deploy needed):
```bash
sudo -u aquateamhub touch /var/www/maintenance/ACTIVE
curl -si https://www.aquateamhub.com | head -n 5      # HTTP/2 503, holding page
curl -si https://api.aquateamhub.com                  # 503 JSON
sudo -u aquateamhub rm /var/www/maintenance/ACTIVE
curl -sI https://www.aquateamhub.com                  # back to normal
```

**Verify:** `curl -I https://www.aquateamhub.com`, and the same for `auth`, `my`, `myclub`, `results` and `api`. Then sign in through the browser and confirm the session cookie (domain `.aquateamhub.com`) is shared across `my` and `myclub`.

## 7. Zero-Downtime Release Activation Script
Create the releases directory structure and activation script on the server:
```bash
sudo mkdir -p /srv/aquateamhub/releases
sudo chown -R aquateamhub:aquateamhub /srv/aquateamhub/releases

sudo tee /srv/aquateamhub/activate-release.sh >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

RELEASE_ID="${1:-}"
if [ -z "$RELEASE_ID" ]; then
  echo "Usage: $0 <release-id>" >&2
  exit 1
fi

RELEASE_DIR="/srv/aquateamhub/releases/$RELEASE_ID"

if [ ! -d "$RELEASE_DIR" ]; then
  echo "Release directory $RELEASE_DIR does not exist!" >&2
  exit 1
fi

echo "Activating release: $RELEASE_ID"

# 1. Run migrations inside the new release directory
cd "$RELEASE_DIR"
set -a; source /etc/aquateamhub/env; set +a
bun run --filter @aquateamhub/database db:migrate:deploy

# 2. Atomic symlink swap
ln -sfn "$RELEASE_DIR" /srv/aquateamhub/current

# 3. Restart services
sudo /bin/systemctl restart aquateamhub-api 'aquateamhub-next@auth' 'aquateamhub-next@my' 'aquateamhub-next@myclub' 'aquateamhub-next@results' 'aquateamhub-next@www'

# 4. Verify processes are alive
for p in 3000 3001 3002 3003 3004 8080; do
  ok=0
  for i in $(seq 1 15); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$p/" || true)
    if [ "$code" != "000" ]; then ok=1; break; fi
    sleep 1
  done
  [ "$ok" = 1 ] || { echo "Warning: Port $p did not immediately answer" >&2; }
done

# 5. Clean up old releases, keep last 3
cd /srv/aquateamhub/releases
ls -dt */ 2>/dev/null | tail -n +4 | xargs -r rm -rf

echo "Release $RELEASE_ID is LIVE!"
EOF
sudo chown aquateamhub:aquateamhub /srv/aquateamhub/activate-release.sh && sudo chmod 750 /srv/aquateamhub/activate-release.sh
```

Allow the restart command without a password:
```bash
sudo tee /etc/sudoers.d/91-aquateamhub-deploy >/dev/null <<'EOF'
aquateamhub ALL=(root) NOPASSWD: /bin/systemctl restart aquateamhub-api aquateamhub-next@auth aquateamhub-next@my aquateamhub-next@myclub aquateamhub-next@results aquateamhub-next@www
EOF
sudo chmod 440 /etc/sudoers.d/91-aquateamhub-deploy && sudo visudo -c
```

## 8. Automating Zero-Downtime Deployment via GitHub Actions
Builds run automatically in GitHub Actions on push to `master` (configured in `.github/workflows/deploy.yml`). The workflow compiles all Next.js applications, builds a release bundle, transfers it to the server, and triggers `/srv/aquateamhub/activate-release.sh`.

### 8.1 SSH Key Setup
1. Generate an SSH key pair dedicated to GitHub Actions:
   ```bash
   ssh-keygen -t ed25519 -N "" -f ~/.ssh/github_deploy -C "gh-actions-deploy"
   ```
2. Add the public key to `/home/ph/.ssh/authorized_keys` on the server:
   ```bash
   cat ~/.ssh/github_deploy.pub >> /home/ph/.ssh/authorized_keys
   chmod 600 /home/ph/.ssh/authorized_keys
   ```
3. In GitHub Repository: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`:
   - `DEPLOY_HOST`: Your server IP or domain (e.g. `123.45.67.89`)
   - `DEPLOY_USER`: `ph`
   - `DEPLOY_SSH_KEY`: Content of `~/.ssh/github_deploy` (private key)

Now every push to `master` triggers `.github/workflows/deploy.yml` and achieves zero downtime.

## 9. Operations & Rollbacks cheat sheet
```bash
journalctl -u aquateamhub-next@auth -f           # live logs for one app
journalctl -u aquateamhub-api -n 100 --no-pager
sudo systemctl restart aquateamhub-next@myclub   # restart one app
systemctl list-units 'aquateamhub-*'             # overview
sudo systemctl reload caddy                      # after Caddyfile edits
```

**Instant Rollback to Previous Release:**
```bash
# List available release IDs
ls -l /srv/aquateamhub/releases

# Activate previous release immediately:
sudo -u aquateamhub /srv/aquateamhub/activate-release.sh <PREVIOUS_COMMIT_SHA>
```

## 10. Final checklist
- [ ] All six services `active (running)` and survive `sudo reboot`
- [ ] All six `https://` hostnames respond with valid certificates
- [ ] Symlink `/srv/aquateamhub/current` points to the active release directory
- [ ] Ports 3000-3004 and 8080 are not reachable from outside (`ss -ltn` shows them on `127.0.0.1` only for Next apps)
- [ ] Sign-in works and the session is shared across `my` and `myclub`
- [ ] `/etc/aquateamhub/*` are `640 root:aquateamhub`, with no secrets left in the repo
- [ ] `CORS_ORIGIN` is not `*`
- [ ] GitHub Actions workflow completed a successful zero-downtime deploy
- [ ] VPS snapshot labelled "apps-deployed"
