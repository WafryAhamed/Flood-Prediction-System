import pytest
import pandas as pd
import numpy as np
from src.ml.model import evaluate_model_comprehensive

class MockModel:
    def predict(self, X):
        return np.array([1, 0, 1, 0])
        
    def predict_proba(self, X):
        return np.array([[0.1, 0.9], [0.8, 0.2], [0.3, 0.7], [0.6, 0.4]])

@pytest.fixture
def mock_test_data():
    X = pd.DataFrame({'f1': [1, 2, 3, 4], 'f2': [0.1, 0.2, 0.3, 0.4]})
    y = pd.Series([1, 0, 1, 0])
    return X, y

def test_model_evaluation(mock_test_data):
    """Verify evaluation generates expected metrics"""
    X, y = mock_test_data
    model = MockModel()
    
    results = evaluate_model_comprehensive(model, X, y, dataset_name="Testing")
    
    assert 'metrics' in results
    assert 'optimal_threshold' in results
    assert 'plots' in results
    
    metrics = results['metrics']
    assert metrics['auc'] >= 0.0 and metrics['auc'] <= 1.0
    assert metrics['f1'] >= 0.0 and metrics['f1'] <= 1.0
    
def test_threshold_optimization(mock_test_data):
    """Ensure optimal threshold is bound properly"""
    X, y = mock_test_data
    model = MockModel()
    results = evaluate_model_comprehensive(model, X, y, dataset_name="Testing")
    
    threshold = results['optimal_threshold']
    assert threshold in [0.3, 0.4, 0.5, 0.6, 0.7]
