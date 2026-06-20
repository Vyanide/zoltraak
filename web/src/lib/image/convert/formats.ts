/** The image formats the converter can produce (mirrors the server's targets). */
export type TargetFormat =
	| 'png'
	| 'jpeg'
	| 'webp'
	| 'avif'
	| 'heic'
	| 'tiff'
	| 'bmp'
	| 'gif'
	| 'ico'
	| 'icns';

export type FormatOption = {
	value: TargetFormat;
	/** Display name. */
	name: string;
	/** File extension the server names the download with. */
	ext: string;
	/** One-line description shown under the picker. */
	blurb: string;
	/** Whether a browser `<img>` can render it (for the result preview). */
	previewable: boolean;
	/** Whether a quality setting applies (lossy formats only). */
	lossy: boolean;
};

export const formats: FormatOption[] = [
	{ value: 'png', name: 'PNG', ext: 'png', blurb: 'Lossless, keeps transparency.', previewable: true, lossy: false },
	{ value: 'jpeg', name: 'JPEG', ext: 'jpg', blurb: 'Small photos; transparency is flattened onto white.', previewable: true, lossy: true },
	{ value: 'webp', name: 'WebP', ext: 'webp', blurb: 'Modern and small, keeps transparency.', previewable: true, lossy: true },
	{ value: 'avif', name: 'AVIF', ext: 'avif', blurb: 'Newest and smallest; modern browsers only.', previewable: true, lossy: true },
	{ value: 'heic', name: 'HEIC', ext: 'heic', blurb: "Apple's HEIF photo format; not shown in most browsers.", previewable: false, lossy: true },
	{ value: 'tiff', name: 'TIFF', ext: 'tiff', blurb: 'Lossless archival format; not shown in the browser.', previewable: false, lossy: false },
	{ value: 'bmp', name: 'BMP', ext: 'bmp', blurb: 'Uncompressed Windows bitmap.', previewable: true, lossy: false },
	{ value: 'gif', name: 'GIF', ext: 'gif', blurb: '256 colours; animation is not preserved.', previewable: true, lossy: false },
	{ value: 'ico', name: 'ICO', ext: 'ico', blurb: 'Windows icon; capped at 256×256.', previewable: true, lossy: false },
	{ value: 'icns', name: 'ICNS', ext: 'icns', blurb: 'macOS icon; squared to 512×512; not shown in the browser.', previewable: false, lossy: false }
];

export const defaultFormat: TargetFormat = 'webp';
