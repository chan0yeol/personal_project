# Claw Map - 인형뽑기방 정보 지도 서비스

## 서비스 개요
네이버 지도/플레이스에 없는 인형뽑기방 정보를 사용자가 직접 등록하고 공유하는 커뮤니티 지도 서비스

## 타겟
- 인형뽑기 마니아, 유튜버
- 처음 가보는 동네에서 인형뽑기방 찾는 사람

## MVP 핵심 기능

### 1. 지도 보기
- 카카오맵 기반
- 등록된 인형뽑기방 핀 표시
- 현재 위치 기반 주변 검색

### 2. 스팟 상세 정보
- 상호명, 주소
- 영업시간
- 주차 가능 여부
- 500원 / 1000원 기계 여부
- 기계 난이도 (쉬움 / 보통 / 어려움)
- 사진

### 3. 스팟 등록
- 누구나 등록 가능 (로그인 없이 익명)
- 체크박스 기반 객관적 정보 위주 (분쟁 최소화)

### 4. 후기
- 방문 후기 텍스트
- 신고 기능 (명예훼손 대응)

---

## 기술 스택

### 프론트엔드
- React (Vite)
- 카카오맵 API (react-kakao-maps-sdk)
- CSS Modules or Tailwind CSS

### 백엔드
- Spring Boot 3.x
- JPA + Hibernate
- MySQL

### 인프라
- OCI 인스턴스
- Nginx 리버스 프록시
- Docker Compose
- 서브도메인 연결

---

## DB 설계 (초안)

### spots (인형뽑기방)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| name | VARCHAR | 상호명 |
| address | VARCHAR | 주소 |
| lat | DOUBLE | 위도 |
| lng | DOUBLE | 경도 |
| parking | BOOLEAN | 주차 가능 여부 |
| coin_500 | BOOLEAN | 500원 기계 여부 |
| coin_1000 | BOOLEAN | 1000원 기계 여부 |
| difficulty | ENUM | 쉬움/보통/어려움 |
| open_time | VARCHAR | 영업시간 |
| created_at | DATETIME | 등록일 |

### reviews (후기)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| spot_id | BIGINT | FK → spots |
| content | TEXT | 후기 내용 |
| nickname | VARCHAR | 작성자 닉네임 |
| created_at | DATETIME | 작성일 |

### reports (신고)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| target_type | ENUM | SPOT / REVIEW |
| target_id | BIGINT | 신고 대상 ID |
| reason | TEXT | 신고 사유 |
| created_at | DATETIME | 신고일 |

---

## API 설계 (초안)

| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/spots | 스팟 목록 (위치 기반 필터) |
| GET | /api/spots/{id} | 스팟 상세 |
| POST | /api/spots | 스팟 등록 |
| GET | /api/spots/{id}/reviews | 후기 목록 |
| POST | /api/spots/{id}/reviews | 후기 등록 |
| POST | /api/reports | 신고 |

---

## 법적 리스크 대응
- 이용약관: 사실 기반 후기만 허용, 허위사실 작성자 책임 명시
- 체크박스 기반 객관 정보 위주 설계
- 신고 → 관리자 검토 → 삭제 프로세스
- 추후: 사업자 반론 등록 기능

---

## 프로젝트 구조 (예정)
```
claw-map/
├── backend/         # Spring Boot
├── frontend/        # React (Vite)
└── docker-compose.yml
```

## 초기 데이터 전략
- 카카오 로컬 API로 "인형뽑기" 키워드 검색 → 상호명/주소/위경도 수집
- 일회성 seeding 스크립트로 DB에 적재
- 크롤링 없이 공식 API만 사용 (이용약관 준수)

## 단계별 개발 계획
1. **1단계** - DB 설계 확정 + Spring Boot 프로젝트 세팅 + 카카오 로컬 API seeding 스크립트
2. **2단계** - 스팟 등록/조회 API 개발
3. **3단계** - 프론트 지도 화면 개발 (React + Vite + Tailwind)
4. **4단계** - 후기/신고 기능
5. **5단계** - Docker Compose 구성 + OCI 배포
