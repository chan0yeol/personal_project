# 캐시 버스팅 전략 ​

UniWORKS의 캐시 버스팅 메커니즘인 requireBust와 webDataCacheBust의 작동 원리를 깊이 있게 이해.

## 개요 ​

캐시 버스팅(Cache Busting)은 브라우저나 서버가 이전 버전의 파일을 사용하지 않도록 강제로 새 파일을 다운로드하게 만드는 기술. UniWORKS는 두 가지 캐시 버스팅 전략을 사용합니다:

- requireBust: 정적 파일 (JS, CSS, 이미지 등)의 브라우저 캐시 관리
- webDataCacheBust: 서버 데이터 (WEB_DATA 등)의 서버 캐시 관리

## 캐시 버스팅이란? ​

### 문제 상황 ​

javascript```
// 브라우저는 파일 경로로 캐시를 식별
// 같은 경로 = 같은 파일로 인식

// ❌ 문제:
script src="/js/app.js">script>
// 파일을 수정해도 브라우저는 캐시된 이전 파일 사용

// ✅ 해결:
script src="/js/app.js?v=20250130">script>
// 쿼리 파라미터를 추가하면 브라우저는 다른 파일로 인식```
### 캐시 버스팅의 원리 ​

javascript```
// 브라우저의 파일 인식 방식:
// URL이 다르면 = 다른 파일

// 예시:
'script.js?v=1'  // 첫 번째 파일
'script.js?v=2'  // 완전히 다른 파일로 인식

// 실제로는 같은 script.js 파일이지만
// 쿼리 파라미터가 다르므로 브라우저는 새 파일로 인식하여 다운로드```
## requireBust - 정적 파일 버전 관리 ​

### 개념 ​

`requireBust`는 JS, CSS, 이미지 등 정적 파일의 브라우저 캐시를 관리하는 타임스탬프.

### 생성 방식 ​

java```
// CacheCheckService.java
private static String requireBust;

public static String getRequireBust() {
    if (requireBust == null) {
        // 현재 시각을 밀리초 단위로 변환
        requireBust = String.valueOf(System.currentTimeMillis());
    }
    return requireBust;
}

// 예시: "1706599123456"
// 2025년 1월 30일 12시 34분 56.789초의 타임스탬프```
### 사용 위치 ​

#### 1. HTML에서 정적 파일 로드 시 ​

html```

script src="{{contextPath}}/webjars/requirejs/2.1.15/require.min.js?bust={{requireBust}}">script>
script src="{{contextPath}}/webjars/unidocu-ui/$u.js?bust={{requireBust}}">script>

link href="{{contextPath}}/webjars/unidocu-ui/css/unidocu.css?bust={{requireBust}}" rel="stylesheet">
link href="{{contextPath}}/webjars/unidocu-ui/css/unidocu-button.css?bust={{requireBust}}" rel="stylesheet">

link rel="shortcut icon" type="image/png" href="{{contextPath}}{{faviconPath}}?bust={{requireBust}}">```
**실제 렌더링 결��:**

html```

script src="/webjars/unidocu-ui/$u.js?bust=1706599123456">script>
link href="/webjars/unidocu-ui/css/unidocu.css?bust=1706599123456" rel="stylesheet">```
#### 2. JavaScript에서 동적으로 파일 로드 시 ​

javascript```
// staticProperties에 저장됨
window.staticProperties = {
    requireBust: '1706599123456',
    // ...
};

// 동적으로 파일 로드 시 사용
const scriptUrl = `/webjars/custom/myScript.js?bust=${staticProperties.requireBust}`;
const script = document.createElement('script');
script.src = scriptUrl;
document.head.appendChild(script);```
### 갱신 방법 ​

#### 방법 1: Debug 화면에서 수동 갱신 ​

plaintext```
Debug 화면 → "모든 캐시 클리어" 버튼 클릭
→ requireBust = System.currentTimeMillis()
→ 새 타임스탬프로 변경```
#### 방법 2: 코드로 갱신 ​

javascript```
// $u.clearAllCache() 호출
$u.clearAllCache((message, requireBust, webDataCacheBust) => {
    console.log('이전 requireBust:', staticProperties.requireBust);
    console.log('새 requireBust:', requireBust);

    // ⚠️ 주의: 현재 페이지의 staticProperties는 변경되지 않음
    // 다음 페이지 로드 시 새 requireBust가 적용됨
});```
#### 방법 3: 서버 재시작 시 자동 갱신 ​

java```
// CacheCheckService.java
@PostConstruct
public void init() {
    clearRequireBust(); // null로 초기화
    clearWebDataCacheBust();
    // 다음 getRequireBust() 호출 시 새 타임스탬프 생성
}```
### 작동 순서 ​

plaintext```
1. 개발자가 script.js 파일 수정

2. 서버에 새 파일 배포

3. Debug 화면에서 "모든 캐시 클리어" (requireBust 갱신)
   requireBust: 1706599123456 → 1706599234567

4. 사용자가 페이지 접속
   서버가 HTML 렌더링:
   

5. 브라우저가 URL 확인
   이전: /js/script.js?bust=1706599123456
   현재: /js/script.js?bust=1706599234567
   → 다른 파일로 인식!

6. 브라우저가 서버에서 새 파일 다운로드
   Status: 200 OK (새로 다운로드)

7. 브라우저가 새 파일을 캐시
   다음부터는 bust=1706599234567로 요청 시 캐시 사용
   Status: (disk cache) 또는 304 Not Modified```
## webDataCacheBust - 서버 데이터 버전 관리 ​

### 개념 ​

`webDataCacheBust`는 WEB_DATA 등 서버에 캐시된 데이터의 버전을 관리하는 타임스탬프.

### 생성 방식 ​

java```
// CacheCheckService.java
private static String webDataCacheBust = getWebDataCacheBust();

public static String getWebDataCacheBust() {
    if (webDataCacheBust == null) {
        webDataCacheBust = String.valueOf(System.currentTimeMillis());
    }
    return webDataCacheBust;
}

// 예시: "1706599123456"```
### 사용 위치 ​

#### 1. 페이지 로드 시 staticProperties에 저장 ​

html```

script>
    window.staticProperties = {};
    staticProperties.requireBust = '{{requireBust}}';
    staticProperties.webDataCacheBust = '{{webDataCacheBust}}';
    // ...
script>```
#### 2. 모든 Ajax 요청에 포함 ​

javascript```
// unidocuAjax.js
// 모든 Named Service 호출 시 자동으로 추가됨
settings.data['webDataCacheBust'] = staticProperties.webDataCacheBust;
settings.data['requireBust'] = staticProperties.requireBust;

// 예시:
$nst.is_data_ot_data('GET_DATA', {}, (data) => {
    // ...
});

// 실제 전송되는 데이터:
// {
//   "namedServiceId": "GET_DATA",
//   "webDataCacheBust": "1706599123456",
//   "requireBust": "1706599123456",
//   ...
// }```
### 갱신 방법 ​

#### 자동 갱신: WEB_DATA 수정 시 ​

javascript```
// WEB_DATA 생성/수정 시 자동으로 갱신됨
$u.webData.createOrModifySingle('gridSetting', 'GRID_ID', data, () => {
    // webData.js 내부에서 자동으로 수행:
    $nst.is_data_os_data('CacheCheck', {mode: 'clearWebData'}, (os_data) => {
        // 서버의 webDataCacheBust 갱신
        staticProperties.webDataCacheBust = os_data['webDataCacheBust'];

        // 클라이언트 측 WEB_DATA 캐시도 비움
        $u.webData.cache = {};

        if (callback) callback();
    });
});```
#### 수동 갱신: Debug 화면 ​

plaintext```
Debug 화면 → "WebData 캐시 클리어" 버튼 클릭
→ webDataCacheBust = System.currentTimeMillis()
→ 새 타임스탬프로 변경```
### 작동 순서 ​

plaintext```
1. 개발자가 WEB_DATA 수정 (예: Grid 설정 변경)

2. 서버의 webDataCacheBust 자동 갱신
   webDataCacheBust: 1706599123456 → 1706599234567

3. 클라이언트(A 사용자)가 이미 페이지를 열고 있음
   staticProperties.webDataCacheBust = "1706599123456" (이전 값)

4. A 사용자가 버튼 클릭 → Ajax 요청 발생
   요청 데이터: {
     "webDataCacheBust": "1706599123456",  // 이전 값
     ...
   }

5. 서버가 버전 검증
   클라이언트: "1706599123456"
   서버: "1706599234567"
   → 불일치!

6. 서버가 Exception 던짐
   throw new WebDataCacheBustMismatchException();

7. 클라이언트가 Exception 처리
   $u.util.exceptionCallbackMap["WebDataCacheBustMismatchException"] = () => {
       $u.webData.cache = {}; // 클라이언트 캐시 비움
       $u.pageReload(); // 페이지 자동 새로고침
   };

8. 페이지 새로고침 시 새 webDataCacheBust 로드
   staticProperties.webDataCacheBust = "1706599234567"

9. 다음 Ajax 요청 시 새 버전으로 요청
   → 서버 검증 통과
   → 새 WEB_DATA 로드```
### 클라이언트 측 WEB_DATA 캐시 ​

javascript```
// webData.js
// 클라이언트도 WEB_DATA를 메모리에 캐시
$u.webData.cache = {};

// WEB_DATA 조회 시:
$u.webData.selectOne = function(scope, web_data_id) {
    const cacheKey = scope + web_data_id;

    // 1. 클라이언트 캐시 확인
    if ($u.webData.cache[cacheKey]) {
        return $.extend(true, {}, $u.webData.cache[cacheKey]);
    }

    // 2. 캐시에 없으면 서버에 요청
    const data = $nst.is_data_os_data('ZUNIECM_WEB_DATA', {
        MODE: 'selectOne',
        SCOPE: scope,
        WEB_DATA_ID: web_data_id,
        n_service_cache_key: JSON.stringify({...}) // 서버 측 캐시 키
    });

    // 3. 응답을 클라이언트 캐시에 저장
    $u.webData.cache[cacheKey] = data;
    return data;
};

// webDataCacheBust 불일치 시:
// $u.webData.cache = {}; → 클라이언트 캐시 전체 삭제
// 페이지 새로고침 → 모든 WEB_DATA 재조회```
## 서버 측 Named Service 캐시 ​

### n_service_cache_key ​

javascript```
// Named Service 호출 시 캐시 키 지정 가능
$nst.is_data_os_data('ZUNIECM_WEB_DATA', {
    MODE: 'selectOne',
    SCOPE: 'gridSetting',
    WEB_DATA_ID: 'GRID_ID',
    n_service_cache_key: JSON.stringify({
        MODE: 'selectOne',
        SCOPE: 'gridSetting',
        WEB_DATA_ID: 'GRID_ID'
    })
}, (data) => {
    // 서버가 캐시 키로 응답을 캐시
    // 같은 캐시 키로 요청 시 캐시된 응답 반환
});```
### 캐시 저장 위치 ​

java```
// 서버의 JVM 메모리
// JCOManagerWrapper에 캐시 맵 존재
MapString, Object> cache = new HashMap<>();

// n_service_cache_key를 키로 사용
cache.put(cacheKey, response);

// 다음 동일한 요청 시:
if (cache.containsKey(cacheKey)) {
    return cache.get(cacheKey); // SAP 호출 없이 즉시 반환
}```
### 캐시 클리어 ​

java```
// CacheCheckService.clearAll()
JCOManagerWrapperFactory.cacheClear();
// → 모든 Named Service 캐시 삭제
// → 다음 요청 시 SAP에 다시 호출```
## 클러스터 환경에서의 캐시 버스팅 ​

### 문제 상황 ​

plaintext```
UniWORKS가 여러 서버로 구성된 경우:

Server A: requireBust = 1706599123456
Server B: requireBust = 1706599123456
Server C: requireBust = 1706599123456

Server A에서만 캐시 클리어:
Server A: requireBust = 1706599234567
Server B: requireBust = 1706599123456 (이전 값)
Server C: requireBust = 1706599123456 (이전 값)

→ 사용자가 어느 서버에 접속하느냐에 따라 다른 requireBust!```
### 해결 방법 ​

java```
// CacheCheckService.java
// 캐시 클리어 시 모든 서버에 전파
private void callRemoteClearAll() {
    for (String clearCacheTarget : ServerProperty.getClearCacheTarget().split(",")) {
        MapString, String> params = new HashMap<>();
        params.put("namedServiceId", "CacheCheck");
        params.put("mode", "clearAllByRemote");
        params.put("webDataCacheBust", getWebDataCacheBust());
        params.put("requireBust", getRequireBust());

        // 다른 서버에 HTTP 요청
        UniDocuUtil.getContentsByPostRequest(
            clearCacheTarget + "/unidocu/namedService/callJSONInterface",
            null,
            params
        );
    }
}```
**설정 방법:**

properties```
# application.properties
# 다른 서버들의 URL을 쉼표로 구분
cache.clear.targets=http://server-b:8080,http://server-c:8080```
**작동 순서:**

plaintext```
1. Server A의 Debug 화면에서 "모든 캐시 클리어" 클릭

2. Server A가 새 requireBust, webDataCacheBust 생성

3. Server A가 Server B, C에 HTTP 요청
   POST /unidocu/namedService/callJSONInterface
   {
     "namedServiceId": "CacheCheck",
     "mode": "clearAllByRemote",
     "requireBust": "1706599234567",
     "webDataCacheBust": "1706599234567"
   }

4. Server B, C가 요청 받음
   → 자신의 requireBust, webDataCacheBust를 동일한 값으로 설정

5. 모든 서버가 동일한 버전:
   Server A: requireBust = 1706599234567
   Server B: requireBust = 1706599234567
   Server C: requireBust = 1706599234567```
## 💡 실전 예제 ​

### 예제 1: requireBust 확인하기 ​

javascript```
// Console에서 현재 requireBust 확인
console.log('Current requireBust:', staticProperties.requireBust);

// 페이지의 모든 script 태그 확인
document.querySelectorAll('script[src]').forEach((script) => {
    console.log(script.src);
});

// 출력 예시:
// https://server.com/webjars/unidocu-ui/$u.js?bust=1706599123456
// https://server.com/webjars/require.min.js?bust=1706599123456```
### 예제 2: webDataCacheBust 검증 로직 ​

javascript```
// 서버로 보내는 모든 요청에 webDataCacheBust 포함됨
// 서버에서 검증하는 로직 (Java):

// Controller에서:
String clientWebDataCacheBust = request.getParameter("webDataCacheBust");
String serverWebDataCacheBust = CacheCheckService.getWebDataCacheBust();

if (!clientWebDataCacheBust.equals(serverWebDataCacheBust)) {
    // 버전 불일치 → Exception
    throw new WebDataCacheBustMismatchException(
        "Client: " + clientWebDataCacheBust +
        ", Server: " + serverWebDataCacheBust
    );
}

// 클라이언트가 받는 에러 메시지:
// {
//   "exceptionName": "WebDataCacheBustMismatchException",
//   "message": "캐시 버전이 일치하지 않습니다.",
//   "webDataCacheBust": "1706599234567" // 서버의 최신 버전
// }```
### 예제 3: WEB_DATA 수정 시 자동 갱신 확인 ​

javascript```
// WEB_DATA 수정 전
console.log('Before:', staticProperties.webDataCacheBust);

// WEB_DATA 수정
$u.webData.createOrModifySingle('gridSetting', 'GRID_ID', myData, () => {
    console.log('After:', staticProperties.webDataCacheBust);

    // 클라이언트 캐시도 비워졌는지 확인
    console.log('Client cache:', $u.webData.cache);
    // 출력: {} (빈 객체)
});```
### 예제 4: 커스텀 캐시 버스팅 ​

javascript```
// 개발자가 직접 파일에 캐시 버스팅 적용
function loadCustomScript(scriptPath) {
    const bust = staticProperties.requireBust;
    const script = document.createElement('script');
    script.src = `${scriptPath}?bust=${bust}`;
    document.head.appendChild(script);
}

// 사용:
loadCustomScript('/custom/myScript.js');
// 로드됨: /custom/myScript.js?bust=1706599123456

// requireBust 갱신 후:
loadCustomScript('/custom/myScript.js');
// 로드됨: /custom/myScript.js?bust=1706599234567 (새 파일로 인식)```
### 예제 5: Debug 모드에서 캐시 버스팅 비활성화 ​

javascript```
// 개발 중 매번 캐시 클리어가 번거로울 때
// F12 → Network → Disable cache 체크

// 또는 코드로:
// 개발자 도구가 열려있을 때 캐시 무시
if (window.devtools && window.devtools.open) {
    // 브라우저가 자동으로 캐시 무시
}

// ⚠️ 주의: 실제 배포 시에는 캐시 버스팅이 필수!```
## 캐시 버스팅 전략 비교 ​

### 타임스탬프 방식 (UniWORKS 사용) ​

javascript```
// ✅ 장점:
// - 구현이 간단
// - 서버 재시작이나 캐시 클리어 시 자동 생성
// - 클러스터 환경에서 동기화 가능

// ❌ 단점:
// - 파일이 변경되지 않았어도 requireBust가 변경되면 모든 파일 재다운로드
// - 네트워크 트래픽 증가

// 예시:
script src="/js/app.js?v=1706599123456">script>```
### 파일 해시 방식 (대안) ​

javascript```
// 파일 내용을 해시하여 버전 생성
script src="/js/app.js?v=a1b2c3d4">script>

// ✅ 장점:
// - 파일이 변경된 경우에만 버전 변경
// - 네트워크 효율적

// ❌ 단점:
// - 빌드 시 모든 파일을 해시해야 함
// - 구현 복잡도 증가```
### 버전 번호 방식 (대안) ​

javascript```
// 시맨틱 버저닝
script src="/js/app.js?v=1.2.3">script>

// ✅ 장점:
// - 버전을 명시적으로 관리
// - 사람이 읽기 쉬움

// ❌ 단점:
// - 수동으로 버전 증가 필요
// - 실수로 버전 변경 누락 가능```
## ⚠️ 주의사항 ​

개발자는 다음 사항에 유의해야 합니다:

- `requireBust`와 `webDataCacheBust`는 서로 다른 목적입니다
- `requireBust` 갱신은 모든 정적 파일을 재다운로드하게 만듭니다
- `webDataCacheBust` 불일치 시 자동으로 페이지가 새로고침됩니다
- 클러스터 환경에서는 모든 서버의 버전이 동기화되어야 합니다
- 운영 환경에서 캐시 클리어는 네트워크 트래픽과 서버 부하를 고려하세요
- WEB_DATA 수정 시 `webDataCacheBust`는 자동으로 갱신됩니다

## 다음 단계 ​

- 브라우저 캐시 vs 서버 캐시 - 두 캐시의 차이점 이해
- 캐시 클리어 가이드 - 상황별 조치 방법

## 📖 참고 자료 ​

- MDN - HTTP 캐싱
- Google - 캐시 무효화 전략
- Cache Busting 전략 비교