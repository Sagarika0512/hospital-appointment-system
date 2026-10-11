import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

/**
 * CarePulse HMS — Master Application Shell
 * Wraps authenticated pages in clinical header, role-based sidebar, and responsive container
 */
export function AppShell({ children }) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="cp-app-shell">
      {/* Accessible skip link for keyboard users */}
      <a href="#main-content" className="cp-skip-link">
        Skip to main content
      </a>

      {/* Top Application Header */}
      <Header onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)} />

      {/* Shell Body: Sidebar + Main Area */}
      <div className="cp-shell-body">
        {/* Role-Aware Sidebar Navigation */}
        <Sidebar
          isMobileOpen={isMobileDrawerOpen}
          onCloseMobile={() => setIsMobileDrawerOpen(false)}
        />

        {/* Scrollable Main Content Area */}
        <main id="main-content" className="cp-main-content" tabIndex={-1}>
          <div className="cp-page-container">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
