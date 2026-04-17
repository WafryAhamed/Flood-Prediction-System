import React, { useState } from 'react';
import { mlApi, PredictionRequest, PredictionResponse } from '../services/mlApi';
import { PredictionForm } from '../components/PredictionForm';
import { RiskLevelBadge, ProbabilityGauge, RiskFactorsList, RecommendationsList } from '../components/RiskDisplay';

export const FloodPredictionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handlePredict = async (formData: PredictionRequest) => {
    setLoading(true);
    setError(null);
    try {
      const prediction = await mlApi.predictFlood(formData);
      setResult(prediction);
    } catch (err: any) {
      console.error('Prediction failed:', err);
      setError(err.message || 'Failed to generate prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flood-prediction-page container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Flood Risk Prediction</h1>
        <p className="text-gray-600 mt-2">Enter location characteristics to evaluate immediate flood risk using our Machine Learning model.</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-sm">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Form for input data */}
          <PredictionForm onSubmit={handlePredict} loading={loading} />
        </div>
        
        <div className="lg:col-span-1">
          {/* Display results */}
          <div className="bg-white p-6 rounded-lg shadow-md border sticky top-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Prediction Results</h3>
            
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 text-sm">Analyzing location data...</p>
              </div>
            )}
            
            {!loading && !result && (
              <div className="text-center py-12 text-gray-500">
                <p>Awaiting input parameters to generate prediction.</p>
                <div className="mt-4 opacity-50">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            )}

            {!loading && result && (
              <div className="prediction-results animate-fadeIn">
                <RiskLevelBadge level={result.risk_level} />
                
                <ProbabilityGauge value={result.flood_probability} />
                
                <RiskFactorsList factors={result.top_risk_factors} />
                
                <RecommendationsList items={result.recommendations} />
                
                <div className="mt-6 text-xs text-gray-400 text-right">
                  System Prediction Time: {result.prediction_time_ms.toFixed(0)} ms
                  <br/>
                  Confidence Score: {(result.confidence * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
