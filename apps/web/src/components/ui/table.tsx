import * as React from 'react';

export interface TableHeadCellProps extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'style'> {
  children: React.ReactNode;
  className?: string;
  style?: any;
  styleType?: 'primary' | 'numeric' | 'date' | 'status';
}

export const TableHeadCell = React.forwardRef<HTMLTableCellElement, TableHeadCellProps>(
  ({ children, className = '', styleType = 'primary', style, ...props }, ref) => {
    const alignClass = (styleType === 'numeric' || style === 'numeric') ? 'text-right' : (styleType === 'status' || style === 'status') ? 'text-center' : 'text-left';
    const domStyle = typeof style === 'object' && style !== null ? style : undefined;
    return (
      <th
        ref={ref}
        style={domStyle}
        className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 ${alignClass} ${className}`}
        {...props}
      >
        {children}
      </th>
    );
  },
);

TableHeadCell.displayName = 'TableHeadCell';

export interface TableRowCellProps extends Omit<React.HTMLAttributes<HTMLTableRowElement>, 'style'> {
  children: React.ReactNode;
  className?: string;
  style?: any;
  styleType?: 'primary' | 'numeric' | 'status';
  align?: 'start' | 'center' | 'end';
}

export const TableRowCell = React.forwardRef<HTMLTableRowElement, TableRowCellProps>(
  ({ children, className = '', styleType, style, align = 'start', ...props }, ref) => {
    const domStyle = typeof style === 'object' && style !== null ? style : undefined;
    return (
      <tr
        ref={ref}
        style={domStyle}
        className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${className}`}
        {...props}
      >
        {React.Children.map(children, (child, idx) => (
          <td key={idx} className="px-4 py-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 align-middle">
            {child}
          </td>
        ))}
      </tr>
    );
  },
);

TableRowCell.displayName = 'TableRowCell';

export const TableSection = {
  head: ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <thead className={className}>
      <tr>{children}</tr>
    </thead>
  ),
  body: ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${className}`}>{children}</tbody>
  ),
};

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  className?: string;
  children: React.ReactNode;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  compact?: boolean;
  responsive?: boolean;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className = '', children, striped = true, bordered = true, hover = true, compact = false, responsive = true, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table
          ref={ref}
          className={`min-w-full text-left border-collapse ${className}`}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
);

Table.displayName = 'Table';
