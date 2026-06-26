import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const Privacy = () => {
  const lastUpdated = 'May 21, 2025';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="privacy-page">
      <div className="privacy-container">
        {/* Header */}
        <div className="privacy-header">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: {lastUpdated}</p>
          <p className="intro">
            At Maylet XLab, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our platform. Please read this privacy policy carefully.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="toc">
          <h3>Table of Contents</h3>
          <ul>
            <li><a href="#section-1">1. Information We Collect</a></li>
            <li><a href="#section-2">2. How We Use Your Information</a></li>
            <li><a href="#section-3">3. Sharing Your Information</a></li>
            <li><a href="#section-4">4. Data Security</a></li>
            <li><a href="#section-5">5. Your Privacy Rights</a></li>
            <li><a href="#section-6">6. Cookies and Tracking Technologies</a></li>
            <li><a href="#section-7">7. Third-Party Services</a></li>
            <li><a href="#section-8">8. International Data Transfers</a></li>
            <li><a href="#section-9">9. Data Retention</a></li>
            <li><a href="#section-10">10. Children's Privacy</a></li>
            <li><a href="#section-11">11. Changes to This Privacy Policy</a></li>
            <li><a href="#section-12">12. Contact Information</a></li>
          </ul>
        </div>

        {/* Section 1 */}
        <section id="section-1" className="privacy-section">
          <h2>1. Information We Collect</h2>
          <p>We collect information that you provide directly to us when using Maylet XLab:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, password, profile picture, and account preferences.</li>
            <li><strong>Profile Information:</strong> Bio, location, organization name, skills, and social media links.</li>
            <li><strong>Project Data:</strong> Ideas, project descriptions, prototypes, experiments, and team collaborations.</li>
            <li><strong>Innovation Vault Content:</strong> Encrypted ideas and intellectual property you choose to store.</li>
            <li><strong>Funding Information:</strong> Pitch decks, investment requests, and investor communications.</li>
            <li><strong>Payment Information:</strong> Billing details, subscription information, and transaction history.</li>
            <li><strong>Usage Data:</strong> Information about how you use our platform, including log files, device information, and IP addresses.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section id="section-2" className="privacy-section">
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect for various purposes:</p>
          <ul>
            <li>To provide, operate, and maintain our platform</li>
            <li>To process your transactions and manage your subscription</li>
            <li>To send you technical notices, updates, security alerts, and support messages</li>
            <li>To respond to your comments, questions, and customer service requests</li>
            <li>To develop new features and improve our services</li>
            <li>To monitor and analyze usage patterns and trends</li>
            <li>To detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="section-3" className="privacy-section">
          <h2>3. Sharing Your Information</h2>
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li><strong>With Your Consent:</strong> We may share your information when you give us explicit permission.</li>
            <li><strong>Team Collaboration:</strong> When you join a team, your profile information becomes visible to other team members.</li>
            <li><strong>Funding Hub:</strong> When you submit a funding pitch, your pitch becomes visible to potential investors.</li>
            <li><strong>Service Providers:</strong> We may share your information with third-party vendors who perform services on our behalf.</li>
            <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred.</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </section>

        {/* Section 4 */}
        <section id="section-4" className="privacy-section">
          <h2>4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against
            accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access.
          </p>
          <ul>
            <li><strong>Encryption:</strong> We use AES-256 encryption for sensitive data stored in the Innovation Vault.</li>
            <li><strong>Secure Transmission:</strong> All data transmitted between your browser and our servers is encrypted using TLS (HTTPS).</li>
            <li><strong>Access Controls:</strong> We restrict access to personal information to employees who need it to perform their job functions.</li>
            <li><strong>Regular Audits:</strong> We conduct regular security audits and vulnerability assessments.</li>
          </ul>
          <p>
            However, no method of transmission over the Internet or method of electronic storage is 100% secure.
            While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
          </p>
        </section>

        {/* Section 5 */}
        <section id="section-5" className="privacy-section">
          <h2>5. Your Privacy Rights</h2>
          <p>Depending on your location, you may have the following rights regarding your personal information:</p>
          <ul>
            <li><strong>Right to Access:</strong> You can request a copy of the personal information we hold about you.</li>
            <li><strong>Right to Rectification:</strong> You can request that we correct inaccurate or incomplete information.</li>
            <li><strong>Right to Erasure:</strong> You can request that we delete your personal information in certain circumstances.</li>
            <li><strong>Right to Restrict Processing:</strong> You can request that we restrict processing of your personal information.</li>
            <li><strong>Right to Data Portability:</strong> You can request a copy of your data in a structured, machine-readable format.</li>
            <li><strong>Right to Object:</strong> You can object to our processing of your personal information.</li>
            <li><strong>Right to Withdraw Consent:</strong> You can withdraw your consent at any time.</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at <a href="mailto:privacy@mayletxlab.com">privacy@mayletxlab.com</a>.
            We will respond to your request within 30 days.
          </p>
        </section>

        {/* Section 6 */}
        <section id="section-6" className="privacy-section">
          <h2>6. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our platform and hold certain information.
            Cookies are files with a small amount of data that are stored on your device.
          </p>
          <p>We use the following types of cookies:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Necessary for the platform to function properly (authentication, security).</li>
            <li><strong>Preference Cookies:</strong> Remember your preferences and settings.</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform.</li>
            <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser.</li>
          </ul>
          <p>
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            However, if you do not accept cookies, you may not be able to use some portions of our platform.
          </p>
        </section>

        {/* Section 7 */}
        <section id="section-7" className="privacy-section">
          <h2>7. Third-Party Services</h2>
          <p>We may use third-party services to help us operate our platform:</p>
          <ul>
            <li><strong>Supabase:</strong> For database and authentication services.</li>
            <li><strong>Stripe / PayPal:</strong> For payment processing.</li>
            <li><strong>OpenAI / Gemini:</strong> For AI-powered idea validation.</li>
            <li><strong>Vercel:</strong> For hosting and deployment.</li>
            <li><strong>Google Analytics:</strong> For usage analytics (you can opt-out).</li>
          </ul>
          <p>
            These third-party services have their own privacy policies, and we encourage you to review them.
            We are not responsible for the privacy practices of these third-party services.
          </p>
        </section>

        {/* Section 8 */}
        <section id="section-8" className="privacy-section">
          <h2>8. International Data Transfers</h2>
          <p>
            Maylet XLab is based in Tanzania, but we may transfer your data to servers located in other countries
            (including the United States and European Union) to provide our services. By using our platform,
            you consent to the transfer of your information to countries with different data protection laws.
          </p>
          <p>
            We take appropriate safeguards to ensure that your data is protected in accordance with this Privacy Policy,
            including using standard contractual clauses approved by the European Commission.
          </p>
        </section>

        {/* Section 9 */}
        <section id="section-9" className="privacy-section">
          <h2>9. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide you with services.
            We may also retain and use your information as necessary to comply with our legal obligations, resolve disputes,
            and enforce our agreements.
          </p>
          <ul>
            <li><strong>Account Data:</strong> Retained until you delete your account.</li>
            <li><strong>Project Data:</strong> Retained until you delete your projects or account.</li>
            <li><strong>Innovation Vault:</strong> Retained until you delete your vault entries or account.</li>
            <li><strong>Transaction Records:</strong> Retained for 7 years for tax and legal purposes.</li>
            <li><strong>Log Data:</strong> Retained for up to 12 months.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section id="section-10" className="privacy-section">
          <h2>10. Children's Privacy</h2>
          <p>
            Our platform is not directed to children under the age of 13. We do not knowingly collect personal information
            from children under 13. If you are a parent or guardian and you are aware that your child has provided us with
            personal information, please contact us. If we become aware that we have collected personal information from
            a child under age 13 without verification of parental consent, we will take steps to remove that information.
          </p>
          <p>
            Users between the ages of 13 and 18 must have parental consent to use our platform.
          </p>
        </section>

        {/* Section 11 */}
        <section id="section-11" className="privacy-section">
          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page and updating the "Last Updated" date at the top.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy
            are effective when they are posted on this page. For material changes, we will provide additional notice
            (such as an email notification).
          </p>
        </section>

        {/* Section 12 */}
        <section id="section-12" className="privacy-section">
          <h2>12. Contact Information</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p>
            <strong>Maylet Technology Ltd.</strong><br />
            Email: <a href="mailto:privacy@mayletxlab.com">privacy@mayletxlab.com</a><br />
            Phone: +255 757 938 827<br />
            Address: Arusha, Tanzania
          </p>
          <p>
            For data protection inquiries, you may also contact our Data Protection Officer at <a href="mailto:dpo@mayletxlab.com">dpo@mayletxlab.com</a>.
          </p>
        </section>

        {/* Footer */}
        <div className="privacy-footer">
          <p>
            By using Maylet XLab, you acknowledge that you have read, understood, and agree to this Privacy Policy.
          </p>
          <div className="privacy-actions">
            <Link to="/register" className="btn-primary">Accept & Continue</Link>
            <Link to="/" className="btn-outline">Return to Home</Link>
          </div>
          <p className="copyright">
            © 2025 Maylet Technology Ltd. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        .privacy-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          font-family: 'Inter', sans-serif;
          padding: 2rem;
        }
        .privacy-container {
          max-width: 1000px;
          margin: 0 auto;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 32px;
          padding: 3rem;
        }
        .privacy-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .privacy-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .last-updated {
          color: rgba(255,255,255,0.5);
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }
        .intro {
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
          max-width: 700px;
          margin: 0 auto;
        }
        .toc {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .toc h3 {
          margin-bottom: 1rem;
          color: #9b7ff0;
        }
        .toc ul {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          list-style: none;
          padding: 0;
        }
        .toc li a {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.2s;
        }
        .toc li a:hover {
          color: #9b7ff0;
        }
        .privacy-section {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .privacy-section h2 {
          font-size: 1.3rem;
          margin-bottom: 1rem;
          color: #9b7ff0;
        }
        .privacy-section p {
          color: rgba(255,255,255,0.8);
          line-height: 1.7;
          margin-bottom: 1rem;
        }
        .privacy-section ul {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        .privacy-section li {
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
          margin-bottom: 0.5rem;
        }
        .privacy-section a {
          color: #9b7ff0;
          text-decoration: none;
        }
        .privacy-section a:hover {
          text-decoration: underline;
        }
        .privacy-footer {
          text-align: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .privacy-footer p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 1.5rem;
        }
        .privacy-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          padding: 0.8rem 1.8rem;
          border-radius: 40px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124,95,230,0.3);
        }
        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.8rem 1.8rem;
          border-radius: 40px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-outline:hover {
          border-color: #7c5fe6;
          background: rgba(124,95,230,0.1);
        }
        .copyright {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
        }
        @media (max-width: 768px) {
          .privacy-container {
            padding: 1.5rem;
          }
          .toc ul {
            grid-template-columns: 1fr;
          }
          .privacy-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Privacy;