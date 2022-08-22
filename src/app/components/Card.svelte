<script>
  export let value = { number: 0, kind: 'UNKNOWN' };
  export let disabled;
  export let focused;
  export let number;
  export let type;
</script>

{#if type === 'deck'}
  {#if number > 0}
    <span class="card deck" title="{number} cards left">
      <small>{number}</small>
    </span>
    <slot />
  {:else}
    <button class="card deck" disabled />
  {/if}
{:else if type === 'button'}
  <button {disabled} tabindex="-1" data-cardset="{value.kind}:{value.number}" title="{value.number} of {value.kind}" class:focused class="card" on:click>
    <sub>{value.number}</sub>
    <small>{value.kind}</small>
    <sup>{value.number}</sup>
  </button>
{:else}
  <span data-cardset="{value.kind}:{value.number}" title="{value.number} of {value.kind}" class="card">
    <sub>{value.number}</sub>
    <small>{value.kind}</small>
    <sup>{value.number}</sup>
  </span>
{/if}
