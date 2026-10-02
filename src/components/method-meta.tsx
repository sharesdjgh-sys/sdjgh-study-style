import Link from "next/link";
import { EVIDENCE, PRINCIPLES, type StudyMethod } from "@/lib/methods";

/** 근거 표시와 공부법에 담긴 원리. 버튼·링크 안에도 들어가도록 span만 써요. */
export function MethodMeta({ method }: { method: StudyMethod }) {
  return (
    <span className="method-meta">
      <span
        className="evidence-badge"
        data-level={method.evidence}
        title={EVIDENCE[method.evidence].text}
      >
        {EVIDENCE[method.evidence].label}
      </span>
      {method.principles.map((p) => {
        const principle: { label: string; basic?: boolean } = PRINCIPLES[p];
        return (
          <span
            key={p}
            className="principle-chip"
            data-basic={principle.basic ? "true" : undefined}
          >
            {principle.basic && <span aria-hidden="true">✦ </span>}
            {principle.label}
            {principle.basic && <span className="sr-only"> (기본기)</span>}
          </span>
        );
      })}
    </span>
  );
}

/** 모든 공부캐의 공부법에 들어 있는 두 원리 */
export function BasicsNote() {
  return (
    <aside className="basics-note">
      <span className="basics-mark" aria-hidden="true">
        ✦
      </span>
      <p>
        <strong>모든 공부캐의 기본기, 인출 연습과 간격 반복</strong>
        책을 덮고 떠올리기, 며칠 간격을 두고 다시 꺼내기. 효과가 가장 꾸준히
        확인된 두 원리로, ✦ 표시가 붙어 있어요.{" "}
        <Link href="/about#evidence">근거 보기</Link>
      </p>
    </aside>
  );
}
