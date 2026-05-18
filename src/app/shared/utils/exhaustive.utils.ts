/**
 * Exhaustive-switch helper for discriminated unions.
 *
 * Use as the `default` arm of a switch over a union type. TypeScript
 * narrows the parameter to `never` only when every union member has
 * been handled — adding a new union member surfaces as a compile error
 * here, pointing at the switch that needs updating.
 *
 * The runtime throw is a defence-in-depth fallback: if a value of the
 * "impossible" type does sneak in (cast through `any`, JSON-parsed
 * payload, etc.), the failure is loud and traceable rather than silent.
 *
 *     switch (kind) {
 *       case 'a': return ...;
 *       case 'b': return ...;
 *       default:  assertNever(kind);
 *     }
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value in exhaustive switch: ${JSON.stringify(value)}`);
}
