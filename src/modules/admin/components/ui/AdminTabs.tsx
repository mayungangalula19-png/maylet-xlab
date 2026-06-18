interface AdminTabsProps<T extends string> {
  tabs: ReadonlyArray<{ id: T; label: string; icon?: string }>;
  active: T;
  onChange: (id: T) => void;
}

export function AdminTabs<T extends string>({ tabs, active, onChange }: AdminTabsProps<T>) {
  return (
    <div className="admin-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`admin-tab ${active === tab.id ? 'admin-tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon ? <span className="admin-tab-icon">{tab.icon}</span> : null}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
