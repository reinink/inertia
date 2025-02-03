<script context="module">
  export { default as layout } from '../Components/Layout.svelte'
</script>

<script>
  import { inertia, router } from '@inertiajs/svelte'
  export let appName
</script>

<svelte:head>
  <title>Home - {appName}</title>
</svelte:head>

<h1 class="text-3xl">Home</h1>

<div class="mt-6 space-y-4">
  <div>
    <a href="/article#far-down" use:inertia class="text-blue-700 underline">Link to bottom of article page</a>
  </div>

  <div>
    <button type="button" class="rounded-lg bg-blue-500 px-4 py-2 text-white" on:click={() => router.clearHistory()}>
      Clear history
    </button>
  </div>
</div>
