const STORAGE_KEY = 'clawmap_device_id'

// 기기 고유 ID를 localStorage에서 가져오거나 신규 생성
// 비로그인 사용자 좋아요 중복 방지용, 로그인 후 userId로 대체 예정
export function getDeviceId() {
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}
