import type { TestingSectionId } from '../../types/prototypeTesting.types';
import { TESTING_NAV } from '../../types/prototypeTesting.types';

interface Props {
  active: TestingSectionId | 'dashboard';
  onSelect: (id: TestingSectionId | 'dashboard') => void;
}

export function TestingSidebar({ active, onSelect }: Props) {
  return (
    <nav className="proto-test-sidebar" aria-label="Testing workspace navigation">
      <button
        type="button"
        className={`proto-test-sidebar__btn proto-test-sidebar__btn--dashboard${active === 'dashboard' ? ' proto-test-sidebar__btn--active' : ''}`}
        onClick={() => onSelect('dashboard')}
      >
        <span aria-hidden>📊</span>
        Dashboard
      </button>
      <ul>
        {TESTING_NAV.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`proto-test-sidebar__btn${active === item.id ? ' proto-test-sidebar__btn--active' : ''}`}
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
