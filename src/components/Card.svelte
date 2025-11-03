<script>
  let {
    onClick,
    children = undefined,
    value = { number: 0, kind: 'UNKNOWN' },
    disabled = false,
    focused = false,
    number = 0,
    type = '',
  } = $props();
</script>

{#if type === 'deck'}
  {#if number > 0}
    <span class="card deck" title="{number} cards left">
      <small>{number}</small>
    </span>
    {@render children?.()}
  {:else}
    <button class="card deck" title="" disabled></button>
  {/if}
{:else if type === 'button'}
  <button
    {disabled}
    tabindex="-1"
    onclick={onClick}
    data-cardset="{value.kind}:{value.number}"
    title="{value.number} of {value.kind}"
    class:focused
    class="card"
  >
    <sub>{value.number}</sub>
    <small>{value.kind}</small>
    <sup>{value.number}</sup>
  </button>
{:else}
  <span
    data-cardset="{value.kind}:{value.number}"
    title="{value.number} of {value.kind}"
    class="card"
  >
    <sub>{value.number}</sub>
    <small>{value.kind}</small>
    <sup>{value.number}</sup>
  </span>
{/if}
