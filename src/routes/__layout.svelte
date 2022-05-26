<script>
import { toggleTheme } from "../commonStore";


  // import {Styles} from 'sveltestrap';

// import { missing_component } from "svelte/internal";

</script>

<svelte:head>
  {#if $toggleTheme == 'light'}
    <link rel="stylesheet" href="/bootstrap.min.css" />  
  {:else}
  <link rel="stylesheet" href="/bootstrap.min.dark.css" />  

  {/if}
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css">
  
</svelte:head>
<slot></slot>