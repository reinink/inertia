<script lang="ts">
  import { router, type ReloadOptions } from '@inertiajs/core'
  import { onDestroy, onMount } from 'svelte'

  export let data: string | string[] = ''
  export let params: ReloadOptions = {}
  export let buffer: number = 0
  export let as: keyof HTMLElementTagNameMap = 'div'
  export let always: boolean = false

  let loaded = false
  let fetching = false
  let el: HTMLElement
  let observer: IntersectionObserver | null = null

  onMount(() => {
    if (!el) {
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          return
        }

        if (!always) {
          observer?.disconnect()
        }

        if (fetching) {
          return
        }

        fetching = true

        const reloadParams = getReloadParams()

        router.reload({
          ...reloadParams,
          onStart: (event) => {
            fetching = true
            reloadParams.onStart?.(event)
          },
          onFinish: (event) => {
            loaded = true
            fetching = false
            reloadParams.onFinish?.(event)
          },
        })
      },
      {
        rootMargin: `${buffer}px`,
      },
    )

    observer.observe(el)
  })

  onDestroy(() => {
    observer?.disconnect()
  })

  function getReloadParams(): Partial<ReloadOptions> {
    if (!params && !data) {
      throw new Error('You must provide either a `data` or `params` prop.')
    }

    const reloadParams: Partial<ReloadOptions> = params || {} ;

    if (data) {
      reloadParams.only = (Array.isArray(data) ? data : [data]) as string[];
    }

    return reloadParams;
  }
</script>

{#if always || !loaded}
  <svelte:element this={as} bind:this={el} />
{/if}

{#if loaded}
  <slot />
{:else if $$slots.fallback}
  <slot name="fallback" />
{/if}
