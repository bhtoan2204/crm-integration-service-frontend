import type { MockDb } from './seed'
import { buildDatabase } from './seed'

type Listener = () => void

let database = buildDatabase()
let sequence = 8000
const listeners = new Set<Listener>()

export function getDb(): MockDb {
  return database
}

export function nextId(prefix: string) {
  sequence += 1
  return `${prefix}-${sequence}`
}

export function subscribeStore(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function updateDb(mutator: (draft: MockDb) => void) {
  mutator(database)
  listeners.forEach((listener) => listener())
}

export function resetDb() {
  database = buildDatabase()
  sequence = 8000
  listeners.forEach((listener) => listener())
}

export function findUser(userId: string) {
  return database.users.find((user) => user.id === userId) ?? null
}

export function findLead(leadId: string) {
  return database.leads.find((lead) => lead.id === leadId) ?? null
}
