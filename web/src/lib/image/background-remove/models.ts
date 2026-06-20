/** The background-removal models a user can pick (mirrors the server). */
export type BgModel = 'u2net' | 'isnet-anime';

export type ModelOption = {
	value: BgModel;
	/** Display name. */
	name: string;
	/** One-line description shown under the picker. */
	blurb: string;
};

export const models: ModelOption[] = [
	{ value: 'u2net', name: 'U²-Net', blurb: 'General-purpose. A solid all-round default for photos.' },
	{ value: 'isnet-anime', name: 'ISNet Anime', blurb: 'Tuned for anime, illustrations and line art.' }
];

export const defaultModel: BgModel = 'u2net';
