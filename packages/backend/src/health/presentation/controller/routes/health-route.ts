import type { HealthResponse } from '@app-template/shared';
import { HealthResponseSchema } from '@app-template/shared';
import type { Hono } from 'hono';

export interface RegisterHealthRouteOptions {
  getHealth: () => HealthResponse;
}

/**
 * Register the health check route.
 * The shared schema validates the response contract before sending it.
 */
export const registerHealthRoute = (
  app: Hono,
  options: RegisterHealthRouteOptions,
) => {
  app.get('/', (c) => {
    const health = HealthResponseSchema.parse(options.getHealth());

    return c.json(health);
  });
};
