export interface User {
  id: string
  name: string
  email: string
  position: string
  status: 'Online' | 'Offline' | 'Archived'
}

export const POSITIONS = [
  'React Developer',
  'Designer',
  'Vue Developer',
  'UI/UX Engineer',
  'SEO Specialist',
] as const

export const STATUSES: User['status'][] = ['Online', 'Offline', 'Archived']

export const USERS: User[] = Array.from({ length: 100 }, (_, i) => ({
  id: String(i + 1),
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  position: POSITIONS[i % POSITIONS.length],
  status: STATUSES[i % STATUSES.length],
}))

export interface Option {
  value: string
  label: string
  disabled?: boolean
}

export const ROLE_OPTIONS: Option[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'editor', label: 'Editor' },
  { value: 'author', label: 'Author' },
  { value: 'contributor', label: 'Contributor' },
  { value: 'subscriber', label: 'Subscriber' },
]

export const COUNTRY_OPTIONS: Option[] = [
  { value: 'bd', label: 'Bangladesh' },
  { value: 'in', label: 'India' },
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
  { value: 'br', label: 'Brazil' },
  { value: 'es', label: 'Spain', disabled: true },
]

export const SKILL_OPTIONS: Option[] = [
  { value: 'react', label: 'React' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'css', label: 'CSS' },
  { value: 'tailwind', label: 'Tailwind CSS' },
  { value: 'node', label: 'Node.js' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'testing', label: 'Testing' },
]

export const INITIAL_FORM = {
  name: '',
  email: '',
  role: null as string | null,
  country: null as string | null,
  skills: [] as string[],
}

export interface SalesPoint {
  label: string
  value: number
}

export interface SourceSlice {
  name: string
  value: number
}

/** Monthly revenue (Jan–Dec) — for the bar chart. */
export const MONTHLY_SALES: SalesPoint[] = [
  { label: 'Jan', value: 4200 },
  { label: 'Feb', value: 5100 },
  { label: 'Mar', value: 4700 },
  { label: 'Apr', value: 6300 },
  { label: 'May', value: 5900 },
  { label: 'Jun', value: 7200 },
  { label: 'Jul', value: 6800 },
  { label: 'Aug', value: 8100 },
  { label: 'Sep', value: 7600 },
  { label: 'Oct', value: 8900 },
  { label: 'Nov', value: 9400 },
  { label: 'Dec', value: 11200 },
]

/** Weekly visitors (Mon–Sun) — for the bar chart. */
export const WEEKLY_VISITS: SalesPoint[] = [
  { label: 'Mon', value: 320 },
  { label: 'Tue', value: 410 },
  { label: 'Wed', value: 380 },
  { label: 'Thu', value: 520 },
  { label: 'Fri', value: 610 },
  { label: 'Sat', value: 290 },
  { label: 'Sun', value: 240 },
]

/** Traffic sources — for the pie chart. */
export const TRAFFIC_SOURCES: SourceSlice[] = [
  { name: 'Organic', value: 4200 },
  { name: 'Direct', value: 3100 },
  { name: 'Referral', value: 1800 },
  { name: 'Social', value: 1200 },
  { name: 'Email', value: 900 },
]

export interface BreakdownSeries {
  name: string
  data: number[]
}

/** Monthly revenue split by sales channel — for the stacked bar breakdown. */
export const REVENUE_BREAKDOWN: {
  categories: string[]
  series: BreakdownSeries[]
} = {
  categories: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
  series: [
    {
      name: 'Online',
      data: [1800, 2200, 2100, 2600, 2500, 3100, 2900, 3400, 3200, 3700, 3900, 4600],
    },
    {
      name: 'Retail',
      data: [1200, 1400, 1300, 1600, 1500, 1900, 1800, 2100, 2000, 2300, 2400, 2800],
    },
    {
      name: 'Wholesale',
      data: [900, 1000, 950, 1200, 1100, 1400, 1300, 1600, 1500, 1800, 1900, 2200],
    },
  ],
}

export type StatToneKey = 'blue' | 'green' | 'yellow' | 'red'
export type StatIconKey = 'users' | 'user-check' | 'clock' | 'logout'

export interface StatItem {
  id: string
  title: string
  count: number
  tone: StatToneKey
  icon: StatIconKey
  badges: { label: string; value: number }[]
}

/** Dashboard stat cards — for the StatCard component. */
export const STATS: StatItem[] = [
  {
    id: 'total-employee',
    title: 'Total Employee',
    count: 26,
    tone: 'blue',
    icon: 'users',
    badges: [
      { label: 'General', value: 25 },
      { label: 'Roster', value: 1 },
    ],
  },
  {
    id: 'present',
    title: 'Present',
    count: 5,
    tone: 'green',
    icon: 'user-check',
    badges: [
      { label: 'General', value: 5 },
      { label: 'Roster', value: 0 },
      { label: 'Yet to attend', value: 0 },
    ],
  },
  {
    id: 'late-in',
    title: 'Late-In',
    count: 3,
    tone: 'yellow',
    icon: 'clock',
    badges: [
      { label: 'General', value: 3 },
      { label: 'Roster', value: 0 },
    ],
  },
  {
    id: 'early-leave',
    title: 'Early Leave',
    count: 1,
    tone: 'red',
    icon: 'logout',
    badges: [
      { label: 'General', value: 1 },
      { label: 'Roster', value: 0 },
    ],
  },
]
