<script lang="ts">
  import type { FormDataConvertible, Method, PreserveStateOption, SerializationArrayFormat } from '@inertiajs/core'
  import { inertia } from '../index'

  export let href: string
  export let as: keyof HTMLElementTagNameMap = 'a'
  export let data: Record<string, FormDataConvertible> = {}
  export let method: Method = 'get'
  export let replace: boolean = false
  export let preserveScroll: PreserveStateOption = false
  export let preserveState: PreserveStateOption | null = null
  export let only: string[] = []
  export let except: string[] = []
  export let headers: Record<string, string> = {}
  export let queryStringArrayFormat: SerializationArrayFormat = 'brackets'
  export let formDataArrayFormat: SerializationArrayFormat = 'indices'

  $: asProp = method !== 'get' ? 'button' : as.toLowerCase()
  $: elProps =
    {
      a: { href },
      button: { type: 'button' },
    }[asProp] || {}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<svelte:element
  this={as}
  use:inertia={{
    ...(as !== 'a' ? { href } : {}),
    data,
    method,
    replace,
    preserveScroll,
    preserveState: preserveState ?? method !== 'get',
    only,
    except,
    headers,
    queryStringArrayFormat,
    formDataArrayFormat,
  }}
  {...$$restProps}
  {...elProps}
  on:focus
  on:blur
  on:click
  on:dblclick
  on:mousedown
  on:mousemove
  on:mouseout
  on:mouseover
  on:mouseup
  on:cancel-token
  on:before
  on:start
  on:progress
  on:finish
  on:cancel
  on:success
  on:error
>
  <slot />
</svelte:element>
