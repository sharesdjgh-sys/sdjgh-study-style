import type { Task } from "@/lib/content";
import { TASKS } from "@/lib/methods";
export const TASK_KEYS = Object.keys(TASKS) as Task[];
/** 홈 미리보기와 공부법 페이지가 같은 과제 탭을 써요. */
export function TaskTabs({
  value,
  onChange,
  label,
}: {
  value: Task;
  onChange: (task: Task) => void;
  label: string;
}) {
  return (
    <div className="task-tabs" role="group" aria-label={label}>
      {TASK_KEYS.map((t) => (
        <button
          key={t}
          type="button"
          data-task={t}
          aria-pressed={value === t}
          onClick={() => onChange(t)}
        >
          {TASKS[t].label}
        </button>
      ))}
    </div>
  );
}
