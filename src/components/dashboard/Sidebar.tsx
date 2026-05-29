import { Link } from 'react-router-dom'; export const Sidebar = () => { return ( <aside className="sidebar-component"><h3>Maylet XLab</h3><Link to='/dashboard'>Dashboard</Link><br/><Link to='/projects'>Projects</Link><br/><Link to='/experiments'>Experiments</Link><br/><Link to='/teams'>Teams</Link><br/><Link to='/funding'>Funding</Link><br/><Link to='/vault'>Vault</Link><br/><Link to='/settings'>Settings</Link></aside> ); };

const styles = `
  .sidebar-component {
    width: 260px;
    background: #1a1a2e;
    height: 100vh;
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
