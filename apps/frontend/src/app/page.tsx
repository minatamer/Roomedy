import { COORDINATES } from '@roomedy/spatial';

export default function Home() {
  return (
    <main data-room-unit={COORDINATES.unit}>
      <p className="brand">Roomedy</p>
      <h1>
        Make room for
        <br />
        the way you live.
      </h1>
      <span className="mode">Simulated preview</span>
    </main>
  );
}
