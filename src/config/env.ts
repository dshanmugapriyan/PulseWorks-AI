import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .default('true')
  .transform((val) => val === 'true');

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('PulseWorks AI'),
  VITE_SYSTEM_BANNER_ENABLED: booleanString,
  VITE_SYSTEM_BANNER_DEFAULT_LEVEL: z
    .enum(['operational', 'info', 'degraded', 'maintenance', 'incident'])
    .default('operational'),
  VITE_SYSTEM_BANNER_POLL_INTERVAL_MS: z.coerce.number().int().min(5000).default(30000),
  VITE_SYSTEM_BANNER_DISMISSIBLE: booleanString,
  VITE_DEFAULT_MAX_TOKENS: z.coerce.number().int().min(256).max(128000).default(16384),
});

function parseEnv() {
  const raw = import.meta.env ?? {};
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid application environment:\n${result.error.message}`);
  }
  return result.data;
}

export const appEnv = parseEnv();

