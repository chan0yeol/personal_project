# Blog Scheduler Agent Project

Claude Code 구독 기반 자동 블로그 초안 생성 + WordPress 발행 시스템  
외부 AI API 키 불필요 — Pixabay + WordPress 크리덴셜만 필요

---

## 기존 시스템(PROJECT.md)과의 관계

| 항목 | 기존 웹 UI | 스케줄러 에이전트 |
|------|-----------|----------------|
| 목적 | 수동 작성 (검수 강화) | 자동 초안 생성 (검수 후 발행) |
| AI | Gemini / Solar / Groq API | Claude Code 구독 |
| 실행 | 사람이 브라우저에서 | 매일 새벽 02:00 KST 자동 |
| 키워드 | 사람이 직접 입력 | Claude가 WordPress 기존 포스트 조회 후 자동 선택 |
| 이미지 | 사람이 Pixabay에서 선택 | 섹션별 서브키워드로 자동 검색 + WP 업로드 + 삽입 |
| 발행 | 즉시 발행 or 임시저장 | 항상 임시저장(draft) → 사람이 검수 후 발행 |

> 두 시스템은 독립적으로 공존. 기존 웹 UI는 그대로 유지.

---

## 아키텍처

```
Claude Code 스케줄러 (매일 02:00 KST = 17:00 UTC)
    │
    ├─ Step 1.  WordPress 기존 포스트 조회
    │           → 메인 키워드 + 서브키워드 5개 자동 선택 (중복 방지)
    │
    ├─ Step 2.  도입부 작성 (1000~1400자)
    │           → 서브키워드1 활용, 외부 링크 1개
    │
    ├─ Step 3.  섹션1 작성 + 이미지 — 효능/특징 (1200~1500자)
    │           → 서브키워드1,2 활용
    │           → Pixabay 검색 → WP 미디어 업로드 → 섹션 끝에 삽입
    │
    ├─ Step 4.  섹션2 작성 + 이미지 — 복용법 (1200~1500자)
    │           → 서브키워드3 활용, 연령별 표 필수
    │           → Pixabay 검색 → WP 미디어 업로드 → 섹션 끝에 삽입
    │
    ├─ Step 5.  섹션3 작성 + 이미지 — 부작용/주의사항 (1000~1200자)
    │           → 서브키워드4 활용, 외부 링크 1개
    │           → Pixabay 검색 → WP 미디어 업로드 → 섹션 끝에 삽입
    │
    ├─ Step 6.  섹션4 작성 + 이미지 — 추천/선택법 (1000~1200자)
    │           → 서브키워드5 활용
    │           → Pixabay 검색 → WP 미디어 업로드 → 섹션 끝에 삽입
    │
    ├─ Step 7.  FAQ + 마치며 작성 (800~1000자)
    │
    ├─ Step 8.  대표 이미지 업로드
    │           → 메인 키워드 영어 번역 → Pixabay → WP 미디어 업로드
    │
    ├─ Step 9.  전체 본문 조립 + HTML 변환
    │           → 6000자 미만이면 최단 섹션 보강
    │
    ├─ Step 10. WordPress 임시저장(draft) 발행
    │           → RankMath 메타 자동 주입
    │
    └─ Step 11. 완료 보고 출력
```

---

## 이미지 전략 (섹션별 삽입)

| 이미지 | 검색 키워드 | 삽입 위치 |
|--------|-----------|---------|
| 대표 이미지 | 메인 키워드 (영어) | featured_media |
| 섹션1 이미지 | 서브키워드1 (영어) | 효능 섹션 끝 |
| 섹션2 이미지 | 서브키워드3 (영어) | 복용법 섹션 끝 |
| 섹션3 이미지 | 서브키워드4 (영어) | 부작용 섹션 끝 |
| 섹션4 이미지 | 서브키워드5 (영어) | 추천 섹션 끝 |

- 모든 이미지 WordPress 미디어 라이브러리 업로드 (자체 호스팅)
- 업로드 실패 시 Pixabay largeImageURL 직접 사용 (fallback)
- `<figure><img/><figcaption>` 형태

---

## 키워드 전략

- Claude가 WordPress REST API로 기존 포스트 전체 조회
- 기존 제목과 겹치지 않는 메인 키워드 자동 선택
- 메인 키워드 기반 서브키워드 5개 자동 생성
- 카테고리: 성분별 효능 / 연령·대상별 추천 / 브랜드 비교 / 복용법 / 부작용 / 조합 궁합

---

## SEO 규칙 (RankMath 그린 목표)

```
1. 도입부 첫 문장에 메인 키워드 포함
2. H2 소제목 최소 2개에 메인 키워드 포함
3. 키워드 밀도 1~1.5% (8~12회)
4. 외부 링크 2개 (식약처, 보건복지부 등 공식 URL)
5. 내부 링크 2개 (https://blog.chanyeols.com/?s=키워드 형식)
6. 메타 설명: 메인 키워드로 시작, 140~155자, CTA 포함
7. 표(table) 1개 이상 (연령별 권장량)
8. FAQ 섹션 1개 (질문 3개 + 답변)
9. 한 문장 20단어 이내, 한 문단 3~4문장 이내
10. 최소 6000자
```

---

## RankMath 메타 자동 주입

```json
{
  "status": "draft",
  "meta": {
    "rank_math_focus_keyword": "메인 키워드",
    "rank_math_title": "포스트 제목",
    "rank_math_description": "메타 설명 140~155자"
  },
  "excerpt": "메타 설명"
}
```

---

## 스케줄러 정보

| 항목 | 내용 |
|------|------|
| Trigger ID | trig_01CTDnzMEG2ND5YTUwhqMrL9 |
| 실행 시간 | 매일 02:00 KST (17:00 UTC) |
| 모델 | claude-sonnet-4-6 |
| 환경 | Anthropic Cloud (CCR) |
| 관리 페이지 | https://claude.ai/code/scheduled/trig_01CTDnzMEG2ND5YTUwhqMrL9 |

---

## 사용자 워크플로우

```
매일 02:00 KST 스케줄러 자동 실행
    │
    └─ 아침에 https://blog.chanyeols.com/wp-admin 접속
            → 글 → 임시글 목록
            → 글 내용 검수 (2~3분)
            → 이미지 확인 (마음에 안 들면 클릭 → 교체)
            → [발행] 클릭
```

---

## 환경 변수 (스케줄러용)

| 항목 | 값 |
|------|---|
| WordPress URL | https://blog.chanyeols.com |
| WordPress User | chanyeol |
| WP App Password | npzM bKme Cgwm BsdL 741z 489Q |
| Pixabay API Key | 55327116-b6963a5974d3d14240e40a71e |

> AI API 키 불필요 — Claude Code 구독으로 동작

---

*Last Updated: 2026-04-16*
