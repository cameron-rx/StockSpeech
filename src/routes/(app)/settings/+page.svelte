<script lang="ts">
	import { enhance } from '$app/forms';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';

	let { data, form } = $props();

	let fullName = $state(data.fullName);
</script>

<Breadcrumbs crumbs={[{ label: 'Settings' }]} />

<div class="mx-4 my-4 flex flex-col gap-6">
	<div class="flex flex-col gap-3">
		<h2 class="text-xs font-semibold tracking-widest text-base-content/40 uppercase">Profile</h2>
		<div class="rounded-xl border border-base-content/10">
			<form
				method="POST"
				action="?/updateProfile"
				use:enhance={() =>
					async ({ update }) => {
						await update();
					}}
				class="flex flex-col gap-4 p-4"
			>
				<div class="flex flex-col gap-1">
					<span class="text-xs text-base-content/50">Email</span>
					<span class="text-sm">{data.email}</span>
				</div>

				<label class="floating-label">
					<input
						class="input w-full"
						type="text"
						name="fullName"
						placeholder="Full name"
						bind:value={fullName}
						required
					/>
					<span>Full name</span>
				</label>

				{#if form?.error}
					<p class="text-sm text-error">{form.error}</p>
				{/if}
				{#if form?.success}
					<p class="text-sm text-success">Profile updated.</p>
				{/if}

				<button type="submit" class="btn self-end btn-sm btn-primary">Save</button>
			</form>
		</div>
	</div>

	<div class="flex flex-col gap-3">
		<h2 class="text-xs font-semibold tracking-widest text-base-content/40 uppercase">Password</h2>
		<div class="rounded-xl border border-base-content/10">
			<form
				method="POST"
				action="?/updatePassword"
				use:enhance={() =>
					async ({ update }) => {
						await update();
					}}
				class="flex flex-col gap-4 p-4"
			>
				<label class="floating-label">
					<input
						class="input w-full"
						type="password"
						name="password"
						placeholder="New password"
						minlength={6}
						required
					/>
					<span>New password</span>
				</label>

				<label class="floating-label">
					<input
						class="input w-full"
						type="password"
						name="confirm-password"
						placeholder="Confirm password"
						minlength={6}
						required
					/>
					<span>Confirm password</span>
				</label>

				{#if form?.passwordError}
					<p class="text-sm text-error">{form.passwordError}</p>
				{/if}
				{#if form?.passwordSuccess}
					<p class="text-sm text-success">Password updated.</p>
				{/if}

				<button type="submit" class="btn self-end btn-sm btn-primary">Update password</button>
			</form>
		</div>
	</div>

	<div class="flex flex-col gap-3">
		<h2 class="text-xs font-semibold tracking-widest text-base-content/40 uppercase">Account</h2>
		<div class="rounded-xl border border-base-content/10 p-4">
			<div class="flex items-center justify-between">
				<div class="flex flex-col gap-0.5">
					<span class="text-sm font-medium">Log out</span>
					<span class="text-xs text-base-content/50">Sign out of your account</span>
				</div>
				<form method="POST" action="?/logout" use:enhance>
					<button type="submit" class="btn btn-outline btn-sm btn-error">Log out</button>
				</form>
			</div>
		</div>
	</div>
</div>
