<script>
  import { inertia, router } from '@inertiajs/svelte'

  export let pageNumber
  export let multiByte
</script>

<a href="/history/1" use:inertia>Page 1</a>
<a href="/history/2" use:inertia>Page 2</a>
<a href="/history/3" use:inertia>Page 3</a>
<a href="/history/4" use:inertia>Page 4</a>
<a href="/history/5" use:inertia>Page 5</a>

<button on:click={() => router.clearHistory()}>Clear History</button>

<div>This is page {pageNumber}.</div>
<div>Multi byte character: {multiByte}</div>
