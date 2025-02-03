<script>
  import { inertia } from '@inertiajs/svelte'
</script>

<div>
  <a href="/prefetch/swr/2" use:inertia={{ prefetch: true, cacheFor: '1s' }}>1s Expired</a>
  <a href="/prefetch/swr/3" use:inertia={{ prefetch: true, cacheFor: 1000 }}>1s Expired (Number)</a>
  <a href="/prefetch/swr/4" style="margin: 0 20px" use:inertia={{ prefetch: true, cacheFor: ['1s', '3s'] }}>
    1s Stale, 2s Expired
  </a>
  <a href="/prefetch/swr/5" use:inertia={{ prefetch: true, cacheFor: [1000, 3000] }}> 1s Stale, 2s Expired (Number) </a>
  <div>
    <slot />
  </div>
</div>
