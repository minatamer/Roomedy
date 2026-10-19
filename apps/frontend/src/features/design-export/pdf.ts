import { PDFDocument } from 'pdf-lib';
import { POLICY } from '@roomedy/contracts/policy';
import { DesignExportError } from './facts';
/** Generated bounded JPEG pages only; no uploaded PDF parsing at runtime. */
export async function portfolioPdf(
  pages: Uint8Array[],
  check: () => void = () => {},
) {
  if (
    !pages.length ||
    pages.length > POLICY.designExportPages ||
    pages.reduce((n, page) => n + page.byteLength, 0) >
      POLICY.designExportPdfBytes
  )
    throw new DesignExportError('too-large');
  const pdf = await PDFDocument.create();
  pdf.setTitle('Roomedy - your room, reimagined');
  pdf.setAuthor('Roomedy');
  pdf.setSubject('Room views, floor plan, finishes and furniture');
  pdf.setCreator('Roomedy');
  for (const bytes of pages) {
    check();
    const image = await pdf.embedJpg(bytes),
      page = pdf.addPage([841.89, 595.28]);
    page.drawImage(image, { x: 0, y: 0, width: 841.89, height: 595.28 });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  check();
  const bytes = await pdf.save({ useObjectStreams: false });
  check();
  if (bytes.byteLength > POLICY.designExportPdfBytes)
    throw new DesignExportError('too-large');
  return bytes;
}
