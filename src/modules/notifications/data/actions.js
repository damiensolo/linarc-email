// Notifications module: what a person does with an item (docs/notifications/spec.md §8, §9, §11), written through the session
// (D-29) so the bell, the drawer, the page and the record agree. Each action is one history row on the canonical item.
// Screens call these; they never write to the session directly.
import {
  session, setNotificationEntry, appendNotificationHistory, setCover, setPrefs, patchRecord, appendThreadEntry, appendThreadAudit, patchThread,
} from '~/modules/session';
import { TODAY, relDate, getPerson, getRecord, getThread, currentRole, replyAddress } from '~/modules/correspondence/data';
import { getItem, itemsFor, activeCover, roleOfPerson } from './items';
import { PRESETS, PRESET_FOR_ROLE, EVENT_FAMILIES } from './policy';
import { SIMULATED_EVENTS } from './seed';

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => TODAY; // the demo clock stands still
const viewerId = () => currentRole().personId;
const name = (id) => (getPerson(id) || {}).name || 'Someone';
const row = (event, detail, extra = {}) => ({ id: uid('ah'), at: now(), event, actorId: viewerId(), detail, ...extra });

/** Opening the record from a card: Seen, never acknowledged (spec §8). */
export function markSeen(key) {
  const k = `${key}|${viewerId()}`;
  if ((session.ntfEngagement[k] || {}).seenAt) return;
  setNotificationEntry('ntfEngagement', k, { ...(session.ntfEngagement[k] || {}), seenAt: now() });
}

/** Acknowledge: awareness only. Severity, work status and Overdue stay as they are (spec §8). */
export function acknowledge(key) {
  const k = `${key}|${viewerId()}`;
  setNotificationEntry('ntfEngagement', k, { ...(session.ntfEngagement[k] || {}), seenAt: now(), acknowledgedAt: now() });
  appendNotificationHistory(key, row('ACKNOWLEDGED', `Acknowledged by ${name(viewerId())}`));
}

/** Snooze: personal presentation only; a Critical keeps its signal and its escalation (spec §8). */
export function snooze(key, untilIso) {
  const item = getItem(key);
  const bounded = item && item.severity === 'critical' && item.dueAt && untilIso > item.dueAt ? item.dueAt : untilIso;
  const k = `${key}|${viewerId()}`;
  setNotificationEntry('ntfPresentation', k, { ...(session.ntfPresentation[k] || {}), snoozedUntil: bounded });
  appendNotificationHistory(key, row('SNOOZED', `Snoozed by ${name(viewerId())} until ${bounded.slice(0, 10)}${bounded !== untilIso ? ' (bounded to the due date: Critical)' : ''}`));
  return bounded;
}

export function unsnooze(key) {
  const k = `${key}|${viewerId()}`;
  setNotificationEntry('ntfPresentation', k, { ...(session.ntfPresentation[k] || {}), snoozedUntil: null });
}

/** Archive from the personal view (never an open Critical). */
export function archive(key) {
  const item = getItem(key);
  if (item && item.open && item.severity === 'critical') return false;
  const k = `${key}|${viewerId()}`;
  setNotificationEntry('ntfPresentation', k, { ...(session.ntfPresentation[k] || {}), archived: true });
  return true;
}

/** Snooze presets offered on a card (spec §8). */
export function snoozeOptions(item) {
  const next = (dow) => {
    let d = 1;
    while (new Date(relDate(d)).getDay() !== dow) d += 1;
    return relDate(d, '08:00:00');
  };
  const opts = [
    { value: relDate(1, '08:00:00'), label: 'Until tomorrow' },
    { value: next(1), label: 'Until next Monday' },
  ];
  if (item.dueAt) opts.push({ value: item.dueAt, label: 'Until the due date' });
  return opts;
}

/**
 * Assign (spec §8): the record's responsible party changes by the record's rules. An RFI step changes its party, ball
 * in court and assignee so the RFI screen agrees; a thread's owner is recorded on the thread's obligation.
 */
export function assign(key, toId, { note = '' } = {}) {
  const item = getItem(key);
  if (!item) return null;
  const by = viewerId();
  if (item.recordId && (getRecord(item.recordId) || {}).type === 'rfi' && key.startsWith('rfi:')) {
    const rfi = getRecord(item.recordId);
    const stepId = key.split(':')[3];
    const steps = rfi.workflow.steps.map((s) => (s.id === stepId ? { ...s, partyIds: [toId] } : s));
    const to = getPerson(toId);
    patchRecord(rfi.id, { workflow: { ...rfi.workflow, steps }, assignedToId: toId, ballInCourt: to ? to.company : rfi.ballInCourt, activity: [...(rfi.activity || []), { id: uid('act'), at: now(), actorId: by, text: `Assigned the ${key.split(':')[2]} step to ${name(toId)}${note ? `: ${note}` : ''}`, tone: 'info' }] });
    setNotificationEntry('ntfAssignments', `rfi:${rfi.id}:${stepId}`, { toId, byId: by, at: now() });
  } else if (item.threadId) {
    setNotificationEntry('ntfAssignments', `thread:${item.threadId}`, { toId, byId: by, at: now() });
  }
  appendNotificationHistory(key, row('ASSIGNED', `Assigned to ${name(toId)} by ${name(by)}${note ? ` · "${note}"` : ''}`));
  setNotificationEntry('ntfEngagement', `${key}|${toId}`, {});
  return toId;
}

export const takeOwnership = (key) => assign(key, viewerId());

/** Mark as critical (spec §5): a human confirms the condition; a reason is required; the ack clock starts. */
export function markCritical(key, { reason, evidence = '' }) {
  if (!reason || !reason.trim()) return false;
  setNotificationEntry('ntfCritical', key, { reason: reason.trim(), evidence: evidence ? { byId: viewerId(), at: now(), quote: evidence } : null, markedById: viewerId(), markedAt: now() });
  appendNotificationHistory(key, row('MARKED_CRITICAL', `Marked Critical by ${name(viewerId())}: ${reason.trim()}`));
  return true;
}

/** The outcomes of a Critical override (status.js OVERRIDE_OUTCOME). */
export const OVERRIDE_OUTCOMES = Object.freeze([
  { value: 'false_positive', label: 'False positive: the condition was never material' },
  { value: 'duplicate', label: 'Duplicate of another item' },
  { value: 'resolved', label: 'Condition resolved outside the record' },
  { value: 'accepted_risk', label: 'Accepted risk (with a review date)' },
]);

/** Override a Critical (spec §5, Q-A6): PM only, a reason required; the record keeps its state and owner. */
export function overrideSeverity(key, { outcome, reason, reviewOn = null }) {
  if (currentRole().id !== 'gc_pm' || !reason || !reason.trim()) return false;
  const item = getItem(key);
  if (!item || item.severity !== 'critical') return false;
  setNotificationEntry('ntfOverrides', key, { outcome, reason: reason.trim(), reviewOn, actorId: viewerId(), at: now(), from: 'critical', to: 'important' });
  const label = (OVERRIDE_OUTCOMES.find((o) => o.value === outcome) || {}).label || outcome;
  appendNotificationHistory(key, row('SEVERITY_OVERRIDDEN', `Critical → Important by ${name(viewerId())} · ${label} · "${reason.trim()}"${reviewOn ? ` · review ${reviewOn.slice(0, 10)}` : ''}`, { from: 'critical', to: 'important', outcome }));
  return true;
}

/** Cover (spec §9): temporary; never transfers formal ownership. */
export function startCover({ forId, byId, from, to }) {
  setCover({ forId, byId, from, to, startedAt: now(), startedById: viewerId() });
  const roleFor = roleOfPerson(forId);
  const covered = roleFor ? itemsFor(roleFor).filter((it) => it.open && (it.workStatus === 'needs_action' || it.workStatus === 'waiting')) : [];
  for (const it of covered) appendNotificationHistory(it.key, row('COVER_STARTED', `${name(byId)} covers for ${name(forId)} from ${from.slice(0, 10)} to ${to.slice(0, 10)}`));
  return covered.length;
}

export function endCover() {
  const c = activeCover() || session.ntfCover;
  if (!c || !c.forId) return;
  const roleFor = roleOfPerson(c.forId);
  const items = roleFor ? itemsFor(roleFor).filter((it) => it.open && it.workStatus !== 'none') : [];
  for (const it of items) appendNotificationHistory(it.key, row('COVER_ENDED', `Cover by ${name(c.byId)} ended; back with ${name(c.forId)}`));
  setCover({});
}

/** Updates view: Seen for every Update; obligations untouched (spec §8). */
export function markUpdatesReviewed() {
  const role = currentRole();
  for (const it of itemsFor(role).filter((x) => x.severity === 'update')) markSeen(it.key);
}

/** Preferences (spec §11): the viewer's preset and matrix; a preset changes delivery defaults only. */
export function preferencesFor(role) {
  const saved = session.ntfPrefs[role.personId];
  const presetId = (saved && saved.preset) || PRESET_FOR_ROLE[role.id] || 'custom';
  const preset = PRESETS[presetId];
  const defaults = {};
  for (const f of EVENT_FAMILIES) defaults[f.id] = { inapp: 'immediate', email: preset.matrix ? preset.matrix[f.id] : 'digest', push: preset.matrix ? (preset.matrix[f.id] === 'immediate' ? 'immediate' : 'off') : 'off' };
  return {
    preset: presetId,
    matrix: { ...defaults, ...((saved && saved.matrix) || {}) },
    quiet: { ...{ days: ['sat', 'sun'], from: '19:00', to: '07:00', tz: 'America/Los_Angeles' }, ...((saved && saved.quiet) || {}) },
  };
}

export function savePreferences(prefs) {
  setPrefs(viewerId(), { preset: prefs.preset, matrix: prefs.matrix, quiet: prefs.quiet });
}

/** Apply a preset to a matrix (the Custom preset leaves the matrix as it is). */
export function presetMatrix(presetId, current) {
  const preset = PRESETS[presetId];
  if (!preset || !preset.matrix) return current;
  const out = {};
  for (const f of EVENT_FAMILIES) out[f.id] = { inapp: 'immediate', email: preset.matrix[f.id], push: preset.matrix[f.id] === 'immediate' ? 'immediate' : 'off' };
  return out;
}

// --- Simulated events (the sandbox's Simulate event, spec §7) -------------------------------------------------------

function fireCriticalBounce() {
  const threadId = 'THR-1039';
  const thread = getThread(threadId);
  if (!thread) return null;
  const at = now();
  const msg = {
    id: uid('msg'), type: 'message', direction: 'outbound', senderId: 'usr-alex', sentAt: at,
    body: 'Kenji — SunState stopped framing OR 2.14 this morning. We need the termination height on RFI-142 today, before the crew runs out of corridor work.',
    attachmentIds: [],
    recipients: [{ personId: 'usr-kenji', email: 'ktakahashi@studio-arch.com', kind: 'to', delivery: 'bounced' }],
    bounce: { email: 'ktakahashi@studio-arch.com', reason: '550 5.2.2 Mailbox full', suggestedEmail: 'kenji@studiowest-arch.com' },
  };
  appendThreadEntry(threadId, msg);
  patchThread(threadId, { triage: 'needs_action', lastActivityAt: at });
  appendThreadAudit(threadId, { id: uid('aud'), at, event: 'SMTP_DISPATCHED', actorId: 'usr-alex', detail: 'Message sent via the Linarc relay (250 2.0.0 OK)' });
  appendThreadAudit(threadId, { id: uid('aud'), at, event: 'SMTP_BOUNCED', actorEmail: 'mailer-daemon@mail.linarc.io', actorName: 'Mail relay', detail: '550 5.2.2 mailbox full for ktakahashi@studio-arch.com' });
  const key = `thread:${threadId}:delivery:${msg.id}`;
  // The thread carries RFI-142's confirmed Critical, so its delivery failure is Critical too (spec §5).
  setNotificationEntry('ntfCritical', key, { reason: "the message chasing RFI-142's answer bounced and framing at Grid D-7 is stopped", evidence: { byId: 'usr-carlos', at: relDate(0, '07:40:00'), quote: 'OR 2.14 top track is stopped until the termination height is answered.' }, markedById: null, markedAt: at });
  return { key, message: 'A Critical arrived: Alex’s email to Kenji bounced.', action: { screen: 'thread', id: threadId } };
}

function fireReminder() {
  const key = 'thread:THR-1031:response:msg-1031-1';
  appendNotificationHistory(key, { id: uid('ah'), at: now(), event: 'ITEM_UPDATED', actorId: null, actorName: 'Daily digest', detail: 'Overdue reminder sent to Sarah Jenkins; the same obligation, no new card' });
  return { key, message: 'Reminder recorded on THR-1031’s response item; the count is unchanged.', action: { screen: 'thread', id: 'THR-1031' } };
}

function fireReassign() {
  const key = 'rfi:RFI-143:respond:wf-143-2';
  assign(key, 'usr-alex', { note: 'Elena is out this week; Alex to answer from the Thornton sketch' });
  return { key, message: 'RFI-143’s Respond step is now with Alex Morgan.', action: { screen: 'rfi', id: 'RFI-143' } };
}

function fireCover() {
  const n = startCover({ forId: 'usr-sarah', byId: 'usr-alex', from: relDate(0, '00:00:00'), to: relDate(14, '23:59:00') });
  return { key: null, message: `Alex Morgan now covers ${n} of Sarah Jenkins’s items for two weeks.`, action: null };
}

/** Fire a simulated event by id (seed.js SIMULATED_EVENTS). Returns `{ key, message, action }`. */
export function simulateEvent(id) {
  switch (id) {
    case 'critical_bounce':
      return fireCriticalBounce();
    case 'reminder':
      return fireReminder();
    case 'reassign':
      return fireReassign();
    case 'cover':
      return fireCover();
    default:
      return null;
  }
}

/** The sandbox's *Simulate event* (prototype metadata `events`): the list and the trigger. Sandbox only. */
export function eventsSandbox() {
  return {
    events: SIMULATED_EVENTS.map((e) => ({ value: e.id, label: e.label })),
    fire: (id) => simulateEvent(id),
  };
}

export const replyAddressOf = replyAddress;
