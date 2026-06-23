# 캐시 클리어 가이드 ​

상황별로 어떤 캐시를 클리어해야 하는지 명확한 가이드를 제공.

## 개요 ​

개발자는 다양한 상황에서 캐시 문제를 마주하게 됩니다. 이 문서는 **증상별로** 어떤 캐시를 클리어해야 하는지 명확한 가이드를 제공.

## 빠른 참조표 ​

| 증상 | 클리어할 캐시 | 방법 |
| JS 파일 수정 후 반영 안 됨 | 브라우저 캐시 | Ctrl + F5 |
| CSS 스타일 변경 안 됨 | 브라우저 캐시 | Ctrl + F5 |
| WEB_DATA 수정 후 반영 안 됨 | 자동 처리됨 | 페이지 새로고침만 |
| Grid 설정 변경 안 됨 | 자동 처리됨 | 페이지 새로고침만 |
| SAP 테이블 구조 변경 | 서버 캐시 | Debug 화면 |
| Function Module 수정 | 서버 캐시 | Debug 화면 |
| 권한 변경 안 됨 | 서버 캐시 | Debug 화면 |
| 일부 사용자만 오류 | 브라우저 캐시 | 해당 사용자 Ctrl + F5 |
| 모든 사용자 오류 | 서버 캐시 | Debug 화면 |
## 상황별 상세 가이드 ​

### 상황 1: JavaScript 파일 수정 ​

#### 증상 ​

javascript```
// 코드를 수정했는데 변경사항이 반영되지 않음
// Console에서 이전 코드가 실행됨
// 분명 수정했는데 에러가 그대로 발생```
#### 원인 ​

javascript```
// 브라우저가 이전 JS 파일을 캐시하고 있음
// requireBust 값이 변경되지 않아 브라우저가 캐시된 파일 사용```
#### 해결 방법 ​

**개발자 본인:**

plaintext```
방법 1: Ctrl + F5 (강력 새로고침)
✅ 가장 빠른 방법
✅ 즉시 효과

방법 2: F12 → Network → Disable cache 체크
✅ 개발 중에는 이 방법이 편리
⚠️ 개발자 도구를 닫으면 다시 캐시 활성화```
**다른 사용자들도 동일한 문제:**

javascript```
// 서버에서 requireBust를 갱신해야 함

// Debug 화면 접속
// → "모든 캐시 클리어" 버튼 클릭
// → requireBust가 새 타임스탬프로 갱신됨
// → 모든 사용자가 다음 페이지 로드 시 새 JS 파일 다운로드

// 또는 코드로:
$u.clearAllCache((message, requireBust, webDataCacheBust) => {
    console.log('requireBust 갱신:', requireBust);
});```
#### 확인 방법 ​

javascript```
// F12 → Network 탭 열기
// Ctrl + F5
// JS 파일 찾기 (예: $u.js)

// Status 확인:
// ✅ 200: 서버에서 새로 다운로드됨 (성공)
// ❌ 304: 캐시 사용 (여전히 캐시 문제)
// ❌ (disk cache): 브라우저 캐시 사용 (다시 Ctrl + F5)

// 파일 내용 확인:
// JS 파일 클릭 → Response 탭 → 수정한 코드가 있는지 확인```
### 상황 2: CSS 스타일 변경 ​

#### 증상 ​

css```
/* CSS 파일을 수정했는데 스타일이 변경되지 않음 */
/* 색상, 레이아웃 등이 이전 상태 그대로 */```
#### 원인 ​

javascript```
// 브라우저가 이전 CSS 파일을 캐시하고 있음```
#### 해결 방법 ​

plaintext```
JS 파일과 동일한 방법:
1. Ctrl + F5
2. 또는 서버에서 requireBust 갱신 (Debug 화면)```
#### 확인 방법 ​

javascript```
// F12 → Network 탭
// Ctrl + F5
// CSS 파일 찾기 (예: unidocu.css)
// Response 탭에서 수정한 스타일이 있는지 확인```
### 상황 3: WEB_DATA 수정 ​

#### 증상 ​

javascript```
// Grid 설정을 WEB_DATA에서 변경
// 컬럼 순서, 컬럼명, 필드 타입 등을 수정
// Ctrl + F5를 눌러도 이전 설정이 나옴```
#### 원인 ​

javascript```
// WEB_DATA는 서버 메모리에 캐시됨
// Ctrl + F5는 브라우저 캐시만 클리어하므로 효과 없음```
#### 해결 방법 ​

javascript```
// ✅ 대부분의 경우: 아무 조치도 필요 없음!

// WEB_DATA를 수정하면:
// 1. 서버의 webDataCacheBust가 자동으로 갱신됨
// 2. 클라이언트가 다음 요청 시 이전 webDataCacheBust를 보냄
// 3. 서버가 불일치를 감지하고 WebDataCacheBustMismatchException 던짐
// 4. 클라이언트가 자동으로 페이지 새로고침
// 5. 새 webDataCacheBust로 재요청 → 새 WEB_DATA 로드

// 즉시 확인하고 싶다면:
location.reload(); // 페이지 새로고침```
#### 수동으로 클리어하려면 ​

javascript```
// Debug 화면 접속
// → "WebData 캐시 클리어" 버튼 클릭

// 또는 코드로:
$nst.is_data_os_data('CacheCheck', {mode: 'clearWebData'}, (os_data) => {
    console.log('새 webDataCacheBust:', os_data['webDataCacheBust']);
    location.reload();
});```
#### 확인 방법 ​

javascript```
// Console에서 webDataCacheBust 값 확인
console.log('현재:', staticProperties.webDataCacheBust);

// WEB_DATA 수정 후
console.log('수정 후:', staticProperties.webDataCacheBust);
// → 값이 변경되었는지 확인

// 또는 Grid 데이터 확인:
const gridObj = $u.gridWrapper.getGrid();
console.log('Grid Headers:', gridObj.getGridHeaders());
// → 수정한 컬럼 설정이 반영되었는지 확인```
### 상황 4: SAP 테이블 구조 변경 ​

#### 증상 ​

javascript```
// SAP에서 테이블에 필드를 추가/삭제
// UniWORKS에서 여전히 이전 구조로 인식
// Grid에 새 컬럼이 나타나지 않음```
#### 원인 ​

javascript```
// SAP RFC 메타데이터가 서버 메모리에 캐시됨
// JCO (Java Connector) 캐시```
#### 해결 방법 ​

javascript```
// Debug 화면 접속
// → "모든 캐시 클리어" 버튼 클릭

// 이것이 클리어하는 항목:
// - WEB_DATA 캐시
// - JCO (SAP RFC) 캐시
// - 시스템 속성 캐시
// - Destination Repository 캐시

// 또는 코드로:
$u.clearAllCache((message) => {
    console.log(message); // "all cache cleared"
});```
#### 확인 방법 ​

javascript```
// SAP에서 변경한 필드가 제대로 인식되는지 확인
// Named Service 호출 → 응답 데이터 확인

$nst.is_data_ot_data('YOUR_FUNCTION', {}, (data) => {
    console.log('응답 데이터:', data);
    // 새 필드가 포함되어 있는지 확인
});```
### 상황 5: Function Module 파라미터 변경 ​

#### 증상 ​

javascript```
// SAP Function Module의 Import/Export/Table 파라미터 변경
// UniWORKS에서 여전히 이전 구조로 호출
// "parameter not found" 오류 발생```
#### 원인 ​

javascript```
// Function Module의 메타데이터가 서버에 캐시됨```
#### 해결 방법 ​

javascript```
// SAP 테이블 구조 변경과 동일:
// Debug 화면 → "모든 캐시 클리어"

// ⚠️ 주의: Function Module의 Signature가 변경되면
// 호출하는 코드도 함께 수정해야 합니다!```
### 상황 6: 권한 변경이 반영 안 됨 ​

#### 증상 ​

javascript```
// 사용자 권한을 변경 (버튼 권한, 메뉴 권한 등)
// 여전히 이전 권한으로 동작```
#### 원인 ​

javascript```
// 사용자 정보가 서버 세션에 캐시됨```
#### 해결 방법 ​

javascript```
// 방법 1: 해당 사용자 로그아웃 후 재로그인
// ✅ 가장 확실한 방법
// 세션이 새로 생성되면서 권한 정보도 갱신됨

// 방법 2: 서버 캐시 클리어
// Debug 화면 → "모든 캐시 클리어"

// 방법 3: 페이지 새로고침
// 일부 권한은 페이지 로드 시 다시 조회됨
location.reload();```
### 상황 7: 일부 사용자만 문제 발생 ​

#### 증상 ​

javascript```
// A 사용자: 정상 동작
// B 사용자: JS 오류 발생 또는 화면 깨짐
// C 사용자: 정상 동작```
#### 원인 ​

javascript```
// B 사용자만 브라우저 캐시에 문제가 있는 파일 보유
// 서버 캐시라면 모든 사용자가 동일한 문제를 겪음```
#### 해결 방법 ​

javascript```
// 문제가 있는 사용자(B)만:
// Ctrl + F5 (브라우저 캐시 클리어)

// ✅ 다른 사용자는 조치 불필요
// ✅ 서버 캐시 클리어 불필요```
### 상황 8: 모든 사용자가 동일한 문제 ​

#### 증상 ​

javascript```
// 모든 사용자가 동일한 시간에 동일한 오류 발생
// 특정 기능이 모두에게 작동하지 않음```
#### 원인 ​

javascript```
// 1. 서버 캐시 문제
// 2. 또는 코드 자체의 오류```
#### 해결 방법 ​

javascript```
// 1단계: 서버 캐시 클리어
// Debug 화면 → "모든 캐시 클리어"

// 2단계: 여전히 문제 발생?
// → 코드 자체의 오류일 가능성 높음
// → F12 Console에서 에러 메시지 확인
// → 해당 코드 수정 필요```
### 상황 9: 개발 중 캐시 때문에 혼란 ​

#### 증상 ​

javascript```
// 코드를 수정할 때마다 Ctrl + F5를 눌러야 함
// 매번 새로고침하는 것이 번거로움```
#### 해결 방법 ​

javascript```
// 개발자 도구에서 캐시 완전 비활성화

// 1. F12 (개발자 도구 열기)
// 2. Network 탭 선택
// 3. "Disable cache" 체크박스 선택
// 4. 개발자 도구를 열어둔 채로 개발

// ✅ 장점: 새로고침할 때마다 항상 최신 파일 로드
// ⚠️ 주의: 개발자 도구를 닫으면 다시 캐시 활성화
// ⚠️ 주의: 성능이 느려질 수 있음 (항상 서버에서 다운로드)```
### 상황 10: 운영 환경 배포 ​

#### 증상 ​

javascript```
// 운영 서버에 새 버전 배포
// 사용자들이 여전히 이전 버전 사용```
#### 해결 방법 ​

javascript```
// ⚠️ 운영 환경에서는 신중하게!

// 방법 1: requireBust 갱신 (권장)
// Debug 화면 → "모든 캐시 클리어"
// → requireBust가 갱신되어 모든 사용자가 새 파일 다운로드

// 방법 2: 점진적 배포
// 1. 새 JS 파일만 먼저 배포 (requireBust는 아직 갱신 안 함)
// 2. 일부 테스터에게 Ctrl + F5로 테스트 요청
// 3. 문제없으면 requireBust 갱신
// 4. 모든 사용자에게 자동 배포

// 방법 3: 공지 후 배포
// 1. 사용자들에게 특정 시간에 배포 예정 공지
// 2. 배포 시간에 requireBust 갱신
// 3. 사용자들에게 페이지 새로고침 안내```
## 코드로 캐시 클리어하기 ​

### 브라우저 캐시 클리어 (페이지 새로고침) ​

javascript```
// 일반 새로고침
location.reload();

// 강력 새로고침 (캐시 무시)
location.reload(true); // 구형 브라우저에서만 동작
// 최신 브라우저에서는 Ctrl + F5를 사용해야 함```
### 서버 캐시 클리어 ​

javascript```
// WEB_DATA 캐시만 클리어
$nst.is_data_os_data('CacheCheck', {mode: 'clearWebData'}, (os_data) => {
    staticProperties.webDataCacheBust = os_data['webDataCacheBust'];
    $u.webData.cache = {}; // 클라이언트 측 캐시도 비움
    console.log('WebData 캐시 클리어 완료');
});

// 모든 캐시 클리어 (WEB_DATA + JCO + System Properties)
$u.clearAllCache((message, requireBust, webDataCacheBust) => {
    console.log(message);
    console.log('새 requireBust:', requireBust);
    console.log('새 webDataCacheBust:', webDataCacheBust);
});

// 또는 직접 CacheCheck 호출
$nst.is_data_os_data('CacheCheck', {mode: 'clearAll'}, (os_data) => {
    staticProperties.requireBust = os_data['requireBust'];
    staticProperties.webDataCacheBust = os_data['webDataCacheBust'];
    console.log('모든 캐시 클리어 완료');
});```
### 캐시 클리어 후 페이지 새로고침 ​

javascript```
// 캐시 클리어 + 자동 새로고침
$u.clearAllCache((message) => {
    console.log(message);
    location.reload();
});```
## Debug 화면 사용법 ​

### Debug 화면 접속 ​

plaintext```
URL: https://{your-server}/debug/view

⚠️ 주의: Debug 화면은 관리자 권한이 필요할 수 있습니다.```
### 캐시 클리어 버튼 위치 ​

plaintext```
Debug 화면 → 왼쪽 메뉴 → "캐시 관리"

버튼:
1. "WebData 캐시 클리어": WEB_DATA만 클리어
2. "모든 캐시 클리어": 모든 서버 캐시 클리어 (requireBust도 갱신)```
### 클러스터 환경에서 주의사항 ​

javascript```
// UniWORKS가 여러 서버(클러스터)로 구성된 경우:
// Debug 화면에서 캐시 클리어 시 모든 서버에 자동 전파됨

// 코드 확인 (CacheCheckService.java):
// callRemoteClearAll() 메서드가
// 설정된 모든 서버에 캐시 클리어 요청을 보냄```
## 트러블슈팅 플로우차트 ​

plaintext```
문제 발생
    ↓
어떤 파일/데이터를 수정했나?
    ↓
    ├─ JS/CSS/이미지
    │   ↓
    │   누구에게 문제?
    │   ↓
    │   ├─ 본인만 → Ctrl + F5
    │   └─ 모든 사용자 → Debug 화면 (requireBust 갱신)
    │
    ├─ WEB_DATA
    │   ↓
    │   페이지 새로고침만 (자동 처리됨)
    │   (안 되면 Debug 화면에서 WebData 캐시 클리어)
    │
    └─ SAP 테이블/Function
        ↓
        Debug 화면 → 모든 캐시 클리어
        ↓
        여전히 안 됨?
        ↓
        코드 자체의 오류 확인```
## 자주 하는 실수 ​

### 실수 1: 서버 캐시인데 브라우저 캐시 클리어 ​

javascript```
// ❌ 잘못된 접근
"WEB_DATA를 수정했는데 Ctrl + F5를 눌러도 안 바뀌어요"

// ✅ 올바른 이해
"WEB_DATA는 서버 캐시이므로 자동으로 갱신됩니다"
"페이지 새로고침만 하면 됩니다"```
### 실수 2: 브라우저 캐시인데 서버 캐시 클리어 ​

javascript```
// ❌ 잘못된 접근
"JS 파일을 수정했는데 Debug 화면에서 캐시를 클리어했어요"
"그런데도 변경사항이 안 보여요"

// ✅ 올바른 이해
"JS 파일은 브라우저 캐시입니다"
"서버에서 requireBust를 갱신했다면, Ctrl + F5로 브라우저 캐시를 클리어하세요"```
### 실수 3: 캐시 클리어 후 확인 안 함 ​

javascript```
// ❌ 잘못된 접근
"캐시를 클리어했는데 안 돼요"
"뭐가 문제인지 모르겠어요"

// ✅ 올바른 접근
// 1. F12 → Network 탭 열기
// 2. Ctrl + F5
// 3. 파일의 Status Code 확인 (200이어야 함)
// 4. Response 탭에서 파일 내용 확인
// 5. 수정한 코드가 있는지 확인```
### 실수 4: 운영 환경에서 무분별한 캐시 클리어 ​

javascript```
// ❌ 위험한 행동
"오류가 났으니 일단 모든 캐시를 클리어하자"

// ✅ 신중한 접근
// 1. 개발/테스트 환경에서 먼저 확인
// 2. 원인 파악 후 필요한 캐시만 클리어
// 3. 운영 환경에서는 사용자가 적은 시간에 수행
// 4. 캐시 클리어 후 성능 저하 가능성 인지```
## ⚠️ 주의사항 ​

개발자는 다음 사항에 유의해야 합니다:

- 캐시 클리어 전에 무엇을 수정했는지 명확히 파악하세요
- 브라우저 캐시와 서버 캐시를 혼동하지 마세요
- 운영 환경에서는 캐시 클리어를 신중하게 수행하세요
- 캐시 클리어 후에도 문제가 지속되면 코드 자체의 오류를 확인하세요
- `Ctrl + F5`는 본인의 브라우저 캐시만 클리어합니다
- Debug 화면의 캐시 클리어는 모든 사용자에게 영향을 줍니다

## 다음 단계 ​

- 캐시 버스팅 전략 - requireBust와 webDataCacheBust의 작동 원리
- 브라우저 캐시 vs 서버 캐시 - 두 캐시의 차이점 상세 비교

## 📖 참고 자료 ​

- Chrome DevTools - 네트워크 패널
- MDN - Cache-Control