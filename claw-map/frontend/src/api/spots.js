import axios from 'axios'
import { getDeviceId } from '../utils/deviceId'

// 모든 요청에 X-Device-Id 헤더 자동 포함
export const api = axios.create({
  baseURL: '/api',
  headers: { 'X-Device-Id': getDeviceId() },
})

// 동시에 여러 요청이 401을 받을 때 refresh를 한 번만 호출하기 위한 큐
let isRefreshing = false
let failedQueue = []

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve())
  failedQueue = []
}

// 401 발생 시 refresh 후 원본 요청 재시도
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    // refresh 엔드포인트 자체는 인터셉터 제외 (무한루프 방지)
    if (err.response?.status !== 401 || original._retry || original.url?.includes('/auth/refresh')) {
      return Promise.reject(err)
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(() => api(original)).catch(() => Promise.reject(err))
    }
    original._retry = true
    isRefreshing = true
    try {
      await axios.post('/api/auth/refresh') // plain axios로 호출해 인터셉터 루프 방지
      processQueue(null)
      return api(original)
    } catch (e) {
      processQueue(e)
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)

// ── 스팟 ──────────────────────────────────────────────
export const getSpots       = (bounds) => api.get('/spots', { params: bounds })
export const getSpotRanking = (bounds) => api.get('/spots/ranking', { params: bounds })
export const getNearbySpots = (lat, lng, radius) => api.get('/spots/nearby', { params: { lat, lng, radius } })
export const getSpot        = (id)    => api.get(`/spots/${id}`)
export const createSpot     = (data)  => api.post('/spots', data)
export const toggleSpotLike = (id)   => api.post(`/spots/${id}/like`)
export const getSpotGallery = (id)   => api.get(`/spots/${id}/gallery`)
export const getSpotTags    = (id)   => api.get(`/spots/${id}/tags`)
export const addSpotTag     = (id, tag)    => api.post(`/spots/${id}/tags`, { tag })
export const deleteSpotTag  = (id, tagId) => api.delete(`/spots/${id}/tags/${tagId}`)

// ── 리뷰 ──────────────────────────────────────────────
export const getReviews    = (spotId)        => api.get(`/spots/${spotId}/reviews`)
export const createReview  = (spotId, data)  => api.post(`/spots/${spotId}/reviews`, data)
export const deleteReview  = (spotId, id)    => api.delete(`/spots/${spotId}/reviews/${id}`)
export const toggleReviewLike = (id)         => api.post(`/reviews/${id}/like`)

// ── 마이페이지 ────────────────────────────────────────
export const getMySpots    = () => api.get('/users/me/spots')
export const getMyLikes    = () => api.get('/users/me/likes')
export const getMyReviews  = () => api.get('/users/me/reviews')
export const getMyStats    = () => api.get('/users/me/stats')

// ── 닉네임 ────────────────────────────────────────────
// 닉네임 중복 확인 → { available: bool }
export const checkNickname  = (nickname) => api.get('/users/nickname-check', { params: { nickname } })
// 닉네임 변경
export const updateNickname = (nickname) => api.patch('/users/me/nickname', { nickname })

// ── 기타 ──────────────────────────────────────────────
export const createReport  = (data)  => api.post('/reports', data)

// ── 이벤트 ────────────────────────────────────────────
export const getEvents          = ()           => api.get('/events')
export const getEvent           = (id)         => api.get(`/events/${id}`)
export const createEvent        = (data)       => api.post('/events', data)
export const updateEvent        = (id, data)   => api.patch(`/events/${id}`, data)
export const deleteEvent        = (id)         => api.delete(`/events/${id}`)
export const getEventComments   = (id)         => api.get(`/events/${id}/comments`)
export const createEventComment = (id, data)   => api.post(`/events/${id}/comments`, data)
export const deleteEventComment = (commentId)  => api.delete(`/events/comments/${commentId}`)

// ── 유튜브 영상 ───────────────────────────────────────
export const getVideos        = ()         => api.get('/videos')
export const getVideo         = (id)       => api.get(`/videos/${id}`)
export const previewVideo     = (url)      => api.get('/videos/preview', { params: { url } })
export const createVideo      = (data)     => api.post('/videos', data)
export const deleteVideo      = (id)       => api.delete(`/videos/${id}`)
export const getSpotVideos    = (spotId)   => api.get(`/spots/${spotId}/videos`)

// ── 모임 ──────────────────────────────────────────────
export const getGatherings          = (spotId)     => api.get('/gatherings', { params: { spotId } })
export const getGathering           = (id)         => api.get(`/gatherings/${id}`)
export const createGathering        = (data)       => api.post('/gatherings', data)
export const deleteGathering        = (id)         => api.delete(`/gatherings/${id}`)
export const joinGathering          = (id)         => api.post(`/gatherings/${id}/join`)
export const leaveGathering         = (id)         => api.delete(`/gatherings/${id}/leave`)
export const getGatheringParticipants = (id)       => api.get(`/gatherings/${id}/participants`)
export const getGatheringComments   = (id)         => api.get(`/gatherings/${id}/comments`)
export const createGatheringComment = (id, data)   => api.post(`/gatherings/${id}/comments`, data)
export const deleteGatheringComment = (id)         => api.delete(`/gatherings/comments/${id}`)

// ── 관리자 ────────────────────────────────────────────
export const getReports    = ()    => api.get('/reports')
export const dismissReport = (id)  => api.delete(`/reports/${id}`)
export const getAdminStats      = ()           => api.get('/admin/stats')
export const getAdminSuggestions = ()          => api.get('/admin/suggestions')
export const updateSuggestion   = (id, status) => api.patch(`/admin/suggestions/${id}`, { status })
export const updateSpot         = (id, data)   => api.patch(`/spots/${id}`, data)
export const suggestSpotEdit    = (id, content) => api.post(`/spots/${id}/suggestions`, { content })

export const uploadImage   = (file)  => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
