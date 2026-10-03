CREATE TABLE IF NOT EXISTS saved_study_results (
  run_id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES collection_accounts(id) ON DELETE CASCADE,
  version text NOT NULL,
  type_code text NOT NULL CHECK (type_code ~ '^(visual|auditory|tactile|motion)-(solo|team)-(planned|flexible)$'),
  session jsonb NOT NULL,
  scores jsonb NOT NULL,
  completed_at timestamptz NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS saved_results_account_date
  ON saved_study_results(account_id, completed_at DESC);
