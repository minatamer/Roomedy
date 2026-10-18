import { POLICY } from '@roomedy/contracts/policy';
export type JsonSchema = Record<string, unknown>;
const record = (x: unknown): x is JsonSchema =>
  !!x && typeof x === 'object' && !Array.isArray(x);
/** Conservative dialect projection. Rich local schemas still validate actual output. */
export function projectProviderSchema(raw: unknown): JsonSchema {
  let nodes = 0;
  function visit(value: unknown, depth: number): JsonSchema {
    if (!record(value) || ++nodes > 10_000 || depth > 10)
      throw new Error('provider-schema');
    if (typeof value.$ref === 'string') {
      if (!/^#\/\$defs\/[A-Za-z0-9_-]+$/.test(value.$ref))
        throw new Error('provider-schema');
      return { $ref: value.$ref };
    }
    let result: JsonSchema;
    if (Array.isArray(value.anyOf) || Array.isArray(value.oneOf)) {
      result = {
        anyOf: ((value.anyOf ?? value.oneOf) as unknown[]).map((v) =>
          visit(v, depth + 1),
        ),
      };
    } else if (value.type === 'object') {
      if (!record(value.properties) || value.additionalProperties !== false)
        throw new Error('provider-schema');
      const properties = Object.fromEntries(
        Object.entries(value.properties).map(([k, v]) => [
          k,
          visit(v, depth + 1),
        ]),
      );
      result = {
        type: 'object',
        properties,
        required: Object.keys(properties),
        additionalProperties: false,
      };
    } else if (value.type === 'array')
      result = { type: 'array', items: visit(value.items, depth + 1) };
    else if (
      ['string', 'number', 'integer', 'boolean', 'null'].includes(
        String(value.type),
      )
    ) {
      result = { type: value.type };
      if (Array.isArray(value.enum)) result.enum = value.enum;
      if (Object.hasOwn(value, 'const')) result.enum = [value.const];
    } else throw new Error('provider-schema');
    if (record(value.$defs))
      result.$defs = Object.fromEntries(
        Object.entries(value.$defs).map(([k, v]) => [k, visit(v, depth + 1)]),
      );
    return result;
  }
  const projected = visit(raw, 0);
  if (
    projected.type !== 'object' ||
    Buffer.byteLength(JSON.stringify(projected)) > POLICY.providerSchemaBytes
  )
    throw new Error('provider-schema');
  return projected;
}
