/** Pure packed byte ownership, shared by transport owners; never retains caller fragments. */
export class BoundedBytes {
  private pages: Uint8Array[] = [];
  private length = 0;
  private fragments = 0;
  constructor(
    readonly maximum: number,
    readonly fragmentLimit: number,
  ) {
    if (
      !Number.isSafeInteger(maximum) ||
      maximum < 1 ||
      !Number.isSafeInteger(fragmentLimit) ||
      fragmentLimit < 1
    )
      throw new Error('invalid-byte-policy');
  }
  append(bytes: Uint8Array) {
    if (
      ++this.fragments > this.fragmentLimit ||
      bytes.length > this.maximum - this.length
    )
      throw new Error('body-limit');
    let offset = 0;
    while (offset < bytes.length) {
      const pageIndex = Math.floor(this.length / 65536),
        start = this.length % 65536;
      const page =
        this.pages[pageIndex] ??
        (this.pages[pageIndex] = new Uint8Array(
          Math.min(65536, this.maximum - pageIndex * 65536),
        ));
      const count = Math.min(page.length - start, bytes.length - offset);
      page.set(bytes.subarray(offset, offset + count), start);
      offset += count;
      this.length += count;
    }
  }
  take(): Uint8Array<ArrayBuffer> {
    const result = new Uint8Array(this.length);
    let offset = 0;
    for (const page of this.pages) {
      const count = Math.min(page.length, this.length - offset);
      result.set(page.subarray(0, count), offset);
      offset += count;
    }
    this.clear();
    return result;
  }
  clear() {
    this.pages = [];
    this.length = 0;
    this.fragments = 0;
  }
  get retainedPages() {
    return this.pages.length;
  }
}
