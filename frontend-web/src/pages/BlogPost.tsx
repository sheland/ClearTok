import { Link, useParams, Navigate } from 'react-router-dom'
import { BLOG_POSTS } from '../data/blogData'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = BLOG_POSTS.find(p => p.slug === slug)

  if (!post) return <Navigate to="/blog" replace />

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
      <main className="legal-content blog-post">

        {/* Back link */}
        <Link to="/blog" className="blog-back">← Back to Creator Resources</Link>

        {/* Article header */}
        <div className="blog-post-header">
          <div className="blog-card-meta">
            <span className="blog-card-date">{post.date}</span>
            <span className="blog-card-dot">·</span>
            <span className="blog-card-read">{post.readTime}</span>
            <span className="blog-card-dot">·</span>
            <span className="blog-card-date">{post.author}</span>
          </div>
          <h1>{post.title}</h1>
          <p className="blog-post-desc">{post.description}</p>
        </div>

        {/* Article body */}
        <div className="blog-post-body">
          {post.content.map((section, i) => {
            if (section.type === 'paragraph') {
              return <p key={i} className="blog-p">{section.text}</p>
            }
            if (section.type === 'heading') {
              return <h2 key={i} className="blog-h2">{section.text}</h2>
            }
            if (section.type === 'subheading') {
              return <h3 key={i} className="blog-h3">{section.text}</h3>
            }
            if (section.type === 'list') {
              return (
                <ul key={i} className="blog-list">
                  {section.items?.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )
            }
            if (section.type === 'tip') {
              return (
                <div key={i} className="blog-tip">
                  <span className="blog-tip-label">Tip</span>
                  <p>{section.text}</p>
                </div>
              )
            }
            if (section.type === 'cta') {
              return (
                <div key={i} className="blog-cta">
                  <p>{section.text}</p>
                  <Link to="/" className="btn-primary blog-cta-btn">
                    Download a Video Free →
                  </Link>
                </div>
              )
            }
            return null
          })}
        </div>

        {/* More articles */}
        <div className="blog-more">
          <h2>More from ClearTok</h2>
          <div className="blog-list">
            {BLOG_POSTS.filter(p => p.slug !== slug).map(p => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="blog-card">
                <div className="blog-card-meta">
                  <span className="blog-card-date">{p.date}</span>
                  <span className="blog-card-dot">·</span>
                  <span className="blog-card-read">{p.readTime}</span>
                </div>
                <h2 className="blog-card-title">{p.title}</h2>
                <p className="blog-card-desc">{p.description}</p>
                <span className="blog-card-link">Read article →</span>
              </Link>
            ))}
          </div>
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