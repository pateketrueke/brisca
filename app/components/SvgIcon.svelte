<script>
  export let fill = 'currentColor';
  export let size = 16;
  export let name;
</script>

<svg width={size} height={size}>
  <use xlink:href="#icon-{name}" style="fill: {fill}" />
</svg>
