import type { ExportPort } from '../design-export/job';
import { captureRoomPictures } from '../design-export/capture';
import { captureEditorPlan } from '../design-export/plan-capture';
import { isCeiling } from '../room-view/lighting-model';
import { DesignExportError } from '../design-export/facts';
import { captureProductPhotos } from './product-photos';
import { currentProductChoices } from './product-choices';
/** One finite existing renderer and the shared plan projection, always from port.project. */
export async function captureEstimatePictures(port: ExportPort) {
  const photos = captureProductPhotos(
    port.estimate
      ? currentProductChoices(port.estimate.room, port.estimate.pricing)
      : [],
    port.signal,
    port.check,
  ).catch(() => []);
  const captured = await captureRoomPictures(
    port.project.current,
    port.signal,
    port.check,
    port.progress,
    'document',
  );
  try {
    port.check();
    const picture = captured.pictures[0];
    if (!picture) throw new DesignExportError('graphics');
    const views = [];
    for (const view of captured.pictures) {
      const blob = await new Promise<Blob>((resolve, reject) =>
        view.image.toBlob(
          (value) =>
            value ? resolve(value) : reject(new DesignExportError('graphics')),
          'image/jpeg',
          0.94,
        ),
      );
      port.check();
      views.push({
        image: new Uint8Array(await blob.arrayBuffer()),
        label: view.label,
      });
    }
    const overview = views[0]!.image;
    const plan = await captureEditorPlan(
      port.project.current,
      port.signal,
      port.check,
    );
    const ceilingPlan = port.project.current.furniture.some(isCeiling)
      ? await captureEditorPlan(
          port.project.current,
          port.signal,
          port.check,
          'ceiling',
        )
      : undefined;
    const products = await photos;
    port.check();
    return {
      overview,
      plan,
      ...(ceilingPlan ? { ceilingPlan } : {}),
      views: views.slice(1),
      products,
      simplified: captured.simplified,
    };
  } finally {
    captured.dispose();
  }
}
