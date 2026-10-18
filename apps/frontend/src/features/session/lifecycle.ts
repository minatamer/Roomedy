import type { RoomDocument } from '@roomedy/contracts/room';
import { SessionController } from './controller';
import { SessionPersistence } from './persistence';
import type { StoragePort } from './persistence';

/** Called only by client entry effects. Storage failure never disables memory-only editing. */
export function createGuestSession(room?: RoomDocument) {
  const session = new SessionController(room);
  let storage: StoragePort | null = null;
  try {
    storage = window.sessionStorage;
  } catch {
    /* Denied storage is an expected memory-only mode. */
  }
  const persistence = new SessionPersistence(session, storage);
  const flush = () => {
    persistence.flush();
  };
  const hidden = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', hidden);
  session.startTimer();
  return {
    session,
    close() {
      // Preserve accepted semantics before component teardown; a reload never preserves transient work.
      persistence.flush();
      persistence.dispose();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', hidden);
      session.dispose();
    },
  };
}
