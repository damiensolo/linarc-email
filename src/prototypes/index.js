/**
 * Auto-discovers prototypes: every `src/prototypes/<slug>/index.vue` is listed.
 * Optional metadata, exported as `prototype` from the component options:
 *   title    picker label ("Submittals › Detail"; keep it short: no module prefix)
 *   figma    the frame URL (the sandbox shows a Figma ↗ link)
 *   records  () => [{ value, label }]: the record ids the screen accepts in the hash, for the sandbox's record picker
 *   roles    () => ({ options: [{ value, label }], value, set(id) }): the viewer roles a role-gated screen can show,
 *            for the sandbox's role switcher (the choice lives in the demo session; the screen remounts)
 *   inbound  () => ({ senders, destinations, files: [{ value, label }], receive(mail) → { message, openLabel, open } }):
 *            mail from outside the product, for the sandbox's *Simulate inbound email* (src/modules/SimulateInboundModal.vue;
 *            `mail` = { fromId | fromEmail, to, subject, body, file }; the screen remounts after receipt)
 *   hidden   true keeps the slug out of the picker (still opens by URL). Slugs starting with `_` are hidden too.
 */
const modules = import.meta.glob('./*/index.vue', { eager: true });

export default Object.entries(modules)
  .map(([file, mod]) => {
    const slug = file.split('/')[1];
    const meta = mod.default.prototype || {};
    return {
      slug,
      title: meta.title || slug,
      figma: meta.figma || '',
      records: meta.records || null,
      roles: meta.roles || null,
      inbound: meta.inbound || null,
      hidden: Boolean(meta.hidden) || slug.startsWith('_'),
      component: mod.default,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));
