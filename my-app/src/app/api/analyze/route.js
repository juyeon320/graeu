import { OpenAI } from "openai"; //여니추가 
import { NextResponse } from "next/server"; // ✅ 이거 꼭 필요

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}); // 여니추가 



export async function POST(req) {
    const { messages } = await req.json();
  
    const analysisPrompt = `
      당신은 학생 감정 분석 전문 AI입니다.
      아래는 한 학생과 AI의 전체 대화입니다:
  
      ${messages.map(m => `${m.role === "user" ? "학생" : "AI"}: ${m.content}`).join("\n")}
  
      위 대화를 기반으로 다음 항목들을 분석해 주세요.
      결과는 JSON으로 출력합니다.
      1. 감정 분포 (%)
      - 감정 범주 : 슬픔, 불안 분노, 무력감
      - 각 감정이 얼마나 자주 나타나는지 백분율로 표시 
      2. 부정 단어 사용률 (%)
      - 전체 발화 중 부정적인 키워드의 비율  
      - 예: "죽고 싶다", "싫다", "불안하다" 등의 단어 
      3. 대화에서 많이 사용된 주요 키워드 
      - 자주 사용하는 단어와 빈도 (예: "죽고 싶어": 6회)
      4. 심리 불안 지수 (0~100)
      - 감정 강도, 반복 빈도, 단어 수위 등을 기반으로 점수화 
      - 예: 0=낮음, 90>=매우 높음
      5. 대화 집중도 (0~100)
      - 감정 표현의 다양성, 대화 길이, 몰입 정도 기준 
      6. 상담 필요도 등급 
      - "낮음 / 주기적 관찰 / 즉시 상담 필요" 중 하나 
      7. 상담사용 요약문 (300자 이내)
      - 학생의 감정 상태를 상담사가 빠르게 이해할 수 있도록 핵심 내용 요약 
  
      
    `;
  
    const gptResult = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
            role: "user", 
            content: analysisPrompt }
      ]
    });
  
    const analysis = gptResult.choices[0].message.content;
    return NextResponse.json({ analysis });
  }
  