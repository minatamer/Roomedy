import { GuestEntry } from '../../features/session/entry/guest-entry';
import { parseEntryIntent } from '../../features/session/entry/entry-state';
export default async function Demo({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return (
    <GuestEntry
      initial={parseEntryIntent(
        typeof query.start === 'string' ? query.start : undefined,
        typeof query.condition === 'string' ? query.condition : undefined,
      )}
    />
  );
}
