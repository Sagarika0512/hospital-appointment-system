import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { PulseIcon, LogoutIcon, MenuIcon } from "../ui/Icons";

/**
 * CarePulse HMS — Application Header
 * Light clinical top navigation bar matching Google Stitch UI specification
 *
 * @param {function} onOpenMobileDrawer - Callback to open responsive drawer
 */
export function Header({ onOpenMobileDrawer }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Extract initials for avatar fallback (e.g. "Sagarika Sen" -> "SS")
  const getInitials = (name) => {
    if (!name) return "CP";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "ROLE_ADMIN";
  const roleLabel = isAdmin ? "Administrator" : "Patient";
  const rolePillClass = isAdmin ? "cp-role-pill-admin" : "cp-role-pill-patient";

  return (
    <header className="cp-header" role="banner">
      <div className="cp-header-left">
        {/* Mobile menu trigger (< 1024px) */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="cp-mobile-toggle-btn"
          aria-label="Open navigation drawer"
        >
          <MenuIcon size={20} />
        </button>

        {/* CarePulse Logo Branding */}
        <Link to="/dashboard" className="cp-brand" aria-label="CarePulse HMS Home">
          <div className="cp-brand-icon-wrapper" aria-hidden="true">
            <PulseIcon size={20} />
          </div>
          <div className="cp-brand-text">
            <h1 className="cp-brand-name">CarePulse</h1>
            <span className="cp-brand-badge">HMS</span>
          </div>
        </Link>
      </div>

      <div className="cp-header-right">
        {/* Authenticated user profile identity */}
        {user && (
          <div className="cp-user-profile">
            <div className="cp-user-avatar" aria-hidden="true">
              {getInitials(user.name)}
            </div>

            <div className="cp-user-info">
              <span className="cp-user-name">{user.name || "User"}</span>
              <span className={`cp-role-pill ${rolePillClass}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        )}

        {/* Logout Action */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          icon={<LogoutIcon size={16} />}
          aria-label="Log out of application"
        >
          Logout
        </Button>
      </div>
    </header>
  );
}

export default Header;
