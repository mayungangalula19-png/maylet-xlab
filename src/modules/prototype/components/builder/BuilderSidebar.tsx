import type { BuilderSectionId } from '../../types/prototypeBuilder.types';
import { BUILDER_NAV_GROUPS } from '../../types/prototypeBuilder.types';

interface Props {
  active: BuilderSectionId;
  onSelect: (id: BuilderSectionId) => void;
  assetCount?: number;
  experimentCount?: number;
}

export function BuilderSidebar({ active, onSelect, assetCount = 0, experimentCount = 0 }: Props) {
  return (
    <aside className="proto-builder-sidebar" aria-label="Prototype builder navigation">
      {BUILDER_NAV_GROUPS.map((group) => (
        <div key={group.label} className="proto-builder-sidebar__group">
          <span className="proto-builder-sidebar__label">{group.label}</span>
          {group.items.map((item) => {
            let badge: number | null = null;
            if (item.id === 'attachments' && assetCount > 0) badge = assetCount;
            if (item.id === 'experiments' && experimentCount > 0) badge = experimentCount;
            return (
              <button
                key={item.id}
                type="button"
                className={`proto-builder-sidebar__item${active === item.id ? ' proto-builder-sidebar__item--active' : ''}`}
                onClick={() => onSelect(item.id)}
              >
                <span aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
                {badge != null ? <span className="proto-builder-sidebar__badge">{badge}</span> : null}
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
