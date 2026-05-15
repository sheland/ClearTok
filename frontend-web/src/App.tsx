import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDownload } from './hooks/useDownload'
import AdSlot from './components/AdSlot'
import './App.css'
 
export default function App() {
  const [url, setUrl] = useState('')
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { status, errorMessage, handleDownload, reset } = useDownload()
 
  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const isError = status === 'error'
 
  // ── Progress bar simulation ────────────────────────────────────────────────
  // We can't know the real download % so we simulate it.
  // It fills quickly to 80% then slows down and waits for the real response.
  // When success fires, we jump to 100% then hide it.
  useEffect(() => {
    if (isLoading) {
      setProgress(0)
      let current = 0
 
      progressRef.current = setInterval(() => {
        current += current < 50 ? 3 : current < 75 ? 1.5 : current < 85 ? 0.5 : 0.1
        if (current >= 88) current = 88 // pause near end, wait for real response
        setProgress(current)
      }, 200)
    }
 
    if (isSuccess) {
      // Jump to 100% on success
      if (progressRef.current) clearInterval(progressRef.current)
      setProgress(100)
      // Fade out after a moment
      setTimeout(() => setProgress(0), 1000)
    }
 
    if (isError || status === 'idle') {
      if (progressRef.current) clearInterval(progressRef.current)
      setProgress(0)
    }
 
    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [status, isLoading, isSuccess, isError])
 
  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || isLoading) return
    handleDownload(url.trim())
  }
 
  function onReset() {
    setUrl('')
    reset()
    inputRef.current?.focus()
  }
 
  return (
    <div className="page">
 
      {/* ── Top Ad ─────────────────────────────────────────────────── */}
      <div className="ad-top">
        <AdSlot slot="1234567890" format="leaderboard" />
      </div>
 
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="header">
        <div className="logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="var(--accent)" fillOpacity="0.15"/>
            <path d="M8 14.5C8 11 10.5 8 14 8C16.5 8 18.5 9.5 19.5 11.5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M20 13.5C20 17 17.5 20 14 20C11.5 20 9.5 18.5 8.5 16.5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="20" cy="11" r="2" fill="var(--accent)"/>
            <circle cx="8" cy="17" r="2" fill="var(--accent)"/>
          </svg>
          <span className="logo-text">ClearTok</span>
        </div>
        <nav className="nav">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/dmca">DMCA</Link>
        </nav>
      </header>
 
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <main className="hero">
 
        <div className="glow glow-1" />
        <div className="glow glow-2" />
 
        <div className="hero-content">
 
          <div className="badge">
            <span className="badge-dot" />
            Free for creators
          </div>
 
          <h1 className="headline">
            Your TikToks,<br />
            <span className="headline-accent">watermark-free.</span>
          </h1>
 
          <p className="subheadline">
            Paste your TikTok link below and download your own video in seconds — clean, HD, ready to share anywhere.
          </p>
 
          {/* ── Main Input Card ─────────────────────────────────────── */}
          <div className="card">
 
            {isSuccess ? (
              // ── Success State ────────────────────────────────────────
              <div className="success-state">
                <div className="success-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="24" fill="var(--accent)" fillOpacity="0.15"/>
                    <path d="M13 24.5L20 31.5L35 16" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="success-text">Your video is downloading!</p>
                <p className="success-sub">Check your Downloads folder — your watermark-free video is there.</p>
                <button className="btn-secondary" onClick={onReset}>
                  Download another video
                </button>
              </div>
            ) : (
              // ── Download Form ────────────────────────────────────────
              <form onSubmit={onSubmit} className="download-form">
 
                <div className={`input-wrap ${isError ? 'input-error' : ''} ${isLoading ? 'input-loading' : ''}`}>
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 9H15M15 9L10 4M15 9L10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input
                    ref={inputRef}
                    type="url"
                    className="url-input"
                    placeholder="Paste your TikTok link here..."
                    value={url}
                    onChange={e => { setUrl(e.target.value); if (isError) reset() }}
                    disabled={isLoading}
                    autoFocus
                    aria-label="TikTok video URL"
                  />
                  {url && !isLoading && (
                    <button type="button" className="clear-btn" onClick={() => { setUrl(''); reset() }} aria-label="Clear">
                      ×
                    </button>
                  )}
                </div>
 
                {/* ── Progress Bar ───────────────────────────────────── */}
                {isLoading && (
                  <div className="progress-wrap">
                    <div
                      className="progress-bar"
                      style={{ width: `${progress}%` }}
                    />
                    <p className="progress-label">
                      {progress < 30
                        ? 'Connecting to TikTok...'
                        : progress < 60
                        ? 'Downloading your video...'
                        : progress < 85
                        ? 'Almost there...'
                        : 'Finishing up...'}
                    </p>
                  </div>
                )}
 
                {isError && (
                  <p className="error-msg" role="alert">{errorMessage}</p>
                )}
 
                <button
                  type="submit"
                  className={`btn-primary ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading || !url.trim()}
                >
                  {isLoading ? (
                    <span className="btn-loading-content">
                      <span className="spinner" />
                      Downloading...
                    </span>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M9 3V12M9 12L5 8M9 12L13 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Download Video
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
 
          {/* ── Steps ──────────────────────────────────────────────── */}
          {!isLoading && !isSuccess && (
            <div className="steps">
              {[
                { n: '1', label: 'Copy your TikTok link' },
                { n: '2', label: 'Paste it above' },
                { n: '3', label: 'Click download — done' },
              ].map(step => (
                <div key={step.n} className="step">
                  <span className="step-num">{step.n}</span>
                  <span className="step-label">{step.label}</span>
                </div>
              ))}
            </div>
          )}
 
        </div>
      </main>
 
      {/* ── Mid Ad ─────────────────────────────────────────────────── */}
      <div className="ad-mid">
        <AdSlot slot="0987654321" format="rectangle" />
      </div>
 
      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="features">
        {[
          { icon: '⚡', title: 'Instant', desc: 'Download in seconds, no waiting.' },
          { icon: '🎯', title: 'HD Quality', desc: 'Original resolution preserved.' },
          { icon: '🔒', title: 'Private', desc: "We don't store your videos." },
          { icon: '✦', title: 'Free', desc: 'No account needed, ever.' },
        ].map(f => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <strong className="feature-title">{f.title}</strong>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>
 
      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="footer">
        <p className="footer-legal">
          ClearTok is intended for downloading your own TikTok content only. By using this tool you agree to our{' '}
          <Link to="/terms">Terms of Service</Link>. Please respect creator rights.
        </p>
        <div className="footer-links">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/dmca">DMCA</Link>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} ClearTok</p>
      </footer>
 
    </div>
  )
}
