-- Migration to add flood_predictions table

CREATE TABLE IF NOT EXISTS flood_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- Ensure locations table exists or remove FK
    prediction_date TIMESTAMP NOT NULL DEFAULT NOW(),
    flood_probability FLOAT NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    prediction_data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flood_pred_location ON flood_predictions(location_id);
CREATE INDEX IF NOT EXISTS idx_flood_pred_date ON flood_predictions(prediction_date);
