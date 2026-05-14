import { Link } from 'react-router-dom'
import './LegalPage.css'

export default function Privacy() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="back-link">← Back to ClearTok</Link>
      </header>
      <div className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="legal-date">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2>1. Information We Collect</h2>
        <p>ClearTok collects minimal information to operate the service:</p>
        <ul>
          <li><strong>URLs you submit:</strong> TikTok video URLs are processed temporarily to facilitate downloads. They are not stored after your request is completed.</li>
          <li><strong>IP addresses:</strong> Collected temporarily for rate limiting purposes (to prevent abuse) and standard server logging. Not stored long-term or shared.</li>
          <li><strong>Usage data:</strong> Basic analytics (page views, download counts) may be collected in aggregate, non-identifiable form.</li>
        </ul>

        <h2>2. Cookies and Advertising</h2>
        <p>ClearTok uses Google AdSense to display advertisements. Google may use cookies to serve ads based on your prior visits to this or other websites. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google's Ads Settings</a>.</p>
        <p>We do not sell your personal information to any third parties.</p>

        <h2>3. Video Data</h2>
        <p>Videos downloaded through ClearTok are processed in memory or temporary storage and are deleted immediately after being delivered to you. We do not retain, analyze, or distribute your video content.</p>

        <h2>4. Third-Party Services</h2>
        <p>We use the following third-party services that may collect data per their own privacy policies:</p>
        <ul>
          <li>Google AdSense (advertising)</li>
          <li>Microsoft Azure (hosting infrastructure)</li>
        </ul>

        <h2>5. Children's Privacy</h2>
        <p>ClearTok is not directed at children under 13. We do not knowingly collect personal information from children.</p>

        <h2>6. Changes to This Policy</h2>
        <p>We may update this policy periodically. We will notify users of significant changes by updating the date at the top of this page.</p>

        <h2>7. Contact</h2>
        <p>For privacy concerns, contact us at: <a href="mailto:privacy@cleartok.app">privacy@cleartok.app</a></p>
      </div>
    </div>
  )
}
