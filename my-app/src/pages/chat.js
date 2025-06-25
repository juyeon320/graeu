"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import "../styles/globals.css"; 
//import Footer from "@/component/footer";
//import Title from "@/component/Title"; 
import MainTopBar from "@/component/MainTopBar";


export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");

  const MAX_RECORDS = 3; // 최대 녹음 횟수 설정
  const [messages, setMessages] = useState([]);
  const [recordCount, setRecordCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null);
  const [isConversationEnded, setIsConversationEnded] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0); // 녹음 남은 시간 표시
  const [showTooltip, setShowTooltip] = useState(false); // 버튼 도움말 표시
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRecordingIndicator, setShowRecordingIndicator] = useState(false); // 녹음 중 표시기
  
  const chatContainerRef = useRef(null); // 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  

  // 녹음 시작 (4초 후 자동 중지)
  const startRecording = async () => {
    if (isRecording || isPlaying || recordCount >= MAX_RECORDS) return;

    console.log(`🎤 녹음 시작! 현재 녹음 횟수: ${recordCount}/${MAX_RECORDS}`);
    audioChunksRef.current = [];
    setAudioSrc(null);
    setRemainingTime(4); // 4초로 설정
    setShowRecordingIndicator(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("⏹️ 자동 녹음 중지됨! 데이터 크기:", audioChunksRef.current.length);
        setRecordCount(prev => prev + 1);
        setShowRecordingIndicator(false);
        await handleTranscribeAndAskGPT(audioChunksRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // 4초 카운트다운 타이머
      const countdownTimer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 4초 후 자동으로 중지
      setTimeout(() => {
        stopRecording();
        clearInterval(countdownTimer);
      }, 4000);
      
    } catch (error) {
      alert("마이크 권한을 허용해주세요.");
      setShowRecordingIndicator(false);
    }
  };

  // 녹음 중지
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    console.log("⏹️ 녹음 중지 요청됨");
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setShowRecordingIndicator(false);
  };

  // STT + GPT + TTS API 호출
  const handleTranscribeAndAskGPT = async (chunks) => {
    if (chunks.length === 0) return;

    const blob = new Blob(chunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audioFile", blob, "recording.webm");
    formData.append("messages", JSON.stringify(messages));
    formData.append("category", category); 
    formData.append("difficulty", difficulty); 

    try {
      
      const res = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });
      
      
      const data = await res.json();
      console.log("📦 서버 응답 전체 확인:", data);
      const { userText, gptReply, audio, messages: updatedMessages } = data;
      console.log("🎤 유저 입력:", userText);
      console.log("🤖 GPT 응답:", gptReply);
      console.log("🔄 업데이트된 메시지 리스트:", updatedMessages);
      console.log("🧾 handleTranscribeAndAskGPT 호출 후 messages:", messages);
      
      
      //gptReply = data.gptReply;
      
      const newMessages = updatedMessages; // ✅ 여기를 받아서
      const audioBase64 = data.audio;
      
      setMessages(newMessages); // ✅ 여기서 화면에 띄울 messages 최신화
      setAudioSrc(`data:audio/mpeg;base64,${audioBase64}`);
      
      
      if (audio) {
        const audioData = `data:audio/mp3;base64,${audio}`;
        setAudioSrc(audioData);

        // AI 음성 재생 시작
        setIsPlaying(true);

        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play();
            console.log("🔊 AI 음성 재생 시작");
          }
        }, 500);
      }

      // 횟수 초과 후 종료 버튼 표시
      if (recordCount + 1 >= MAX_RECORDS) {
        setIsConversationEnded(true);
      }
      
    } catch (err) {
      // 오류 발생 시 에러 메시지 표시
      setMessages(prev => [...prev.slice(0, -1), { role: "system", content: "오류가 발생했습니다. 다시 시도해 주세요." }]);
      console.error("API 오류:", err);
      alert("오류 발생: " + err.message);
    }
  };

  // AI 음성이 끝난 후, 1초 후 다시 녹음 시작
  useEffect(() => {
    if (!isPlaying && audioSrc) {
      if (recordCount < MAX_RECORDS) {
        console.log("🔁 AI 음성이 끝났으므로 1초 후 다시 녹음 시작!");
        setTimeout(() => {
          startRecording();
        }, 1000);
      }
    }
  }, [isPlaying]);

  const [showStartModal, setShowStartModal] = useState(true);


  

  // "종료" 버튼 클릭 시 경험치 페이지로 이동
  const handleEndConversation = () => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    router.push(`/experience`);
  };
  console.log("🧾 렌더링 시점 messages:", messages);

  return (
    
    <div 
      style={{
        fontFamily: "SeoulHangangM, sans-serif",
        width: "100vw",
        height: "100vh",
        display: "flex",        // 👉 가로로 나란히
        flexDirection: "column",
        backgroundColor: "white",
        overflow: "hidden", // 👉 스크롤바 숨김
        
      }}
    >
      {/* 타이틀 */}
      <div
        style={{
          position: "absolute",
          top: "4vh",
          left: "24px",
          display: "flex",
          alignItems: "center",
        }}
      >
      </div>
      <MainTopBar showMicNotice={true} />
      {showStartModal && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-[#FFFFFF] bg-opacity-30 z-50 flex items-center justify-center"
          onClick={() => setShowStartModal(false)} // 빈 화면 누르면 모달 닫기
        >
          <img
            src="/images/start_modal.png"
            alt="시작 모달"
            style={{
              width: "90%",               // 원하는 너비
              maxWidth: "500px",         // 최대 너비 제한
              height: "auto",
              borderRadius: "20px",
            }}
            onClick={(e) => e.stopPropagation()} // 이미지 클릭 시 모달 안 닫히도록
          />
        </div>
      )}

      
{/* 채팅 박스 */}
<div 
  ref={chatContainerRef}
  className="chat-scroll"
  style={{
    height: "calc(100vh - 300px)", // 120px 헤더 + 100px 버튼 기준
      overflowY: "auto",
      padding: "80px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      scrollbarWidth: "bold",
      scrollbarColor: " #9FDDFF #FFFFFF", // ✅ Firefox 대응
      msOverflowStyle: "auto",
  }}
>
  <div
    style={{
      width: "100%",
      padding: "80px 80px", // 좌우 여백만 적절히
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    }}
  >
    {Array.isArray(messages) ? (
      messages.map((msg, index) => {
        //const isSystemMessage = msg.role === "system" && index === 0;
        //const isGPTResponse = msg.role === "system" && index !== 0;
        const isUserMessage = msg.role === "user";
        //const isGPTResponse = msg.role === "system";
        return (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: isUserMessage ? "flex-end" : "flex-start",
            }}
          >
            
            {!isUserMessage && (
              
            <img
              src="/images/cloud.png"
              alt="구름 프로필"
              style={{
                width: "60px", // ✅ 크기 키움
                height: "60px",
                borderRadius: "50%",
                objectFit: "cover",
                marginRight: "16px", // ✅ 말풍선과 거리 띄움
                marginTop: "4px"
              }}
            />
          )}
          {/* ✅ GPT 채팅 말풍선 */}
            <div
              style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius: "16px",
                backgroundColor: isUserMessage ? "#ffffff" : "#ffffff",
                color: "#333",
                fontSize: "18px",
                whiteSpace: "pre-wrap",
                border: isUserMessage ? "none" : "2px solid #aee2ff",
              }}
            >
              {msg.content}
            </div>
          </div>
        );
      })
    ) : (
      <p style={{ textAlign: "center", color: "red" }}>
        ⚠️ 오류: messages가 배열이 아닙니다. 현재 값: {JSON.stringify(messages)}
      </p>
    )}
  </div>
</div>

      {/* 녹음 중 표시기 */}
      {showRecordingIndicator && (
        <div
          style={{
            position: "absolute",
            bottom: "16vh",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "1rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            //boxShadow: "0 4px 8px rgba(255, 255, 255, 0.3)",
            animation: "pulse 1s infinite"
          }}
        >
          <span style={{ display: "inline-block", width: "12px", height: "12px", backgroundColor: "white", borderRadius: "50%", marginRight: "8px" }}></span>
          녹음 중... {remainingTime}초
        </div>
      )}

      {/* 녹음/종료 버튼 */}
      <div 
        style={{
          position: "absolute",
          bottom: "6vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100px",
          height: "100px",
          cursor: "pointer",
          zIndex: 30,
        }}
        onClick={!isConversationEnded ? startRecording : handleEndConversation}
        onMouseEnter={() => {
          setShowTooltip(true);
          document.body.style.cursor = "pointer";
        }}
        onMouseLeave={() => {
          setShowTooltip(false);
          document.body.style.cursor = "default";
        }}
        >
        <img
          src={isRecording ? "/images/button2.png" : "/images/button1.png"}
          alt="녹음 버튼"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transition: "transform 0.2s ease",
          }}
        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"}
        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
        />
      </div>

      {/* 버튼 도움말 */}
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "25vh",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "0.9rem",
            whiteSpace: "nowrap",
            zIndex: 100,
          }}
        >
          {isConversationEnded ? "대화 종료하기" : "여기를 눌러 말하세요"}
        </div>
      )}
      
      

      {/* 음성 자동 재생 (숨김) */}
      {audioSrc && (
        <audio 
          ref={audioRef} 
          autoPlay 
          controls 
          style={{ position: "absolute", bottom: "10vh", display: "none" }}
          onEnded={() => {
            setIsPlaying(false);
            if (isConversationEnded) {
              localStorage.setItem("chatMessages", JSON.stringify(messages));
              router.push(`/experience`);
            }
          }}
        >
          <source src={audioSrc} type="audio/mp3" />
          브라우저가 오디오 태그를 지원하지 않습니다.
        </audio>
      )}
      {recordCount >= 0 && (
      <button
        onClick={handleEndConversation}
        style={{
          position: "absolute",
          bottom: "6vh",
          right: "5vw",
          backgroundColor: "#9FDDFF",
          color: "white",
          fontWeight: "bold",
          border: "none",
          borderRadius: "12px",
          padding: "14px 24px",
          fontSize: "1.2rem",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          cursor: "pointer",
        }}
      >
        결과 전송하기
      </button>
    )}

      {/* 스타일 - 애니메이션 */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>

      
      
    </div>

    
  );
}