"use client";
import { useState } from "react";
import { clearSession } from "@/lib/storage";
import { useConfirm } from "./ui/confirm-dialog";
export function ClearRecords() {
  const [confirm, dialog] = useConfirm();
  const [done, setDone] = useState(false);
  return (
    <>
      <button
        className="button secondary"
        onClick={async () => {
          if (
            await confirm({
              title: "기기 기록을 지울까요?",
              description:
                "이 브라우저의 최초·최근 검사 응답과 활동 기록을 삭제해요.",
              note: "계정에 저장된 도감은 유지돼요. 계정·도감 삭제는 내 도감에서 할 수 있어요. 이미 전송된 이용 통계는 별도로 처리돼요.",
              confirmLabel: "기록 삭제",
              tone: "danger",
            })
          ) {
            clearSession();
            setDone(true);
          }
        }}
      >
        이 기기의 기록 지우기
      </button>
      {done && <p role="status">이 기기의 기록을 지웠어요.</p>}
      {dialog}
    </>
  );
}
