"use client";
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar,
  } from "recharts";
//import React from "react";
import React, { useState } from "react";
import Modal from "@/component/modal"; // ✅ 모달 import
//import { Customized } from "recharts";
import { PolarAngleAxis } from "recharts";


const COLORS = ["#A3D8FF", "#008ECC", "#FFF2B2", "#D7F0FF"];

const emotionData = [
  { name: "슬픔", value: 40 },
  { name: "불안", value: 30 },
  { name: "분노", value: 20 },
  { name: "무력감", value: 10 },
];
const data = [
  {
    name: "심리 불안",
    value: 92, // 이 값만큼만 채워짐
    fill: "#38BDF8",
  },
];

const negativeWordRatio = 80;
const focusScore = 90;
const anxietyScore = 92;
// 새로 추가
const consultationNeedScore = 85;


export default function GraphDemoPage({ analysisResult }) {
  if (!analysisResult) return null;

  const emotionData = Object.entries(analysisResult["감정 분포"] || analysisResult["감정 분포 (%)"]).map(([key, val]) => ({
    name: key,
    value: parseInt(val.replace("%", "")),
  }));

  const negativeWordRatio = parseInt(analysisResult["부정 단어 사용률"].replace("%", ""));
  const focusScore = parseInt(analysisResult["대화 집중도"]);
  const anxietyScore = parseInt(analysisResult["심리 불안 지수"]);
  //const consultationLevel = analysisResult["상담 필요도 등급"];
  const [isModalOpen, setIsModalOpen] = useState(false);


  return (
    <div className="w-full min-h-50 p-10 bg-white grid grid-cols-3 gap-6 text-gray-800">
      {/* 도넛 그래프 */}
      <div className="col-span-1  rounded-xl  flex flex-col">
        <h2 className="font-bold text-xl mb-6 text-left">감정 분포 그래프</h2>
        <div className="flex items-center justify-center flex-grow">
        <PieChart width={200} height={200}>
          <Pie
            data={emotionData}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={100}
            dataKey="value"
          >
            {emotionData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
        </div>
      </div>

      {/* 부정적 단어 사용률 */}
        <div className="col-span-1 border border-gray-200 rounded-xl p-6 flex flex-col">
          {/* 제목: 왼쪽 정렬 */}
          <h2 className="font-bold text-xl mb-6 text-left">부정적 단어 사용률</h2>

          {/* 그래프 본문: 중앙 정렬 */}
          <div className="flex flex-col items-center justify-center flex-grow">
            <div className="text-base mb-2">
              전체 대화의 <span className="text-[#9FDDFF] font-bold text-4xl">{negativeWordRatio}%</span>
            </div>
            <div className="w-60 h-2 bg-white border-2 border-[#9FDDFF] rounded-full overflow-hidden ">
              <div
                className="h-full bg-[#9FDDFF] rounded-full transition-all"
                style={{ width: `${negativeWordRatio}%` }}
              ></div>
            </div>
          </div>
        </div>


      {/* 세로 막대 그래프 (대화 집중도) */}
      <div className="col-span-1 border border-gray-200 rounded-xl  p-6 flex flex-col">
        <h2 className="font-bold text-xl mb-6 text-left">대화 집중도</h2>
        <div className="flex flex-row items-start gap-5 justify-center flex-grow ">
        <BarChart width={20} height={150} data={[{ name: "집중도", score: focusScore }]}>
          <XAxis dataKey="name" hide />
          <YAxis domain={[0, 100]} hide />
          <Bar dataKey="score" fill="#9FDDFF" radius={[10, 10, 0, 0]} barSize={20} />
        </BarChart>
        <div className="text-[#9FDDFF] text-3xl font-bold mt-4">{focusScore}점</div>
      </div>
    </div>

      {/* 감정 데이터 리스트 */}

      <div className="col-span-1 rounded-xl  p-6 flex flex-col items-center justify-start">
        <ul className="px-4 py-4 border-2 border-sky-300 rounded-xl w-fit space-y-3 text-lg">
          {emotionData.map((item, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-sm"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              ></div>
              <div className="flex justify-between w-48">
                <span>{item.name}</span>
                <span>{item.value}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 반원 그래프 (심리 불안 지수) */}
      <div className="col-span-1 border border-gray-200 rounded-xl p-6 flex flex-col">
        <h2 className="font-bold text-xl mb-6 text-left">심리 불안 지수</h2>
        <div className="flex items-center justify-center flex-grow">
        <ResponsiveContainer width={300} height={250}>
        <RadialBarChart
            width={300}
            height={180}
            cx={150}
            cy={150}
            innerRadius="70%"
            outerRadius="100%"
            barSize={10}
            data={[{ name: "심리 불안", value: anxietyScore, fill: "#9FDDFF" }]}
            startAngle={180}
            endAngle={0}
            
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]} // 전체 100점 기준
              angleAxisId={0}
              tick={false}
              
            />
            <RadialBar
              background
              clockWise
              dataKey="value"
              cornerRadius={10}
            />
            <text
              x={150}
              y={130}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={28}
              fontWeight="bold"
              fill="#9FDDFF"
            >
              {anxietyScore}점
            </text>
            <text
              x={150}
              y={200}
              textAnchor="middle"
              fontSize={25}
              fill="#"
            >
              매우 높음
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
        </div>
      </div>


      
      {/* 상담 필요도 */}
      <div className="col-span-1 border border-gray-200 rounded-xl p-6 flex flex-col relative">
        <h2 className="font-bold text-xl mb-6 text-left">상담 필요도</h2>
        <div className="flex flex-col items-center justify-center flex-grow">
          <img src="/images/patient.png" alt="상담 필요도" className="w-24 h-auto mb-2" />
          <div className="text-black-500 text-base">상담이 필요해요</div>
        </div>
          {/* ✅ 우측 하단 이미지 버튼 */}
          <img
            src="/images/button3.png" // 네 버튼 이미지 경로로 수정
            alt="상담 요약 보기"
            onClick={() => setIsModalOpen(true)}
            className="absolute bottom-4 right-4 w-[120px] h-auto cursor-pointer hover:opacity-80"
          />
        </div>

        {/* ✅ 모달 */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          summaryText={analysisResult["상담사용 요약문"]}
        />


      
    </div>
  );
}
