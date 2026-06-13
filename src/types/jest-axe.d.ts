// Ambient declaration for jest-axe, which ships no first-party types.
// This file is intentionally a SCRIPT (no top-level import/export) so the
// `declare module` below registers an ambient module rather than augmenting.
declare module "jest-axe" {
  export function axe(
    html: Element | string,
    options?: Record<string, unknown>
  ): Promise<unknown>;
  // Shape compatible with vitest/jest `expect.extend(...)`.
  export const toHaveNoViolations: Record<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => any
  >;
}
