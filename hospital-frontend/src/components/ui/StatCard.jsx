/**
 * CarePulse HMS — StatCard Component for Dashboard Metrics
 *
 * @param {string} title - Metric label
 * @param {string | number} value - Metric value (count)
 * @param {string} subtitle - Optional helper/trend text
 * @param {ReactNode} icon - SVG icon
 * @param {'primary' | 'warning' | 'success' | 'danger'} variant - Icon background style
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = "primary",
  className = "",
  ...props
}) {
  const iconVariantClass = `cp-stat-icon-${variant}`;

  return (
    <div className={`cp-stat-card ${className}`.trim()} {...props}>
      <div className="cp-stat-content">
        <h4 className="cp-stat-title">{title}</h4>
        <div className="cp-stat-value">{value}</div>
        {subtitle && <p className="cp-stat-subtitle">{subtitle}</p>}
      </div>

      {icon && (
        <div className={`cp-stat-icon-wrapper ${iconVariantClass}`} aria-hidden="true">
          {icon}
        </div>
      )}
    </div>
  );
}

export default StatCard;
