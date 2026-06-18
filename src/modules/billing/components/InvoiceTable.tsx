import { downloadInvoicePdf } from '../services/billing.service';
import type { BillingInvoice, SubscriptionPlan } from '../types/billing.types';

interface InvoiceTableProps {
  invoices: BillingInvoice[];
  orgName: string;
  plans: SubscriptionPlan[];
}

export function InvoiceTable({ invoices, orgName, plans }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return <p className="billing-muted">No invoices yet. Upgrading a paid plan generates your first invoice.</p>;
  }

  return (
    <div className="billing-table-wrap">
      <table className="billing-table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Date</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const planName = plans.find((p) => p.id === inv.plan_id)?.name ?? inv.plan_id ?? '—';
            return (
              <tr key={inv.id}>
                <td>{inv.invoice_number}</td>
                <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                <td>{planName}</td>
                <td>
                  {inv.currency} {Number(inv.amount).toFixed(2)}
                </td>
                <td>
                  <span className={`billing-status billing-status--${inv.status}`}>{inv.status}</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="billing-link-btn"
                    onClick={() => downloadInvoicePdf(inv, orgName, planName)}
                  >
                    PDF
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
