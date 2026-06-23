import { useState } from 'react'

// 이미지 슬라이더 - 좌우 버튼으로 탐색, 탭 시 원본 확대
export default function ImageSlider({ urls }) {
  const [index, setIndex] = useState(0)
  const [enlarged, setEnlarged] = useState(false)

  if (!urls || urls.length === 0) return null

  const prev = () => setIndex(i => (i - 1 + urls.length) % urls.length)
  const next = () => setIndex(i => (i + 1) % urls.length)

  return (
    <>
      {/* 슬라이더 본체 */}
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
        <img
          src={urls[index]}
          alt={`이미지 ${index + 1}`}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setEnlarged(true)}
        />

        {/* 여러 장일 때만 이전/다음 버튼 표시 */}
        {urls.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
            >
              ›
            </button>
            {/* 페이지 인디케이터 */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {urls.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 원본 확대 모달 */}
      {enlarged && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setEnlarged(false)}
        >
          <img
            src={urls[index]}
            alt="확대 이미지"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  )
}
