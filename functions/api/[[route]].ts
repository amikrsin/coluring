import { CloudflareEnv, handleEdgeRequest } from '../../workers/api';

/**
 * Cloudflare Pages Function entry point for all /api/* routes.
 * Automatically receives R2 (COLORING_BUCKET), KV (COLORING_KV), and D1 (DB)
 * bindings configured in wrangler.toml / Cloudflare Pages dashboard.
 */
export const onRequest = async (context: { request: Request; env: CloudflareEnv }): Promise<Response> => {
  return handleEdgeRequest(context.request, context.env);
};
