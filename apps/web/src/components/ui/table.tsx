import * as React from 'react';

export interface TableHeadCellProps {
  children: React.ReactNode;
  className?: string;
  style?: 'primary' | 'numeric' | 'date' | 'status';
}

export const TableHeadCell = React.forwardRef<HTMLthElement, TableHeadCellProps>(
  ({ children, className, style, ...props }) => {
    const styleClass = {
      primary: 'text-left font-medium text-slate-600 uppercase text-sm tracking-wider',
      numeric: 'text-right font-medium text-slate-600 uppercase text-sm',
      date: 'text-left font-medium text-slate-600 uppercase text-sm',
      status: 'text-center font-medium text-slate-600 uppercase text-sm',
    }[style] || 'text-left font-medium text-slate-600 uppercase text-sm';

    return <th className={className} style={props.style} {...props} className={`p-3 ${styleClass}`}>{children}</th>;
  },
);

TableHeadCell.displayName = 'TableHeadCell';

export interface TableRowCellProps {
  children: React.ReactNode;
  className?: string;
  style?: 'primary' | 'numeric' | 'status';
  align?: 'start' | 'center' | 'end';
}

export const TableRowCell = React.forwardRef<tdElement, TableRowCellProps>(
  ({ children, className, style, align = 'start', ...props }) => {
    const styleClass = {
      primary: 'font-normal text-slate-700',
      numeric: 'font-normal text-slate-700 text-right',
      status: 'font-normal text-slate-700 text-center',
    }[style] || 'font-normal text-slate-700';

    const alignClass = {
      start: '',
      center: 'text-center',
      end: 'text-end',
    }[align] || '';

    return <td className={className} style={props.style} {...props} className={`p-3 ${styleClass} ${alignClass}`}>{children}</td>;
  },
);

TableRowCell.displayName = 'TableRowCell';

export interface TableProps {
  className?: string;
  children: React.ReactNode;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  compact?: boolean;
  responsive?: boolean;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, striped = true, bordered = true, hover = true, compact = false, responsive = true, ...props }, ref) => {
    const tableClasses = [
      'min-w-full',
      bordered && 'border',
      striped && 'bg-white divide-y divide-slate-100',
      hover && 'hover:bg-slate-50',
      compact && 'text-sm',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <table
        ref={ref}
        className={className}
        style={{ width: '100%', borderCollapse: 'separate' }}
        {...props}
      >
        <thead>
          <tr>
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && child.props?.type === 'head') {
                return child;
              }
              return child;
            })}
          </tr>
        </thead>
        <tbody>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.props?.type === 'body') {
              return child;
            }
            return child;
          })}
        </tbody>
      </table>
    );
  },
);

Table.displayName = 'Table';

// Helper component for table with head and body sections
export const TableSection = {
  head: (children: React.ReactNode) => (
    <thead>
      <tr>
        {React.isValidElement(children) ? children : <>{children}</>
      </tr>
    </thead>
  ),
  body: (children: React.ReactNode) => (
    <tbody>
      {React.isValidElement(children) ? children : <>{children}</>
    </tbody>
  ),
};