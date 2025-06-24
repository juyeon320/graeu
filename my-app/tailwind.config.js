/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",  // ✅ Next.js App Router 사용 시
    "./src/component/**/*.{js,ts,jsx,tsx}",  // ✅ 컴포넌트 폴더 적용
    "./src/styles/**/*.{css}",  // ✅ Tailwind CSS 파일 적용
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      fontFamily: {
        hakgyo: ["HakgyoansimDunggeunmisoTTF-B", "sans-serif"], // 폰트 설정
        seoul: ['SeoulHangangM', 'sans-serif'], // ✅ 추가
      },
  },
},
  plugins: [],
};
