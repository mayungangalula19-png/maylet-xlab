import { useState, useEffect } from 'react';

import { supabase } from '../../lib/supabase/client';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
  invoice_url: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'paypal';
  last4: string;
  expiry?: string;
  is_default: boolean;
}

interface Subscription {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string;
  cancel_at_period_end: boolean;
}

const Billing = () => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  interface BillingUser {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
  }
  const [user, setUser] = useState<BillingUser | null>(null);

  useEffect(() => {
    const fetchBillingData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
          user_metadata: user.user_metadata,
        });
      }

      // Fetch subscription from Supabase
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (subData) {
        setSubscription({
          plan: subData.plan,
          status: subData.status,
          current_period_end: subData.current_period_end,
          cancel_at_period_end: subData.cancel_at_period_end,
        });
      } else {
        // Default to free plan
        setSubscription({
          plan: 'free',
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
        });
      }

      // Mock payment methods (replace with actual API call)
      setPaymentMethods([
        { id: '1', type: 'card', last4: '4242', expiry: '12/2027', is_default: true },
        { id: '2', type: 'mobile_money', last4: '0712345678', is_default: false },
      ]);

      // Mock invoices (replace with actual API call)
      setInvoices([
        { id: 'INV-001', date: 'May 1, 2025', amount: 15, status: 'paid', plan: 'Pro', invoice_url: '#' },
        { id: 'INV-002', date: 'Apr 1, 2025', amount: 15, status: 'paid', plan: 'Pro', invoice_url: '#' },
        { id: 'INV-003', date: 'Mar 1, 2025', amount: 0, status: 'paid', plan: 'Free', invoice_url: '#' },
      ]);

      setLoading(false);
    };

    fetchBillingData();
  }, []);

  const handleUpgrade = async (plan: string) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = async () => {
    // Integrate with Stripe/PayPal/Mobile Money here
    alert(`Upgrading to ${selectedPlan} plan... Payment integration coming soon.`);
    setShowUpgradeModal(false);
  };

  const handleCancelSubscription = async () => {
    const { error } = await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: true, status: 'canceled' })
      .eq('user_id', user?.id);

    if (!error) {
      setSubscription(prev => prev ? { ...prev, cancel_at_period_end: true, status: 'canceled' } : null);
      alert('Your subscription has been canceled. You will continue to have access until the end of your billing period.');
    }
    setShowCancelModal(false);
  };

  const handleReactivateSubscription = async () => {
    const { error } = await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: false, status: 'active' })
      .eq('user_id', user?.id);

    if (!error) {
      setSubscription(prev => prev ? { ...prev, cancel_at_period_end: false, status: 'active' } : null);
      alert('Your subscription has been reactivated!');
    }
  };

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'pro': return '$15';
      case 'enterprise': return '$99';
      default: return '$0';
    }
  };

  const getPlanFeatures = (plan: string) => {
    switch (plan) {
      case 'pro':
        return ['Unlimited Projects', 'Advanced AI Analytics', 'Unlimited Team Members', 'Funding Hub Access', 'Priority Support'];
      case 'enterprise':
        return ['Everything in Pro', 'Admin Dashboard', 'SSO & Security', 'Dedicated Manager', 'API Access'];
      default:
        return ['3 Projects', 'Basic AI', '5 Team Members', 'Community Access', 'Email Support'];
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading billing information...</p>
      </div>
    );
  }

  return (
    <div className="billing-page">
      {/* Current Plan Section */}
      <div className="billing-section">
        <h2>Current Plan</h2>
        <div className="current-plan-card">
          <div className="plan-info">
            <div className="plan-name">{subscription?.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : 'Free'} Plan</div>
            <div className="plan-price">{getPlanPrice(subscription?.plan || 'free')}<span>/month</span></div>
            <div className="plan-status">
              <span className={`status-badge ${subscription?.status}`}>{subscription?.status}</span>
              {subscription?.cancel_at_period_end && (
                <span className="cancel-badge">Cancels at period end</span>
              )}
            </div>
          </div>
          <div className="plan-features">
            <h4>Includes:</h4>
            <ul>
              {getPlanFeatures(subscription?.plan || 'free').map((feature, idx) => (
                <li key={idx}><span className="check">✓</span> {feature}</li>
              ))}
            </ul>
          </div>
          <div className="plan-actions">
            {subscription?.plan === 'free' ? (
              <button className="btn-primary" onClick={() => handleUpgrade('pro')}>Upgrade to Pro</button>
            ) : (
              <>
                <button className="btn-outline" onClick={() => handleUpgrade('enterprise')}>Upgrade to Enterprise</button>
                {subscription?.cancel_at_period_end ? (
                  <button className="btn-primary" onClick={handleReactivateSubscription}>Reactivate Subscription</button>
                ) : (
                  <button className="btn-danger" onClick={() => setShowCancelModal(true)}>Cancel Subscription</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="billing-section">
        <div className="section-header">
          <h2>Payment Methods</h2>
          <button className="btn-outline-small">+ Add Payment Method</button>
        </div>
        <div className="payment-methods-list">
          {paymentMethods.map((method) => (
            <div key={method.id} className="payment-method-card">
              <div className="method-icon">
                {method.type === 'card' && '💳'}
                {method.type === 'mobile_money' && '📱'}
                {method.type === 'paypal' && '🅿️'}
              </div>
              <div className="method-details">
                <div className="method-type">
                  {method.type === 'card' && 'Credit Card'}
                  {method.type === 'mobile_money' && 'Mobile Money'}
                  {method.type === 'paypal' && 'PayPal'}
                </div>
                <div className="method-info">
                  •••• {method.last4}
                  {method.expiry && ` • Expires ${method.expiry}`}
                </div>
              </div>
              {method.is_default && <span className="default-badge">Default</span>}
              <button className="method-edit">Edit</button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History Section */}
      <div className="billing-section">
        <h2>Billing History</h2>
        <div className="invoices-table">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.id}</td>
                  <td>{invoice.date}</td>
                  <td>{invoice.plan}</td>
                  <td>${invoice.amount}</td>
                  <td><span className={`status-badge ${invoice.status}`}>{invoice.status}</span></td>
                  <td><a href={invoice.invoice_url} className="download-link">Download</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Subscription</h3>
            <p>Are you sure you want to cancel your {subscription?.plan} plan?</p>
            <p className="warning">You will lose access to premium features after your billing period ends.</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowCancelModal(false)}>Keep Plan</button>
              <button className="btn-danger" onClick={handleCancelSubscription}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Upgrade to {selectedPlan ? selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1) : 'Plan'}</h3>
            <p>You are about to upgrade from {subscription?.plan} to {selectedPlan}.</p>
            <div className="price-details">
              <span>Price: {getPlanPrice(selectedPlan || '')}/month</span>
            </div>
            <p className="info">Your card will be charged immediately. You can cancel anytime.</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowUpgradeModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={confirmUpgrade}>Confirm Upgrade</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .billing-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 1rem;
        }
        .billing-section {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .billing-section h2 {
          font-size: 1.2rem;
          margin-bottom: 1rem;
          color: #fff;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .current-plan-card {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          align-items: flex-start;
        }
        .plan-info {
          flex: 1;
        }
        .plan-name {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .plan-price {
          font-size: 1.8rem;
          font-weight: 800;
          color: #7c5fe6;
        }
        .plan-price span {
          font-size: 0.9rem;
          font-weight: 400;
          color: rgba(255,255,255,0.5);
        }
        .plan-status {
          margin-top: 0.5rem;
        }
        .status-badge {
          display: inline-block;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .status-badge.active { background: #48bb78; color: #0a0d1a; }
        .status-badge.canceled { background: #fc8181; color: #0a0d1a; }
        .status-badge.past_due { background: #f6c90e; color: #0a0d1a; }
        .status-badge.paid { background: #48bb78; color: #0a0d1a; }
        .status-badge.pending { background: #f6c90e; color: #0a0d1a; }
        .status-badge.failed { background: #fc8181; color: #0a0d1a; }
        .cancel-badge {
          display: inline-block;
          margin-left: 0.5rem;
          padding: 0.2rem 0.6rem;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          font-size: 0.7rem;
        }
        .plan-features {
          flex: 1;
        }
        .plan-features h4 {
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          color: rgba(255,255,255,0.7);
        }
        .plan-features ul {
          list-style: none;
          padding: 0;
        }
        .plan-features li {
          padding: 0.2rem 0;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.8);
        }
        .check {
          color: #48bb78;
          margin-right: 0.5rem;
        }
        .plan-actions {
          display: flex;
          gap: 0.5rem;
          flex-direction: column;
        }
        .btn-primary, .btn-outline, .btn-danger, .btn-outline-small {
          padding: 0.6rem 1.2rem;
          border-radius: 40px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124,95,230,0.3);
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
        .btn-outline-small {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.3rem 0.8rem;
          font-size: 0.75rem;
        }
        .btn-danger {
          background: #fc8181;
          color: #0a0d1a;
        }
        .payment-methods-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .payment-method-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
        }
        .method-icon {
          font-size: 1.5rem;
        }
        .method-details {
          flex: 1;
        }
        .method-type {
          font-weight: 600;
          font-size: 0.85rem;
        }
        .method-info {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
        }
        .default-badge {
          background: rgba(124,95,230,0.2);
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          color: #9b7ff0;
        }
        .method-edit {
          background: none;
          border: none;
          color: #9b7ff0;
          cursor: pointer;
          font-size: 0.75rem;
        }
        .invoices-table {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        th {
          color: rgba(255,255,255,0.6);
          font-weight: 600;
          font-size: 0.8rem;
        }
        td {
          font-size: 0.8rem;
        }
        .download-link {
          color: #9b7ff0;
          text-decoration: none;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 2rem;
          max-width: 400px;
          width: 90%;
        }
        .modal-content h3 {
          margin-bottom: 1rem;
        }
        .modal-content p {
          color: rgba(255,255,255,0.7);
          margin-bottom: 1rem;
        }
        .warning {
          color: #fc8181 !important;
        }
        .price-details {
          background: rgba(124,95,230,0.1);
          padding: 0.5rem;
          border-radius: 8px;
          text-align: center;
          margin: 1rem 0;
        }
        .info {
          font-size: 0.8rem;
        }
        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Billing;