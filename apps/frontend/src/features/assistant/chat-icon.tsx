export type ChatIconKind =
  | 'floor'
  | 'walls'
  | 'furniture'
  | 'services'
  | 'budget'
  | 'work'
  | 'search'
  | 'room'
  | 'talk';
export function ChatIcon({ kind }: { kind: ChatIconKind }) {
  const paths: Record<ChatIconKind, string> = {
    floor: 'M3 8 12 3l9 5-9 5-9-5Zm0 4 9 5 9-5M3 16l9 5 9-5M8 6l9 5M7 10l9-5',
    walls: 'M5 3h14v7H5zM8 10v3h5v8h3v-8H8',
    furniture: 'M6 12V4h12v8M4 12h16v5H4zM6 17v4m12-4v4',
    services: 'm14 5 5 5M4 20l7-7m0 0 4-4m-4 4-3-3 4-4 3 3m0 0 3-6 3 3-6 3',
    budget: 'M4 6h16v14H4zM4 10h16M8 3v5m8-5v5M8 14h2m4 0h2m-8 3h2',
    work: 'M8 4h12M8 12h12M8 20h12M3 4h.01M3 12h.01M3 20h.01M4 5v6m0 2v6',
    search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6',
    room: 'M3 8 12 3l9 5v10l-9 4-9-4V8Zm0 0 9 5 9-5M12 13v9',
    talk: 'M4 4h16v12H9l-5 5V4Zm4 5h8m-8 3h5',
  };
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[kind]} />
    </svg>
  );
}
