import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  ShieldCheck, 
  Filter
} from 'lucide-react';
import { ResourceConfig } from '../types';
import { SensitiveDataModal } from './SensitiveDataModal';

interface ResourceTableProps<T> {
  config: ResourceConfig<T>;
  data: T[];
  loading?: boolean;
  actions?: (item: T) => React.ReactNode;
  onRefresh?: () => void;
}

export function ResourceTable<T extends { id?: string | number }>({
  config,
  data,
  loading = false,
  actions,
  onRefresh
}: ResourceTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(config.defaultSort?.key || null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(config.defaultSort?.direction || 'desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sensitive reveal modal state
  const [revealingField, setRevealingField] = useState<{
    resource: string;
    resourceId: string;
    fieldName: string;
  } | null>(null);

  // Cache for revealed values: key `${resource}:${resourceId}:${fieldName}` -> revealed string
  const [revealedCache, setRevealedCache] = useState<Record<string, string>>({});

  // 1. Filter & Search
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const searchKeys = config.searchKeys || config.columns.map(c => String(c.key));
        const matches = searchKeys.some(key => {
          const val = (item as any)[key];
          if (val === undefined || val === null) return false;
          return String(val).toLowerCase().includes(query);
        });
        if (!matches) return false;
      }

      // Active filters
      for (const [fKey, fVal] of Object.entries(activeFilters)) {
        if (!fVal) continue;
        const itemVal = String((item as any)[fKey] || '');
        if (itemVal !== fVal) return false;
      }

      return true;
    });
  }, [data, searchTerm, activeFilters, config]);

  // 2. Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortDir]);

  // 3. Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleExportCSV = () => {
    if (!sortedData.length) return;

    const headers = config.columns.map(c => c.header).join(',');
    const rows = sortedData.map(item => {
      return config.columns.map(c => {
        const val = (item as any)[c.key];
        const str = val === undefined || val === null ? '' : String(val);
        // Escape CSV values
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${config.name}_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 shadow-lg">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Qidirish..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Filters & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {config.filters?.map(f => (
            <div key={f.key} className="flex items-center space-x-1">
              <select
                value={activeFilters[f.key] || ''}
                onChange={(e) => {
                  setActiveFilters(prev => ({ ...prev, [f.key]: e.target.value }));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">{f.label}: Hammasi</option>
                {f.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}

          {config.allowExport !== false && (
            <button
              onClick={handleExportCSV}
              disabled={!sortedData.length}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
              title="CSV formatida yuklab olish"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Eksport CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700">
              <tr>
                {config.columns.map(col => {
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={String(col.key)}
                      className={`px-5 py-3.5 font-semibold ${col.sortable !== false ? 'cursor-pointer hover:text-white select-none' : ''}`}
                      onClick={() => col.sortable !== false && handleSort(String(col.key))}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{col.header}</span>
                        {col.sortable !== false && (
                          <span className="text-slate-500">
                            {isSorted ? (
                              sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-400" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                {actions && <th className="px-5 py-3.5 text-right font-semibold">Amallar</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={config.columns.length + (actions ? 1 : 0)} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Ma'lumotlar yuklanmoqda...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={config.columns.length + (actions ? 1 : 0)} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Filter className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-300">Ma'lumot topilmadi</p>
                      <p className="text-xs text-slate-500">Qidiruv yoki filtrlarni o'zgartirib ko'ring</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, rowIdx) => (
                  <tr key={(item as any).id || rowIdx} className="hover:bg-slate-700/40 transition-colors">
                    {config.columns.map(col => {
                      const colKey = String(col.key);
                      const rawValue = (item as any)[colKey];
                      const cacheKey = `${config.name}:${(item as any).id || rowIdx}:${colKey}`;
                      const isRevealed = Boolean(revealedCache[cacheKey]);

                      return (
                        <td key={colKey} className="px-5 py-3.5 whitespace-nowrap">
                          {col.render ? (
                            col.render(item)
                          ) : col.isSensitive && !isRevealed ? (
                            <button
                              onClick={() => {
                                setRevealingField({
                                  resource: config.name,
                                  resourceId: String((item as any).id || rowIdx),
                                  fieldName: colKey
                                });
                              }}
                              className="group flex items-center space-x-1.5 bg-slate-900/80 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-500/50 px-2.5 py-1 rounded-md text-xs font-mono text-amber-300 transition-all"
                              title="Sezgir ma'lumot. Ochish uchun bosing"
                            >
                              <span>{rawValue || '*** ***'}</span>
                              <Eye className="w-3 h-3 text-amber-400/70 group-hover:text-amber-300" />
                            </button>
                          ) : isRevealed ? (
                            <span className="flex items-center space-x-1 font-mono text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-700/50 px-2 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>{revealedCache[cacheKey]}</span>
                            </span>
                          ) : (
                            <span className="text-slate-200">
                              {rawValue !== undefined && rawValue !== null ? String(rawValue) : '-'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {actions && (
                      <td className="px-5 py-3.5 text-right whitespace-nowrap text-xs">
                        {actions(item)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 bg-slate-900/90 border-t border-slate-700 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Ko'rsatilmoqda: {sortedData.length ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, sortedData.length)} dan {sortedData.length} ta yozuv</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 focus:outline-none"
            >
              <option value="10">10 / sahifa</option>
              <option value="25">25 / sahifa</option>
              <option value="50">50 / sahifa</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-medium text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sensitive Reveal Modal */}
      {revealingField && (
        <SensitiveDataModal
          isOpen={Boolean(revealingField)}
          onClose={() => setRevealingField(null)}
          resource={revealingField.resource}
          resourceId={revealingField.resourceId}
          fieldName={revealingField.fieldName}
          onRevealed={(value) => {
            const key = `${revealingField.resource}:${revealingField.resourceId}:${revealingField.fieldName}`;
            setRevealedCache(prev => ({ ...prev, [key]: value }));
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}

