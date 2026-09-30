CREATE OR REPLACE FUNCTION study_rollup() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(731604);
  INSERT INTO study_daily(day,version,source,metric,detail,total)
  SELECT (s.created_at AT TIME ZONE 'Asia/Seoul')::date,s.version,s.source,e.name,e.detail,count(*)::int
  FROM study_sessions s JOIN study_events e ON e.run_id=s.run_id
  WHERE s.expires_at<=now()
  GROUP BY 1,2,3,4,5
  ON CONFLICT(day,version,source,metric,detail)
  DO UPDATE SET total=study_daily.total+EXCLUDED.total;

  INSERT INTO study_daily(day,version,source,metric,detail,total)
  SELECT (s.created_at AT TIME ZONE 'Asia/Seoul')::date,s.version,s.source,'share_any','',count(*)::int
  FROM study_sessions s WHERE s.expires_at<=now()
    AND EXISTS(SELECT 1 FROM study_events e WHERE e.run_id=s.run_id AND e.name='share')
  GROUP BY 1,2,3
  ON CONFLICT(day,version,source,metric,detail)
  DO UPDATE SET total=study_daily.total+EXCLUDED.total;

  INSERT INTO study_daily(day,version,source,metric,detail,total)
  SELECT (s.created_at AT TIME ZONE 'Asia/Seoul')::date,s.version,s.source,'last_question',
    (SELECT max(e.detail::int)::text FROM study_events e WHERE e.run_id=s.run_id AND e.name='question'),count(*)::int
  FROM study_sessions s WHERE s.expires_at<=now()
    AND EXISTS(SELECT 1 FROM study_events e WHERE e.run_id=s.run_id AND e.name='question')
    AND NOT EXISTS(SELECT 1 FROM study_events e WHERE e.run_id=s.run_id AND e.name='complete')
  GROUP BY 1,2,3,5
  ON CONFLICT(day,version,source,metric,detail)
  DO UPDATE SET total=study_daily.total+EXCLUDED.total;

  DELETE FROM study_sessions WHERE expires_at<=now();
  DELETE FROM study_daily WHERE day<(now() AT TIME ZONE 'Asia/Seoul')::date-90;
END;
$$;
