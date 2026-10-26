import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { FormEvent, Ref } from 'react';
import type { SessionController } from '../session/controller';
import type { SessionSnapshot } from '../session/state';
import type { SourcingBrief, SourcingReply } from '@roomedy/contracts/sourcing';
import { buildSourcingBrief } from './brief';
import { beginResearch } from './client';
import {
  reviewSourceSize,
  selectOffer,
  sourceOfferSelected,
} from './attach-offer';
import { money } from './state';
import styles from './workspace.module.css';
export function Research({
  controller,
  state,
  selected,
  onInspect,
  requestRef,
}: {
  controller: SessionController;
  state: SessionSnapshot;
  selected: string | null;
  onInspect: (key: string | null) => void;
  requestRef?: Ref<
    (key: string, query: string, primer?: boolean) => Promise<void>
  >;
}) {
  const room = state.workspace!.current,
    draft = state.cost!;
  const [choice, setChoice] = useState(''),
    [query, setQuery] = useState(''),
    [primer, setPrimer] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const [found, setFound] = useState<{
    brief: SourcingBrief;
    reply: SourcingReply;
    roomRevision: number;
    costRevision: number;
    simulation: boolean;
  } | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const task = useRef<ReturnType<typeof beginResearch>>(null),
    live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      task.current?.cancel();
    };
  }, []);
  const requested = choice || selected || 'surface:floor';
  const key = buildSourcingBrief(room, requested) ? requested : 'surface:floor';
  const fresh =
    found &&
    found.roomRevision === room.roomRevision &&
    found.costRevision === draft.revision;
  const start = useCallback(
    async (requestedKey: string, preferences: string, usePrimer = false) => {
      if (task.current) return;
      const current = controller.getSnapshot();
      if (!current.workspace) return;
      const brief = buildSourcingBrief(
        current.workspace.current,
        requestedKey,
        preferences,
        usePrimer,
      );
      if (!brief) return;
      const running = beginResearch(controller, brief);
      if (!running) {
        setMessage('Resolve the current preview before starting research.');
        return;
      }
      task.current = running;
      setChoice(requestedKey);
      setQuery(preferences);
      setPrimer(usePrimer);
      setFound(null);
      setBusy(true);
      setMessage('Looking for suitable products and clear price evidence…');
      const answer = await running.result;
      if (!live.current || task.current !== running) return;
      task.current = null;
      setBusy(false);
      if (!answer.ok) {
        setMessage(answer.message);
        return;
      }
      setFound({
        brief,
        reply: answer.reply,
        roomRevision: answer.input.identity.inputRevision,
        costRevision: answer.input.costRevision,
        simulation: answer.simulation,
      });
      setMessage(
        answer.reply.candidates.length
          ? 'Review the evidence, size and inclusions before using a price.'
          : 'No suitable priced match was found. You can enter a manual allowance.',
      );
    },
    [controller],
  );
  useImperativeHandle(requestRef, () => start, [start]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void start(key, query, primer);
  };
  return (
    <section
      className={styles.research}
      aria-label="Find real products and services"
    >
      <div className={styles.cardTop}>
        <div>
          <p className={styles.eyebrow}>Find it for your room</p>
          <h2>Explore products &amp; local services</h2>
        </div>
      </div>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        className={styles.form}
      >
        <div className={styles.fields}>
          <label>
            Research for
            <select
              value={key}
              onChange={(event) => {
                setChoice(event.target.value);
                setPrimer(false);
              }}
            >
              <option value="surface:floor">Flooring</option>
              {(['north', 'east', 'south', 'west'] as const).map((wall) => (
                <option key={wall} value={`surface:${wall}`}>
                  {wall} wall
                </option>
              ))}
              {room.furniture.map((piece) => (
                <option key={piece.id} value={piece.id}>
                  {piece.label}
                </option>
              ))}
              {draft.settings.services.map((service) => (
                <option key={service.scope} value={`service:${service.scope}`}>
                  {service.scope.replaceAll('-', ' ')} service
                </option>
              ))}
            </select>
          </label>
          <label>
            Preferences · optional
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={240}
              placeholder="e.g. washable, warm white, local delivery"
            />
          </label>
          {key.startsWith('surface:') && key !== 'surface:floor' && (
            <label>
              Paint system
              <select
                value={primer ? 'primer' : 'paint'}
                onChange={(event) => setPrimer(event.target.value === 'primer')}
              >
                <option value="paint">Topcoat paint</option>
                <option value="primer">Primer</option>
              </select>
            </label>
          )}
        </div>
        <p>
          Research uses this item’s dimensions and finish, your
          city/country/currency and these preferences. Review source pages
          before ordering.
        </p>
        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primary}
            disabled={busy || !!state.candidate}
          >
            {busy ? 'Researching…' : 'Research options'}
          </button>
          {busy && (
            <button type="button" onClick={() => task.current?.cancel()}>
              Cancel research
            </button>
          )}
        </div>
      </form>
      <p role="status" ref={statusRef} tabIndex={-1}>
        {message}
      </p>
      {found && (
        <div className={styles.sourceCards}>
          <p>
            {found.simulation
              ? 'Authored example options · links are for discovery, not evidence of these amounts.'
              : 'Page-based candidates · review the exact variant and current conditions.'}{' '}
            {!fresh &&
              'These results belong to an earlier estimate; research again to select.'}
          </p>
          {found.reply.candidates.map((candidate, index) => (
            <article key={`${candidate.url}:${index}`}>
              <p className={styles.eyebrow}>
                {candidate.match} ·{' '}
                {candidate.offer?.pricing === 'allowance'
                  ? 'planning allowance'
                  : `${candidate.conditions} price`}
              </p>
              <h3>{candidate.label}</h3>
              {candidate.offer && (
                <strong>
                  {'packs' in candidate.offer
                    ? candidate.offer.packs
                        .map(
                          (pack) =>
                            `${pack.volumeMl / 1000} L: ${money(pack.priceMinor, candidate.offer!.market.currency)}`,
                        )
                        .join(' · ')
                    : `${money(candidate.offer.priceMinor, candidate.offer.market.currency)} ${candidate.offer.kind === 'service' ? `/ ${candidate.offer.basis}` : candidate.offer.kind === 'floor' ? '/ pack' : '/ item'}`}
                </strong>
              )}
              {candidate.offer?.kind === 'floor' && (
                <p>
                  {candidate.offer.coverageMm2 / 1e6} m² per pack · underlay{' '}
                  {candidate.offer.underlay}
                  <br />
                  {candidate.offer.variant}
                </p>
              )}
              {candidate.offer && 'packs' in candidate.offer && (
                <p>
                  {candidate.offer.coverageMm2PerLitre / 1e6} m²/L per coat ·{' '}
                  {candidate.offer.sheen} · {candidate.offer.colour}
                  <br />
                  {candidate.offer.variant}
                </p>
              )}
              {candidate.offer?.kind === 'service' && (
                <p>
                  Minimum charge{' '}
                  {money(
                    candidate.offer.minimumMinor,
                    candidate.offer.market.currency,
                  )}{' '}
                  · {candidate.offer.market.city}
                  <br />
                  {candidate.offer.includedWork}
                </p>
              )}
              {candidate.offer?.kind === 'furniture' && (
                <p>
                  Outer size:{' '}
                  {candidate.offer.outerSizeMm
                    ? `${candidate.offer.outerSizeMm.width} × ${candidate.offer.outerSizeMm.depth} × ${candidate.offer.outerSizeMm.height} mm`
                    : 'Needs confirmation'}{' '}
                  · {candidate.offer.variant}
                  <br />
                  Assembly{' '}
                  {candidate.offer.assemblyIncluded
                    ? 'included'
                    : 'separate / unresolved'}
                </p>
              )}
              {candidate.offer && (
                <p>
                  {candidate.offer.supplier} · {candidate.offer.source.kind} ·{' '}
                  {candidate.offer.availability} availability · tax{' '}
                  {candidate.offer.tax.status}
                  <br />
                  Delivery{' '}
                  {candidate.offer.deliveryIncluded
                    ? 'included'
                    : 'separate / unresolved'}
                  {candidate.offer.source.observedAt !== null && (
                    <>
                      {' '}
                      · checked{' '}
                      {new Date(
                        candidate.offer.source.observedAt,
                      ).toLocaleDateString('en-GB')}
                    </>
                  )}
                </p>
              )}
              <p>{candidate.evidence}</p>
              <ul>
                {candidate.differences.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <a href={candidate.url} target="_blank" rel="noopener noreferrer">
                {found.simulation ? 'Explore source ↗' : 'Read cited source ↗'}
              </a>
              <div className={styles.actions}>
                <button
                  onClick={() =>
                    onInspect(
                      found.brief.target.kind === 'furniture'
                        ? found.brief.target.id
                        : found.brief.target.kind === 'surface'
                          ? `surface:${found.brief.target.surface}`
                          : null,
                    )
                  }
                >
                  Inspect this part in 3D
                </button>
                {candidate.offer && (
                  <button
                    disabled={
                      !fresh ||
                      busy ||
                      !!state.candidate ||
                      (!!candidate.offer &&
                        sourceOfferSelected(
                          draft,
                          found.brief,
                          candidate.offer.id,
                        ))
                    }
                    onClick={() => {
                      if (!fresh) return;
                      const applied = selectOffer(
                        controller,
                        found.brief,
                        candidate,
                        found.costRevision,
                        found.roomRevision,
                      );
                      if (applied.ok) {
                        setFound({
                          ...found,
                          costRevision: controller.getSnapshot().cost!.revision,
                        });
                        requestAnimationFrame(() =>
                          statusRef.current?.focus({ preventScroll: true }),
                        );
                      }
                      setMessage(
                        applied.ok
                          ? 'Price selected. Review delivery, components and any unresolved work in the breakdown.'
                          : applied.reason,
                      );
                    }}
                  >
                    {candidate.offer &&
                    sourceOfferSelected(draft, found.brief, candidate.offer.id)
                      ? 'Selected'
                      : 'Use this price'}
                  </button>
                )}
                {candidate.offer?.kind === 'furniture' &&
                  candidate.offer.outerSizeMm && (
                    <button
                      disabled={!fresh || busy || !!state.candidate}
                      onClick={() => {
                        const result = reviewSourceSize(
                          controller,
                          found.brief,
                          candidate,
                          found.costRevision,
                          found.roomRevision,
                        );
                        setMessage(
                          result.ok
                            ? 'Combined preview ready above. Review the new size and costs before Apply.'
                            : result.reason,
                        );
                        if (result.ok)
                          onInspect(
                            found.brief.target.kind === 'furniture'
                              ? found.brief.target.id
                              : null,
                          );
                      }}
                    >
                      Review size &amp; price together
                    </button>
                  )}
              </div>
            </article>
          ))}
          {found.reply.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      )}
    </section>
  );
}
