/**
 * CarePulse HMS — Accessible Loading Spinner
 */
export function Spinner({
  size = "md",
  color = "primary",
  className = "",
  label = "Loading...",
  ...props
}) {
  const sizeMap = {
    xs: 14,
    sm: 18,
    md: 24,
    lg: 32,
  };

  const strokeMap = {
    xs: 2.5,
    sm: 2.5,
    md: 3,
    lg: 3.5,
  };

  const colorMap = {
    primary: "var(--cp-primary)",
    white: "var(--cp-text-inverse)",
    muted: "var(--cp-text-muted)",
    danger: "var(--cp-danger)",
  };

  const px = sizeMap[size] || 24;
  const stroke = strokeMap[size] || 3;
  const strokeColor = colorMap[color] || "currentColor";

  return (
    <span
      role="status"
      aria-label={label}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      className={className}
      {...props}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "cp-spin 0.75s linear infinite" }}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeOpacity="0.2"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
      <span className="cp-sr-only">{label}</span>
      <style>{`
        @keyframes cp-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
}

export default Spinner;
