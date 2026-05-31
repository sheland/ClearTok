import { useState } from 'react'
import { Link } from 'react-router-dom'

import { FAQ_ITEMS_FULL as FAQ_ITEMS } from '../data/faqData'

// ─── FAQ Item Component ───────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item ${open ? 'faq-open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{q}</span>
        <svg
          className="faq-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  )
}

// ─── FAQ Page ─────────────────────────────────────────────────────────────────
export default function FAQ() {
  return (
    <div className="page legal-page">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="header">
        <div className="logo">
          <Link to="/">
            <img src="/logo-dark.svg" alt="ClearTok" height="36" />
          </Link>
        </div>
        <nav className="nav">
          <Link to="/faq">FAQ</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/dmca">DMCA</Link>
        </nav>
      </header>

      {/* ── Content ────────────────────────────────────────────────── */}
      <main className="legal-content">
        <h1>Frequently asked questions</h1>
        <p className="legal-intro">Everything you need to know about ClearTok.</p>

        {FAQ_ITEMS.map(category => (
          <div key={category.category} className="faq-category">
            <h2 className="faq-category-heading">{category.category}</h2>
            <div className="faq-list">
              {category.questions.map(item => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}

        <div className="faq-contact">
          <p>Still have questions? Download not working? <a href="mailto:hello@getcleartok.com">Email us</a>.</p>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="footer">
        <p className="footer-legal">
          ClearTok is intended for downloading your own TikTok content only. By using this tool you agree to our{' '}
          <Link to="/terms">Terms of Service</Link>. Please respect creator rights.
        </p>
        <div className="footer-links">
          <Link to="/faq">FAQ</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/dmca">DMCA</Link>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} ClearTok</p>
      </footer>

    </div>
  )
}