# ClearTok

> Download your own TikTok videos, watermark-free.

---

## Project Structure

```
ClearTok/
├── backend/ClearTok.API/     .NET 8 Web API
├── frontend-web/             React + TypeScript + Vite
└── infrastructure/           Azure deployment configs
```

---

## Prerequisites

Install these before running the project:

| Tool | Version | Install |
|------|---------|---------|
| .NET SDK | 8.0+ | https://dot.net |
| Node.js | 18+ | https://nodejs.org |
| yt-dlp | latest | `pip install yt-dlp` |
| Python | 3.8+ | https://python.org (required for yt-dlp) |

---

## Local Development Setup

### 1. Install yt-dlp

```bash
pip install yt-dlp

# Verify it works:
yt-dlp --version
```

### 2. Start the Backend (.NET API)

```bash
cd backend/ClearTok.API
dotnet restore
dotnet run
```

The API will be available at: `http://localhost:5000`

Test the health check: `http://localhost:5000/api/video/health`

### 3. Start the Frontend (React)

```bash
cd frontend-web
npm install
npm run dev
```

The app will be available at: `http://localhost:5173`

---

## How It Works

```
User pastes TikTok URL
        ↓
React validates URL format
        ↓
POST /api/video/download
        ↓
.NET rate-limits by IP (10/hour)
        ↓
YtDlpService shells out to yt-dlp CLI
        ↓
yt-dlp fetches unwatermarked video from TikTok CDN
        ↓
.NET streams video as file download
        ↓
Browser saves the .mp4 file
```

---

## Azure Deployment

### Backend — Azure App Service (B1)

```bash
# From the backend directory:
dotnet publish -c Release -o ./publish

# Deploy via Azure CLI:
az webapp deploy \
  --resource-group cleartok-rg \
  --name cleartok-api \
  --src-path ./publish \
  --type zip
```

**Important:** After deploying, install yt-dlp on the App Service:

```bash
# SSH into your App Service via Azure Portal > SSH console:
pip install yt-dlp
```

### Frontend — Azure Static Web Apps (Free tier)

```bash
cd frontend-web
npm run build
# Then deploy the /dist folder via Azure Portal or GitHub Actions
```

---

## Activating Google AdSense

1. Go to https://adsense.google.com and create an account
2. Add your site URL (e.g. https://cleartok.app)
3. Paste the AdSense script tag into `index.html` (replace the commented-out line)
4. Replace `ca-pub-XXXXXXXXXXXXXXXX` with your real publisher ID in:
   - `index.html` (script tag)
   - `src/components/AdSlot.tsx` (data-ad-client attribute)
5. Replace ad slot IDs (`1234567890`, `0987654321`) with real slot IDs from your AdSense dashboard
6. Wait for Google to review your site (usually 1–14 days)

**Note:** AdSense requires your Privacy Policy page to be live before approval.

---

## Registering Your DMCA Agent (~6 minutes, ~$6)

This is required for DMCA safe harbor protection under US law:

1. Go to https://www.copyright.gov/dmca-directory/
2. Click "Register a New Service Provider"
3. Fill in your site name (ClearTok) and contact info
4. Pay the $6 fee
5. Update the DMCA contact email in `src/pages/DMCA.tsx`

---

## Rate Limiting

Current limits (configurable in `Program.cs`):
- **10 downloads per IP per hour** on the free tier
- Returns HTTP 429 with a user-friendly error message

To increase limits when you upgrade from free tier, change `PermitLimit` in `Program.cs`.

---

## Environment Variables

### Backend (`appsettings.json`)

| Key | Default | Description |
|-----|---------|-------------|
| `YtDlp:ExecutablePath` | `yt-dlp` | Path to yt-dlp binary |
| `Storage:TempDirectory` | `/tmp/cleartok` | Where temp video files are stored |

### Frontend (`.env.local`)

```env
VITE_API_URL=http://localhost:5000/api   # Dev
VITE_API_URL=https://your-api.azurewebsites.net/api   # Production
```

---

## Scalability Roadmap

The codebase is structured for these future additions:

| Feature | Where to add |
|---------|-------------|
| User accounts | Wire up auth middleware stub in `Program.cs` |
| Download history | Add database in `VideoDownloadService.cs` |
| Premium tier | Increase rate limits for authenticated users |
| React Native app | `frontend-mobile/` uses same `useDownload` hook logic |

---

## Legal Notes

- This tool is intended for creators downloading their **own** content
- Terms of Service, Privacy Policy, and DMCA pages are included
- Register a DMCA agent for safe harbor protection (see above)
- Update all contact emails (`legal@cleartok.app` etc.) to real addresses
