/**
 * CarePulse HMS — Card Primitives
 * Light Clinical Precision surfaces consistent with Stitch design
 */

export function Card({
  children,
  variant = "default",
  hoverable = false,
  className = "",
  ...props
}) {
  const variantClass =
    variant === "muted"
      ? "cp-card-muted"
      : variant === "subtle"
      ? "cp-card-subtle"
      : "cp-card";

  const hoverClass = hoverable ? "cp-card-hoverable" : "";

  return (
    <div className={`${variantClass} ${hoverClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  children,
  className = "",
  ...props
}) {
  return (
    <div className={`cp-card-header ${className}`.trim()} {...props}>
      {title || subtitle ? (
        <div className="cp-card-header-titles">
          {title && <h3 className="cp-card-title">{title}</h3>}
          {subtitle && <p className="cp-card-subtitle">{subtitle}</p>}
        </div>
      ) : null}
      {children}
      {action && <div className="cp-card-header-action">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = "", ...props }) {
  return (
    <div className={`cp-card-body ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...props }) {
  return (
    <div className={`cp-card-footer ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export default Card;
