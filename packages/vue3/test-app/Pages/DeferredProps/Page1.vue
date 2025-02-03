<script setup lang="ts">
import { Deferred, Link } from '@inertiajs/vue3'

defineProps<{
  foo?: { text: string }
  bar?: { text: string }
}>()
</script>

<template>
  <Deferred data="foo">
    <template #fallback>
      <div>Loading foo...</div>
    </template>
    {{ foo?.text }}
  </Deferred>

  <Deferred data="bar">
    <template #fallback>
      <div>Loading bar...</div>
    </template>
    {{ bar?.text }}
  </Deferred>

  <Link href="/deferred-props/page-1">Page 1</Link>
  <Link href="/deferred-props/page-2">Page 2</Link>
</template>
