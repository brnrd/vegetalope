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

  const icons = [
    /* light */
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
    </svg>`,

    /* dark */
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
    </svg>`
  ]
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
        {@html icons[i]}
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
    gap: 0.25rem;
    cursor: pointer;
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
  }

  /*
    Small visual hint for the current theme,
    without introducing colours.
  */
  input:checked + span {
    outline: 1px solid currentColor;
    outline-offset: 3px;
    border-radius: 6px;
  }
</style>