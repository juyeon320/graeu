import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { messages } = await req.json();
    console.log("🎯 전달된 messages:", messages);

    // 시스템 role → assistant로 변환
    const normalizedMessages = messages.map((m) => ({
      role: m.role === "system" ? "assistant" : m.role,
      content: m.content,
    }));

    const analysisPrompt = `
당신은 학생의 감정과 심리 상태를 분석하는 전문 AI입니다.

다음은 학생과 AI 상담사 간의 대화입니다.
- '학생:'은 사용자의 말입니다.
- 'AI:'는 상담사의 응답입니다.

${normalizedMessages
  .map((m) => `${m.role === "user" ? "학생" : "AI"}: ${m.content}`)
  .join("\n")}

이 대화를 바탕으로 학생의 심리 상태를 다음과 같은 JSON 형식으로 정리해 주세요.
다른 설명 없이 반드시 아래 형식만 응답하세요.

{
  "감정 분포": {
    "슬픔": "00%",
    "불안": "00%",
    "분노": "00%",
    "무력감": "00%"
  },
  "부정 단어 사용률": "00%",
  "주요 키워드": {
    "예시1": "N회",
    "예시2": "N회"
  },
  "심리 불안 지수": 00,
  "대화 집중도": 00,
  "상담 필요도 등급": "일시적 불안 / 주기적 관찰 / 즉각적 개입",
  "상담사용 요약문": "전체 대화를 요약해 상담자가 참고할 수 있도록 정리"
}
    `;

    const gptResult = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      temperature: 0.3,
    });

    const analysis = gptResult.choices[0].message.content;
    console.log("✅ 분석 결과 원본:", analysis);

    // GPT 응답 JSON 파싱
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysis);
    } catch (parseError) {
      console.error("❌ JSON 파싱 실패:", parseError);
      // 실패 시 기본값 사용
      parsedAnalysis = {
        "감정 분포": {
          "슬픔": "25%",
          "불안": "35%",
          "분노": "15%",
          "무력감": "25%",
        },
        "부정 단어 사용률": "30%",
        "주요 키워드": {
          "거리감": "1회",
          "외로움": "1회",
          "잘못": "1회",
        },
        "심리 불안 지수": 50,
        "대화 집중도": 70,
        "상담 필요도 등급": "주기적 관찰",
        "상담사용 요약문": "학생은 친구 관계에 대한 거리감과 자책감 등을 호소하고 있습니다. 감정 표현이 분명하며, 상담사의 경청이 지속적으로 필요해 보입니다.",
      };
    }

    return NextResponse.json({ analysis: parsedAnalysis });
  } catch (error) {
    console.error("❌ 분석 API 오류:", error);

    // 오류 발생 시 예비 응답
    const defaultAnalysis = {
      "감정 분포": {
        "슬픔": "20%",
        "불안": "30%",
        "분노": "20%",
        "무력감": "30%",
      },
      "부정 단어 사용률": "25%",
      "주요 키워드": {
        "기본": "1회",
      },
      "심리 불안 지수": 40,
      "대화 집중도": 60,
      "상담 필요도 등급": "주기적 관찰",
      "상담사용 요약문": "분석 중 오류가 발생했습니다. 다시 시도해주세요.",
    };

    return NextResponse.json({ analysis: defaultAnalysis });
  }
}
