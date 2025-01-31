<script>
  let className
  export { className as class }
</script>

<div {...$$restProps} class="rounded border border-gray-300 p-4 text-sm text-gray-500 {className}">
  {#if $$slots.title}
    <div class="mb-2 font-bold">
      <slot name="title" />
    </div>
  {/if}

  <slot />
</div>
