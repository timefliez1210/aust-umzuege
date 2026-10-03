<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium select-none transition-colors disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:shrink-0',
		variants: {
			variant: {
				/** The one loud action on a screen. Tenant colour. */
				accent: 'bg-accent text-accent-ink font-semibold hover:brightness-95',
				/** Strong but neutral — inverted fg/bg. */
				solid: 'bg-fg text-bg hover:opacity-90',
				outline: 'border border-line-strong bg-transparent text-fg hover:bg-sunk',
				ghost: 'text-muted hover:bg-sunk hover:text-fg',
				danger: 'border border-danger/40 text-danger hover:bg-danger/10',
				/** Final "yes, delete it" in a confirmation. */
				destructive: 'bg-danger text-white font-semibold hover:brightness-95'
			},
			size: {
				xs: 'h-7 px-2 text-xs',
				sm: 'h-8 px-3 text-[13px]',
				md: 'h-9 px-3.5 text-sm',
				lg: 'h-11 px-4 text-[15px]',
				icon: 'size-9',
				'icon-sm': 'size-8',
				'icon-lg': 'size-11'
			}
		},
		defaultVariants: { variant: 'outline', size: 'md' }
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	type Props = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		href?: string;
		class?: string;
		children?: Snippet;
	} & HTMLButtonAttributes &
		HTMLAnchorAttributes;

	let { variant, size, href, class: className, children, type = 'button', ...rest }: Props = $props();
</script>

{#if href}
	<a {href} class={cn(buttonVariants({ variant, size }), className)} {...rest}>{@render children?.()}</a>
{:else}
	<button {type} class={cn(buttonVariants({ variant, size }), className)} {...rest}>{@render children?.()}</button>
{/if}
