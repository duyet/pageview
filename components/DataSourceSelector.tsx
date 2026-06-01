import { Bird, ChevronDown, Database, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { type DataSource, useDataSource } from './DataSourceContext';

const SOURCES = [
  {
    id: 'postgres' as DataSource,
    name: 'PostgreSQL',
    icon: Database,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
    hoverColor: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20',
    description: 'Neon PostgreSQL database',
  },
  {
    id: 'clickhouse' as DataSource,
    name: 'ClickHouse',
    icon: Zap,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
    hoverColor: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20',
    description: 'High-speed column store',
  },
  {
    id: 'duckdb' as DataSource,
    name: 'DuckDB',
    icon: Bird,
    color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',
    hoverColor: 'hover:bg-yellow-50/50 dark:hover:bg-yellow-950/20',
    description: 'Embedded DuckDB / MotherDuck',
  },
];

export const DataSourceSelector = () => {
  const { dataSource, setDataSource } = useDataSource();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSource = SOURCES.find((s) => s.id === dataSource) || SOURCES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative z-[60]" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all shadow-sm duration-200',
          isOpen
            ? 'border-neutral-300 bg-neutral-50 shadow-inner dark:border-neutral-700 dark:bg-neutral-800'
            : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/80',
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            'flex size-5.5 items-center justify-center rounded-lg p-0.5 shadow-sm transition-transform duration-300 group-hover:scale-105',
            activeSource.color,
          )}
        >
          <activeSource.icon className="size-4" />
        </span>
        <span className="hidden font-medium text-neutral-700 dark:text-neutral-200 md:inline">
          {activeSource.name}
        </span>
        <ChevronDown
          className={cn(
            'size-4 text-neutral-400 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl ring-1 ring-black/5 duration-150 animate-in fade-in slide-in-from-top-2 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950">
          <div className="px-3.5 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Active Analytical Source
            </span>
          </div>

          <div className="space-y-1" role="listbox">
            {SOURCES.map((source) => {
              const isSelected = source.id === dataSource;
              return (
                <button
                  key={source.id}
                  onClick={() => {
                    setDataSource(source.id);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'group flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150',
                    isSelected
                      ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                      : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
                    source.hoverColor,
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm transition-all duration-300 group-hover:scale-105',
                      source.color,
                    )}
                  >
                    <source.icon className="size-[18px]" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-semibold">
                        {source.name}
                      </span>
                      {isSelected && (
                        <span className="flex size-1.5 animate-pulse rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <span className="mt-0.5 block truncate text-xs text-neutral-400 dark:text-neutral-500">
                      {source.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
