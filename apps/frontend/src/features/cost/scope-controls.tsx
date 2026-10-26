import type { FormEvent } from 'react';
import type { RoomDocument } from '@roomedy/contracts/room';
import type { EstimateOffer } from '@roomedy/contracts/estimates';
import { quoteCurrencySchema } from '@roomedy/contracts/estimates';
import { findCatalogueEntry } from '@roomedy/spatial';
import type { SessionController } from '../session/controller';
import type { CostDraft } from './state';
import styles from './workspace.module.css';

function OfferSelect({
  name,
  value,
  offers,
  label,
}: {
  name: string;
  value: string | null;
  offers: EstimateOffer[];
  label: string;
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={value ?? ''}>
        <option value="">Needs a price</option>
        {offers.map((offer) => (
          <option key={offer.id} value={offer.id}>
            {offer.label} · {offer.market.currency}
          </option>
        ))}
      </select>
    </label>
  );
}
export function ScopeControls({
  controller,
  room,
  draft,
}: {
  controller: SessionController;
  room: RoomDocument;
  draft: CostDraft;
}) {
  const { settings: s, offers } = draft;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget),
      text = (name: string) => String(data.get(name) ?? ''),
      id = (name: string) => text(name) || null;
    const number = (name: string) =>
      text(name) === '' ? null : Number(text(name));
    const next = structuredClone(s);
    next.locality = {
      country: text('country').toUpperCase(),
      city: text('city').trim(),
      currency: text('currency') as typeof s.locality.currency,
    };
    next.floor = {
      ...s.floor,
      enabled: data.has('floor-enabled'),
      offerId: id('floor'),
      wasteBps: Number(text('waste')) * 100,
      excludedMm2: Math.round(Number(text('excluded')) * 1e6),
      underlayOfferId: id('underlay'),
      trimOfferId: id('trim'),
      retainTrim: data.has('retain-trim'),
      trimLengthMm:
        number('trim-length') === null
          ? null
          : Math.round(Number(text('trim-length')) * 1000),
      preparation: text('floor-preparation') as typeof s.floor.preparation,
    };
    next.walls = s.walls.map((wall) => ({
      ...wall,
      enabled: data.has(`${wall.wall}-enabled`),
      paintOfferId: id(`${wall.wall}-paint`),
      coats: Number(text(`${wall.wall}-coats`)),
      primer: text(`${wall.wall}-primer`) as typeof wall.primer,
      primerOfferId: id(`${wall.wall}-primer-product`),
      primerCoats: Number(text(`${wall.wall}-primer-coats`)),
      substrate: text(`${wall.wall}-substrate`) as typeof wall.substrate,
    }));
    next.furniture = s.furniture.map((item) => ({
      ...item,
      mode: text(`${item.id}-mode`) as typeof item.mode,
      offerId: id(`${item.id}-offer`),
      components: item.components.map((part) => ({
        ...part,
        mode: text(`${item.id}-${part.key}`) as typeof part.mode,
      })),
    }));
    next.services = s.services.map((service) => ({
      ...service,
      enabled: data.has(`${service.scope}-enabled`),
      offerId: id(`${service.scope}-offer`),
      quantity: number(`${service.scope}-quantity`),
    }));
    next.fulfilment = text('fulfilment') as typeof s.fulfilment;
    next.deliveries = s.deliveries.map((delivery) => ({
      ...delivery,
      offerId: id(`delivery-${delivery.group}`),
    }));
    if (next.locality.currency !== s.locality.currency) {
      // An explicit currency switch never converts money or reuses the previous currency's rates.
      next.floor.offerId =
        next.floor.underlayOfferId =
        next.floor.trimOfferId =
          null;
      next.walls.forEach((wall) => {
        wall.paintOfferId = wall.primerOfferId = null;
      });
      next.furniture.forEach((item) => {
        item.offerId = null;
        item.components.forEach((part) => {
          part.offerId = null;
        });
      });
      next.services.forEach((service) => {
        service.offerId = null;
      });
      next.deliveries.forEach((delivery) => {
        delivery.offerId = null;
      });
      next.allowances = [];
    }
    const disclosure = event.currentTarget.parentElement;
    if (controller.updateCost(next)) {
      controller.notify('Cost scope updated. Unpriced work remains visible.');
      requestAnimationFrame(() =>
        disclosure
          ?.querySelector<HTMLButtonElement>('[data-cost-scope-apply]')
          ?.focus({ preventScroll: true }),
      );
    }
  };
  return (
    <details className={styles.disclosure}>
      <summary>Locality, products &amp; work scope</summary>
      <form key={JSON.stringify(s)} onSubmit={submit} className={styles.form}>
        <fieldset>
          <legend>Where is your room?</legend>
          <div className={styles.fields}>
            <label>
              Country code
              <input
                name="country"
                defaultValue={s.locality.country}
                minLength={2}
                maxLength={2}
                required
              />
            </label>
            <label>
              City
              <input
                name="city"
                defaultValue={s.locality.city}
                maxLength={80}
                required
                autoComplete="address-level2"
              />
            </label>
            <label>
              Currency
              <select name="currency" defaultValue={s.locality.currency}>
                {quoteCurrencySchema.options.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <p>
            Choose your locality. Sample prices are authored examples; changing
            currency clears selected prices without conversion.
          </p>
        </fieldset>
        <details>
          <summary>Flooring</summary>
          <div className={styles.fields}>
            <label className={styles.check}>
              <input
                type="checkbox"
                name="floor-enabled"
                defaultChecked={s.floor.enabled}
              />
              Include flooring
            </label>
            <OfferSelect
              name="floor"
              label="Floor product"
              value={s.floor.offerId}
              offers={offers.filter((o) => o.kind === 'floor')}
            />
            <label>
              Waste %
              <input
                name="waste"
                type="number"
                min={0}
                max={30}
                step={1}
                defaultValue={s.floor.wasteBps / 100}
                required
              />
            </label>
            <label>
              Excluded permanent area · m²
              <input
                name="excluded"
                type="number"
                min={0}
                max={400}
                step={0.01}
                defaultValue={s.floor.excludedMm2 / 1e6}
                required
              />
            </label>
            <OfferSelect
              name="underlay"
              label="Underlay"
              value={s.floor.underlayOfferId}
              offers={offers.filter((o) => o.kind === 'underlay')}
            />
            <label>
              Preparation
              <select
                name="floor-preparation"
                defaultValue={s.floor.preparation}
              >
                <option value="assess">Needs site assessment</option>
                <option value="include">Include</option>
                <option value="exclude">Exclude / already prepared</option>
              </select>
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                name="retain-trim"
                defaultChecked={s.floor.retainTrim}
              />
              Retain existing trim
            </label>
            <OfferSelect
              name="trim"
              label="New trim"
              value={s.floor.trimOfferId}
              offers={offers.filter((o) => o.kind === 'trim')}
            />
            <label>
              Reviewed trim run · metres
              <input
                name="trim-length"
                type="number"
                min={0}
                max={100}
                step={0.001}
                defaultValue={
                  s.floor.trimLengthMm === null
                    ? ''
                    : s.floor.trimLengthMm / 1000
                }
              />
            </label>
          </div>
        </details>
        <details>
          <summary>Painting · each wall</summary>
          {s.walls.map((wall) => (
            <fieldset key={wall.wall}>
              <legend>{wall.wall} wall</legend>
              <div className={styles.fields}>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    name={`${wall.wall}-enabled`}
                    defaultChecked={wall.enabled}
                  />
                  Include this wall
                </label>
                <OfferSelect
                  name={`${wall.wall}-paint`}
                  label="Paint product"
                  value={wall.paintOfferId}
                  offers={offers.filter((o) => o.kind === 'paint')}
                />
                <label>
                  Topcoats
                  <input
                    type="number"
                    name={`${wall.wall}-coats`}
                    min={1}
                    max={4}
                    defaultValue={wall.coats}
                    required
                  />
                </label>
                <label>
                  Wall condition
                  <select
                    name={`${wall.wall}-substrate`}
                    defaultValue={wall.substrate}
                  >
                    <option value="unknown">Needs assessment</option>
                    <option value="sound-painted">
                      Sound, previously painted
                    </option>
                    <option value="new-plaster">New plaster</option>
                  </select>
                </label>
                <label>
                  Primer
                  <select
                    name={`${wall.wall}-primer`}
                    defaultValue={wall.primer}
                  >
                    <option value="assess">Needs assessment</option>
                    <option value="include">Include</option>
                    <option value="exclude">Exclude</option>
                  </select>
                </label>
                <OfferSelect
                  name={`${wall.wall}-primer-product`}
                  label="Primer product"
                  value={wall.primerOfferId}
                  offers={offers.filter((o) => o.kind === 'primer')}
                />
                <label>
                  Primer coats
                  <input
                    type="number"
                    name={`${wall.wall}-primer-coats`}
                    min={1}
                    max={3}
                    defaultValue={wall.primerCoats}
                    required
                  />
                </label>
              </div>
            </fieldset>
          ))}
        </details>
        <details>
          <summary>Furniture · buy or reuse</summary>
          {s.furniture.map((item) => {
            const piece = room.furniture.find((p) => p.id === item.id)!;
            const category = findCatalogueEntry(
              piece.catalogueId,
              piece.catalogueVersion,
            )?.category;
            return (
              <fieldset key={item.id}>
                <legend>{piece.label}</legend>
                <div className={styles.fields}>
                  <label>
                    Purchase
                    <select name={`${item.id}-mode`} defaultValue={item.mode}>
                      <option value="reuse">Reuse / already owned</option>
                      <option value="buy">Buy</option>
                    </select>
                  </label>
                  <OfferSelect
                    name={`${item.id}-offer`}
                    label="Product match"
                    value={item.offerId}
                    offers={offers.filter(
                      (o) => o.kind === 'furniture' && o.category === category,
                    )}
                  />
                  {item.components.map((part) => (
                    <label key={part.key}>
                      {part.key}
                      <select
                        name={`${item.id}-${part.key}`}
                        defaultValue={part.mode}
                      >
                        <option value="reuse">Reuse / included</option>
                        <option value="buy">Buy separately</option>
                      </select>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
          {!s.furniture.length && (
            <p>
              Your room has no furniture. Add pieces in Design when you’re
              ready.
            </p>
          )}
        </details>
        <details>
          <summary>Labour, moving &amp; delivery</summary>
          <p>
            Untick paid work you will do yourself. Job/each counts and estimated
            minutes for hourly work are explicit; m² labour uses net area.
          </p>
          {s.services.map((service) => (
            <fieldset key={service.scope}>
              <legend>{service.scope.replaceAll('-', ' ')}</legend>
              <div className={styles.fields}>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    name={`${service.scope}-enabled`}
                    defaultChecked={service.enabled}
                  />
                  Include paid work
                </label>
                <OfferSelect
                  name={`${service.scope}-offer`}
                  label="Rate"
                  value={service.offerId}
                  offers={offers.filter(
                    (o) => o.kind === 'service' && o.scope === service.scope,
                  )}
                />
                <label>
                  Minutes (hourly) or job/each count
                  <input
                    name={`${service.scope}-quantity`}
                    type="number"
                    min={0}
                    max={100000}
                    defaultValue={service.quantity ?? ''}
                  />
                </label>
              </div>
            </fieldset>
          ))}
          <label>
            Fulfilment
            <select name="fulfilment" defaultValue={s.fulfilment}>
              <option value="delivery">Delivery</option>
              <option value="collection">
                Self collection · transport excluded
              </option>
            </select>
          </label>
          {s.deliveries.map((delivery) => (
            <OfferSelect
              key={delivery.group}
              name={`delivery-${delivery.group}`}
              label={`${delivery.group} delivery`}
              value={delivery.offerId}
              offers={offers.filter(
                (o) =>
                  o.kind === 'service' &&
                  o.scope === 'delivery' &&
                  o.deliveryGroup === delivery.group,
              )}
            />
          ))}
        </details>
        <button type="submit" data-cost-scope-apply className={styles.primary}>
          Apply cost scope
        </button>
      </form>
      <ManualRate controller={controller} draft={draft} />
    </details>
  );
}
function ManualRate({
  controller,
  draft,
}: {
  controller: SessionController;
  draft: CostDraft;
}) {
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const offer = draft.offers.find((o) => o.id === data.get('offer'));
    if (!offer || !('priceMinor' in offer)) return;
    const amount = Number(data.get('amount')),
      reason = String(data.get('reason') ?? '').trim();
    if (!Number.isFinite(amount) || amount < 0 || !reason) return;
    const updated: EstimateOffer = {
      ...offer,
      priceMinor: Math.round(amount * 100),
      pricing: 'allowance',
      source: {
        kind: 'manual',
        label: 'Your planning allowance',
        url: null,
        observedAt: Date.now(),
        evidence: reason,
      },
    };
    controller.updateCost(
      draft.settings,
      draft.offers.map((o) => (o.id === updated.id ? updated : o)),
    );
  };
  return (
    <details>
      <summary>Enter a manual product or service allowance</summary>
      <form onSubmit={save} className={styles.form}>
        <label>
          Existing product / service
          <select name="offer">
            {draft.offers
              .filter(
                (o) =>
                  'priceMinor' in o &&
                  o.market.currency === draft.settings.locality.currency,
              )
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
          </select>
        </label>
        <label>
          Price per listed unit · {draft.settings.locality.currency}
          <input
            name="amount"
            type="number"
            min={0}
            max={10000000}
            step={0.01}
            required
          />
        </label>
        <label>
          What does this allowance cover?
          <input name="reason" maxLength={400} required />
        </label>
        <p>
          Stored as a manual allowance with the product’s existing unit, market
          and tax treatment. Review the line’s rule and source before relying on
          it.
        </p>
        <button type="submit">Save manual allowance</button>
      </form>
    </details>
  );
}
