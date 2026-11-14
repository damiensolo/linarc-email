// PLACEHOLDER DATA — Correspondence module: distribution lists (D-75, 2026-11-14). Today's product keeps a distribution
// list per document type (00-plan.md §0); here they are the groups Compose offers as one chip each: the project's lists,
// plus the record's own list when composing from a record. A group chip expands to its members when the message is
// sent (RecipientField `groups`; recipients.js `expandRecipients`).
import { getPerson } from './people';
import { getRecord } from './records';

export const DISTRIBUTION_LISTS = Object.freeze([
  { id: 'design-team', name: 'Design team', memberIds: ['usr-kenji', 'usr-elena'] },
  { id: 'owner', name: 'Owner', memberIds: ['usr-valerie'] },
  { id: 'level-2-subs', name: 'Level 2 subs', memberIds: ['usr-dave', 'usr-ray'] },
]);

const asRecipient = (p) => ({ id: p.id, email: p.email, name: p.name, company: p.company, role: p.role, avatarUrl: p.avatarUrl || '' });

/** A list as RecipientField takes a group: `{ id, name, members: [recipient] }`, the viewer left out. */
export function groupOf(list, viewerId) {
  return { id: list.id, name: list.name, members: list.memberIds.filter((id) => id !== viewerId).map(getPerson).filter(Boolean).map(asRecipient) };
}

/**
 * The groups Compose offers (first the record's own distribution list, when composing from a record with one, then
 * the project's lists); groups with nobody left (the viewer was the only member) are dropped.
 */
export function distributionGroups(recordId, viewerId) {
  const record = recordId ? getRecord(recordId) : null;
  const own = record && record.distributionIds && record.distributionIds.length ? [{ id: `record:${record.id}`, name: `${record.code} distribution`, memberIds: record.distributionIds, own: true }] : [];
  return [...own, ...DISTRIBUTION_LISTS].map((l) => ({ ...groupOf(l, viewerId), own: !!l.own })).filter((g) => g.members.length);
}
