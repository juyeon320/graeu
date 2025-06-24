"use client";
import MainTopBar from "@/component/MainTopBar";
import GraphDemoPage from "../component/GraphDemoPage"; // ✅ 추가
import Modal from "@/component/modal"; // ✅ 모달 import

import "../styles/globals.css";
//import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ExperiencePage() {
  const [currentTab, setCurrentTab] = useState("script");
  const [savedMessages, setSavedMessages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("chatMessages");
    if (stored) {
      setSavedMessages(JSON.parse(stored));
    }
  }, []);
  const [analysisResult, setAnalysisResult] = useState(null);

    useEffect(() => {
      const fetchAnalysisResult = async () => {
        try {
          //const response = await fetch("/api/analysis"); // ← 실제 API 주소로 바꿔
          const response = await fetch("/api/dummy");
          if (!response.ok) throw new Error("불러오기 실패");

          const data = await response.json();
          setAnalysisResult(data);
        } catch (error) {
          console.error("❌ 분석 결과 불러오기 실패:", error);
        }
      };

      fetchAnalysisResult();
    }, []);





  return (
    <div className="w-screen flex justify-center bg-white" style={{ paddingTop: "220px", font: "font-seoul" }}>

      {/* ✅ MainTopBar */}
      <MainTopBar showMicNotice={false} />

      {/* 오른쪽 상단에 수동 배치된 구름 + 탭 버튼 메뉴 */}
        <div
        style={{
            position: "absolute",
            top: "170px",      // 원하는 Y 위치로 조정
            right: "18px",     // 원하는 X 위치로 조정
            zIndex: 50,
        }}
        className="flex gap-2 items-end"
        >
       

        {/* 탭 버튼들 */}
        {["script", "word", "summary"].map((tab) => (
            <div key={tab} className="relative">
            {/* 구름 아이콘 - 현재 탭일 때만 표시 */}
            {currentTab === tab && (
              <img
              src="/images/cloud.png"
              alt="cloud"
              className="absolute bottom-full mb-1"
              style={{ top: "-110%", right: "30%", width: "50px", height: "50px" }}  // 명확하게 크기 지정
            />
            )}
      
            <button
            
            onClick={() => setCurrentTab(tab)}
            className="px-6 py-2 rounded-lg font-seoul"
            style={{
                backgroundColor: currentTab === tab ? "#91D3F0" : "#ffffff",
                color: currentTab === tab ? "#ffffff" : "#91D3F0",
                border: "1.5px solid #9FDDFF",
                font : "font-seoul",
                fontSize: "16px",
                fontWeight: "600",
            }}
            >
            {tab === "script" && "대화 스크립트"}
            {tab === "word" && "워드 클라우드"}
            {tab === "summary" && "수치 요약"}
            </button>
            </div>
        ))}
        </div>


      {/* ✅ 콘텐츠 영역 */}
      <div className="w-full flex justify-center bg-white px-6" style={{ paddingTop: "30px" }}>
      <div
            className="w-full max-w-none min-h-[500px] p-4"
            style={{
                border: currentTab === "word" ? "none" : "2px solid #bae6fd", // ✅ sky-200
                borderRadius: currentTab === "word" ? "0px" : "12px", // ✅ 둥근 모서리 유지
            }}
        >

        {currentTab === "script" && (
          <div
            className="px-2 font-seoul"
            style={{
                maxHeight: "60vh", // ✅ 필요한 만큼 조절 가능
                overflowY: "auto", // ✅ 세로 스크롤 활성화
                paddingRight: "8px", // ✅ 스크롤바가 글자에 안 겹치게
                scrollbarWidth: "thin", // Firefox용
                scrollbarColor: "#9FDDFF rgb(255, 255, 255)", // Firefox용: thumb color + track color
              }}
          >
            {/* 대화 내용 */}
            {savedMessages.map((msg, idx) => {
            const isUser = msg.role === "user";

            return (
                <div
                key={idx}
                className={`flex ${isUser ? "justify-end" : "justify-start"} gap-3 mb-6`}
                >
                {/* GPT 응답일 때만 구름 아이콘 왼쪽에 표시 */}
                {!isUser && (
                    <img
                    src="/images/cloud.png"
                    alt="GPT cloud"
                    className="w-[60px] h-[60px] rounded-full object-cover mt-1"
                    />
                )}

                {/* 말풍선 */}
                <div
                    className="px-6 py-4 rounded-2xl leading-relaxed max-w-2xl text-[18px]"
                    style={{
                    backgroundColor: isUser ? "rgb(223, 242, 255)" : "#ffffff",
                    border: isUser ? "1.5px solid rgb(255, 255, 255)" : "1.5px solid #aee2ff",
                    color: "#333333",
                    }}
                >
                    {msg.content}
                </div>

                {/* 사용자 말일 때는 오른쪽에 구름 넣고 싶으면 여기에! */}
                </div>
            );
            })}
            <div className="text-center text-gray-500 text-sm mt-2">
              여기서 대화가 종료되었어요.
            </div>
          </div>
        )}

      {currentTab === "word" && analysisResult && (
        <div className="px-0 font-seoul"> {/* ✅ 바깥 테두리 제거하고 여백만 유지 */}
            <div className="flex flex-row gap-6">

            {/* 왼쪽: 워드 클라우드 박스 */}
            <div className="flex-1 min-h-[500px] border-2 rounded-lg relative" style={{ borderColor: "#9FDDFF" }}>
                <div className="relative w-full h-full p-4">
                {Object.entries(analysisResult["주요 키워드"]).map(([text, countStr], idx) => {
                  const count = parseInt(countStr.replace("회", ""));
                  const fontSize = Math.min(6, Math.max(1, Math.floor(count))) + 1; // 2 ~ 7 사이 text-xl~6xl
                  const top = Math.floor(Math.random() * 80) + "%";
                  const left = Math.floor(Math.random() * 80) + "%";

                  return (
                    <div
                      key={idx}
                      className={`absolute text-${fontSize}xl font-semibold text-sky-600`}
                      style={{ top, left }}
                    >
                      {text}
                    </div>
                  );
                })}
                </div>
            </div>

            {/* 오른쪽: 키워드 리스트 박스 */}
                <div
                style={{
                    width: "400px",
                    marginLeft: "auto",
                    marginRight: "0px",
                    borderWidth: "2px",
                    borderColor: "#9FDDFF",
                    font: "font-seoul",
                }}
                className="rounded-lg p-8 space-y-4 min-h-[500px]"
                >
                {/* 기존 박스 */}
                <div>
                    <h2 className="font-bold text-2xl mb-12 text-center text-gray-700">
                        대화 중 가장 많이 사용된 키워드
                    </h2>
                    <ul className="text-xl space-y-5">
                    {Object.entries(analysisResult["주요 키워드"]).map(([word, count], idx) => (
                      <li key={idx} className="flex">
                        <span className="flex-1 text-left">{word}</span>
                        <span className="text-right w-[40px]">{count}</span>
                      </li>
                    ))}
                  </ul>

                </div>

               
                </div>

            </div>
        </div>
        )}



                
        {currentTab === "summary" && analysisResult && (
            <div className="w-full px-0 font-seoul">
              <GraphDemoPage analysisResult={analysisResult} />
            </div>
            
        )}
      </div>
    </div>
    </div>
  );
}
