import { CloudflareEnv, handleEdgeRequest } from '../../workers/api';

/**
 * Cloudflare Pages Function entry point for /cdn/* R2 asset proxy routes.
 * Streams PDFs, WebP thumbnails, and line-art PNG/SVG files directly from
 * env.COLORING_BUCKET with immutable 1-year Cache-Control headers.
 */
export const onRequest = async (context: { request: Request; env: CloudflareEnv }): Promise<Response> => {
  return handleEdgeRequest(context.request, context.env);
};
