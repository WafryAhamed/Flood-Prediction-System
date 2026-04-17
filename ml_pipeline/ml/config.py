import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "server" / "models"

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# File paths
DEFAULT_DATA_PATH = BASE_DIR / "dataset.csv"  # For local testing if available
MODEL_PKL_PATH = MODELS_DIR / "flood_model.pkl"
SCALER_PKL_PATH = MODELS_DIR / "scaler.pkl"
ENCODERS_PKL_PATH = MODELS_DIR / "encoders.pkl"
IMPUTERS_PKL_PATH = MODELS_DIR / "imputers.pkl"
FEATURE_NAMES_PATH = MODELS_DIR / "feature_names.json"

# Features to drop explicitly
DROP_COLS = [
    'inundation_area_sqm', 'flood_risk_score', 'is_good_to_live', 
    'reason_not_good_to_live', 'record_id'
]

# Model configuration
RANDOM_STATE = 42
TARGET_COL = "flood_occurrence_current_event"

# Logging configuration
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        },
    },
    'handlers': {
        'default': {
            'level': 'INFO',
            'formatter': 'standard',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        '': {
            'handlers': ['default'],
            'level': 'INFO',
            'propagate': True
        }
    }
}
