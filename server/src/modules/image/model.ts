import { t } from 'elysia';

/**
 * Request/response shapes for the image module. Kept together so the API
 * contract changes in one place (Common Closure Principle).
 */
export namespace ImageModel {
	/**
	 * Multipart body for `POST /image/convert` (the merged convert + compress tool).
	 *
	 * `format` is the target container to re-encode into (the source format is
	 * auto-detected). `quality` (1–100) is optional and only meaningful for the
	 * lossy formats (JPEG/WebP/AVIF/HEIC); ImageMagick's default is used when it
	 * is omitted.
	 */
	export const convertBody = t.Object({
		file: t.File({ type: 'image/*', maxSize: '50m' }),
		format: t.Union([
			t.Literal('png'),
			t.Literal('jpeg'),
			t.Literal('webp'),
			t.Literal('avif'),
			t.Literal('heic'),
			t.Literal('tiff'),
			t.Literal('bmp'),
			t.Literal('gif'),
			t.Literal('ico'),
			t.Literal('icns')
		]),
		quality: t.Optional(t.Integer({ minimum: 1, maximum: 100 }))
	});
	export type ConvertBody = typeof convertBody.static;

	/**
	 * Multipart body for `POST /image/remove-background`.
	 *
	 * Uploads are limited to the common raster photo formats (JPEG/PNG/WebP), and
	 * `model` selects which ONNX model removes the background.
	 */
	export const removeBgBody = t.Object({
		file: t.File({ type: ['image/jpeg', 'image/png', 'image/webp'], maxSize: '25m' }),
		model: t.Union([t.Literal('u2net'), t.Literal('isnet-anime')], {
			default: 'u2net'
		})
	});
	export type RemoveBgBody = typeof removeBgBody.static;

	/**
	 * Multipart body for `POST /image/pad`.
	 *
	 * `top`/`right`/`bottom`/`left` are the per-side padding in pixels (the client
	 * derives them from the chosen mode). `background` is a `#rrggbb` hex or the
	 * literal `'transparent'`.
	 */
	export const padBody = t.Object({
		file: t.File({ type: 'image/*', maxSize: '50m' }),
		top: t.Integer({ minimum: 0 }),
		right: t.Integer({ minimum: 0 }),
		bottom: t.Integer({ minimum: 0 }),
		left: t.Integer({ minimum: 0 }),
		background: t.String({ minLength: 1 })
	});
	export type PadBody = typeof padBody.static;

	/**
	 * Multipart body for `POST /image/crop`.
	 *
	 * The crop rectangle in source-image pixels: `left`/`top` is its top-left
	 * corner, `width`/`height` its size. The client derives these from the visual
	 * selection (or the numeric inputs); the service still clamps them to the
	 * image so an off-by-one can't push sharp's extract out of bounds.
	 */
	export const cropBody = t.Object({
		file: t.File({ type: 'image/*', maxSize: '50m' }),
		left: t.Integer({ minimum: 0 }),
		top: t.Integer({ minimum: 0 }),
		width: t.Integer({ minimum: 1 }),
		height: t.Integer({ minimum: 1 })
	});
	export type CropBody = typeof cropBody.static;

	/**
	 * Multipart body for `POST /image/resize`.
	 *
	 * `width`/`height` are the target pixel dimensions — each optional, but at
	 * least one must be given (the service rejects neither). `fit` controls how
	 * the image fills the box: `inside` preserves the aspect ratio (the default),
	 * `fill` stretches to exactly the given dimensions.
	 */
	export const resizeBody = t.Object({
		file: t.File({ type: 'image/*', maxSize: '50m' }),
		width: t.Optional(t.Integer({ minimum: 1, maximum: 20000 })),
		height: t.Optional(t.Integer({ minimum: 1, maximum: 20000 })),
		fit: t.Optional(t.Union([t.Literal('inside'), t.Literal('fill')], { default: 'inside' }))
	});
	export type ResizeBody = typeof resizeBody.static;

	/**
	 * Multipart body for `POST /image/rotate`.
	 *
	 * `angle` is the clockwise rotation in degrees (the client normalises it to
	 * 0–359). `background` is a `#rrggbb` hex or the literal `'transparent'` and
	 * only fills the corners exposed by a non-right-angle rotation; it defaults to
	 * transparent when omitted. `flipH`/`flipV` are `'true'`/`'false'` strings (the
	 * literal mirror toggles — left↔right and top↔bottom).
	 */
	export const rotateBody = t.Object({
		file: t.File({ type: 'image/*', maxSize: '50m' }),
		angle: t.Integer({ minimum: 0, maximum: 359 }),
		background: t.Optional(t.String({ minLength: 1 })),
		flipH: t.Optional(t.String()),
		flipV: t.Optional(t.String())
	});
	export type RotateBody = typeof rotateBody.static;

	/**
	 * Multipart body for `POST /image/ocr`.
	 *
	 * A single image to extract text from. The response is plain text, not a
	 * file, so there are no other fields.
	 */
	export const ocrBody = t.Object({
		file: t.File({ type: 'image/*', maxSize: '25m' })
	});
	export type OcrBody = typeof ocrBody.static;

	/** Models registered on the Elysia instance and referenced by name. */
	export const schemas = {
		'image.convertBody': convertBody,
		'image.removeBgBody': removeBgBody,
		'image.padBody': padBody,
		'image.cropBody': cropBody,
		'image.resizeBody': resizeBody,
		'image.rotateBody': rotateBody,
		'image.ocrBody': ocrBody
	};
}
