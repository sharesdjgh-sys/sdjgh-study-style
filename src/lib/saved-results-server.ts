import { database } from "./db";
import { scoreAnswers } from "./scoring";
import type { Session } from "./storage";
import type { Answers } from "./content";

/** Immutable, re-scored snapshots; a run can only belong to one account. */
export async function saveAccountResult(accountId: string, input: Session) {
  const { mission: _mission, ...session } = input;
  void _mission;
  const scores = scoreAnswers(session.answers as Answers);
  const sql = database();
  const rows = await sql`INSERT INTO saved_study_results
    (run_id,account_id,version,type_code,session,scores,completed_at)
    SELECT ${session.runId}::uuid,${accountId}::uuid,${session.version},${session.result},
      ${JSON.stringify(session)}::jsonb,${JSON.stringify(scores)}::jsonb,
      ${new Date(session.completedAt!).toISOString()}::timestamptz
    WHERE NOT EXISTS(SELECT 1 FROM collection_accounts
      WHERE first_run_id=${session.runId}::uuid AND id<>${accountId}::uuid)
    ON CONFLICT(run_id) DO UPDATE SET run_id=EXCLUDED.run_id
    WHERE saved_study_results.account_id=EXCLUDED.account_id
      AND saved_study_results.version=EXCLUDED.version
      AND saved_study_results.type_code=EXCLUDED.type_code
      AND saved_study_results.session->'answers'=EXCLUDED.session->'answers'
      AND saved_study_results.session->'choices'=EXCLUDED.session->'choices'
    RETURNING run_id`;
  return rows.length > 0;
}
