import { Elysia } from 'elysia';
import { ImageModel } from './model';
import { ImageService } from './service';
import { convertImage } from './convert';
import { removeBackground } from './background';
import { attachment } from '../../http';

/**
 * Controller for the image tools. Owns HTTP routing and validation; delegates
 * the actual sharp work to {@link ImageService}.
 */
export const imageController = new Elysia({ prefix: '/image' })
	.model(ImageModel.schemas)
	.post(
		'/convert',
		async ({ body, status }) => {
			const source = new Uint8Array(await body.file.arrayBuffer());
			const result = await convertImage(source, body.format, body.quality);
			if (!result.ok) return status(422, { error: result.error });

			const base = body.file.name.replace(/\.[^./\\]+$/, '') || 'image';
			const filename = `${base}.${result.ext}`;
			return new Response(new Blob([result.bytes], { type: result.mime }), {
				headers: { 'content-disposition': attachment(filename) }
			});
		},
		{ body: 'image.convertBody' }
	)
	.post(
		'/remove-background',
		async ({ body, status }) => {
			const source = new Uint8Array(await body.file.arrayBuffer());
			const result = await removeBackground(source, body.model);
			if (!result.ok) return status(422, { error: result.error });

			const base = body.file.name.replace(/\.[^./\\]+$/, '') || 'image';
			const filename = `${base}-no-bg.${result.ext}`;
			return new Response(new Blob([result.bytes], { type: result.mime }), {
				headers: { 'content-disposition': attachment(filename) }
			});
		},
		{ body: 'image.removeBgBody' }
	)
	.post(
		'/pad',
		async ({ body, status }) => {
			const source = new Uint8Array(await body.file.arrayBuffer());
			const result = await ImageService.pad(
				source,
				{ top: body.top, right: body.right, bottom: body.bottom, left: body.left },
				body.background
			);
			if (!result.ok) return status(422, { error: result.error });

			const base = body.file.name.replace(/\.[^./\\]+$/, '') || 'image';
			const filename = `${base}-padded.${result.ext}`;
			return new Response(new Blob([result.bytes], { type: result.mime }), {
				headers: { 'content-disposition': attachment(filename) }
			});
		},
		{ body: 'image.padBody' }
	)
	.post(
		'/crop',
		async ({ body, status }) => {
			const source = new Uint8Array(await body.file.arrayBuffer());
			const result = await ImageService.crop(source, {
				left: body.left,
				top: body.top,
				width: body.width,
				height: body.height
			});
			if (!result.ok) return status(422, { error: result.error });

			const base = body.file.name.replace(/\.[^./\\]+$/, '') || 'image';
			const filename = `${base}-cropped.${result.ext}`;
			return new Response(new Blob([result.bytes], { type: result.mime }), {
				headers: { 'content-disposition': attachment(filename) }
			});
		},
		{ body: 'image.cropBody' }
	)
	.post(
		'/resize',
		async ({ body, status }) => {
			const source = new Uint8Array(await body.file.arrayBuffer());
			const result = await ImageService.resize(source, {
				width: body.width,
				height: body.height,
				fit: body.fit ?? 'inside'
			});
			if (!result.ok) return status(422, { error: result.error });

			const base = body.file.name.replace(/\.[^./\\]+$/, '') || 'image';
			const filename = `${base}-resized.${result.ext}`;
			return new Response(new Blob([result.bytes], { type: result.mime }), {
				headers: { 'content-disposition': attachment(filename) }
			});
		},
		{ body: 'image.resizeBody' }
	);
