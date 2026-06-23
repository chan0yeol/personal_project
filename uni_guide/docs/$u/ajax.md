# $u.ajax ​

서버 비동기 통신 처리

## 개요 ​

jQuery AJAX 기반 서버 통신. UniWORKS 시스템 최적화 에러 처리 및 프로그레스 바 자동 표시 제공.

## 주요 메서드 ​

### 비동기 요청 ​

#### `$u.ajax.ajaxRequest(url, data, callback, errorCallback)` ​

비동기 AJAX 요청 수행

| 파라미터 | 타입 | 설명 |
| url | string | 요청 URL |
| data | object | 전송 데이터 |
| callback | function | 성공 콜백 |
| errorCallback | function | 실패 콜백 (선택) |
javascript```
// 기본 사용
$u.ajax.ajaxRequest('/api/getData',
  { param1: 'value1', param2: 'value2' },
  function(result) {
    console.log('성공:', result);
    $u.setValues('form-table1', result);
  },
  function(error) {
    console.log('실패:', error);
  }
);

// 에러 콜백 없이
$u.ajax.ajaxRequest('/api/getData',
  { documentNo: '12345' },
  function(result) {
    gridObj.setJSONData(result.items);
  }
);```
### 동기 요청 ​

#### `$u.ajax.synchronousRequest(url, data)` ​

동기 AJAX 요청을 수행. 응답이 올 때까지 스크립트 실행이 차단됩니다.

| 파라미터 | 타입 | 설명 |
| url | string | 요청 URL |
| data | object | 전송할 데이터 |
**반환값**: `object` - 서버 응답 데이터

javascript```
// 동기 요청
const result = $u.ajax.synchronousRequest('/api/validateData', {
  documentNo: '12345'
});

if (result.isValid) {
  console.log('검증 성공');
} else {
  unidocuAlert('검증 실패: ' + result.message);
}```
⚠️ **경고**: 동기 요청은 응답이 올 때까지 UI를 차단하므로 사용을 최소화해야 합니다.

### JSONP 요청 ​

#### `$u.ajax.jsonpRequest(url, data, callback, errorCallback)` ​

JSONP 방식으로 크로스 도메인 요청을 수행.

| 파라미터 | 타입 | 설명 |
| url | string | 요청 URL |
| data | object | 전송할 데이터 |
| callback | function | 성공 시 콜백 함수 |
| errorCallback (선택) | function | 실패 시 콜백 함수 |
javascript```
$u.ajax.jsonpRequest('https://external-api.com/data',
  { query: 'test' },
  function(result) {
    console.log('외부 API 응답:', result);
  },
  function(error) {
    console.log('요청 실패:', error);
  }
);```
### 저수준 요청 ​

#### `$u.ajax.jqueryRequest(option)` ​

jQuery AJAX를 직접 호출하는 저수준 메서드.

| 파라미터 | 타입 | 설명 |
| option | object | 요청 옵�� |
- `url` (string) - 요청 URL
- `data` (object) - 전송할 데이터
- `callback` (function) - 성공 콜백
- `errorCallback` (function) - 실패 콜백
- `async` (boolean) - 비동기 여부

javascript```
$u.ajax.jqueryRequest({
  url: '/api/customRequest',
  data: { param1: 'value1' },
  async: true,
  callback: function(result) {
    console.log(result);
  },
  errorCallback: function(error) {
    console.error(error);
  }
});```
## 자동 처리 기능 ​

### 프로그레스 바 ​

모든 AJAX 요청 시 자동으로 프로그레스 바가 표시되고 응답 후 숨겨집니다.

javascript```
$u.ajax.ajaxRequest('/api/longProcess', {}, function(result) {
  // 프로그레스 바는 자동으로 숨겨집니다
  unidocuAlert('처리 완료');
});```
### 자동 파라미터 추가 ​

모든 요청에 다음 파라미터가 자동으로 추가됩니다:

- `IS_KEY_PROGRAM_ID`: 현재 프로그램 ID
- `__DEST`: 목적지 정보
- `webDataCacheBust`: 웹 데이터 캐시 버전
- `requireBust`: Require.js 캐시 버전
- `staticUserID`: 사용자 ID
- `staticIS_KEY_BUKRS`: 회사코드

javascript```
// 다음과 같이 요청하면
$u.ajax.ajaxRequest('/api/getData', { param1: 'value1' }, callback);

// 실제로는 다음 파라미터가 전송됩니다
// {
//   param1: 'value1',
//   IS_KEY_PROGRAM_ID: 'UD_1001_010',
//   __DEST: 'DEST01',
//   webDataCacheBust: '123456',
//   requireBust: '789012',
//   staticUserID: 'USER01',
//   staticIS_KEY_BUKRS: '1000'
// }```
### 에러 처리 ​

예외 발생 시 자동으로 에러 메시지를 표시하고 적절한 처리를 수행.

javascript```
$u.ajax.ajaxRequest('/api/getData', {}, function(result) {
  // 성공 처리
}, function(error) {
  // 에러가 발생해도 기본 에러 메시지는 자동으로 표시됩니다
  // 추가 에러 처리가 필요한 경우에만 이 콜백을 사용
});```
## 💡 실전 예제 ​

### 폼 데이터 전송 ​

javascript```
$('#saveButton').click(function() {
  // 필수 입력 검증
  try {
    $u.validateRequired('form-table1');
  } catch (error) {
    unidocuAlert(error);
    return;
  }

  // 폼 데이터 가져오기
  const formData = $u.getValues('form-table1');

  // 서버로 전송
  $u.ajax.ajaxRequest('/api/saveDocument',
    formData,
    function(result) {
      unidocuAlert('저장되었습니다.');
      $u.pageReload();
    },
    function(error) {
      unidocuAlert('저장 실패: ' + error.message);
    }
  );
});```
### 그리드 데이터 조회 ​

javascript```
function searchData() {
  const searchConditions = $u.getValues('search-condition');

  $u.ajax.ajaxRequest('/api/searchDocuments',
    searchConditions,
    function(result) {
      const gridObj = $u.gridWrapper.getGrid();
      gridObj.setJSONData(result.items);

      // 결과 건수 표시
      $('#resultCount').text(result.items.length + '건');
    }
  );
}```
### 연속 요청 처리 ​

javascript```
// Promise 패턴 사용
function loadMasterData() {
  return new Promise(function(resolve, reject) {
    $u.ajax.ajaxRequest('/api/getMaster', {}, resolve, reject);
  });
}

function loadDetailData(masterId) {
  return new Promise(function(resolve, reject) {
    $u.ajax.ajaxRequest('/api/getDetail',
      { masterId: masterId },
      resolve,
      reject
    );
  });
}

// 순차 실행
loadMasterData()
  .then(function(masterData) {
    $u.setValues('form-master', masterData);
    return loadDetailData(masterData.id);
  })
  .then(function(detailData) {
    gridObj.setJSONData(detailData.items);
  })
  .catch(function(error) {
    unidocuAlert('데이터 로드 실패: ' + error);
  });```
### 병렬 요청 처리 ​

javascript```
// 여러 API를 동시에 호출
let completedCount = 0;
const totalCount = 3;
const results = {};

function checkAllComplete() {
  if (completedCount === totalCount) {
    // 모든 요청 완료
    console.log('모든 데이터 로드 완료:', results);
    initializePage(results);
  }
}

$u.ajax.ajaxRequest('/api/getCodeList', {}, function(result) {
  results.codes = result;
  completedCount++;
  checkAllComplete();
});

$u.ajax.ajaxRequest('/api/getUserInfo', {}, function(result) {
  results.user = result;
  completedCount++;
  checkAllComplete();
});

$u.ajax.ajaxRequest('/api/getSettings', {}, function(result) {
  results.settings = result;
  completedCount++;
  checkAllComplete();
});```
### 커스텀 에러 처리 ​

javascript```
$u.ajax.ajaxRequest('/api/validateOrder',
  { orderId: '12345', customErrorHandle: true },
  function(result) {
    if (result.isValid) {
      proceedOrder();
    }
  },
  function(error, option) {
    // 커스텀 에러 처리
    if (error.exceptionName === 'OrderNotFoundException') {
      unidocuAlert('주문을 찾을 수 없습니다.');
    } else if (error.exceptionName === 'OrderCancelledException') {
      unidocuAlert('취소된 주문.');
    } else {
      unidocuAlert('검증 실패: ' + error.message);
    }
  }
);```
### 파일 다운로드 ​

javascript```
// 파일 다운로드는 AJAX 대신 직접 form submit 사용
function downloadFile(fileId) {
  const $form = $u.generatePostRequestForm('/api/downloadFile', {
    fileId: fileId
  });

  $form.appendTo('body').submit().remove();
}```
### 타임아웃 처리 ​

javascript```
$u.ajax.jqueryRequest({
  url: '/api/longProcess',
  data: { processId: '12345' },
  async: true,
  timeout: 60000, // 60초
  callback: function(result) {
    unidocuAlert('처리 완료');
  },
  errorCallback: function(error) {
    if (error.textStatus === 'timeout') {
      unidocuAlert('요청 시간이 초과되었습니다.');
    }
  }
});```
## ⚠️ 주의사항 ​

- 동기 요청(`synchronousRequest`)은 UI를 차단하므로 최소한으로 사용해야 합니다
- 모든 요청에 프로그램 ID 등의 메타 정보가 자동으로 추가됩니다
- 에러 발생 시 기본적으로 Alert가 표시됩니다
- 커스텀 에러 처리가 필요한 경우 `data`에 `customErrorHandle: true`를 추가합니다
- 프로그레스 바는 자동으로 표시/숨김 처리됩니다
- JSONP 요청은 타임아웃이 5초로 설정되어 있습니다