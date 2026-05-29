import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Terms = () => {
  const [lastUpdated] = useState('May 21, 2025');

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="terms-page">
      <div className="terms-container">
        {/* Header */}
        <div className="terms-header">
          <h1>Terms of Service</h1>
          <p className="last-updated">Last Updated: {lastUpdated}</p>
          <p className="intro">
            Welcome to Maylet XLab. By accessing or using our platform, you agree to be bound by these Terms of Service.
            Please read them carefully before using our services.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="toc">
          <h3>Table of Contents</h3>
          <ul>
            <li><a href="#section-1">1. Acceptance of Terms</a></li>
            <li><a href="#section-2">2. Definitions</a></li>
            <li><a href="#section-3">3. Account Registration</a></li>
            <li><a href="#section-4">4. User Obligations</a></li>
            <li><a href="#section-5">5. Intellectual Property</a></li>
            <li><a href="#section-6">6. Innovation Vault & IP Protection</a></li>
            <li><a href="#section-7">7. Funding Hub</a></li>
            <li><a href="#section-8">8. Payments and Subscriptions</a></li>
            <li><a href="#section-9">9. Prohibited Activities</a></li>
            <li><a href="#section-10">10. Termination</a></li>
            <li><a href="#section-11">11. Disclaimer of Warranties</a></li>
            <li><a href="#section-12">12. Limitation of Liability</a></li>
            <li><a href="#section-13">13. Indemnification</a></li>
            <li><a href="#section-14">14. Governing Law</a></li>
            <li><a href="#section-15">15. Changes to Terms</a></li>
            <li><a href="#section-16">16. Contact Information</a></li>
          </ul>
        </div>

        {/* Section 1 */}
        <section id="section-1" className="terms-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By registering for, accessing, or using the Maylet XLab platform (the "Service"), you acknowledge that you have read,
            understood, and agree to be bound by these Terms of Service (the "Terms"). If you do not agree to these Terms,
            you may not access or use the Service.
          </p>
          <p>
            These Terms apply to all users of the Service, including but not limited to innovators, developers, investors,
            mentors, and enterprise customers.
          </p>
        </section>

        {/* Section 2 */}
        <section id="section-2" className="terms-section">
          <h2>2. Definitions</h2>
          <ul>
            <li><strong>"Platform"</strong> means the Maylet XLab website, mobile application, and all associated services.</li>
            <li><strong>"User"</strong> means any individual or entity that accesses or uses the Platform.</li>
            <li><strong>"Content"</strong> means any information, data, text, images, ideas, or materials uploaded or created on the Platform.</li>
            <li><strong>"Innovation Vault"</strong> means the secure storage feature for protecting intellectual property.</li>
            <li><strong>"Funding Hub"</strong> means the feature connecting users with potential investors.</li>
            <li><strong>"We," "us," "our"</strong> refers to Maylet Technology Ltd.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="section-3" className="terms-section">
          <h2>3. Account Registration</h2>
          <p>
            To access certain features of the Platform, you must register for an account. You agree to provide accurate, current,
            and complete information during registration and to update such information to keep it accurate, current, and complete.
          </p>
          <p>
            You are responsible for safeguarding your password and for all activities that occur under your account.
            You agree to notify us immediately of any unauthorized use of your account.
          </p>
          <p>
            You must be at least 13 years of age to create an account. Users between 13 and 18 must have parental consent.
          </p>
        </section>

        {/* Section 4 */}
        <section id="section-4" className="terms-section">
          <h2>4. User Obligations</h2>
          <p>As a user of the Platform, you agree to:</p>
          <ul>
            <li>Comply with all applicable laws and regulations</li>
            <li>Respect the intellectual property rights of others</li>
            <li>Not interfere with or disrupt the Platform's operation</li>
            <li>Not attempt to gain unauthorized access to any part of the Platform</li>
            <li>Not use the Platform to transmit any harmful or malicious code</li>
            <li>Not impersonate any other person or entity</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section id="section-5" className="terms-section">
          <h2>5. Intellectual Property</h2>
          <p>
            Maylet XLab and its licensors own all intellectual property rights in the Platform, including but not limited to
            software, design, text, graphics, logos, and trademarks. You may not copy, modify, distribute, or create derivative
            works based on our intellectual property without our prior written consent.
          </p>
          <p>
            You retain ownership of any ideas, concepts, or content you submit to the Platform. By submitting content,
            you grant us a non-exclusive, worldwide, royalty-free license to host, store, and display your content as necessary
            to provide the Service.
          </p>
        </section>

        {/* Section 6 */}
        <section id="section-6" className="terms-section">
          <h2>6. Innovation Vault & IP Protection</h2>
          <p>
            The Innovation Vault provides cryptographic timestamping and encryption for your ideas. While we implement industry-standard
            security measures, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your
            vault entries.
          </p>
          <p>
            The timestamping feature provides proof of existence at a specific point in time but does not constitute legal
            patent protection or formal intellectual property registration. For legal IP protection, consult with a qualified attorney.
          </p>
          <p>
            We do not claim ownership of any ideas stored in the Innovation Vault. All intellectual property rights remain with you.
          </p>
        </section>

        {/* Section 7 */}
        <section id="section-7" className="terms-section">
          <h2>7. Funding Hub</h2>
          <p>
            The Funding Hub connects users with potential investors. We do not guarantee that you will receive any funding or that
            any investment will be successful. All investment decisions are solely between you and the investor.
          </p>
          <p>
            We may charge a commission on successfully raised funds through the platform. The commission rate will be disclosed
            before any transaction and may be updated from time to time.
          </p>
          <p>
            You are responsible for conducting your own due diligence on any investor. We do not endorse or guarantee any investor
            or investment opportunity.
          </p>
        </section>

        {/* Section 8 */}
        <section id="section-8" className="terms-section">
          <h2>8. Payments and Subscriptions</h2>
          <p>
            Certain features of the Platform require payment of fees. All fees are quoted in US Dollars (USD) unless otherwise specified.
          </p>
          <p>
            Subscriptions automatically renew at the end of each billing period unless canceled. You may cancel your subscription
            at any time through your account settings. Cancellation will take effect at the end of the current billing period.
          </p>
          <p>
            We reserve the right to change our fees at any time. Fee changes will be effective at the start of the next billing
            period following notice to you.
          </p>
          <p>
            All fees are non-refundable except as required by law or as expressly stated in these Terms.
          </p>
        </section>

        {/* Section 9 */}
        <section id="section-9" className="terms-section">
          <h2>9. Prohibited Activities</h2>
          <p>You may not use the Platform to:</p>
          <ul>
            <li>Post or transmit any illegal, harmful, threatening, abusive, or defamatory content</li>
            <li>Infringe upon the intellectual property rights of others</li>
            <li>Engage in fraudulent or deceptive practices</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Upload viruses or malicious code</li>
            <li>Attempt to hack, disrupt, or overload the Platform</li>
            <li>Use automated scripts or bots to interact with the Platform</li>
            <li>Scrape or harvest data without permission</li>
          </ul>
          <p>
            Violation of these prohibitions may result in immediate termination of your account and legal action.
          </p>
        </section>

        {/* Section 10 */}
        <section id="section-10" className="terms-section">
          <h2>10. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever,
            including without limitation if you breach these Terms.
          </p>
          <p>
            Upon termination, your right to use the Platform will cease immediately. You may delete your account at any time
            through your account settings.
          </p>
          <p>
            Sections that by their nature should survive termination shall survive, including but not limited to intellectual
            property ownership, warranty disclaimers, indemnity, and limitations of liability.
          </p>
        </section>

        {/* Section 11 */}
        <section id="section-11" className="terms-section">
          <h2>11. Disclaimer of Warranties</h2>
          <p>
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
            INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
          <p>
            We do not warrant that the Platform will be uninterrupted, error-free, secure, or free from viruses or other harmful components.
            We do not warrant the accuracy, reliability, or completeness of any content on the Platform.
          </p>
        </section>

        {/* Section 12 */}
        <section id="section-12" className="terms-section">
          <h2>12. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL MAYLET XLAB BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE
            LOSSES, RESULTING FROM (I) YOUR USE OR INABILITY TO USE THE PLATFORM; (II) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE PLATFORM;
            (III) ANY CONTENT OBTAINED FROM THE PLATFORM; OR (IV) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
          </p>
          <p>
            OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE
            AMOUNT YOU PAID US, IF ANY, IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE LIABILITY.
          </p>
        </section>

        {/* Section 13 */}
        <section id="section-13" className="terms-section">
          <h2>13. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless Maylet XLab and its officers, directors, employees, and agents from and
            against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not
            limited to attorney's fees) arising from:
          </p>
          <ul>
            <li>Your use of and access to the Platform</li>
            <li>Your violation of any term of these Terms</li>
            <li>Your violation of any third-party right, including without limitation any copyright, property, or privacy right</li>
            <li>Any claim that your content caused damage to a third party</li>
          </ul>
        </section>

        {/* Section 14 */}
        <section id="section-14" className="terms-section">
          <h2>14. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of the United Republic of Tanzania,
            without regard to its conflict of law provisions.
          </p>
          <p>
            Any dispute arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the
            courts located in Dar es Salaam, Tanzania.
          </p>
        </section>

        {/* Section 15 */}
        <section id="section-15" className="terms-section">
          <h2>15. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide
            at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined
            at our sole discretion.
          </p>
          <p>
            By continuing to access or use our Platform after those revisions become effective, you agree to be bound by the revised terms.
            If you do not agree to the new terms, you must stop using the Platform.
          </p>
        </section>

        {/* Section 16 */}
        <section id="section-16" className="terms-section">
          <h2>16. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            <strong>Maylet Technology Ltd.</strong><br />
            Email: legal@mayletxlab.com<br />
            Phone: +255 797567001<br />
            Address: Dar es Salaam, Tanzania
          </p>
        </section>

        {/* Footer */}
        <div className="terms-footer">
          <p>
            By using Maylet XLab, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
          <div className="terms-actions">
            <Link to="/register" className="btn-primary">Accept & Continue</Link>
            <Link to="/" className="btn-outline">Return to Home</Link>
          </div>
          <p className="copyright">
            © 2025 Maylet Technology Ltd. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        .terms-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          font-family: 'Inter', sans-serif;
          padding: 2rem;
        }
        .terms-container {
          max-width: 1000px;
          margin: 0 auto;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 32px;
          padding: 3rem;
        }
        .terms-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .terms-header h1 {
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
        .terms-section {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .terms-section h2 {
          font-size: 1.3rem;
          margin-bottom: 1rem;
          color: #9b7ff0;
        }
        .terms-section p {
          color: rgba(255,255,255,0.8);
          line-height: 1.7;
          margin-bottom: 1rem;
        }
        .terms-section ul {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        .terms-section li {
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
          margin-bottom: 0.5rem;
        }
        .terms-footer {
          text-align: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .terms-footer p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 1.5rem;
        }
        .terms-actions {
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
          .terms-container {
            padding: 1.5rem;
          }
          .toc ul {
            grid-template-columns: 1fr;
          }
          .terms-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Terms;