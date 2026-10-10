import { useEffect, useState } from 'react'
import BaseTable from './components/shared/BaseTable'
import type { Column, SortDirection } from './components/shared/BaseTable'
import FloatingLabelInput from './components/shared/FloatingLabelInput'
import { INITIAL_FORM, USERS } from './dummyData'
import type { User } from './dummyData'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const SunIcon = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

const MoonIcon = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
)

const STATUS_STYLES: Record<User['status'], string> = {
  Online:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  Offline:
    'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
  Archived:
    'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-400/20',
}

const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'Name',
    sortValue: (u) => u.name,
    cell: (u) => (
      <span className="font-medium text-gray-900 dark:text-white">
        {u.name}
      </span>
    ),
  },
  {
    key: 'email',
    header: 'Email',
    sortValue: (u) => u.email,
    cell: (u) => u.email,
  },
  {
    key: 'position',
    header: 'Position',
    sortValue: (u) => u.position,
    hideBelow: 'md',
    cell: (u) => u.position,
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (u) => u.status,
    cell: (u) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[u.status]}`}
      >
        {u.status}
      </span>
    ),
  },
]

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string>()
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const [form, setForm] = useState(INITIAL_FORM)
  const emailInvalid = form.email !== '' && !form.email.includes('@')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const query = search.trim().toLowerCase()
  const filtered = query
    ? USERS.filter((u) =>
        `${u.name} ${u.email} ${u.position}`.toLowerCase().includes(query),
      )
    : USERS

  const sortCol = columns.find((c) => c.key === sortKey)
  const sorted = sortCol?.sortValue
    ? [...filtered].sort((a, b) => {
        const av = sortCol.sortValue!(a)
        const bv = sortCol.sortValue!(b)
        const factor = sortDir === 'asc' ? 1 : -1
        if (typeof av === 'number' && typeof bv === 'number') {
          return (av - bv) * factor
        }
        return String(av).localeCompare(String(bv), undefined, { numeric: true }) * factor
      })
    : filtered

  const rows = sorted.slice((page - 1) * pageSize, page * pageSize)

  const handleExport = () => {
    const csv = [
      'id,name,email,position,status',
      ...sorted.map((u) => [u.id, u.name, u.email, u.position, u.status].join(',')),
    ].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-8 dark:bg-gray-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Reusable components
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Live preview of the shared components, fed with dummy data.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={
              theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            }
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 shadow-xs transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            FloatingLabelInput
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <FloatingLabelInput
              label="Full Name"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              // hint="Your full name."
            />
            <FloatingLabelInput
              label="Email Address"
              type="email"
              name="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={emailInvalid ? 'Enter a valid email address.' : undefined}
              // hint="We'll never share your email."
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Base Table
          </h2>
          <BaseTable
            columns={columns}
            rows={rows}
            getRowId={(u) => u.id}
            total={sorted.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            search={search}
            onSearchChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            searchPlaceholder="Search users…"
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={(key, dir) => {
              setSortKey(key)
              setSortDir(dir)
              setPage(1)
            }}
            onExport={handleExport}
            onFilter={() => alert('Open your filter panel here')}
            onView={(u) => alert(`View ${u.name}`)}
            onEdit={(u) => alert(`Edit ${u.name}`)}
            onDelete={(u) => alert(`Delete ${u.name}`)}
          />
        </section>
      </div>
    </main>
  )
}

export default App
