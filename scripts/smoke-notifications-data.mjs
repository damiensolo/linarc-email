// Smoke test for src/modules/notifications/data (docs/notifications/spec.md §4–§9): every derived item maps to the
// vocabularies; one item per obligation; the per-role projection (PM Needs action / PE Waiting on one obligation; the
// guest sees nothing internal); acknowledge, snooze, assign, override, cover and the simulated events through the
// session. Run from the repo root: `node scripts/smoke-notifications-data.mjs`. Loads through Vite SSR like the Email one.
import { pathToFileURL } from 'node:url';
const { createServer } = await import(pathToFileURL(process.cwd() + '/node_modules/vite/dist/node/index.js'));
const root = process.cwd();
const server = await createServer({ root, configFile: `${root}/vite.config.mjs`, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const fail = (m) => { console.error('FAIL', m); process.exitCode = 1; };
const ok = (cond, m) => (cond ? null : fail(m));
try {
  const a = await server.ssrLoadModule('/src/modules/notifications/data/index.js');
  const c = await server.ssrLoadModule('/src/modules/correspondence/data/index.js');
  const status = await server.ssrLoadModule('/src/modules/app/status.js');
  const { session } = await server.ssrLoadModule('/src/modules/session.js');
  const role = (id) => c.ROLES.find((r) => r.id === id);
  const byKey = (items, key) => items.find((it) => it.key === key);

  // 1. Canonical items: vocabularies, uniqueness, actions land on built screens.
  const all = a.allItems();
  const keys = all.map((it) => it.key);
  ok(new Set(keys).size === keys.length, `duplicate item keys: ${keys.filter((k, i) => keys.indexOf(k) !== i)}`);
  for (const it of all) {
    ok(status.SEVERITY[it.severity], `${it.key} severity ${it.severity}`);
    ok(a.EVENT_RULES[it.eventType], `${it.key} eventType ${it.eventType}`);
    ok(it.title, `${it.key} has no title`);
    ok(it.action && it.action.label && it.action.screen && it.action.id, `${it.key} action incomplete`);
    for (const h of it.history) ok(status.AUDIT_EVENT[h.event], `${it.key} history event ${h.event}`);
    ok(!it.responsibleId || c.getPerson(it.responsibleId), `${it.key} responsible ${it.responsibleId}`);
  }
  console.log('items', all.map((it) => `${it.key}:${it.severity}${it.open ? '' : '/resolved'}`).join('  '));
  // Two obligations on one record (THR-1031: delivery + response), one Critical (RFI-142); Kenji's emailed answer on
  // THR-1039 (the party in hand) is a filing item for Alex, not a reply (Add to Q&A, D-49 / Q-A8).
  ok(byKey(all, 'thread:THR-1031:delivery:msg-1031-1') && byKey(all, 'thread:THR-1031:response:msg-1031-1'), 'THR-1031 should carry two obligations');
  const filing = byKey(all, 'thread:THR-1039:response:msg-1039-3');
  ok(filing && filing.action.label === 'Add to Q&A' && filing.action.screen === 'rfi' && filing.action.id === 'RFI-142/email' && filing.title.startsWith("File Kenji Takahashi, AIA's answer"), `THR-1039: Kenji's answer should be a filing item (${filing && filing.title})`);
  const crit = all.filter((it) => it.severity === 'critical');
  ok(crit.length === 1 && crit[0].key === 'rfi:RFI-142:respond:wf-142-2', `expected one Critical (RFI-142), got ${crit.map((x) => x.key)}`);
  ok(crit[0].reason && crit[0].evidence && crit[0].ackDueAt, 'the Critical lacks reason, evidence or ack deadline');
  ok(byKey(all, 'thread:THR-1050:link').eventType === 'thread_unmatched', 'THR-1050 unmatched item');
  ok(all.filter((it) => it.severity === 'update').length === 2, 'two Updates expected');

  // 2. Projection per role.
  const pm = a.itemsFor(role('gc_pm'));
  const pe = a.itemsFor(role('gc_pe'));
  const guest = a.itemsFor(role('guest_sub'));
  const show = (name, items) => console.log(name, items.map((it) => `${it.key.split(':').slice(0, 2).join(':')}=${it.workStatus}/${it.routing}/${it.timing}${it.severity === 'critical' ? '/CRIT' : ''}`).join('  '));
  show('pm   ', pm); show('pe   ', pe); show('guest', guest);
  for (const it of [...pm, ...pe, ...guest]) {
    ok(status.WORK_STATUS[it.workStatus], `${it.key} workStatus ${it.workStatus}`);
    ok(status.ROUTING[it.routing], `${it.key} routing ${it.routing}`);
    ok(status.ENGAGEMENT[it.engagement], `${it.key} engagement ${it.engagement}`);
    ok(status.TIMING[it.timing], `${it.key} timing ${it.timing}`);
    ok(status.PRESENTATION[it.presentation], `${it.key} presentation ${it.presentation}`);
  }
  // The pair: RFI-139's Review step is Sarah's Needs action and Alex's Waiting.
  ok(byKey(pm, 'rfi:RFI-139:review:wf-139-3')?.workStatus === 'needs_action', 'PM should have Needs action on RFI-139 review');
  ok(byKey(pe, 'rfi:RFI-139:review:wf-139-3')?.workStatus === 'waiting', 'PE should be Waiting on RFI-139 review');
  // The Critical: Alex waits on Kenji (Critical in Waiting); the PM sees it as oversight, not counted.
  ok(byKey(pe, 'rfi:RFI-142:respond:wf-142-2')?.workStatus === 'waiting', 'PE should be Waiting on RFI-142 (Critical)');
  ok(byKey(pm, 'rfi:RFI-142:respond:wf-142-2')?.routing === 'oversight', 'PM should see RFI-142 as oversight');
  // Alex: reply to Dave on THR-1042 is his Needs action, due today.
  const t42 = byKey(pe, 'thread:THR-1042:response:msg-1042-2');
  ok(t42?.workStatus === 'needs_action' && t42.timing === 'due_today', 'PE Needs action on THR-1042, due today');
  ok(byKey(pm, 'thread:THR-1042:response:msg-1042-2')?.routing === 'watching', 'PM watches THR-1042 (cc)');
  // Sarah: unmatched triage, the bounce (needs action) and the overdue response from Valerie (waiting).
  ok(byKey(pm, 'thread:THR-1050:link')?.workStatus === 'needs_action', 'PM triages THR-1050');
  ok(byKey(pm, 'thread:THR-1031:delivery:msg-1031-1')?.workStatus === 'needs_action', 'PM needs action on the bounce');
  const t31 = byKey(pm, 'thread:THR-1031:response:msg-1031-1');
  ok(t31?.workStatus === 'waiting' && t31.timing === 'overdue', 'PM waiting on Valerie, overdue');
  // The PE never sees the Confidential thread; the guest sees only his own thread and no Updates or RFIs he isn't on.
  ok(!pe.some((it) => it.threadId === 'THR-1031'), 'PE sees the Confidential thread');
  ok(guest.every((it) => it.threadId === 'THR-1042' || it.recordId === 'RFI-143'), `guest sees ${guest.map((x) => x.key)}`);
  ok(guest.every((it) => it.costImpact == null), 'guest sees cost');
  ok(byKey(guest, 'thread:THR-1042:response:msg-1042-2')?.workStatus === 'waiting', 'guest should be waiting on Alex');

  // 3. Counts are explainable.
  const cPm = a.countsFor(role('gc_pm'));
  const cPe = a.countsFor(role('gc_pe'));
  console.log('counts pm', JSON.stringify(cPm), 'pe', JSON.stringify(cPe), 'guest', JSON.stringify(a.countsFor(role('guest_sub'))));
  ok(cPm.bell === pm.filter((it) => it.counted).length, 'PM bell count');
  ok(cPe.critical === 1 && cPe.criticalUnacknowledged === 1, 'PE should have one unacknowledged Critical');
  ok(cPm.critical === 1, 'PM oversight Critical counted in the critical state');
  ok(a.countsFor(role('guest_sub')).critical === 0, 'guest has no Critical');

  // 4. Actions through the session: acknowledge keeps everything else; snooze keeps the signal; duplicate reminder.
  c.setRole('gc_pe');
  const key142 = 'rfi:RFI-142:respond:wf-142-2';
  a.acknowledge(key142);
  let it = byKey(a.itemsFor(role('gc_pe')), key142);
  ok(it.engagement === 'acknowledged' && it.severity === 'critical' && it.workStatus === 'waiting' && it.timing === 'due_today' && !it.ackDue, 'acknowledge changed more than engagement');
  ok(a.countsFor(role('gc_pe')).criticalUnacknowledged === 0 && a.countsFor(role('gc_pe')).critical === 1, 'critical state after acknowledge');
  // A Critical can't be snoozed past its due date; RFI-142 is due today, so the snooze is bounded to today and the
  // card stays in view with its signal.
  const until = a.snooze(key142, c.relDate(5));
  it = byKey(a.itemsFor(role('gc_pe')), key142);
  ok(until === it.dueAt && it.presentation === 'shown', `Critical snooze not bounded to the due date (${until}, ${it.presentation})`);
  ok(a.countsFor(role('gc_pe')).critical === 1, 'snoozed Critical lost its signal');
  a.unsnooze(key142);
  // An Important item snoozes until next week: leaves Needs action, stays in All and in the bell's total.
  const key42 = 'thread:THR-1042:response:msg-1042-2';
  const bellBefore = a.countsFor(role('gc_pe')).bell;
  a.snooze(key42, c.relDate(3));
  it = byKey(a.itemsFor(role('gc_pe')), key42);
  ok(it.presentation === 'snoozed', 'Important item not snoozed');
  ok(!a.viewItems(role('gc_pe'), 'needs_action').some((x) => x.key === key42) && a.viewItems(role('gc_pe'), 'all').some((x) => x.key === key42), 'snoozed item should leave Needs action and stay in All');
  const cSn = a.countsFor(role('gc_pe'));
  ok(cSn.bell === bellBefore && cSn.snoozed === 1 && cSn.needsAction === bellBefore - 1, `snoozed subtotal: ${JSON.stringify(cSn)}`);
  a.unsnooze(key42);
  const before = a.countsFor(role('gc_pm'));
  a.simulateEvent('reminder');
  const after = a.countsFor(role('gc_pm'));
  ok(before.bell === after.bell && before.waiting === after.waiting, 'a reminder changed a count');
  ok(a.getItem('thread:THR-1031:response:msg-1031-1').history.some((h) => h.event === 'ITEM_UPDATED'), 'reminder not on the card');
  ok(!a.archive(key142), 'an open Critical could be archived');

  // 5. Assign (RFI step → the RFI agrees), override (PM only), cover.
  a.simulateEvent('reassign');
  const r143 = c.getRecord('RFI-143');
  ok(c.currentStep(r143).partyIds[0] === 'usr-alex' && r143.assignedToId === 'usr-alex', 'reassign did not change the RFI');
  ok(byKey(a.itemsFor(role('gc_pe')), 'rfi:RFI-143:respond:wf-143-2')?.workStatus === 'needs_action', 'PE should now have Needs action on RFI-143');
  ok(!a.overrideSeverity(key142, { outcome: 'resolved', reason: 'x' }), 'PE could override');
  c.setRole('gc_pm');
  ok(!a.overrideSeverity(key142, { outcome: 'resolved', reason: '' }), 'override without a reason');
  ok(a.overrideSeverity(key142, { outcome: 'resolved', reason: 'Framing restarted after the site call' }), 'PM override failed');
  it = a.getItem(key142);
  ok(it.severity === 'important' && it.open && it.override.outcome === 'resolved' && it.history.some((h) => h.event === 'SEVERITY_OVERRIDDEN'), 'override not applied as a downgrade with history');
  ok(c.getRecord('RFI-142').status === 'open', 'override touched the RFI');
  const preview = a.coverPreview('usr-sarah', 'usr-alex');
  console.log('cover preview: covered', preview.covered.map((x) => x.key.split(':').slice(0, 2).join(':')).join(' '), '| excluded', preview.excluded.map((x) => `${x.key.split(':').slice(0, 2).join(':')} (${x.excludedReason})`).join(' '));
  ok(preview.excluded.some((x) => x.threadId === 'THR-1031'), 'the Confidential thread should be excluded from Alex’s cover');
  a.simulateEvent('cover');
  ok(a.activeCover()?.byId === 'usr-alex', 'cover not active');
  const covering = a.itemsFor(role('gc_pe')).filter((x) => x.routing === 'covering');
  ok(covering.length === preview.covered.length, `PE covers ${covering.length}, preview said ${preview.covered.length}`);
  a.endCover();
  ok(!a.activeCover(), 'cover did not end');

  // 6. The Critical arrival: a bounce on THR-1039 becomes a Critical Needs action for Alex; banner-worthy.
  const b = a.simulateEvent('critical_bounce');
  it = byKey(a.itemsFor(role('gc_pe')), b.key);
  ok(it && it.severity === 'critical' && it.workStatus === 'needs_action' && it.engagement === 'unseen', 'critical bounce not derived as an unseen Critical Needs action');
  ok(a.countsFor(role('gc_pe')).criticalUnacknowledged === 1, 'bell critical state after the bounce');
  c.updateContactAndResend('THR-1039', b.key.split(':')[3], { actorId: 'usr-alex', email: 'kenji@studiowest-arch.com' });
  it = a.getItem(b.key);
  ok(it && !it.open && it.resolvedAt, 'resend did not resolve the delivery item');
  ok(byKey(a.viewItems(role('gc_pe'), 'all'), b.key)?.workStatus === 'resolved', 'resolved item missing from All');

  // 7. Preferences.
  const prefs = a.preferencesFor(role('gc_pm'));
  ok(prefs.preset === 'pm' && prefs.matrix.correspondence.email === 'immediate', 'PM preset defaults');
  a.savePreferences({ ...prefs, preset: 'custom', matrix: { ...prefs.matrix, documents: { ...prefs.matrix.documents, email: 'off' } } });
  ok(a.preferencesFor(role('gc_pm')).matrix.documents.email === 'off', 'preferences not saved');

  console.log('session keys:', Object.entries(session).filter(([k]) => k.startsWith('ntf')).map(([k, v]) => `${k}=${Array.isArray(v) ? v.length : Object.keys(v).length}`).join(' '));
  console.log(process.exitCode ? 'SMOKE FAILED' : 'SMOKE OK');
} finally {
  await server.close();
}
