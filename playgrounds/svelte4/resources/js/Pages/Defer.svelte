<script context="module">
  export { default as layout } from '../Components/Layout.svelte'
</script>

<script lang="ts">
  import { Deferred, WhenVisible } from '@inertiajs/svelte'
  import Spinner from '../Components/Spinner.svelte'
  import TestGrid from '../Components/TestGrid.svelte'
  import TestGridItem from '../Components/TestGridItem.svelte'

  type Users = {
    id: number
    name: string
    email: string
  }

  type Organizations = {
    id: number
    name: string
    url: string
  }

  type Foods = {
    id: number
    name: string
  }

  type Surprise = {
    id: number
    name: string
  }

  type Dogs = {
    id: number
    name: string
  }

  type Lunch = {
    id: number
    name: string
  }

  export let appName
  export let users: Users[] = []
  export let organizations: Organizations[] = []
  export let foods: Foods[] = []
  export let surprise: Surprise[] = []
  export let dogs: Dogs[] = []
  export let lunch: Lunch[] = []
</script>

<svelte:head>
  <title>Async Request - {appName}</title>
</svelte:head>

<h1 class="text-3xl">Deferred Props</h1>

<div class="mt-6 rounded border border-yellow-500 bg-yellow-200 p-4">
  <p>Page is loaded!</p>
</div>

<TestGrid>
  <TestGridItem>
    <Deferred data="users">
      <svelte:fragment slot="fallback">
        <p>Loading Users...</p>
      </svelte:fragment>

      <div>
        {#each users as user (user.id)}
          <p>#{user.id}: {user.name} ({user.email})</p>
        {/each}
      </div>
    </Deferred>
  </TestGridItem>

  <TestGridItem>
    <Deferred data="foods">
      <svelte:fragment slot="fallback">
        <p>Loading Foods...</p>
      </svelte:fragment>

      <div>
        {#each foods as food (food.id)}
          <p>#{food.id}: {food.name}</p>
        {/each}
      </div>
    </Deferred>
  </TestGridItem>

  <TestGridItem>
    <Deferred data="organizations">
      <svelte:fragment slot="fallback">
        <p>Loading Organizations...</p>
      </svelte:fragment>

      <div>
        {#each organizations as org (org.id)}
          <p>#{org.id}: {org.name} ({org.url})</p>
        {/each}
      </div>
    </Deferred>
  </TestGridItem>
</TestGrid>

<div class="mt-72">
  <WhenVisible data="surprise">
    <svelte:fragment slot="fallback">
      <div class="h-24">
        <div class="flex items-center"><Spinner /> Loading Surprise...</div>
      </div>
    </svelte:fragment>

    <div>
      {#each surprise as s (s.id)}
        <p>#{s.id}: {s.name}</p>
      {/each}
    </div>
  </WhenVisible>
</div>

<div class="mt-72">
  <WhenVisible data={['dogs', 'lunch']} buffer={200}>
    <svelte:fragment slot="fallback">
      <div class="h-24">
        <div class="flex items-center"><Spinner /> Loading Dogs and Lunch...</div>
      </div>
    </svelte:fragment>

    <div class="flex space-x-6">
      <div>
        {#each dogs as dog (dog.id)}
          <p>#{dog.id}: {dog.name}</p>
        {/each}
      </div>

      <div>
        {#each lunch as item (item.id)}
          <p>#{item.id}: {item.name}</p>
        {/each}
      </div>
    </div>
  </WhenVisible>
</div>
