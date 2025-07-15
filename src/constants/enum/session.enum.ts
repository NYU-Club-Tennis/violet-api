export enum SessionStatus {
  OPEN = 'OPEN', // Open for registrations
  FULL = 'FULL', // Full but waitlist available
  VIEW_ONLY = 'VIEW_ONLY', // Can view but can't register
  CLOSED = 'CLOSED', // Completely closed, no registrations or waitlist
}
