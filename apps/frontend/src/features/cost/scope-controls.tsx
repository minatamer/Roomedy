import type { FormEvent } from 'react';
import { useState } from 'react';
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
  const [offerId, setOfferId] = useState(draft.offers[0]?.id ?? '');
  const selected =
    draft.offers.find((o) => o.id === offerId) ?? draft.offers[0];
  const unit =
    selected?.kind === 'floor'
      ? `${selected.coverageMm2 / 1e6} m² pack`
      : selected?.kind === 'underlay'
        ? `${selected.packQuantity / 1e6} m² roll`
        : selected?.kind === 'trim'
          ? `${selected.packQuantity / 1000} m stock length`
          : selected?.kind === 'service'
            ? selected.basis
            : selected?.kind === 'paint' || selected?.kind === 'primer'
              ? 'paint can specified below'
              : 'item';
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const offer = selected;
    if (!offer) return;
    const amount = Number(data.get('amount')),
      reason = String(data.get('reason') ?? '').trim();
    if (!Number.isFinite(amount) || amount < 0 || !reason) return;
    const taxStatus = String(data.get('tax')) as
      'included' | 'excluded' | 'unknown';
    const tax = {
      status: taxStatus,
      rateBps:
        taxStatus === 'excluded' &&
        String(data.get('tax-rate') ?? '').trim() !== ''
          ? Math.round(Number(data.get('tax-rate')) * 100)
          : null,
      source: taxStatus === 'excluded' ? reason.slice(0, 240) : null,
    };
    const price = Math.round(amount * 100);
    let updated: EstimateOffer = {
      ...offer,
      id: `manual_${crypto.randomUUID()}`,
      label: (offer.source.kind === 'manual'
        ? offer.label
        : `Manual: ${offer.label}`
      ).slice(0, 96),
      market: { ...draft.settings.locality },
      availability: 'unknown',
      leadTime: null,
      deliveryIncluded: false,
      ...(offer.kind === 'furniture' ? { assemblyIncluded: false } : {}),
      tax,
      pricing: 'allowance',
      source: {
        kind: 'manual',
        label: 'Your planning allowance',
        url: null,
        observedAt: Date.now(),
        evidence: reason,
      },
    };
    if (updated.kind === 'paint' || updated.kind === 'primer')
      updated = {
        ...updated,
        coverageMm2PerLitre: Math.round(Number(data.get('yield')) * 1e6),
        packs: [
          {
            id: 'manual-can',
            volumeMl: Math.round(Number(data.get('can')) * 1000),
            priceMinor: price,
          },
        ],
      };
    else if ('priceMinor' in updated)
      updated = {
        ...updated,
        priceMinor: price,
        ...(updated.kind === 'service'
          ? { minimumMinor: Math.round(Number(data.get('minimum')) * 100) }
          : {}),
      };
    const settings = structuredClone(draft.settings);
    const replace = (id: string | null) => (id === offer.id ? updated.id : id);
    settings.floor.offerId = replace(settings.floor.offerId);
    settings.floor.underlayOfferId = replace(settings.floor.underlayOfferId);
    settings.floor.trimOfferId = replace(settings.floor.trimOfferId);
    settings.walls.forEach((w) => {
      w.paintOfferId = replace(w.paintOfferId);
      w.primerOfferId = replace(w.primerOfferId);
    });
    settings.furniture.forEach((f) => {
      f.offerId = replace(f.offerId);
      f.components.forEach((c) => {
        c.offerId = replace(c.offerId);
      });
    });
    settings.services.forEach((service) => {
      service.offerId = replace(service.offerId);
    });
    settings.deliveries.forEach((delivery) => {
      delivery.offerId = replace(delivery.offerId);
    });
    if (updated.kind === 'service' && updated.scope === 'delivery') {
      const group = String(data.get('delivery-group'));
      const product = draft.offers.find(
        (o) => o.kind !== 'service' && o.deliveryGroup === group,
      );
      if (!product) {
        controller.notify(
          'Select the supplier group for this delivery allowance.',
        );
        return;
      }
      updated = {
        ...updated,
        supplierId: product.supplierId,
        supplier: product.supplier,
        deliveryGroup: group,
      };
      const delivery = settings.deliveries.find((d) => d.group === group);
      if (delivery) delivery.offerId = updated.id;
      else settings.deliveries.push({ group, offerId: updated.id });
    }
    if (controller.updateCost(settings, [...draft.offers, updated]))
      controller.notify(
        'Manual allowance saved for this locality and currency. Select it in work scope if it is not already selected.',
      );
  };
  return (
    <details>
      <summary>Enter a manual product or service allowance</summary>
      <form onSubmit={save} className={styles.form}>
        <label>
          Existing product / service unit
          <select
            value={selected?.id ?? ''}
            onChange={(event) => setOfferId(event.target.value)}
          >
            {draft.offers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <p>
          Use this listed unit: <strong>{unit}</strong>. Enter a new allowance
          in {draft.settings.locality.city} / {draft.settings.locality.currency}
          ; this does not convert or refresh the old price.
        </p>
        <label>
          Price per {unit} · {draft.settings.locality.currency}
          <input
            name="amount"
            type="number"
            min={0}
            max={10000000}
            step={0.01}
            required
          />
        </label>
        {(selected?.kind === 'paint' || selected?.kind === 'primer') && (
          <div className={styles.fields}>
            <label>
              Can volume · litres
              <input
                name="can"
                type="number"
                min={0.25}
                max={20}
                step={0.25}
                defaultValue={selected.packs[0]!.volumeMl / 1000}
                required
              />
            </label>
            <label>
              Reviewed coverage · m²/L per coat
              <input
                name="yield"
                type="number"
                min={1}
                max={30}
                step={0.1}
                defaultValue={selected.coverageMm2PerLitre / 1e6}
                required
              />
            </label>
          </div>
        )}
        {selected?.kind === 'service' && (
          <label>
            Minimum job charge · {draft.settings.locality.currency}
            <input
              name="minimum"
              type="number"
              min={0}
              max={10000000}
              step={0.01}
              defaultValue={0}
              required
            />
          </label>
        )}
        {selected?.kind === 'service' && selected.scope === 'delivery' && (
          <label>
            Delivery supplier group
            <select name="delivery-group">
              {draft.settings.deliveries.map((d) => (
                <option key={d.group} value={d.group}>
                  {draft.offers.find(
                    (o) => o.kind !== 'service' && o.deliveryGroup === d.group,
                  )?.supplier ?? d.group}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className={styles.fields}>
          <label>
            Tax treatment
            <select name="tax" defaultValue="unknown">
              <option value="unknown">Needs review</option>
              <option value="included">Included in this amount</option>
              <option value="excluded">Excluded · rate below</option>
            </select>
          </label>
          <label>
            Tax rate % · if excluded
            <input
              name="tax-rate"
              type="number"
              min={0}
              max={100}
              step={0.01}
              defaultValue=""
            />
          </label>
        </div>
        <label>
          What does this allowance cover?
          <input name="reason" maxLength={400} required />
        </label>
        <p>
          Review the quantity, unit, coverage, minimum charge and tax
          assumption. Unsupported work or hidden conditions need a supplier
          assessment. Your manual allowance stays separate from a sourced price.
        </p>
        <button type="submit">Save manual allowance</button>
      </form>
    </details>
  );
}
