import { ReactNode } from 'react';
import '../../../styles/maya.css';

interface Props {
  children: ReactNode;
  contextPanel: ReactNode;
}

/**
 * 3-panel MAYA workspace shell (chat + context panel).
 * The app sidebar is provided by DashboardLayout — never rendered here.
 */
export function MayaLayout({ children, contextPanel }: Props) {
  return (
    <div className="maya-layout maya-layout--no-sidebar">
      {children}
      {contextPanel}
    </div>
  );
}
