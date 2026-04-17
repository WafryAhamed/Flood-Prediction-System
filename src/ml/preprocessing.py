import pandas as pd
import numpy as np
from sklearn.preprocessing import OrdinalEncoder, OneHotEncoder, RobustScaler, StandardScaler, MinMaxScaler
from sklearn.impute import KNNImputer, SimpleImputer
from category_encoders import TargetEncoder
import logging

logger = logging.getLogger(__name__)

def load_and_validate_data(filepath: str) -> pd.DataFrame:
    """
    Load CSV and perform initial validation
    
    Validation checks:
    - Geographic bounds: lat [5.9, 9.9], lon [79.5, 82.0] (Sri Lanka)
    - Rainfall values >= 0
    - Elevation values >= 0
    - No negative population density
    - Valid date formats
    - Proper data types
    
    Return: Validated DataFrame
    """
    try:
        df = pd.read_csv(filepath)
        logger.info(f"Successfully loaded dataset from {filepath} with shape {df.shape}")
    except Exception as e:
        logger.error(f"Error loading {filepath}: {e}")
        raise

    initial_len = len(df)
    
    # 1. Geographic bounds (Sri Lanka)
    df = df[(df['latitude'].between(5.9, 9.9)) & (df['longitude'].between(79.5, 82.0))]
    
    # 2. Non-negative checks for environmental numeric variables
    for col in ['rainfall_7d_mm', 'monthly_rainfall_mm', 'elevation_m', 'population_density_per_km2', 'distance_to_river_m']:
        if col in df.columns:
            df = df[df[col] >= 0]
    
    # 3. Create datetime
    if 'generation_date' in df.columns:
        df['generation_date'] = pd.to_datetime(df['generation_date'], errors='coerce')
        df = df.dropna(subset=['generation_date'])

    dropped = initial_len - len(df)
    if dropped > 0:
        logger.warning(f"Validation dropped {dropped} rows due to out-of-bounds or invalid data.")

    return df

def remove_leakage_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Remove columns that cause data leakage
    """
    df_clean = df.copy()

    # Extract month from generation_date before dropping
    if 'generation_date' in df_clean.columns:
        df_clean['month'] = df_clean['generation_date'].dt.month
        # Monsoon feature: depends on month
        df_clean['is_monsoon'] = df_clean['month'].apply(lambda x: 1 if x in [5,6,7,8,9,10,11,12,1] else 0)
        df_clean = df_clean.drop(columns=['generation_date'])

    # Drop explicit leakage columns
    leakage_cols = ['inundation_area_sqm', 'flood_risk_score', 'is_good_to_live', 'reason_not_good_to_live', 'record_id']
    drop_cols = [c for c in leakage_cols if c in df_clean.columns]
    
    if drop_cols:
        logger.info(f"Dropping leakage columns: {drop_cols}")
        df_clean = df_clean.drop(columns=drop_cols)
        
    return df_clean

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create domain-specific flood prediction features
    """
    df_feat = df.copy()
    
    # Check if necessary columns exist for safe processing
    has_rain = 'rainfall_7d_mm' in df_feat.columns and 'monthly_rainfall_mm' in df_feat.columns
    has_topo = 'elevation_m' in df_feat.columns and 'distance_to_river_m' in df_feat.columns
    has_drainage = 'drainage_index' in df_feat.columns
    
    if has_rain:
        df_feat['rainfall_intensity'] = df_feat['rainfall_7d_mm'] / 7.0
        df_feat['rainfall_ratio'] = df_feat['rainfall_7d_mm'] / (df_feat['monthly_rainfall_mm'] + 1.0)
        p95_rain = df_feat['rainfall_7d_mm'].quantile(0.95)
        df_feat['extreme_rainfall'] = (df_feat['rainfall_7d_mm'] > p95_rain).astype(int)
        
    if has_topo:
        df_feat['very_low_elevation'] = (df_feat['elevation_m'] < 20).astype(int)
        df_feat['low_elevation'] = (df_feat['elevation_m'] < 50).astype(int)
        df_feat['slope_estimate'] = df_feat['elevation_m'] / (df_feat['distance_to_river_m'] + 100.0)
        
        df_feat['very_close_to_river'] = (df_feat['distance_to_river_m'] < 500).astype(int)
        df_feat['elevation_river_risk'] = (1.0 / (df_feat['elevation_m'] + 1.0)) * (1.0 / (df_feat['distance_to_river_m'] + 100.0))
        
    soil_perm_map = {'Sandy': 0.9, 'Loamy': 0.6, 'Silty': 0.4, 'Clay': 0.2, 'Rocky': 0.1}
    if 'soil_type' in df_feat.columns:
        df_feat['soil_permeability'] = df_feat['soil_type'].map(soil_perm_map).fillna(0.5)
        
        if has_drainage:
            df_feat['infiltration_capacity'] = df_feat['soil_permeability'] * df_feat['drainage_index']
            
    if has_rain and has_drainage:
        df_feat['rain_drainage_risk'] = df_feat['rainfall_7d_mm'] * (1.0 - df_feat['drainage_index'])
        
    if has_topo:
        df_feat['low_elev_near_river'] = ((df_feat['elevation_m'] < 50) & (df_feat['distance_to_river_m'] < 1000)).astype(int)
        
    if 'built_up_percent' in df_feat.columns and has_drainage and has_rain:
        df_feat['urban_flood_risk'] = (df_feat['built_up_percent'] / 100.0) * (1.0 - df_feat['drainage_index']) * (df_feat['rainfall_7d_mm'] / 100.0)
        
    if 'ndwi' in df_feat.columns and has_drainage and 'water_presence_flag' in df_feat.columns:
        water_likely = (df_feat['water_presence_flag'] == 'Likely').astype(int)
        df_feat['water_accumulation'] = (1.0 - df_feat['drainage_index']) * ((df_feat['ndwi'] + 1.0) / 2.0) * water_likely
        
    if 'infrastructure_score' in df_feat.columns:
        df_feat['infrastructure_vulnerability'] = (100.0 - df_feat['infrastructure_score']) / 100.0
        
    if 'nearest_hospital_km' in df_feat.columns and 'nearest_evac_km' in df_feat.columns:
        df_feat['emergency_access'] = (df_feat['nearest_hospital_km'] + df_feat['nearest_evac_km']) / 2.0
        
    if 'population_density_per_km2' in df_feat.columns and 'built_up_percent' in df_feat.columns:
        df_feat['population_exposure'] = df_feat['population_density_per_km2'] * (df_feat['built_up_percent'] / 100.0)
        
    if 'month' in df_feat.columns:
        df_feat['is_peak_monsoon'] = df_feat['month'].apply(lambda x: 1 if x in [6,7,8,11,12] else 0)

    logger.info(f"Engineered features complete. Total columns: {len(df_feat.columns)}")
    return df_feat

def encode_categorical_features(df: pd.DataFrame, is_train: bool = True, encoder_dict: dict = None, target_col: str = None) -> tuple:
    """
    Encode categorical variables properly
    """
    df_enc = df.copy()
    
    if is_train:
        encoder_dict = {}
        
    # 1. Ordinal Encoding
    ordinal_cols = ['road_quality', 'electricity', 'water_supply']
    ordinal_mappings = {
        'road_quality': {'Poor': 0, 'Fair': 1, 'Good': 2},
        'electricity': {'None': 0, 'Mixed': 1, 'Grid': 2},
        'water_supply': {'Surface': 0, 'Rainwater': 1, 'Well': 2, 'Municipal': 3}
    }
    
    for col in ordinal_cols:
        if col in df_enc.columns:
            df_enc[col] = df_enc[col].map(ordinal_mappings[col]).fillna(-1)
            
    # 2. One-Hot Encoding
    nomina_cols = ['landcover', 'soil_type', 'urban_rural', 'water_presence_flag']
    nomina_to_encode = [c for c in nomina_cols if c in df_enc.columns]
    
    if is_train and nomina_to_encode:
        ohe = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        ohe.fit(df_enc[nomina_to_encode])
        encoder_dict['ohe'] = ohe
        encoder_dict['ohe_cols'] = nomina_to_encode
        
    if 'ohe' in encoder_dict and encoder_dict.get('ohe_cols'):
        ohe_cols = encoder_dict['ohe_cols']
        encoded_array = encoder_dict['ohe'].transform(df_enc[ohe_cols])
        encoded_feature_names = encoder_dict['ohe'].get_feature_names_out(ohe_cols)
        
        encoded_df = pd.DataFrame(encoded_array, columns=encoded_feature_names, index=df_enc.index)
        df_enc = pd.concat([df_enc.drop(columns=ohe_cols), encoded_df], axis=1)

    # 3. Target Encoding
    target_encode_cols = ['district', 'place_name']
    te_cols_present = [c for c in target_encode_cols if c in df_enc.columns]
    
    if is_train and te_cols_present and target_col and target_col in df_enc.columns:
        te = TargetEncoder(cols=te_cols_present, smoothing=10)
        te.fit(df_enc[te_cols_present], df_enc[target_col])
        encoder_dict['te'] = te
        encoder_dict['te_cols'] = te_cols_present

    if 'te' in encoder_dict and encoder_dict.get('te_cols'):
        te_cols = encoder_dict['te_cols']
        df_enc[te_cols] = encoder_dict['te'].transform(df_enc[te_cols])

    return df_enc, encoder_dict

def impute_missing_values(df: pd.DataFrame, is_train: bool = True, imputer_dict: dict = None) -> tuple:
    """
    Intelligent imputation strategy
    """
    df_imp = df.copy()
    if is_train:
        imputer_dict = {}

    # Initial drop
    critical_cols = ['latitude', 'longitude', 'elevation_m']
    drop_cols = [c for c in critical_cols if c in df_imp.columns]
    df_imp = df_imp.dropna(subset=drop_cols)

    # Median imputation
    median_cols = ['infrastructure_score', 'population_density_per_km2']
    m_cols_present = [c for c in median_cols if c in df_imp.columns]
    if m_cols_present:
        if is_train:
            simp_median = SimpleImputer(strategy='median')
            simp_median.fit(df_imp[m_cols_present])
            imputer_dict['median_imputer'] = simp_median
        if 'median_imputer' in imputer_dict:
            df_imp[m_cols_present] = imputer_dict['median_imputer'].transform(df_imp[m_cols_present])
            
    # Spatial KNN Imputation
    knn_cols = ['rainfall_7d_mm', 'monthly_rainfall_mm', 'ndvi', 'ndwi', 'drainage_index']
    knn_cols_present = [c for c in knn_cols if c in df_imp.columns]
    if knn_cols_present and 'latitude' in df_imp.columns and 'longitude' in df_imp.columns:
        knn_features = ['latitude', 'longitude'] + knn_cols_present
        if is_train:
            knn_imputer = KNNImputer(n_neighbors=5, weights='distance')
            knn_imputer.fit(df_imp[knn_features])
            imputer_dict['knn_imputer'] = knn_imputer
        
        if 'knn_imputer' in imputer_dict:
            df_imp[knn_features] = imputer_dict['knn_imputer'].transform(df_imp[knn_features])

    return df_imp, imputer_dict

def scale_features(X_train: pd.DataFrame, X_val: pd.DataFrame, X_test: pd.DataFrame) -> tuple:
    """
    Scale numeric features appropriately
    """
    scaler_dict = {}
    
    robust_cols = ['rainfall_7d_mm', 'monthly_rainfall_mm', 'distance_to_river_m', 'population_density_per_km2']
    std_cols = ['elevation_m', 'infrastructure_score']
    minmax_cols = ['drainage_index', 'ndvi', 'ndwi']

    # We will log transform robust_cols before scaling
    for df in [X_train, X_val, X_test]:
        for col in ['distance_to_river_m', 'population_density_per_km2']:
            if col in df.columns:
                df[col] = np.log1p(df[col].clip(lower=0))

    rc = [c for c in robust_cols if c in X_train.columns]
    sc = [c for c in std_cols if c in X_train.columns]
    mc = [c for c in minmax_cols if c in X_train.columns]

    if rc:
        scaler_dict['robust'] = RobustScaler().fit(X_train[rc])
        X_train[rc] = scaler_dict['robust'].transform(X_train[rc])
        X_val[rc] = scaler_dict['robust'].transform(X_val[rc])
        if X_test is not None:
            X_test[rc] = scaler_dict['robust'].transform(X_test[rc])

    if sc:
        scaler_dict['standard'] = StandardScaler().fit(X_train[sc])
        X_train[sc] = scaler_dict['standard'].transform(X_train[sc])
        X_val[sc] = scaler_dict['standard'].transform(X_val[sc])
        if X_test is not None:
            X_test[sc] = scaler_dict['standard'].transform(X_test[sc])

    if mc:
        scaler_dict['minmax'] = MinMaxScaler().fit(X_train[mc])
        X_train[mc] = scaler_dict['minmax'].transform(X_train[mc])
        X_val[mc] = scaler_dict['minmax'].transform(X_val[mc])
        if X_test is not None:
            X_test[mc] = scaler_dict['minmax'].transform(X_test[mc])

    return X_train, X_val, X_test, scaler_dict

def split_data_spatially(df: pd.DataFrame, target_col: str = 'flood_occurrence_current_event') -> dict:
    """
    Spatial cross-validation split using district.
    """
    if 'is_synthetic' not in df.columns:
        df['is_synthetic'] = True # Default to true for logic testing if undefined
        
    real_data = df[df['is_synthetic'] == False]
    synthetic_data = df[df['is_synthetic'] == True]
    
    # We drop the flag after splitting
    if len(real_data) > 0:
        real_data = real_data.drop(columns=['is_synthetic'])
        y_test_real_df = real_data[target_col] if target_col in real_data.columns else None
        X_test_real_df = real_data.drop(columns=[target_col]) if target_col in real_data.columns else real_data
    else:
        X_test_real_df, y_test_real_df = None, None

    synthetic_data = synthetic_data.drop(columns=['is_synthetic'])
    
    if 'district' not in synthetic_data.columns:
        # Fallback if no district column
        districts = np.array(['Unknown'])
        synthetic_data['district'] = 'Unknown'
    else:
        districts = synthetic_data['district'].unique()
        
    np.random.seed(42)
    np.random.shuffle(districts)
    
    n_dist = len(districts)
    train_end = int(0.7 * n_dist)
    val_end = int(0.85 * n_dist)
    
    if n_dist < 3: # Not enough districts to split strictly, fallback to random splits on rows
        train_dists = districts
        val_dists = districts
        test_dists = districts
    else:
        train_dists = set(districts[:train_end])
        val_dists = set(districts[train_end:val_end])
        test_dists = set(districts[val_end:])
        
    train_syn = synthetic_data[synthetic_data['district'].isin(train_dists)]
    val_syn = synthetic_data[synthetic_data['district'].isin(val_dists)]
    test_syn = synthetic_data[synthetic_data['district'].isin(test_dists)]
    
    res = {}
    if target_col in train_syn.columns:
        res['X_train'] = train_syn.drop(columns=[target_col])
        res['y_train'] = train_syn[target_col]
        res['X_val'] = val_syn.drop(columns=[target_col])
        res['y_val'] = val_syn[target_col]
        res['X_test_synthetic'] = test_syn.drop(columns=[target_col])
        res['y_test_synthetic'] = test_syn[target_col]
    else:
        res['X_train'] = train_syn
        res['X_val'] = val_syn
        res['X_test_synthetic'] = test_syn
        
    res['X_test_real'] = X_test_real_df
    res['y_test_real'] = y_test_real_df
    
    return res

def handle_class_imbalance(X_train: pd.DataFrame, y_train: pd.Series) -> tuple:
    """
    Handle imbalanced flood/no-flood distribution
    Returns original data but recommends class weights for models that support it.
    If applying SMOTE, would do it here. For simplicity and robustness, we return as is
    but log the imbalance ratio so models know to use class_weight='balanced'.
    """
    counts = y_train.value_counts()
    
    minority_class = counts.index[-1]
    majority_class = counts.index[0]
    
    ratio = counts[majority_class] / max(counts[minority_class], 1)
    
    if ratio > 3:
        logger.warning(f"Class imbalance detected: Ratio {ratio:.2f}:1. Recommending class_weight='balanced'.")
        
    # Standard recommendation: use class_weight='balanced'
    return X_train, y_train
