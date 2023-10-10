<script>
  
    
    import {createEventDispatcher} from 'svelte'
    import {v4 as uuidv4} from 'uuid'
    import Button from './Button.svelte';
    import Card from './Card.svelte';
    import RatingSelete from './RatingSelete.svelte';
    let btndisabled=true;
    let min=10;
    let rating=10;
    let message;
    let text='';
    const dispatch = createEventDispatcher()
    const handleSelect= e => rating = e.detail
    const handleInput = () => {
        if(text.trim().length <= min) {

            message = `Text must be at least ${min} characters`
            btndisabled = true
        } else {
            message = null
            btndisabled = false
    }
  }
  const handleSubmit=()=>{
    if(text.trim().length > min ){
        const newFeedback={
            id: uuidv4(),  //generate a unique id for each feedback item
            text,
            rating: +rating
        }
        dispatch('add-feedback',newFeedback);
    }
  }
</script>
<Card>
    <header>
        <h2>How would you rate your service with us?</h2>
    </header>


<form on:submit|preventDefault={handleSubmit}>
    <RatingSelete on:rating-select={handleSelect} />
    <div class="input-group">
        <input type="text" on:input={handleInput} bind:value={text} placeholder="Tell us something that keeps you coming back">
        <Button disabled={btndisabled} type="submit">Send</Button>
    </div>
    {#if message}
        <div class="message">
            {message}
    </div>
    {/if}
</form>
</Card>
<style>
     header {
    max-width: 400px;
    margin: auto;
  }

    
  

  .input-group {
    display: flex;
    flex-direction: row;
    border: 1px solid #ccc;
    padding: 8px 10px;
    border-radius: 8px;
    margin-top: 15px;
  }
  header h2{
    font-size: 22px;
    font-weight: 600;
    text-align: center;
  }

  input {
    flex-grow: 2;
    border: none;
    font-size: 16px;
  }
  .message{
    padding-top: 10px;
    text-align: center;
    color: rebeccapurple;
  }
</style>