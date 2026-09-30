import { ClearRecords } from "@/components/clear-records";
export const metadata = { title: "저장 및 개인정보 안내" };
export default function Page() {
  return (
    <main id="main" className="prose-shell">
      <span className="eyebrow">내 기록은 어떻게 다뤄지나요?</span>
      <h1>필요한 만큼만 저장해요.</h1>
      <p className="prose-lead">
        회원가입 없이 사용할 수 있어요. 문항별 답변과 상세 점수는 서버로 보내지
        않아요.
      </p>
      <section className="prose-section">
        <h2>이 기기에 저장되는 정보</h2>
        <table className="privacy-table">
          <thead>
            <tr>
              <th>정보</th>
              <th>목적</th>
              <th>기간</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>진행 중 응답·문항 위치·버전</td>
              <td>이어하기</td>
              <td>마지막 저장 후 24시간</td>
            </tr>
            <tr>
              <td>완료 응답·대표 결과·활동 기록</td>
              <td>결과 다시 보기·시도 후 평가</td>
              <td>완료 후 7일</td>
            </tr>
          </tbody>
        </table>
        <p>
          기간이 지나면 다음 접속 시 기기의 기록을 제거해요. 다른 기기나
          브라우저에서는 이어지지 않으며, 브라우저 설정에 따라 저장이 제한될 수
          있어요.
        </p>
        <ClearRecords />
      </section>
      <section className="prose-section">
        <h2>서비스 개선을 위한 최소 이용 통계</h2>
        <p>
          검사마다 새 임시 ID를 만들어요. 검사 버전, QR·학교 링크·공유·직접 접속
          같은 유입 구분, 검사 시작·문항 도달·완료·공유 버튼 사용·활동 선택·활동
          시작·시도 후 평가를 처리해요.
        </p>
        <p>
          이름, 학교, 학년, 문항별 응답, 상세 점수, 결과 유형은 통계에 포함하지
          않아요. 활동 시작과 실제 시도 보고는 따로 집계해요. 기기 기록을
          지우거나 재검사하면 같은 사람인지 확인할 수 없어 완료 건수는 고유 학생
          수와 다를 수 있어요.
        </p>
        <p>
          서버에 처음 기록된 시점부터 7일 동안 관찰하며, 이후 하루 한 번의 정리
          작업으로 임시 ID를 제거한 집계로 바꾸고 원본을 삭제해요. 따라서
          삭제까지 최대 약 하루가 추가될 수 있어요. 집계는 최대 90일을 기준으로
          정리해요.
        </p>
        <p>
          통계 연결이 설정되지 않은 환경에서는 통계를 저장하지 않아요. 통계가
          전송되지 않아도 검사와 결과는 사용할 수 있어요.
        </p>
      </section>
      <section className="prose-section">
        <h2>호스팅과 공유 서비스</h2>
        <p>
          Vercel 호스팅과 Neon 데이터베이스를 사용하도록 구성되어 있어요. 호스팅
          제공자의 운영·보안 로그에는 IP 주소나 브라우저 정보가 처리될 수
          있어요. 이 앱의 통계 테이블에는 해당 정보를 저장하지 않아요.
        </p>
        <p>
          카카오톡 공유 기능을 사용할 때는 카카오 서비스로 연결돼요. 공유
          링크에는 대표 유형 코드만 담기며, 문항별 응답과 상세 점수는 담기지
          않아요. 카카오 설정이 제공된 환경에서는 공유 화면에 SDK를 불러와요.
        </p>
        <p>
          실제 운영자의 연락처와 공급자별 처리 설정은 공개 배포 전에 확인해야
          해요.
          {process.env.NEXT_PUBLIC_CONTACT_EMAIL && (
            <>
              {" "}
              문의:{" "}
              <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}>
                {process.env.NEXT_PUBLIC_CONTACT_EMAIL}
              </a>
            </>
          )}
        </p>
      </section>
    </main>
  );
}
