-- ──────────────────────────────────────────────────────────────────────────────
-- AquaDash · Migración: seed de umbrales configurables en app_config
-- ──────────────────────────────────────────────────────────────────────────────
-- Cómo aplicar:
--   Opción A) Supabase Dashboard → SQL Editor → pega y "Run"
--   Opción B) Vía MCP Supabase: apply_migration con name="app_config_thresholds_seed"
-- ──────────────────────────────────────────────────────────────────────────────

-- 0) Asegurar UNIQUE en key (necesario para ON CONFLICT). Si ya existe, no hace nada.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_config_key_unique'
  ) THEN
    BEGIN
      ALTER TABLE app_config ADD CONSTRAINT app_config_key_unique UNIQUE (key);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      -- ya existe la constraint con otro nombre; lo ignoramos
      NULL;
    END;
  END IF;
END $$;

-- 1) Insertar filas de configuración por defecto (idempotente)
INSERT INTO app_config (key, value, updated_at) VALUES

  ('thresholds', '{
    "cloroLibre":             {"min": 0.5, "max": 2.0, "unit": "mg/L"},
    "cloroCombinado":         {"min": 0,   "max": 0.6, "unit": "mg/L"},
    "ph":                     {"min": 7.2, "max": 7.8, "unit": ""},
    "turbidez":               {"min": 0,   "max": 5.0, "unit": "NTU"},
    "tempAgua":               {"min": 24,  "max": 30,  "unit": "°C"},
    "tempAmbiente":           {"min": 26,  "max": 33,  "unit": "°C"},
    "humedadRelativa":        {"min": 50,  "max": 70,  "unit": "%"},
    "co2Delta":               {"min": 0,   "max": 500, "unit": "ppm"},
    "tempRetornoLegionella":  {"min": 50,  "max": 65,  "unit": "°C"},
    "tempDepositoLegionella": {"min": 60,  "max": 70,  "unit": "°C"},
    "biocida":                {"min": 0.2, "max": 2.0, "unit": "mg/L"},
    "phLegionella":           {"min": 7.0, "max": 8.0, "unit": ""}
  }'::jsonb, NOW()),

  ('temp_agua_thresholds', '{
    "P. Grande":       {"min": 26, "max": 29},
    "P. Peq.-Med.":    {"min": 28, "max": 32.5},
    "SPA":             {"min": 30, "max": 33},
    "Pileta":          {"min": 5,  "max": 16},
    "P. Ext. Grande":  {"min": 0,  "max": 40},
    "P. Ext. Pequena": {"min": 0,  "max": 40},
    "Splash":          {"min": 0,  "max": 40}
  }'::jsonb, NOW()),

  ('recirc_thresholds', '{
    "P. Grande":       {"recircMin": 4700, "renovadaMax": 75, "horasMin": 15},
    "P. Peq.-Med.":    {"recircMin": 950,  "renovadaMax": 40, "horasMin": 15},
    "SPA":             {"recircMin": 1900, "renovadaMax": 45, "horasMin": 15},
    "Pileta":          {"recircMin": 50,   "renovadaMax": 15, "horasMin": 10},
    "P. Ext. Grande":  {"recircMin": 4700, "renovadaMax": 75, "horasMin": 15},
    "P. Ext. Pequeña": {"recircMin": 950,  "renovadaMax": 40, "horasMin": 15},
    "Splash":          {"recircMin": 50,   "renovadaMax": 15, "horasMin": 10}
  }'::jsonb, NOW()),

  ('contadores_thresholds', '{
    "aguaGeneral":  {"min": 0, "max": 200,  "unit": "m³"},
    "aguaPiscinas": {"min": 0, "max": 100,  "unit": "m³"},
    "gas":          {"min": 0, "max": 500,  "unit": "m³"},
    "kwTolargi":    {"min": 0, "max": 2000, "unit": "kWh"},
    "accesos":      {"min": 0, "max": 1500, "unit": "personas"}
  }'::jsonb, NOW())

ON CONFLICT (key) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- Verificación rápida
-- ──────────────────────────────────────────────────────────────────────────────
SELECT key, jsonb_pretty(value) AS valor, updated_at
FROM app_config
WHERE key IN ('thresholds', 'temp_agua_thresholds', 'recirc_thresholds', 'contadores_thresholds')
ORDER BY key;
