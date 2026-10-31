import { discoveryUrl } from '../providers/web-search.js';
export interface ProductMaterialFacts {
  coverageMm2?: number;
  coverageMm2PerLitre?: number;
  volumeMl?: number;
}
const AREA =
  '(?:m(?:²|2)|sq\\.?\\s*m(?:et(?:er|re)s?)?|square\\s+met(?:er|re)s?|sq\\.?\\s*ft\\.?|square\\s+feet|ft(?:²|2))';
const VOLUME =
  '(?:ml|millilit(?:er|re)s?|l(?:it(?:er|re)s?)?|(?:us\\s*)?gal(?:lon)?s?|(?:us\\s*)?quarts?|fl\\.?\\s*oz)';
const number =
  '(?<![\\d.,-])((?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?|\\d+,\\d{1,2})(?![\\d.,])';
const numeric = (value: string) =>
  Number(
    /^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(value)
      ? value.replaceAll(',', '')
      : value.replace(',', '.'),
  );
function clean(raw: unknown) {
  return typeof raw === 'string' || typeof raw === 'number'
    ? String(raw)
        .slice(0, 4096)
        .replace(/<[^>]{0,1024}>/g, ' ')
        .replace(/&(?:nbsp|sup2|amp);/gi, (x) =>
          x.toLowerCase() === '&sup2;' ? '²' : ' ',
        )
        .replace(/\s+/g, ' ')
        .trim()
    : '';
}
function volume(value: string, country: string) {
  if (/\d\s*(?:[-–]|to)\s*\d/i.test(value)) return null;
  const m = new RegExp(`${number}\\s*(${VOLUME})(?![a-z])`, 'i').exec(value);
  if (!m) return null;
  const n = numeric(m[1]!),
    u = m[2]!.toLowerCase();
  const multiplier = /^m/.test(u)
    ? 1
    : /^(?:us\s*)?gal/.test(u)
      ? country === 'US' || u.startsWith('us')
        ? 3785.411784
        : null
      : /quart/.test(u)
        ? country === 'US' || u.startsWith('us')
          ? 946.352946
          : null
        : /oz/.test(u)
          ? country === 'US'
            ? 29.5735295625
            : null
          : 1000;
  const v = multiplier === null ? 0 : Math.round(n * multiplier);
  return v >= 1 && v <= 100_000 ? v : null;
}
function area(value: string) {
  if (/\d\s*(?:[-–]|to)\s*\d|up to/i.test(value)) return null;
  const m = new RegExp(`${number}\\s*(${AREA})(?![a-z0-9])`, 'i').exec(value);
  if (!m) return null;
  const v = Math.round(
    numeric(m[1]!) * (/feet|ft/i.test(m[2]!) ? 92903.04 : 1_000_000),
  );
  return v >= 10_000 && v <= 1_000_000_000 ? v : null;
}
/** Only an unambiguous Product on this exact variant page supplies specifications. */
export function productMaterialsFromHtml(
  html: string,
  page: URL,
  kind: string,
  country: string,
): ProductMaterialFacts {
  if (html.length > 512 * 1024 || !['floor', 'paint', 'primer'].includes(kind))
    return {};
  const products: Record<string, unknown>[] = [];
  let nodes = 0,
    scripts = 0;
  function visit(value: unknown, depth = 0) {
    if (++nodes > 512 || depth > 8 || !value || typeof value !== 'object')
      return;
    if (Array.isArray(value)) {
      value.slice(0, 64).forEach((v) => visit(v, depth + 1));
      return;
    }
    const object = value as Record<string, unknown>,
      type = object['@type'];
    if (type === 'Product' || (Array.isArray(type) && type.includes('Product')))
      products.push(object);
    for (const key of [
      '@graph',
      'mainEntity',
      'hasVariant',
      'itemListElement',
      'item',
    ])
      visit(object[key], depth + 1);
  }
  const lower = html.toLowerCase();
  let cursor = 0;
  while (scripts++ < 64) {
    const start = lower.indexOf('<script', cursor);
    if (start < 0) break;
    if (!/[\s>]/.test(lower[start + 7] ?? '')) {
      cursor = start + 7;
      continue;
    }
    const headerEnd = lower.indexOf('>', start),
      end = lower.indexOf('</script', headerEnd + 1);
    if (headerEnd < 0 || headerEnd - start > 2055 || end < 0) break;
    cursor = end + 8;
    if (!/[\s>]/.test(lower[cursor] ?? '')) continue;
    if (
      !/(?:^|\s)type\s*=\s*["']application\/ld\+json["']/i.test(
        html.slice(start, headerEnd + 1),
      )
    )
      continue;
    try {
      visit(JSON.parse(html.slice(headerEnd + 1, end)));
    } catch {
      /* Invalid optional JSON-LD supplies no facts. */
    }
  }
  const identity = discoveryUrl(page.href);
  const matches = products.filter((p) => {
    const raw = [p.url, p['@id']].filter(
      (v): v is string => typeof v === 'string' && !v.startsWith('_:'),
    );
    if (!raw.length) return products.length === 1;
    return raw.some((value) => {
      try {
        return discoveryUrl(new URL(value, page).href) === identity;
      } catch {
        return false;
      }
    });
  });
  if (matches.length !== 1) return {};
  const product = matches[0]!,
    pack = new Set<number>(),
    yieldPerLitre = new Set<number>(),
    sizes = new Set<number>();
  function read(name: string, value: string, unit = '') {
    const text = `${name}: ${value} ${unit}`;
    const areaUnit = new RegExp(AREA, 'i').exec(name)?.[0] ?? '';
    const coverage = area(`${value} ${unit || areaUnit}`);
    if (
      kind === 'floor' &&
      /pack|box|carton|package/i.test(text) &&
      /cover|area|size|sq|m²|m2/i.test(name) &&
      coverage
    )
      pack.add(coverage);
    if (
      kind !== 'floor' &&
      /cover|yield|spread/i.test(name) &&
      /per\s*coat|single\s*coat|one\s*coat|\/\s*coat/i.test(text) &&
      coverage
    ) {
      const basis = /per\s*(?:us\s*)?gal|\/\s*(?:us\s*)?gal/i.test(text)
        ? country === 'US' || /us\s*gal/i.test(text)
          ? 3.785411784
          : null
        : /per\s*(?:lit(?:er|re)|l\b)|\/\s*(?:lit(?:er|re)s?|l\b)/i.test(text)
          ? 1
          : null;
      if (basis) {
        const n = Math.floor(coverage / basis);
        if (n >= 10_000 && n <= 1_000_000_000) yieldPerLitre.add(n);
      }
    }
    if (
      kind !== 'floor' &&
      /^(?:size|volume|can size|container size|contents|capacity)$/i.test(name)
    ) {
      const parsed = volume(`${value} ${unit}`, country);
      if (parsed) sizes.add(parsed);
    }
  }
  read('size', clean(product.size));
  const props = Array.isArray(product.additionalProperty)
    ? product.additionalProperty
    : product.additionalProperty
      ? [product.additionalProperty]
      : [];
  for (const p of props.slice(0, 64))
    if (p && typeof p === 'object')
      read(clean(p.name), clean(p.value), clean(p.unitText));
  // A description belongs to the matched product, unlike arbitrary page text/recommendations.
  for (const clause of clean(product.description)
    .split(/[;\n]|\.\s+(?=[A-Z])/)
    .slice(0, 24)) {
    if (
      kind === 'floor' &&
      /per\s*(?:pack|box|carton)|(?:pack|box)\s+(?:covers|coverage|contains)/i.test(
        clause,
      )
    ) {
      const a = area(clause);
      if (a) pack.add(a);
    }
    if (
      kind !== 'floor' &&
      /per\s*coat|single\s*coat|one\s*coat|\/\s*coat/i.test(clause)
    )
      read('coverage per coat', clause);
    if (
      kind !== 'floor' &&
      !sizes.size &&
      /per\s*(?:can|tin)|(?:can|tin)\s+(?:size|volume)/i.test(clause)
    ) {
      const v = volume(clause, country);
      if (v) sizes.add(v);
    }
  }
  return {
    ...(pack.size === 1 ? { coverageMm2: [...pack][0]! } : {}),
    ...(yieldPerLitre.size === 1
      ? { coverageMm2PerLitre: [...yieldPerLitre][0]! }
      : {}),
    ...(sizes.size === 1 ? { volumeMl: [...sizes][0]! } : {}),
  };
}
