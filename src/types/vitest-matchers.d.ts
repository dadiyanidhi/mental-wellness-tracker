// MODULE file (has a top-level import) so `declare module "vitest"` MERGES
// with vitest's real types instead of replacing them. Adds the jest-axe
// custom matcher to vitest's assertion surface.
import type {} from "vitest";

declare module "vitest" {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): unknown;
  }
}
