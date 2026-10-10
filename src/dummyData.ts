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

export const INITIAL_FORM = {
  name: '',
  email: '',
}
