"use client";
import { clearSession } from "@/lib/storage";
import { useConfirm } from "./ui/confirm-dialog";
export function ClearRecords() {
  const [confirm, dialog] = useConfirm();
  return (
    <>
      <button
        className="button secondary"
        onClick={async () => {
          if (
            await confirm({
              title: "이 브라우저의 검사 기록을 지울까요?",
              description:
                "이 브라우저의 최초·최근 검사 응답과 활동 기록을 삭제해요.",
              note: "계정에 저장된 도감과 검사 답변·점수는 유지돼요. 계정·도감 삭제는 내 정보 또는 내 도감에서 할 수 있어요. 이미 전송된 이용 통계는 별도로 처리돼요.",
              confirmLabel: "기록 삭제",
              tone: "danger",
            })
          ) {
            clearSession();
          }
        }}
      >
        이 브라우저의 검사 기록 삭제
      </button>
      {dialog}
    </>
  );
}
