# 브라우저 캐시 vs 서버 캐시 ​

브라우저 캐시와 서버 캐시의 차이를 명확히 이해하고 상황에 맞는 대처 방법을 배웁니다.

## 개요 ​

개발자는 종종 브라우저 캐시와 서버 캐시를 혼동. 특히 SAP 배경의 개발자나 웹 개발이 처음인 개발자는 이 둘의 차이를 명확히 알지 못해 잘못된 조치를 취하곤 합니다.

### 일반적인 혼동 사례 ​

javascript```
// ❌ SAP 개발자의 흔한 실수
"WEB_DATA를 수정했는데 Ctrl+F5를 눌러도 안 바뀌어요"
→ WEB_DATA는 서버 캐시이므로 브라우저 새로고침으로는 해결 안 됨

// ❌ 신규 웹 개발자의 흔한 실수
"JS 파일을 수정했는데 서버 캐시를 클리어해야 하나요?"
→ JS 파일은 브라우저 캐시이므로 Ctrl+F5로 해결 가능```
## 브라우저 캐시 (Browser Cache) ​

### 정의 ​

브라우저가 **사용자의 로컬 컴퓨터**에 저장하는 정적 파일들의 캐시.

### 캐시되는 항목 ​

plaintext```
✅ JavaScript 파일 (.js)
✅ CSS 파일 (.css)
✅ 이미지 파일 (.png, .jpg, .gif, .svg)
✅ 폰트 파일 (.woff, .woff2, .ttf)
✅ 아이콘 파일 (.ico)

❌ WEB_DATA (서버 데이터)
❌ Named Service 응답 (서버 데이터)
❌ SAP RFC 메타데이터 (서버 데이터)```
### 저장 위치 ​

plaintext```
브라우저별 캐시 저장 위치:

Chrome:
C:\Users\{사용자명}\AppData\Local\Google\Chrome\User Data\Default\Cache

Edge:
C:\Users\{사용자명}\AppData\Local\Microsoft\Edge\User Data\Default\Cache

Firefox:
C:\Users\{사용자명}\AppData\Local\Mozilla\Firefox\Profiles\{프로필}\cache2```
### 캐시 확인 방법 ​

javascript```
// 1. 개발자 도구 열기 (F12)
// 2. Network 탭 선택
// 3. 페이지 새로고침 (F5)

// 캐시 사용 여부 확인:
// Status: (disk cache) → 브라우저 캐시에서 로드
// Status: 200 → 서버에서 새로 다운로드
// Status: 304 → 서버 확인 후 캐시 사용 (변경 없음)```
### 클리어 방법 ​

#### 방법 1: 강력 새로고침 ​

plaintext```
Windows: Ctrl + F5 또는 Ctrl + Shift + R
Mac: Cmd + Shift + R

✅ 장점: 빠르고 간편
❌ 단점: 현재 페이지만 적용```
#### 방법 2: 개발자 도구에서 캐시 비활성화 ​

javascript```
// 1. F12 → Network 탭
// 2. "Disable cache" 체크박스 선택
// 3. 개발자 도구가 열려있는 동안에만 캐시 무효화

// ✅ 장점: 개발 중 편리
// ❌ 단점: 개발자 도구를 닫으면 다시 캐시 활성화```
#### 방법 3: 브라우저 설정에서 전체 캐시 삭제 ​

plaintext```
Chrome:
설정 → 개인정보 및 보안 → 인터넷 사용 기록 삭제 → 캐시된 이미지 및 파일

✅ 장점: 모든 사이트의 캐시 삭제
❌ 단점: 모든 사이트에서 파일 재다운로드 필요 (느림)```
### 캐시 제어 헤더 ​

UniWORKS는 다음과 같이 브라우저 캐시를 제어합니다:

javascript```
// HTML에서 requireBust 파라미터 사용
script src="/webjars/unidocu-ui/$u.js?bust=1706599123456">script>
link href="/webjars/unidocu-ui/css/unidocu.css?bust=1706599123456" rel="stylesheet">

// bust 값이 변경되면 브라우저는 새 파일로 인식하여 다시 다운로드
// requireBust = 현재 시각 (밀리초 타임스탬프)```
## 서버 캐시 (Server Cache) ​

### 정의 ​

서버가 **서버의 메모리**에 저장하는 데이터의 캐시.

### 캐시되는 항목 ​

plaintext```
✅ WEB_DATA (화면 설정 데이터)
   - Grid 설정 (gridSetting)
   - Form 설정 (formSetting)
   - Button 설정 (buttonSetting)
   - Program 설정 (programSetting)

✅ SAP RFC 메타데이터
   - 테이블 구조 정보
   - Function Module 메타데이터
   - Destination 정보

✅ Named Service 캐시 데이터
   - n_service_cache_key로 명시한 응답

✅ 시스템 설정
   - System Properties
   - 사용자 권한 정보

❌ JavaScript 파일 (브라우저 캐시)
❌ CSS 파일 (브라우저 캐시)
❌ 이미지 파일 (브라우저 캐시)```
### 저장 위치 ​

java```
// 서버의 JVM 메모리
// 개발자가 직접 접근 불가 (서버 코드에서만 접근 가능)

// 예: WEB_DATA 캐시
$u.webData.cache = {
    'gridSetting@GRID_ID': { ... },
    'formSetting@FORM_ID': { ... }
};```
### 캐시 확인 방법 ​

javascript```
// 브라우저에서 직접 확인은 불가능
// 간접적인 확인 방법:

// 1. Console에서 webDataCacheBust 값 확인
console.log(staticProperties.webDataCacheBust);
// 출력: "1706599123456"

// 2. Network 탭에서 Ajax 요청의 파라미터 확인
// Request Payload:
// {
//   "webDataCacheBust": "1706599123456",
//   "requireBust": "1706599123456",
//   ...
// }```
### 클리어 방법 ​

#### 방법 1: Debug 화면에서 클리어 ​

plaintext```
1. Debug 화면 접속 (/debug/view)
2. "캐시 관리" 섹션 찾기
3. "모든 캐시 클리어" 버튼 클릭

✅ 장점: 가장 확실한 방법
❌ 단점: Debug 화면 접근 권한 필요```
#### 방법 2: Named Service 직접 호출 ​

javascript```
// CacheCheck Named Service 호출
$nst.is_data_os_data('CacheCheck', {mode: 'clearWebData'}, (os_data) => {
    console.log('WebData 캐시 클리어 완료');
    console.log('새 webDataCacheBust:', os_data['webDataCacheBust']);
});

// 또는 모든 캐시 클리어
$u.clearAllCache((message, requireBust, webDataCacheBust) => {
    console.log(message);
    console.log('새 requireBust:', requireBust);
    console.log('새 webDataCacheBust:', webDataCacheBust);
});```
#### 방법 3: WEB_DATA 수정 시 자동 클리어 ​

javascript```
// WEB_DATA를 수정하면 자동으로 webDataCacheBust가 갱신됨
$u.webData.createOrModifySingle('gridSetting', 'GRID_ID', data, () => {
    // 이 콜백이 호출될 때 이미 webDataCacheBust가 갱신된 상태
    console.log('WEB_DATA 저장 및 캐시 자동 갱신 완료');
});```
### 캐시 제어 메커니즘 ​

java```
// CacheCheckService.java에서 관리

// 1. webDataCacheBust 생성
private static String webDataCacheBust = String.valueOf(System.currentTimeMillis());

// 2. 클라이언트 요청마다 검증
// 클라이언트가 보낸 webDataCacheBust와 서버의 webDataCacheBust 비교
if (!clientWebDataCacheBust.equals(serverWebDataCacheBust)) {
    throw new WebDataCacheBustMismatchException();
}

// 3. Exception 발생 시 클라이언트 처리
// → 페이지 자동 새로고침 → 새 webDataCacheBust로 재요청```
## 비교표 ​

| 구분 | 브라우저 캐시 | 서버 캐시 |
| 저장 위치 | 사용자 PC | 서버 메모리 |
| 캐시 대상 | JS, CSS, 이미지 등 정적 파일 | WEB_DATA, SAP 메타데이터 등 |
| 관리 방식 | requireBust 파라미터 | webDataCacheBust 파라미터 |
| 클리어 방법 | Ctrl + F5 | Debug 화면 또는 Named Service |
| 클리어 범위 | 본인만 (로컬) | 모든 사용자 (서버) |
| 확인 방법 | F12 → Network 탭 | Console에서 변수 확인 |
| 자동 갱신 | requireBust 변경 시 | webDataCacheBust 변경 시 |
## 실전 시나리오 ​

### 시나리오 1: JS 파일 배포 ​

javascript```
// 상황: 새로운 기능을 추가한 JS 파일을 배포

// ❌ 잘못된 접근
"서버에 파일을 올렸는데 변경사항이 안 보여요"
"Debug 화면에서 캐시를 클리어했는데도 안 돼요"

// ✅ 올바른 접근
"JS 파일은 브라우저 캐시이므로 requireBust를 갱신해야 합니다"

// 해결 방법:
// 1. Debug 화면 → "모든 캐시 클리어" (requireBust 갱신됨)
// 2. 사용자들은 다음 페이지 로드 시 자동으로 새 JS 파일 다운로드
// 3. 또는 사용자가 Ctrl + F5로 강제 새로고침```
### 시나리오 2: Grid 설정 변경 ​

javascript```
// 상황: WEB_DATA에서 Grid 컬럼 순서를 변경

// ❌ 잘못된 접근
"WEB_DATA를 수정했는데 Ctrl + F5를 눌러도 이전 설정이 나와요"

// ✅ 올바른 접근
"WEB_DATA는 서버 캐시이므로 자동으로 캐시가 갱신됩니다"

// 동작 방식:
// 1. WEB_DATA 수정 시 webDataCacheBust 자동 갱신
// 2. 다음 페이지 로드 시 클라이언트가 이전 webDataCacheBust로 요청
// 3. 서버가 WebDataCacheBustMismatchException 던짐
// 4. 클라이언트가 자동으로 페이지 새로고침
// 5. 새 webDataCacheBust로 재요청 → 새 설정 로드```
### 시나리오 3: 혼합 상황 ​

javascript```
// 상황: JS 파일도 수정하고 WEB_DATA도 수정

// ✅ 올바른 절차
// 1. 서버에 새 JS 파일 배포
// 2. WEB_DATA 수정 (자동으로 webDataCacheBust 갱신)
// 3. Debug 화면에서 "모든 캐시 클리어" (requireBust도 갱신)
// 4. 사용자의 다음 페이지 로드 시:
//    - 새 requireBust로 인해 새 JS 파일 다운로드
//    - 새 webDataCacheBust로 인해 새 WEB_DATA 로드```
### 시나리오 4: 일부 사용자만 문제 발생 ​

javascript```
// 상황: A 사용자는 정상, B 사용자는 오류 발생

// 진단:
"일부 사용자만 문제가 있다 = 브라우저 캐시 문제"

// 해결:
"해당 사용자만 Ctrl + F5로 브라우저 캐시 클리어"

// 이유:
// 서버 캐시는 모든 사용자가 공유하므로
// 일부만 문제가 있다면 브라우저 캐시가 원인```
### 시나리오 5: 모든 사용자가 문제 발생 ​

javascript```
// 상황: 모든 사용자가 동일한 문제 발생

// 진단:
"모든 사용자가 문제 = 서버 캐시 또는 코드 오류"

// 해결 순서:
// 1. Debug 화면에서 서버 캐시 클리어
// 2. 여전히 문제 발생 → 코드 자체의 오류```
## SAP 개발자를 위한 가이드 ​

SAP 개발자는 웹 개발 경험이 적어 캐시 개념이 낯설 수 있습니다.

### SAP vs 웹의 캐시 차이 ​

| SAP | 웹 (UniWORKS) |
| SE11로 테이블 구조 변경 → 즉시 반영 | JS 파일 변경 → 브라우저 캐시 클리어 필요 |
| SE37로 Function 수정 → 즉시 반영 | WEB_DATA 수정 → 서버 캐시 자동 갱신 |
| SAP 버퍼 클리어: /$TAB | 서버 캐시 클리어: Debug 화면 |
| 사용자별 버퍼 없음 | 사용자별 브라우저 캐시 존재 |
### SAP 개발자의 체크리스트 ​

javascript```
// ✅ SAP 개발자가 기억해야 할 것

// 1. WEB_DATA는 SAP 버퍼와 유사 (서버 메모리)
//    → 수정 시 자동 갱신되지만 확인 필요

// 2. JS 파일은 SAP의 INCLUDE와 다름
//    → 각 사용자의 PC에 캐시됨

// 3. "즉시 반영"이 안 되는 것이 정상
//    → 캐시로 인한 지연은 성능 향상을 위한 trade-off

// 4. Ctrl + F5는 "본인만" 클리어
//    → 다른 사용자는 영향 없음

// 5. Debug 화면 캐시 클리어는 "모든 사용자" 영향
//    → 신중하게 수행```
## 자가 진단 체크리스트 ​

문제 발생 시 다음 체크리스트를 따르세요:

javascript```
// [ ] 1. 어떤 파일/데이터를 수정했나요?
//     - JS/CSS/이미지 → 브라우저 캐시
//     - WEB_DATA → 서버 캐시
//     - SAP 테이블 → 서버 캐시 (필요시)

// [ ] 2. 누구에게 문제가 발생하나요?
//     - 본인만 → 브라우저 캐시 (Ctrl + F5)
//     - 모든 사용자 → 서버 캐시 또는 코드 오류

// [ ] 3. F12 → Console에 에러가 있나요?
//     - JS 에러 → 브라우저 캐시 또는 코드 오류
//     - WebDataCacheBustMismatchException → 자동 해결됨

// [ ] 4. F12 → Network에서 파일 Status는?
//     - (disk cache) → 브라우저 캐시에서 로드
//     - 200 → 서버에서 새로 다운로드
//     - 304 → 서버 확인 후 캐시 사용

// [ ] 5. 캐시 클리어 후에도 문제가 지속되나요?
//     - Yes → 코드 자체의 오류
//     - No → 캐시 문제였음 (해결됨)```
## ⚠️ 주의사항 ​

개발자는 다음 사항에 유의해야 합니다:

- 브라우저 캐시 클리어는 본인에게만 영향을 줍니다
- 서버 캐시 클리어는 모든 사용자에게 영향을 줍니다
- Ctrl + F5는 현재 페이지의 리소스만 새로고침합니다
- WEB_DATA 수정 시 자동으로 캐시가 갱신되므로 추가 조치 불필요
- 운영 서버에서 서버 캐시 클리어는 성능 영향을 고려하여 신중히 수행
- 캐시 클리어 후에도 문제가 지속되면 코드 자체의 오류를 확인하세요

## 다음 단계 ​

- 캐시 클리어 가이드 - 상황별 상세 조치 방법
- 캐시 버스팅 전략 - requireBust와 webDataCacheBust의 작동 원리

## 📖 참고 자료 ​

- MDN - HTTP 캐싱
- Chrome DevTools - 캐시 이해하기