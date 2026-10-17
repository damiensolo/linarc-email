import {
  INITIAL_THREADS,
  STAKEHOLDER_DIRECTORY,
  PROJECT_RECORDS,
  MAGIC_LINK_PORTAL_TOKENS,
  TODAY,
} from '~/modules/correspondence/data/correspondenceData';

const STORAGE_KEY = 'linarc_correspondence_demo_session_v1';

function buildDefaultState() {
  return {
    activeRole: 'gc_pm', // 'gc_pm' | 'gc_pe' | 'ext_sub'
    stakeholders: JSON.parse(JSON.stringify(STAKEHOLDER_DIRECTORY)),
    threads: JSON.parse(JSON.stringify(INITIAL_THREADS)),
    drawings: JSON.parse(JSON.stringify(PROJECT_RECORDS.drawings)),
    rfis: JSON.parse(JSON.stringify(PROJECT_RECORDS.rfis)),
    portalTokens: JSON.parse(JSON.stringify(MAGIC_LINK_PORTAL_TOKENS)),
  };
}

export const session = {
  state: loadState(),

  save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      // Ignore storage quota errors in headless shots
    }
  },

  reset() {
    this.state = buildDefaultState();
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    return this.state;
  },

  // Flow 1: Inline Guest Creation from SelectV2 allow-create
  addInlineExternalGuest({ email, name, companyName, roleLabel = 'External Consultant' }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const existing = this.state.stakeholders.find((s) => s.email.toLowerCase() === cleanEmail);
    if (existing) return existing;

    const inferredName =
      name ||
      cleanEmail
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
    const inferredCompany =
      companyName ||
      cleanEmail
        .split('@')[1]
        ?.split('.')[0]
        ?.replace(/\b\w/g, (l) => l.toUpperCase()) + ' Consultants';

    const newGuest = {
      id: `usr-guest-${Date.now()}`,
      name: inferredName,
      email: cleanEmail,
      companyName: inferredCompany,
      roleLabel,
      tradeCode: '00 00 00 — External Guest',
      isExternal: true,
    };

    this.state.stakeholders.push(newGuest);
    this.save();
    return newGuest;
  },

  // Flow 1 & 2: Append External Reply or Private Internal Team Note
  appendMessageToThread(threadId, { entryType = 'EXTERNAL_EMAIL', bodyText, attachments = [], senderId = 'usr-alex' }) {
    const thread = this.state.threads.find((t) => t.id === threadId);
    if (!thread) return null;

    const sender = this.state.stakeholders.find((s) => s.id === senderId) || this.state.stakeholders[0];
    const msg = {
      id: `msg-${Date.now()}`,
      entryType, // 'EXTERNAL_EMAIL' | 'INTERNAL_COMMENT'
      direction: entryType === 'INTERNAL_COMMENT' ? 'INTERNAL' : sender.isExternal ? 'INBOUND' : 'OUTBOUND',
      senderId: sender.id,
      senderName: sender.name,
      senderCompany: sender.companyName,
      senderRole: sender.roleLabel,
      isExternal: sender.isExternal,
      sentAt: TODAY,
      deliveryStatus: 'delivered',
      bodyText,
      attachments,
    };

    thread.messages.push(msg);
    thread.lastActivityAt = TODAY;

    if (entryType === 'EXTERNAL_EMAIL') {
      thread.triageStatus = sender.isExternal ? 'needs_action' : 'waiting';
      thread.auditLog.unshift({
        id: `aud-${Date.now()}`,
        eventType: sender.isExternal ? 'INBOUND_REPLY_INGESTED' : 'SMTP_DISPATCHED',
        deliveryStatus: 'delivered',
        actorName: sender.name,
        actorEmail: sender.email,
        occurredAt: TODAY,
        detail:
          sender.isExternal
            ? 'External response captured and threaded automatically'
            : 'Dispatched via Linarc SMTP relay (250 2.0.0 OK)',
      });
    }

    this.save();
    return msg;
  },

  // Flow 2: Promote Informal Email Message to Formal RFI / PCO Record
  promoteMessageToRecord(threadId, { targetObjectType = 'RFI', title, question, assignedToId, dueDate }) {
    const thread = this.state.threads.find((t) => t.id === threadId);
    if (!thread) return null;

    const assignee =
      this.state.stakeholders.find((s) => s.id === assignedToId) ||
      this.state.stakeholders.find((s) => s.id === 'usr-elena');

    const rfiCode = 'RFI-143';
    const existingRfi = this.state.rfis.find((r) => r.id === rfiCode);

    if (existingRfi) {
      existingRfi.title = title || existingRfi.title;
      existingRfi.question = question || existingRfi.question;
      existingRfi.assignedToId = assignee.id;
      existingRfi.assignedToName = `${assignee.name} (${assignee.companyName})`;
      existingRfi.dueDate = dueDate || existingRfi.dueDate;
      existingRfi.isCreatedInDemo = true;
    }

    thread.promotionStatus = targetObjectType === 'CHANGE_ORDER' ? 'promoted_pco' : 'promoted_rfi';
    thread.promotedRecordId = rfiCode;
    thread.triageStatus = 'waiting';

    thread.linkedObjects.push({
      objectType: targetObjectType,
      objectId: rfiCode,
      displayCode: rfiCode,
      title: title || 'Grid B-4 W24 Beam Web Penetration for 18" HVAC Trunk Duct',
      revisionLabel: 'Open',
      revisionStatus: 'current',
    });

    thread.messages.push({
      id: `msg-sys-${Date.now()}`,
      entryType: 'SYSTEM_EVENT',
      direction: 'INTERNAL',
      senderId: 'usr-alex',
      senderName: 'Alex Morgan',
      sentAt: TODAY,
      promotedObjectType: targetObjectType,
      promotedObjectId: rfiCode,
      promotedDisplayCode: rfiCode,
      bodyText: `Promoted to formal ${rfiCode} and assigned to ${assignee.name} (${assignee.companyName}).`,
    });

    thread.auditLog.unshift({
      id: `aud-prom-${Date.now()}`,
      eventType: 'RECORD_PROMOTED',
      deliveryStatus: 'delivered',
      actorName: 'Alex Morgan',
      actorEmail: 'a.morgan@vanguard-gc.com',
      occurredAt: TODAY,
      detail: `Email message promoted to formal record ${rfiCode}`,
    });

    this.save();
    return rfiCode;
  },
};

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return buildDefaultState();
}