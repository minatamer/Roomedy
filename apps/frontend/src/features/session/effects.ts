/** Cleanup is synchronous and bounded. A release is idempotent, including after clear. */
export class ResourceRegistry {
  private readonly entries = new Set<() => void>();
  private failures = 0;
  constructor(private readonly capacity = 64) {}
  get size() {
    return this.entries.size;
  }
  get cleanupFailures() {
    return this.failures;
  }
  own(cleanup: () => void): (() => void) | null {
    const run = () => {
      try {
        cleanup();
      } catch {
        this.failures = Math.min(64, this.failures + 1);
      }
    };
    if (this.entries.size >= this.capacity) {
      run();
      return null;
    }
    let live = true;
    const release = () => {
      if (!live) return;
      live = false;
      this.entries.delete(release);
      run();
    };
    this.entries.add(release);
    return release;
  }
  clear() {
    // Detach first so cleanup cannot re-retire the same resources.
    const retired = [...this.entries];
    this.entries.clear();
    for (const release of retired) release();
  }
}
