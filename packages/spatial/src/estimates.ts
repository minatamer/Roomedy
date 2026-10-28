import {
  CALCULATION_VERSION,
  estimateOffersSchema,
  estimateSettingsSchema,
  roomEstimateSchema,
} from '@roomedy/contracts/estimates';
import type {
  EstimateLine,
  EstimateOffer,
  EstimateQuantity,
  EstimateTarget,
  RoomEstimate,
} from '@roomedy/contracts/estimates';
import { roomSurface, roomSurfaceDetail } from '@roomedy/contracts/surfaces';
import { validateRoom } from './commands.js';
import { findCatalogueEntry } from './catalogue.js';
import {
  validateOfferFx,
  offerMoney,
  nativePaintPacks,
  paintLineMoney,
} from './estimate-fx.js';
import {
  ceilQuantity,
  estimateMoney,
  estimateWallAreas,
  paintPackPlan,
} from './estimate-quantities.js';

type Failure =
  'invalid-input' | 'mixed-currency' | 'incompatible-offer' | 'estimate-range';
export type EstimateResult =
  { ok: true; estimate: RoomEstimate } | { ok: false; code: Failure };
const quantity = (
  numerator: number,
  unit: EstimateQuantity['unit'],
  denominator = 1,
): EstimateQuantity => ({ numerator, denominator, unit });
type OfferKind = EstimateOffer['kind'];
type OfferOf<K extends OfferKind> = EstimateOffer & { kind: K };

/** No clock, network, model arithmetic, room mutation or persistent price authority. */
export function calculateRoomEstimate(
  rawRoom: unknown,
  rawSettings: unknown,
  rawOffers: unknown,
): EstimateResult {
  try {
    const room = validateRoom(rawRoom),
      parsed = estimateSettingsSchema.safeParse(rawSettings),
      offered = estimateOffersSchema.safeParse(rawOffers);
    if (
      !room ||
      !parsed.success ||
      !offered.success ||
      offered.data.some((offer) => !validateOfferFx(offer))
    )
      return { ok: false, code: 'invalid-input' };
    const settings = parsed.data,
      offers = new Map(offered.data.map((offer) => [offer.id, offer]));
    if (
      settings.roomId !== room.roomId ||
      settings.furniture.length !== room.furniture.length ||
      settings.furniture.some(
        (item) => !room.furniture.some((piece) => piece.id === item.id),
      )
    )
      return { ok: false, code: 'invalid-input' };
    const lines: EstimateLine[] = [],
      assumptions: string[] = [
        'This estimates the selected scope for one existing rectangular room; structural work and hidden defects are excluded.',
        'Pack coverage, coats, yields, work rates and site conditions need supplier/site review. A priced estimate is not a fit or installation certification.',
        'Only enabled service scopes are included. Source age, availability and quantity uncertainty are separate.',
      ];
    const floorTarget: EstimateTarget[] = [
        { kind: 'surface', surface: 'floor' },
      ],
      roomTarget: EstimateTarget[] = [{ kind: 'room', id: room.roomId }];
    const groups = new Map<
      string,
      { supplierId: string; supplier: string; required: boolean }
    >();
    function offer<K extends OfferKind>(
      id: string | null,
      kind: K,
    ): OfferOf<K> | null {
      if (!id) return null;
      const found = offers.get(id);
      if (!found) return null;
      if (found.kind !== kind) throw new Error('incompatible-offer');
      if (found.market.currency !== settings.locality.currency)
        throw new Error('mixed-currency');
      if (
        found.market.country !== settings.locality.country ||
        (kind === 'service' &&
          found.market.city.toLowerCase() !==
            settings.locality.city.toLowerCase()) ||
        found.availability === 'unavailable'
      )
        return null;
      // The discriminator is checked above; intersection retains shared enum-kind fields.
      return found as OfferOf<K>;
    }
    function emit(
      fields: Partial<EstimateLine> &
        Pick<
          EstimateLine,
          'category' | 'label' | 'targets' | 'pricing' | 'amountMinor' | 'rule'
        >,
    ) {
      if (lines.length >= 512) throw new Error('estimate-range');
      const line: EstimateLine = {
        id: `estimate-line-${lines.length + 1}`,
        quantity: null,
        installed: null,
        required: null,
        purchased: null,
        packs: [],
        offerIds: [],
        quantityStatus: 'known',
        notes: [],
        ...fields,
        label: fields.label.slice(0, 120),
      };
      lines.push(line);
      return line;
    }
    function missing(
      category: EstimateLine['category'],
      label: string,
      targets: EstimateTarget[],
      reason: string,
      installed: EstimateQuantity | null = null,
    ) {
      return emit({
        category,
        label,
        targets,
        pricing: 'unpriced',
        amountMinor: null,
        quantityStatus: 'incomplete',
        installed,
        rule: reason,
        notes: [reason],
      });
    }
    function included(
      category: EstimateLine['category'],
      label: string,
      targets: EstimateTarget[],
      reason: string,
    ) {
      return emit({
        category,
        label,
        targets,
        pricing: 'included',
        amountMinor: 0,
        quantity: quantity(0, 'each'),
        rule: reason,
      });
    }
    function goods(source: EstimateOffer, needed: boolean) {
      if (!needed) return;
      const group = groups.get(source.deliveryGroup);
      if (group && group.supplierId !== source.supplierId)
        throw new Error('incompatible-offer');
      groups.set(source.deliveryGroup, {
        supplierId: source.supplierId,
        supplier: source.supplier,
        required: (group?.required ?? false) || !source.deliveryIncluded,
      });
    }
    function priced(
      source: EstimateOffer,
      fields: Partial<EstimateLine> &
        Pick<
          EstimateLine,
          'category' | 'label' | 'targets' | 'amountMinor' | 'rule'
        >,
      shipped = false,
    ) {
      if (fields.amountMinor === null) throw new Error('invalid-input');
      const notes = [...(fields.notes ?? [])];
      if (source.source.kind === 'sample')
        notes.push(
          'Authored sample price/specification; not a merchant observation.',
        );
      if (source.availability === 'unknown')
        notes.push(
          'Stock, lead time and destination eligibility need confirmation.',
        );
      const line = emit({
        ...fields,
        notes: notes.slice(0, 8),
        pricing:
          source.pricing === 'allowance' ? 'allowance' : source.source.kind,
        offerIds: [source.id],
      });
      if (shipped)
        goods(source, fields.amountMinor > 0 || !!fields.quantity?.numerator);
      if (fields.amountMinor > 0) {
        if (
          source.tax.status === 'unknown' ||
          (source.tax.status === 'excluded' &&
            (source.tax.rateBps === null || !source.tax.source))
        )
          missing(
            'tax',
            `Tax review: ${line.label}`,
            line.targets,
            'Tax inclusion or an applicable configured tax rate/source is missing.',
          );
        else if (
          source.tax.status === 'excluded' &&
          source.tax.rateBps !== null
        )
          emit({
            category: 'tax',
            label: `Tax: ${line.label}`,
            targets: line.targets,
            pricing: source.source.kind,
            amountMinor: estimateMoney(
              BigInt(fields.amountMinor) * BigInt(source.tax.rateBps),
              10_000n,
            ),
            offerIds: [source.id],
            quantity: quantity(source.tax.rateBps, 'each', 10_000),
            rule: `Exclusive line amount × ${source.tax.rateBps}/10000, rounded half up once. ${source.tax.source}`,
          });
      }
      return line;
    }
    const width = room.room.width.value,
      depth = room.room.depth.value;
    let floorArea: number | null = settings.floor.enabled
      ? width === null || depth === null
        ? null
        : width * depth - settings.floor.excludedMm2
      : 0;
    if (floorArea !== null && floorArea < 0) throw new Error('invalid-input');
    const floorInstalled =
      floorArea === null ? null : quantity(floorArea, 'mm2');
    if (settings.floor.enabled) {
      const material = offer(settings.floor.offerId, 'floor');
      const supportedFloor = ['wood', 'planks'].includes(
        roomSurface(room.room, 'floor').texture,
      );
      if (!supportedFloor) {
        missing(
          'floor',
          'Floor finish supplier quote',
          floorTarget,
          'This finish needs a specific supplier/manual work quote. Click-floor pack rules cannot price this system.',
          floorInstalled,
        );
        floorArea = null;
      } else if (!material || floorArea === null)
        missing(
          'floor',
          'Flooring packs',
          floorTarget,
          'Choose an applicable floor product and confirm room width/depth.',
          floorInstalled,
        );
      else {
        const requiredNumerator =
            floorArea * (10_000 + settings.floor.wasteBps),
          packs = ceilQuantity(
            BigInt(requiredNumerator),
            BigInt(material.coverageMm2) * 10_000n,
          );
        priced(
          material,
          {
            category: 'floor',
            label: material.label,
            targets: floorTarget,
            amountMinor: offerMoney(material, BigInt(packs)),
            quantity: quantity(packs, 'pack'),
            installed: floorInstalled,
            required: quantity(requiredNumerator, 'mm2', 10_000),
            purchased: quantity(packs * material.coverageMm2, 'mm2'),
            packs: [{ id: material.id, count: packs }],
            quantityStatus: 'estimated',
            rule: `Net area × (10000 + ${settings.floor.wasteBps})/10000; round up to whole ${material.coverageMm2} mm² packs. Waste is applied once.`,
          },
          true,
        );
      }
      if (supportedFloor) {
        if (material?.underlay === 'integrated')
          included(
            'floor',
            'Underlay included',
            floorTarget,
            'The chosen system includes underlay; do not charge for a separate layer.',
          );
        else if (material?.underlay === 'required') {
          const layer = offer(settings.floor.underlayOfferId, 'underlay');
          if (!layer || floorArea === null)
            missing(
              'floor',
              'Compatible underlay',
              floorTarget,
              'Confirm the compatible layer and installed area before pricing rolls.',
              floorInstalled,
            );
          else {
            const count = ceilQuantity(
              BigInt(floorArea),
              BigInt(layer.packQuantity),
            );
            priced(
              layer,
              {
                category: 'floor',
                label: layer.label,
                targets: floorTarget,
                amountMinor: offerMoney(layer, BigInt(count)),
                quantity: quantity(count, 'pack'),
                installed: floorInstalled,
                required: floorInstalled,
                purchased: quantity(count * layer.packQuantity, 'mm2'),
                packs: [{ id: layer.id, count }],
                quantityStatus: 'estimated',
                rule: 'Net installed area / roll coverage, rounded up. Floor cutting waste is not added again.',
              },
              true,
            );
          }
        } else
          missing(
            'floor',
            'Underlay system review',
            floorTarget,
            'Confirm whether the selected floor requires or includes a separate layer.',
          );
        if (settings.floor.retainTrim)
          included(
            'floor',
            'Retain existing trims',
            floorTarget,
            'The visitor selected reuse; new skirting/threshold work is excluded.',
          );
        else {
          const trim = offer(settings.floor.trimOfferId, 'trim'),
            length = settings.floor.trimLengthMm;
          if (!trim || length === null)
            missing(
              'floor',
              'Skirting and trims',
              floorTarget,
              'Review the required run length and choose compatible stock lengths.',
            );
          else {
            const count = ceilQuantity(
              BigInt(length),
              BigInt(trim.packQuantity),
            );
            priced(
              trim,
              {
                category: 'floor',
                label: trim.label,
                targets: floorTarget,
                amountMinor: offerMoney(trim, BigInt(count)),
                quantity: quantity(count, 'each'),
                installed: quantity(length, 'mm'),
                required: quantity(length, 'mm'),
                purchased: quantity(count * trim.packQuantity, 'mm'),
                packs: [{ id: trim.id, count }],
                quantityStatus: 'estimated',
                rule: 'Reviewed run length / stock length, rounded up to whole lengths.',
              },
              true,
            );
          }
        }
      }
      if (
        settings.floor.preparation === 'include' &&
        !settings.services.some(
          (service) => service.scope === 'floor-prep' && service.enabled,
        )
      )
        missing(
          'services',
          'Subfloor preparation rate',
          floorTarget,
          'Preparation is included in the selected scope, but no active rate is supplied.',
        );
      if (settings.floor.preparation === 'assess')
        missing(
          'services',
          'Removal and subfloor preparation review',
          floorTarget,
          'Assess the existing floor, moisture, flatness, removal and repair scope; this cost is not zero.',
        );
    } else
      assumptions.push(
        'Floor materials/accessories are excluded from this scope.',
      );

    const wallAreas = estimateWallAreas(room),
      selectedWalls = settings.walls.filter((wall) => wall.enabled);
    type Paint = OfferOf<'paint'> | OfferOf<'primer'>;
    const paintGroups = new Map<
      string,
      {
        source: Paint;
        targets: EstimateTarget[];
        area: number;
        requiredNumerator: number;
        incomplete: boolean;
        notes: string[];
      }
    >();
    let wallArea: number | null = 0;
    for (const selected of selectedWalls) {
      const area = wallAreas.find((value) => value.wall === selected.wall)!,
        targets: EstimateTarget[] = [
          { kind: 'surface', surface: selected.wall },
        ];
      const appearance = roomSurface(room.room, selected.wall),
        detail = roomSurfaceDetail(room.room, selected.wall);
      const compatible = ['plaster', 'smooth'].includes(appearance.texture);
      wallArea =
        wallArea === null || area.netMm2 === null || !compatible
          ? null
          : wallArea + area.netMm2;
      if (!compatible) {
        missing(
          'walls',
          `${selected.wall} wall finish`,
          targets,
          'Panels, fabric and other wall systems need a specific supplier/manual quote. Paint yield cannot price this finish.',
        );
        continue;
      }
      const addPaint = (
        kind: 'paint' | 'primer',
        id: string | null,
        coats: number,
      ) => {
        const source = offer(id, kind);
        if (!source) {
          missing(
            'walls',
            `${selected.wall} wall ${kind}`,
            targets,
            `Choose an applicable ${kind} product with per-coat coverage and pack prices.`,
          );
          return;
        }
        if (
          kind === 'paint' &&
          (source.sheen !== detail.sheen ||
            (source.colour !== 'tint-allowance' &&
              source.colour !== appearance.color))
        ) {
          missing(
            'walls',
            `${selected.wall} wall paint variant`,
            targets,
            'The selected paint colour/sheen does not match the accepted design. Review the variant before pricing.',
          );
          return;
        }
        if (
          source.source.kind === 'sourced' &&
          source.colour === 'tint-allowance' &&
          kind === 'paint'
        ) {
          missing(
            'walls',
            `${selected.wall} wall tint quote`,
            targets,
            'A researched base-price offer does not confirm the cost of the chosen tint. Select a priced variant or explicit allowance.',
          );
          return;
        }
        const key = `${kind}/${source.id}/${kind === 'paint' ? appearance.color : source.colour}/${source.sheen}`,
          group = paintGroups.get(key) ?? {
            source,
            targets: [],
            area: 0,
            requiredNumerator: 0,
            incomplete: false,
            notes: [],
          };
        group.targets.push(...targets);
        group.incomplete ||= area.netMm2 === null;
        group.area += area.netMm2 ?? 0;
        group.requiredNumerator += (area.netMm2 ?? 0) * coats * 1000;
        group.notes.push(
          `${selected.wall}: ${coats} ${kind} coat(s); ${area.netMm2 === null ? 'area incomplete' : `${area.netMm2}/1000000 m² net`}.`,
        );
        paintGroups.set(key, group);
      };
      addPaint('paint', selected.paintOfferId, selected.coats);
      if (selected.primer === 'assess')
        missing(
          'walls',
          `${selected.wall} primer assessment`,
          targets,
          'Confirm substrate and the selected paint system’s primer requirement; primer is neither automatically included nor zero.',
        );
      else if (selected.primer === 'include')
        addPaint('primer', selected.primerOfferId, selected.primerCoats);
      else
        assumptions.push(
          `${selected.wall}: primer is explicitly excluded; verify the substrate/system before work.`,
        );
      if (selected.substrate === 'unknown')
        assumptions.push(
          `${selected.wall}: substrate condition is unconfirmed; hidden repairs are outside the estimate.`,
        );
    }
    for (const group of paintGroups.values()) {
      if (group.incomplete) {
        missing(
          'walls',
          group.source.label,
          group.targets,
          'Confirm all contributing wall/opening measurements before calculating packs.',
        );
        continue;
      }
      const result = paintPackPlan(
        group.requiredNumerator,
        group.source.coverageMm2PerLitre,
        nativePaintPacks(group.source),
      );
      priced(
        group.source,
        {
          category: 'walls',
          label: group.source.label,
          targets: group.targets,
          amountMinor: paintLineMoney(group.source, result.priceMinor),
          quantity: quantity(
            result.packs.reduce((sum, pack) => sum + pack.count, 0),
            'can',
          ),
          installed: quantity(group.area, 'mm2'),
          required: quantity(
            group.requiredNumerator,
            'ml',
            group.source.coverageMm2PerLitre,
          ),
          purchased: quantity(result.purchasedMl, 'ml'),
          packs: result.packs,
          quantityStatus: 'estimated',
          rule: 'Sum each wall’s net area × coats / per-coat yield. Group only the same product/colour; choose the cheapest bounded whole-can mix, then least surplus.',
          notes: group.notes,
        },
        true,
      );
    }
    if (!selectedWalls.length)
      assumptions.push('Wall finishing is excluded from this scope.');

    let assemblyCount: number | null = 0,
      mountingCount = 0;
    for (const selected of settings.furniture) {
      const piece = room.furniture.find((value) => value.id === selected.id)!,
        targets: EstimateTarget[] = [{ kind: 'furniture', id: piece.id }];
      if (selected.mode === 'reuse') {
        included(
          'furniture',
          `Reuse ${piece.label}`,
          targets,
          'No new purchase selected. Moving/reinstallation remain separate scopes.',
        );
        continue;
      }
      const product = offer(selected.offerId, 'furniture'),
        entry = findCatalogueEntry(piece.catalogueId, piece.catalogueVersion);
      if (entry?.placement === 'wall') mountingCount++;
      if (!product) {
        missing(
          'furniture',
          `Purchase ${piece.label}`,
          targets,
          'Select an applicable product/variant or enter a supplier allowance.',
        );
        assemblyCount = null;
        continue;
      }
      if (product.category !== entry?.category)
        throw new Error('incompatible-offer');
      if (
        selected.components.some(
          (choice) =>
            !product.components.some(
              (component) => component.key === choice.key,
            ),
        )
      )
        throw new Error('incompatible-offer');
      if (!product.assemblyIncluded && assemblyCount !== null) assemblyCount++;
      if (
        (product.outerSizeMm &&
          (['width', 'depth', 'height'] as const).some(
            (axis) =>
              product.outerSizeMm![axis] !== piece.dimensions[axis].value,
          )) ||
        (product.source.kind === 'sourced' && product.outerSizeMm === null)
      )
        missing(
          'furniture',
          `Review ${piece.label} product size`,
          targets,
          'Product dimensions differ or are missing. Review a normal design replacement/size proposal before attaching this price.',
        );
      else
        priced(
          product,
          {
            category: 'furniture',
            label: `${piece.label}: ${product.label}`,
            targets,
            amountMinor: offerMoney(product),
            quantity: quantity(1, 'each'),
            installed: quantity(1, 'each'),
            purchased: quantity(1, 'each'),
            rule: 'One selected furniture variant. Included components are not charged again.',
          },
          true,
        );
      for (const component of product.components) {
        if (component.included) {
          included(
            'furniture',
            `${piece.label}: ${component.label} included`,
            targets,
            'Included in the selected main product; no duplicate charge.',
          );
          continue;
        }
        const choice = selected.components.find(
          (value) => value.key === component.key,
        );
        if (choice?.mode === 'reuse') {
          included(
            'furniture',
            `Reuse ${component.label}`,
            targets,
            'Explicitly reuse an existing compatible component; verify its fit.',
          );
          continue;
        }
        if (!component.required && !choice) continue;
        const part = offer(choice?.offerId ?? null, 'component');
        if (!part)
          missing(
            'furniture',
            `${piece.label}: ${component.label}`,
            targets,
            'A required component is not included. Select its offer or explicitly reuse one.',
          );
        else {
          if (part.key !== component.key) throw new Error('incompatible-offer');
          priced(
            part,
            {
              category: 'furniture',
              label: `${piece.label}: ${part.label}`,
              targets,
              amountMinor: offerMoney(part),
              quantity: quantity(1, 'each'),
              purchased: quantity(1, 'each'),
              rule: 'One required/selected component not included in the main product.',
            },
            true,
          );
        }
      }
    }

    for (const service of settings.services) {
      if (!service.enabled) {
        assumptions.push(`${service.scope} service is explicitly excluded.`);
        continue;
      }
      if (
        service.scope === 'floor-prep' &&
        (!settings.floor.enabled || settings.floor.preparation !== 'include')
      )
        continue;
      const targets = service.scope.startsWith('floor-')
        ? floorTarget
        : service.scope.startsWith('paint-')
          ? selectedWalls.map((value): EstimateTarget => ({
              kind: 'surface',
              surface: value.wall,
            }))
          : roomTarget;
      if (!targets.length) continue;
      const source = offer(service.offerId, 'service');
      const natural =
        service.scope === 'assembly'
          ? assemblyCount
          : service.scope === 'mounting'
            ? mountingCount
            : service.scope.startsWith('floor-')
              ? floorArea
              : service.scope.startsWith('paint-')
                ? wallArea
                : undefined;
      if (natural === 0) {
        included(
          'services',
          service.scope,
          targets,
          'No selected work/items require this service.',
        );
        continue;
      }
      if (!source) {
        missing(
          'services',
          service.scope,
          targets,
          'Enter an applicable labour/supplier rate and included-work scope.',
        );
        continue;
      }
      if (source.scope !== service.scope) throw new Error('incompatible-offer');
      const surfaceWork =
        service.scope.startsWith('floor-') ||
        service.scope.startsWith('paint-');
      if (
        (surfaceWork && !['m2', 'hour', 'job'].includes(source.basis)) ||
        (['assembly', 'mounting'].includes(service.scope) &&
          !['each', 'hour', 'job'].includes(source.basis)) ||
        (!surfaceWork && source.basis === 'm2') ||
        (source.basis === 'm' && service.scope !== 'custom')
      )
        throw new Error('incompatible-offer');

      const amountQuantity =
        source.basis === 'm2'
          ? service.scope.startsWith('floor-')
            ? floorArea
            : service.scope.startsWith('paint-')
              ? wallArea
              : null
          : source.basis === 'm'
            ? service.quantity
            : source.basis === 'each' &&
                (service.scope === 'assembly' || service.scope === 'mounting')
              ? (natural ?? null)
              : service.quantity;
      if (amountQuantity === null || amountQuantity === undefined) {
        missing(
          'services',
          source.label,
          targets,
          'Confirm the installed quantity, hours, item count or fixed-job basis before calculating labour.',
        );
        continue;
      }
      const divisor =
          source.basis === 'm2'
            ? 1_000_000
            : source.basis === 'm'
              ? 1000
              : source.basis === 'hour'
                ? 60
                : 1,
        unit =
          source.basis === 'm2'
            ? 'mm2'
            : source.basis === 'm'
              ? 'mm'
              : source.basis === 'hour'
                ? 'minute'
                : source.basis === 'job'
                  ? 'job'
                  : 'each';
      const amount =
        amountQuantity === 0
          ? 0
          : Math.max(
              offerMoney(source, 1n, 1n, 'minimum'),
              offerMoney(source, BigInt(amountQuantity), BigInt(divisor)),
            );
      priced(source, {
        category: 'services',
        label: source.label,
        targets,
        amountMinor: amount,
        quantity: quantity(amountQuantity, unit),
        installed: quantity(amountQuantity, unit),
        rule: `Rate × ${amountQuantity}/${divisor} ${source.basis}; apply the ${source.minimumMinor} minor-unit job minimum once. ${source.includedWork}`,
        quantityStatus: 'estimated',
      });
    }
    for (const [groupId, group] of groups) {
      if (settings.fulfilment === 'collection' || !group.required) {
        included(
          'delivery',
          `${group.supplier}: delivery`,
          roomTarget,
          settings.fulfilment === 'collection'
            ? 'Visitor selected collection; collection travel/time is outside this fee.'
            : 'Delivery is included in every selected product in this order group.',
        );
        continue;
      }
      const fee = offer(
        settings.deliveries.find((value) => value.group === groupId)?.offerId ??
          null,
        'service',
      );
      if (!fee)
        missing(
          'delivery',
          `${group.supplier}: delivery`,
          roomTarget,
          'One supplier/order-group delivery fee is unresolved. Confirm destination, access and basket conditions.',
        );
      else {
        if (
          fee.scope !== 'delivery' ||
          fee.basis !== 'job' ||
          fee.deliveryGroup !== groupId ||
          fee.supplierId !== group.supplierId
        )
          throw new Error('incompatible-offer');
        priced(fee, {
          category: 'delivery',
          label: `${group.supplier}: delivery`,
          targets: roomTarget,
          amountMinor: Math.max(
            offerMoney(fee),
            offerMoney(fee, 1n, 1n, 'minimum'),
          ),
          quantity: quantity(1, 'job'),
          rule: `One fee for this compatible supplier/order group. ${fee.includedWork}`,
        });
      }
    }
    for (const allowance of settings.allowances)
      emit({
        category: 'allowance',
        label: allowance.label,
        targets: roomTarget,
        pricing: 'allowance',
        amountMinor: allowance.amountMinor,
        quantity: quantity(1, 'job'),
        rule: allowance.reason,
        notes: [
          'Explicit all-in budget allowance; confirm actual supplier/tax conditions before purchase.',
        ],
      });
    const sum = (predicate: (line: EstimateLine) => boolean) =>
      estimateMoney(
        lines
          .filter(predicate)
          .reduce((total, line) => total + BigInt(line.amountMinor ?? 0), 0n),
      );
    const unpricedCount = lines.filter(
        (line) => line.pricing === 'unpriced',
      ).length,
      knownTotalMinor = sum(() => true);
    const estimate = roomEstimateSchema.parse({
      calculationVersion: CALCULATION_VERSION,
      roomId: room.roomId,
      roomRevision: room.roomRevision,
      locality: settings.locality,
      lines,
      pricedSubtotalMinor: sum(
        (line) => line.category !== 'tax' && line.pricing !== 'allowance',
      ),
      allowanceMinor: sum(
        (line) => line.category !== 'tax' && line.pricing === 'allowance',
      ),
      taxMinor: sum((line) => line.category === 'tax'),
      knownTotalMinor,
      totalMinor: unpricedCount ? null : knownTotalMinor,
      complete: unpricedCount === 0,
      unpricedCount,
      assumptions: assumptions.slice(0, 32),
    });
    return { ok: true, estimate };
  } catch (error) {
    const code =
      (
        ['mixed-currency', 'incompatible-offer', 'estimate-range'] as const
      ).find((value) => error instanceof Error && error.message === value) ??
      'invalid-input';
    return { ok: false, code };
  }
}
