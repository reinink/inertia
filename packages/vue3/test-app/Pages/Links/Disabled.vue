<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
</script>

<template>
  <div>
    <span class="text">This is the links page that demonstrates disabled attribute</span>

    <Link href="/#" class="disabled-default" disabled>Disabled Default</Link>
    <Link href="/#" class="disabled" :disabled="true">Disabled</Link>
    <Link href="/links/disabled" class="enabled" :disabled="false">Enabled</Link>
    <Link href="/links/disabled" class="enabled-default">Enabled Default</Link>

    <Link as='button' href="/#" class="disabled-default" disabled>Disabled Default Button</Link>
    <Link as='button' href="/#" class="disabled" :disabled="true">Disabled Button</Link>
    <Link as='button' href="/links/disabled" class="enabled" :disabled="false">Enabled Button</Link>
    <Link as='button' href="/links/disabled" class="enabled-default">Enabled Default Button</Link>
  </div>
</template>
