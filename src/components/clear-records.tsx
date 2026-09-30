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
              description: "이 브라우저의 검사 응답과 활동 기록을 삭제해요.",
              note: "이미 전송된 이용 통계는 보관 기간에 따라 별도로 처리돼요.",
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
