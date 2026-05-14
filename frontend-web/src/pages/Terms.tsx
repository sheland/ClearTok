import { Link } from 'react-router-dom'
import './LegalPage.css'

export default function Terms() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="back-link">← Back to ClearTok</Link>
      </header>
      <div className="legal-content">
        <h1>Terms of Service</h1>
        <p className="legal-date">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2>1. Intended Use</h2>
        <p>ClearTok is a tool designed exclusively for content creators to download their own TikTok videos without a watermark. By using ClearTok, you confirm that you are the original creator and copyright owner of any video you download through this service.</p>

        <h2>2. Prohibited Uses</h2>
        <p>You may not use ClearTok to:</p>
        <ul>
          <li>Download videos you did not create or do not own</li>
          <li>Infringe on the intellectual property rights of others</li>
          <li>Repost or redistribute content belonging to other creators without their explicit permission</li>
          <li>Use downloaded content for commercial purposes without appropriate rights</li>
          <li>Circumvent or interfere with TikTok's platform in a manner that violates their terms of service</li>
        </ul>

        <h2>3. No Warranty</h2>
        <p>ClearTok is provided "as is" without warranty of any kind. We do not guarantee uninterrupted availability, and functionality may change as third-party platforms update their services.</p>

        <h2>4. Limitation of Liability</h2>
        <p>ClearTok and its operators shall not be liable for any damages arising from your use of this service, including but not limited to copyright claims resulting from misuse of downloaded content.</p>

        <h2>5. Changes</h2>
        <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>

        <h2>6. Contact</h2>
        <p>For questions about these terms, contact us at: <a href="mailto:legal@cleartok.app">legal@cleartok.app</a></p>
      </div>
    </div>
  )
}
