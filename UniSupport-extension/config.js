// config.js — 환경 설정 (가장 먼저 로드)
// 서버 IP/포트가 바뀌면 이 파일과 manifest.json의 host_permissions만 수정하면 됩니다.
const US_SERVER_HOST = 'http://192.168.10.54';
const API_BASE = `${US_SERVER_HOST}:3001`; // 반영일정 등록·조회·알림 서버 (unisupport-server)
const AI_BASE  = `${US_SERVER_HOST}:8000`; // AI 유사사례 검색·초안 서버 (support-ai)
