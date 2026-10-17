<template>
  <!-- Starter for a new screen. Copy this folder to src/prototypes/<slug>/ (slug = `<module>-<screen>`), set the
       title and the Figma frame URL below, add the screen to src/modules/app/router.js SCREENS and (if it sits on a
       rail) to nav.js. Hidden from the picker (slug starts with `_`); open it with ?p=_blank. -->
  <AppShell screen="list" title="New screen">
    <template #header-actions>
      <Button label="Primary action" color-scheme="primary" variant="solid" size="medium" />
    </template>
    <template #content>
      <div class="flex flex-col gap-space-16 pt-space-16">
        <p class="m-0 font-label text-fontsize-14 leading-lineheight-20 text-text-subtle">
          Build the screen here with library components and token classes. Rules: CLAUDE.md; patterns: docs/5-ui-patterns.md.
        </p>
      </div>
    </template>
  </AppShell>
</template>

<script>
import Button from '@/components/Button/Button.vue';
import AppShell from '~/modules/app/AppShell.vue';

export default {
  name: 'BlankScreen',
  prototype: { title: 'Blank', figma: '', hidden: true },
  components: { AppShell, Button },
};
</script>
