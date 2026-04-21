<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<div class="flex h-full flex-col items-center justify-center gap-8">
	<h1 class="text-5xl font-bold">Stock<span class="text-accent">Speech</span></h1>
	<form class="flex w-full max-w-sm flex-col items-center gap-8 px-6" method="POST" use:enhance>
		<div class="w-full">
			<p class="mb-4 text-center text-sm">Enter your new password.</p>
			<div class="flex flex-col gap-1">
				<label class="label" for="password">New password</label>
				<input
					class="input"
					id="password"
					type="password"
					name="password"
					placeholder="••••••••"
					minlength={6}
					required
				/>
			</div>
			<div class="flex flex-col gap-1">
				<label class="label" for="confirm-password">Confirm password</label>
				<input
					class="input"
					id="confirm-password"
					type="password"
					name="confirm-password"
					placeholder="••••••••"
					minlength={6}
					required
				/>
			</div>
		</div>
		<button class="btn w-full rounded-2xl" type="submit">Update password</button>

		{#if form?.message}
			<p
				role="alert"
				class="text-center text-sm text-error"
			>
				{form.message}
			</p>
		{/if}
	</form>
</div>
