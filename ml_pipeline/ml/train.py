import os
import argparse
import logging
import logging.config
import joblib
import json
import pandas as pd

from ml_pipeline.ml import config
from ml_pipeline.ml.preprocessing import (
    load_and_validate_data, remove_leakage_columns, engineer_features,
    encode_categorical_features, impute_missing_values, scale_features,
    split_data_spatially, handle_class_imbalance
)
from ml_pipeline.ml.model import (
    train_baseline_models, train_random_forest, train_xgboost,
    evaluate_model_comprehensive, analyze_feature_importance
)

logging.config.dictConfig(config.LOGGING_CONFIG)
logger = logging.getLogger(__name__)

def run_training_pipeline(data_path: str):
    logger.info(f"Starting Flood Prediction ML Pipeline using dataset: {data_path}")
    
    # 1. Load Data
    df = load_and_validate_data(data_path)
    
    # 2. Leakage Removal
    df = remove_leakage_columns(df)
    
    # 3. Target Definition
    if config.TARGET_COL not in df.columns:
        logger.error(f"Target column {config.TARGET_COL} not found!")
        return
        
    # Map target if needed (Yes/No to 1/0)
    if df[config.TARGET_COL].dtype == 'object':
        df[config.TARGET_COL] = df[config.TARGET_COL].map({'Yes': 1, 'No': 0, 'True': 1, 'False': 0}).fillna(0).astype(int)
        
    # 4. Feature Engineering
    df = engineer_features(df)
    
    # 5. Split Data (Spatially)
    logger.info("Splitting data spatially by district...")
    splits = split_data_spatially(df, target_col=config.TARGET_COL)
    
    X_train = splits['X_train']
    y_train = splits['y_train']
    X_val = splits['X_val']
    y_val = splits['y_val']
    X_test_synthetic = splits['X_test_synthetic']
    y_test_synthetic = splits['y_test_synthetic']
    X_test_real = splits['X_test_real']
    y_test_real = splits['y_test_real']
    
    logger.info(f"Train size: {len(X_train)}, Val size: {len(X_val)}, Test size: {len(X_test_synthetic)}")
    
    # 6. Impute Missing Values
    logger.info("Imputing missing values...")
    X_train, imputer_dict = impute_missing_values(X_train, is_train=True)
    X_val, _ = impute_missing_values(X_val, is_train=False, imputer_dict=imputer_dict)
    if X_test_synthetic is not None:
        X_test_synthetic, _ = impute_missing_values(X_test_synthetic, is_train=False, imputer_dict=imputer_dict)
    if X_test_real is not None:
        X_test_real, _ = impute_missing_values(X_test_real, is_train=False, imputer_dict=imputer_dict)
        
    # 7. Encode Categorical
    logger.info("Encoding categorical variables...")
    X_train, encoder_dict = encode_categorical_features(X_train, is_train=True, target_col=config.TARGET_COL)
    X_val, _ = encode_categorical_features(X_val, is_train=False, encoder_dict=encoder_dict)
    if X_test_synthetic is not None:
        X_test_synthetic, _ = encode_categorical_features(X_test_synthetic, is_train=False, encoder_dict=encoder_dict)
    if X_test_real is not None:
        X_test_real, _ = encode_categorical_features(X_test_real, is_train=False, encoder_dict=encoder_dict)
        
    # Ensure columns match between Train, Val, Test after encoding
    common_cols = X_train.columns
    X_val = X_val.reindex(columns=common_cols, fill_value=0)
    if X_test_synthetic is not None:
        X_test_synthetic = X_test_synthetic.reindex(columns=common_cols, fill_value=0)
    if X_test_real is not None:
        X_test_real = X_test_real.reindex(columns=common_cols, fill_value=0)
        
    # 8. Scale Features
    logger.info("Scaling features...")
    X_train, X_val, X_test_synthetic, scaler_dict = scale_features(X_train, X_val, X_test_synthetic)
    if X_test_real is not None:
        X_test_real_scaled = scaler_dict['robust'].transform(X_test_real[[c for c in X_test_real.columns if c in scaler_dict['robust'].feature_names_in_]]) if 'robust' in scaler_dict else X_test_real
        # Implement remaining scaling transformations for real data if needed
    
    # 9. Handle Imbalance
    X_train, y_train = handle_class_imbalance(X_train, y_train)
    
    # 10. Train Models
    logger.info("Training Baselines...")
    baseline_results = train_baseline_models(X_train, y_train, X_val, y_val)
    
    logger.info("Training Random Forest...")
    rf_results = train_random_forest(X_train, y_train, X_val, y_val)
    
    try:
        logger.info("Training XGBoost...")
        xgb_results = train_xgboost(X_train, y_train, X_val, y_val)
    except Exception as e:
        logger.warning(f"XGBoost failed or not available: {e}. Using Random Forest as primary model.")
        xgb_results = None
        
    best_model = rf_results['model']
    if xgb_results and xgb_results['metrics']['auc'] > rf_results['metrics']['auc']:
        best_model = xgb_results['model']
        
    # 11. Evaluate Champion Model
    logger.info("Evaluating Champion Model on Synthetic Test Data...")
    eval_syn = evaluate_model_comprehensive(best_model, X_test_synthetic, y_test_synthetic, "Synthetic Test")
    
    if X_test_real is not None and y_test_real is not None and len(X_test_real) > 0:
        logger.info("Evaluating Champion Model on Real Test Data...")
        eval_real = evaluate_model_comprehensive(best_model, X_test_real, y_test_real, "Real Test")
    
    # Save Artifacts
    logger.info(f"Saving models and artifacts to {config.MODELS_DIR}")
    os.makedirs(config.MODELS_DIR, exist_ok=True)
    
    joblib.dump(best_model, config.MODEL_PKL_PATH)
    joblib.dump(scaler_dict, config.SCALER_PKL_PATH)
    joblib.dump(encoder_dict, config.ENCODERS_PKL_PATH)
    joblib.dump(imputer_dict, config.IMPUTERS_PKL_PATH)
    
    with open(config.FEATURE_NAMES_PATH, 'w') as f:
        json.dump(list(X_train.columns), f)
        
    logger.info("Pipeline Execution Complete!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Flood Prediction Model")
    parser.add_argument("--data", type=str, required=False, help="Path to input CSV dataset", default=str(config.DEFAULT_DATA_PATH))
    args = parser.parse_args()
    
    run_training_pipeline(args.data)
