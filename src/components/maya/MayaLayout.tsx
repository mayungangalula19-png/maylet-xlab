import { ReactNode } from 'react';
import { AppSidebar } from '../dashboard/AppSidebar';
import '../../styles/maya.css';

interface Props {
  children: ReactNode;
  contextPanel: ReactNode;
  showAppSidebar?: boolean;
}

export function MayaLayout({ children, contextPanel, showAppSidebar = true }: Props) {
  return (
    <div className={showAppSidebar ? 'maya-layout' : 'maya-layout maya-layout--no-sidebar'}>
      {showAppSidebar && <AppSidebar />}
      {children}
      {contextPanel}
    </div>
  );
}
