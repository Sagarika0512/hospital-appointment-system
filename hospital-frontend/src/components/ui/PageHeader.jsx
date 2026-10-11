/**
 * CarePulse HMS — PageHeader Component
 * Standardizes section headings across Patient & Admin views
 *
 * @param {string} title
 * @param {string} description
 * @param {ReactNode} badge - Optional status or count badge
 * @param {ReactNode} action - Optional action button (e.g. "Book Appointment" / "Add Doctor")
 */
export function PageHeader({
  title,
  description,
  badge,
  action,
  className = "",
  ...props
}) {
  return (
    <div className={`cp-page-header ${className}`.trim()} {...props}>
      <div className="cp-page-header-text">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <h1 className="cp-page-title">{title}</h1>
          {badge && <div className="cp-page-header-badge">{badge}</div>}
        </div>
        {description && <p className="cp-page-subtitle">{description}</p>}
      </div>

      {action && <div className="cp-page-header-action">{action}</div>}
    </div>
  );
}

export default PageHeader;
