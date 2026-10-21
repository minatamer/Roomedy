import {
  admissionResultSchema,
  assistantInputSchema,
  operationResultSchema,
} from '@roomedy/contracts/operations';
import type { OperationInput } from '@roomedy/contracts/operations';
import { safeErrorSchema, errorMessages } from '@roomedy/contracts/api';
import { readOperationResponse } from '../session/operation-client';
import { obtainAdmission } from '../session/admission-client';

export async function askAssistant(
  input: Extract<OperationInput, { kind: 'assistant' }>,
  signal: AbortSignal,
  transport: typeof fetch = fetch,
) {
  const parsed = assistantInputSchema.parse(input);
  const post = async (path: 'admission' | 'assistant', body: unknown) => {
    const response = await transport('/api/roomedy/v1/' + path, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    return readOperationResponse(response, signal);
  };
  const admission = await obtainAdmission(parsed, signal, (body) =>
    post('admission', body),
  );
  const admissionError = safeErrorSchema.safeParse(admission);
  if (admissionError.success)
    return {
      ok: false as const,
      message: errorMessages[admissionError.data.error.code],
    };
  const grant = admissionResultSchema.safeParse(admission);
  if (!grant.success || grant.data.kind !== 'granted')
    return {
      ok: false as const,
      message:
        'Assistant verification is unavailable here. You can keep editing manually.',
    };
  const operation = await post('assistant', {
    input: parsed,
    grant: grant.data.grant,
  });
  const operationError = safeErrorSchema.safeParse(operation);
  if (operationError.success)
    return {
      ok: false as const,
      message: errorMessages[operationError.data.error.code],
    };
  const result = operationResultSchema.safeParse(operation);
  if (
    !result.success ||
    JSON.stringify(result.data.identity) !== JSON.stringify(parsed.identity)
  )
    return {
      ok: false as const,
      message:
        'The assistant response could not be used. Your room is unchanged.',
    };
  if (result.data.kind !== 'completed' || !result.data.assistant)
    return {
      ok: false as const,
      message:
        result.data.kind === 'timeout'
          ? 'The assistant took too long. Your room is unchanged.'
          : result.data.kind === 'refused'
            ? 'This request could not be interpreted. Try a supported room goal.'
            : 'The assistant could not finish. Your room is unchanged.',
    };
  return {
    ok: true as const,
    reply: result.data.assistant,
    simulation: result.data.simulation,
  };
}
