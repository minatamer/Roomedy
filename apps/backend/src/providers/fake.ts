import { createFakeProvider } from './provider.js';
import { createRecognitionFakeProvider } from '../recognition/fixtures.js';
import { assistantFakeResponse } from '../assistant/fake.js';
/** One fake provider port in the shared runtime; authored handlers never select a live transport. */
export function createRoomedyFakeProvider() {
  const recognition = createRecognitionFakeProvider();
  return createFakeProvider((request, signal) =>
    request.format.name === 'room_assistant_1'
      ? assistantFakeResponse(request, signal)
      : recognition.start(request, signal).result,
  );
}
