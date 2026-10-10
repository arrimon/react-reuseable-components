import { useState } from "react";
import type { ReactNode } from "react";

/**
 * SimpleTable — a minimal data table.
 *
 * Just columns + rows, styled like BaseTable, but with none of the extras:
 * no search bar, no export/filter buttons, no selection checkbox column and
 * no action column. Sorting is optional per column (supply `sortValue`) and is
 * done locally inside the component.
 *
 * Pagination matches BaseTable's footer: "Showing x – y of total", a rows-per-
 * page select and numbered page buttons. Page state is managed internally.
 *
 * Tailwind CSS v4
 *   @import "tailwindcss";
 *   @custom-variant dark (&:where(.dark, .dark *));
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type SortDirection = "asc" | "desc";

export interface SimpleColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Provide a value getter to make this column sortable (local sorting). */
  sortValue?: (row: T) => string | number;
  /** Hide this column on screens narrower than the given breakpoint */
  hideBelow?: "sm" | "md" | "lg";
  /** Extra classes for both th and td */
  className?: string;
}

export interface SimpleTableProps<T> {
  columns: SimpleColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Rows per page. Default: 10 */
  defaultPageSize?: number;
  /** Options offered in the rows-per-page select. Default: [10, 25, 50, 100] */
  pageSizeOptions?: number[];
  /**
   * Rows that fit in the fixed-height body before it scrolls. Default: 10
   * (same as BaseTable).
   */
  visibleRows?: number;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const HIDE_BELOW = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

/** Fixed layout metrics (px). Body height = visibleRows * ROW_HEIGHT */
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 48;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getPageList(page: number, totalPages: number): Array<number | "…"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: Array<number | "…"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const SortIcon = ({ dir }: { dir: SortDirection | null }) => (
  <span className="inline-flex shrink-0 flex-col -space-y-1" aria-hidden="true">
    <svg
      {...iconProps}
      width={12}
      height={12}
      className={
        dir === "asc"
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-gray-400 transition-colors group-hover:text-gray-600 dark:text-gray-600 dark:group-hover:text-gray-400"
      }
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
    <svg
      {...iconProps}
      width={12}
      height={12}
      className={
        dir === "desc"
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-gray-400 transition-colors group-hover:text-gray-600 dark:text-gray-600 dark:group-hover:text-gray-400"
      }
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </span>
);

const ChevronLeft = () => (
  <svg {...iconProps}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg {...iconProps}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const ChevronDown = () => (
  <svg {...iconProps} width={14} height={14}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

interface PageButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  "aria-label"?: string;
  "aria-current"?: "page";
}

function PageButton({ children, onClick, disabled, active, ...aria }: PageButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...aria}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors",
        "focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-hidden",
        "disabled:pointer-events-none disabled:opacity-40",
        active
          ? "bg-indigo-500/10 font-semibold text-indigo-600 ring-1 ring-indigo-500/25 ring-inset dark:bg-indigo-400/15 dark:text-indigo-300 dark:ring-indigo-400/30"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* SimpleTable                                                         */
/* ------------------------------------------------------------------ */

export default function SimpleTable<T>({
  columns,
  rows,
  getRowId,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  visibleRows = 10,
  loading = false,
  emptyMessage = "No data available.",
  className,
}: SimpleTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: SortDirection } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const handleSort = (col: SimpleColumn<T>) => {
    if (!col.sortValue) return;
    setSort((prev) =>
      prev?.key === col.key && prev.dir === "asc"
        ? { key: col.key, dir: "desc" }
        : { key: col.key, dir: "asc" },
    );
    setPage(1);
  };

  const sortedRows = (() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const getVal = col.sortValue;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * factor;
      }
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * factor;
    });
  })();

  /* ---- pagination maths (page clamped so it can't run past the end) ---- */
  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);
  const pages = getPageList(current, totalPages);
  const pageRows = sortedRows.slice((current - 1) * pageSize, current * pageSize);

  /* ---- fixed-height body (scrolls when there are more rows than fit) ---- */
  const bodyHeight = HEADER_HEIGHT + visibleRows * ROW_HEIGHT;

  const thBase =
    "sticky top-0 z-10 h-12 border-b border-gray-200 bg-gray-50 px-4 text-start align-middle whitespace-nowrap sm:px-6 dark:border-gray-800 dark:bg-gray-800";

  return (
    <section
      className={cn(
        "w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs",
        "dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
    >
      <div
        className="overflow-auto [scrollbar-color:var(--color-gray-300)_transparent] [scrollbar-width:thin] dark:[scrollbar-color:var(--color-gray-600)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb:hover]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-500 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600"
        style={{ height: bodyHeight }}
      >
        <table className="w-full min-w-full border-separate border-spacing-0 text-start text-sm text-gray-600 dark:text-gray-300">
          <thead className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
            <tr>
              {columns.map((col) => {
                const sortable = Boolean(col.sortValue);
                const active = sort?.key === col.key;
                const dir = active ? sort.dir : null;

                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      sortable
                        ? active
                          ? dir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                        : undefined
                    }
                    className={cn(
                      thBase,
                      col.hideBelow && HIDE_BELOW[col.hideBelow],
                      col.className,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col)}
                        className="group inline-flex items-center gap-1 rounded-sm text-xs font-semibold tracking-wide uppercase transition-colors hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-hidden dark:hover:text-gray-200"
                      >
                        {col.header}
                        <SortIcon dir={dir} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: Math.min(pageSize, visibleRows) }).map((_, i) => (
                <tr
                  key={`skeleton-${i}`}
                  className="animate-pulse"
                  style={{ height: ROW_HEIGHT }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-gray-800",
                        col.hideBelow && HIDE_BELOW[col.hideBelow],
                      )}
                    >
                      <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 text-center text-gray-500 dark:text-gray-400"
                  style={{ height: visibleRows * ROW_HEIGHT }}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!loading &&
              pageRows.map((row) => (
                <tr
                  key={getRowId(row)}
                  style={{ height: ROW_HEIGHT }}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-gray-800",
                        col.hideBelow && HIDE_BELOW[col.hideBelow],
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ---------------- Footer: counts + pagination ---------------- */}
      <nav
        aria-label="Table pagination"
        className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Showing{" "}
            <span className="font-normal text-gray-900 dark:text-white">
              {from.toLocaleString()} – {to.toLocaleString()}
            </span>{" "}
            of{" "}
            <span className="font-normal text-gray-900 dark:text-white">
              {total.toLocaleString()}
            </span>
          </p>

          <span className="hidden text-gray-300 sm:inline dark:text-gray-700">|</span>
          <label className="inline-flex items-center gap-1">
            <span className="hidden sm:inline">Rows per page</span>
            <span className="relative inline-flex items-center">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                aria-label="Rows per page"
                className="cursor-pointer appearance-none rounded-md bg-transparent py-0.5 ps-2 pe-6 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-hidden dark:text-white dark:hover:bg-gray-800"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 end-1 flex items-center text-gray-400 dark:text-gray-500">
                <ChevronDown />
              </span>
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-1 sm:justify-end">
          <PageButton
            onClick={() => setPage(current - 1)}
            disabled={current <= 1 || loading}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </PageButton>

          {/* Compact indicator on mobile */}
          <span className="px-2 text-sm text-gray-500 sm:hidden dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">{current}</span> /{" "}
            {totalPages.toLocaleString()}
          </span>

          {/* Numbered pages on larger screens */}
          <ul className="hidden items-center gap-0.5 sm:flex">
            {pages.map((p, i) =>
              p === "…" ? (
                <li key={`gap-${i}`} className="px-2 text-gray-400 dark:text-gray-500">
                  …
                </li>
              ) : (
                <li key={p}>
                  <PageButton
                    onClick={() => setPage(p)}
                    active={p === current}
                    disabled={loading}
                    aria-label={`Page ${p}`}
                    aria-current={p === current ? "page" : undefined}
                  >
                    {p}
                  </PageButton>
                </li>
              ),
            )}
          </ul>

          <PageButton
            onClick={() => setPage(current + 1)}
            disabled={current >= totalPages || loading}
            aria-label="Next page"
          >
            <ChevronRight />
          </PageButton>
        </div>
      </nav>
    </section>
  );
}

/* ---------------------------------------------------------------
 * Usage
 * ---------------------------------------------------------------
 *
 * const columns: SimpleColumn<User>[] = [
 *   { key: "name", header: "Name", sortValue: (u) => u.name,
 *     cell: (u) => <span className="font-medium text-gray-900 dark:text-white">{u.name}</span> },
 *   { key: "email", header: "Email", sortValue: (u) => u.email, cell: (u) => u.email },
 *   { key: "status", header: "Status", cell: (u) => u.status },
 * ];
 *
 * <SimpleTable columns={columns} rows={USERS} getRowId={(u) => u.id} defaultPageSize={10} />
 */
