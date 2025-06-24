import Image from "next/image";

export default function Modal({ isOpen, onClose, summaryText }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="relative w-[400px] h-[600px] flex items-center justify-center">
        {/* 배경 이미지 */}
        <Image
          src="/images/summary.png"
          alt="상담 요약"
          fill
          objectFit="contain"
          className="rounded-lg"
        />

        {/* ✅ 닫기용 버튼 이미지 (모달 하단 중앙) */}
        <Image
          src="/images/button4.png" // ✅ 만든 버튼 이미지 경로로 교체
          alt="닫기 버튼"
          width={90}
          height={30}
          onClick={onClose}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 cursor-pointer hover:opacity-80"
        />
        {/* 텍스트 영역 */}
        <div className="absolute top-[200px] left-[70px] right-[60px] bottom-[60px] overflow-y-auto text-black font-seoul text-base leading-relaxed whitespace-pre-wrap">
          {summaryText}
        </div>
      </div>
    </div>
  );
}
