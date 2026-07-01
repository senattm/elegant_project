import torch
from torch import nn
from typing import List, Tuple, Union
from dataclasses import dataclass

from outfit_model.datatypes import FashionItem
from outfit_model.modules.encoder import CLIPItemEncoder
from outfit_model.outfit_transformer import OutfitTransformer, OutfitTransformerConfig
import numpy as np

@dataclass
class OutfitCLIPTransformerConfig(OutfitTransformerConfig):
    item_enc_clip_model_name: str = "patrickjohncyh/fashion-clip"


class OutfitCLIPTransformer(OutfitTransformer):

    def __init__(
        self,
        cfg: OutfitCLIPTransformerConfig = OutfitCLIPTransformerConfig()
    ):
        super().__init__(cfg)

    def _init_item_enc(self) -> CLIPItemEncoder:
        self.item_enc = CLIPItemEncoder(
            model_name=self.cfg.item_enc_clip_model_name,
            enc_norm_out=self.cfg.item_enc_norm_out,
            aggregation_method=self.cfg.aggregation_method
        )

    def precompute_clip_embedding(self, item: List[FashionItem]) -> np.ndarray:
        outfits = [[item_] for item_ in item]
        images, texts, mask = self._pad_and_mask_for_outfits(outfits)
        enc_outs = self.item_enc(images, texts)
        embeddings = enc_outs[:, 0, :]

        return embeddings.detach().cpu().numpy()