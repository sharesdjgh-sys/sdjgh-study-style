-- Participation in the school campaign is self-declared, not school verification.
-- This table records registration only; it does not issue cards or prize rights.
CREATE TABLE IF NOT EXISTS school_event_participants (
  event_id text NOT NULL,
  account_id uuid NOT NULL REFERENCES collection_accounts(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('poster_qr','event_page')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, account_id)
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS school_event_participants_enrolled_idx
  ON school_event_participants(event_id, enrolled_at);
