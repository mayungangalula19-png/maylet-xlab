interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = 'Search…',
}: AdminSearchInputProps) {
  return (
    <div className="admin-search">
      <span className="admin-search-icon" aria-hidden>
        🔍
      </span>
      <input
        type="search"
        className="admin-search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
