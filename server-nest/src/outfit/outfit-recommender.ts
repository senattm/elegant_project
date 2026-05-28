import { GROUND_TRUTH_OUTFITS } from './outfit-engine.constants';
import {
  OutfitCatalogItem,
  cosineSimilarity,
  getColorScore,
  isColorCompatible,
  textEmbedding,
} from './outfit-engine.utils';

export type OutfitPlan = Record<string, OutfitCatalogItem>;

interface ScoredCandidate extends OutfitCatalogItem {
  final_score: number;
}

export class OutfitRecommender {
  private readonly byId = new Map<number, OutfitCatalogItem>();
  private readonly embeddings = new Map<number, Map<string, number>>();
  private readonly coOccurrence = new Set<string>();

  constructor(private readonly catalog: OutfitCatalogItem[]) {
    for (const item of catalog) {
      this.byId.set(item.id, item);
      this.embeddings.set(item.id, textEmbedding(item.text_profile));
    }
    for (const outfit of GROUND_TRUTH_OUTFITS) {
      const parcalar = outfit.parcalar;
      for (const p1 of parcalar) {
        for (const p2 of parcalar) {
          if (p1 !== p2) this.coOccurrence.add(`${p1}:${p2}`);
        }
      }
    }
  }

  private similarity(seedId: number, candidateId: number): number {
    const a = this.embeddings.get(seedId);
    const b = this.embeddings.get(candidateId);
    if (!a || !b) return 0;
    return cosineSimilarity(a, b);
  }

  private detectContextStyle(seedTags: Set<string>): string | null {
    for (const s of ['casual', 'office', 'school', 'chic', 'party', 'formal', 'sport']) {
      if (seedTags.has(s)) return s;
    }
    return null;
  }

  private filterByGroups(groups: string[]): OutfitCatalogItem[] {
    const allowed = new Set(groups);
    return this.catalog.filter((p) => allowed.has(p.product_group));
  }

  generateOutfit(seedId: number): OutfitPlan | null {
    const seed = this.byId.get(seedId);
    if (!seed) return null;

    const seedTags = new Set(seed.tags_clean);
    const seedSeasons = new Set(seed.season_clean);
    const seedColors = seed.colors_clean;
    const seedText = seed.text_profile.toLowerCase();
    const detectedStyle = this.detectContextStyle(seedTags);
    const isParty = seedTags.has('party');
    const isColdSeason = ['winter', 'autumn'].some((s) => seedSeasons.has(s));
    const isPureSummer = seedSeasons.has('summer') && !isColdSeason;

    const outfit: OutfitPlan = { seed };

    const upperGroups = ['blouse', 'sweater', 'shirt', 'cardigan', 't-shirt'];
    const lowerGroups = ['pants', 'denim', 'mini skirt', 'long skirt', 'shorts'];
    const shoesGroups = ['sandal', 'boots', 'sneakers', 'heels'];
    const accessoryGroups = ['earrings', 'bracelet', 'necklace', 'sunglasses', 'ring'];
    const outerwearGroups = ['jacket', 'coats', 'trench_coat', 'blazer'];

    const rolesToFill: string[] = [];
    if (seed.product_group === 'dress') {
      /* no upper/lower */
    } else if (upperGroups.includes(seed.product_group)) {
      rolesToFill.push('lower');
    } else if (lowerGroups.includes(seed.product_group)) {
      rolesToFill.push('upper');
    } else {
      rolesToFill.push('upper', 'lower');
    }

    if (!shoesGroups.includes(seed.product_group)) rolesToFill.push('shoes');
    if (seed.product_group !== 'bags') rolesToFill.push('bag');
    if (!outerwearGroups.includes(seed.product_group)) rolesToFill.push('outerwear');

    let currentAccessoryGroups = [...accessoryGroups];
    if (isColdSeason) {
      currentAccessoryGroups = currentAccessoryGroups.filter((g) => g !== 'sunglasses');
    }

    if (isParty && !accessoryGroups.includes(seed.product_group)) {
      rolesToFill.push('accessory_1', 'accessory_2');
    } else if (!accessoryGroups.includes(seed.product_group)) {
      rolesToFill.push('accessory');
    }

    const roleCategories: Record<string, string[]> = {
      upper: upperGroups,
      lower: lowerGroups,
      shoes: shoesGroups,
      bag: ['bags'],
      outerwear: outerwearGroups,
      accessory: currentAccessoryGroups,
      accessory_1: currentAccessoryGroups,
      accessory_2: currentAccessoryGroups,
    };

    for (const role of rolesToFill) {
      const allowedGroups = roleCategories[role];
      let candidates = this.filterByGroups(allowedGroups);
      if (!candidates.length) continue;

      let trainMatch = candidates.filter(
        (c) => this.coOccurrence.has(`${seedId}:${c.id}`),
      );

      if (role === 'accessory_2' && outfit.accessory_1) {
        trainMatch = trainMatch.filter(
          (c) => c.product_group !== outfit.accessory_1.product_group,
        );
      }

      if (trainMatch.length) {
        outfit[role] = trainMatch[0];
        continue;
      }

      const colorFiltered = candidates.filter((c) =>
        isColorCompatible(seedColors, c.colors_clean),
      );
      if (colorFiltered.length) candidates = colorFiltered;
      else {
        candidates = candidates.filter((c) =>
          c.colors_clean.some((x) => x === 'black' || x === 'white'),
        );
      }

      if (role === 'accessory_2' && outfit.accessory_1) {
        const acc1Colors = new Set(outfit.accessory_1.colors_clean);
        const sameColor = candidates.filter((c) =>
          c.colors_clean.some((x) => acc1Colors.has(x)),
        );
        if (sameColor.length) candidates = sameColor;

        const diffGroup = candidates.filter(
          (c) => c.product_group !== outfit.accessory_1.product_group,
        );
        if (diffGroup.length) candidates = diffGroup;
      }

      if (isParty) {
        const party = candidates.filter((c) => c.tags_clean.includes('party'));
        if (party.length) candidates = party;
      } else if (seedTags.has('sport') || seedText.includes('sport')) {
        const sport = candidates.filter((c) => c.tags_clean.includes('sport'));
        if (sport.length) candidates = sport;
      } else if (seedTags.has('formal') || seedTags.has('chic')) {
        const fc = candidates.filter((c) =>
          c.tags_clean.some((t) => t === 'formal' || t === 'chic'),
        );
        if (fc.length) candidates = fc;
      }

      if (isPureSummer) {
        candidates = candidates.filter((c) => c.season_clean.includes('summer'));
        candidates = candidates.filter(
          (c) => c.product_group !== 'boots' && c.product_group !== 'coats',
        );
      } else {
        candidates = candidates.filter((c) =>
          c.season_clean.some((s) => seedSeasons.has(s)),
        );
        candidates = candidates.filter((c) => c.product_group !== 'sunglasses');
      }

      if (!candidates.length) {
        candidates = this.filterByGroups(allowedGroups);
      }

      const scored: ScoredCandidate[] = candidates.map((c) => {
        let final_score = this.similarity(seedId, c.id);
        if (detectedStyle && c.tags_clean.includes(detectedStyle)) final_score += 0.25;
        final_score += getColorScore(seedColors, c.colors_clean);
        return { ...c, final_score };
      });

      scored.sort((a, b) => b.final_score - a.final_score);

      if (role === 'bag' && outfit.shoes) {
        const shoeColors = new Set(outfit.shoes.colors_clean);
        const matching = scored.filter((c) =>
          c.colors_clean.some((x) => shoeColors.has(x)),
        );
        if (matching.length) {
          outfit[role] = matching[0];
          continue;
        }
      }

      if (role === 'shoes' && outfit.bag) {
        const bagColors = new Set(outfit.bag.colors_clean);
        const matching = scored.filter((c) =>
          c.colors_clean.some((x) => bagColors.has(x)),
        );
        if (matching.length) {
          outfit[role] = matching[0];
          continue;
        }
      }

      if (scored.length) outfit[role] = scored[0];
    }

    if (!isColdSeason && outfit.outerwear) {
      delete outfit.outerwear;
    }

    return outfit;
  }
}
