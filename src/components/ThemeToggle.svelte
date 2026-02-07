<script>
  import { onMount } from 'svelte'

  const rootEl = document.documentElement
  const themes = ['light', 'dark']
  let theme = ''

  onMount(() => {
    const storedTheme = localStorage.getItem('theme')

    if (storedTheme === 'light' || storedTheme === 'dark') {
      theme = storedTheme
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark'
    } else {
      theme = 'light'
    }
  })

  function handleChange(event) {
    theme = event.target.value
    localStorage.setItem('theme', theme)
  }

  $: {
    rootEl.classList.toggle('theme-dark', theme === 'dark')
  }

</script>

<fieldset class="theme-toggle">
  <legend class="sr-only">Colour theme</legend>

  {#each themes as t, i}
    <label>
      <input
        type="radio"
        name="theme"
        value={t}
        checked={theme === t}
        on:change={handleChange}
        aria-label={`Use ${t} theme`}
      />

      <span aria-hidden="true">
        <span class="btn-text">{t}</span>
      </span>
    </label>
  {/each}
</fieldset>

<style>
  /* Keep this component visually neutral */

  fieldset {
    border: 0;
    padding: 0;
    margin: 0;
    display: inline-flex;
    gap: 0.25rem;
  }

  label {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    position: relative;
  }

  /* Visually hide the legend but keep it accessible */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /*
    Do NOT remove the radios from the accessibility tree.
    Just make them unobtrusive visually.
  */
  input {
    margin: 0;
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  /*
    Small visual hint for the current theme,
    without introducing colours.
  */
  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    border: 0;
    background: transparent;
    opacity: 0.8;
    line-height: 1;
    transition: opacity 120ms ease, background-color 120ms ease;
  }

  label:hover span {
    opacity: 0.9;
  }

  input:checked + span {
    opacity: 1;
    background-color: rgba(127, 127, 127, 0.12);
  }

  input:focus-visible + span {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .btn-text {
    text-transform: capitalize;
    font-size: 0.9em;
    letter-spacing: 0.01em;
  }

</style>
