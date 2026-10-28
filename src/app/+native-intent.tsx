// Deliberately past the feature's entry point: this file runs before the
// app mounts, and `@/features/deep-links` also exports the <DeepLinks>
// provider and everything it imports. native-intent.ts is the part meant to
// be reused from an entry point — see src/features/deep-links/index.md.
// eslint-disable-next-line no-restricted-imports -- see above
import { redirectSystemPath } from "@/features/deep-links/native-intent";

export { redirectSystemPath };
