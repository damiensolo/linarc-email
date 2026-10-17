// PLACEHOLDER DATA
// Shared mock data for the Correspondence module and host tool simulation screens.
// Dates are computed relative to TODAY so SLA states never go stale (SKILL.md §3).

export const TODAY = '2026-10-16T10:30:00-07:00';

function relDate(daysOffset, timeStr = '17:00:00-07:00') {
  const base = new Date(TODAY);
  base.setDate(base.getDate() + daysOffset);
  const yyyy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, '0');
  const dd = String(base.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${timeStr}`;
}

export function formatShortDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// 1. Project Context
export const PROJECT_CONTEXT = {
  id: 'proj-rmc-2026',
  code: 'RMC-04',
  name: 'Riverside Medical Center — North Tower Expansion',
  inboundEmailAlias: 'rmc-04@mail.linarc.io',
  gcCompany: 'Vanguard Construction Group',
};

// 2. Active Role Switcher Options (for testing role-gated visibility in SKILL.md §3 & §5)
export const DEMO_ROLES = [
  { id: 'gc_pm', label: 'GC Project Manager (Full access + Internal notes)', isInternal: true, canSeeCost: true },
  { id: 'gc_pe', label: 'GC Project Engineer (Internal notes, no confidential cost)', isInternal: true, canSeeCost: false },
  { id: 'ext_sub', label: 'External Subcontractor (Public threads only, no internal notes)', isInternal: false, canSeeCost: false },
];

// 3. Project Directory & Existing External Stakeholders (Feeds SelectV2 multiple)
export const STAKEHOLDER_DIRECTORY = [
  {
    id: 'usr-alex',
    name: 'Alex Morgan',
    email: 'a.morgan@vanguard-gc.com',
    companyName: 'Vanguard Construction Group',
    roleLabel: 'Senior Project Engineer',
    tradeCode: '01 00 00 — General Requirements',
    isExternal: false,
  },
  {
    id: 'usr-sarah',
    name: 'Sarah Jenkins',
    email: 's.jenkins@vanguard-gc.com',
    companyName: 'Vanguard Construction Group',
    roleLabel: 'Project Manager',
    tradeCode: '01 00 00 — General Requirements',
    isExternal: false,
  },
  {
    id: 'usr-carlos',
    name: 'Carlos Reyes',
    email: 'c.reyes@vanguard-gc.com',
    companyName: 'Vanguard Construction Group',
    roleLabel: 'General Superintendent',
    tradeCode: '01 00 00 — General Requirements',
    isExternal: false,
  },
  {
    id: 'usr-dave',
    name: 'Dave Miller',
    email: 'dmiller@apex-mech.com',
    companyName: 'Apex Mechanical Systems',
    roleLabel: 'HVAC Project Manager',
    tradeCode: '23 00 00 — HVAC',
    isExternal: true,
  },
  {
    id: 'usr-elena',
    name: 'Elena Rostova, PE',
    email: 'erostova@thornton-seor.com',
    companyName: 'Thornton Structural Engineers',
    roleLabel: 'Structural Engineer of Record (SEOR)',
    tradeCode: '05 12 00 — Structural Steel',
    isExternal: true,
  },
  {
    id: 'usr-kenji',
    name: 'Kenji Takahashi, AIA',
    email: 'ktakahashi@studio-arch.com',
    companyName: 'Studio West Architecture',
    roleLabel: 'Architect of Record',
    tradeCode: '00 00 00 — Design Team',
    isExternal: true,
  },
  {
    id: 'usr-valerie',
    name: 'Valerie Chen',
    email: 'vchen@riversidehealth.org',
    companyName: 'Riverside Health System',
    roleLabel: 'Owner Representative',
    tradeCode: '00 00 00 — Owner',
    isExternal: true,
  },
  {
    id: 'usr-ray',
    name: 'Ray Castellano',
    email: 'rcastellano@sunstate-drywall.com',
    companyName: 'SunState Drywall & Framing',
    roleLabel: 'Framing Foreman',
    tradeCode: '09 22 16 — Non-Structural Metal Framing',
    isExternal: true,
  },
];

// 4. Host Tool Records (Drawings, RFIs, Submittals, Change Orders)
export const PROJECT_RECORDS = {
  drawings: [
    {
      id: 'A-302-Rev3',
      objectType: 'DRAWING',
      displayCode: 'A-302',
      title: 'Level 3 Reflected Ceiling Plan — East Wing',
      discipline: 'Architectural',
      revisionId: 'rev-a302-3',
      revisionLabel: 'Rev 3',
      revisionDate: relDate(-12),
      revisionStatus: 'current', // maps to status.js drawingRevision
      csiDivision: '09 51 00 — Acoustical Ceilings',
      suggestedRecipientIds: ['usr-kenji', 'usr-dave', 'usr-elena'],
      markupPins: [
        {
          pinId: 'pin-grid-b4',
          gridLocation: 'Grid B-4 · Corridor 3E',
          label: '18" HVAC trunk duct clashes with acoustic cove & W24 steel beam',
          authorName: 'Alex Morgan',
          createdAt: relDate(-1, '08:45:00-07:00'),
          boxCoords: { xPercent: 42, yPercent: 34, widthPercent: 26, heightPercent: 18 },
          linkedThreadId: 'THR-1042',
        },
      ],
    },
    {
      id: 'S-201-Rev1',
      objectType: 'DRAWING',
      displayCode: 'S-201',
      title: 'Level 3 Framing Plan — Transfer Girders',
      discipline: 'Structural',
      revisionId: 'rev-s201-1',
      revisionLabel: 'Rev 1',
      revisionDate: relDate(-40),
      revisionStatus: 'superseded', // Superseded by Rev 2 to test version-drift warning
      supersededByLabel: 'Rev 2 (Issued Oct 14, 2026)',
      csiDivision: '05 12 00 — Structural Steel',
      suggestedRecipientIds: ['usr-elena', 'usr-dave'],
      markupPins: [],
    },
  ],

  rfis: [
    {
      id: 'RFI-142',
      objectType: 'RFI',
      displayCode: 'RFI-142',
      title: 'Level 2 Operating Room Lead-Lined Drywall Partition Termination',
      status: 'open', // maps to status.js rfiStatus
      csiDivision: '09 29 00 — Gypsum Board',
      assignedToId: 'usr-kenji',
      assignedToName: 'Kenji Takahashi, AIA (Studio West Architecture)',
      ballInCourt: 'Studio West Architecture',
      dueDate: relDate(0), // Due today
      createdBy: 'Alex Morgan',
      createdAt: relDate(-5),
      costImpact: 'None anticipated',
      scheduleImpact: '2 days (Level 2 rough-in)',
      question:
        'Drawing A-511 Detail 4 indicates lead-lined gypsum board terminating 6" above the finished ceiling plane, whereas radiation shielding spec 13 49 00 calls for slab-to-slab continuity. Please confirm required termination height at Grid D-7.',
      officialAnswer: null,
      linkedDrawingIds: ['A-302-Rev3'],
      originThreadId: 'THR-1039',
      originMessageId: 'msg-1039-1',
    },
    // Note: RFI-143 is created dynamically during the Demo Flow 2 ("Promote to Record"),
    // or pre-hydrated if the user jumps straight to correspondence-context-rfi#RFI-143.
    {
      id: 'RFI-143',
      objectType: 'RFI',
      displayCode: 'RFI-143',
      title: 'Grid B-4 W24 Beam Web Penetration for 18" HVAC Trunk Duct',
      status: 'open',
      csiDivision: '05 12 00 — Structural Steel',
      assignedToId: 'usr-elena',
      assignedToName: 'Elena Rostova, PE (Thornton Structural Engineers)',
      ballInCourt: 'Thornton Structural Engineers',
      dueDate: relDate(5),
      createdBy: 'Alex Morgan',
      createdAt: relDate(0, '10:25:00-07:00'),
      costImpact: 'TBD ($4,200 sleeve fabrication)',
      scheduleImpact: '3 days (Level 3 ceiling grid closure)',
      question:
        'Per field coordination with Apex Mechanical on Drawing A-302 Rev 3 (Grid B-4), the 18" supply trunk duct conflicts with the W24x68 steel beam and acoustic lighting cove. Please confirm if a 10" reinforced circular web penetration at the beam neutral axis is acceptable per attached Apex sketch.',
      officialAnswer: null,
      linkedDrawingIds: ['A-302-Rev3'],
      originThreadId: 'THR-1042',
      originMessageId: 'msg-dave-clash',
      isCreatedInDemo: false, // Flips to true when user completes Flow 2
    },
  ],

  submittals: [
    {
      id: 'SUB-088',
      objectType: 'SUBMITTAL',
      displayCode: 'SUB-088',
      title: '08 71 00 — Patient Room Card-Reader Door Hardware Schedule (Rev 1)',
      csiDivision: '08 71 00 — Door Hardware',
    },
  ],

  changeOrders: [
    {
      id: 'PCO-019',
      objectType: 'CHANGE_ORDER',
      displayCode: 'PCO-019',
      title: 'Owner Directive — Imaging Suite Chiller Pad Vibration Isolators',
      csiDivision: '23 05 48 — Vibration and Seismic Controls',
      estimatedAmount: '$18,450.00',
    },
  ],
};

// 5. Correspondence Threads (Drives correspondence-list, correspondence-thread, and embedded tabs)
export const INITIAL_THREADS = [
  {
    id: 'THR-1042',
    subject: '[RMC-04] A-302 Rev 3 — Grid B-4 HVAC Duct & Acoustic Cove Clash',
    triageStatus: 'needs_action', // status.js: triage
    slaStatus: 'due_today',       // status.js: sla
    visibilityScope: 'project_public',
    promotionStatus: 'unpromoted', // Flips to 'promoted_rfi' when promoted in Flow 2
    promotedRecordId: null,        // Populated with 'RFI-143' on promotion
    responseDueAt: relDate(0, '17:00:00-07:00'),
    lastActivityAt: relDate(0, '10:14:00-07:00'),
    ballInCourtName: 'Alex Morgan (Vanguard GC)',
    primaryCompany: 'Apex Mechanical Systems',
    tradeLabel: '23 00 00 — HVAC',
    hasAttachments: true,
    isExternalUnread: true,
    estimatedCostImpact: '$4,200.00', // Role-gated for canSeeCost

    linkedObjects: [
      {
        objectType: 'DRAWING',
        objectId: 'A-302-Rev3',
        displayCode: 'A-302',
        title: 'Level 3 Reflected Ceiling Plan — East Wing',
        revisionLabel: 'Rev 3',
        revisionStatus: 'current',
        pinLabel: 'Grid B-4 · Corridor 3E',
      },
    ],

    participants: [
      { participantId: 'usr-alex', roleType: 'FROM', deliveryStatus: 'delivered' },
      { participantId: 'usr-dave', roleType: 'TO', deliveryStatus: 'downloaded' },
      { participantId: 'usr-sarah', roleType: 'CC', deliveryStatus: 'delivered' },
    ],

    // AI Summary Banner (5-ui-patterns.md §9)
    aiSummary: {
      generatedAt: relDate(0, '10:15:00-07:00'),
      evidenceLine: 'Summarised from 3 messages and 2 files in THR-1042.',
      decisions: [
        'Acoustic baffle ceiling elevation in Corridor 3E must remain at +9\'-6" AFF per architectural finish schedule.',
      ],
      openQuestions: [
        'Apex Mechanical cannot drop the 18" supply trunk below the W24x68 steel beam; requires SEOR approval for a 10" web penetration or reroute.',
      ],
      extractedCommitments: [
        'Vanguard GC to escalate structural beam sleeve sketch to Thornton Structural by Oct 16, 2026.',
      ],
    },

    messages: [
      {
        id: 'msg-1042-1',
        entryType: 'EXTERNAL_EMAIL',
        direction: 'OUTBOUND',
        senderId: 'usr-alex',
        senderName: 'Alex Morgan',
        senderCompany: 'Vanguard Construction Group',
        senderRole: 'Senior Project Engineer',
        isExternal: false,
        sentAt: relDate(-1, '09:12:00-07:00'),
        deliveryStatus: 'downloaded',
        bodyText:
          'Dave — During this morning\'s Level 3 overhead rough-in walk at Grid B-4 (Corridor 3E), we flagged a direct elevation conflict between your 18" main supply trunk and the architectural lighting cove shown on Drawing A-302 Rev 3.\n\nCan your detailing team flatten this transition to a 28"x10" oval duct to clear the cove framing before SunState starts hanging track on Monday?',
        attachments: [
          {
            id: 'att-a302-snap',
            fileName: 'A-302_Rev3_Grid_B4_Markup_Snapshot.png',
            fileSizeLabel: '1.8 MB',
            deliveryMode: 'INLINE',
            sha256: '8f4b2e91c0d7a3f5e2189b6a4c7d8e1f0a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
          },
          {
            id: 'att-site-video',
            fileName: 'Site_Walk_Corridor3E_Grid_B4.mp4',
            fileSizeLabel: '45.2 MB',
            deliveryMode: 'MAGIC_LINK', // Auto-converted >15MB file
            sha256: '3a1f9c8e7d6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a09',
          },
        ],
      },
      {
        id: 'msg-dave-clash',
        entryType: 'EXTERNAL_EMAIL',
        direction: 'INBOUND',
        senderId: 'usr-dave',
        senderName: 'Dave Miller',
        senderCompany: 'Apex Mechanical Systems',
        senderRole: 'HVAC Project Manager',
        isExternal: true,
        sentAt: relDate(0, '10:14:00-07:00'),
        deliveryStatus: 'delivered',
        bodyText:
          'Alex,\n\nWe ran the static pressure calc on flattening to a 10" oval, and it still won\'t clear the bottom flange of the W24x68 steel beam at Grid B-4 while keeping the +9\'-6" ceiling height.\n\nOur only viable path without dropping the ceiling is a 10" reinforced circular web opening through the W24 beam neutral axis (see attached shop sketch). We need formal Structural Engineer of Record (SEOR) sign-off via RFI before we fabricate the steel sleeve. Note: sleeve welding adds ~$4,200 and 3 working days if not answered by Wednesday.',
        attachments: [
          {
            id: 'att-beam-sketch',
            fileName: 'Apex_W24_Beam_Penetration_Sketch_B4.pdf',
            fileSizeLabel: '3.4 MB',
            deliveryMode: 'INLINE',
            sha256: 'e7c9d1a2b3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0',
          },
        ],
        // Pre-computed promotion mapping payload for Flow 2
        promotionSuggestion: {
          targetObjectType: 'RFI',
          suggestedNumber: 'RFI-143',
          suggestedTitle: 'Grid B-4 W24 Beam Web Penetration for 18" HVAC Trunk Duct',
          suggestedAssigneeId: 'usr-elena',
          suggestedDueDate: relDate(5),
          aiDraftedQuestion:
            'Per field coordination with Apex Mechanical on Drawing A-302 Rev 3 (Grid B-4), the 18" supply trunk duct conflicts with the W24x68 steel beam and acoustic lighting cove. Please confirm if a 10" reinforced circular web penetration at the beam neutral axis is acceptable per attached Apex sketch.',
          carryOverItems: [
            { id: 'carry-dwg', label: 'Drawing A-302 Rev 3 (Pinned Grid B-4 Markup)', checked: true },
            { id: 'carry-pdf', label: 'Apex_W24_Beam_Penetration_Sketch_B4.pdf (3.4 MB)', checked: true },
            { id: 'carry-mp4', label: 'Site_Walk_Corridor3E_Grid_B4.mp4 (45.2 MB Magic Link)', checked: false },
          ],
        },
      },
      {
        id: 'msg-1042-note-1',
        entryType: 'INTERNAL_COMMENT', // Restricted to internal GC roles
        direction: 'INTERNAL',
        senderId: 'usr-sarah',
        senderName: 'Sarah Jenkins',
        senderCompany: 'Vanguard Construction Group',
        senderRole: 'Project Manager',
        isExternal: false,
        sentAt: relDate(0, '10:22:00-07:00'),
        deliveryStatus: 'delivered',
        bodyText:
          '@Alex Morgan Hold off on replying to Apex about the $4,200 cost claim for now. Promote Dave\'s message and sketch into a formal RFI assigned to Elena at Thornton Structural so we get the penetration approved before Monday\'s framing inspection.',
        attachments: [],
      },
    ],

    auditLog: [
      {
        id: 'aud-1',
        eventType: 'SMTP_DISPATCHED',
        deliveryStatus: 'delivered',
        actorName: 'Alex Morgan',
        actorEmail: 'a.morgan@vanguard-gc.com',
        occurredAt: relDate(-1, '09:12:04-07:00'),
        detail: 'Message #1 dispatched via Linarc SMTP relay (250 2.0.0 OK · mx.apex-mech.com)',
      },
      {
        id: 'aud-2',
        eventType: 'MAGIC_LINK_ACCESSED',
        deliveryStatus: 'link_viewed',
        actorName: 'Dave Miller',
        actorEmail: 'dmiller@apex-mech.com',
        occurredAt: relDate(-1, '11:04:19-07:00'),
        detail: 'Opened zero-login Magic Link for Drawing A-302 Rev 3 · IP 198.51.100.42 (iOS Safari)',
      },
      {
        id: 'aud-3',
        eventType: 'ATTACHMENT_DOWNLOADED',
        deliveryStatus: 'downloaded',
        actorName: 'Dave Miller',
        actorEmail: 'dmiller@apex-mech.com',
        occurredAt: relDate(-1, '11:06:52-07:00'),
        detail: 'Streamed Site_Walk_Corridor3E_Grid_B4.mp4 (SHA-256: 3a1f9c8e...b1a09 verified)',
      },
      {
        id: 'aud-4',
        eventType: 'INBOUND_REPLY_INGESTED',
        deliveryStatus: 'delivered',
        actorName: 'Dave Miller',
        actorEmail: 'dmiller@apex-mech.com',
        occurredAt: relDate(0, '10:14:11-07:00'),
        detail: 'Inbound reply parsed via token reply+thr_1042@mail.linarc.io · 1 PDF attachment virus-scanned',
      },
    ],
  },

  {
    id: 'THR-1039',
    subject: '[RMC-04] RFI-142 — Level 2 OR Lead-Lined Drywall Termination Clarification',
    triageStatus: 'waiting',
    slaStatus: 'due_today',
    visibilityScope: 'project_public',
    promotionStatus: 'promoted_rfi',
    promotedRecordId: 'RFI-142',
    responseDueAt: relDate(0, '17:00:00-07:00'),
    lastActivityAt: relDate(-2, '14:30:00-07:00'),
    ballInCourtName: 'Kenji Takahashi, AIA (Studio West)',
    primaryCompany: 'Studio West Architecture',
    tradeLabel: '09 29 00 — Gypsum Board',
    hasAttachments: true,
    isExternalUnread: false,
    estimatedCostImpact: '$0.00',

    linkedObjects: [
      {
        objectType: 'RFI',
        objectId: 'RFI-142',
        displayCode: 'RFI-142',
        title: 'Level 2 Operating Room Lead-Lined Drywall Partition Termination',
        revisionLabel: 'Open',
        revisionStatus: 'current',
      },
      {
        objectType: 'DRAWING',
        objectId: 'S-201-Rev1',
        displayCode: 'S-201',
        title: 'Level 3 Framing Plan — Transfer Girders',
        revisionLabel: 'Rev 1',
        revisionStatus: 'superseded', // Shows superseded warning badge in UI
      },
    ],

    participants: [
      { participantId: 'usr-alex', roleType: 'FROM', deliveryStatus: 'delivered' },
      { participantId: 'usr-kenji', roleType: 'TO', deliveryStatus: 'link_viewed' },
      { participantId: 'usr-ray', roleType: 'CC', deliveryStatus: 'delivered' },
    ],

    aiSummary: {
      generatedAt: relDate(-2, '14:35:00-07:00'),
      evidenceLine: 'Summarised from 2 messages and 1 linked RFI in THR-1039.',
      decisions: ['Escalated field question from SunState Drywall into formal RFI-142.'],
      openQuestions: ['Awaiting Architect confirmation on whether lead shielding stops at +6" above ceiling or extends to deck.'],
      extractedCommitments: ['Kenji Takahashi (Studio West) viewed the drawing link on Oct 15; response due today.'],
    },

    messages: [
      {
        id: 'msg-1039-1',
        entryType: 'EXTERNAL_EMAIL',
        direction: 'INBOUND',
        senderId: 'usr-ray',
        senderName: 'Ray Castellano',
        senderCompany: 'SunState Drywall & Framing',
        senderRole: 'Framing Foreman',
        isExternal: true,
        sentAt: relDate(-5, '07:50:00-07:00'),
        deliveryStatus: 'delivered',
        bodyText:
          'Alex — Our crew is framing the Level 2 OR partitions at Grid D-7. Detail 4 shows lead-lined board stopping 6 inches above the ceiling grid, but the physicist spec says full height to deck. Which one are we building?',
        attachments: [],
      },
      {
        id: 'msg-1039-sys-1',
        entryType: 'SYSTEM_EVENT',
        direction: 'INTERNAL',
        senderId: 'usr-alex',
        senderName: 'Alex Morgan',
        sentAt: relDate(-5, '09:15:00-07:00'),
        promotedObjectType: 'RFI',
        promotedObjectId: 'RFI-142',
        promotedDisplayCode: 'RFI-142',
        bodyText: 'Promoted to formal RFI-142 and assigned to Kenji Takahashi, AIA (Studio West Architecture).',
      },
    ],

    auditLog: [
      {
        id: 'aud-1039-1',
        eventType: 'RECORD_PROMOTED',
        deliveryStatus: 'delivered',
        actorName: 'Alex Morgan',
        actorEmail: 'a.morgan@vanguard-gc.com',
        occurredAt: relDate(-5, '09:15:00-07:00'),
        detail: 'Message #1 promoted to formal RFI-142',
      },
      {
        id: 'aud-1039-2',
        eventType: 'MAGIC_LINK_ACCESSED',
        deliveryStatus: 'link_viewed',
        actorName: 'Kenji Takahashi, AIA',
        actorEmail: 'ktakahashi@studio-arch.com',
        occurredAt: relDate(-1, '16:20:00-07:00'),
        detail: 'Viewed RFI-142 package via Magic Link · IP 203.0.113.88',
      },
    ],
  },

  {
    id: 'THR-1031',
    subject: '[RMC-04] SUB-088 — Card-Reader Door Hardware Voltage Mismatch (Overdue)',
    triageStatus: 'needs_action',
    slaStatus: 'overdue', // Tests danger chip & Overdue segmented filter
    visibilityScope: 'restricted', // Tests Confidential chip
    promotionStatus: 'promoted_pco',
    promotedRecordId: 'PCO-019',
    responseDueAt: relDate(-3, '17:00:00-07:00'),
    lastActivityAt: relDate(-3, '16:05:00-07:00'),
    ballInCourtName: 'Sarah Jenkins (Vanguard GC)',
    primaryCompany: 'Riverside Health System',
    tradeLabel: '08 71 00 — Door Hardware',
    hasAttachments: true,
    isExternalUnread: false,
    estimatedCostImpact: '$18,450.00',

    linkedObjects: [
      {
        objectType: 'SUBMITTAL',
        objectId: 'SUB-088',
        displayCode: 'SUB-088',
        title: '08 71 00 — Patient Room Card-Reader Door Hardware Schedule (Rev 1)',
        revisionLabel: 'Rev 1',
        revisionStatus: 'current',
      },
      {
        objectType: 'CHANGE_ORDER',
        objectId: 'PCO-019',
        displayCode: 'PCO-019',
        title: 'Owner Directive — Imaging Suite Chiller Pad Vibration Isolators',
        revisionLabel: 'Draft',
        revisionStatus: 'current',
      },
    ],

    participants: [
      { participantId: 'usr-sarah', roleType: 'FROM', deliveryStatus: 'delivered' },
      { participantId: 'usr-valerie', roleType: 'TO', deliveryStatus: 'bounced' }, // Tests bounce error state
    ],

    aiSummary: null,
    messages: [
      {
        id: 'msg-1031-1',
        entryType: 'EXTERNAL_EMAIL',
        direction: 'OUTBOUND',
        senderId: 'usr-sarah',
        senderName: 'Sarah Jenkins',
        senderCompany: 'Vanguard Construction Group',
        senderRole: 'Project Manager',
        isExternal: false,
        sentAt: relDate(-4, '11:00:00-07:00'),
        deliveryStatus: 'bounced',
        bounceErrorText:
          '550 5.1.1 <vchen-old@riversidehealth.org>: Recipient address rejected: User mailbox migrated. Update contact email in Directory or re-send to vchen@riversidehealth.org.',
        bodyText:
          'Valerie — Please review the attached 24V power supply revision for Submittal SUB-088 and acknowledge receipt by Tuesday so we can release hardware fabrication.',
        attachments: [],
      },
    ],
    auditLog: [
      {
        id: 'aud-1031-1',
        eventType: 'SMTP_BOUNCED',
        deliveryStatus: 'bounced',
        actorName: 'System SMTP Relay',
        actorEmail: 'mailer-daemon@mail.linarc.io',
        occurredAt: relDate(-4, '11:00:12-07:00'),
        detail: '550 5.1.1 Mailbox migrated for vchen-old@riversidehealth.org',
      },
    ],
  },
];

// 6. External Collaborator Magic-Link Tokens (Drives correspondence-portal)
export const MAGIC_LINK_PORTAL_TOKENS = {
  'tk-marcus-a302': {
    tokenId: 'tk-marcus-a302',
    threadId: 'THR-1042',
    recipientName: 'Marcus Vance',
    recipientEmail: 'm.vance@acoustix.com',
    recipientCompany: 'Acoustix Consultants',
    recipientRole: 'Acoustical Engineer',
    requestedByName: 'Alex Morgan (Vanguard Construction Group)',
    projectTitle: 'Riverside Medical Center — North Tower Expansion',
    responseDueAt: relDate(2, '17:00:00-07:00'),
    subject: '[RMC-04] A-302 Rev 3 — Grid B-4 HVAC Duct & Acoustic Cove Clash',
    messageSummary:
      'Marcus — Please review the highlighted clash at Grid B-4 on Drawing A-302 Rev 3. Can we shift the acoustic baffle profile 4" north to clear the 18" HVAC trunk without degrading the STC-50 corridor rating?',
    pinnedDrawing: {
      displayCode: 'A-302',
      title: 'Level 3 Reflected Ceiling Plan — East Wing',
      revisionLabel: 'Rev 3 (Current)',
      gridLocation: 'Grid B-4 · Corridor 3E',
      markupLabel: '18" HVAC trunk duct clashes with acoustic cove & W24 steel beam',
    },
    files: [
      {
        id: 'att-a302-snap',
        fileName: 'A-302_Rev3_Grid_B4_Markup_Snapshot.png',
        fileSizeLabel: '1.8 MB',
        deliveryMode: 'INLINE',
      },
      {
        id: 'att-site-video',
        fileName: 'Site_Walk_Corridor3E_Grid_B4.mp4',
        fileSizeLabel: '45.2 MB (Streamed via Linarc Cloud)',
        deliveryMode: 'MAGIC_LINK',
      },
    ],
  },

  'tk-dave-sub88': {
    tokenId: 'tk-dave-sub88',
    threadId: 'THR-1039',
    recipientName: 'Kenji Takahashi, AIA',
    recipientEmail: 'ktakahashi@studio-arch.com',
    recipientCompany: 'Studio West Architecture',
    recipientRole: 'Architect of Record',
    requestedByName: 'Alex Morgan (Vanguard Construction Group)',
    projectTitle: 'Riverside Medical Center — North Tower Expansion',
    responseDueAt: relDate(0, '17:00:00-07:00'),
    subject: '[RMC-04] RFI-142 — Level 2 OR Lead-Lined Drywall Termination Clarification',
    messageSummary:
      'Please review formal RFI-142 regarding lead-lined gypsum board termination height at Grid D-7.',
    pinnedDrawing: {
      displayCode: 'A-511',
      title: 'Interior Partition Types & Radiation Shielding Details',
      revisionLabel: 'Rev 2 (Current)',
      gridLocation: 'Grid D-7 · Operating Room 2B',
      markupLabel: 'Verify slab-to-slab lead continuity vs +6" above ceiling plane',
    },
    files: [],
  },
};