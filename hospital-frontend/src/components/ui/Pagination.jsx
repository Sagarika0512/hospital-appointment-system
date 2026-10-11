import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

/**
 * CarePulse HMS — Reusable Pagination Component
 * Aligned with Spring Boot Pageable / PagedResponse DTO contract:
 * { content: [], pageNo: 0, pageSize: 10, totalElements: 45, totalPages: 5, last: false }
 *
 * @param {number} pageNo - 0-indexed current page
 * @param {number} totalPages - Total page count from backend
 * @param {number} totalElements - Total record count from backend
 * @param {number} pageSize - Number of items per page
 * @param {function} onPageChange - Callback receiving target 0-indexed page number
 * @param {boolean} disabled - Disable all controls during loading
 */
export function Pagination({
  pageNo = 0,
  totalPages = 1,
  totalElements,
  pageSize,
  onPageChange,
  disabled = false,
  className = "",
}) {
  if (totalPages <= 1 && !totalElements) {
    return null;
  }

  const currentPage = pageNo; // 0-indexed
  const isFirst = currentPage <= 0;
  const isLast = currentPage >= totalPages - 1;

  // Compute pagination range (show max 5 page numbers around current)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(0, currentPage - 2);
      let end = Math.min(totalPages - 1, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(0, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  // Compute info text if totalElements is provided
  const renderInfoText = () => {
    if (typeof totalElements !== "number") return null;
    if (totalElements === 0) return <span>0 results</span>;

    const size = pageSize || 10;
    const start = currentPage * size + 1;
    const end = Math.min((currentPage + 1) * size, totalElements);

    return (
      <span className="cp-pagination-info">
        Showing <strong>{start}</strong> to <strong>{end}</strong> of <strong>{totalElements}</strong> records
      </span>
    );
  };

  return (
    <nav
      className={`cp-pagination ${className}`.trim()}
      aria-label="Pagination Navigation"
    >
      <div className="cp-pagination-info-wrapper">{renderInfoText()}</div>

      {totalPages > 1 && (
        <div className="cp-pagination-nav">
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={disabled || isFirst}
            className="cp-page-btn"
            aria-label="Go to previous page"
          >
            <ChevronLeftIcon size={16} />
          </button>

          {/* First page + ellipsis if window starts beyond page 0 */}
          {pages[0] > 0 && (
            <>
              <button
                type="button"
                onClick={() => onPageChange?.(0)}
                disabled={disabled}
                className="cp-page-btn"
                aria-label="Go to page 1"
              >
                1
              </button>
              {pages[0] > 1 && <span className="cp-pagination-ellipsis" aria-hidden="true">…</span>}
            </>
          )}

          {/* Windowed page numbers */}
          {pages.map((p) => {
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange?.(p)}
                disabled={disabled}
                className={`cp-page-btn ${isCurrent ? "active" : ""}`}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Go to page ${p + 1}`}
              >
                {p + 1}
              </button>
            );
          })}

          {/* Last page + ellipsis if window ends before last page */}
          {pages[pages.length - 1] < totalPages - 1 && (
            <>
              {pages[pages.length - 1] < totalPages - 2 && (
                <span className="cp-pagination-ellipsis" aria-hidden="true">…</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange?.(totalPages - 1)}
                disabled={disabled}
                className="cp-page-btn"
                aria-label={`Go to page ${totalPages}`}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={disabled || isLast}
            className="cp-page-btn"
            aria-label="Go to next page"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      )}
    </nav>
  );
}

export default Pagination;
