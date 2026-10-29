// Notifications module: the canonical items, derived from the Email module's state (D-55; docs/notifications/spec.md §4).
// One item per obligation (key = source object + obligation type + response cycle), the same for every viewer;
// `itemsFor(role)` projects them for one viewer: work status from responsibility, routing, engagement, snooze. The
// session stores only what a person did (acknowledge, snooze, assign, mark, override, cover); Reset returns to source
// truth. Nothing here imports from src/prototypes/.
import { session } from '~/modules/session';
import {
  TODAY, dayOf, PROJECT, ROLES, getPerson, getRecord, DRAWINGS, RFIS, recordLabel,
  getThreads, viewFor, isUnmatched, currentStep, stepStatus, WORKFLOW_ACTIONS,
} from '~/modules/correspondence/data';
import { EVENT_RULES, FALLBACK, CORRESPONDENCE_OWNER, ACK_HOURS, RESOLVED_RETENTION_DAYS } from './policy';
import { CRITICAL_SEEDS, UPDATE_SEEDS } from './seed';

const name = (id) => (getPerson(id) || {}).name || 'Someone';
const short = (subject) => (subject || '').replace(/^\[[^\]]+\]\s*/, '');
/** "16 Oct" for copy; `dayOf` stays for comparisons. */
const fmtDay = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');
const addHours = (iso, h) => {
  const d = new Date(iso);
  d.setHours(d.getHours() + h);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
};
const daysBetween = (a, b) => Math.round((new Date(dayOf(b)) - new Date(dayOf(a))) / 86400000);

/** The sandbox role whose viewer is this person (null for people with no role, e.g. Carlos). */
export const roleOfPerson = (personId) => ROLES.find((r) => r.personId === personId) || null;

/** Active cover (spec §9): `{ forId, byId, from, to }` while TODAY is inside its dates. */
export function activeCover() {
  const c = session.ntfCover;
  if (!c || !c.forId) return null;
  const today = dayOf(TODAY);
  if (c.from && dayOf(c.from) > today) return null;
  if (c.to && dayOf(c.to) < today) return null;
  return c;
}

// --- Canonical items ------------------------------------------------------------------------------------------------

function base(key, eventType, fields) {
  const rule = EVENT_RULES[eventType];
  return {
    key,
    eventType,
    family: rule.family,
    severity: rule.severity,
    reason: '',
    evidence: null,
    title: '',
    detail: '',
    impact: '',
    costImpact: null, // shown only to canSeeCost roles (D-41)
    project: PROJECT.code,
    recordId: null,
    recordLabel: '',
    threadId: null,
    responsibleId: null, // whose next action it is (null → fallback routed)
    requesterId: null, // who waits for it
    fallbackId: FALLBACK.ownerId,
    fallbackRouted: false,
    watcherIds: [],
    dueAt: null,
    createdAt: TODAY,
    lastEventAt: TODAY,
    open: true,
    resolvedAt: null,
    resolvedById: null,
    action: { label: rule.action, screen: rule.screen, id: null },
    history: [],
    ...fields,
  };
}

/** Apply a confirmed Critical (seed or manual) and any override to a derived item. */
function applySeverity(item) {
  const seed = CRITICAL_SEEDS[item.key] || session.ntfCritical[item.key] || null;
  if (seed && item.open) {
    item.severity = 'critical';
    item.reason = seed.reason;
    item.evidence = seed.evidence || null;
    item.markedById = seed.markedById;
    item.markedAt = seed.markedAt;
    item.ackDueAt = addHours(seed.markedAt, ACK_HOURS);
  }
  const over = session.ntfOverrides[item.key];
  if (over && item.severity === 'critical') {
    item.severity = 'important';
    item.override = over;
    item.reason = '';
    item.ackDueAt = null;
  }
  return item;
}

/** A thread's obligations: the expected response (one per cycle), an unresolved bounce, the unmatched triage. */
function threadItems(thread) {
  const items = [];
  const messages = thread.entries.filter((e) => e.type === 'message');
  const lastMsg = messages[messages.length - 1] || null;
  const lastOut = [...messages].reverse().find((e) => e.direction === 'outbound') || null;
  const owner = (session.ntfAssignments[`thread:${thread.id}`] || {}).toId || (lastOut ? lastOut.senderId : CORRESPONDENCE_OWNER.ownerId);
  const rfiId = [thread.promotedRecordId, ...thread.linkedRecordIds].find((id) => id && (getRecord(id) || {}).type === 'rfi') || null;
  const rfi = rfiId ? getRecord(rfiId) : null;
  const rfiStep = rfi ? currentStep(rfi) : null;
  const recordId = thread.linkedRecordIds[0] || thread.promotedRecordId || null;
  const common = {
    threadId: thread.id,
    recordId,
    recordLabel: recordId ? recordLabel(recordId) : '',
    watcherIds: thread.participantIds,
    costImpact: thread.estimatedCostImpact,
    action: { screen: 'thread', id: thread.id },
    createdAt: lastMsg ? lastMsg.sentAt : thread.lastActivityAt,
    lastEventAt: thread.lastActivityAt,
  };

  if (isUnmatched(thread)) {
    items.push(base(`thread:${thread.id}:link`, 'thread_unmatched', {
      ...common,
      title: `Unmatched mail from ${name(lastMsg && lastMsg.senderId)}: ${short(thread.subject)}`,
      detail: `Sent to ${PROJECT.inboundAddress} and linked to no record yet`,
      impact: 'A response may be owed once it is linked',
      responsibleId: CORRESPONDENCE_OWNER.ownerId,
      fallbackId: CORRESPONDENCE_OWNER.fallbackId,
      requesterId: lastMsg ? lastMsg.senderId : null,
      action: { label: EVENT_RULES.thread_unmatched.action, screen: 'thread', id: thread.id },
      history: thread.audit.filter((a) => a.event === 'INBOUND_UNMATCHED').map((a) => ({ id: a.id, at: a.at, event: 'ITEM_CREATED', actorId: a.actorId, detail: a.detail })),
    }));
  } else {
    const linked = thread.entries.find((e) => e.type === 'event' && e.kind === 'linked');
    if (linked) {
      items.push(base(`thread:${thread.id}:link`, 'thread_unmatched', {
        ...common,
        title: `Unmatched mail from ${name(messages[0] && messages[0].senderId)}: ${short(thread.subject)}`,
        responsibleId: CORRESPONDENCE_OWNER.ownerId,
        requesterId: messages[0] ? messages[0].senderId : null,
        open: false,
        resolvedAt: linked.sentAt,
        resolvedById: linked.actorId,
        history: [{ id: `${linked.id}-h`, at: linked.sentAt, event: 'ITEM_RESOLVED', actorId: linked.actorId, detail: linked.text }],
      }));
    }
  }

  // Bounces: a corrective obligation for the sender, resolved by Update contact and resend.
  for (const m of messages.filter((e) => e.bounce)) {
    const resolved = (thread.resolvedBounces || []).includes(m.id);
    const fixRow = resolved ? thread.audit.find((a) => a.event === 'CONTACT_UPDATED' && a.at >= m.sentAt) : null;
    items.push(base(`thread:${thread.id}:delivery:${m.id}`, 'thread_delivery_failed', {
      ...common,
      title: `Delivery failed: ${name(m.recipients[0] && m.recipients[0].personId) || m.bounce.email} didn't receive "${short(thread.subject)}"`,
      detail: `${m.bounce.email}: ${m.bounce.reason}`,
      impact: thread.responseDueAt ? `The response due ${fmtDay(thread.responseDueAt)} can't arrive until it is resent` : 'The message never arrived',
      responsibleId: m.senderId,
      requesterId: null,
      createdAt: m.sentAt,
      lastEventAt: fixRow ? fixRow.at : m.sentAt,
      open: !resolved,
      resolvedAt: fixRow ? fixRow.at : null,
      resolvedById: fixRow ? fixRow.actorId : null,
      action: { label: EVENT_RULES.thread_delivery_failed.action, screen: 'thread', id: thread.id },
      history: [
        ...thread.audit.filter((a) => a.event === 'SMTP_BOUNCED' && a.at >= m.sentAt).slice(0, 1).map((a) => ({ id: a.id, at: a.at, event: 'ITEM_CREATED', actorId: a.actorId || null, actorName: a.actorName, detail: a.detail })),
        ...(fixRow ? [{ id: `${fixRow.id}-h`, at: fixRow.at, event: 'ITEM_RESOLVED', actorId: fixRow.actorId, detail: fixRow.detail }] : []),
      ],
    }));
  }

  // The expected response, one obligation per cycle (the last message starts the cycle).
  if (lastMsg && thread.triage !== 'resolved' && !isUnmatched(thread)) {
    const inbound = lastMsg.direction === 'inbound';
    const toIds = inbound ? [] : lastMsg.recipients.filter((r) => r.kind === 'to' && r.personId).map((r) => r.personId);
    const subsumed = !inbound && rfiStep && toIds.some((id) => rfiStep.partyIds.includes(id));
    if (!subsumed) {
      const responder = inbound ? owner : toIds[0] || null;
      const requester = inbound ? lastMsg.senderId : lastMsg.senderId;
      items.push(base(`thread:${thread.id}:response:${lastMsg.id}`, 'thread_response', {
        ...common,
        title: inbound ? `Reply to ${name(lastMsg.senderId)}: ${short(thread.subject)}` : `Response from ${responder ? name(responder) : 'the recipient'}: ${short(thread.subject)}`,
        detail: inbound ? `${name(lastMsg.senderId)} wrote ${daysBetween(lastMsg.sentAt, TODAY) === 0 ? 'today' : `${daysBetween(lastMsg.sentAt, TODAY)} days ago`} and is waiting on ${name(owner)}` : `${name(lastMsg.senderId)} asked ${responder ? name(responder) : 'the recipient'} to respond${thread.responseDueAt ? ` by ${fmtDay(thread.responseDueAt)}` : ''}`,
        impact: thread.estimatedCostImpact ? 'Cost impact raised in the thread' : rfi ? `${rfi.code} depends on it` : '',
        responsibleId: responder,
        requesterId: inbound ? requester : lastMsg.senderId,
        fallbackRouted: !responder,
        dueAt: thread.responseDueAt,
        createdAt: lastMsg.sentAt,
        action: { label: inbound ? 'Reply' : 'Open thread', screen: 'thread', id: thread.id },
        history: [{ id: `${lastMsg.id}-h`, at: lastMsg.sentAt, event: 'ITEM_CREATED', actorId: lastMsg.senderId, detail: inbound ? 'Reply received; a response is expected' : 'Message sent with a response due' }],
      }));
    }
  }
  return items;
}

/** An RFI's obligations: the step in hand (one item), steps completed in the demo (resolved), the closed record. */
function rfiItems(rfi) {
  const items = [];
  const steps = (rfi.workflow && rfi.workflow.steps) || [];
  const step = currentStep(rfi);
  // Who waits on a step: the person who asked the question (the record's creator); the party who last routed it is
  // named in the card's detail. When the creator holds the step (Close), responsibility wins over waiting.
  const router = (s) => {
    const i = steps.indexOf(s);
    const prev = [...steps.slice(0, i)].reverse().find((p) => p.status === 'completed');
    return prev ? prev.partyIds[0] : rfi.createdById;
  };
  const requester = rfi.createdById;
  const common = {
    recordId: rfi.id,
    recordLabel: rfi.code,
    threadId: rfi.threadId || null,
    watcherIds: [...(rfi.watcherIds || []), ...(rfi.distributionIds || [])],
    costImpact: rfi.costAmount,
    action: { label: EVENT_RULES.rfi_step.action, screen: 'rfi', id: `${rfi.id}/workflow` },
  };
  if (step) {
    const assigned = session.ntfAssignments[`rfi:${rfi.id}:${step.id}`];
    const partyId = (assigned && assigned.toId) || step.partyIds[0] || null;
    const returned = step.status === 'returned';
    items.push(base(`rfi:${rfi.id}:${step.action}:${step.id}`, returned ? 'rfi_step_returned' : 'rfi_step', {
      ...common,
      title: `${WORKFLOW_ACTIONS[step.action]} ${rfi.code}: ${rfi.title}`,
      detail: returned ? `Returned for revision by ${name(router(step))}` : `${WORKFLOW_ACTIONS[step.action]} step with ${name(partyId)}${step.dueDate ? `, due ${fmtDay(step.dueDate)}` : ''}`,
      impact: rfi.scheduleImpact ? `Schedule: ${rfi.scheduleImpact}` : '',
      responsibleId: partyId,
      requesterId: requester,
      fallbackRouted: !partyId,
      dueAt: step.dueDate,
      createdAt: step.inDate || rfi.createdAt,
      lastEventAt: step.inDate || rfi.createdAt,
      history: [{ id: `${step.id}-h`, at: step.inDate || rfi.createdAt, event: 'ITEM_CREATED', actorId: router(step), detail: `${WORKFLOW_ACTIONS[step.action]} step opened for ${name(partyId)}` }],
    }));
  }
  for (const s of steps.filter((x) => x.status === 'completed' && x.outDate && dayOf(x.outDate) === dayOf(TODAY) && x.action !== 'create')) {
    items.push(base(`rfi:${rfi.id}:${s.action}:${s.id}`, 'rfi_step', {
      ...common,
      title: `${WORKFLOW_ACTIONS[s.action]} ${rfi.code}: ${rfi.title}`,
      responsibleId: s.partyIds[0] || null,
      requesterId: requester,
      dueAt: s.dueDate,
      createdAt: s.inDate || rfi.createdAt,
      lastEventAt: s.outDate,
      open: false,
      resolvedAt: s.outDate,
      resolvedById: s.partyIds[0] || null,
      history: [{ id: `${s.id}-r`, at: s.outDate, event: 'ITEM_RESOLVED', actorId: s.partyIds[0] || null, detail: `${WORKFLOW_ACTIONS[s.action]} step completed` }],
    }));
  }
  return items;
}

/** Informational Updates from the seed (drawings have no publish date in records.js). */
function updateItems() {
  return UPDATE_SEEDS.map((u) => base(u.key, u.eventType, {
    title: u.title,
    detail: u.detail,
    recordId: u.recordId,
    recordLabel: recordLabel(u.recordId),
    createdAt: u.at,
    lastEventAt: u.at,
    watcherIds: ROLES.filter((r) => r.internal).map((r) => r.personId),
    action: { label: EVENT_RULES.drawing_revision_published.action, screen: 'sheet', id: u.recordId },
    history: [{ id: `${u.key}-h`, at: u.at, event: 'ITEM_CREATED', actorId: null, detail: u.title }],
  }));
}

/** Every canonical item, for every viewer, with its session history merged. Derived on each call (D-55). */
export function allItems() {
  const items = [
    ...getThreads().flatMap(threadItems),
    ...RFIS.map((r) => getRecord(r.id)).flatMap(rfiItems),
    ...updateItems(),
  ].map(applySeverity);
  // Session history rows (acknowledged, snoozed, assigned, reminders, overrides, cover) join the derived ones.
  for (const it of items) {
    const rows = session.ntfHistory[it.key] || [];
    if (rows.length) {
      it.history = [...it.history, ...rows].sort((a, b) => a.at.localeCompare(b.at));
      it.lastEventAt = it.history[it.history.length - 1].at > it.lastEventAt ? it.history[it.history.length - 1].at : it.lastEventAt;
    }
    if (it.open && it.severity === 'critical' && it.ackDueAt && it.ackDueAt < TODAY) it.escalated = true;
  }
  const keep = dayOf(TODAY);
  return items.filter((it) => it.open || !it.resolvedAt || daysBetween(it.resolvedAt, keep) <= RESOLVED_RETENTION_DAYS);
}

export const getItem = (key) => allItems().find((it) => it.key === key) || null;

// --- Per-viewer projection -------------------------------------------------------------------------------------------

/** May this role see the item at all (D-41, spec §3)? */
function visibleTo(item, role) {
  if (item.threadId && item.key.startsWith('thread:')) {
    // A thread's obligations follow the thread's visibility (D-41); its linked record doesn't restrict them further.
    const thread = getThreads().find((t) => t.id === item.threadId);
    return !!thread && !!viewFor(thread, role);
  }
  if (item.eventType === 'drawing_revision_published') return role.internal;
  if (item.recordId && (getRecord(item.recordId) || {}).type === 'rfi') {
    if (role.internal) return true;
    const rfi = getRecord(item.recordId);
    return [item.responsibleId, item.requesterId, ...(rfi.distributionIds || []), ...(rfi.watcherIds || [])].includes(role.personId);
  }
  return role.internal;
}

/** `sla`-style timing of an obligation against TODAY (status.js TIMING). */
export function timingOf(item) {
  if (!item.open || !item.dueAt) return 'none';
  const due = dayOf(item.dueAt);
  const today = dayOf(TODAY);
  if (due < today) return 'overdue';
  if (due === today) return 'due_today';
  return 'on_track';
}

/** The items one viewer sees, projected (spec §4): work status, routing, engagement, presentation, timing, rights. */
export function itemsFor(role) {
  const viewer = role.personId;
  const cover = activeCover();
  const covers = (personId) => !!cover && cover.forId === personId && cover.byId === viewer;
  return allItems()
    .map((item) => {
      if (!visibleTo(item, role)) return null;
      let workStatus;
      let routing;
      if (item.severity === 'update') {
        workStatus = 'none';
        routing = 'watching';
      } else if (!item.open) {
        workStatus = 'resolved';
        routing = item.responsibleId === viewer || item.requesterId === viewer ? 'assigned' : 'watching';
      } else if (item.responsibleId === viewer) {
        workStatus = 'needs_action';
        routing = 'assigned';
      } else if (!item.responsibleId && item.fallbackId === viewer) {
        workStatus = 'needs_action';
        routing = 'fallback';
      } else if (covers(item.responsibleId)) {
        workStatus = 'needs_action';
        routing = 'covering';
      } else if (item.requesterId === viewer) {
        workStatus = 'waiting';
        routing = 'requester';
      } else if (covers(item.requesterId)) {
        workStatus = 'waiting';
        routing = 'covering';
      } else if (role.id === 'gc_pm' && item.severity === 'critical') {
        workStatus = 'none';
        routing = 'oversight';
      } else if (item.watcherIds.includes(viewer)) {
        workStatus = 'none';
        routing = 'watching';
      } else {
        return null;
      }
      const eng = session.ntfEngagement[`${item.key}|${viewer}`] || {};
      const pres = session.ntfPresentation[`${item.key}|${viewer}`] || {};
      const snoozed = !!pres.snoozedUntil && dayOf(pres.snoozedUntil) > dayOf(TODAY) && item.open;
      const engagement = eng.acknowledgedAt ? 'acknowledged' : eng.seenAt ? 'seen' : 'unseen';
      const accountable = ['assigned', 'fallback', 'covering', 'requester'].includes(routing) && item.open;
      return {
        ...item,
        viewerId: viewer,
        workStatus,
        routing,
        coveringForId: routing === 'covering' ? (cover.forId) : null,
        engagement,
        acknowledgedAt: eng.acknowledgedAt || null,
        presentation: pres.archived ? 'archived' : snoozed ? 'snoozed' : 'shown',
        snoozedUntil: snoozed ? pres.snoozedUntil : null,
        timing: timingOf(item),
        ackDue: item.severity === 'critical' && engagement !== 'acknowledged' && item.ackDueAt ? item.ackDueAt : null,
        counted: workStatus === 'needs_action' && !pres.archived && ['assigned', 'fallback', 'covering'].includes(routing),
        costImpact: role.canSeeCost ? item.costImpact : null,
        canAcknowledge: accountable && engagement !== 'acknowledged' && item.severity !== 'update',
        canSnooze: accountable && !snoozed,
        canAssign: role.internal && item.open && item.severity !== 'update' && item.eventType !== 'thread_unmatched',
        canTakeOwnership: routing === 'fallback',
        canMarkCritical: role.internal && item.open && item.severity === 'important' && accountable,
        canOverride: role.id === 'gc_pm' && item.open && item.severity === 'critical',
        overrideBlockedReason: role.internal && role.id !== 'gc_pm' && item.open && item.severity === 'critical' ? 'Only a project manager can change a Critical item' : '',
      };
    })
    .filter(Boolean);
}

const TIMING_RANK = { overdue: 0, due_today: 1, on_track: 2, none: 3 };
const SEVERITY_RANK = { critical: 0, important: 1, update: 2 };

/** Ordering within a view (spec §6): Critical first, then Overdue and Due today, then newest. */
export const sortItems = (items) =>
  [...items].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || TIMING_RANK[a.timing] - TIMING_RANK[b.timing] || b.lastEventAt.localeCompare(a.lastEventAt));

/** The drawer's views (spec §6). Snoozed and archived items leave every view but All. */
export const VIEWS = Object.freeze([
  { id: 'needs_action', label: 'Needs action' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'updates', label: 'Updates' },
  { id: 'all', label: 'All' },
]);

export function viewItems(role, view) {
  const items = itemsFor(role);
  const shown = (it) => it.presentation === 'shown';
  switch (view) {
    case 'needs_action':
      return sortItems(items.filter((it) => it.workStatus === 'needs_action' && shown(it)));
    case 'waiting':
      return sortItems(items.filter((it) => it.workStatus === 'waiting' && shown(it)));
    case 'updates':
      return sortItems(items.filter((it) => it.severity === 'update' && shown(it)));
    default:
      return sortItems(items.filter((it) => it.presentation !== 'archived'));
  }
}

/** Critical items the viewer may see (own and, for the PM, project oversight): the Critical section (spec §6). */
export const criticalItems = (role) => sortItems(itemsFor(role).filter((it) => it.open && it.severity === 'critical' && it.presentation !== 'archived'));

/** The bell and the drawer header (spec §6): explainable counts. */
export function countsFor(role) {
  const items = itemsFor(role);
  const counted = items.filter((it) => it.counted);
  const criticals = items.filter((it) => it.open && it.severity === 'critical' && ['assigned', 'fallback', 'covering', 'requester', 'oversight'].includes(it.routing));
  return {
    needsAction: counted.filter((it) => it.presentation === 'shown').length,
    snoozed: counted.filter((it) => it.presentation === 'snoozed').length,
    bell: counted.length,
    waiting: items.filter((it) => it.workStatus === 'waiting' && it.presentation === 'shown').length,
    updates: items.filter((it) => it.severity === 'update' && it.presentation === 'shown' && it.engagement === 'unseen').length,
    all: items.filter((it) => it.presentation !== 'archived').length,
    critical: criticals.length,
    criticalUnacknowledged: criticals.filter((it) => it.engagement !== 'acknowledged').length,
  };
}

/** Team scope (full page): the open obligations of every internal person, per person (internal roles only). */
export function teamItems(role) {
  if (!role.internal) return [];
  const people = [...new Set([...ROLES.filter((r) => r.internal).map((r) => r.personId), FALLBACK.ownerId])];
  return people
    .filter((id) => id !== role.personId)
    .map((personId) => {
      const r = roleOfPerson(personId) || { id: 'team', personId, internal: true, canSeeCost: false };
      const items = itemsFor(r).filter((it) => it.open && it.workStatus !== 'none');
      return { personId, name: name(personId), items: sortItems(items), needsAction: items.filter((it) => it.workStatus === 'needs_action').length, waiting: items.filter((it) => it.workStatus === 'waiting').length };
    });
}

/** What a cover would take on (spec §9): the covered person's open obligations the delegate may see, and the rest. */
export function coverPreview(forId, byId) {
  const forRole = roleOfPerson(forId);
  const byRole = roleOfPerson(byId);
  if (!forRole || !byRole) return { covered: [], excluded: [] };
  const theirs = itemsFor(forRole).filter((it) => it.open && (it.workStatus === 'needs_action' || it.workStatus === 'waiting'));
  const covered = [];
  const excluded = [];
  for (const it of theirs) {
    const canon = getItem(it.key);
    if (canon && visibleTo(canon, byRole)) covered.push(it);
    else excluded.push({ ...it, excludedReason: it.threadId ? `${name(byId)} is not a participant of this Confidential thread` : `${name(byId)} can't see this record` });
  }
  return { covered, excluded };
}

export const stepLabel = (step) => `${WORKFLOW_ACTIONS[step.action]} (${stepStatus(step)})`;
export const drawingsForUpdates = () => DRAWINGS;
