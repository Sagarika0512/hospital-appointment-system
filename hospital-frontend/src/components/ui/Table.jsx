/**
 * CarePulse HMS — Table Primitives
 * Clean clinical tabular data presentation
 */

export function Table({ children, className = "", containerClassName = "", ...props }) {
  return (
    <div className={`cp-table-container ${containerClassName}`.trim()}>
      <table className={`cp-table ${className}`.trim()} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "", ...props }) {
  return (
    <thead className={`cp-table-header ${className}`.trim()} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...props }) {
  return (
    <tbody className={`cp-table-body ${className}`.trim()} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "", ...props }) {
  return (
    <tr className={`cp-table-row ${className}`.trim()} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "", style = {}, ...props }) {
  return (
    <th className={`cp-table-head ${className}`.trim()} style={style} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", style = {}, ...props }) {
  return (
    <td className={`cp-table-cell ${className}`.trim()} style={style} {...props}>
      {children}
    </td>
  );
}

export default Table;
