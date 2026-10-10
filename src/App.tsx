import { useEffect, useState } from 'react'
import BaseTable from './components/shared/BaseTable'
import type { Column, SortDirection } from './components/shared/BaseTable'
import FloatingLabelInput from './components/shared/FloatingLabelInput'
import Select from './components/shared/Select'
import MultiSelect from './components/shared/MultiSelect'
import SimpleTable from './components/shared/SimpleTable'
import type { SimpleColumn } from './components/shared/SimpleTable'
import BarChart from './components/shared/BarChart'
import PieChart from './components/shared/PieChart'
import BarChartBreakdown from './components/shared/BarChartBreakdown'
import StatCard, {
  ClockIcon,
  LogOutIcon,
  UserCheckIcon,
  UsersIcon,
} from './components/shared/StatCard'
import {
  COUNTRY_OPTIONS,
  INITIAL_FORM,
  MONTHLY_SALES,
  POSITIONS,
  REVENUE_BREAKDOWN,
  ROLE_OPTIONS,
  SKILL_OPTIONS,
  STATS,
  STATUSES,
  TRAFFIC_SOURCES,
  USERS,
  WEEKLY_VISITS,
} from './dummyData'
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

const POSITION_OPTIONS = POSITIONS.map((p) => ({ value: p, label: p }))
const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s, label: s }))

type UserFilters = {
  name: string
  position: string | null
  status: User['status'] | null
}

const EMPTY_FILTERS: UserFilters = { name: '', position: null, status: null }

const STAT_ICONS = {
  users: <UsersIcon />,
  'user-check': <UserCheckIcon />,
  clock: <ClockIcon />,
  logout: <LogOutIcon />,
} as const

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

const simpleColumns: SimpleColumn<User>[] = [
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
  // `filters` = what's being edited in the drawer, `appliedFilters` = what the
  // table actually uses (only updated when "Apply filters" is clicked).
  const [filters, setFilters] = useState<UserFilters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>(EMPTY_FILTERS)

  const activeFilterCount =
    (appliedFilters.name ? 1 : 0) +
    (appliedFilters.position ? 1 : 0) +
    (appliedFilters.status ? 1 : 0)

  const [form, setForm] = useState(INITIAL_FORM)
  const emailInvalid = form.email !== '' && !form.email.includes('@')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const query = search.trim().toLowerCase()
  const filtered = USERS.filter((u) => {
    if (query && !`${u.name} ${u.email} ${u.position}`.toLowerCase().includes(query)) {
      return false
    }
    if (appliedFilters.name && !u.name.toLowerCase().includes(appliedFilters.name.toLowerCase())) {
      return false
    }
    if (appliedFilters.position && u.position !== appliedFilters.position) return false
    if (appliedFilters.status && u.status !== appliedFilters.status) return false
    return true
  })

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
            Stat Cards
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <StatCard
                key={stat.id}
                title={stat.title}
                count={stat.count}
                tone={stat.tone}
                icon={STAT_ICONS[stat.icon]}
                badges={stat.badges}
              />
            ))}
          </div>
        </section>

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
            Select
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <Select
              label="Role"
              name="role"
              required
              options={ROLE_OPTIONS}
              value={form.role}
              onChange={(role) => setForm({ ...form, role })}
              hint="Choose a role for the invited member."
            />
            <Select
              label="Country"
              name="country"
              options={COUNTRY_OPTIONS}
              value={form.country}
              onChange={(country) => setForm({ ...form, country })}
              hint="Some options can be disabled."
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            MultiSelect
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <MultiSelect
              label="Skills"
              name="skills"
              options={SKILL_OPTIONS}
              value={form.skills}
              onChange={(skills) => setForm({ ...form, skills })}
              maxVisibleChips={3}
              error={
                form.skills.length > 5
                  ? 'Pick at most 5 skills.'
                  : undefined
              }
              hint="Selected values show as chips."
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Simple Table
          </h2>
          <SimpleTable
            columns={simpleColumns}
            rows={USERS}
            getRowId={(u) => u.id}
            defaultPageSize={10}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bar Chart
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <BarChart
                title="Monthly Revenue"
                subtitle="Jan – Dec"
                data={MONTHLY_SALES}
                height={340}
                barColor="#6366f1"
              />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <BarChart
                title="Weekly Visitors"
                subtitle="Mon – Sun"
                data={WEEKLY_VISITS}
                height={340}
                barColor="#10b981"
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bar Chart Breakdown
          </h2>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <BarChartBreakdown
              title="Monthly Revenue by Channel"
              subtitle="Stacked by sales channel"
              categories={REVENUE_BREAKDOWN.categories}
              series={REVENUE_BREAKDOWN.series}
              height={360}
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pie Chart
          </h2>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <PieChart
              title="Traffic Sources"
              subtitle="Last 30 days"
              data={TRAFFIC_SOURCES}
              height={360}
              radius={['40%', '70%']}
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
            filterCount={activeFilterCount}
            filterTitle="Filter users"
            filterContent={() => (
              <div className="flex flex-col gap-6">
                <FloatingLabelInput
                  label="Name contains"
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                />
                <Select
                  label="Position"
                  options={POSITION_OPTIONS}
                  value={filters.position}
                  onChange={(position) => setFilters({ ...filters, position })}
                />
                <Select
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={filters.status}
                  onChange={(status) =>
                    setFilters({ ...filters, status: status as User['status'] | null })
                  }
                />
              </div>
            )}
            filterFooter={({ close }) => (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFilters(EMPTY_FILTERS)
                    setAppliedFilters(EMPTY_FILTERS)
                    setPage(1)
                    close()
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedFilters(filters)
                    setPage(1)
                    close()
                  }}
                  className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-hidden"
                >
                  Apply filters
                </button>
              </div>
            )}
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
