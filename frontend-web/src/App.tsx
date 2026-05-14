import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDownload } from './hooks/useDownload'
import AdSlot from './components/AdSlot'
import './App.css'

export default function App() {
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { status, errorMessage, handleDownload, reset } = useDownload()

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const isError = status === 'error'

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || isLoading) return
    handleDownload(url.trim())
  }

  function onPaste() {
    // Small UX touch: auto-submit if user pastes a URL
    setTimeout(() => {
      const val = inputRef.current?.value ?? ''
      if (val.includes('tiktok.com')) {
        handleDownload(val.trim())
      }
    }, 100)
  }

  function onReset() {
    setUrl('')
    reset()
    inputRef.current?.focus()
  }

  return (
    <div className="page">

      {/* ── Top Ad (leaderboard) ─────────────────────────────────── */}
      <div className="ad-top">
        <AdSlot slot="1234567890" format="leaderboard" />
      </div>

      {/* ── Header ──────────────────────────────────────────────── */}
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

      {/* ── Hero ────────────────────────────────────────────────── */}
      <main className="hero">

        {/* Background glow orbs */}
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

          {/* ── Main Input Card ──────────────────────────────────── */}
          <div className="card">

            {isSuccess ? (
              <div className="success-state">
                <div className="success-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="16" fill="var(--accent)" fillOpacity="0.15"/>
                    <path d="M9 16.5L13.5 21L23 11" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="success-text">Your video is downloading!</p>
                <p className="success-sub">Find it in your Downloads folder.</p>
                <button className="btn-secondary" onClick={onReset}>
                  Download another
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="download-form">
                <div className={`input-wrap ${isError ? 'input-error' : ''}`}>
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
                    onPaste={onPaste}
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

          {/* ── How it works ─────────────────────────────────────── */}
          <div className="steps">
            {[
              { n: '1', label: 'Copy your TikTok link' },
              { n: '2', label: 'Paste it above' },
              { n: '3', label: 'Hit download — done' },
            ].map(step => (
              <div key={step.n} className="step">
                <span className="step-num">{step.n}</span>
                <span className="step-label">{step.label}</span>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* ── Mid-page Ad ──────────────────────────────────────────── */}
      <div className="ad-mid">
        <AdSlot slot="0987654321" format="rectangle" />
      </div>

      {/* ── Features strip ───────────────────────────────────────── */}
      <section className="features">
        {[
          { icon: '⚡', title: 'Instant', desc: 'Download in seconds, no waiting.' },
          { icon: '🎯', title: 'HD Quality', desc: 'Original resolution preserved.' },
          { icon: '🔒', title: 'Private', desc: 'We don\'t store your videos.' },
          { icon: '✦', title: 'Free', desc: 'No account needed, ever.' },
        ].map(f => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <strong className="feature-title">{f.title}</strong>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
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
