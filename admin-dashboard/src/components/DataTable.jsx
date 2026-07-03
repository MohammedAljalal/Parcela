import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { FiChevronLeft, FiChevronRight, FiDownload, FiFileText, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { exportToExcel, exportToPDF } from '../lib/exportUtils';

export default function DataTable({
  columns,
  data,
  isLoading,
  onDelete,
  onEdit,
  editLabel = 'Edit',
  showActions = true,
  canExport = true,
  pdfTitle,
}) {
  const [sorting, setSorting]       = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const table = useReactTable({
    data: data || [],
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: false,
  });

  const handleExportExcel = () => {
    const flatData = data.map((row) => {
      const flat = {};
      columns.forEach((col) => {
        if (col.accessorKey) flat[col.header] = row[col.accessorKey];
      });
      return flat;
    });
    exportToExcel(flatData, pdfTitle || 'export');
  };

  const handleExportPDF = () => {
    const pdfColumns = columns.filter((col) => col.header && col.accessorKey);
    exportToPDF(
      pdfColumns.map((col) => ({ header: col.header, key: col.accessorKey })),
      data,
      pdfTitle || 'export',
      pdfTitle || 'Export',
    );
  };

  if (isLoading) {
    return (
      <div className="card overflow-hidden" style={{ borderRadius: 16 }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b animate-pulse"
            style={{ borderColor: '#F2F4F8' }}
          >
            <div className="h-4 rounded-lg flex-1" style={{ background: '#E2E6EF' }} />
            <div className="h-4 rounded-lg w-24" style={{ background: '#E2E6EF' }} />
            <div className="h-4 rounded-lg w-16" style={{ background: '#E2E6EF' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="card flex flex-col items-center justify-center py-16"
        style={{ borderRadius: 16 }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: '#E8EEF9' }}
        >
          <FiFileText style={{ width: 22, height: 22, color: '#1A3FB8' }} />
        </div>
        <p className="font-display font-semibold text-sm" style={{ color: '#0D1B2A' }}>
          No records found
        </p>
        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
          Try adjusting your filters or add new data.
        </p>
      </div>
    );
  }

  const { pageIndex, pageSize } = table.getState().pagination;
  const from = pageIndex * pageSize + 1;
  const to   = Math.min((pageIndex + 1) * pageSize, data.length);

  return (
    <div className="space-y-3">
      {/* Export buttons */}
      {canExport && (
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: '#ffffff',
              border: '1px solid #E2E6EF',
              color: '#6B7280',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F2F4F8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
          >
            <FiDownload style={{ width: 14, height: 14 }} /> Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: '#ffffff',
              border: '1px solid #E2E6EF',
              color: '#6B7280',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F2F4F8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
          >
            <FiFileText style={{ width: 14, height: 14 }} /> PDF
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden" style={{ borderRadius: 16 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: '#6B7280' }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1.5 cursor-pointer select-none"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() && (
                            <span style={{ color: '#1A3FB8' }}>
                              {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                  {showActions && (
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: '#6B7280' }}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="table-row border-b transition-colors"
                  style={{ borderColor: '#F2F4F8' }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-3.5" style={{ color: '#374151' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row.original)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              background: '#E8EEF9',
                              color: '#1A3FB8',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#C9D9F2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#E8EEF9'; }}
                          >
                            {editLabel}
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row.original)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              background: '#FEF2F2',
                              color: '#EF4444',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#FECACA'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination-row flex items-center justify-between gap-3 px-1">
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Showing <span style={{ color: '#0D1B2A', fontWeight: 600 }}>{from}–{to}</span> of{' '}
          <span style={{ color: '#0D1B2A', fontWeight: 600 }}>{data.length}</span> records
        </p>

        <div className="flex items-center gap-1">
          <PagBtn onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <FiChevronsLeft style={{ width: 14, height: 14 }} />
          </PagBtn>
          <PagBtn onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <FiChevronLeft style={{ width: 14, height: 14 }} />
          </PagBtn>

          <span
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: '#E8EEF9', color: '#1A3FB8' }}
          >
            {pageIndex + 1} / {table.getPageCount()}
          </span>

          <PagBtn onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <FiChevronRight style={{ width: 14, height: 14 }} />
          </PagBtn>
          <PagBtn onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <FiChevronsRight style={{ width: 14, height: 14 }} />
          </PagBtn>
        </div>
      </div>
    </div>
  );
}

function PagBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: '#ffffff',
        border: '1px solid #E2E6EF',
        color: '#6B7280',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = '#F2F4F8'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
    >
      {children}
    </button>
  );
}
