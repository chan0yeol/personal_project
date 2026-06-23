---
title: "AI 블로그 자동화 첫 글 발행 후기 — Search Console 등록과 색인 현황"
date: 2026-04-14
tags: ["구글서치콘솔", "블로그운영", "애드센스", "SEO", "WordPress"]
meta_description: "AI 블로그 자동화 시스템으로 첫 글을 발행하고 Google Search Console에 등록한 과정과 색인 현황, 운영 소감을 공유합니다."
---

## 시스템 완성, 이제 운영이다

시스템 설계부터 WordPress 연동, Cloudflare 서브도메인 설정까지 모두 마쳤다. 남은 것은 실제로 글을 발행하고 검색 엔진에 알리는 것이다.

이 편에서는 Google Search Console 등록, 사이트맵 제출, 첫 글 발행 과정을 정리한다.

---

## Google Search Console 등록

Search Console에서 새 속성을 추가한다.

1. [search.google.com/search-console](https://search.google.com/search-console) 접속
2. `+ 속성 추가` → URL 접두어 → `https://blog.chanyeols.com`
3. 소유권 확인

이미 같은 구글 계정으로 상위 도메인(`chanyeols.com`)이 인증된 상태였기 때문에 소유권이 자동으로 확인됐다.

---

## 사이트맵 제출

WordPress는 기본적으로 사이트맵을 자동 생성한다.

```
https://blog.chanyeols.com/wp-sitemap.xml
```

이 URL을 Search Console → 사이트맵에 제출하면 된다. WordPress의 사이트맵은 인덱스 형식으로 하위 사이트맵 목록을 포함한다.

```xml
<!-- wp-sitemap.xml 구조 -->
wp-sitemap-posts-post-1.xml      (포스트)
wp-sitemap-posts-page-1.xml      (페이지)
wp-sitemap-taxonomies-category-1.xml  (카테고리)
wp-sitemap-taxonomies-post_tag-1.xml  (태그)
wp-sitemap-users-1.xml           (사용자)
```

제출 후 일부 하위 사이트맵이 "가져올 수 없음"으로 표시됐다. 당황했지만 Search Console이 순차적으로 크롤링하는 데 시간이 걸리는 것이었고, 잠시 후 새로고침하니 전부 정상 처리됐다.

---

## 첫 글 발행

마그네슘을 주제로 첫 번째 자동화 글을 발행했다.

**생성 과정:**
1. 메인 키워드: `마그네슘 효능`
2. 서브키워드 자동 추천: 하루 권장량, 음식, 부작용, 보충제, 결핍 증상
3. 개요 생성 후 검토
4. Solar Pro로 본문 생성 (Gemini가 일시적 503)
5. Pixabay에서 이미지 선택
6. WordPress에 즉시 발행

생성된 본문 품질이 만족스러웠다. 각 영양소별 mg 수치, 복용 시간, 흡수율 높은 형태까지 구체적으로 작성됐다. 이전에 llama 모델로 생성했을 때 한자가 섞이던 문제가 Solar 전환 후 해결됐다.

---

## AI 모델별 품질 비교 (직접 테스트)

같은 키워드로 모델별 출력을 비교했다.

| 모델 | 한국어 품질 | 수치 정확도 | 외국어 혼입 |
|------|-----------|------------|------------|
| Gemini 2.0 Flash | 최상 | 높음 | 없음 |
| Upstage Solar Pro | 상 | 높음 | 거의 없음 |
| Groq llama-3.3-70b | 중 | 보통 | 가끔 발생 |

Groq llama는 가끔 한자(`機能`, `男性`)나 러시아어가 섞여서 나온다. 외국어 감지 로직으로 걸러내지만, 2번 연속 실패하면 그냥 통과시키도록 설계돼 있어 가끔 깨진 글이 나올 수 있다. 최후 폴백으로만 쓰는 이유다.

---

## 운영 계획

**발행 주기**
하루 1~2개를 목표로 한다. 몰아서 많이 올리면 구글이 스팸으로 의심할 수 있다.

**주제 선정**
건강·영양 키워드 중 검색 수요가 높은 것을 우선으로 한다.

```
# 성분별
마그네슘, 비타민D, 오메가3, 루테인, 유산균

# 대상별
50대 영양제, 임산부 영양제, 남성 영양제

# 비교/추천
종합비타민 비교, 단백질 보충제 차이
```

**애드센스 신청 시점**
글이 15~20개 쌓이고 트래픽이 생기기 시작하면 신청할 계획이다. blog.chanyeols.com은 구글 계정과 연결된 도메인이라 심사에 유리할 것으로 기대한다.

---

## 마치며

키워드 입력부터 WordPress 발행까지 한 사이클을 돌려보니 실제로 5~10분이면 글 하나가 완성된다. 검토와 수정에 추가 시간이 들지만, 기존에 처음부터 쓰던 것과 비교하면 압도적으로 빠르다.

앞으로는 실제 트래픽 데이터와 애드센스 승인 여부를 공유할 예정이다. 자동화 시스템으로 운영하는 블로그가 실제로 수익이 되는지, 그 과정을 솔직하게 기록하겠다.

---

**📸 이미지 캡처 목록**
1. Google Search Console — `blog.chanyeols.com` 속성 등록 완료 화면
2. Search Console 사이트맵 제출 완료 화면 (성공 상태)
3. 자동화 시스템 Step 5 발행 완료 화면 (WordPress URL 반환)
4. 실제 발행된 첫 글 (`https://blog.chanyeols.com/...`) 화면
5. WordPress 관리자 → 글 목록 화면
