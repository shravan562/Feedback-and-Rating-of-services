<script>
	import Feedbacklist from './components/Feedbacklist.svelte';
	import Feedbackitem from './components/Feedbackitem.svelte';
	import FeedbackStats from './components/FeedbackStats.svelte';
	import FeedbackForm from './components/FeedbackForm.svelte';

	let feedback=[
		{
			id:1,
			rating:10,
			text:'The conservation value of these man-made heaths has become much more appreciated due to their historical cultural value as habitats;[7] consequently, most heathlands are protected. However they are also threatened by tree incursion because of the discontinuation of traditional management techniques, such as grazing and burning, that mediated the landscapes. Some are also threatened by urban sprawl. Anthropogenic heathlands are maintained artificially by a combination of grazing and periodic burning (known as swailing),[8] or (rarely) mowing.'

		},
		{
			id:2,
			rating:9,
			text:'The conservation value of these man-made heaths has become much more appreciated due to their historical cultural value as habitats;[7] consequently, most heathlands are protected. However they are also threatened by tree incursion because of the discontinuation of traditional management techniques, such as grazing and burning, that mediated the landscapes. Some are also threatened by urban sprawl. Anthropogenic heathlands are maintained artificially by a combination of grazing and periodic burning (known as swailing),[8] or (rarely) mowing.'

		},
		{
			id:3,
			rating:8,
			text:'The conservation value of these man-made heaths has become much more appreciated due to their historical cultural value as habitats;[7] consequently, most heathlands are protected. However they are also threatened by tree incursion because of the discontinuation of traditional management techniques, such as grazing and burning, that mediated the landscapes. Some are also threatened by urban sprawl. Anthropogenic heathlands are maintained artificially by a combination of grazing and periodic burning (known as swailing),[8] or (rarely) mowing.'

		}
	]
	$:count = feedback.length;
	$:average = feedback.reduce((a,{rating}) => a + rating, 0)/feedback.length
	const deleteFeedback=(e)=>{
		const itemId =e.detail
		feedback = feedback.filter((item) => item.id !=itemId)
	}
	const addFeedback=(e)=>{
		const newFeedback = e.detail
		feedback = [newFeedback,...feedback]
	}
	  
</script>

<main class="container">
	<FeedbackForm on:add-feedback={addFeedback}/>
	<FeedbackStats {count} {average} />
	
	<Feedbacklist {feedback} on:delete-feedback={deleteFeedback}  />
	 
	
</main>

