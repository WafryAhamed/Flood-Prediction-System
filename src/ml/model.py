import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
from sklearn.metrics import (
    accuracy_score, roc_auc_score, f1_score, precision_score, recall_score,
    confusion_matrix, classification_report, roc_curve, precision_recall_curve
)
from sklearn.model_selection import RandomizedSearchCV

try:
    import xgboost as xgb
except ImportError:
    xgb = None

try:
    import shap
except ImportError:
    shap = None

import logging

logger = logging.getLogger(__name__)

def train_baseline_models(X_train: pd.DataFrame, y_train: pd.Series, X_val: pd.DataFrame, y_val: pd.Series) -> dict:
    """
    Train simple baseline models for comparison
    """
    models = {
        'Majority_Class': DummyClassifier(strategy='most_frequent'),
        'Logistic_Regression': LogisticRegression(random_state=42, max_iter=1000, class_weight='balanced'),
        'Decision_Tree': DecisionTreeClassifier(random_state=42, max_depth=5, class_weight='balanced')
    }
    
    results = {}
    for name, model in models.items():
        logger.info(f"Training baseline model: {name}")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_val)
        y_prob = model.predict_proba(X_val)[:, 1] if hasattr(model, 'predict_proba') else np.zeros(len(y_pred))
        
        cm = confusion_matrix(y_val, y_pred)
        fnr = cm[1, 0] / (cm[1, 0] + cm[1, 1]) if (cm[1, 0] + cm[1, 1]) > 0 else 0
        
        metrics = {
            'auc': roc_auc_score(y_val, y_prob) if len(np.unique(y_val)) > 1 and np.any(y_prob) else 0.5,
            'f1': f1_score(y_val, y_pred, zero_division=0),
            'precision': precision_score(y_val, y_pred, zero_division=0),
            'recall': recall_score(y_val, y_pred, zero_division=0),
            'fnr': fnr
        }
        results[name] = {'model': model, 'metrics': metrics}
        logger.info(f"{name} metrics on validation: {metrics}")
        
    return results

def train_random_forest(X_train: pd.DataFrame, y_train: pd.Series, X_val: pd.DataFrame, y_val: pd.Series) -> dict:
    """
    Train Random Forest with proper hyperparameters
    """
    logger.info("Training Random Forest model...")
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=50,
        min_samples_leaf=20,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    
    rf.fit(X_train, y_train)
    y_pred = rf.predict(X_val)
    y_prob = rf.predict_proba(X_val)[:, 1]
    
    cm = confusion_matrix(y_val, y_pred)
    fnr = cm[1, 0] / (cm[1, 0] + cm[1, 1]) if (cm[1, 0] + cm[1, 1]) > 0 else 0
    
    metrics = {
        'auc': roc_auc_score(y_val, y_prob),
        'f1': f1_score(y_val, y_pred, zero_division=0),
        'precision': precision_score(y_val, y_pred, zero_division=0),
        'recall': recall_score(y_val, y_pred, zero_division=0),
        'fnr': fnr
    }
    
    logger.info(f"Random Forest metrics on validation: {metrics}")
    
    importance = pd.DataFrame({
        'feature': X_train.columns,
        'importance': rf.feature_importances_
    }).sort_values('importance', ascending=False)
    
    return {
        'model': rf,
        'metrics': metrics,
        'feature_importances': importance
    }

def train_xgboost(X_train: pd.DataFrame, y_train: pd.Series, X_val: pd.DataFrame, y_val: pd.Series) -> dict:
    """
    Train XGBoost with hyperparameter tuning
    """
    if xgb is None:
        logger.warning("XGBoost not installed. Skipping XGB training.")
        return None
        
    logger.info("Training XGBoost model...")
    counts = y_train.value_counts()
    scale_pos_weight = counts[0] / max(counts.get(1, 1), 1)
    
    xgb_model = xgb.XGBClassifier(
        objective='binary:logistic',
        eval_metric='auc',
        use_label_encoder=False,
        random_state=42,
        scale_pos_weight=scale_pos_weight
    )
    
    param_distributions = {
        'learning_rate': [0.01, 0.05, 0.1],
        'max_depth': [5, 10, 15],
        'n_estimators': [100, 200, 300],
        'subsample': [0.8, 1.0],
        'colsample_bytree': [0.8, 1.0]
    }
    
    search = RandomizedSearchCV(
        estimator=xgb_model,
        param_distributions=param_distributions,
        n_iter=10,
        scoring='roc_auc',
        cv=3,
        random_state=42,
        n_jobs=-1,
        verbose=1
    )
    
    search.fit(X_train, y_train)
    best_model = search.best_estimator_
    
    y_pred = best_model.predict(X_val)
    y_prob = best_model.predict_proba(X_val)[:, 1]
    
    cm = confusion_matrix(y_val, y_pred)
    fnr = cm[1, 0] / (cm[1, 0] + cm[1, 1]) if (cm[1, 0] + cm[1, 1]) > 0 else 0
    
    metrics = {
        'auc': roc_auc_score(y_val, y_prob),
        'f1': f1_score(y_val, y_pred, zero_division=0),
        'precision': precision_score(y_val, y_pred, zero_division=0),
        'recall': recall_score(y_val, y_pred, zero_division=0),
        'fnr': fnr
    }
    
    logger.info(f"XGBoost best params: {search.best_params_}")
    logger.info(f"XGBoost metrics on validation: {metrics}")
    
    return {
        'model': best_model,
        'best_params': search.best_params_,
        'metrics': metrics
    }

def evaluate_model_comprehensive(model, X_test: pd.DataFrame, y_test: pd.Series, dataset_name="Test") -> dict:
    """
    Comprehensive model evaluation
    """
    logger.info(f"Evaluating model on {dataset_name} set...")
    y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else np.zeros(len(y_test))
    
    # Threshold Analysis to minimize FNR
    thresholds = [0.3, 0.4, 0.5, 0.6, 0.7]
    best_threshold = 0.5
    min_fnr = 1.0
    
    for t in thresholds:
        y_pred_t = (y_prob >= t).astype(int)
        cm = confusion_matrix(y_test, y_pred_t)
        if cm.shape == (2, 2):
            fnr = cm[1, 0] / (cm[1, 0] + cm[1, 1])
            if fnr < min_fnr and t >= 0.3: # Don't want too many false positives either
                min_fnr = fnr
                best_threshold = t
                
    logger.info(f"Optimal threshold chosen: {best_threshold} with FNR: {min_fnr:.4f}")
    
    y_pred = (y_prob >= best_threshold).astype(int)
    cm = confusion_matrix(y_test, y_pred)
    
    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
        fnr = fn / (fn + tp) if (fn + tp) > 0 else 0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
    else:
        fnr, fpr = 0, 0
        
    metrics = {
        'auc': roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 0.5,
        'f1': f1_score(y_test, y_pred, zero_division=0),
        'precision': precision_score(y_test, y_pred, zero_division=0),
        'recall': recall_score(y_test, y_pred, zero_division=0),
        'fnr': fnr,
        'fpr': fpr,
        'classification_report': classification_report(y_test, y_pred, output_dict=True)
    }
    
    plots = {
        'roc': roc_curve(y_test, y_prob),
        'pr': precision_recall_curve(y_test, y_prob),
        'cm': cm
    }
    
    return {
        'metrics': metrics,
        'optimal_threshold': best_threshold,
        'plots': plots
    }

def analyze_feature_importance(model, feature_names: list, X_sample: pd.DataFrame = None) -> pd.DataFrame:
    """
    Extract and visualize feature importance using SHAP
    """
    importances = None
    if hasattr(model, 'feature_importances_'):
        importances = pd.DataFrame({
            'feature': feature_names,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
    
    shap_values = None
    if shap is not None and X_sample is not None:
        try:
            logger.info("Calculating SHAP values...")
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X_sample)
        except Exception as e:
            logger.warning(f"Could not calculate SHAP values: {e}")
            
    return {
        'importance_df': importances,
        'shap_values': shap_values
    }
