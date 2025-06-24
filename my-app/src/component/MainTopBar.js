"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MainTopBar({ showMicNotice = true }) {
  const router = useRouter();
  const handleReset = () => {
    localStorage.removeItem("chatMessages");
    router.push("/");
  };
  
  return (
    <div
     className="font-seoul"
      style={{
        position: "fixed", // ✅ 고정 상단
        top: 0,
        left: 0,
        width: "100%",
        height: "120px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        backgroundColor: "#fff",
        zIndex: 1000,
        
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <img src="/images/logo-text.png" alt="로고" style={{ height: "200px" }} />
        
        <button
          onClick={handleReset}
          style={{
            border: "2px solid #aee2ff",
            borderRadius: "8px",
            padding: "6px 12px",
            backgroundColor: "white",
            color: "#333",
            fontWeight: "bold",
            cursor: "pointer",
            
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0faff")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
        >
          다시시작
        </button>
        
          <button
            onClick={handleReset}
            style={{
              border: "2px solid #aee2ff",
              borderRadius: "8px",
              padding: "6px 12px",
              backgroundColor: "white",
              color: "#333",
             
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0faff")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
          >
            나가기
          </button>
        </div>
      {showMicNotice && (
        <div style={{ fontSize: "18px" }}>
          <span style={{ color: "black", fontWeight: "500" }}>마이크가 안되시나요? </span>
          <Link
            href="#"
            style={{ color: "#80cfff", textDecoration: "underline", fontWeight: "500" }}
          >
            채팅으로 말하기 &gt;
          </Link>
        </div>
      )}
    </div>
  );
}
