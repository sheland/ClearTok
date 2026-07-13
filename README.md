# ClearTok

Download your own TikTok videos, watermark-free. Live at [getcleartok.com](https://getcleartok.com).

## Project Structure

```
ClearTok/
├── backend/ClearTok.API/     .NET 10 Web API
├── frontend-web/             React + TypeScript + Vite
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite → Azure Static Web Apps |
| Backend | .NET 10 Web API → Azure App Service B1 |
| Video engine | yt-dlp (`yt-dlp_linux` standalone binary, installed on Azure via SSH) |
| Proxy | Webshare **rotating** endpoint (one stable `host:port:user:pass`) |
| Monitoring | Azure Application Insights + email alerts |
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

> **Note:** `Properties/launchSettings.json` sets `ASPNETCORE_ENVIRONMENT=Development`, which makes .NET load `appsettings.Development.json`. That file is **gitignored** and must contain the Application Insights connection string, or the app won't start:
> ```json
> {
>   "ApplicationInsights": {
>     "ConnectionString": "InstrumentationKey=...;IngestionEndpoint=..."
>   }
> }
> ```

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
Photo posts (/photo/ URLs) rejected upfront — before any proxy request
        ↓
YtDlpService routes through Webshare rotating proxy endpoint
        ↓
yt-dlp fetches unwatermarked video from TikTok CDN
        ↓
Transient failures (proxy/timeout) retry silently, up to 2 times
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

**Step 2 — Create zip:**

```bash
cd publish && zip -r ../cleartok-api.zip . && cd ..
ls -lh cleartok-api.zip    # should be ~2-3MB
```

> **Do NOT bundle the yt-dlp binary into the zip.** It's ~38MB, which pushes the zip to ~46MB — too large for Cloud Shell's browser upload (it times out at ~90%). Azure downloads the binary itself in Step 4, server-to-server, in about 4 seconds.

**Step 3 — Upload and deploy via Azure Cloud Shell:**

> Note: Azure CLI cannot be installed on macOS 12. Use Azure Cloud Shell (browser terminal) at portal.azure.com instead.

1. Open portal.azure.com → click Cloud Shell (`>_` icon)
2. Drag `cleartok-api.zip` (from backend folder) onto the Cloud Shell terminal window
3. Run:

```bash
az webapp deploy --name cleartok-api --resource-group cleartok-rg --src-path /home/shelly/cleartok-api.zip --type zip
```

Wait for `"status": "RuntimeSuccessful"`.

**Step 4 — Install yt-dlp:**

The zip deploy replaces `/home/site/wwwroot`, which wipes the binary. Reinstall it:

```bash
az webapp ssh --name cleartok-api --resource-group cleartok-rg
```

Wait for the `root@` prompt, then:

```bash
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o /home/site/wwwroot/yt-dlp
chmod +x /home/site/wwwroot/yt-dlp
/home/site/wwwroot/yt-dlp --version
exit
```

> Must be `yt-dlp_linux` (the standalone binary with Python bundled), **not** plain `yt-dlp` (which requires system Python that Azure doesn't have).

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
  "ytDlpVersion": "2026.07.04",
  "timestamp": "..."
}
```

Then test a real download on getcleartok.com.

---

## Azure Resources

| Resource | Name | Details |
|----------|------|---------|
| Resource group | cleartok-rg | West US 2 |
| App Service Plan | cleartok-plan | B1 Linux (~$13/mo) |
| Web App (backend) | cleartok-api | cleartok-api.azurewebsites.net |
| Static Web App (frontend) | cleartok-web | proud-flower-0245b0910.7.azurestaticapps.net |
| Application Insights | cleartok-insights | Monitoring + email alerts |

## Azure App Settings (Environment Variables)

| Key | Description |
|-----|-------------|
| `ASPNETCORE_ENVIRONMENT` | Production |
| `ASPNETCORE_URLS` | http://+:8080 |
| `Storage__TempDirectory` | /tmp/cleartok |
| `YtDlp__ExecutablePath` | /home/site/wwwroot/yt-dlp |
| `Proxies__List` | Webshare rotating endpoint in `host:port:user:pass` format |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Full connection string |

### Critical Settings

> **Startup Command must be EMPTY.** Setting a custom startup script caused container startup failure (exit code 127) and took the site down. Verify with:
> ```bash
> az webapp config show --name cleartok-api --resource-group cleartok-rg --query "appCommandLine"
> ```

> **Always On: ENABLED** — prevents cold-start download failures. Never turn off.

> **Proxies:** using Webshare's **rotating endpoint** — one stable `host:port:user:pass`. Webshare rotates the exit IP per request, so the config never goes stale. The old approach (10 static IPs) broke roughly monthly as Webshare cycled them out, causing 407 auth errors.

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

## Error Handling

The backend classifies yt-dlp failures and responds accordingly:

| Failure type | Retries? | HTTP | User message |
|--------------|----------|------|--------------|
| `ProxyOrNetwork` | Yes (2) | 503 | "Something went wrong on our end. Please try again." |
| `Timeout` | Yes (2) | 503 | "This is taking longer than expected. Please try again." |
| `PrivateOrRemoved` | No | 422 | "This video is private or no longer available." |
| `Unknown` | No | 422 | "Download failed. Please check the link and try again." |

Only transient failures retry. Permanent failures fail fast so the user isn't left waiting for something that can never succeed.

Photo posts (`/photo/` URLs) are rejected in `VideoDownloadService` **before** any proxy request — they fail instantly rather than burning retries.

---

## Troubleshooting

### Downloads failing

Stream logs and reproduce the error:

```bash
az webapp log tail --name cleartok-api --resource-group cleartok-rg
```

(Ctrl+C to stop. Always stop the log tail before running other commands, or they get typed into the log stream instead of executing.)

| Error in logs | Cause | Fix |
|---------------|-------|-----|
| `python3: No such file` (exit 127) | Wrong yt-dlp binary installed | Reinstall `yt-dlp_linux`, not plain `yt-dlp` |
| `407` / `CONNECT tunnel failed` | Proxy credentials rejected | Refresh proxy from Webshare, update `Proxies__List` |
| `403 Forbidden` / `IP address blocked` | Proxy IP flagged by TikTok | Check Webshare proxy status |
| `Unsupported URL` | Photo/slideshow post | Working as intended — rejected upfront |
| `You do not have permission` | Private video | Working as intended — private videos can't be downloaded |
| `could not find chrome cookies database` | `--cookies-from-browser chrome` flag present | Remove it from YtDlpService.cs |
| `:( Application Error` page | Container won't start | Check Startup Command is empty (see below) |

### Health check shows unhealthy after deploy

The zip deploy wipes `/home/site/wwwroot`, including yt-dlp. Reinstall it:

```bash
az webapp ssh --name cleartok-api --resource-group cleartok-rg
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o /home/site/wwwroot/yt-dlp
chmod +x /home/site/wwwroot/yt-dlp
/home/site/wwwroot/yt-dlp --version
exit
```

### Site completely down (`:( Application Error`)

Almost always a bad Startup Command. Check and clear it:

```bash
az webapp config show --name cleartok-api --resource-group cleartok-rg --query "appCommandLine"
az webapp config set --name cleartok-api --resource-group cleartok-rg --startup-file " "
az webapp restart --name cleartok-api --resource-group cleartok-rg
```

> **You cannot SSH into a crashed container** — the app must be running before it accepts SSH connections. Fix the startup config first, then debug inside the container.

---

## Monitoring

Application Insights → `cleartok-insights` → **Logs**

```kusto
// Successful downloads by day
requests
| where name == "POST api/Video/download"
| where success == true
| summarize Downloads = count() by bin(timestamp, 1d)
| order by timestamp desc

// Failed downloads
requests
| where name == "POST api/Video/download"
| where success == false
| order by timestamp desc

// Error details (raw yt-dlp stderr)
exceptions
| order by timestamp desc
| take 20

// Downloads by country
requests
| where name == "POST api/Video/download"
| where success == true
| summarize Downloads = count() by client_CountryOrRegion
| order by Downloads desc
```

Email alerts fire on failed downloads (422/500) → `sheland88@gmail.com`.

> Note: Azure's internal health probes (`GET /` and `GET /robots933456.txt`) return 404 and were spamming the alert. The alert is filtered to fire only on result codes 422 and 500.

---

## Monetization & Legal

| Item | Details |
|------|---------|
| Google AdSense | Publisher ID: ca-pub-2162768168452928 (rejected twice — "low value content") |
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
- **Private videos are not supported by design** — yt-dlp runs unauthenticated server-side, so it cannot access private content regardless of the user's browser login. Users wanting their own private video should temporarily set it to public, download, then set it back.
- Terms of Service, Privacy Policy, and DMCA pages are included at `/terms`, `/privacy`, `/dmca`
- DMCA agent registered for safe harbor protection
- Blog at `/blog` with creator guides