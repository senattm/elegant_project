
from pathlib import Path

ENGINE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = ENGINE_DIR.parent

CHECKPOINT_DIR = ENGINE_DIR / "data" / "checkpoints"
POLYVORE_IMAGES_DIR = PROJECT_ROOT / "backend" / "public" / "polyvore-images"
PUBLIC_DIR = PROJECT_ROOT / "backend" / "public"
CIR_DATA_DIR = ENGINE_DIR / "data"
