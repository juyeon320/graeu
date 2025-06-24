"use client";
import MainTopBar from "@/component/MainTopBar"; // 실제 위치에 맞게 경로 조정
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Title from "@/component/Title";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Animation effect when page loads
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative">

      {/* 🔹 상단 헤더 컴포넌트 */}
      <MainTopBar />

      {/* 로고 */}
      {/* 🔹 타이틀 */}
      <div className={`text-center transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <Title>어떤 고민이 있으신가요?</Title>
        <p className="text-lg text-black mt-2 flex items-center justify-center gap-2 font-seoul">
          아래 버튼을 눌러 
          <Image 
            src="/images/logo-text.png" 
            alt="그래유 로고"
            width={80} // 적절히 조정 가능
            height={30} 
            className="inline-block align-middle"
          /> 
          와 대화를 시작해보세요 !
        </p>
      </div>


      <div
        onClick={() => router.push("/chat")}
        style={{
          position: "absolute",
          bottom: "6vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: "150px",
          height: "150px",
          backgroundColor: "#9FDDFF",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "transform 0.2s ease",
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = "translateX(-50%) scale(0.95)"}
        onMouseUp={(e) => e.currentTarget.style.transform = "translateX(-50%) scale(1)"}
      >
        {/* ▶ 아이콘 */}
        <div style={{
         width: 0,
         height: 0,
         borderTop: "27px solid transparent",     // ⬆️ 높이 증가
         borderBottom: "27px solid transparent",
         borderLeft: "36px solid white",          // ⬅️ 넓이 증가
         marginLeft: "9px",  
        }} />
      </div>
      </div>
    );
  }
