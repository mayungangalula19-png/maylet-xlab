import { INGESTION_NAV, type IngestionSectionId } from '../../types/prototypeIngestion.types';

interface Props {
  active: IngestionSectionId;
  onSelect: (id: IngestionSectionId) => void;
}

export function IngestionSidebar({ active, onSelect }: Props) {
  return (
    <nav className="proto-ingest-sidebar" aria-label="Ingestion sections">
      <ul>
        {INGESTION_NAV.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`proto-ingest-sidebar__btn${active === item.id ? ' proto-ingest-sidebar__btn--active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
