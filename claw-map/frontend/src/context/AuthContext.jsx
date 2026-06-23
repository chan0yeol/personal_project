import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/spots'

const AuthContext = createContext(null)

// 앱 전체에서 로그인 유저 정보에 접근하기 위한 Context Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = 로딩 중, null = 비로그인

  // 앱 시작 시 쿠키로 로그인 여부 확인 (access token 만료 시 인터셉터가 자동 갱신)
  useEffect(() => {
    api.get('/auth/me')
      .then(r => {
        setUser(r.data)
        // 세션당 1회: 비로그인 상태에서 쌓인 찜/공감을 userId로 마이그레이션
        if (!sessionStorage.getItem('likes_migrated')) {
          api.post('/auth/migrate-likes').finally(() => {
            sessionStorage.setItem('likes_migrated', '1')
          })
        }
      })
      .catch(() => setUser(null))
  }, [])

  // Google 로그인 페이지로 이동
  const login = () => {
    window.location.href = '/oauth2/authorization/google'
  }

  // 로그아웃 후 상태 초기화
  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
