import { Link } from 'react-router-dom'
import { BLOG_POSTS } from '../data/blogData'

export default function Blog() {
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
          <Link to="/blog">Blog</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/dmca">DMCA</Link>
        </nav>
      </header>

      {/* ── Content ────────────────────────────────────────────────── */}
      <main className="legal-content">
        <h1>Creator Resources</h1>
        <p className="legal-intro">
          Guides and tips for social media creators who want to get the most out of their content.
        </p>

        <div className="blog-list">
          {BLOG_POSTS.map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="blog-card">
              <div className="blog-card-meta">
                <span className="blog-card-date">{post.date}</span>
                <span className="blog-card-dot">·</span>
                <span className="blog-card-read">{post.readTime}</span>
              </div>
              <h2 className="blog-card-title">{post.title}</h2>
              <p className="blog-card-desc">{post.description}</p>
              <span className="blog-card-link">Read article →</span>
            </Link>
          ))}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="footer">
        <p className="footer-legal">
          ClearTok is intended for downloading your own TikTok content only. By using this tool you agree to our{' '}
          <Link to="/terms">Terms of Service</Link>. Please respect creator rights.
        </p>
        <div className="footer-links">
          <Link to="/blog">Blog</Link>
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