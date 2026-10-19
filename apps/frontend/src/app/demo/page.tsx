import { DemoAtmosphere } from './demo-atmosphere';
import styles from './demo.module.css';
import { EntryRoomPreview } from '../../features/session/entry/entry-room-preview';
import { GuestEntry } from '../../features/session/entry/guest-entry';
import { parseEntryIntent } from '../../features/session/entry/entry-state';
export default async function Demo({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return (
    <div className={styles.root} data-demo-flow>
      <DemoAtmosphere />
      <GuestEntry
        previews={{
          empty: <EntryRoomPreview condition="empty" />,
          partial: <EntryRoomPreview condition="partial" />,
          furnished: <EntryRoomPreview condition="furnished" />,
        }}
        initial={parseEntryIntent(
          typeof query.start === 'string' ? query.start : undefined,
          typeof query.condition === 'string' ? query.condition : undefined,
        )}
      />
    </div>
  );
}
