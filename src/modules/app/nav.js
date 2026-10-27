// The module this app prototypes: its top-nav module tile, its tools (the top-nav strip) and one side-nav rail per tool.
// AppShell.vue reads this file; a new module edits this file only. Figma: Top Nav Bar (Module=…) and Side Nav <Module>.
//
// PLACEHOLDER DATA — an example "Project › Submittals" module. Replace the module, tools and rails with yours.
import {
  AlertCircle,
  Bolt,
  BookOpenText,
  Calendar,
  CalendarClock,
  CalendarDays,
  DollarSign,
  FileCheck,
  FileClock,
  FileQuestion,
  FileSearchBottomRight,
  FolderCheck,
  FolderOpen,
  Folders,
  HardHat,
  Info,
  List,
  ListChecks,
  ListX,
  Mail,
  MapPinned,
  MessageSquareMore,
  Network,
  Package,
  PencilRuler,
  ProjectModuleIcon,
  Receipt,
  ScrollText,
  Send,
  ShieldCheck,
  UserCog,
 Bell } from '@development/linarc-icons';

/** Top-nav module tile. `icon` is a module icon from @development/linarc-icons (ProjectModuleIcon, FinanceModuleIcon,
 *  DocsModuleIcon, FieldModuleIcon, ScheduleModuleIcon, QualityModuleIcon, PayrollModuleIcon). A module whose icon
 *  isn't in the package yet is built like the library's PreconstructionModuleIcon.js (P-014) until it moves there. */
export const MODULE = { label: 'Project', ariaLabel: 'Project', icon: ProjectModuleIcon, showChevron: true };

/** Accent for the selected tool (on the dark top nav) and the rail's selector: the module's accent tokens, which are the
 *  same in both themes (orange for Project, teal for Preconstruction, …). Never `--text-primary`: on the dark nav it
 *  disappears in light mode. */
export const ACCENT = { text: 'var(--text-accent-orange)', icon: 'var(--icon-accent-orange)' };

/** Tools in the top-nav strip, in order. One rail each below. `menuItem` is the tool's row in the module mega menu
 *  (MEGA_MENU item id): that row shows as current, and picking it opens the tool. */
export const TOOLS = [
  // Correspondence (docs/correspondence/spec.md §2): Communication › Email is the upgraded project Email screen (D-40);
  // Drawings and RFIs are stand-ins for the compose and Email-tab hosts.
  { id: 'communication', label: 'Communication', icon: Mail, menuItem: 'collaboration' },
  { id: 'drawings', label: 'Drawings', icon: PencilRuler, menuItem: 'plan-sheets' },
  { id: 'rfis', label: 'RFIs', icon: FileQuestion, menuItem: 'rfi' },
  { id: 'submittals', label: 'Submittals', icon: FileCheck, menuItem: 'submittals' },
];

const rail = (tool, items) =>
  items.map(([label, icon, extra]) => {
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return { id, label, icon, href: `/${tool}/${id}`, ...extra };
  });

// One side-nav rail per tool. `screen` names the prototype screen a rail item opens (router.js SCREENS); items without
// one stay inert until that screen is built. Labels must fit the 82px rail: two short lines at most ("Qualified Subs",
// "Comparison & Awards"); put the full name in `ariaLabel` / `tooltip` when the rail label is shortened.
export const RAILS = {
  // Only rails with a screen (docs/correspondence/screens.md: no dead rails). Needs action, Waiting, Overdue and
  // Unmatched are segments on the Email screen, not rail items.
  // Notifications (D-52, amended 2026-10-26): a rail item under Email; `screens` names the other screens that keep it
  // highlighted (the preferences page).
  communication: rail('communication', [
    ['Email', Mail, { screen: 'email' }],
    ['Notifications', Bell, { screen: 'notifications', screens: ['notificationsPrefs'] }],
  ]),
  drawings: rail('drawings', [['Sheets', PencilRuler, { screen: 'sheet' }]]),
  rfis: rail('rfis', [['All RFIs', List, { screen: 'rfis' }]]),
  submittals: rail('submittals', [
    ['All Submittals', List, { screen: 'list' }],
    ['Packages', Package],
  ]),
};

/** Module mega menu, opened from the top-nav module tile (Figma Mega Menu 40023243:158917 = StaticMegaMenu). Every area
 *  of the app, as drawn in Size=lg: four authored columns that StaticMegaMenu reflows to 2 (520–920px) and 1 (<520px).
 *  Each section's icon tile and stroke are its Figma accent (miscellaneous/fills/* + icon/accent/*); icons are the
 *  lucide glyphs the Figma "Main Menu / …" components draw. Copy is as in Figma, slips included (flagged in
 *  docs/findings-log.md F-002): "OwnerContract", and Config repeating Closeout's tagline and icon.
 *  `bookmarked` is the starting state; the demo session keeps the user's changes (session.js setBookmark). */
const section = (id, sectionTitle, tile, stroke, items) => ({
  id,
  sectionTitle,
  iconColor: stroke && `var(--${stroke})`,
  items: items.map(([itemId, name, secondary, icon, extra]) => ({
    id: itemId,
    name,
    secondary,
    icon,
    iconBgColor: `miscellaneous-fills-${tile}`,
    showBookmark: true,
    ...extra,
  })),
});

export const MEGA_MENU = [
  {
    id: 'col-1',
    groups: [
      section('portfolio', 'Portfolio', 'grey1-default', null, [
        ['project-portfolio', 'Project Portfolio', 'All Projects & Resource Performance', Folders,
          { iconColor: 'var(--border-accent-grey)', bookmarked: true }],
        ['admin', 'Admin', 'Settings & User Management', UserCog, { iconColor: 'var(--border-default)' }],
      ]),
      section('project', 'Project', 'orange', 'icon-accent-orange', [
        ['information', 'Information', 'Project Information & Activity', Info],
        ['directory', 'Directory', 'Details Directory & Templates', Bolt],
        ['collaboration', 'Collaboration', 'Communications & Notes', Send],
        ['closeout', 'Closeout', 'Field, Financial & Document Closeout', FolderCheck],
        ['config', 'Config', 'Field, Financial & Document Closeout', FolderCheck],
      ]),
    ],
  },
  {
    id: 'col-2',
    groups: [
      section('documentation', 'Documentation', 'blue', 'icon-accent-blue', [
        ['plan-sheets', 'Plan Sheets', 'Drawings, Markups & Version Control', PencilRuler],
        ['rfi', 'RFI', 'RFI, Workflows & Responses', FileSearchBottomRight],
        ['submittals', 'Submittals', 'Spec-Driven Submittals & Approvals', FileCheck],
        ['specbook', 'Specbook', 'Specifications with Tags & Annotations', BookOpenText],
        ['cloud-drive', 'Cloud Drive', 'Central Document Repository', FolderOpen],
      ]),
      section('scheduler', 'Scheduler', 'indigo', 'icon-accent-indigo', [
        ['wbs', 'WBS', 'Work Breakdown Structure', Network],
        ['schedule', 'Schedule', 'Schedule Tasks With Dates & Dependencies', Calendar],
      ]),
    ],
  },
  {
    id: 'col-3',
    groups: [
      section('financials', 'Financials & Controls', 'green', 'icon-accent-green', [
        ['owner-contract', 'OwnerContract', 'Owner’s Contract Value & Terms', ScrollText],
        ['subs-contract', 'Sub’s Contract', 'Subcontractor’s commitment and releases', ScrollText],
        ['owner-billing', 'Owner Billing', 'Owner pay apps & Invoices', Receipt],
        ['subs-billing', 'Sub’s Billing', 'Subcontractor’s pay apps & Invoices', Receipt],
        ['pay-apps', 'Pay Apps', 'Pay Applications & Invoices', FileClock],
        ['change-order', 'Change Order', 'Scope & Contract Changes', FileClock],
        ['costs', 'Costs', 'Actual & Job Cost', DollarSign],
        ['time-and-material', 'T & M', 'Time & Material Tracker', CalendarClock],
      ]),
    ],
  },
  {
    id: 'col-4',
    groups: [
      section('field', 'Field', 'yellow', 'icon-accent-yellow', [
        ['jobsite', 'Jobsite', 'Geofenced Site & Location Mapper', MapPinned],
        ['field-crew', 'Field Crew', 'Crew by Shift & Timecards', HardHat],
        ['safety', 'Safety', 'Incidents, Toolbox Talks & Safety Events', ShieldCheck],
        ['feeds', 'Feeds', 'Photos, Videos & Updates', MessageSquareMore],
      ]),
      section('quality', 'Quality', 'red', 'icon-accent-red', [
        ['punchlist', 'Punchlist', 'Pre-Inspection, Closeout & Owner Walkthroughs', ListX],
        ['issues', 'Issues', 'Office & Field Issues & Risk', AlertCircle],
        ['checklists', 'Checklists', 'Field & Office Checklists', ListChecks],
      ]),
    ],
  },
];

/** Top-nav Create menu (Figma Quick Create Menu = StaticMegaMenu). Set to null to hide the Create cell. Picking an
 *  item does nothing until a create screen exists for it (router.js). */
export const QUICK_CREATE = [
  {
    id: 'quick-create',
    groups: [
      {
        id: 'create',
        sectionTitle: 'Quick Create',
        items: [
          ['submittal', 'Submittal', FileCheck],
          ['rfi', 'RFI', FileQuestion],
        ].map(([id, name, icon]) => ({ id, name, icon, url: `/create/${id}`, iconBgColor: 'transparent' })),
      },
    ],
  },
];

// Project context shown in the top nav.
export const PROJECTS = [
  { value: 'northern-heights', label: 'Northern Heights' },
  { value: 'riverside-medical', label: 'Riverside Medical Center' }, // the Correspondence module's project (data/project.js)
];
export const CURRENT_PROJECT = 'riverside-medical';

export const PLACES = [
  { key: 'all', label: 'All locations', value: 'all' },
  { key: 'tower-a', label: 'Tower A', value: 'tower-a' },
];

export const USER = { name: 'Alex Morgan', email: 'alex@example.com' };
