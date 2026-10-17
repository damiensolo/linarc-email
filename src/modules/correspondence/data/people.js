// PLACEHOLDER DATA — Correspondence module: the project directory. Internal team members and guest users (the
// platform's term for external people who can be emailed; 00-plan.md §0). Guests created in the compose panel
// (spec §5, D-36) live in the demo session and are merged here.
import { session } from '~/modules/session';

export const PEOPLE = Object.freeze([
  // Vanguard Construction Group (the GC; internal)
  { id: 'usr-alex', name: 'Alex Morgan', email: 'a.morgan@vanguard-gc.com', company: 'Vanguard Construction Group', role: 'Senior Project Engineer', trade: '01 00 00 · General Requirements', guest: false },
  { id: 'usr-sarah', name: 'Sarah Jenkins', email: 's.jenkins@vanguard-gc.com', company: 'Vanguard Construction Group', role: 'Project Manager', trade: '01 00 00 · General Requirements', guest: false },
  { id: 'usr-carlos', name: 'Carlos Reyes', email: 'c.reyes@vanguard-gc.com', company: 'Vanguard Construction Group', role: 'General Superintendent', trade: '01 00 00 · General Requirements', guest: false },
  // Guest users
  { id: 'usr-dave', name: 'Dave Miller', email: 'dmiller@apex-mech.com', company: 'Apex Mechanical Systems', role: 'HVAC Project Manager', trade: '23 00 00 · HVAC', guest: true },
  { id: 'usr-elena', name: 'Elena Rostova, PE', email: 'erostova@thornton-seor.com', company: 'Thornton Structural Engineers', role: 'Structural Engineer of Record', trade: '05 12 00 · Structural Steel', guest: true },
  { id: 'usr-kenji', name: 'Kenji Takahashi, AIA', email: 'ktakahashi@studio-arch.com', company: 'Studio West Architecture', role: 'Architect of Record', trade: '00 00 00 · Design Team', guest: true },
  { id: 'usr-valerie', name: 'Valerie Chen', email: 'vchen@riversidehealth.org', company: 'Riverside Health System', role: 'Owner Representative', trade: '00 00 00 · Owner', guest: true },
  { id: 'usr-ray', name: 'Ray Castellano', email: 'rcastellano@sunstate-drywall.com', company: 'SunState Drywall & Framing', role: 'Framing Foreman', trade: '09 22 16 · Non-Structural Metal Framing', guest: true },
]);

/** Everyone, including guests added in this session. */
export function getPeople() {
  return [...PEOPLE, ...session.guests];
}

export function getPerson(id) {
  return getPeople().find((p) => p.id === id) || null;
}

export function findPersonByEmail(email) {
  const e = (email || '').trim().toLowerCase();
  return getPeople().find((p) => p.email.toLowerCase() === e) || null;
}

/** Guest users only (the compose To field lists these; spec §5). */
export const getGuests = () => getPeople().filter((p) => p.guest);

/** Pre-fill for the inline guest form from an address (spec §5): "m.vance@acoustix.com" → Marcus Vance / Acoustix. */
export function guessFromEmail(email) {
  const e = (email || '').trim().toLowerCase();
  const [local = '', domain = ''] = e.split('@');
  const cap = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    name: cap(local.replace(/[._-]+/g, ' ')).trim(),
    company: cap((domain.split('.')[0] || '').replace(/[-_]+/g, ' ')).trim(),
  };
}

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
