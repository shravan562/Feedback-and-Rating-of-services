<script>
    import { fade,scale } from 'svelte/transition'
    import Feedbackitem from "./Feedbackitem.svelte";

    export let feedback= []
    console.log(feedback);

</script>

{#each feedback as fb (fb.id) }
<div in:scale out:fade = "{{duration:400}}">
    <Feedbackitem item ={fb} on:delete-feedback />

</div>

    
    
{/each}