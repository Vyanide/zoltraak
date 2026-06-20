import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { pdfController } from './modules/pdf';
import { imageController } from './modules/image';

// Bun.serve binds 0.0.0.0 by default, so this is reachable from outside the
// container; PORT is overridable for deployment.
const port = Number(process.env.PORT) || 3000;

const app = new Elysia()
	// Allow the web app (a different origin in dev) to call the API.
	.use(cors())
	.get('/', () => ({ name: 'zoltraak-server', status: 'ok' }))
	.use(pdfController)
	.use(imageController)
	.listen(port);

console.log(`🦊 zoltraak server running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
