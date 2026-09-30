CREATE TABLE IF NOT EXISTS study_sessions (
  run_id uuid PRIMARY KEY,
  version text NOT NULL,
  source text NOT NULL CHECK(source IN ('direct','qr','school','share')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days'
);
CREATE INDEX IF NOT EXISTS study_sessions_expiry ON study_sessions(expires_at);
CREATE TABLE IF NOT EXISTS study_events (
  run_id uuid NOT NULL REFERENCES study_sessions(run_id) ON DELETE CASCADE,
  name text NOT NULL CHECK(name IN ('start','question','complete','share','mission_select','mission_start','feedback')),
  slot text NOT NULL DEFAULT '',
  detail text NOT NULL DEFAULT '',
  PRIMARY KEY(run_id,name,slot)
);
CREATE TABLE IF NOT EXISTS study_daily (
  day date NOT NULL,
  version text NOT NULL,
  source text NOT NULL,
  metric text NOT NULL,
  detail text NOT NULL DEFAULT '',
  total integer NOT NULL CHECK(total>=0),
  PRIMARY KEY(day,version,source,metric,detail)
);
