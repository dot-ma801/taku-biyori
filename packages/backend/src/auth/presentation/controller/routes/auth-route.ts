import type { Hono } from 'hono';

export interface RegisterAuthRouteOptions {
  authHandler: (request: Request) => Response | Promise<Response>;
}

/**
 * Register the auth route.
 * The routing layer only forwards the request to the injected handler.
 */
export const registerAuthRoute = (
  app: Hono,
  options: RegisterAuthRouteOptions,
) => {
  app.on(['POST', 'GET'], '/api/auth/**', (c) => {
    return options.authHandler(c.req.raw);
  });
};
