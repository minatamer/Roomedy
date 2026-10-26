import type { ExportPort } from '../design-export/job';
import { captureRoomPictures } from '../design-export/capture';
import { captureEstimatePlan } from '../design-export/portfolio';
import { DesignExportError } from '../design-export/facts';
/** One finite existing renderer and the shared plan projection, always from port.project. */
export async function captureEstimatePictures(port: ExportPort) {
  const captured = await captureRoomPictures(
    port.project.current,
    port.signal,
    port.check,
    port.progress,
    'overview',
  );
  try {
    port.check();
    const picture = captured.pictures[0];
    if (!picture) throw new DesignExportError('graphics');
    const blob = await new Promise<Blob>((resolve, reject) =>
      picture.image.toBlob(
        (value) =>
          value ? resolve(value) : reject(new DesignExportError('graphics')),
        'image/jpeg',
        0.94,
      ),
    );
    port.check();
    const overview = new Uint8Array(await blob.arrayBuffer());
    const plan = await captureEstimatePlan(port.project, port.check);
    return { overview, plan, simplified: captured.simplified };
  } finally {
    captured.dispose();
  }
}
