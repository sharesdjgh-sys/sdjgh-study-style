export function GeneralShareCard({ portrait }: { portrait: string }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "#f8f5eb",
        color: "#243d35",
        fontFamily: "Pretendard",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: -60,
          top: -100,
          width: 580,
          height: 800,
          borderRadius: "50%",
          background: "#eaf0df",
          transform: "rotate(18deg)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 58,
          top: 44,
          alignItems: "center",
          gap: 20,
        }}
      >
        <span style={{ fontSize: 32, color: "#27785d" }}>공부캐</span>
        <span
          style={{
            fontSize: 21,
            color: "#62766a",
            borderLeft: "2px solid #d8dfcf",
            paddingLeft: 20,
          }}
        >
          재미로 만나는 귀여운 공부 캐릭터
        </span>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 58,
          top: 125,
          flexDirection: "column",
          fontSize: 64,
          lineHeight: 1.22,
          letterSpacing: -3,
        }}
      >
        <div style={{ display: "flex" }}>
          <span style={{ color: "#27785d" }}>개성</span>
          <span style={{ color: "#7955a6", marginLeft: 14 }}>만점</span>
          <span style={{ marginLeft: 16 }}>16명 중,</span>
        </div>
        <div style={{ display: "flex", marginTop: 4, fontSize: 83 }}>
          <span>너의 </span>
          <span
            style={{ display: "flex", position: "relative", marginLeft: 18 }}
          >
            <span
              style={{
                position: "absolute",
                left: -3,
                right: -3,
                bottom: 8,
                height: 24,
                background: "#edd579",
                transform: "rotate(-2deg)",
              }}
            />
            <span>공부캐</span>
          </span>
          <span>는?</span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 58,
          top: 335,
          flexDirection: "column",
          borderLeft: "4px solid #b9cdb2",
          paddingLeft: 22,
        }}
      >
        <span style={{ fontSize: 22, color: "#27785d", marginBottom: 10 }}>
          토리 선생님
        </span>
        <span style={{ fontSize: 29, lineHeight: 1.45 }}>
          어떤 공부캐가 너와 닮았을까?
        </span>
        <span style={{ fontSize: 27, lineHeight: 1.45, color: "#65736a" }}>
          평소의 네 모습을 골라 함께 찾아보자!
        </span>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 58,
          bottom: 45,
          alignItems: "center",
          gap: 22,
        }}
      >
        <span
          style={{
            display: "flex",
            background: "#27785d",
            color: "white",
            padding: "19px 28px",
            borderRadius: 18,
            fontSize: 29,
          }}
        >
          내 공부캐 찾기 →
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 20,
            lineHeight: 1.5,
            color: "#69776c",
          }}
        >
          <span>약 3~5분</span>
          <span>가입 없이 바로 시작</span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 789,
          top: 129,
          width: 287,
          height: 365,
          background: "#d3e2cf",
          border: "2px solid #c1d1b9",
          borderRadius: 30,
          transform: "rotate(12deg)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 740,
          top: 117,
          width: 287,
          height: 365,
          background: "#f2e5ba",
          border: "2px solid #dfd2a7",
          borderRadius: 30,
          transform: "rotate(-9deg)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 786,
          top: 137,
          width: 287,
          height: 365,
          background: "#fffdf6",
          border: "2px solid #dcded0",
          borderRadius: 30,
          justifyContent: "center",
          paddingTop: 23,
          fontSize: 22,
          color: "#6d7e6a",
        }}
      >
        아직은 비밀! · ??? / 16
      </div>
      {/* The guide is public; no collectible character is revealed here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={portrait}
        alt=""
        width={420}
        height={420}
        style={{
          position: "absolute",
          left: 710,
          top: 167,
          objectFit: "contain",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 796,
          top: 67,
          padding: "13px 24px",
          borderRadius: 30,
          background: "#ffffff",
          border: "2px solid #d4dfce",
          fontSize: 24,
          color: "#27785d",
          transform: "rotate(3deg)",
        }}
      >
        함께 찾아볼까?
      </div>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        style={{
          position: "absolute",
          left: 701,
          top: 82,
        }}
      >
        <path
          d="M20 0 Q23 17 40 20 Q23 23 20 40 Q17 23 0 20 Q17 17 20 0"
          fill="#c19a43"
        />
      </svg>
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        style={{
          position: "absolute",
          right: 35,
          top: 340,
        }}
      >
        <path
          d="M20 0 Q23 17 40 20 Q23 23 20 40 Q17 23 0 20 Q17 17 20 0"
          fill="#87a27b"
        />
      </svg>
    </div>
  );
}
