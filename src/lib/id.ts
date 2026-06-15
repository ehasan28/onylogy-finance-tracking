/** Small local-only id generator (no native crypto dependency). */
export const id = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
