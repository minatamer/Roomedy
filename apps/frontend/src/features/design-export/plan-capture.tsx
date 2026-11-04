import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import type { RoomDocument } from '@roomedy/contracts/room';
import { SessionController } from '../session/controller';
import { PlanView } from '../plan-view/plan-view';
import { DesignExportError, withExportSignal } from './facts';

/** Snapshot the actual editor artwork; no alternate floor-plan drawing or owner state. */
export async function captureEditorPlan(
  room: RoomDocument,
  signal: AbortSignal,
  check: () => void,
  layer: 'floor' | 'ceiling' = 'floor',
) {
  const host = document.createElement('div'),
    controller = new SessionController(room);
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:1600px;height:1600px;pointer-events:none;';
  host.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  let root: ReturnType<typeof createRoot> | undefined,
    url: string | undefined,
    image: HTMLImageElement | undefined;
  try {
    check();
    document.body.append(host);
    root = createRoot(host);
    const state = controller.getSnapshot();
    flushSync(() =>
      root!.render(
        <PlanView
          controller={controller}
          state={{ ...state, checks: { ...state.checks!, issues: [] } }}
          active={false}
          arranging={false}
          layer={layer}
        />,
      ),
    );
    const original = host.querySelector('svg');
    if (!original) throw new DesignExportError('graphics');
    const bounds = original.getBBox(),
      padding = Math.max(bounds.width, bounds.height) * 0.025;
    if (
      ![bounds.x, bounds.y, bounds.width, bounds.height].every(
        Number.isFinite,
      ) ||
      bounds.width <= 0 ||
      bounds.height <= 0
    )
      throw new DesignExportError('graphics');
    const copy = original.cloneNode(true) as SVGSVGElement;
    const sourceNodes = [original, ...original.querySelectorAll('*')],
      targetNodes = [copy, ...copy.querySelectorAll('*')];
    if (sourceNodes.length > 15000) throw new DesignExportError('too-large');
    for (const [index, source] of sourceNodes.entries()) {
      const target = targetNodes[index]!,
        computed = getComputedStyle(source);
      for (const name of [
        'fill',
        'stroke',
        'stroke-width',
        'stroke-linecap',
        'stroke-linejoin',
        'stroke-dasharray',
        'font-family',
        'font-size',
        'font-weight',
        'text-anchor',
        'dominant-baseline',
        'opacity',
        'fill-opacity',
        'stroke-opacity',
        'paint-order',
        'visibility',
        'display',
      ]) {
        let value = computed.getPropertyValue(name);
        if (value.includes('url('))
          value = value.replace(
            /url\(["']?[^)]*#([^"')]+)["']?\)/g,
            'url(#$1)',
          );
        if (value) (target as SVGElement).style.setProperty(name, value);
      }
      target.removeAttribute('class');
      target.removeAttribute('tabindex');
    }
    const width = bounds.width + padding * 2,
      height = bounds.height + padding * 2,
      scale = 1600 / Math.max(width, height);
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    copy.setAttribute(
      'viewBox',
      `${bounds.x - padding} ${bounds.y - padding} ${width} ${height}`,
    );
    copy.setAttribute('width', String(canvas.width));
    copy.setAttribute('height', String(canvas.height));
    copy.style.width = `${canvas.width}px`;
    copy.style.height = `${canvas.height}px`;
    const svg = new XMLSerializer().serializeToString(copy);
    if (new TextEncoder().encode(svg).byteLength > 2 * 1024 * 1024)
      throw new DesignExportError('too-large');
    url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    image = new Image();
    image.src = url;
    await withExportSignal(image.decode(), signal);
    check();
    const context = canvas.getContext('2d');
    if (!context) throw new DesignExportError('graphics');
    context.fillStyle = '#f4efe5';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await withExportSignal(
      new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new DesignExportError('graphics')),
          'image/jpeg',
          0.95,
        ),
      ),
      signal,
    );
    const bytes = new Uint8Array(await blob.arrayBuffer());
    check();
    return bytes;
  } finally {
    if (image) image.src = '';
    if (url) URL.revokeObjectURL(url);
    root?.unmount();
    host.remove();
    controller.dispose();
    canvas.width = canvas.height = 1;
  }
}
