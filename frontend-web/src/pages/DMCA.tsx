import { Link } from 'react-router-dom'
import './LegalPage.css'

export default function DMCA() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="back-link">← Back to ClearTok</Link>
      </header>
      <div className="legal-content">
        <h1>DMCA Policy</h1>
        <p className="legal-date">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2>Our Commitment</h2>
        <p>ClearTok respects the intellectual property rights of others and expects users of our service to do the same. ClearTok is designed solely for creators to download their own content.</p>

        <h2>Reporting Copyright Infringement</h2>
        <p>If you believe that your copyrighted work has been used through our service in a way that constitutes copyright infringement, please send a written notice to our designated DMCA agent containing the following information:</p>
        <ul>
          <li>A physical or electronic signature of the copyright owner or authorized agent</li>
          <li>Identification of the copyrighted work claimed to have been infringed</li>
          <li>Description of the infringing material and information reasonably sufficient to locate it</li>
          <li>Your contact information (address, telephone number, email)</li>
          <li>A statement that you have a good faith belief that the disputed use is not authorized</li>
          <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are the copyright owner or authorized to act on their behalf</li>
        </ul>

        <h2>DMCA Agent Contact</h2>
        <p>
          <strong>Email:</strong> <a href="mailto:dmca@cleartok.app">dmca@cleartok.app</a><br />
          <strong>Subject line:</strong> DMCA Takedown Notice
        </p>
        <p>We will respond to valid DMCA notices promptly in accordance with applicable law.</p>

        <h2>Counter-Notification</h2>
        <p>If you believe your content was removed in error, you may submit a counter-notification to the address above. Counter-notifications must comply with the DMCA's requirements under 17 U.S.C. § 512(g)(3).</p>

        <h2>Repeat Infringers</h2>
        <p>ClearTok reserves the right to terminate service to users who are repeat infringers of copyright.</p>
      </div>
    </div>
  )
}
