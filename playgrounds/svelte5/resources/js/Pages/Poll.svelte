<script context="module">
  export { default as layout } from '../Components/Layout.svelte'
</script>

<script>
  import { onMount } from 'svelte'
  import { router, usePoll } from '@inertiajs/svelte'
  import TestGrid from '../Components/TestGrid.svelte'
  import TestGridItem from '../Components/TestGridItem.svelte'

  export let appName
  export let users = []
  export let companies = []

  let userPollCount = 0
  let hookPollCount = 0
  let companyPollCount = 0

  const triggerAsyncRedirect = () => {
    router.get(
      '/elsewhere',
      {},
      {
        only: ['something'],
        async: true,
      },
    )
  }

  const { start: startHookPolling, stop } = usePoll(
    2000,
    {
      only: ['asdf'],
      onFinish() {
        hookPollCount++
      },
    },
    {
      keepAlive: true,
      autoStart: false,
    },
  )

  onMount(() => {
    setTimeout(() => {
      startHookPolling()
    }, 2000)

    const { stop: stopUserPolling } = router.poll(
      1000,
      {
        only: ['users'],
        onFinish() {
          userPollCount++
        },
      },
      { keepAlive: true },
    )

    setTimeout(() => {
      console.log('stopping user polling')
      stopUserPolling()
    }, 3000)
  })
</script>

<svelte:head>
  <title>Async Request - {appName}</title>
</svelte:head>

<h1 class="text-3xl">Poll</h1>

<TestGrid>
  <TestGridItem>
    <svelte:fragment slot="title">
      User Poll Request Count: {userPollCount}
    </svelte:fragment>
    <div>
      {#each users as user}
        <div>{user}</div>
      {/each}
    </div>
  </TestGridItem>
  <TestGridItem>
    <svelte:fragment slot="title">
      Companies Poll Request Count: {companyPollCount}
    </svelte:fragment>
    <div>
      {#each companies as company}
        <div>{company}</div>
      {/each}
    </div>
  </TestGridItem>
  <TestGridItem>
    <svelte:fragment slot="title">
      Hook Poll Request Count: {hookPollCount}
    </svelte:fragment>
  </TestGridItem>
  <TestGridItem>
    <button on:click={() => triggerAsyncRedirect()}>Trigger Async Redirect</button>
  </TestGridItem>
</TestGrid>
