export function revealWords(text: string) {
  const parts = text.split(/(\s+)/),
    words = parts.filter((part) => part.trim()).length,
    stagger = Math.min(44, 1440 / Math.max(1, words - 1));
  let index = 0;
  return {
    duration: words ? 80 + (words - 1) * stagger + 180 : 0,
    parts: parts.map((text) => ({
      text,
      delay: text.trim() ? 80 + index++ * stagger : 0,
    })),
  };
}

/** One timeline per retained message, shared by panel mounts; no persisted content. */
export class MessageReveal {
  private starts = new Map<number, number>();
  begin(id: number, now: number) {
    if (!this.starts.has(id)) this.starts.set(id, now);
    return Math.max(0, now - this.starts.get(id)!);
  }
  retain(ids: readonly number[]) {
    const retained = new Set([0, ...ids]);
    for (const id of this.starts.keys())
      if (!retained.has(id)) this.starts.delete(id);
  }
  clear() {
    this.starts.clear();
  }
}
