CREATE INDEX IF NOT EXISTS study_sessions_created ON study_sessions(created_at);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS collection_accounts_created ON collection_accounts(created_at DESC, id);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS collection_accounts_registered ON collection_accounts(registered_at) WHERE registered_at IS NOT NULL;
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS collection_cards_opened ON collection_cards(opened_at) WHERE opened_at IS NOT NULL;
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS skill_practices_created ON skill_practices(created_at);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS goods_unlocks_created ON goods_unlocks(created_at);
