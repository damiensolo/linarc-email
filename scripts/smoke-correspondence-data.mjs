// Smoke test for src/modules/correspondence/data (spec-to-prototype §5: every status in the data renders; roles; session
// flows). Run from the repo root: `node scripts/smoke-correspondence-data.mjs`. Loads the module through Vite SSR so the
// ~ and @ aliases resolve without a browser; session.js falls back to an empty in-memory session.
import { pathToFileURL } from 'node:url';
const { createServer } = await import(pathToFileURL(process.cwd() + '/node_modules/vite/dist/node/index.js'));
const root = process.cwd();
const server = await createServer({ root, configFile: `${root}/vite.config.mjs`, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const fail = (m) => { console.error('FAIL', m); process.exitCode = 1; };
try {
  const data = await server.ssrLoadModule('/src/modules/correspondence/data/index.js');
  const status = await server.ssrLoadModule('/src/modules/app/status.js');
  const { session } = await server.ssrLoadModule('/src/modules/session.js');

  // 1. Every status key in the data maps to a dimension value.
  const threads = data.getThreads();
  for (const t of threads) {
    if (!status.TRIAGE[t.triage]) fail(`${t.id} triage ${t.triage}`);
    if (!status.SLA[data.slaFor(t)]) fail(`${t.id} sla`);
    if (!status.VISIBILITY[t.visibility]) fail(`${t.id} visibility ${t.visibility}`);
    if (!status.PROMOTION[t.promotion]) fail(`${t.id} promotion ${t.promotion}`);
    for (const e of t.entries) for (const r of e.recipients || []) if (!status.DELIVERY[r.delivery]) fail(`${e.id} delivery ${r.delivery}`);
    for (const a of t.audit) if (!status.AUDIT_EVENT[a.event]) fail(`${a.id} event ${a.event}`);
    for (const id of t.linkedRecordIds) if (!data.getRecord(id)) fail(`${t.id} linked record ${id} missing`);
    for (const e of t.entries) { if (e.senderId && !data.getPerson(e.senderId)) fail(`${e.id} sender ${e.senderId}`); for (const f of e.attachmentIds || []) if (!data.getFile(f)) fail(`${e.id} file ${f}`); }
  }
  for (const d of data.DRAWINGS) if (!status.DRAWING_REVISION[d.revisionStatus]) fail(`${d.id} revision status`);
  for (const r of data.RFIS) if (!status.RFI_STATUS[r.status]) fail(`${r.id} status`);
  console.log('threads', threads.map((t) => `${t.id}:${t.triage}/${data.slaFor(t)}/${data.weakestDelivery(t) ?? '-'}${data.isUnmatched(t) ? '/unmatched' : ''}`).join('  '));

  // 2. Role views (D-41).
  for (const role of data.ROLES) {
    const vis = data.visibleThreads(role);
    const notes = vis.flatMap((t) => t.entries).filter((e) => e.type === 'note').length;
    const cost = vis.filter((t) => t.estimatedCostImpact != null).length;
    console.log(`role ${role.id}: ${vis.length} threads, ${notes} notes visible, ${cost} with cost`);
    if (!role.internal && notes) fail(`${role.id} sees notes`);
    if (!role.canSeeCost && cost) fail(`${role.id} sees cost`);
  }
  const sub = data.visibleThreads(data.ROLES[2]).map((t) => t.id);
  if (sub.includes('THR-1031')) fail('guest sees a confidential thread it is not on');
  if (!sub.includes('THR-1042')) fail('guest does not see its own thread');

  // 3. Links (D-43).
  const states = data.LINKS.map((l) => `${l.token}:${data.getLink(l.token).state}`);
  console.log('links', states.join('  '));
  if (data.getLink('tk-expired').state !== 'expired') fail('tk-expired not expired');
  if (data.getLink('tk-marcus-a302').state !== 'valid') fail('marcus link not valid');

  // 4. Mutations through actions.js (session in memory).
  const guest = data.addGuest({ email: 'm.vance@acoustix.com' });
  if (guest.name !== 'M Vance' && guest.name !== 'M. Vance') console.log('guest guess:', guest.name, '/', guest.company);
  if (!data.findPersonByEmail('m.vance@acoustix.com')) fail('guest not findable');
  data.sendMessage('THR-1042', { senderId: 'usr-alex', body: 'Test', recipients: [{ personId: guest.id, kind: 'to' }], responseDueAt: data.defaultResponseDue() });
  if (data.getThread('THR-1042').triage !== 'waiting') fail('send did not set waiting');
  data.postNote('THR-1042', { senderId: 'usr-sarah', body: 'note' });
  const rid = data.promoteToRfi('THR-1042', 'msg-1042-2', { actorId: 'usr-alex', title: 'T', question: 'Q', assignedToId: 'usr-elena', dueOn: data.relDate(5), includeIds: ['att-beam-sketch'] });
  const t42 = data.getThread('THR-1042');
  if (t42.promotion !== 'promoted_rfi' || t42.promotedRecordId !== rid || !t42.linkedRecordIds.includes('RFI-143')) fail('promotion not applied');
  if (!data.getRecord('RFI-143').createdInDemo) fail('RFI-143 not patched');
  data.linkThreadToRecord('THR-1050', 'SUB-088', { actorId: 'usr-alex' });
  const t50 = data.getThread('THR-1050');
  if (data.isUnmatched(t50) || !t50.subject.startsWith('[RMC-04] SUB-088')) fail(`link failed: ${t50.subject}`);
  data.updateContactAndResend('THR-1031', 'msg-1031-1', { actorId: 'usr-sarah', email: 'vchen@riversidehealth.org' });
  const t31 = data.getThread('THR-1031');
  if (data.weakestDelivery(t31) !== 'delivered' || !t31.resolvedBounces?.includes('msg-1031-1')) fail('resend failed');
  data.replyFromLink(data.getLink('tk-marcus-a302'), { body: 'Looks fine' });
  if (!data.getLink('tk-marcus-a302').replied) fail('link reply not marked');
  if (data.getThread('THR-1042').triage !== 'needs_action') fail('inbound reply did not set needs_action');
  // Simulated inbound mail (the sandbox's Simulate inbound email): a team reply from Outlook, a new sender to the
  // project address, a guest reply.
  data.receiveMail({ fromId: 'usr-sarah', to: 'THR-1042', body: 'Answered from Outlook' });
  if (data.getThread('THR-1042').triage !== 'waiting') fail('team reply by mail did not set waiting');
  const newId = data.receiveMail({ fromEmail: 'j.ortiz@coastal-glazing.com', to: 'project', subject: 'Curtain wall anchors', body: 'Embed plates?', file: 'photo' });
  const tNew = data.getThread(newId);
  if (!tNew || !data.isUnmatched(tNew) || tNew.triage !== 'needs_action' || tNew.audit[0].event !== 'INBOUND_UNMATCHED') fail('project-address mail not unmatched');
  if (!data.findPersonByEmail('j.ortiz@coastal-glazing.com')) fail('unknown sender not added as a guest');
  if (!status.AUDIT_EVENT[tNew.audit[0].event]) fail('inbound audit event not in the vocabulary');
  data.receiveMail({ fromId: 'usr-ray', to: newId, body: 'Following up' });
  const tFollow = data.getThread(newId);
  if (tFollow.entries.length !== 2 || !tFollow.participantIds.includes('usr-ray')) fail('reply to a demo thread not threaded');
  console.log('inbound:', data.inboundSandbox().destinations.length, 'destinations;', newId, tFollow.triage);
  data.setRole('guest_sub');
  if (data.currentRole().id !== 'guest_sub') fail('setRole');
  console.log('session keys after mutations:', Object.entries(session).map(([k, v]) => `${k}=${Array.isArray(v) ? v.length : Object.keys(v).length}`).join(' '));
  console.log('default response due:', data.defaultResponseDue(), '(TODAY', data.TODAY, 'Fri → Wed)');
  console.log(process.exitCode ? 'SMOKE FAILED' : 'SMOKE OK');
} finally {
  await server.close();
}
