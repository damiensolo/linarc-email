// Navigation configuration for Project Management & Correspondence (1-setup-playbook.md §6, D-13, D-35)
// Rule: Rail labels must fit the 82px rail (1–2 short lines, max ~12 chars per word) so they never break mid-word.

export const PROJECT_CONTEXT = {
  id: 'proj-rmc-2026',
  code: 'RMC-04',
  name: 'Riverside Medical Center — North Tower',
  companyName: 'Vanguard Construction Group',
};

export const MODULE = {
  id: 'project-management',
  label: 'Project Mgmt',
  accentColor: 'primary',
};

// Top-nav strip tools & their corresponding 82px SideNavV2 rails
export const TOOLS = [
  {
    id: 'inbox',
    label: 'Inbox',
    defaultScreen: 'correspondence-list',
    menuItem: {
      id: 'tool-inbox',
      title: 'Inbox',
      subtitle: 'Project correspondence & action tracking',
      icon: 'Mail',
    },
    rails: [
      {
        id: 'all-mail',
        label: 'All mail', // 8 chars — fits 82px rail cleanly
        icon: 'Inbox',
        screen: 'correspondence-list',
      },
      {
        id: 'needs-action',
        label: 'Needs action', // 2 short words (5, 6 chars)
        icon: 'AlertCircle',
        screen: 'correspondence-list',
        query: { view: 'needs_action' },
      },
      {
        id: 'waiting',
        label: 'Waiting', // 7 chars
        icon: 'Clock',
        screen: 'correspondence-list',
        query: { view: 'waiting' },
      },
      {
        id: 'sent',
        label: 'Sent mail', // 2 short words (4, 4 chars)
        icon: 'Send',
        screen: 'correspondence-list',
        query: { view: 'sent' },
      },
    ],
  },

  {
    id: 'drawings',
    label: 'Drawings',
    defaultScreen: 'correspondence-context-dwg',
    menuItem: {
      id: 'tool-drawings',
      title: 'Drawings',
      subtitle: 'Sheet viewer & markup-to-email',
      icon: 'Layers',
    },
    rails: [
      {
        id: 'sheets',
        label: 'Current set', // 2 short words (7, 3 chars)
        icon: 'FileText',
        screen: 'correspondence-context-dwg',
      },
      {
        id: 'revisions',
        label: 'Revisions', // 9 chars
        icon: 'History',
        screen: 'correspondence-context-dwg',
      },
    ],
  },

  {
    id: 'rfis',
    label: 'RFIs',
    defaultScreen: 'correspondence-context-rfi',
    menuItem: {
      id: 'tool-rfis',
      title: 'RFIs',
      subtitle: 'Formal requests & linked threads',
      icon: 'HelpCircle',
    },
    rails: [
      {
        id: 'open-rfis',
        label: 'Open RFIs', // 2 short words (4, 4 chars)
        icon: 'FolderOpen',
        screen: 'correspondence-context-rfi',
      },
      {
        id: 'rfi-drafts',
        label: 'Drafts', // 6 chars
        icon: 'Edit3',
        screen: 'correspondence-context-rfi',
      },
    ],
  },

  {
    id: 'configure',
    label: 'Configure',
    defaultScreen: 'correspondence-list',
    menuItem: {
      id: 'tool-configure',
      title: 'Configure',
      subtitle: 'Inbound aliases, routing & SLA rules',
      icon: 'Settings',
    },
    rails: [
      {
        id: 'routing',
        label: 'SLA & rules', // 11 chars total
        icon: 'Sliders',
        screen: 'correspondence-list',
      },
      {
        id: 'inbound',
        label: 'Inbound mail', // 2 short words (7, 4 chars)
        icon: 'AtSign',
        screen: 'correspondence-list',
      },
    ],
  },
];

// StaticMegaMenu items for TopNavBar #create-dropdown slot (5-ui-patterns.md §4)
// Rule: items use iconBgColor: 'transparent' and neutral icons.
export const QUICK_CREATE_ITEMS = [
  {
    id: 'qc-message',
    title: 'New project message',
    description: 'Send external or internal correspondence linked to a record',
    icon: 'Mail',
    iconBgColor: 'transparent',
    action: {
      type: 'slide-over',
      panel: 'contextual-compose',
      defaultRecordId: 'A-302-Rev3',
    },
  },
  {
    id: 'qc-rfi',
    title: 'New formal RFI',
    description: 'Create a numbered Request for Information',
    icon: 'HelpCircle',
    iconBgColor: 'transparent',
    screen: 'correspondence-context-rfi',
    recordId: 'RFI-143',
  },
];

// Top-nav module switcher mega menu (5-ui-patterns.md §4)
export const MEGA_MENU = [
  {
    category: 'Project Execution',
    items: TOOLS.map((t) => t.menuItem),
  },
];

export function getNavForScreen(screenSlug) {
  if (screenSlug === 'correspondence-context-dwg') {
    return { toolId: 'drawings', railId: 'sheets' };
  }
  if (screenSlug === 'correspondence-context-rfi') {
    return { toolId: 'rfis', railId: 'open-rfis' };
  }
  if (screenSlug === 'correspondence-portal') {
    // External portal uses reduced TopNavBar and no side rail (D-38, 5-ui-patterns.md §1)
    return { toolId: null, railId: null, isExternalPortal: true };
  }
  return { toolId: 'inbox', railId: 'all-mail' };
}