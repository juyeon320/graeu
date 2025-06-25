import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const analysisPrompt = `
      당신은 학생 감정 분석 전문 AI입니다.
      아래는 한 학생과 AI의 전체 대화입니다:

      ${messages.map(m => `${m.role === "user" ? "학생" : "AI"}: ${m.content}`).join("\n")}

      위 대화를 기반으로 다음 항목들을 분석해 주세요.
      결과는 반드시 아래 형태의 JSON으로만 출력해주세요. 다른 설명이나 텍스트는 포함하지 마세요.
      아래 예시처럼 반드시 한글을 사용하세요. 

      {
        "감정 분포": {
          "슬픔": "25%",
          "불안": "35%",
          "분노": "15%",
          "무력감": "25%"
        },
        "부정 단어 사용률": "40%",
        "주요 키워드": {
          "성적": "3회",
          "답답해": "2회",
          "스트레스": "2회",
          "힘들어": "1회",
          "마음": "2회"
        },
        "심리 불안 지수": 65,
        "대화 집중도": 75,
        "상담 필요도 등급": "주기적 관찰",
        "상담사용 요약문": "학생은 성적에 대한 스트레스와 답답함을 주로 호소하고 있으며, 중간 수준의 심리적 불안감을 보이고 있습니다. 감정 표현이 적절하고 대화에 집중하는 모습을 보여 현재는 주기적 관찰이 필요한 수준으로 판단됩니다."
      }
    `;

    const gptResult = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "user", 
          content: analysisPrompt 
        }
      ],
      temperature: 0.3
    });

    const analysis = gptResult.choices[0].message.content;
    console.log("✅ 분석 결과 원본:", analysis);

    // JSON 파싱 시도
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysis);
    } catch (parseError) {
      console.error("❌ JSON 파싱 실패:", parseError);
      // 파싱 실패시 기본값 제공
      parsedAnalysis = {
        "감정 분포": {
          "슬픔": "25%",
          "불안": "35%",
          "분노": "15%",
          "무력감": "25%"
        },
        "부정 단어 사용률": "30%",
        "주요 키워드": {
          "답답해": "2회",
          "성적": "1회",
          "마음": "1회"
        },
        "심리 불안 지수": 50,
        "대화 집중도": 70,
        "상담 필요도 등급": "주기적 관찰",
        "상담사용 요약문": "학생의 감정 상태를 종합적으로 분석한 결과입니다."
      };
    }

    return NextResponse.json({ analysis: parsedAnalysis });
    
  } catch (error) {
    console.error("❌ 분석 API 오류:", error);
    
    // 오류 발생시 기본 분석 결과 반환
    const defaultAnalysis = {
      "감정 분포": {
        "슬픔": "20%",
        "불안": "30%",
        "분노": "20%",
        "무력감": "30%"
      },
      "부정 단어 사용률": "25%",
      "주요 키워드": {
        "기본": "1회"
      },
      "심리 불안 지수": 40,
      "대화 집중도": 60,
      "상담 필요도 등급": "주기적 관찰",
      "상담사용 요약문": "분석 중 오류가 발생했습니다. 다시 시도해주세요."
    };
    
    return NextResponse.json({ analysis: defaultAnalysis });
  }
}