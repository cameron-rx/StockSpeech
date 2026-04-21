<script lang="ts">
	import { enhance } from '$app/forms';
	import {resolve} from '$app/paths';

	let { form } = $props();
</script>

<div class="flex h-full flex-col items-center justify-center gap-8">
	<h1 class="text-5xl font-bold">Stock<span class="text-accent">Speech</span></h1>
	{#if form?.success}
		<div class="flex w-full max-w-sm flex-col items-center gap-4 px-6 text-center">
			<p class="text-sm">
				If an account exists for that email, a password reset link has been sent. Please check your
				inbox.
			</p>
			<a href={resolve('/login')} class="link text-sm">Back to login</a>
		</div>
	{:else}
		<form
			class="flex w-full max-w-sm flex-col items-center gap-8 px-6"
			method="POST"
			use:enhance
		>
			<div class="w-full">
				<p class="mb-4 text-center text-sm">
					Enter your email and we'll send you a link to reset your password.
				</p>
				<div class="flex flex-col gap-1">
					<label class="label" for="email">Email</label>
					<input
						class="input"
						id="email"
						type="email"
						name="email"
						placeholder="you@example.com"
						required
					/>
				</div>
			</div>
			<button class="btn w-full rounded-2xl" type="submit">Send reset link</button>

			{#if form?.message}
				<p role="alert" class="text-center text-sm text-error">{form.message}</p>
			{/if}

			<a href={resolve("/login")} class="link text-sm">Back to login</a>
		</form>
	{/if}
</div>
