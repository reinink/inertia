<script>
  import { router } from '@inertiajs/svelte'

  export let foo
  export let bar

  const replace = () => {
    router.replace({
      props: (props) => ({ ...props, foo: 'foo from client' }),
    })
  }

  const push = () => {
    router.push({
      url: '/client-side-visit-2',
      component: 'ClientSideVisit/Page2',
      props: { baz: 'baz from client' },
    })
  }
</script>

<div>
  <div>{foo}</div>
  <div>{bar}</div>
  <button on:click={replace}>Replace</button>
  <button on:click={push}>Push</button>
</div>
