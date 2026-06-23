# Claw Map - 서비스 기획안 v5

> 최종 업데이트: 2026-05-14 (Phase 21 PWA 진행중 — 아이콘 제외 구현 완료 / 모임 참여 버그 수정)

## 프로젝트 목적

인형뽑기 유튜브 채널 **오뽑세** 운영자가 구독자들과 인형뽑기방 정보를 직접 공유하는 **커뮤니티 지도 서비스**.

- 유튜브 영상 설명란/커뮤니티 탭에 링크 → 구독자 유입
- 구독자들이 자신만 아는 숨은 뽑기방을 직접 등록하고 리뷰
- 구글 로그인(유튜브 계정)으로 자연스러운 연결
- 도메인: **map.chanyeols.com** (HTTPS)

---

## 개발 로드맵

| Phase | 내용 | 상태 |
|-------|------|------|
| 1 | 지도 기반 스팟 조회/등록, 후기, 신고, Seeding | ✅ 완료 |
| 2 | 사진 업로드 (스팟 + 리뷰 이미지) | ✅ 완료 |
| 3 | 좋아요 (스팟 찜, 리뷰 공감) | ✅ 완료 |
| 4 | Google OAuth 로그인 + JWT | ✅ 완료 |
| 5 | 마이페이지 (내 스팟/찜/리뷰, 닉네임 설정) | ✅ 완료 |
| 6 | UI 고도화 (클러스터링, 검색, 모바일 최적화) | ✅ 완료 |
| 7 | UI 리디자인 (디자인 시스템 적용) | ✅ 완료 |
| 8 | 이벤트 페이지 (구독자 이벤트 등록/조회) | ✅ 완료 |
| 9 | 모임 기능 (스팟 기반 모임 개설/참여/댓글) | ✅ 완료 |
| 10 | 길찾기 버튼 + 공유 버튼 | ✅ 완료 |
| 11 | 스팟 정보 수정 + 베스트 리뷰 | ✅ 완료 |
| 12 | 스팟 정렬/필터 강화 + 지역별 랭킹 | ✅ 완료 |
| 13 | 관리자 통계 대시보드 | ✅ 완료 |
| 14 | 유튜브 영상-스팟 연계 | ✅ 완료 |
| 15 | 현위치 기반 근처 스팟 (거리순 정렬) | ✅ 완료 |
| 16 | 스팟 사진 갤러리 탭 | ✅ 완료 |
| 17 | 기계/인형 캐릭터 태그 | ✅ 완료 |
| 18 | 내 뽑기 기록 통계 | ✅ 완료 |
| 19 | 스팟 체크인 | 🔜 예정 |
| 20 | 랜딩페이지 (SEO + 서비스 소개) | ✅ 완료 |
| 21 | PWA (홈화면 설치 지원) | 🔧 진행중 |
| 22 | Capacitor 앱 패키징 (Play Store / App Store) | 🔜 기획 완료 |

---

## 구현 완료 기능 상세

### Phase 1 — 지도 + 스팟 + 후기

- 카카오맵 기반 스팟 핀 표시 (범위 기반 조회)
- 스팟 등록/상세 조회, 후기 등록/조회
- 신고 기능
- Kakao/Naver Local API Seeding (동 단위 / 시군구 단위)
  - KakaoLocalSeeder: `dong_list.txt` 약 550개 동 × 3 키워드
  - NaverLocalSeeder: 시/군/구 140개 × 2 키워드

---

### Phase 2 — 사진 업로드

- 스팟 등록 시 최대 5장 (10MB/장, JPEG·PNG·WEBP)
- 리뷰 작성 시 최대 3장
- 지도 클릭 시 Kakao 역지오코딩으로 주소 자동 입력
- 스팟 패널 상단 이미지 슬라이더 (좌우 탐색 + 원본 확대)
- 파일 저장: 로컬 디스크 (`/app/uploads`) → Docker 볼륨 마운트로 영구 보존
- Nginx `/uploads/` → Spring Boot 정적 서빙 프록시
- 추후 OCI Object Storage 전환 시 `ImageService.save()` 내부만 교체

---

### Phase 3 — 좋아요

- 스팟 찜 (♥ 버튼 + 찜 수 표시)
- 리뷰 공감 (👍 버튼 + 공감 수 표시)
- 중복 방지
  - 비로그인: `deviceId` (localStorage UUID) 기준
  - 로그인: `userId` 기준 (DB UNIQUE 제약)
- 로그인 후 기존 deviceId 찜과 별개로 userId 찜 누적

---

### Phase 4 — Google OAuth 로그인

- Spring Security OAuth2 Client + JJWT
- httpOnly 쿠키로 Access Token(15분) / Refresh Token(7일) 발급
- OAuth 흐름: 프론트 `/oauth2/authorization/google` → Nginx 프록시 → Spring → Google → 콜백 → JWT 쿠키 → 프론트 리다이렉트
- 등록 URI: `https://map.chanyeols.com/login/oauth2/code/google`
- 재로그인 시 프로필 이미지만 갱신 (사용자 설정 닉네임 유지)

| 기능 | 비로그인 | 로그인 |
|------|---------|--------|
| 지도 조회 | ✅ | ✅ |
| 스팟 등록 | ❌ (로그인 필요) | ✅ |
| 리뷰 작성 | ❌ (로그인 필요) | ✅ |
| 스팟 찜 | deviceId 임시 | userId 영구 |
| 리뷰 공감 | deviceId 임시 | userId 영구 |
| 내 등록 내역 | ❌ | ✅ |
| 리뷰 삭제 | ❌ | ✅ (본인만) |
| 닉네임 설정 | ❌ | ✅ |

---

### Phase 5 — 마이페이지

- 프로필 카드 (Google 사진 + 닉네임 + 이메일)
- 닉네임 변경: 중복 확인 → 저장 (2~12자 제한)
  - 리뷰 작성 시 저장된 닉네임 자동 사용
- 내가 등록한 뽑기방 목록 (이름 + 주소 + 태그)
- 찜한 뽑기방 목록
- 내 후기 목록 (스팟명 + 주소 포함)
- 목록 항목 클릭 → 해당 스팟으로 지도 이동 + SpotPanel 오픈

---

### Phase 6 — UI 고도화

- **반응형 레이아웃**: 모바일 바텀시트 / 데스크톱 사이드 패널
- **하단 탭 네비** (모바일): 지도 / 찜 / 이벤트 / 마이
- **헤더 네비** (데스크톱): 동일 탭 + 로그인/프로필
- **마커 클러스터링**: zoom level 7 이상에서 개수 표시, 이하에서 개별 핀
- **장소 검색**: Kakao Places API, 350ms 디바운스, 결과 6개, 클릭 시 지도 이동
- **GPS 현위치**: 에러 케이스별 토스트 안내 (권한 거부 / 위치 불가 / 타임아웃)
- **`100dvh`**: 모바일 브라우저 주소창 대응
- **Kakao Maps z-index 격리**: `isolate` + BottomNav `relative z-20`

---

### Phase 7 — UI 리디자인

- **디자인 시스템**: 보라/바이올렛 계열 (#7C3AED) + Pretendard 폰트
- **Tailwind `@theme`**: 색상 토큰 전역 등록 (primary, text, line, bg 등)
- **BottomNav**: 이모지 → SVG 아이콘, 보라 active 색상
- **SearchBar**: 디자인 검색바 + 필터 칩 (전체/500원/24시간/주차가능) + 지도 영역과 분리된 독립 공간
- **MapPage**: SVG FAB 버튼 (GPS + 등록), 보라 토스트, 스팟 패널 열릴 때 검색바/FAB 숨김, 필터 로직 (프론트 필터링)
- **SpotPanel**: 보라 시스템 전체 적용, SVG 찜 버튼, 태그 칩 개선, 리뷰 카드 개선
- **SpotForm**: 토글 스위치, 난이도 세그먼트 버튼, 카드 레이아웃, 바텀바 가림 버그 수정
- **MyPage**: 보라 그라데이션 프로필 카드, 아이콘 버튼형 메뉴
- **FavoritesPage**: 플레이스홀더 → `getMyLikes()` 실제 구현, 지도 이동 연동
- **Header**: 로고 좌측 고정, 로그인/프로필만 우측, 보라 active 네비

---

## 현재 기술 스택

### 백엔드
| 항목 | 기술 |
|------|------|
| 프레임워크 | Spring Boot 3.3 |
| ORM | JPA (Hibernate) |
| 인증 | Spring Security OAuth2 + JJWT 0.12 |
| 파일 저장 | 로컬 디스크 (추후 OCI Object Storage 전환 예정) |
| DB | MySQL 8.0 |
| API 클라이언트 | WebFlux (Seeder용) |

### 프론트엔드
| 항목 | 기술 |
|------|------|
| 프레임워크 | React 18 + Vite |
| 지도 | react-kakao-maps-sdk (services + clusterer) |
| 스타일 | Tailwind CSS v4 |
| 상태관리 | Context API (AuthContext) |
| HTTP | Axios |

### 인프라
| 항목 | 기술 |
|------|------|
| 서버 | OCI (Oracle Cloud Infrastructure) |
| 컨테이너 | Docker Compose |
| 웹서버 | Nginx (리버스 프록시 + 정적 서빙) |
| 도메인 | map.chanyeols.com (HTTPS) |
| 볼륨 | `db_data`, `uploads_data` (named volumes) |

---

## DB 설계 (현재 상태)

### spots
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| name | VARCHAR | 상호명 |
| address | VARCHAR | 주소 |
| lat / lng | DOUBLE | 위경도 |
| parking | BOOLEAN | |
| coin_500 / coin_1000 | BOOLEAN | |
| difficulty | ENUM | EASY/NORMAL/HARD |
| open_time | VARCHAR | |
| user_id | BIGINT | 등록자 (nullable) |
| created_at | DATETIME | |

### reviews
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| spot_id | BIGINT | FK → spots |
| content | TEXT | |
| nickname | VARCHAR | |
| user_id | BIGINT | 작성자 (nullable) |
| created_at | DATETIME | |

### users
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| google_id | VARCHAR UNIQUE | Google OAuth sub |
| email | VARCHAR | |
| nickname | VARCHAR | 사용자 설정 닉네임 |
| profile_image_url | VARCHAR | |
| created_at | DATETIME | |

### spot_images / review_images
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| spot_id / review_id | BIGINT | FK |
| url | VARCHAR | 파일 경로 |
| is_main | BOOLEAN | 대표 이미지 (spot_images만) |
| display_order | INT | |
| created_at | DATETIME | |

### spot_likes / review_likes
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| spot_id / review_id | BIGINT | FK |
| device_id | VARCHAR | 비로그인 식별자 |
| user_id | BIGINT | 로그인 식별자 (nullable) |
| created_at | DATETIME | |
| UNIQUE | (spot_id, device_id), (spot_id, user_id) | 중복 방지 |

### reports
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| target_type | ENUM | SPOT / REVIEW |
| target_id | BIGINT | |
| reason | TEXT | |
| created_at | DATETIME | |

---

## API 현황

### 스팟
| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | /api/spots | - | 범위 내 스팟 목록 |
| GET | /api/spots/{id} | - | 스팟 상세 (이미지+좋아요) |
| POST | /api/spots | ✅ | 스팟 등록 |
| POST | /api/spots/{id}/like | - | 찜 토글 |

### 리뷰
| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | /api/spots/{id}/reviews | - | 리뷰 목록 (공감 포함) |
| POST | /api/spots/{id}/reviews | ✅ | 리뷰 등록 |
| DELETE | /api/spots/{spotId}/reviews/{id} | ✅ | 본인 리뷰 삭제 |
| POST | /api/reviews/{id}/like | - | 공감 토글 |

### 인증
| Method | URL | 설명 |
|--------|-----|------|
| GET | /oauth2/authorization/google | Google 로그인 시작 |
| GET | /api/auth/me | 내 정보 조회 |
| POST | /api/auth/refresh | Access Token 재발급 |
| POST | /api/auth/logout | 로그아웃 |

### 마이페이지
| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/users/me/spots | 내 등록 스팟 |
| GET | /api/users/me/likes | 내 찜 스팟 |
| GET | /api/users/me/reviews | 내 리뷰 (스팟명+좌표 포함) |
| GET | /api/users/nickname-check | 닉네임 중복 확인 |
| PATCH | /api/users/me/nickname | 닉네임 변경 |

### 이미지
| Method | URL | 설명 |
|--------|-----|------|
| POST | /api/images | 이미지 업로드 → URL 반환 |

---

### Phase 8 — 이벤트

- **Event Entity**: title, content, imageUrl, startDate, endDate, userId, createdAt
- **EventComment Entity**: eventId, userId(nullable), nickname, content, createdAt
- **관리자 권한**: `users.admin` boolean 필드 추가 → DB에서 직접 설정
- **API**: GET /api/events, GET /api/events/{id}, POST /api/events (admin), GET/POST /api/events/{id}/comments, DELETE /api/events/comments/{id}
- **프론트**: 이벤트 목록(진행중/종료 구분, D-day 뱃지) + 상세(본문+댓글) + 댓글 작성/삭제
- **D-day 계산**: `EventResponse`에서 서버 사이드 계산
- `ddl-auto: update` — 재시작 시 events, event_comments 테이블 자동 생성

---

## 미구현 / 개선 예정

| 항목 | 상태 | 비고 |
|------|------|------|
| 이벤트 이미지 업로드 UI | ✅ 완료 | 파일 업로드 + 미리보기로 교체 |
| 관리자 이벤트 수정/삭제 UI | ✅ 완료 | PATCH/DELETE API + 프론트 수정 폼 |
| Refresh Token 자동 갱신 | ✅ 완료 | Axios 인터셉터 (401 → refresh → 재시도) |
| 비로그인 찜 → 로그인 후 마이그레이션 | ✅ 완료 | POST /api/auth/migrate-likes, 세션당 1회 자동 호출 |
| 이미지 리사이징 (썸네일) | ✅ 완료 | thumbnailator 적용, 1200px/JPEG 85% |
| 관리자 신고 처리 페이지 | ✅ 완료 | GET/DELETE /api/reports, AdminPage + BottomNav 탭 |
| OCI Object Storage 전환 | ⏸ 보류 | `ImageService.save()` 교체만 필요, 필요 시 진행 |

---

### Phase 9 — 모임

#### 개요
특정 스팟에서 특정 시간에 모임을 개설하고 참여할 수 있는 커뮤니티 기능. 로그인 유저만 개설/참여 가능.

#### DB 설계

**gatherings (모임)**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| spot_id | BIGINT | FK → spots |
| host_user_id | BIGINT | FK → users (개설자) |
| title | VARCHAR | 모임 제목 |
| description | TEXT | 모임 설명 |
| meet_at | DATETIME | 모임 일시 |
| max_participants | INT | null이면 무제한 |
| is_recurring | BOOLEAN | 정기 모임 여부 |
| recurrence_type | ENUM | WEEKLY / MONTHLY |
| recurrence_day | INT | 요일(0~6) 또는 날짜(1~31) |
| status | ENUM | OPEN / CLOSED / CANCELLED |
| created_at | DATETIME | |

**gathering_participants (참여자)**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| gathering_id | BIGINT | FK |
| user_id | BIGINT | FK |
| joined_at | DATETIME | |
| UNIQUE | (gathering_id, user_id) | 중복 방지 |

**gathering_comments (댓글)**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| gathering_id | BIGINT | FK |
| user_id | BIGINT | FK |
| content | TEXT | |
| created_at | DATETIME | |

#### API

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | /api/gatherings?spotId= | - | 스팟별 모임 목록 (CANCELLED 제외) |
| GET | /api/gatherings/{id} | - | 모임 상세 |
| POST | /api/gatherings | ✅ | 모임 개설 (개설자 자동 참여) |
| DELETE | /api/gatherings/{id} | ✅ | 모임 취소 (개설자만, status → CANCELLED) |
| POST | /api/gatherings/{id}/join | ✅ | 참여 (정원 체크) |
| DELETE | /api/gatherings/{id}/leave | ✅ | 참여 취소 (개설자 불가) |
| GET | /api/gatherings/{id}/participants | - | 참여자 목록 (닉네임 + 프로필) |
| GET | /api/gatherings/{id}/comments | - | 댓글 목록 |
| POST | /api/gatherings/{id}/comments | ✅ | 댓글 작성 |
| DELETE | /api/gatherings/comments/{id} | ✅ | 댓글 삭제 (본인만) |

#### 프론트
- `SpotPanel` — 후기/모임 탭 분리
- 모임 목록: 모집중/마감/취소/종료 상태 뱃지 (meetAt 경과 시 자동 종료 표시), 참여 인원
- 모임 상세: 참여자 아바타 목록 + 댓글 + 참여하기/취소 버튼 (정원 마감 시 비활성)
- 모임 개설 폼: 일시, 인원 제한, 정기 모임(매주/매월) 설정
- **GatheringsPage** — 독립 탭 추가 (지도/모임/찜/이벤트/마이, 5탭)
  - 전체 / 내 모임 필터 (참여 중 + 내가 개설한 모임 포함)
  - 카드에 스팟명, 날짜, 참여 인원, 상태, 개설/참여중 뱃지
  - 상세 뷰: 참여자 목록, 댓글, 참여 버튼
- 종료된 모임(meetAt 경과): 댓글 작성 불가, 참여 버튼 비활성
- `GatheringResponse`에 `spotName` 필드 추가
- `GET /api/gatherings` spotId 파라미터 옵셔널 (없으면 전체 조회)
- `ddl-auto: update` — 재시작 시 gatherings, gathering_participants, gathering_comments 테이블 자동 생성

---

### Phase 10 — 길찾기 버튼 + 공유 버튼

#### 길찾기 버튼 (✅ 완료)
- 스팟 패널 정보 태그 아래에 카카오맵 / 네이버지도 버튼 나란히 배치
- 카카오맵: `https://map.kakao.com/link/to/{name},{lat},{lng}`
- 네이버지도: `https://map.naver.com/v5/search/{name+address}`
- 백엔드 변경 없음

#### 공유 버튼 (✅ 완료)
- 스팟 패널 헤더에 공유 아이콘 버튼 추가
- 클릭 시 `{origin}/?spotId={id}` 클립보드 복사 → "링크가 복사되었어요" 토스트
- URL `?spotId=` 파라미터 진입 시 해당 스팟 자동 오픈 + 지도 중심 이동 + URL 클린업
- 백엔드 변경 없음

---

### Phase 11 — 스팟 정보 수정 + 베스트 리뷰

#### 스팟 정보 수정 (✅ 완료)
- **내가 등록한 스팟**: 수정 버튼 → 바텀시트 폼 (PATCH /api/spots/{id}, 본인만)
- **타인 등록 스팟**: 수정 제안 버튼 → 텍스트 제출 → 관리자 처리

| DB 테이블 | 컬럼 |
|-----------|------|
| spot_suggestions | id, spot_id, user_id, content, status(PENDING/DONE/REJECTED), created_at |

| Method | URL | 설명 |
|--------|-----|------|
| PATCH | /api/spots/{id} | 스팟 수정 (본인만) |
| GET | /api/spots/ranking | 지역별 랭킹 (swLat/neLat/swLng/neLng/limit) |
| POST | /api/spots/{id}/suggestions | 수정 제안 등록 (로그인) |
| GET | /api/admin/suggestions | 제안 목록 (admin, PENDING) |
| PATCH | /api/admin/suggestions/{id} | 제안 처리 (DONE/REJECTED) |

- AdminPage에 수정 제안 목록 섹션 추가 (처리완료/거절 버튼)

#### 베스트 리뷰 (✅ 완료)
- 리뷰 탭 상단 최신순 / 공감순 정렬 토글
- 별점 4+ AND 공감 3+ 리뷰에 🏆 베스트 뱃지 + 보라 배경 강조
- 정렬은 프론트 클라이언트 사이드 (이미 전체 로드됨)

---

### Phase 12 — 스팟 정렬/필터 강화 + 지역별 랭킹

#### 스팟 정렬/필터 강화 (✅ 완료)
- SearchBar 필터 칩에 "별점 4+" 추가 → `avgRating >= 4` 프론트 필터
- `SpotDetailResponse`에 `userId`, `reviewCount`, `avgRating` 집계 필드 추가

#### 지역별 랭킹 (✅ 완료)
- MapPage FAB에 "🏆 이 지역 랭킹" 버튼 추가
- 클릭 시 현재 지도 범위 기준 TOP 10 바텀시트
- 카드: 순위(메달), 스팟명, 별점, 리뷰수·찜수
- 클릭 시 해당 스팟 패널 오픈 + 지도 이동
- `GET /api/spots/ranking` — 점수 = (likeCount × 0.4 + reviewCount × 0.6) 정렬

---

### Phase 13 — 관리자 통계 대시보드

#### 개요 (✅ 완료)
관리자 전용 서비스 현황 대시보드. AdminPage 상단에 통계 카드 섹션 + 수정 제안 목록 추가.

#### 표시 항목
| 항목 | 설명 |
|------|------|
| 📍 전체 스팟 수 | 이번달 신규 수 포함 |
| 💬 전체 리뷰 수 | 이번달 신규 수 포함 |
| ⭐ 평균 별점 | rating 입력된 리뷰 기준 |
| 👤 전체 유저 수 | |
| 🚨 미처리 신고 수 | 0 초과 시 빨간색 강조 |
| 👥 진행중 모임 수 | OPEN & meetAt > now |

- `GET /api/admin/stats` (admin only) — `AdminStatsResponse` DTO
- AdminPage에 2열 카드 그리드 + 수정 제안 목록 + 신고 목록 순서로 배치

---

## 추가 개선 사항

### 리뷰 선택 입력 항목 추가
- `reviews` 테이블에 선택 컬럼 추가 (모두 nullable, `ddl-auto: update` 자동 반영)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| rating | INT | 별점 1~5 |
| play_count | INT | 총 판 수 |
| spend_amount | INT | 총 지출 (원) |
| catch_result | ENUM | SUCCESS / CLOSE / FAIL |
| machine_condition | ENUM | GOOD / NORMAL / BAD |
| revisit | BOOLEAN | 재방문 의사 |

- 후기 폼: 별점(★ 탭), 뽑기 결과/기계 컨디션/재방문(토글 버튼), 판 수/금액(숫자 입력)
- 후기 카드: 입력된 항목만 색상 칩으로 표시 (🎉 성공, 5판 · 5,000원, 기계 좋음, 🔄 재방문 예정 등)
- 🏆 베스트 뱃지: 별점 4+ AND 공감 3+ 조건

### 종료 후 댓글 작성 불가
- 이벤트: `dday < 0` (종료일 경과) → 댓글 입력 영역 대신 안내 메시지
- 모임: `meetAt < now` → 동일 처리

### 전체 스크롤 개선
- 모든 `flex: 1, overflowY: 'auto'` 컨테이너에 `minHeight: 0` 추가
  - SpotPanel(리뷰/모임 탭), EventPage(목록/상세), GatheringsPage, AdminPage, FavoritesPage, MyPage
- **후기 폼 구조 변경**: 고정 하단 영역 → 리뷰 목록과 같은 스크롤 컨테이너 안으로 이동
  - 기존: 폼이 `flexShrink: 0`으로 아래 고정 → 새 필드 추가 후 제출 버튼 잘림
  - 변경: 리뷰 목록 스크롤 영역 하단에 폼 포함 → 아래로 스크롤하면 모든 필드 + 제출 버튼 접근 가능
- **모달/바텀시트 BottomNav 겹침 수정**: `position: fixed, inset: 0` 모달이 BottomNav(56px) 뒤로 가려지는 문제
  - 내부 카드에 `paddingBottom: 80px`, `maxHeight: calc(90dvh - 56px)` 적용
  - 적용 대상: EventForm, GatheringForm, SpotEditForm, SpotSuggestForm, 랭킹 바텀시트
- **EventPage 컨테이너**: `main`이 block 컨테이너라 `flex: 1`이 동작하지 않음 → `height: '100%'`로 복원

### EventPage UI 개선
- **이벤트 카드 가로형 리디자인**: 16:9 풀너비 이미지 → 90px 정사각 썸네일 + 우측 텍스트 레이아웃
  - 한 화면에 4~5개 카드 노출 (기존 1~2개 대비 개선)
  - 상세 페이지는 기존 큰 이미지 유지

### 버그 수정
- **Jackson boolean 직렬화**: Java `boolean isJoined` 필드 → Lombok getter `isJoined()` → Jackson JSON `joined` (is 접두사 제거). 프론트에서 `g.isJoined` → `g.joined`, `g.isHost` → `g.host`로 수정. (`Boolean` 래퍼 타입인 `isRecurring`은 `getIsRecurring()` getter → JSON `isRecurring` 그대로)
- **내 모임 필터**: `g.isJoined || g.isHost` → `g.joined || g.host`로 수정하여 내가 개설한 모임 포함

### 모바일 전용 레이아웃 고정
모바일 위주 서비스 특성상 PC에서도 모바일 폼팩터로 표시되도록 전환.

- `index.css` — `body` 배경 `#1A1626`, `#root` `max-width: 430px` 중앙 정렬 + `box-shadow`
  - PC에서 양쪽 어두운 배경 + 앱 컨테이너 부각 효과
  - 모바일에서는 기존과 동일하게 100% 너비
- `BottomNav` — `sm:hidden` 제거 → 뷰포트 크기와 무관하게 항상 표시
- `SpotPanel` — `sm:` 사이드패널 클래스 전부 제거 → 항상 바텀시트 유지
- `Header` — 데스크톱 nav `hidden` 고정, 닉네임·뱃지·드롭다운 화살표 항상 표시

### UI 버그 수정
- **내 주변 뽑기방 버튼 위치 개선**: 우측 FAB 그룹에서 분리 → 지도 좌측 하단 보라 그라디언트 고정 버튼으로 변경
- **MyPage 닉네임 변경 레이아웃**: 인풋+버튼 가로 배열 → 인풋(full-width) → 중복확인 버튼(full-width) → 저장하기 버튼 세로 순서로 변경하여 좁은 화면 오버플로우 해결

---

### Phase 14 — 유튜브 영상-스팟 연계

#### 개요
오뽑세 유튜브 채널 영상을 지도 서비스와 연결. 영상에서 방문한 뽑기방을 찾아갈 수 있고, 스팟 상세에서 관련 영상 확인 가능.

#### DB 설계

**youtube_videos**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| youtube_id | VARCHAR | 유튜브 영상 ID |
| title | VARCHAR | 영상 제목 (oEmbed 자동 추출) |
| description | TEXT | 설명 (선택) |
| user_id | BIGINT | 등록 관리자 |
| created_at | DATETIME | |

> 썸네일: `https://img.youtube.com/vi/{youtube_id}/maxresdefault.jpg` (저장 불필요)

**video_spot_links** (다대다)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| video_id | BIGINT | FK → youtube_videos |
| spot_id | BIGINT | FK → spots |

#### 등록 흐름
1. 관리자 유튜브 URL 입력
2. 백엔드 `GET /api/videos/preview?url=` → oEmbed API 호출 → 제목·썸네일 반환
3. 프론트에서 미리보기 확인
4. 연결 스팟 선택 (여러 개 가능)
5. 등록

#### API

| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/videos | 전체 영상 목록 |
| GET | /api/videos/{id} | 영상 상세 + 연결 스팟 |
| GET | /api/videos/preview?url= | URL로 영상 정보 미리보기 (oEmbed) |
| POST | /api/videos | 영상 등록 + 스팟 연결 (admin) |
| DELETE | /api/videos/{id} | 영상 삭제 (admin) |
| GET | /api/spots/{id}/videos | 스팟에 연결된 영상 목록 |

#### 프론트
- **영상 탭** 신규 추가 (BottomNav 6탭: 지도/모임/영상/찜/이벤트/마이)
- 영상 카드: 썸네일(16:9), 제목, 연결 스팟 수 뱃지
- 영상 상세: 썸네일, 제목, 설명, "유튜브에서 보기" 버튼 + 연결 스팟 목록 → 클릭 시 지도 이동
- **SpotPanel**: 후기/모임 탭에 영상 탭 추가 → 해당 스팟 관련 영상 표시
- **AdminPage**: URL 붙여넣기 → 미리보기 → 스팟 검색/선택 → 등록

---

### Phase 15 — 현위치 기반 근처 스팟 (✅ 완료)

#### 개요
GPS로 현재 위치를 파악하고 반경 N km 이내 스팟을 거리순으로 표시. 모바일에서 "지금 근처에 어떤 뽑기방이 있지?" 니즈를 해결.

#### DB 변경
없음 (기존 spots 테이블 좌표 활용)

#### API

| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/spots/nearby?lat=&lng=&radius= | 현위치 기준 반경 내 스팟 (거리순) |

- `radius`: 기본 2000 (미터), 최대 5000
- 거리 계산: Java Haversine 공식 (bounding box 1차 필터 → 정확 거리 2차 필터)
- 응답: `NearbySpotResponse` (id, name, address, lat, lng, distanceMeters, avgRating, reviewCount, likeCount)

#### 프론트

- 지도 **좌측 하단**에 "내 주변 뽑기방" 보라 그라디언트 고정 버튼 (위치 핀 아이콘 포함)
- 클릭 시 GPS 권한 요청 → 위치 획득 후 API 호출
- 반경 선택 칩: 500m / 1km / 2km / 5km (선택 시 즉시 재조회)
- 결과 바텀시트: 거리(강조)·스팟명·별점 카드, 클릭 시 해당 스팟 패널 오픈 + 지도 이동
- 위치 권한 거부 시 기존 GPS 에러 토스트 재활용
- SpotPanel 열리면 버튼 자동 숨김

---

### Phase 16 — 스팟 사진 갤러리 (✅ 완료)

#### 개요
SpotPanel에 사진 탭 추가. 스팟 등록 이미지 + 리뷰 이미지를 한 곳에서 그리드 갤러리로 제공.

#### DB 변경
없음 (기존 spot_images, review_images 활용)

#### 신규 파일
- `GalleryService.java` — 스팟 이미지 + 리뷰 이미지 통합 조회
- `GalleryImageResponse.java` — `{ url, type: SPOT|REVIEW, reviewId, createdAt }` record
- `ReviewImageRepository` — `findBySpotId()` JPQL 쿼리 추가 (`ri.review.spot.id = :spotId`)

#### API

| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/spots/{id}/gallery | 스팟 등록 이미지(등록순) + 리뷰 이미지(최신순) 통합 반환 |

#### 프론트

- SpotPanel 탭: **후기 / 사진 / 모임 / 영상** (4탭)
- 사진 탭(`PhotoTab`): 3열 그리드, 리뷰 이미지는 우측 하단에 `리뷰` 뱃지
- 이미지 클릭 시 라이트박스 오버레이 (이전/다음 화살표 + 카운터)

---

### Phase 17 — 기계/인형 태그 (✅ 완료)

#### 개요
스팟에 어떤 캐릭터/인형이 있는지 태그로 등록. 유저가 직접 추가.

#### DB 설계

**spot_tags** (`com.clawmap.domain.tag`)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| spot_id | BIGINT | FK → spots |
| tag | VARCHAR(20) | 태그명 |
| user_id | BIGINT | 등록자 (nullable) |
| created_at | DATETIME | |
| UNIQUE | (spot_id, tag) | 중복 방지 |

#### API

| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/spots/{id}/tags | 태그 목록 |
| POST | /api/spots/{id}/tags | 태그 추가 (로그인, 최대 20자) |
| DELETE | /api/spots/{id}/tags/{tagId} | 태그 삭제 (본인 or admin) |

- 중복 태그 시 409 반환
- 태그는 SpotDetailResponse와 별도로 SpotPanel 마운트 시 개별 호출

#### 프론트

- SpotPanel 정보 태그(영업시간/코인/주차) 아래 `TagSection` 컴포넌트
- 기존 태그: 보라 pill 칩(`🧸 태그명`) + 본인/admin은 ✕ 삭제 버튼
- `＋ 태그` 버튼 클릭 시 프리셋 칩(산리오/포켓몬/디즈니/마블/BTS/캐릭터) + 직접 입력 인풋 표시
- 엔터 또는 추가 버튼으로 등록, 취소 버튼으로 닫기

---

### Phase 18 — 내 뽑기 기록 통계 (✅ 완료)

#### 개요
마이페이지에 개인 뽑기 통계 카드 추가. 기존 리뷰 데이터(판 수·지출·결과)를 집계해 개인화된 통계 제공.

#### DB 변경
없음 (기존 reviews 컬럼 집계)

#### 신규 쿼리 (`ReviewRepository`)
- `countByUserId` — 총 리뷰 수
- `countDistinctSpotsByUserId` — 방문한 스팟 수 (DISTINCT spot_id)
- `sumPlayCountByUserId` / `sumSpendAmountByUserId` — 합계
- `countSuccessByUserId` / `countWithCatchResultByUserId` — 성공률 계산용
- `countRevisitTrueByUserId` / `countWithRevisitByUserId` — 재방문 의사 비율 계산용

#### API

| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/users/me/stats | 내 뽑기 통계 집계 (로그인 필요) |

- `catchSuccessRate` / `revisitRate`: 데이터 없으면 `-1` 반환 → 프론트에서 `-` 표시
- `UserController` 내 `MyStatsResponse` record로 정의

#### 프론트

- MyPage 메뉴 화면 상단에 `StatsCard` 컴포넌트 (로그인 유저만 표시)
- 2열 그리드 6개 항목: 방문 뽑기방·작성 후기·총 판 수·총 지출·성공률·재방문 의사
- 데이터 없는 항목(`-1` or `0`)은 `-` 표시
- 마운트 시 `getMyStats()` 호출, 실패해도 카드 미표시(오류 무시)

---

### Phase 19 — 스팟 체크인

#### 개요
"지금 여기 있어요" 실시간 인증. 체크인 후 3시간 동안 유효, 스팟 패널에 현재 인원 표시. 방문 의욕을 자극하는 소셜 기능.

#### DB 설계

**spot_checkins**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| spot_id | BIGINT | FK → spots |
| user_id | BIGINT | FK → users |
| checked_in_at | DATETIME | 체크인 시간 |
| expires_at | DATETIME | checked_in_at + 3시간 |
| UNIQUE | (spot_id, user_id, expires_at > now) | 중복 체크인 방지 |

#### API

| Method | URL | 설명 |
|--------|-----|------|
| POST | /api/spots/{id}/checkin | 체크인 (로그인, 이미 체크인 중이면 체크아웃) |
| GET | /api/spots/{id}/checkins | 현재 체크인 인원 + 내 체크인 여부 |

- SpotDetailResponse에 `activeCheckinCount` 필드 추가
- 체크인 응답: `{ checkedIn: boolean, activeCount: int }`

#### 프론트

- SpotPanel 정보 섹션: "👥 지금 N명 있어요" 표시 (N > 0일 때만)
- 체크인 버튼 (로그인 필요): 체크인 중이면 "✅ 체크인 중 · 취소" 토글
- 체크인 목록: 체크인한 유저 프로필 이미지 최대 5개 오버랩 표시
- MyPage "최근 체크인" 섹션: 방문한 스팟 기록으로도 활용

---

### Phase 20 — 랜딩페이지 (SEO) (✅ 완료)

#### 개요
`map.chanyeols.com` 루트 접속 시 서비스를 소개하는 정적 랜딩페이지 제공. 구글 검색 노출 + 유튜브 구독자 유입 두 가지 모두 대응.

#### 라우팅 구조

```
/      → landing.html (순수 HTML/CSS, SEO 완전 지원)
/app   → React SPA (기존 서비스 전체)
```

React SPA는 `vite.config.js` 변경 없이 기존 `base: '/'` 유지. Nginx가 `/app` 요청을 `index.html`로 fallback 처리.

#### 랜딩페이지 섹션

| 섹션 | 내용 |
|------|------|
| Nav | 스티키 + blur, 로고, 기능/화면미리보기/유튜브채널 링크, "지도 바로가기" CTA |
| Hero | 그라디언트 메시 bg + 도트 패턴, 헤드라인 + 밑줄 장식, CTA 2개, 플로팅 칩 3개, 폰 목업 |
| Features | 2×2 카드 그리드: 지도 / 후기 / 유튜브 연계 / 모임·이벤트 |
| Preview | 가로 스크롤 폰 스크린샷 6개 (이미지 없으면 플레이스홀더 자동 표시) |
| Channel | 유튜브 채널 소개 + 모의 영상 카드 |
| Final CTA | 보라 그라디언트 박스 + "지금 바로 찾아보기" 버튼 |
| Footer | 로고 + 서비스/채널 링크 + 저작권 |

#### 파일 구조

- `frontend/public/landing.html` — 순수 HTML/CSS 랜딩페이지 (Pretendard CDN)
- `frontend/nginx.conf` — `/` → `landing.html`, `/app` → React SPA
- `frontend/public/screenshots/` — 스크린샷 이미지 폴더 (별도 추가 필요)

#### SEO 설정

- `<title>`, `<meta description>`, `<meta name="keywords">` 설정
- Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) 설정
- `<link rel="canonical">` 설정
- 모바일 반응형 (900px / 600px 브레이크포인트)

#### 스크린샷 추가 방법 (수동)

`frontend/public/screenshots/` 폴더 생성 후 아래 파일명으로 저장:

| 파일명 | 내용 |
|--------|------|
| `hero.png` | Hero 영역 폰 목업용 |
| `screen-1.png` | 지도 + 근처 뽑기방 |
| `screen-2.png` | 스팟 상세 정보 |
| `screen-3.png` | 후기 모아보기 |
| `screen-4.png` | 유튜브 영상 연계 |
| `screen-5.png` | 구독자 이벤트 |
| `screen-6.png` | 마이페이지 |

이미지 없어도 자동 플레이스홀더 표시됨 (`onerror` 핸들링).

#### 잔여 작업 (🔜 예정)

| 작업 | 내용 | 상태 |
|------|------|------|
| 스크린샷 촬영 | 앱 화면 캡처 후 `frontend/public/screenshots/`에 저장 | 🔜 예정 |
| `.env` 수정 | `FRONTEND_URL=https://map.chanyeols.com/app` 변경 (OAuth 리다이렉트) | 🔜 예정 |
| 도커 재빌드 | `docker compose up -d --build` | 🔜 예정 (위 2개 완료 후) |

---

### Phase 21 — PWA (홈화면 설치 지원) (🔧 진행중)

#### 개요
별도 앱 설치 없이 브라우저에서 "홈화면에 추가"로 앱처럼 사용 가능. 주소창 없는 풀스크린, 앱 아이콘 표시.

#### 구현 완료

| 파일 | 내용 |
|------|------|
| `public/manifest.json` | 앱 이름·아이콘·테마컬러·`display: standalone`·`start_url: /app` |
| `public/sw.js` | 서비스 워커 — API 제외 캐싱, 오프라인 fallback |
| `public/icons/icon.svg` | 앱 아이콘 SVG 원본 (PNG 변환용) |
| `index.html` | manifest 링크, theme-color, iOS apple-mobile-web-app 메타태그 |
| `src/main.jsx` | 서비스 워커 등록 코드 추가 |

- 테마 컬러: `#7C3AED`
- 앱 이름: `오뽑세` / short_name: `오뽑세`
- 서비스 워커 전략: API·OAuth·uploads → 네트워크 전용 / 에셋 → 캐시 우선 / 네비게이션 → 네트워크 우선 + fallback

#### 잔여 작업 (🔜 예정)

| 작업 | 내용 |
|------|------|
| PNG 아이콘 생성 | `icon.svg` → PNG 변환 후 `public/icons/`에 저장 |
| `icon-192.png` | 192×192, 안드로이드 홈화면 아이콘 |
| `icon-512.png` | 512×512, 스플래시 스크린 |
| `icon-maskable-512.png` | 512×512, 안드로이드 어댑티브 아이콘 (로고 중앙 80% 이내) |

> PNG 변환: [squoosh.app](https://squoosh.app) 에 SVG 업로드 → PNG → 각 사이즈로 저장

---

### Phase 22 — Capacitor 앱 패키징 (스토어 출시)

#### 개요
기존 React 웹앱을 Capacitor로 래핑해 네이티브 앱(.apk / .ipa)으로 패키징. Google Play Store / App Store 등록.

#### 전제 조건
- Phase 21 PWA 완료 후 진행
- Google Play 개발자 계정 ($25, 1회)
- App Store 개발자 계정 ($99/년) — 선택

#### 구현 순서
1. `npm install @capacitor/core @capacitor/cli`
2. `npx cap init` — 앱 ID: `com.chanyeols.opobse`
3. `npm install @capacitor/android @capacitor/ios`
4. `npx cap add android` / `npx cap add ios`
5. `npm run build && npx cap sync`
6. Android Studio / Xcode로 빌드 후 스토어 제출

#### 주의사항
- 카카오맵 SDK: WebView 내 동작 — 추가 설정 불필요
- Google OAuth: `capacitor://` 스킴 허용 설정 필요 (Google Cloud Console)
- 앱 심사: 위치 권한 사용 목적 명시 필수
