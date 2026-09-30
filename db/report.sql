-- 7일 관찰이 끝난 검사 코호트. 중복 학생 수가 아닌 검사 건수입니다.
-- share는 채널 간 중복될 수 있으므로 채널별 비율로 해석합니다.
SELECT day, metric, detail, SUM(total) AS total
FROM study_daily
GROUP BY day, metric, detail ORDER BY day DESC, metric, detail;

-- 최근 7일 진행 현황 (미확정 코호트)
SELECT (s.created_at AT TIME ZONE 'Asia/Seoul')::date AS day,
  count(*) AS starts,
  count(*) FILTER (WHERE EXISTS(SELECT 1 FROM study_events e WHERE e.run_id=s.run_id AND e.name='complete')) AS completions,
  count(*) FILTER (WHERE EXISTS(SELECT 1 FROM study_events e WHERE e.run_id=s.run_id AND e.name='share')) AS share_attempts,
  count(*) FILTER (WHERE EXISTS(SELECT 1 FROM study_events e WHERE e.run_id=s.run_id AND e.name='feedback' AND e.detail IN ('helpful','mixed'))) AS tried_reports
FROM study_sessions s GROUP BY 1 ORDER BY 1 DESC;
