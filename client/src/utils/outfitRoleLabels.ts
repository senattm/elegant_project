export const OUTFIT_ROLE_LABELS: Record<string, string> = {
  upper: "ÜST PARÇA",
  lower: "ALT PARÇA",
  shoes: "AYAKKABI",
  outerwear: "DIŞ GİYİM",
  accessory: "AKSESUAR",
  accessory_1: "AKSESUAR 1",
  accessory_2: "AKSESUAR 2",
  dress: "ELBİSE",
  mid_layer: "ÜST PARÇA",
  lower_body: "ALT PARÇA",
  footwear: "AYAKKABI",
  outer_layer: "DIŞ GİYİM",
  full_body: "TEK PARÇA / ELBİSE",
  bag: "ÇANTA",
  seed: "SEÇİLEN PARÇA",
};

export function outfitRoleLabel(role: string): string {
  return OUTFIT_ROLE_LABELS[role] ?? role.toUpperCase();
}
