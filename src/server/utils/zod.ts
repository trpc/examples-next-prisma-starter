import { z } from 'zod';

export const zodJSONDate = z
  .string()
  .transform((str) => {
    const date = new Date(str);
    return date;
  })
  .refine((v) => v.getTime() > 0);
