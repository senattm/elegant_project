import { COLOR_MATCH_MAP } from './outfit-engine.constants';

export interface OutfitCatalogItem {
  id: number;
  name: string;
  description: string | null;
  brand: string | null;
  colors_clean: string[];
  season_clean: string[];
  tags_clean: string[];
  product_group: string;
  text_profile: string;
}

export function safeJsonLoad(val: unknown): unknown[] {
  if (val == null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    try {
      return JSON.parse(trimmed) as unknown[];
    } catch {
      try {
        return JSON.parse(trimmed.replace(/'/g, '"')) as unknown[];
      } catch {
        const cleaned = trimmed.replace(/[\[\]"']/g, '');
        return cleaned
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);
      }
    }
  }
  return [];
}

export function flattenAndLower(elements: unknown): string[] {
  const cleaned: string[] = [];
  let list: unknown[] = [];
  if (elements == null) return [];
  if (Array.isArray(elements)) list = elements;
  else list = [elements];

  for (const item of list) {
    if (Array.isArray(item)) {
      for (const i of item) {
        if (i != null && i !== '') cleaned.push(String(i).toLowerCase().trim());
      }
    } else if (item != null && item !== '') {
      cleaned.push(String(item).toLowerCase().trim());
    }
  }
  return cleaned;
}

export function customDetectProductGroup(tagsList: string[]): string {
  if (!tagsList.length) return 'unknown';
  const tagsSet = new Set(tagsList);

  const has = (keys: string[]) => keys.some((k) => tagsSet.has(k));

  if (has(['bag', 'bags', 'çanta', 'canta'])) return 'bags';
  if (
    has([
      'shoes',
      'ayakkabı',
      'boots',
      'sneakers',
      'sandalet',
      'bot',
      'çizme',
      'ayakkabi',
      'heels',
      'sandal',
    ])
  ) {
    if (has(['boots', 'bot', 'çizme'])) return 'boots';
    if (tagsSet.has('sneakers')) return 'sneakers';
    if (has(['sandal', 'sandalet'])) return 'sandal';
    if (has(['heels', 'topuklu'])) return 'heels';
    return 'sneakers';
  }
  if (
    has([
      'accessory',
      'accessories',
      'takı',
      'kolye',
      'küpe',
      'bilezik',
      'yüzük',
      'aksesuar',
      'bileklik',
      'gözlük',
      'kupe',
      'earrings',
      'necklace',
      'bracelets',
      'bracelet',
      'sunglasses',
      'ring',
    ])
  ) {
    if (has(['earrings', 'küpe'])) return 'earrings';
    if (has(['necklace', 'kolye'])) return 'necklace';
    if (has(['bracelet', 'bracelets', 'bileklik', 'bilezik'])) return 'bracelet';
    if (has(['sunglasses', 'gözlük'])) return 'sunglasses';
    if (has(['ring', 'yüzük'])) return 'ring';
    return 'earrings';
  }
  if (
    has([
      'outerwear',
      'jacket',
      'coat',
      'trench coat',
      'ceket',
      'mont',
      'kaban',
      'trençkot',
      'palto',
      'blazer',
    ])
  ) {
    if (has(['coat', 'kaban', 'mont', 'palto'])) return 'coats';
    if (has(['trench coat', 'trençkot'])) return 'trench_coat';
    if (tagsSet.has('blazer')) return 'blazer';
    if (has(['jacket', 'ceket'])) return 'jacket';
    return 'jacket';
  }
  if (has(['dress', 'elbise'])) return 'dress';
  if (has(['skirt', 'etek'])) {
    if (tagsSet.has('mini')) return 'mini skirt';
    return 'long skirt';
  }
  if (
    has([
      'topwear',
      't-shirt',
      'blouse',
      'shirt',
      'knitwear',
      'gömlek',
      'tişört',
      'bluz',
      'kazak',
      'sweater',
      'cardigan',
    ])
  ) {
    if (has(['t-shirt', 'tişört'])) return 't-shirt';
    if (has(['blouse', 'top', 'bluz'])) return 'blouse';
    if (has(['sweater', 'kazak'])) return 'sweater';
    if (has(['cardigan', 'hırka'])) return 'cardigan';
    if (has(['shirt', 'gömlek'])) return 'shirt';
    return 'blouse';
  }
  if (
    has([
      'pants',
      'pantolon',
      'denim',
      'jeans',
      'jean',
      'lower',
      'trouser',
      'shorts',
      'şort',
      'bermuda',
    ])
  ) {
    if (has(['shorts', 'bermuda', 'şort'])) return 'shorts';
    if (has(['denim', 'jean', 'jeans'])) return 'denim';
    return 'pants';
  }
  return 'unknown';
}

function productGroupFromName(name: string | null): string {
  const n = (name || '').toLowerCase();
  if (n.includes('elbise') || n.includes('dress')) return 'dress';
  if (n.includes('etek') || n.includes('skirt'))
    return n.includes('mini') ? 'mini skirt' : 'long skirt';
  if (n.includes('jean') || n.includes('denim')) return 'denim';
  if (n.includes('pantolon') || n.includes('pants') || n.includes('trouser'))
    return 'pants';
  if (n.includes('gömlek') || n.includes('shirt')) return 'shirt';
  if (n.includes('çizme') || n.includes('boot')) return 'boots';
  if (n.includes('sneaker')) return 'sneakers';
  if (n.includes('trenç') || n.includes('trench')) return 'trench_coat';
  if (n.includes('mont') || n.includes('kaban') || n.includes('ceket') || n.includes('jacket'))
    return 'jacket';
  if (n.includes('kazak') || n.includes('sweater')) return 'sweater';
  if (n.includes('hırka') || n.includes('cardigan')) return 'cardigan';
  if (n.includes('çanta') || n.includes('bag')) return 'bags';
  if (n.includes('ayakkab') || n.includes('shoe') || n.includes('heel')) return 'heels';
  if (n.includes('bluz') || n.includes('blouse') || n.includes('top')) return 'blouse';
  return 'unknown';
}

export function resolveProductGroup(tagsClean: string[], name: string | null): string {
  const fromTags = customDetectProductGroup(tagsClean);
  if (fromTags !== 'unknown') return fromTags;
  return productGroupFromName(name);
}

export function isColorCompatible(
  seedColors: string[],
  candidateColors: string[],
): boolean {
  if (!seedColors.length || !candidateColors.length) return true;
  for (const sc of seedColors) {
    if (COLOR_MATCH_MAP[sc]) {
      for (const cc of candidateColors) {
        if (COLOR_MATCH_MAP[sc].includes(cc) || sc === cc) return true;
      }
      return false;
    }
  }
  return true;
}

export function getColorScore(seedColors: string[], candidateColors: string[]): number {
  if (!seedColors.length || !candidateColors.length) return 0.1;
  let score = 0;
  for (const sc of seedColors) {
    for (const cc of candidateColors) {
      if (sc === cc) score += 2.5;
      else if (COLOR_MATCH_MAP[sc]?.includes(cc)) score += 0.5;
      else score -= 1.5;
    }
  }
  return score;
}

export function prepareCatalogItem(row: {
  id: number;
  name: string;
  description: string | null;
  brand: string | null;
  colors: unknown;
  season: unknown;
  tags: unknown;
}): OutfitCatalogItem {
  const colors_clean = flattenAndLower(safeJsonLoad(row.colors));
  const season_clean = flattenAndLower(safeJsonLoad(row.season));
  const tags_clean = flattenAndLower(safeJsonLoad(row.tags));
  const product_group = resolveProductGroup(tags_clean, row.name);
  const text_profile = `Ürün: ${row.name}. Açıklama: ${row.description || ''}. Marka: ${row.brand || ''}. Renkler: ${colors_clean.join(', ')}. Etiketler: ${tags_clean.join(', ')}.`;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    brand: row.brand,
    colors_clean,
    season_clean,
    tags_clean,
    product_group,
    text_profile,
  };
}

export function textEmbedding(text: string): Map<string, number> {
  const vec = new Map<string, number>();
  for (const w of text.toLowerCase().split(/\W+/)) {
    if (!w) continue;
    vec.set(w, (vec.get(w) || 0) + 1);
  }
  return vec;
}

export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [k, v] of a) {
    na += v * v;
    const bv = b.get(k);
    if (bv) dot += v * bv;
  }
  for (const v of b.values()) nb += v * v;
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}
