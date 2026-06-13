export const ErrorMessage = ({ message }: { message: string }) => { return <div className="error-message-container">{message}</div>; };

const styles = `
  .error-message-container {
    color: #fc8181;
    padding: 1rem;
    background: rgba(252, 129, 129, 0.1);
    border: 1px solid rgba(252, 129, 129, 0.3);
    border-radius: 8px;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
