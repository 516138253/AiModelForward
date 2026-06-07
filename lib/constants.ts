export const ACCESS_CODE_PREFIX = "ak-";

export const GPT55_MODELS = [
  "gpt-5.5",
  "gpt-5.5-pro",
  "gpt-5.5-2026-04-23",
] as const;

export type Gpt55Model = (typeof GPT55_MODELS)[number];
