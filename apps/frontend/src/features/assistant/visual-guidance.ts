/** Presentation guidance is derived from rendered controls, never model promises. */
export function designVisualGuidance({
  preview,
  objects,
  catalogue,
  issues,
}: {
  preview: boolean;
  objects: number;
  catalogue: number;
  issues: number;
}) {
  const parts: string[] = [];
  if (preview)
    parts.push(
      'Review the preview in your room and the changes below. Expand Review every change for the full list, then use Apply changes to keep the preview or Cancel to discard it.',
    );
  if (objects)
    parts.push('Select a room-item card below to inspect its properties.');
  if (catalogue)
    parts.push(
      'Select a suggested furniture card below to open Furniture, then choose an item to place.',
    );
  if (issues)
    parts.push(
      'Select a check below to review the affected item or its room checks.',
    );
  return parts.join(' ');
}

export function marketVisualGuidance(
  busy: boolean,
  choices: number,
  multiple: boolean,
) {
  if (busy)
    return 'I’m finding options. Product cards will appear below as they arrive; you can choose after the search finishes.';
  if (!choices) return '';
  return `Compare the product cards below. ${multiple ? 'Use the left/right arrows or swipe across an item’s options to compare them. ' : ''}Use a card’s Choose button to select that option. Open Details & source for its evidence.`;
}
