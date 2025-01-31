<script>
  let className = ''
  export { className as class }
</script>

<div {...$$restProps} class="mt-6 grid grid-cols-3 gap-4 {className}">
  <slot />
</div>
