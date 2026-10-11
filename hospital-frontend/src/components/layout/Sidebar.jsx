import { useContext, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  LayoutDashboardIcon,
  StethoscopeIcon,
  CalendarPlusIcon,
  ClockIcon,
  UsersIcon,
  XIcon,
  PulseIcon,
} from "../ui/Icons";

/**
 * CarePulse HMS — Role-Aware Sidebar Navigation
 *
 * Strictly authorized navigation menus according to Stitch specification:
 * - PATIENT: Dashboard, Find Doctors, Book Appointment, My Appointments
 * - ADMIN:   Dashboard, Appointments, Doctors, Patients
 *
 * @param {boolean} isMobileOpen - Drawer visibility state
 * @param {function} onCloseMobile - Closes mobile drawer
 */
export function Sidebar({ isMobileOpen = false, onCloseMobile }) {
  const { user } = useContext(AuthContext);

  const isAdmin = user?.role === "ADMIN" || user?.role === "ROLE_ADMIN";

  // Menu items strictly filtered by authenticated role
  const patientNavItems = [
    { label: "Dashboard", to: "/dashboard", icon: <LayoutDashboardIcon size={18} /> },
    { label: "Find Doctors", to: "/doctors", icon: <StethoscopeIcon size={18} /> },
    { label: "Book Appointment", to: "/book-appointment", icon: <CalendarPlusIcon size={18} /> },
    { label: "My Appointments", to: "/appointments", icon: <ClockIcon size={18} /> },
  ];

  const adminNavItems = [
    { label: "Dashboard", to: "/dashboard", icon: <LayoutDashboardIcon size={18} /> },
    { label: "Appointments", to: "/appointments", icon: <ClockIcon size={18} /> },
    { label: "Doctors", to: "/doctors", icon: <StethoscopeIcon size={18} /> },
    { label: "Patients", to: "/patients", icon: <UsersIcon size={18} /> },
  ];

  const navItems = isAdmin ? adminNavItems : patientNavItems;

  // Escape key listener for mobile drawer
  useEffect(() => {
    if (!isMobileOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCloseMobile?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileOpen, onCloseMobile]);

  const renderNavLinks = () => (
    <nav className="cp-sidebar-nav" aria-label="Main Application Navigation">
      <div className="cp-sidebar-section-title">
        {isAdmin ? "Admin Console" : "Patient Portal"}
      </div>

      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => {
            if (isMobileOpen) onCloseMobile?.();
          }}
          className={({ isActive }) =>
            `cp-nav-item ${isActive ? "active" : ""}`
          }
          end={item.to === "/dashboard"}
        >
          <span className="cp-nav-item-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="cp-nav-item-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      {/* ── Persistent Desktop Sidebar (>= 1024px) ── */}
      <aside className="cp-sidebar cp-sidebar-desktop" aria-label="Sidebar">
        {renderNavLinks()}
      </aside>

      {/* ── Off-Canvas Mobile Drawer (< 1024px) ── */}
      {isMobileOpen && (
        <div
          className="cp-drawer-backdrop"
          onClick={onCloseMobile}
          role="presentation"
        >
          <div
            className="cp-drawer-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            <div className="cp-drawer-header">
              <div className="cp-brand">
                <div className="cp-brand-icon-wrapper" aria-hidden="true">
                  <PulseIcon size={18} />
                </div>
                <div className="cp-brand-text">
                  <span className="cp-brand-name" style={{ fontSize: "1rem" }}>CarePulse</span>
                  <span className="cp-brand-badge">HMS</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onCloseMobile}
                className="cp-drawer-close-btn"
                aria-label="Close navigation menu"
              >
                <XIcon size={18} />
              </button>
            </div>

            {renderNavLinks()}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
