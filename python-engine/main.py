from fastapi import FastAPI, HTTPException
import pandas as pd
import numpy as np
import ast
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

df = None
embeddings = None
recommender = None

# --- 🎨 RENK UYUMLULUK SÖZLÜĞÜ ---
COLOR_MATCH_MAP = {
    'black': ['black', 'white', 'grey', 'gray', 'beige', 'cream', 'red', 'blue', 'navy', 'dark blue', 'gold', 'silver', 'green'],
    'white': ['white', 'black', 'grey', 'gray', 'beige', 'cream', 'blue', 'denim', 'navy', 'dark blue', 'gold', 'silver', 'green'],
    'green': ['black', 'white'],
    'navy': ['navy', 'dark blue', 'blue', 'white', 'grey', 'gray', 'beige', 'cream'],
    'dark blue': ['navy', 'dark blue', 'blue', 'white', 'grey', 'gray', 'beige', 'cream'],
    'blue': ['blue', 'navy', 'dark blue', 'white', 'grey', 'gray', 'denim'],
    'denim': ['denim', 'white', 'black', 'grey', 'blue'],
    'beige': ['beige', 'cream', 'white', 'black', 'brown', 'khaki', 'natural'],
    'natural': ['natural', 'beige', 'cream', 'white', 'black', 'brown'],
    'cream': ['cream', 'beige', 'white', 'black', 'brown'],
    'brown': ['brown', 'beige', 'cream', 'black', 'khaki', 'natural'],
    'grey': ['grey', 'gray', 'white', 'black', 'navy', 'dark blue', 'blue'],
    'gray': ['gray', 'grey', 'white', 'black', 'navy', 'dark blue', 'blue'],
    'gold': ['gold', 'black', 'white', 'cream', 'beige', 'green', 'red'],
    'silver': ['silver', 'black', 'white', 'grey', 'gray', 'blue', 'green']
}

def is_color_compatible(seed_colors, candidate_colors):
    if not seed_colors or not candidate_colors:
        return True
    for sc in seed_colors:
        if sc in COLOR_MATCH_MAP:
            for cc in candidate_colors:
                if cc in COLOR_MATCH_MAP[sc] or sc == cc:
                    return True
            return False
    return True

def get_color_score(seed_colors, candidate_colors):
    if not seed_colors or not candidate_colors:
        return 0.1
    score = 0.0
    for sc in seed_colors:
        for cc in candidate_colors:
            if sc == cc:
                score += 2.5
            elif sc in COLOR_MATCH_MAP and cc in COLOR_MATCH_MAP[sc]:
                score += 0.5
            else:
                score -= 1.5
    return score

GROUND_TRUTH_OUTFITS = [
    {"stil": "casual", "parcalar": [546, 537, 656, 766, 678]},   # Kombin 2: Spor
    {"stil": "office", "parcalar": [113, 566, 812, 683, 638]}, # Kombin 3: Ofis
    {"stil": "office", "parcalar": [282, 552, 786, 336, 701, 664]}, # Kombin 4: Ofis
    {"stil": "chic",   "parcalar": [148, 754, 601, 708]},          # Kombin 5: Şık
    {"stil": "chic",   "parcalar": [184, 814, 609, 685]},          # Kombin 6: Şık
    {"stil": "formal", "parcalar": [526, 523, 603, 710]},          # Kombin 7: Formal
    {"stil": "school", "parcalar": [67, 431, 614, 767, 681]},      # Kombin 8: Okul
    {"stil": "party",  "parcalar": [185, 427, 803, 616, 723, 722]}, # Kombin 9: Parti
    {"stil": "party",  "parcalar": [569, 255, 18, 375, 673, 716]}, # Kombin 10: Parti
    {"stil": "party",  "parcalar": [133, 802, 609, 722, 723]} # Kombin 11: Parti
]

class UltimateColorAndStyleStrictRecommender:
    def __init__(self, dataframe, embeddings, ground_truth):
        self.df = dataframe.copy()
        self.embeddings = embeddings
        self.ground_truth = ground_truth

        self.df['id'] = self.df['id'].astype(int)

        self.co_occurrence = set()
        for outfit in ground_truth:
            parcalar = outfit['parcalar']
            for p1 in parcalar:
                for p2 in parcalar:
                    if p1 != p2:
                        self.co_occurrence.add((int(p1), int(p2)))

    def _get_similarity(self, seed_idx, candidate_indices):
        seed_emb = self.embeddings[seed_idx].reshape(1, -1)
        cand_embs = self.embeddings[candidate_indices]
        return cosine_similarity(seed_emb, cand_embs)[0]

    def _detect_context_style(self, seed_tags):
        styles = ['casual', 'office', 'school', 'chic', 'party', 'formal', 'sport']
        for s in styles:
            if s in seed_tags: return s
        return None

    def generate_outfit(self, seed_id):
        seed_id = int(seed_id)
        if seed_id not in self.df['id'].values: return "Ürün bulunamadı."

        seed_row = self.df[self.df['id'] == seed_id].iloc[0]
        seed_idx = self.df[self.df['id'] == seed_id].index[0]

        seed_group = seed_row['product_group']
        seed_seasons = set(seed_row['season_clean'])
        seed_tags = set(seed_row['tags_clean'])
        seed_colors = seed_row['colors_clean']
        seed_text = seed_row['text_profile'].lower()

        detected_style = self._detect_context_style(seed_tags)
        is_party = 'party' in seed_tags

        is_cold_season = any(s in seed_seasons for s in ['winter', 'autumn'])
        is_pure_summer = 'summer' in seed_seasons and not is_cold_season

        outfit = {'seed': seed_row}

        upper_groups = ['blouse', 'sweater', 'shirt', 'cardigan', 't-shirt']
        lower_groups = ['pants', 'denim', 'mini skirt', 'long skirt', 'shorts']
        shoes_groups = ['sandal', 'boots', 'sneakers', 'heels']
        accessory_groups = ['earrings', 'bracelet', 'necklace', 'sunglasses', 'ring']
        outerwear_groups = ['jacket', 'coats', 'trench_coat', 'blazer']

        roles_to_fill = []
        if seed_group == 'dress': pass
        elif seed_group in upper_groups: roles_to_fill.append('lower')
        elif seed_group in lower_groups: roles_to_fill.append('upper')
        else: roles_to_fill.extend(['upper', 'lower'])

        if seed_group not in shoes_groups: roles_to_fill.append('shoes')
        if seed_group != 'bags': roles_to_fill.append('bag')
        if seed_group not in outerwear_groups: roles_to_fill.append('outerwear')

        current_accessory_groups = accessory_groups.copy()
        if is_cold_season and 'sunglasses' in current_accessory_groups:
            current_accessory_groups.remove('sunglasses')

        if is_party and seed_group not in accessory_groups:
            roles_to_fill.extend(['accessory_1', 'accessory_2'])
        elif seed_group not in accessory_groups:
            roles_to_fill.append('accessory')

        role_categories = {
            'upper': upper_groups, 'lower': lower_groups, 'shoes': shoes_groups, 'bag': ['bags'],
            'outerwear': outerwear_groups, 'accessory': current_accessory_groups,
            'accessory_1': current_accessory_groups, 'accessory_2': current_accessory_groups
        }

        for role in roles_to_fill:
            allowed_groups = role_categories[role]
            candidates = self.df[self.df['product_group'].isin(allowed_groups)]
            if candidates.empty: continue

            train_match = candidates[candidates['id'].apply(lambda cid: (int(seed_id), int(cid)) in self.co_occurrence)]

            if role == 'accessory_2' and 'accessory_1' in outfit:
                acc1_group = outfit['accessory_1']['product_group']
                train_match = train_match[train_match['product_group'] != acc1_group]

            if not train_match.empty:
                outfit[role] = train_match.iloc[0]
                continue

            color_filtered_cands = candidates[candidates['colors_clean'].apply(lambda c: is_color_compatible(seed_colors, c))]
            if not color_filtered_cands.empty:
                candidates = color_filtered_cands
            else:
                candidates = candidates[candidates['colors_clean'].apply(lambda x: any(c in x for c in ['black', 'white']))]

            if role == 'accessory_2' and 'accessory_1' in outfit:
                acc1_colors = set(outfit['accessory_1']['colors_clean'])
                same_color_cands = candidates[candidates['colors_clean'].apply(lambda x: len(set(x).intersection(acc1_colors)) > 0)]
                if not same_color_cands.empty:
                    candidates = same_color_cands

                acc1_group = outfit['accessory_1']['product_group']
                diff_group_cands = candidates[candidates['product_group'] != acc1_group]
                if not diff_group_cands.empty:
                    candidates = diff_group_cands

            if is_party:
                party_cands = candidates[candidates['tags_clean'].apply(lambda x: 'party' in x)]
                if not party_cands.empty: candidates = party_cands
            elif 'sport' in seed_tags or 'sport' in seed_text:
                sport_cands = candidates[candidates['tags_clean'].apply(lambda x: 'sport' in x)]
                if not sport_cands.empty: candidates = sport_cands
            elif any(t in seed_tags for t in ['formal', 'chic']):
                formal_chic_cands = candidates[candidates['tags_clean'].apply(lambda x: any(t in x for t in ['formal', 'chic']))]
                if not formal_chic_cands.empty: candidates = formal_chic_cands

            if is_pure_summer:
                candidates = candidates[candidates['season_clean'].apply(lambda x: 'summer' in x)]
                candidates = candidates[~candidates['product_group'].isin(['boots', 'coats'])]
            else:
                candidates = candidates[candidates['season_clean'].apply(lambda x: len(set(x).intersection(seed_seasons)) > 0)]
                candidates = candidates[candidates['product_group'] != 'sunglasses']

            if candidates.empty:
                candidates = self.df[self.df['product_group'].isin(allowed_groups)]

            cand_indices = candidates.index.tolist()
            scores = self._get_similarity(seed_idx, cand_indices)
            candidates = candidates.copy()
            candidates['final_score'] = scores

            if detected_style:
                candidates['final_score'] += candidates['tags_clean'].apply(lambda x: 0.25 if detected_style in x else 0.0)

            candidates['color_bonus'] = candidates['colors_clean'].apply(lambda c: get_color_score(seed_colors, c))
            candidates['final_score'] += candidates['color_bonus']

            candidates = candidates.sort_values(by='final_score', ascending=False)

            if role == 'bag' and 'shoes' in outfit:
                shoe_colors = outfit['shoes']['colors_clean']
                matching_color_cands = candidates[candidates['colors_clean'].apply(lambda x: len(set(x).intersection(set(shoe_colors))) > 0)]
                if not matching_color_cands.empty:
                    outfit[role] = matching_color_cands.iloc[0]
                    continue

            if role == 'shoes' and 'bag' in outfit:
                bag_colors = outfit['bag']['colors_clean']
                matching_color_cands = candidates[candidates['colors_clean'].apply(lambda x: len(set(x).intersection(set(bag_colors))) > 0)]
                if not matching_color_cands.empty:
                    outfit[role] = matching_color_cands.iloc[0]
                    continue

            outfit[role] = candidates.iloc[0]

        if not is_cold_season and 'outerwear' in outfit:
            del outfit['outerwear']

        return outfit

def safe_eval(val):
    if pd.isna(val):
        return []
    if isinstance(val, str):
        try:
            return ast.literal_eval(val)
        except:
            return []
    return val

@app.on_event("startup")
def load_data():
    global df, embeddings, recommender
    try:
        print("Loading data...")
        df = pd.read_csv('data/processed_products.csv')
        df['colors_clean'] = df['colors_clean'].apply(safe_eval)
        df['season_clean'] = df['season_clean'].apply(safe_eval)
        df['tags_clean'] = df['tags_clean'].apply(safe_eval)

        embeddings = np.load('data/product_embeddings.npy')
        
        recommender = UltimateColorAndStyleStrictRecommender(df, embeddings, GROUND_TRUTH_OUTFITS)
            
        print(f"Loaded {len(df)} products and embeddings.")
    except Exception as e:
        print(f"Error loading data: {e}")

@app.get("/recommend")
def recommend(product_id: int, limit: int = 4):
    if recommender is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
        
    outfit = recommender.generate_outfit(product_id)
    if isinstance(outfit, str):
        raise HTTPException(status_code=404, detail=outfit)

    recommendations = [int(item['id']) for role, item in outfit.items() if role != 'seed']
    
    return {"product_id": product_id, "recommendations": recommendations[:limit]}
