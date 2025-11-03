<script>
  import IconAt from '$lib/sprites/at.svg';
  import IconEnter from '$lib/sprites/enter.svg';
  import IconGear from '$lib/sprites/gear.svg';
  import IconNobell from '$lib/sprites/nobell.svg';
  import IconRepeat from '$lib/sprites/repeat.svg';
  import IconStar from '$lib/sprites/star.svg';
  import IconWarn from '$lib/sprites/warn.svg';

  /**
   * @type {Record<string, string>}
   */
  const STATIC_ICONS = {
    at: IconAt,
    enter: IconEnter,
    gear: IconGear,
    nobell: IconNobell,
    repeat: IconRepeat,
    star: IconStar,
    warn: IconWarn,
  };

  let {
    fill = 'currentColor',
    size = '16',
    name = '',
  } = $props();
</script>

<svg width={size} height={size}>
  <use xlink:href="#{STATIC_ICONS[name]}" style="fill: {fill}" />
</svg>
