import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageShell } from '../../../../modules/shared/components/common/PageShell';
import { supabase } from '../../../../lib/supabase/client';

export default function MarketplaceListing() {
  const { id } = useParams();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from('marketplace_listings').select('*').eq('id', id).single().then(({ data }) => setItem(data));
  }, [id]);

  return (
    <PageShell title={String(item?.title ?? 'Listing')} subtitle={String(item?.listing_type ?? '')}>
      <p style={{ opacity: 0.85 }}>{String(item?.description ?? 'Loading…')}</p>
      {item?.price != null && (
        <p>
          <strong>
            {String(item.currency ?? 'USD')} {Number(item.price).toLocaleString()}
          </strong>
        </p>
      )}
      <Link to="/marketplace" style={{ color: '#9b7ff0' }}>
        ← Back to marketplace
      </Link>
    </PageShell>
  );
}
