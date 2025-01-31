<script context="module">
  export { default as layout } from '../Components/Layout.svelte'
</script>

<script lang="ts">
  import { router, WhenVisible } from '@inertiajs/svelte'

  export let appName
  export let items: {
    id: number
    name: string
  }[] = []
  export let page: number
  export let item_types: string[]
  export let item_type: string

  let currentItemType = item_type

  function setItemType(type: string) {
    currentItemType = type

    router.reload({
      data: {
        item_type: type,
        page: 1,
      },
      reset: ['items', 'page'],
      preserveUrl: true,
    })
  }
</script>

<svelte:head>
  <title>Infinite Scroll - {appName}</title>
</svelte:head>

<h1 class="text-3xl">And Beyond</h1>

<div class="my-6 space-x-4">
  {#each item_types as type (type)}
    <button class="rounded-lg bg-gray-200 px-4 py-1 hover:bg-gray-300" on:click={() => setItemType(type)}>
      {type}
    </button>
  {/each}
</div>

<div class="mt-6 w-full max-w-2xl overflow-hidden rounded border shadow-sm">
  <table class="w-full text-left">
    <thead>
      <tr>
        <th class="px-4 py-2">Id</th>
        <th class="px-4 py-2">Name</th>
      </tr>
    </thead>
    <tbody>
      {#each items as item (item.id)}
        <tr class="border-t">
          <td class="px-4 py-2">{item.id}</td>
          <td class="px-4 py-2">{item.name}</td>
        </tr>
      {:else}
        <tr>
          <td colspan="2" class="bg-gray-100 p-4 text-center">Loading items...</td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if items.length > 0}
    <WhenVisible
      always
      buffer={200}
      params={{
        data: {
          item_type: currentItemType,
          page: page + 1,
        },
        only: ['items', 'page'],
        preserveUrl: true,
      }}
    >
      <div slot="fallback" class="bg-gray-100 p-4 text-center">Fetching more items...</div>
      <div class="bg-gray-100 p-4 text-center">Fetching more items...</div>
    </WhenVisible>
  {/if}
</div>
