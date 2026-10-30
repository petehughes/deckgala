# Server Base Playbook (one.com VPS, Ubuntu 26.04 LTS, no Docker)

Goal: a hardened, empty server ready for PostgreSQL, Bun/Node, and Caddy.
Run every step in order. `<...>` marks values you must replace.
Commands run as `root` (or with `sudo`) unless stated.

## 0. Prerequisites
- [ ] VPS IP address (IPv4, and IPv6 if provided): `<VPS_IP>`
- [ ] Root credentials from one.com
- [ ] Your SSH public key (`~/.ssh/id_ed25519.pub`; create with `ssh-keygen -t ed25519` if missing)

## 1. First login and OS update
```bash
ssh root@<VPS_IP>
apt update && apt full-upgrade -y
apt install -y curl git unzip ufw fail2ban unattended-upgrades ca-certificates gnupg htop
timedatectl set-timezone UTC
hostnamectl set-hostname deckgala
reboot
```
Reconnect after the reboot.

**Verify:** `lsb_release -d` shows Ubuntu 26.04.x LTS; `uptime` shows a fresh boot.

## 2. Create an admin user (no more root work)
```bash
adduser --disabled-password --gecos "" ph
usermod -aG sudo ph
mkdir -p /home/ph/.ssh
echo "<YOUR_PUBLIC_KEY>" > /home/ph/.ssh/authorized_keys
chown -R ph:ph /home/ph/.ssh
chmod 700 /home/ph/.ssh && chmod 600 /home/ph/.ssh/authorized_keys
echo "ph ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/90-ph
chmod 440 /etc/sudoers.d/90-ph
```
**Verify (from a NEW local terminal, keep the root session open):**
`ssh ph@<VPS_IP>` then `sudo whoami` prints `root`.

## 3. Harden SSH
```bash
sudo tee /etc/ssh/sshd_config.d/99-hardening.conf >/dev/null <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
X11Forwarding no
EOF
sudo sshd -t && sudo systemctl reload ssh
```
**Verify:** open another new session with your key and confirm it works *before* closing any existing one. `ssh root@<VPS_IP>` must now be refused.

## 4. Firewall
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp   # HTTP/3
sudo ufw --force enable
sudo ufw status verbose
```
Do NOT open 5432 or the app ports (3000-3004, 8080).
If one.com also has a network firewall in its control panel, allow the same ports there.

## 5. Fail2ban
```bash
sudo tee /etc/fail2ban/jail.local >/dev/null <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
EOF
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

## 6. Automatic security updates
```bash
sudo dpkg-reconfigure -plow unattended-upgrades   # choose Yes
sudo systemctl enable --now unattended-upgrades
```
Optional: set `Unattended-Upgrade::Automatic-Reboot "true";` and `Automatic-Reboot-Time "04:00";` in `/etc/apt/apt.conf.d/50unattended-upgrades`. Services start on boot via systemd, so reboots are safe.

## 7. Swap (builds and memory spikes)
Skip if `free -h` already shows swap.
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf
sudo sysctl --system
```
**Verify:** `free -h` shows 2G swap.

## 8. Service user and directories
```bash
sudo adduser --system --group --home /srv/deckgala --shell /usr/sbin/nologin deckgala
sudo mkdir -p /srv/deckgala/repo /etc/deckgala /var/backups/deckgala
sudo chown -R deckgala:deckgala /srv/deckgala
sudo chown root:deckgala /etc/deckgala && sudo chmod 750 /etc/deckgala
sudo chown postgres:postgres /var/backups/deckgala 2>/dev/null || true   # re-run after Postgres is installed
```
Add your admin user to the group so you can deploy: `sudo usermod -aG deckgala ph` (re-login to apply).

## 9. Journald log limits
```bash
sudo mkdir -p /etc/systemd/journald.conf.d
printf "[Journal]\nSystemMaxUse=500M\nMaxRetentionSec=1month\n" | sudo tee /etc/systemd/journald.conf.d/limits.conf
sudo systemctl restart systemd-journald
```

## 10. DNS at one.com
In the one.com DNS settings for `deckgala.com`, add (TTL 300 while setting up, raise later):

| Type | Host | Value |
|---|---|---|
| A | `@` | `<VPS_IP>` |
| A | `www` | `<VPS_IP>` |
| A | `auth` | `<VPS_IP>` |
| A | `my` | `<VPS_IP>` |
| A | `myclub` | `<VPS_IP>` |
| A | `results` | `<VPS_IP>` |
| A | `api` | `<VPS_IP>` |
| AAAA | same hosts | `<VPS_IPV6>` (only if you have IPv6) |

Remove any conflicting existing A/AAAA/CNAME records for these hosts (e.g. one.com parking page).
**Verify:** `nslookup www.deckgala.com` (or `dig +short`) returns `<VPS_IP>`. Caddy cannot issue certificates until this resolves.

## 11. Final checklist
- [ ] `ssh ph@<VPS_IP>` works with key; root and password login refused
- [ ] `sudo ufw status` shows only 22, 80, 443
- [ ] `sudo fail2ban-client status sshd` is active
- [ ] `free -h` shows swap
- [ ] `/srv/deckgala`, `/etc/deckgala` exist with correct ownership
- [ ] All six hostnames plus apex resolve to the VPS
- [ ] Take a one.com VPS snapshot, labelled "base-hardened"

## Next
1. Install PostgreSQL (use the version in the 26.04 repo; check with `apt policy postgresql`) and create the `deckgala` role and database.
2. Install Caddy, then Node 22 LTS and Bun.
3. Deploy the apps as systemd services.
