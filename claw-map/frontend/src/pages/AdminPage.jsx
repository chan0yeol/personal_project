import { useState, useEffect } from 'react'
import { getReports, dismissReport, getAdminStats, getAdminSuggestions, updateSuggestion } from '../api/spots'

export default function AdminPage() {
  const [reports, setReports] = useState(null)
  const [stats, setStats] = useState(null)
  const [suggestions, setSuggestions] = useState(null)

  useEffect(() => {
    getReports().then(r => setReports(r.data)).catch(() => setReports([]))
    getAdminStats().then(r => setStats(r.data)).catch(() => {})
    getAdminSuggestions().then(r => setSuggestions(r.data)).catch(() => setSuggestions([]))
  }, [])

  const handleSuggestion = async (id, status) => {
    await updateSuggestion(id, status)
    setSuggestions(prev => prev.filter(s => s.id !== id))
  }

  const handleDismiss = async (id) => {
    if (!window.confirm('신고를 무시하고 삭제할까요?')) return
    await dismissReport(id)
    setReports(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F7F5FA' }}>
      <div style={{
        background: '#fff', padding: '18px 20px 14px', borderBottom: '1px solid #EDEAF2', flexShrink: 0,
      }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, color: '#1A1626', letterSpacing: '-0.3px' }}>관리자</h2>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* 통계 대시보드 */}
        {stats && (
          <div>
            <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1626', marginBottom: 10 }}>서비스 현황</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <StatCard icon="📍" label="전체 스팟" value={stats.totalSpots.toLocaleString()} sub={`이번달 +${stats.newSpotsThisMonth}`} />
              <StatCard icon="💬" label="전체 리뷰" value={stats.totalReviews.toLocaleString()} sub={`이번달 +${stats.newReviewsThisMonth}`} />
              <StatCard icon="⭐" label="평균 별점" value={stats.avgRating > 0 ? `${stats.avgRating}점` : '-'} />
              <StatCard icon="👤" label="전체 유저" value={stats.totalUsers.toLocaleString()} />
              <StatCard icon="🚨" label="미처리 신고" value={stats.pendingReports} accent={stats.pendingReports > 0} />
              <StatCard icon="👥" label="진행중 모임" value={stats.activeGatherings} />
            </div>
          </div>
        )}

        {/* 수정 제안 목록 */}
        {suggestions?.length > 0 && (
          <div>
            <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1626', marginBottom: 10 }}>수정 제안 <span style={{ color: '#7C3AED' }}>{suggestions.length}</span></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.map(s => (
                <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', boxShadow: '0 1px 4px rgba(31,17,68,0.06)' }}>
                  <p style={{ fontSize: 12, color: '#9B94AD', marginBottom: 4 }}>스팟 #{s.spotId}</p>
                  <p style={{ fontSize: 13, color: '#5B5470', lineHeight: 1.5, marginBottom: 10 }}>{s.content}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleSuggestion(s.id, 'DONE')} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#EDE7FF', color: '#7C3AED', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>처리완료</button>
                    <button onClick={() => handleSuggestion(s.id, 'REJECTED')} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#FEE2E2', color: '#EF4444', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>거절</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 신고 목록 */}
        <div>
          <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1626', marginBottom: 10 }}>신고 목록</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports === null && <Spinner />}
          {reports?.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9B94AD' }}>
              <span style={{ fontSize: 36 }}>🎉</span>
              <p style={{ fontSize: 14, fontWeight: 700, marginTop: 8 }}>처리할 신고가 없어요</p>
            </div>
          )}
          {reports?.map(report => (
            <ReportCard key={report.id} report={report} onDismiss={() => handleDismiss(report.id)} />
          ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '14px 16px',
      boxShadow: '0 1px 4px rgba(31,17,68,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 12, color: '#9B94AD', fontWeight: 600 }}>{label}</span>
      </div>
      <p style={{
        fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px',
        color: accent ? '#EF4444' : '#1A1626',
      }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, marginTop: 3 }}>{sub}</p>}
    </div>
  )
}

function ReportCard({ report, onDismiss }) {
  const isSpot = report.targetType === 'SPOT'

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '14px 16px',
      boxShadow: '0 1px 4px rgba(31,17,68,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
              background: isSpot ? '#EDE7FF' : '#FEF3C7',
              color: isSpot ? '#7C3AED' : '#D97706',
            }}>
              {isSpot ? '스팟' : '리뷰'}
            </span>
            <span style={{ fontSize: 11, color: '#9B94AD' }}>#{report.targetId}</span>
          </div>

          <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1626', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {report.targetSummary}
          </p>

          {report.reason && (
            <p style={{ fontSize: 13, color: '#5B5470', lineHeight: 1.5 }}>
              사유: {report.reason}
            </p>
          )}

          <p style={{ fontSize: 11, color: '#C8C2D6', marginTop: 6 }}>
            {new Date(report.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <button onClick={onDismiss} style={{
          height: 34, padding: '0 14px', borderRadius: 8, border: 'none',
          cursor: 'pointer', background: '#FEE2E2', color: '#EF4444',
          fontSize: 12, fontWeight: 700, fontFamily: 'inherit', flexShrink: 0,
        }}>무시</button>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2.5px solid #7C3AED', borderTopColor: 'transparent',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
