<script lang="ts">
	import { ChevronDown } from "lucide-svelte";
	import StructuredData from "./StructuredData.svelte";

	interface FAQ {
		question: string;
		answer: string;
	}

	interface Props {
		faqs: FAQ[];
		title?: string;
	}

	let { faqs, title = "Häufig gestellte Fragen" }: Props = $props();

	// Track which FAQs are open
	let openIndexes = $state<Set<number>>(new Set());

	function toggleFAQ(index: number) {
		if (openIndexes.has(index)) {
			openIndexes.delete(index);
		} else {
			openIndexes.add(index);
		}
		// Trigger reactivity
		openIndexes = new Set(openIndexes);
	}

	// Generate FAQPage schema
	const faqSchema = {
		"@type": "FAQPage",
		mainEntity: faqs.map((faq) => ({
			"@type": "Question",
			name: faq.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: faq.answer
			}
		}))
	};
</script>

<StructuredData schema={faqSchema} />

<section class="faq-section">
	<h2 class="faq-title">{title}</h2>

	<div class="faq-list">
		{#each faqs as faq, index}
			<div class="faq-item" class:is-open={openIndexes.has(index)}>
				<button
					class="faq-question"
					onclick={() => toggleFAQ(index)}
					aria-expanded={openIndexes.has(index)}
					type="button"
				>
					<span class="faq-question-text">{faq.question}</span>
					<ChevronDown
						size={20}
						class="faq-chevron"
						aria-hidden="true"
					/>
				</button>

				<div class="faq-answer" class:is-open={openIndexes.has(index)}>
					<p>{faq.answer}</p>
				</div>
			</div>
		{/each}
	</div>
</section>

<style>
	.faq-section {
		margin-top: var(--space-12);
		margin-bottom: var(--space-8);
	}

	.faq-title {
		color: var(--color-info-bar);
		font-size: var(--text-2xl);
		font-weight: var(--font-bold);
		margin-bottom: var(--space-6);
		text-align: left;
	}

	.faq-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	/* FAQ Item */
	.faq-item {
		background-color: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: all var(--transition-fast);
	}

	.faq-item:hover {
		border-color: #cbd5e0;
		box-shadow: var(--shadow-sm);
	}

	.faq-item.is-open {
		border-color: var(--color-info-bar);
		box-shadow: 0 2px 8px rgba(27, 64, 92, 0.08);
	}

	/* Question Button */
	.faq-question {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-5);
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background-color var(--transition-fast);
	}

	.faq-question:hover {
		background-color: #f8fafc;
	}

	.faq-item.is-open .faq-question {
		background-color: #eff6ff;
	}

	.faq-question-text {
		color: var(--color-info-bar);
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		line-height: 1.4;
		flex: 1;
	}

	/* Chevron Icon */
	.faq-question :global(.faq-chevron) {
		color: var(--color-info-bar);
		flex-shrink: 0;
		transition: transform var(--transition-normal);
	}

	.faq-item.is-open .faq-question :global(.faq-chevron) {
		transform: rotate(180deg);
		color: var(--color-nav-accent);
	}

	/* Answer — always in DOM for crawlability, toggled via CSS */
	.faq-answer {
		max-height: 0;
		overflow: hidden;
		opacity: 0;
		padding: 0 var(--space-5);
		transition: max-height 0.3s ease-out, opacity 0.3s ease-out, padding 0.3s ease-out;
	}

	.faq-answer.is-open {
		max-height: 50rem;
		opacity: 1;
		padding: 0 var(--space-5) var(--space-5) var(--space-5);
	}

	.faq-answer p {
		color: #4a5568;
		font-size: var(--text-base);
		line-height: 1.7;
		margin: 0;
	}

	/* Responsive */
	@media (max-width: 767px) {
		.faq-title {
			font-size: var(--text-xl);
		}

		.faq-question {
			padding: var(--space-4);
		}

		.faq-question-text {
			font-size: var(--text-base);
		}

		.faq-answer.is-open {
			padding: 0 var(--space-4) var(--space-4) var(--space-4);
		}

		.faq-answer p {
			font-size: var(--text-sm);
		}
	}
</style>
