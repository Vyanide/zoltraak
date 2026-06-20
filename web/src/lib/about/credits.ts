/**
 * The credits registry that drives the About page. Each entry names a
 * dependency or upstream project zoltraak is built on, what it does here, and a
 * link to its repo / source. Versions mirror the two package.json files at the
 * time of writing — update them here when bumping deps.
 */

export type Credit = {
	name: string;
	/** What it does in zoltraak. */
	description: string;
	/** Installed version (omit for runtime tools / upstream projects). */
	version?: string;
	/** Link to the repo or canonical source. */
	href: string;
};

export type CreditGroup = {
	title: string;
	blurb: string;
	items: Credit[];
};

export const creditGroups: CreditGroup[] = [
	{
		title: 'Frontend',
		blurb: 'The SvelteKit app in web/ — framework, build tooling, UI and the in-browser PDF rendering.',
		items: [
			{
				name: 'Svelte',
				description: 'The UI framework (runes mode) the whole frontend is built on.',
				version: '5.56.3',
				href: 'https://github.com/sveltejs/svelte'
			},
			{
				name: 'SvelteKit',
				description: 'App framework: routing, SSR and the production server.',
				version: '2.65.2',
				href: 'https://github.com/sveltejs/kit'
			},
			{
				name: '@sveltejs/adapter-node',
				description: 'Builds the app into a standalone Node server.',
				version: '5.5.4',
				href: 'https://github.com/sveltejs/kit/tree/main/packages/adapter-node'
			},
			{
				name: '@sveltejs/vite-plugin-svelte',
				description: 'Compiles Svelte components through Vite.',
				version: '7.1.2',
				href: 'https://github.com/sveltejs/vite-plugin-svelte'
			},
			{
				name: 'Vite',
				description: 'Dev server and bundler.',
				version: '8.0.16',
				href: 'https://github.com/vitejs/vite'
			},
			{
				name: 'Tailwind CSS',
				description: 'Utility-first CSS that styles every component.',
				version: '4.3.1',
				href: 'https://github.com/tailwindlabs/tailwindcss'
			},
			{
				name: '@tailwindcss/vite',
				description: "Tailwind's first-party Vite integration.",
				version: '4.3.1',
				href: 'https://github.com/tailwindlabs/tailwindcss'
			},
			{
				name: 'tw-animate-css',
				description: 'Animation utilities for Tailwind.',
				version: '1.4.0',
				href: 'https://github.com/Wombosvideo/tw-animate-css'
			},
			{
				name: 'shadcn-svelte',
				description: 'The component primitives (Button, Badge, …).',
				version: '1.3.0',
				href: 'https://github.com/huntabyte/shadcn-svelte'
			},
			{
				name: 'Lucide',
				description: 'The icon set used across the catalog and tools.',
				version: '1.20.0',
				href: 'https://github.com/lucide-icons/lucide'
			},
			{
				name: 'clsx',
				description: 'Conditional className helper.',
				version: '2.1.1',
				href: 'https://github.com/lukeed/clsx'
			},
			{
				name: 'tailwind-merge',
				description: 'Resolves conflicting Tailwind classes.',
				version: '3.6.0',
				href: 'https://github.com/dcastil/tailwind-merge'
			},
			{
				name: 'tailwind-variants',
				description: 'Variant API behind the component styles.',
				version: '3.2.2',
				href: 'https://github.com/heroui-inc/tailwind-variants'
			},
			{
				name: 'pdf.js',
				description: 'Renders PDF page thumbnails in the browser (pdfjs-dist).',
				version: '6.0.227',
				href: 'https://github.com/mozilla/pdf.js'
			},
			{
				name: 'svelte-dnd-action',
				description: 'Drag-and-drop for reordering pages and files.',
				version: '0.9.70',
				href: 'https://github.com/isaacHagoel/svelte-dnd-action'
			},
			{
				name: 'TypeScript',
				description: 'Typed JavaScript across the whole codebase.',
				version: '6.0.3',
				href: 'https://github.com/microsoft/TypeScript'
			},
			{
				name: 'svelte-check',
				description: 'Type-checks the Svelte components.',
				version: '4.6.0',
				href: 'https://github.com/sveltejs/language-tools'
			},
			{
				name: '@types/node',
				description: 'Node.js type definitions (DefinitelyTyped).',
				version: '25.9.3',
				href: 'https://github.com/DefinitelyTyped/DefinitelyTyped'
			}
		]
	},
	{
		title: 'Backend',
		blurb: 'The ElysiaJS server in server/ that does the heavy PDF and image work on Bun.',
		items: [
			{
				name: 'Bun',
				description: 'The runtime and package manager for both projects.',
				version: '1.3.9',
				href: 'https://github.com/oven-sh/bun'
			},
			{
				name: 'Elysia',
				description: 'The HTTP framework powering the API.',
				version: '1.4.29',
				href: 'https://github.com/elysiajs/elysia'
			},
			{
				name: '@elysiajs/cors',
				description: 'CORS plugin for the API.',
				version: '1.4.2',
				href: 'https://github.com/elysiajs/elysia-cors'
			},
			{
				name: 'LibPDF',
				description: 'All PDF manipulation: reorder, merge, split, encrypt, unlock (@libpdf/core).',
				version: '0.4.0',
				href: 'https://github.com/LibPDF-js/core'
			},
			{
				name: 'sharp',
				description: 'Image compression, padding, and the background-removal compositing.',
				version: '0.35.1',
				href: 'https://github.com/lovell/sharp'
			},
			{
				name: 'ImageMagick',
				description: 'Image format conversion (the server shells out to convert).',
				href: 'https://github.com/ImageMagick/ImageMagick'
			},
			{
				name: 'onnxruntime-node',
				description: 'Runs the ONNX background-removal models on CPU.',
				version: '1.26.0',
				href: 'https://github.com/microsoft/onnxruntime'
			},
			{
				name: 'fflate',
				description: 'Builds the ZIP returned by PDF image extraction.',
				version: '0.8.3',
				href: 'https://github.com/101arrowz/fflate'
			},
			{
				name: '@types/bun',
				description: 'Bun type definitions (DefinitelyTyped).',
				version: '1.3.14',
				href: 'https://github.com/DefinitelyTyped/DefinitelyTyped'
			}
		]
	},
	{
		title: 'Fonts & theme',
		blurb: 'The look: an Everforest palette with Hanken Grotesk for UI and Spline Sans Mono for figures.',
		items: [
			{
				name: 'Everforest',
				description: 'The green-based colour scheme the theme is mapped from.',
				href: 'https://github.com/sainnhe/everforest'
			},
			{
				name: 'Hanken Grotesk',
				description: 'The UI typeface.',
				href: 'https://fontsource.org/fonts/hanken-grotesk'
			},
			{
				name: 'Spline Sans Mono',
				description: 'The monospace typeface for sizes, tags and figures.',
				href: 'https://fontsource.org/fonts/spline-sans-mono'
			},
			{
				name: 'SGA Smooth',
				description:
					'Public-domain Standard Galactic Alphabet font (by Nerdwhals) behind the Enchanting Table tool.',
				href: 'https://www.fontspace.com/sga-smooth-font-f44602'
			},
			{
				name: 'Fontsource',
				description: 'Self-hosts the Hanken Grotesk and Spline Sans Mono web fonts as npm packages.',
				href: 'https://github.com/fontsource/fontsource'
			}
		]
	},
	{
		title: 'AI models',
		blurb: 'The background remover runs released ONNX weights from the rembg project; the models originate from this research.',
		items: [
			{
				name: 'rembg',
				description: 'Source of the released ONNX model weights the remover loads.',
				href: 'https://github.com/danielgatis/rembg'
			},
			{
				name: 'U²-Net',
				description: "Saliency network behind the default 'u2net' model.",
				href: 'https://github.com/xuebinqin/U-2-Net'
			},
			{
				name: 'IS-Net (DIS)',
				description: "Segmentation network behind the 'isnet-anime' model.",
				href: 'https://github.com/xuebinqin/DIS'
			}
		]
	}
];
