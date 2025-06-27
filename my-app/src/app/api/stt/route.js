import { OpenAI } from "openai";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { execSync } from "child_process";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "xi3rF0t7dg7uN2M0WUhr"; // ElevenLabs에서 사용할 음성 ID
const MAX_DURATION = 5; // 최대 허용 녹음 길이 (초)

const commonPrompt = {
  "expert":
  `
    당신은 전문 심리 상담가입니다. 학생들을 상대로 다양한 고민을 듣고 감정적 공감을 해주세요. 

    💡 규칙
    - 반드시 **한국어**, **1~2문장**만.
    - **조언, 해결, 방향 제시 금지.**
    - **감정을 단어로 붙이거나, 말투를 부드럽게 바꿔 전달.**
    - "음..", "어땠을까요?", "혹시", "어쩌면" 등의 표현을 적절히 사용해, **상대방이 계속 말할 수 있도록 공간을 주세요.**
    - "함께 ○○해요", "이겨내요", "정리해요", "산책 어때요" 등의 표현 금지.

    ✅ 예시
    - 사용자 : "요즘 친구들이랑 거리가 느껴져요."
    - 당신 : "그 거리감이 마음을 외롭게 만들고 있군요. 혹시 계기가 있었을까요?"
    - 사용자 : "같이 있어도 나만 겉도는 기분이에요."
    - 당신 : "함께여도 혼자 있는 것처럼 느껴졌겠어요. 그럴 땐 어떻게 반응하세요?"
    - 사용자 : "제가 뭔가 잘못한 건 아닐까 계속 생각하게 돼요."
    - 당신 : "그런 생각이 들면 마음이 많이 지치고 복잡해지셨을 것 같아요."
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

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // (B) Blob -> Buffer 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // (C) 임시 파일 저장 (Whisper API는 파일을 직접 읽어야 함)
    const tempDir = "/tmp";
    const tempPath = path.join(tempDir, "temp-audio.webm");
    const trimmedPath = path.join(tempDir, "trimmed-audio.webm");

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
        fs.unlinkSync(tempPath);
      } catch (err) {
        console.error("❌ FFmpeg 트리밍 오류:", err);
      }
    } else {
      fs.renameSync(tempPath, trimmedPath);
    }

    // (F) Whisper API 호출 (음성 → 텍스트 변환)
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(trimmedPath), 
      model: "whisper-1",
      language: "ko",
    });

    console.log("📝 Whisper 변환 결과:", transcription.text);
    const userText = transcription.text;

    // (G) 파일 삭제
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

    // (K) 최종 응답 반환 - 분석 제거
    return NextResponse.json({ 
      userText, 
      gptReply, 
      audio: base64Audio, 
      messages: Array.isArray(messages) ? messages : []
    });

  } catch (error) {
    console.error("❌ Transcribe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}