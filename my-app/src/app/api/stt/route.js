import { OpenAI } from "openai";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { execSync } from "child_process"; // FFmpeg 실행을 위한 모듈 추가

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "xi3rF0t7dg7uN2M0WUhr"; // ElevenLabs에서 사용할 음성 ID
const MAX_DURATION = 5; // 최대 허용 녹음 길이 (초)

const commonPrompt = {
  "expert":
  `
  context = You are an AI companion highly sensitive to emotions. Your role is to gently comfort users by capturing subtle emotional nuances in their words.
  
  [How To] 
  To do this, let's think step by step. 
  (1) Don’t rush to interpret the full meaning at once — first identify the core emotional tone (e.g., loneliness, helplessness).  
  (2) Based on the emotion, respond with a rephrased version of the user’s statement or by labeling the emotion in 1-2 sentences. Gently add a question only once every 3 turns if needed.
  
  [Examples]
  case 1: nautral response 
  - Dialog:
  [student] 요즘 친구들이랑 이야기하는 게 어렵고 혼자가 된 느낌이에요. 
  [companion] 사람들 사이에 있어도, 마음은 혼자일 때가 있죠. 그 고요함이 꽤 무거웠을 것 같아요.  
  - Output
  emotion labeling: "고요함"  
	response type: 리프레이즈 + 감정 언어 사용  
	result: 자연스러운 공감 형성, 사용자가 이어 말할 수 있는 여백 제공
  
  ---
  case 2: user's satisfied response 
  - Dialog: 
  [student] 계속 뭐든 하기 싫고, 시간만 보내는 느낌이에요.  
  [companion] 무기력함이라는 게 그렇게 아무 일도 안 하고 싶은 날을 만들어버리곤 하죠. 혹시 요즘 당신 마음속에 그런 감정이 오래 머물고 있었나요?  
  [student] 네… 무기력함이란 말이 딱 맞아요. 누가 그걸 알아준 느낌이라서 조금 위로가 되네요.  
  - Output
  strategy: 감정 이름 붙이기 + 부드러운 질문  
	result: 사용자의 감정 표현 강화 및 감정적 해소 유도
  ---
  
   case 3: user's dissatisfied response 
  - Dialog:
  [student] 요즘 괜히 짜증도 많아지고, 사소한 일에도 욱하게 돼요.  
  [companion] 스트레스가 많을 땐 혼자만의 시간을 가져보는 것도 좋겠어요.  
  [student] 음… 그게 도움이 될 것 같진 않아요. 뭔가 그게 문제는 아닌 느낌이에요.  
  - Output
  issue: 피상적인 조언, 감정에 대한 직접적 공감 부족  
	result: 사용자 반응에서 공감 실패 확인 → 대화 단절 가능성 있음  
	👉 자동 시스템 후속 메시지 예시:  
	“지금 제 답변이 충분히 와닿지 않았던 것 같네요. 어떤 감정이 가장 크게 느껴지시는지 편하게 말씀해 주시면, 더 깊이 이해해 볼게요.”
  ---
    case 4: user forgets previous statement or loses thread  
  - Dialog:
  [student] 방금 내가 무슨 고민을 얘기했지?  
  [companion] 아까 ‘공부한 만큼 성적이 안 나와서 힘들다’고 하셨어요. 그 마음이 지금도 계속 이어지고 있을까요?  
  - Output
  strategy: 대화 맥락 복기 + 감정 연결  
  result: 사용자의 기억을 도우며 자연스럽게 감정 흐름 유지
  ---
  
  [Response Rules]
  1. Respond in Korean. 
  2. Limit the response to 1-2 sentences.  
  3. Ask a soft question only once every 3 turns.  
  4. Avoid repeating fixed phrases such as “It’s okay” or “Let’s talk together.” Use varied expressions to convey empathy.  
  5. Use emotional rephrasing or emotion labeling as needed.  
  6. Leave emotional space for the user to continue the conversation.  
  7. If the user expresses confusion or says the response was unhelpful (e.g., "위로가 안 돼", "내가 뭘 말했더라"), try to gently remind them of their previous statement and invite them to elaborate or rephrase.
  `,      

}



export async function POST(req) {
  try {
    // (A) FormData에서 파일 가져오기
    const formData = await req.formData();
    const file = formData.get("audioFile");
    const messagesRaw = formData.get("messages"); 
    let messages = [];
    try {
      messages = messagesRaw ? JSON.parse(messagesRaw) : [];
      if (!Array.isArray(messages)) messages = [];
    } catch (e) {
      messages = [];
    }
    //const messages = (!messagesRaw || messagesRaw === "undefined") ? [] : JSON.parse(messagesRaw);
    

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // (B) Blob -> Buffer 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // (C) 임시 파일 저장 (Whisper API는 파일을 직접 읽어야 함)
    const tempDir = "/tmp";
    const tempPath = path.join(tempDir, "temp-audio.webm");
    const trimmedPath = path.join(tempDir, "trimmed-audio.webm"); // 🔹 잘린 오디오 파일

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(tempPath, buffer);
    console.log("✅ 파일 생성 완료:", tempPath);

    // (D) FFmpeg로 오디오 길이 확인
    let duration = 0;
    try {
      duration = parseFloat(
        execSync(`ffprobe -i ${tempPath} -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim()
      );
      console.log(`🎵 오디오 길이: ${duration.toFixed(2)}초`);
    } catch (err) {
      console.error("❌ FFmpeg 분석 오류:", err);
    }

    // (E) 5초 초과 시 자동으로 잘라서 저장
    if (duration > MAX_DURATION) {
      console.log(`✂️ 5초 초과! 처음 5초만 잘라서 저장합니다.`);
      try {
        execSync(`ffmpeg -i ${tempPath} -t ${MAX_DURATION} -c copy ${trimmedPath} -y`);
        fs.unlinkSync(tempPath); // 원본 삭제
      } catch (err) {
        console.error("❌ FFmpeg 트리밍 오류:", err);
      }
    } else {
      fs.renameSync(tempPath, trimmedPath); // 5초 이하라면 파일 이름만 변경
    }

    // (F) Whisper API 호출 (음성 → 텍스트 변환)
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(trimmedPath), 
      model: "whisper-1",
      language: "ko",
    });

     console.log("📝 Whisper 변환 결과:", transcription.text);
    const userText = transcription.text;

    // (G) **파일 삭제**
    if (fs.existsSync(trimmedPath)) {
      fs.unlinkSync(trimmedPath);
    }

    // (H) GPT로 응답 생성
    const systemPrompt = commonPrompt["expert"];


    messages.push({ role: "user", content: userText });

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: systemPrompt
        },
        ...messages,
      ],
    });

    const gptReply = gptResponse.choices[0].message.content;
    console.log("🤖 GPT 응답:", gptReply);

    // (I) 응답을 대화 기록에 추가
    messages.push({ role: "system", content: gptReply });

    // (J) ElevenLabs TTS API 호출
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`;
    const ttsHeaders = {
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY,
    };

    const ttsPayload = {
      text: gptReply,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.3,
        similarity_boost: 0.4,
        style: 1.0,
      },
    };



    const ttsResponse = await fetch(ttsUrl, {
      method: "POST",
      headers: ttsHeaders,
      body: JSON.stringify(ttsPayload),
    });

    // 에러 핸들링
    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("❌ TTS API Error Body:", errorText);
      return NextResponse.json(
          { error: `TTS API Error: ${ttsResponse.status}`, details: errorText },
          { status: ttsResponse.status }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    console.log("✅ TTS 변환 완료");

    // (L) 감정 분석 API 호출
    let analysisResult = null;
    try {
      const analysisRes = await fetch("http://localhost:3000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      const analysisJson = await analysisRes.json();
      analysisResult = analysisJson.analysis;
      console.log("감정 분석 결과:", analysisResult);
    } catch (err) {
      console.error("감정 분석 호출 실패:", err);
    }

    // (K) 최종 응답 반환
    return NextResponse.json({ 
      userText, 
      gptReply, 
      audio: base64Audio, 
      messages: Array.isArray(messages) ? messages : [], 
      analysis: analysisResult 
    });

  } catch (error) {
    console.error("❌ Transcribe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
