export const RecentActivity = () => { return <div className="recent-activity"><h3>Recent Activity</h3><p>Activity list coming soon...</p></div>; };

const styles = `
  .recent-activity {
    background: #1a1a2e;
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
