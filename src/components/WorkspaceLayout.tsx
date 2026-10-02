import React from "react";

export interface WorkspaceLayoutProps {
  isSidebarCollapsed: boolean;
  children: React.ReactNode;
}

/** Stable page frame for the workspace: keeps the sidebar/grid geometry out of App. */
export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ isSidebarCollapsed, children }) => (
  <div className="mx-auto max-w-7xl px-4 py-6 md:px-6" id="mixwizard-primary-container">
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12" data-sidebar-collapsed={isSidebarCollapsed}>
      {children}
    </div>
  </div>
);
