export const DashboardNavbar = () => { return <header className="dashboard-navbar">Dashboard Navbar</header>; };

const styles = `
  .dashboard-navbar {
    padding: 1rem;
    background: #1a1a2e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
