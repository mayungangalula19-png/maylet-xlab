import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <h1>Contact Us</h1>
        <p>Have questions? We'd love to hear from you.</p>
      </div>
      <div className="contact-container">
        <div className="contact-form">
          <h2>Send us a message</h2>
          {submitted && <div className="success-message">Message sent successfully!</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input type="text" placeholder="Your Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <input type="email" placeholder="Your Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <input type="text" placeholder="Subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
            <textarea rows={5} placeholder="Your Message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
            <button type="submit" className="btn-primary">Send Message →</button>
          </form>
        </div>
        <div className="contact-info">
          <h3>Other ways to reach us</h3>
          <div className="info-item">📧 support@mayletxlab.com</div>
          <div className="info-item">📞 +255 757 938 827</div>
          <div className="info-item">📍 Arusha, Tanzania</div>
        </div>
      </div>
      <style>{`
        .contact-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          padding: 2rem;
        }
        .contact-hero {
          text-align: center;
          padding: 2rem;
        }
        .contact-hero h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        .contact-container {
          max-width: 900px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        .contact-form, .contact-info {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 1.5rem;
        }
        .contact-form input, .contact-form textarea {
          width: 100%;
          padding: 0.6rem;
          margin-bottom: 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }
        .success-message {
          background: rgba(72,187,120,0.1);
          border: 1px solid #48bb78;
          color: #48bb78;
          padding: 0.5rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .info-item {
          padding: 0.5rem 0;
          color: rgba(255,255,255,0.8);
        }
        @media (max-width: 768px) {
          .contact-container {
            grid-template-columns: 1fr;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Contact;