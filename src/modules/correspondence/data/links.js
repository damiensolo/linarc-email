// PLACEHOLDER DATA — Correspondence module: secure links (the page a recipient opens from the mail; spec §10, D-43).
// A link belongs to one thread and one recipient; its state is computed from TODAY and the session's revocations.
import { session } from '~/modules/session';
import { TODAY, relDate, LINK_LIFETIME_DAYS } from './project';

export const LINKS = Object.freeze([
  {
    token: 'tk-marcus-a302',
    threadId: 'THR-1042',
    recipient: { name: 'Marcus Vance', email: 'm.vance@acoustix.com', company: 'Acoustix Consultants', role: 'Acoustical Engineer', hasAccount: false },
    sentAt: relDate(0, '10:40:00'),
    responseDueAt: relDate(3), // Friday + 3 = Monday (a working day, as the default would give)
    message:
      'Marcus — please review the highlighted clash at Grid B-4 on Drawing A-302 Rev 3. Can we shift the acoustic baffle profile 4" north to clear the 18" HVAC trunk without degrading the STC-50 corridor rating?',
    drawingId: 'A-302-Rev3',
    pinId: 'pin-b4',
    fileIds: ['att-a302-snap', 'att-site-video'],
  },
  {
    token: 'tk-kenji-rfi142',
    threadId: 'THR-1039',
    recipient: { name: 'Kenji Takahashi, AIA', email: 'ktakahashi@studio-arch.com', company: 'Studio West Architecture', role: 'Architect of Record', hasAccount: true },
    sentAt: relDate(-5, '09:20:00'),
    responseDueAt: relDate(0),
    message: 'Please review RFI-142 on the lead-lined gypsum board termination height at Grid D-7.',
    drawingId: null,
    pinId: null,
    fileIds: [],
  },
  {
    token: 'tk-expired',
    threadId: 'THR-1031',
    recipient: { name: 'Valerie Chen', email: 'vchen@riversidehealth.org', company: 'Riverside Health System', role: 'Owner Representative', hasAccount: true },
    sentAt: relDate(-(LINK_LIFETIME_DAYS + 4), '11:00:00'),
    responseDueAt: relDate(-3),
    message: 'Valerie — please review the attached 24V power supply revision for SUB-088 and acknowledge receipt.',
    drawingId: null,
    pinId: null,
    fileIds: [],
  },
]);

const addDays = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

/** The link with its state: `valid` | `expired` | `revoked`, plus `expiresAt` and whether this viewer already replied. */
export function getLink(token) {
  const base = LINKS.find((l) => l.token === token);
  if (!base) return null;
  const expiresAt = addDays(base.sentAt, LINK_LIFETIME_DAYS);
  let state = 'valid';
  if (session.revokedLinks[token]) state = 'revoked';
  else if (new Date(expiresAt) < new Date(TODAY)) state = 'expired';
  return { ...base, expiresAt, state, replied: Boolean(session.linkReplies[token]) };
}
