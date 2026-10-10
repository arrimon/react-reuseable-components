import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Drawer from "./Drawer";

/**
 * Tailwind CSS v4
 * @import "tailwindcss";
 * Dark mode follows the OS by default. To toggle with a `.dark` class instead:
 * @custom-variant dark (&:where(.dark, .dark *));
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type SortDirection = "asc" | "desc";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /**
   * Provide a value getter to make this column sortable. The returned value is
   * used for local sorting when the table is uncontrolled (no `onSortChange`).
   */
  sortValue?: (row: T) => string | number;
  /** Hide this column on screens narrower than the given breakpoint */
  hideBelow?: "sm" | "md" | "lg";
  /** Extra classes for both th and td */
  className?: string;
}

export interface BaseTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;

  /** Total number of records on the backend (not just this page) */
  total: number;
  /** Current page, 1-based */
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  /** Current search value held by the parent (used to avoid duplicate calls) */
  search?: string;
  /** Debounced (300ms) search callback */
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  onExport?: () => void;
  onFilter?: () => void;
  /** Number of active filters, shown as a badge on the Filter button */
  filterCount?: number;
  /**
   * Filter panel content. When provided, the Filter button opens a Drawer
   * containing it. Receives a `close` helper so the content can dismiss itself.
   */
  filterContent?: (api: { close: () => void }) => ReactNode;
  /** Optional footer for the filter drawer (e.g. Reset / Apply buttons). */
  filterFooter?: (api: { close: () => void }) => ReactNode;
  /** Title shown at the top of the filter drawer. Default: "Filters" */
  filterTitle?: string;

  /** Controlled sort column key. Pair with `onSortChange` for server-side sorting. */
  sortKey?: string;
  /** Controlled sort direction. Defaults to "asc". */
  sortDir?: SortDirection;
  /**
   * Called when a sortable header is activated. When provided, the table does
   * not sort locally — the parent is expected to sort/fetch the sorted data.
   */
  onSortChange?: (key: string, direction: SortDirection) => void;

  onSelectionChange?: (selectedIds: string[]) => void;
  /** Row actions (shown as pencil / eye / delete icons in the Action column) */
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;

  /** Number of rows that fit in the fixed-height body. Default: 10 */
  visibleRows?: number;

  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Fixed layout metrics (px). Body height = visibleRows * ROW_HEIGHT */
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 48;

const HIDE_BELOW = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

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

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

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

const SearchIcon = () => (
  <svg {...iconProps}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const DownloadIcon = () => (
  <svg {...iconProps}>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);
const FilterIcon = () => (
  <svg {...iconProps}>
    <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />
  </svg>
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
const PencilIcon = () => (
  <svg {...iconProps}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const EyeIcon = () => (
  <svg {...iconProps}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const TrashIcon = () => (
  <svg {...iconProps}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

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

const toolbarButton =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-hidden sm:flex-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700";

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Show the label as visible text next to the checkbox */
  showLabel?: boolean;
}

function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  showLabel = false,
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className="inline-flex items-center gap-2">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 cursor-pointer rounded-sm accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-hidden dark:accent-indigo-500"
      />
      <label
        htmlFor={id}
        className={
          showLabel
            ? "cursor-pointer text-xs font-semibold tracking-wide whitespace-nowrap uppercase select-none"
            : "sr-only"
        }
      >
        {label}
      </label>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger";
  children: ReactNode;
}

function ActionButton({ label, onClick, tone = "default", children }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg transition-colors",
        "focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-hidden",
        tone === "danger"
          ? "text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-indigo-400",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* BaseTable                                                           */
/* ------------------------------------------------------------------ */

export default function BaseTable<T>({
  columns,
  rows,
  getRowId,
  total,
  page,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  search = "",
  onSearchChange,
  searchPlaceholder = "Search…",
  onExport,
  onFilter,
  filterCount = 0,
  filterContent,
  filterFooter,
  filterTitle = "Filters",
  sortKey,
  sortDir = "asc",
  onSortChange,
  onSelectionChange,
  onView,
  onEdit,
  onDelete,
  visibleRows = 10,
  loading = false,
  emptyMessage = "No results found.",
  className,
}: BaseTableProps<T>) {
  /* ---- search (debounced) ---- */
  const [query, setQuery] = useState(search);

  useEffect(() => setQuery(search), [search]);

  useEffect(() => {
    if (query === search) return;
    const t = setTimeout(() => onSearchChange?.(query), 300);
    return () => clearTimeout(t);
  }, [query, search, onSearchChange]);

  /* ---- filter drawer ---- */
  const [filterOpen, setFilterOpen] = useState(false);
  const closeFilter = () => setFilterOpen(false);

  /* ---- sorting ---- */
  const [internalSort, setInternalSort] = useState<{
    key: string;
    dir: SortDirection;
  } | null>(null);

  const controlledSort = sortKey !== undefined;
  const activeKey = controlledSort ? sortKey : internalSort?.key;
  const activeDir = controlledSort ? sortDir : internalSort?.dir;

  const handleSort = (col: Column<T>) => {
    if (!col.sortValue) return;
    const dir: SortDirection =
      activeKey === col.key && activeDir === "asc" ? "desc" : "asc";
    if (onSortChange) onSortChange(col.key, dir);
    else setInternalSort({ key: col.key, dir });
  };

  const sortedRows = useMemo(() => {
    if (controlledSort || !activeKey || !activeDir) return rows;
    const col = columns.find((c) => c.key === activeKey);
    if (!col?.sortValue) return rows;
    const getVal = col.sortValue;
    const factor = activeDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * factor;
      }
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * factor;
    });
  }, [rows, columns, activeKey, activeDir, controlledSort]);

  /* ---- selection (kept across pages) ---- */
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const updateSelection = (next: Set<string>) => {
    setSelected(next);
    onSelectionChange?.(Array.from(next));
  };

  const pageIds = useMemo(() => sortedRows.map(getRowId), [sortedRows, getRowId]);
  const selectedOnPage = pageIds.filter((id) => selected.has(id)).length;
  const allOnPage = pageIds.length > 0 && selectedOnPage === pageIds.length;
  const someOnPage = selectedOnPage > 0 && !allOnPage;

  const toggleAllOnPage = (checked: boolean) => {
    const next = new Set(selected);
    pageIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
    updateSelection(next);
  };

  const toggleRow = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    updateSelection(next);
  };

  /* ---- pagination maths ---- */
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = getPageList(page, totalPages);

  // The selection checkbox column is always the first (left-most) column.
  const checkboxOnLeft = true;
  const colSpan = columns.length + 2; // checkbox + action columns

  /* ---- fixed-height body ---- */
  const bodyHeight = HEADER_HEIGHT + visibleRows * ROW_HEIGHT;

  const thBase =
    "sticky top-0 z-10 h-12 border-b border-gray-200 bg-gray-50 px-4 text-start align-middle whitespace-nowrap sm:px-6 dark:border-gray-800 dark:bg-gray-800";

  const headerCheckbox = (
    <th
      scope="col"
      className="sticky top-0 z-10 h-12 w-10 border-b border-gray-200 bg-gray-50 px-2 text-start align-middle sm:px-3 dark:border-gray-800 dark:bg-gray-800"
    >
      <Checkbox
        checked={allOnPage}
        indeterminate={someOnPage}
        onChange={toggleAllOnPage}
        label="Select All"
      />
    </th>
  );

  const actionHeader = (
    <th scope="col" className={cn(thBase, "w-36 text-center")}>
      Action
    </th>
  );

  return (
    <section
      className={cn(
        "w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs",
        "dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
    >
      {/* ---------------- Toolbar ---------------- */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-gray-400 dark:text-gray-500">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search table"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 ps-9 pe-3 text-sm text-gray-900 shadow-xs transition-colors outline-hidden placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-indigo-400"
          />
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <button type="button" onClick={onExport} className={toolbarButton}>
            <DownloadIcon />
            Export
          </button>
          <button
            type="button"
            onClick={() => {
              if (filterContent) setFilterOpen(true);
              else onFilter?.();
            }}
            className={toolbarButton}
          >
            <FilterIcon />
            Filter
            {filterCount > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white">
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ---------------- Selection bar ---------------- */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 border-y border-indigo-100 bg-indigo-50 px-4 py-2 text-sm text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
          <span>
            <strong className="font-semibold">{selected.size.toLocaleString()}</strong> selected
          </span>
          <button
            type="button"
            onClick={() => updateSelection(new Set())}
            className="font-medium hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* ---------------- Table (fixed height, inner scroll) ---------------- */}
      <div
        className="overflow-auto border-t border-gray-200 [scrollbar-color:var(--color-gray-300)_transparent] [scrollbar-width:thin] dark:border-gray-800 dark:[scrollbar-color:var(--color-gray-600)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb:hover]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-500 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600"
        style={{ height: bodyHeight }}
      >
        <table className="w-full min-w-full border-separate border-spacing-0 text-start text-sm text-gray-600 dark:text-gray-300">
          <thead className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
            <tr>
              {checkboxOnLeft && headerCheckbox}
              {columns.map((col) => {
                const sortable = Boolean(col.sortValue);
                const active = activeKey === col.key;
                const dir = active ? (activeDir ?? "asc") : null;

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
              {!checkboxOnLeft && headerCheckbox}
              {actionHeader}
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: visibleRows }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse" style={{ height: ROW_HEIGHT }}>
                  {checkboxOnLeft && (
                    <td className="border-b border-gray-200 px-2 sm:px-3 dark:border-gray-800">
                      <div className="size-3.5 rounded-sm bg-gray-200 dark:bg-gray-700" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "border-b border-gray-200 px-4 sm:px-6 dark:border-gray-800",
                        col.hideBelow && HIDE_BELOW[col.hideBelow],
                      )}
                    >
                      <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                    </td>
                  ))}
                  {!checkboxOnLeft && (
                    <td className="border-b border-gray-200 px-2 sm:px-3 dark:border-gray-800">
                      <div className="size-3.5 rounded-sm bg-gray-200 dark:bg-gray-700" />
                    </td>
                  )}
                  <td className="border-b border-gray-200 px-4 dark:border-gray-800">
                    <div className="mx-auto h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                </tr>
              ))}

            {!loading && sortedRows.length === 0 && (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-6 text-center text-gray-500 dark:text-gray-400"
                  style={{ height: visibleRows * ROW_HEIGHT }}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!loading &&
              sortedRows.map((row) => {
                const id = getRowId(row);
                const isSelected = selected.has(id);
                const cellBorder = "border-b border-gray-200 dark:border-gray-800";

                const checkboxCell = (
                  <td className={cn("w-10 px-2 sm:px-3", cellBorder)}>
                    <Checkbox
                      checked={isSelected}
                      onChange={(checked) => toggleRow(id, checked)}
                      label={`Select row ${id}`}
                    />
                  </td>
                );

                return (
                  <tr
                    key={id}
                    style={{ height: ROW_HEIGHT }}
                    className={cn(
                      "transition-colors",
                      isSelected
                        ? "bg-indigo-50/60 dark:bg-indigo-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                    )}
                  >
                    {checkboxOnLeft && checkboxCell}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 sm:px-6",
                          cellBorder,
                          col.hideBelow && HIDE_BELOW[col.hideBelow],
                          col.className,
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                    {!checkboxOnLeft && checkboxCell}
                    <td className={cn("w-36 px-4", cellBorder)}>
                      <div className="flex items-center justify-center gap-1">
                        <ActionButton label="Edit" onClick={() => onEdit?.(row)}>
                          <PencilIcon />
                        </ActionButton>
                        <ActionButton label="View" onClick={() => onView?.(row)}>
                          <EyeIcon />
                        </ActionButton>
                        <ActionButton label="Delete" tone="danger" onClick={() => onDelete?.(row)}>
                          <TrashIcon />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

          {onPageSizeChange && (
            <>
              <span className="hidden text-gray-300 sm:inline dark:text-gray-700">|</span>
              <label className="inline-flex items-center gap-1">
                <span className="hidden sm:inline">Rows per page</span>
                <span className="relative inline-flex items-center">
                  <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
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
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-1 sm:justify-end">
          <PageButton
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </PageButton>

          {/* Compact indicator on mobile */}
          <span className="px-2 text-sm text-gray-500 sm:hidden dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">{page}</span> /{" "}
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
                    onClick={() => onPageChange(p)}
                    active={p === page}
                    disabled={loading}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </PageButton>
                </li>
              ),
            )}
          </ul>

          <PageButton
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            aria-label="Next page"
          >
            <ChevronRight />
          </PageButton>
        </div>
      </nav>

      {filterContent && (
        <Drawer
          isOpen={filterOpen}
          onClose={closeFilter}
          title={filterTitle}
          footer={filterFooter?.({ close: closeFilter })}
        >
          {filterContent({ close: closeFilter })}
        </Drawer>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

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