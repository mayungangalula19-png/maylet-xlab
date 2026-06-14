import { Link } from 'react-router-dom';
import { useState } from 'react';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  featured?: boolean;
  popular?: boolean;
  ctaText: string;
  ctaLink: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);

  const monthlyPlans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started with innovation',
      features: [
        '3 Active Projects',
        'Basic AI Validation (5 credits/month)',
        '5 Team Members',
        'Community Access',
        'Innovation Vault (3 entries)',
        'Email Support (48h response)'
      ],
      ctaText: 'Start for Free',
      ctaLink: '/register',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$15',
      period: '/month',
      description: 'For serious innovators and growing startups',
      features: [
        'Unlimited Projects',
        'Advanced AI Analytics (500 credits/month)',
        'Unlimited Team Members',
        'Funding Hub Access',
        'Unlimited Vault Storage',
        'Priority Support (24h response)',
        'Custom Domains',
        'Export Data'
      ],
      featured: true,
      popular: true,
      ctaText: 'Get Pro',
      ctaLink: '/register?plan=pro',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      description: 'For organizations and large teams',
      features: [
        'Everything in Pro',
        'Admin Dashboard',
        'SSO & Advanced Security',
        'Dedicated Account Manager',
        'API Access',
        'Private Innovation Lab',
        'SLA Guarantee (99.9% uptime)',
        'Custom Integration',
        '24/7 Phone Support'
      ],
      ctaText: 'Contact Sales',
      ctaLink: '/contact',
    },
  ];

  const yearlyPlans: PricingPlan[] = [
    {
      id: 'free-yearly',
      name: 'Free',
      price: '$0',
      period: '/year',
      description: 'Perfect for getting started',
      features: [
        '3 Active Projects',
        'Basic AI Validation (5 credits/month)',
        '5 Team Members',
        'Community Access',
        'Innovation Vault (3 entries)',
        'Email Support'
      ],
      ctaText: 'Start for Free',
      ctaLink: '/register',
    },
    {
      id: 'pro-yearly',
      name: 'Pro',
      price: '$144',
      period: '/year',
      description: 'Save $36/year (2 months free)',
      features: [
        'Unlimited Projects',
        'Advanced AI Analytics (600 credits/month)',
        'Unlimited Team Members',
        'Funding Hub Access',
        'Unlimited Vault Storage',
        'Priority Support',
        'Custom Domains',
        'Export Data'
      ],
      featured: true,
      popular: true,
      ctaText: 'Get Pro Yearly',
      ctaLink: '/register?plan=pro_yearly',
    },
    {
      id: 'enterprise-yearly',
      name: 'Enterprise',
      price: '$950',
      period: '/year',
      description: 'Save $238/year',
      features: [
        'Everything in Pro',
        'Admin Dashboard',
        'SSO & Advanced Security',
        'Dedicated Account Manager',
        'API Access',
        'Private Innovation Lab',
        'SLA Guarantee',
        'Custom Integration',
        '24/7 Phone Support'
      ],
      ctaText: 'Contact Sales',
      ctaLink: '/contact',
    },
  ];

  const faqs: FAQItem[] = [
    {
      question: 'Can I switch plans later?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we prorate the cost.',
    },
    {
      question: 'Do you offer student discounts?',
      answer: 'Yes! Students get 50% off Pro plan with valid student ID. Contact our support team for verification.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and mobile money (M-Pesa, Tigo Pesa, Airtel Money) for African users.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Pro plan comes with a 14-day free trial. No credit card required to start.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. No long-term contracts.',
    },
    {
      question: 'What happens if I exceed my plan limits?',
      answer: 'You will be notified and can upgrade to a higher plan. No overage charges – we simply pause extra features until you upgrade.',
    },
    {
      question: 'Do you offer team plans?',
      answer: 'Yes, Pro and Enterprise plans include unlimited team members with role-based access controls.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use AES-256 encryption for all data and comply with industry security standards.',
    },
  ];

  const currentPlans = billingCycle === 'monthly' ? monthlyPlans : yearlyPlans;

  return (
    <div className="pricing-page">
      {/* Hero Section */}
      <div className="pricing-hero">
        <div className="hero-badge">💰 Simple, Transparent Pricing</div>
        <h1>Choose the <span>plan</span> that fits you</h1>
        <p>Start free, scale when you're ready — no hidden fees, cancel anytime.</p>
        
        {/* Billing Toggle */}
        <div className="billing-toggle">
          <button 
            className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
            <span className="save-badge">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="pricing-cards">
        <div className="cards-grid">
          {currentPlans.map((plan, idx) => (
            <div key={plan.id} className={`pricing-card ${plan.featured ? 'featured' : ''} fade-in-up`} style={{ animationDelay: `${idx * 0.1}s` }}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  {plan.price}<span>{plan.period}</span>
                </div>
                <p className="plan-description">{plan.description}</p>
              </div>
              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="check-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link 
                to={plan.ctaLink} 
                className={`plan-cta ${plan.featured ? 'btn-primary' : 'btn-outline'}`}
              >
                {plan.ctaText} →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Trusted By Section */}
      <div className="trusted-section">
        <p>Trusted by innovators and organizations worldwide</p>
        <div className="trusted-logos">
          <span>Microsoft</span>
          <span>Google for Startups</span>
          <span>AWS</span>
          <span>GitHub</span>
          <span>NVIDIA</span>
          <span>Stripe</span>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="comparison-section">
        <h2>Compare all <span>features</span></h2>
        <p>See exactly what you get with each plan</p>
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Pro</th>
                <th>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Active Projects</td><td>3</td><td>Unlimited</td><td>Unlimited</td></tr>
              <tr><td>AI Validation Credits</td><td>5/month</td><td>500/month</td><td>Custom</td></tr>
              <tr><td>Team Members</td><td>5</td><td>Unlimited</td><td>Unlimited</td></tr>
              <tr><td>Innovation Vault</td><td>3 entries</td><td>Unlimited</td><td>Unlimited</td></tr>
              <tr><td>Funding Hub Access</td><td>❌</td><td>✅</td><td>✅</td></tr>
              <tr><td>API Access</td><td>❌</td><td>❌</td><td>✅</td></tr>
              <tr><td>Priority Support</td><td>48h</td><td>24h</td><td>4h</td></tr>
              <tr><td>SSO & Advanced Security</td><td>❌</td><td>❌</td><td>✅</td></tr>
              <tr><td>Dedicated Account Manager</td><td>❌</td><td>❌</td><td>✅</td></tr>
              <tr><td>Custom Integration</td><td>❌</td><td>❌</td><td>✅</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Money Back Guarantee */}
      <div className="guarantee-section">
        <div className="guarantee-card">
          <span className="guarantee-icon">🛡️</span>
          <h3>14-Day Money-Back Guarantee</h3>
          <p>Try Pro risk-free. If you're not satisfied within 14 days, get a full refund. No questions asked.</p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2>Frequently Asked <span>Questions</span></h2>
        <p>Everything you need to know about our pricing and plans</p>
        <div className="faq-grid">
          {faqs.map((item, index) => (
            <div key={index} className="faq-item">
              <button 
                className="faq-question"
                onClick={() => setSelectedFaq(selectedFaq === index ? null : index)}
              >
                <span>{item.question}</span>
                <span className="faq-icon">{selectedFaq === index ? '−' : '+'}</span>
              </button>
              <div className={`faq-answer ${selectedFaq === index ? 'open' : ''}`}>
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="pricing-cta">
        <div className="cta-glow"></div>
        <h2>Ready to start your innovation journey?</h2>
        <p>Join 10,000+ innovators already building the future with Maylet XLab.</p>
        <div className="cta-buttons">
          <Link to="/register" className="btn-primary btn-large">Start Free Account →</Link>
          <Link to="/contact" className="btn-outline btn-large">Contact Sales</Link>
        </div>
        <p className="cta-note">No credit card required. Free forever plan available.</p>
      </div>

      <style>{`
        .pricing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up {
          animation: fadeInUp 0.6s ease forwards;
          opacity: 0;
        }

        /* Hero Section */
        .pricing-hero {
          text-align: center;
          padding: 4rem 2rem;
          background: radial-gradient(ellipse at 50% 0%, rgba(124,95,230,0.12), transparent);
        }
        .hero-badge {
          display: inline-block;
          padding: 0.3rem 0.8rem;
          background: rgba(124,95,230,0.15);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 40px;
          font-size: 0.8rem;
          color: #9b7ff0;
          margin-bottom: 1rem;
        }
        .pricing-hero h1 {
          font-size: clamp(2rem, 4vw, 3.5rem);
          margin-bottom: 1rem;
        }
        .pricing-hero h1 span {
          color: #2fd4ff;
        }
        .pricing-hero p {
          color: rgba(255,255,255,0.7);
          max-width: 600px;
          margin: 0 auto;
        }

        /* Billing Toggle */
        .billing-toggle {
          display: inline-flex;
          background: rgba(255,255,255,0.05);
          border-radius: 60px;
          padding: 0.3rem;
          margin-top: 2rem;
        }
        .toggle-btn {
          padding: 0.6rem 1.5rem;
          border-radius: 40px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          position: relative;
        }
        .toggle-btn.active {
          background: #7c5fe6;
          color: white;
        }
        .save-badge {
          background: #48bb78;
          color: #0a0d1a;
          font-size: 0.6rem;
          padding: 0.2rem 0.4rem;
          border-radius: 20px;
          margin-left: 0.5rem;
          font-weight: 600;
        }

        /* Pricing Cards */
        .pricing-cards {
          max-width: 1280px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          align-items: stretch;
        }
        .pricing-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 32px;
          padding: 2rem;
          transition: all 0.3s;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .pricing-card:hover {
          transform: translateY(-8px);
          background: rgba(255,255,255,0.05);
          border-color: rgba(124,95,230,0.3);
        }
        .pricing-card.featured {
          border: 2px solid #7c5fe6;
          background: linear-gradient(135deg, rgba(124,95,230,0.08), rgba(47,212,255,0.04));
          transform: scale(1.02);
        }
        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          padding: 0.3rem 1rem;
          border-radius: 30px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .plan-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .plan-header h3 {
          font-size: 1.3rem;
          margin-bottom: 0.5rem;
        }
        .plan-price {
          font-size: 2.5rem;
          font-weight: 800;
        }
        .plan-price span {
          font-size: 0.9rem;
          font-weight: 400;
          color: rgba(255,255,255,0.5);
        }
        .plan-description {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.6);
          margin-top: 0.5rem;
        }
        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem 0;
          flex: 1;
        }
        .plan-features li {
          padding: 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.8);
        }
        .check-icon {
          color: #48bb78;
          font-weight: 700;
        }
        .plan-cta {
          width: 100%;
          padding: 0.8rem;
          text-align: center;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          border: none;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124,95,230,0.4);
        }
        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
        }
        .btn-outline:hover {
          border-color: #7c5fe6;
          background: rgba(124,95,230,0.1);
        }
        .btn-large {
          padding: 1rem 2rem;
          font-size: 1rem;
        }

        /* Trusted Section */
        .trusted-section {
          text-align: center;
          padding: 2rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .trusted-section p {
          color: rgba(255,255,255,0.5);
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }
        .trusted-logos {
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .trusted-logos span {
          color: rgba(255,255,255,0.6);
          font-size: 0.9rem;
        }

        /* Comparison Table */
        .comparison-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 4rem 2rem;
          text-align: center;
        }
        .comparison-section h2 span {
          color: #2fd4ff;
        }
        .comparison-section p {
          color: rgba(255,255,255,0.6);
          margin-bottom: 2rem;
        }
        .comparison-table-wrapper {
          overflow-x: auto;
        }
        .comparison-table {
          width: 100%;
          border-collapse: collapse;
        }
        .comparison-table th, .comparison-table td {
          padding: 1rem;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .comparison-table th:first-child, .comparison-table td:first-child {
          text-align: left;
          font-weight: 600;
        }
        .comparison-table th {
          color: #9b7ff0;
          font-weight: 600;
        }

        /* Guarantee Section */
        .guarantee-section {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        .guarantee-card {
          text-align: center;
          padding: 2rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
        }
        .guarantee-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.5rem;
        }
        .guarantee-card h3 {
          margin-bottom: 0.5rem;
        }
        .guarantee-card p {
          color: rgba(255,255,255,0.6);
          font-size: 0.85rem;
        }

        /* FAQ Section */
        .faq-section {
          max-width: 800px;
          margin: 0 auto;
          padding: 4rem 2rem;
        }
        .faq-section h2 span {
          color: #2fd4ff;
        }
        .faq-section > p {
          text-align: center;
          color: rgba(255,255,255,0.6);
          margin-bottom: 2rem;
        }
        .faq-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .faq-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
        }
        .faq-question {
          width: 100%;
          padding: 1.2rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: none;
          border: none;
          color: white;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
        }
        .faq-question:hover {
          background: rgba(255,255,255,0.02);
        }
        .faq-icon {
          font-size: 1.3rem;
          color: #9b7ff0;
        }
        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
          padding: 0 1.5rem;
        }
        .faq-answer.open {
          max-height: 200px;
          padding: 0 1.5rem 1.2rem 1.5rem;
        }
        .faq-answer p {
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
        }

        /* CTA Section */
        .pricing-cta {
          text-align: center;
          padding: 4rem 2rem;
          position: relative;
          background: linear-gradient(135deg, rgba(124,95,230,0.08), rgba(47,212,255,0.04));
          margin: 2rem;
          border-radius: 40px;
          overflow: hidden;
        }
        .cta-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(124,95,230,0.2), transparent);
          pointer-events: none;
        }
        .pricing-cta h2 {
          margin-bottom: 0.5rem;
        }
        .pricing-cta p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 1.5rem;
        }
        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .cta-note {
          margin-top: 1rem;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
        }

        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
          .pricing-card.featured {
            transform: scale(1);
          }
          .comparison-table th, .comparison-table td {
            font-size: 0.75rem;
            padding: 0.5rem;
          }
          .pricing-cta {
            margin: 1rem;
            padding: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Pricing;