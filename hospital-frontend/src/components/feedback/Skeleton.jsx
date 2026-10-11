/**
 * CarePulse HMS — Skeleton Loading Placeholders
 */

export function Skeleton({
  width = "100%",
  height = "20px",
  borderRadius = "var(--cp-radius-md)",
  className = "",
  style = {},
  ...props
}) {
  return (
    <div
      className={`cp-skeleton ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`cp-card ${className}`.trim()} aria-hidden="true">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <Skeleton width="40%" height="24px" />
        <Skeleton width="20%" height="20px" borderRadius="var(--cp-radius-full)" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        <Skeleton width="90%" height="16px" />
        <Skeleton width="75%" height="16px" />
        <Skeleton width="60%" height="16px" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className = "" }) {
  return (
    <div className={`cp-table-container ${className}`.trim()} aria-hidden="true">
      <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--cp-border)", display: "flex", gap: "1rem" }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width={`${100 / columns}%`} height="18px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            padding: "1rem",
            borderBottom: r < rows - 1 ? "1px solid var(--cp-border-light)" : "none",
            display: "flex",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} width={`${100 / columns}%`} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
