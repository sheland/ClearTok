# ClearTok

Download your own TikTok videos, watermark-free. Live at [getcleartok.com](https://getcleartok.com).

## Project Structure

```
ClearTok/
├── backend/ClearTok.API/     .NET 10 Web API
├── frontend-web/             React + TypeScript + Vite
└── setup_ytdlp.sh            Bundles yt-dlp into deployment zip
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite → Azure Static Web Apps |
| Backend | .NET 10 Web API → Azure App Service B1 |
| Video engine | yt-dlp (standalone binary, bundled in deployment) |
| Proxies | Webshare residential proxies (10 IPs, stored in Azure env vars) |
| Domain | getcleartok.com via Porkbun |
| Analytics | Google Analytics G-40NVZMR31T |
| Monetization | Google AdSense ca-pub-2162768168452928 |

---

## Local Development Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| .NET SDK | 10.0+ | https://dot.net |
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| yt-dlp | latest | `pip3 install yt-dlp curl_cffi==0.10.0` |

### 1. Start the Backend

```bash
cd backend/ClearTok.API
dotnet restore
dotnet run
```

API available at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/video/health`

### 2. Start the Frontend

```bash
cd frontend-web
npm install
npm run dev
```

App available at: `http://localhost:5173`

---

## How It Works

```
User pastes TikTok URL
        ↓
React strips caption prefix (mobile copy includes caption text before URL)
        ↓
POST /api/video/download
        ↓
.NET rate-limits by IP (10/hour)
        ↓
CORS validated (getcleartok.com allowed)
        ↓
YtDlpService picks random proxy from Webshare pool
        ↓
yt-dlp fetches unwatermarked video from TikTok CDN via residential proxy
        ↓
.NET streams video as file download (DeleteOnCloseStream — auto-deletes temp file)
        ↓
Browser saves cleartok-{videoId}.mp4
```

---

## Azure Deployment

### Frontend — Azure Static Web Apps (automatic)

The frontend deploys automatically via GitHub Actions on every push to `main`.  
Workflow file: `.github/workflows/azure-static-web-apps-proud-flower-0245b0910.yml`

```bash
cd /Users/shelan/Desktop/Watermark/ClearTok
git add .
git commit -m "your message"
git push
# GitHub Actions handles the rest — no manual steps needed
```

### Backend — Azure App Service B1 (manual)

The backend requires manual deployment. Run these steps every time you change backend code:

**Step 1 — Clean and build:**
```bash
cd backend/ClearTok.API
rm -rf publish
rm -f cleartok-api.zip
dotnet publish -c Release -o ./publish
```

**Step 2 — Bundle yt-dlp (standalone binary + curl_cffi):**
```bash
bash setup_ytdlp.sh
```

This downloads the yt-dlp Linux standalone binary (Python included — no system Python required) and installs curl_cffi into the publish folder so both survive Azure container restarts.

**Step 3 — Create zip:**
```bash
cd publish && zip -r ../cleartok-api.zip . && cd ..
```

**Step 4 — Upload and deploy via Azure Cloud Shell:**

> Note: Azure CLI cannot be installed on macOS 12. Use Azure Cloud Shell (browser terminal) at portal.azure.com instead.

1. Open portal.azure.com → click Cloud Shell (`>_` icon)
2. Drag `cleartok-api.zip` (from backend folder) onto the Cloud Shell terminal window
3. Run:

```bash
az webapp deploy --name cleartok-api --resource-group cleartok-rg --src-path /home/shelly/cleartok-api.zip --type zip
```

**Step 5 — Verify:**
```bash
curl https://cleartok-api.azurewebsites.net/api/video/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ClearTok API",
  "ytDlp": "available",
  "ytDlpVersion": "2026.03.17",
  "timestamp": "..."
}
```

> No SSH reinstall needed — yt-dlp and curl_cffi are bundled in the zip and survive restarts.

---

## Azure Resources

| Resource | Name | Details |
|----------|------|---------|
| Resource group | cleartok-rg | West US 2 |
| App Service Plan | cleartok-plan | B1 Linux (~$13/mo) |
| Web App (backend) | cleartok-api | cleartok-api.azurewebsites.net |
| Static Web App (frontend) | cleartok-web | proud-flower-0245b0910.7.azurestaticapps.net |

## Azure App Settings (Environment Variables)

| Key | Description |
|-----|-------------|
| `ASPNETCORE_ENVIRONMENT` | Production |
| `ASPNETCORE_URLS` | http://+:8080 |
| `Storage__TempDirectory` | /tmp/cleartok |
| `YtDlp__ExecutablePath` | /home/site/wwwroot/yt-dlp |
| `Proxies__List` | Webshare residential proxies in `host:port:user:pass` format, comma separated |

---

## Frontend Environment Variables

```bash
# .env (local development)
VITE_API_URL=http://localhost:5000/api

# .env.production (Azure)
VITE_API_URL=https://cleartok-api.azurewebsites.net/api
```

---

## DNS (Porkbun)

| Type | Host | Value |
|------|------|-------|
| ALIAS | getcleartok.com | proud-flower-0245b0910.7.azurestaticapps.net |
| TXT | getcleartok.com | Azure domain validation token |
| TXT | getcleartok.com | Google Search Console verification |

---

## Troubleshooting

### Downloads failing (422 error)

Check the logs:
```bash
az webapp log tail --name cleartok-api --resource-group cleartok-rg
```

| Error in logs | Fix |
|---------------|-----|
| `python3: No such file or directory` (exit 127) | SSH in, reinstall Python: `apt-get install -y python3 python3-pip && pip3 install curl_cffi==0.10.0 --break-system-packages` |
| `IP address blocked` | Refresh Webshare proxies, update `Proxies__List` env var |
| `could not find chrome cookies database` | Remove `--cookies-from-browser chrome` from YtDlpService.cs |
| `403 Forbidden` | Proxy issue — check Webshare pool |

### Health check shows unhealthy after deploy

The yt-dlp standalone binary should be bundled in the zip. If health is still unhealthy:
```bash
az webapp ssh --name cleartok-api --resource-group cleartok-rg
/home/site/wwwroot/yt-dlp --version
```

If that fails, re-run `setup_ytdlp.sh` and redeploy.

---

## Monetization & Legal

| Item | Details |
|------|---------|
| Google AdSense | Publisher ID: ca-pub-2162768168452928 (pending approval) |
| DMCA Agent | DMCA-1073308 — renew May 2029 (~$6 at copyright.gov) |
| Google Analytics | G-40NVZMR31T |
| Google Search Console | Verified, sitemap submitted |

---

## Rate Limiting

- 10 downloads per IP per hour
- Returns HTTP 429 with user-friendly error message
- Configurable in `Program.cs` → `PermitLimit`

---

## Legal Notes

- This tool is intended for creators downloading their own content
- Terms of Service, Privacy Policy, and DMCA pages are included at `/terms`, `/privacy`, `/dmca`
- DMCA agent registered for safe harbor protection
- Blog at `/blog` with creator guides for AdSense compliance
