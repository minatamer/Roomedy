import { createFakeProvider } from './provider.js';
import { createRecognitionFakeProvider } from '../recognition/fixtures.js';
import { assistantFakeResponse } from '../assistant/fake.js';
/** One fake provider port in the shared runtime; authored handlers never select a live transport. */
export function createRoomedyFakeProvider() {
  const recognition = createRecognitionFakeProvider();
  return createFakeProvider((request, signal) =>
    ['room_assistant_1', 'room_design_intent_1'].includes(request.format.name)
      ? assistantFakeResponse(request, signal)
      : recognition.start(request, signal).result,
  );
}
