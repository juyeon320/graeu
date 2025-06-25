"use client";
import MainTopBar from "@/component/MainTopBar";
import GraphDemoPage from "../component/GraphDemoPage";
import Modal from "@/component/modal";

import "../styles/globals.css";
import { useEffect, useState } from "react";

export default function ExperiencePage() {
  const [currentTab, setCurrentTab] = useState("script");
  const [savedMessages, setSavedMessages] = useState([]);
<<<<<<< HEAD
  //const [isModalOpen, setIsModalOpen] = useState(false);
=======
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
>>>>>>> feature/hazel

  // 저장된 메시지 로드
  useEffect(() => {
    const stored = localStorage.getItem("chatMessages");
    if (stored) {
      const parsedMessages = JSON.parse(stored);
      console.log("💾 localStorage에서 불러온 메시지:", parsedMessages);
      setSavedMessages(parsedMessages);
    }
  }, []);
<<<<<<< HEAD
  
  const [analysisResult, setAnalysisResult] = useState(null);

    /*useEffect(() => {
      const fetchAnalysisResult = async () => {
        try {
          const response = await fetch("/api/analysis"); // ← 실제 API 주소로 바꿔
          //const response = await fetch("/api/dummy");
          if (!response.ok) throw new Error("불러오기 실패");
=======

  // 분석 결과 가져오기 - savedMessages가 있을 때만 실행
  useEffect(() => {
    const fetchAnalysisResult = async () => {
      if (!savedMessages || savedMessages.length === 0) {
        console.log("⚠️ 저장된 메시지가 없습니다.");
        return;
      }
>>>>>>> feature/hazel

      try {
        setIsLoading(true);
        console.log("🔍 분석 요청 시작...");
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: savedMessages }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

<<<<<<< HEAD
      fetchAnalysisResult();
    }, []);*/
    useEffect(() => {
      const fetchAnalysisResult = async () => {
        try {
          if (!savedMessages || savedMessages.length === 0) return;
    
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: savedMessages }),
          });
    
          if (!response.ok) throw new Error("불러오기 실패");
    
          const data = await response.json();
          setAnalysisResult(JSON.parse(data.analysis)); // ✅ 여기에 분석 결과 저장
        } catch (error) {
          console.error("❌ 분석 결과 불러오기 실패:", error);
        }
      };
    
      fetchAnalysisResult();
    }, [savedMessages]); // ✅ savedMessages가 생기면 분석 요청!
    
=======
        const data = await response.json();
        console.log("📦 분석 API 응답:", data);
>>>>>>> feature/hazel

        let parsed = data.analysis;

        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch (parseError) {
            console.error("❌ JSON 파싱 실패:", parseError);
            parsed = null;
          }
        }

        console.log("✅ 최종 분석 결과:", parsed);
        setAnalysisResult(parsed);
      } catch (error) {
        console.error("❌ 분석 실패:", error);

        const defaultAnalysis = {
          "감정 분포": {
            "슬픔": "25%",
            "불안": "30%",
            "분노": "20%",
            "무력감": "25%"
          },
          "부정 단어 사용률": "30%",
          "주요 키워드": {
            "대화": "1회",
            "상담": "1회"
          },
          "심리 불안 지수": 50,
          "대화 집중도": 70,
          "상담 필요도 등급": "주기적 관찰",
          "상담사용 요약문": "분석 처리 중 오류가 발생했습니다."
        };
        setAnalysisResult(defaultAnalysis);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysisResult();
  }, [savedMessages]);

  return (
    <div className="w-screen flex justify-center bg-white" style={{ paddingTop: "220px", font: "font-seoul" }}>
      <MainTopBar showMicNotice={false} />

      {/* 탭 메뉴 */}
      <div
        style={{
          position: "absolute",
          top: "170px",
          right: "18px",
          zIndex: 50,
        }}
        className="flex gap-2 items-end"
      >
        {["script", "word", "summary"].map((tab) => (
          <div key={tab} className="relative">
            {currentTab === tab && (
              <img
                src="/images/cloud.png"
                alt="cloud"
                className="absolute bottom-full mb-1"
                style={{ top: "-110%", right: "30%", width: "50px", height: "50px" }}
              />
            )}
            <button
              onClick={() => setCurrentTab(tab)}
              className="px-6 py-2 rounded-lg font-seoul"
              style={{
                backgroundColor: currentTab === tab ? "#91D3F0" : "#ffffff",
                color: currentTab === tab ? "#ffffff" : "#91D3F0",
                border: "1.5px solid #9FDDFF",
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

      {/* 콘텐츠 영역 */}
      <div className="w-full flex justify-center bg-white px-6" style={{ paddingTop: "30px" }}>
        <div
          className="w-full max-w-none min-h-[500px] p-4"
          style={{
            border: currentTab === "word" ? "none" : "2px solid #bae6fd",
            borderRadius: currentTab === "word" ? "0px" : "12px",
          }}
        >
          {currentTab === "script" && (
            <div
              className="px-2 font-seoul"
              style={{
                maxHeight: "60vh",
                overflowY: "auto",
                paddingRight: "8px",
                scrollbarWidth: "thin",
                scrollbarColor: "#9FDDFF rgb(255, 255, 255)",
              }}
            >
              {savedMessages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} gap-3 mb-6`}>
                    {!isUser && (
                      <img
                        src="/images/cloud.png"
                        alt="GPT cloud"
                        className="w-[60px] h-[60px] rounded-full object-cover mt-1"
                      />
                    )}
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
                  </div>
                );
              })}
              <div className="text-center text-gray-500 text-sm mt-2">
                여기서 대화가 종료되었어요.
              </div>
            </div>
          )}

          {currentTab === "word" && analysisResult && (
            <div className="px-0 font-seoul">
              <div className="flex flex-row gap-6">
                <div className="flex-1 min-h-[500px] border-2 rounded-lg relative" style={{ borderColor: "#9FDDFF" }}>
                  <div className="relative w-full h-full p-4">
                    {Object.entries(analysisResult["주요 키워드"]).map(([text, countStr], idx) => {
                      const count = parseInt(countStr.replace("회", ""));
                      const fontSize = Math.min(6, Math.max(1, Math.floor(count))) + 1;
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

                <div
                  style={{
                    width: "400px",
                    marginLeft: "auto",
                    borderWidth: "2px",
                    borderColor: "#9FDDFF",
                    font: "font-seoul",
                  }}
                  className="rounded-lg p-8 space-y-4 min-h-[500px]"
                >
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
          )}

          {currentTab === "summary" && analysisResult && (
            <div className="w-full px-0 font-seoul">
              <GraphDemoPage analysisResult={analysisResult} />
            </div>
<<<<<<< HEAD
            
        )}

=======
          )}
        </div>
>>>>>>> feature/hazel
      </div>
    </div>
  );
}
