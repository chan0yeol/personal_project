# $mls - Multi Language System ​

다국어 메시지 관리 객체

## 개요 ​

`$mls`는 UniWORKS의 다국어 메시지를 관리하는 전역 객체. 코드를 통해 언어별 메시지를 조회하고, Mustache 템플릿에서 사용할 수 있도록 지원.

## 주요 메서드 ​

### 메시지 조회 ​

#### `$mls.getByCode(code)` ​

메시지 코드로 다국어 메시지를 조회.

| 파라미터 | 타입 | 설명 |
| code | string | 메시지 코드 (예: 'M_save_success') |
**반환값**: `string` - 현재 언어에 맞는 메시지 텍스트

javascript```
// 저장 성공 메시지
const saveMessage = $mls.getByCode('M_save_success');
unidocuAlert(saveMessage); // "저장되었습니다." (한국어)

// 삭제 확인 메시지
const deleteConfirm = $mls.getByCode('M_delete_confirm');
unidocuConfirm(deleteConfirm, function() {
  // 삭제 로직
});```
#### `$mls.get(key)` ​

메시지 키로 직접 조회.

| 파라미터 | 타입 | 설명 |
| key | string | 메시지 키 |
**반환값**: `string` - 현재 언어에 맞는 메시지 텍스트

javascript```
const message = $mls.get('저장되었습니다.');
console.log(message); // 영어 환경: "Saved successfully."```
### 데이터 조회 ​

#### `$mls.getData(webDataId)` ​

특정 언어의 다국어 데이터를 조회.

| 파라미터 | 타입 | 설명 |
| webDataId | string | 언어 코드 (예: 'en', 'ko', 'ja') |
**반환값**: `Object` - 다국어 데이터 객체

javascript```
// 영어 메시지 데이터
const enData = $mls.getData('en');
console.log(enData);```
### Mustache 템플릿용 ​

#### `$mls.getMustacheView(additionalKeys)` ​

Mustache 템플릿에서 사용할 다국어 뷰 객체를 반환.

| 파라미터 | 타입 | 설명 |
| additionalKeys (선택) | Array | 추가할 메시지 키 목록 |
**반환값**: `Object` - Mustache 뷰 객체

javascript```
const view = $mls.getMustacheView(['추가메시지1', '추가메시지2']);

// Mustache 템플릿 렌더링
const html = Mustache.render(template, view);```
## $mlsCode 객체 ​

`$mlsCode`는 메시지 코드와 실제 메시지 키 매핑 객체.

javascript```
// 코드로 키 조회
const key = $mlsCode['M_save_success'];
console.log(key); // "저장되었습니다."

// 메시지 조회
const message = $mls.get(key);```
## 주요 메시지 코드 ​

### 일반 메시지 ​

javascript```
$mls.getByCode('M_save_success')        // 저장되었습니다
$mls.getByCode('M_delete_success')      // 삭제되었습니다
$mls.getByCode('M_save_confirm')        // 저장하시겠습니까?
$mls.getByCode('M_delete_confirm')      // 삭제하시겠습니까?
$mls.getByCode('M_process_success')     // 처리되었습니다```
### 검증 메시지 ​

javascript```
$mls.getByCode('M_required_field')      // 필수 입력 항목입니다
$mls.getByCode('M_invalid_input')       // 올바르지 않은 입력값입니다
$mls.getByCode('M_duplicate_data')      // 중복된 데이터입니다
$mls.getByCode('M_no_data')             // 데이터가 없습니다```
### 그리드 관련 ​

javascript```
$mls.getByCode('M_select_row')          // 행을 선택하세요
$mls.getByCode('M_no_selected_row')     // 선택된 행이 없습니다
$mls.getByCode('M_select_one_row')      // 하나의 행만 선택하세요```
### 시스템 메시지 ​

javascript```
$mls.getByCode('M_session_expired')     // 세션이 만료되었습니다
$mls.getByCode('M_network_error')       // 네트워크 오류가 발생했습니다
$mls.getByCode('M_popup_blocked')       // 팝업이 차단되었습니다```
## 💡 실전 예제 ​

### 버튼 텍스트 설정 ​

javascript```
$(document).ready(function() {
  // 버튼 텍스트를 다국어로 설정
  $('#saveButton').text($mls.getByCode('M_save'));
  $('#deleteButton').text($mls.getByCode('M_delete'));
  $('#searchButton').text($mls.getByCode('M_search'));
  $('#cancelButton').text($mls.getByCode('M_cancel'));
});```
### 검증 메시지 표시 ​

javascript```
function validateForm() {
  const matnr = $u.get('form-table1', 'MATNR').getValue();

  if (!matnr) {
    unidocuAlert($mls.getByCode('M_required_field'));
    return false;
  }

  return true;
}```
### 확인 메시지 ​

javascript```
$('#saveButton').click(function() {
  unidocuConfirm($mls.getByCode('M_save_confirm'), function() {
    // 저장 로직
    saveData();
  });
});

function saveData() {
  $nst.is_data_returnMessage('SAVE_FUNCTION', data, function(message) {
    // 서버 메시지가 있으면 그대로 사용, 없으면 기본 메시지
    unidocuAlert(message || $mls.getByCode('M_save_success'));
  });
}```
### 그리드 검증 ​

javascript```
function deleteSelectedRows() {
  const gridObj = $u.gridWrapper.getGrid();

  try {
    gridObj.asserts.rowSelected();
  } catch (error) {
    unidocuAlert($mls.getByCode('M_no_selected_row'));
    return;
  }

  unidocuConfirm($mls.getByCode('M_delete_confirm'), function() {
    const selectedData = gridObj.getSELECTEDJSONData();

    $nst.it_data_nsReturn('DELETE_FUNCTION', selectedData, function(nsReturn) {
      unidocuAlert(nsReturn.getReturnMessage() || $mls.getByCode('M_delete_success'));
      $u.buttons.triggerFormTableButtonClick();
    });
  });
}```
### 동적 메시지 생성 ​

javascript```
// 파라미터가 포함된 메시지
function showProcessResult(count) {
  const template = $mls.getByCode('M_process_result'); // "{0}건 처리되었습니다."
  const message = $u.util.formatString(template, [count]);
  unidocuAlert(message);
}

// 사용
showProcessResult(5); // "5건 처리되었습니다."```
### 에러 메시지 처리 ​

javascript```
$nst.is_data_ot_data('SEARCH_FUNCTION', searchConditions,
  function(ot_data) {
    if (ot_data.length === 0) {
      unidocuAlert($mls.getByCode('M_no_data'));
      return;
    }

    gridObj.setJSONData(ot_data);
  },
  function(error) {
    unidocuAlert($mls.getByCode('M_network_error'));
  }
);```
### Mustache 템플릿에서 사용 ​

html```

script id="formTemplate" type="text/template">
  div>
    h2>{{title}}h2>
    button id="saveBtn">{{저장}}button>
    button id="cancelBtn">{{취소}}button>
  div>
script>```
javascript```
// 렌더링
const template = $('#formTemplate').html();
const view = $.extend($mls.getMustacheView([]), {
  title: '구매 발주 등록'
});

const html = Mustache.render(template, view);
$('#container').html(html);```
### 커스텀 메시지 추가 ​

javascript```
// 프로그램별 커스텀 메시지 키 추가
function initializeMessages() {
  const customKeys = [
    '주문 승인이 완료되었습니다.',
    '재고가 부족.',
    '승인 권한이 없습니다.'
  ];

  const view = $mls.getMustacheView(customKeys);

  // 메시지 사용
  const msg1 = view['주문 승인이 완료되었습니다.'];
  const msg2 = view['재고가 부족.'];
}```
### 언어 전환 감지 ​

javascript```
// 언어가 변경되었을 때 UI 업데이트
function updateUILanguage() {
  const currentLang = $u.LANGUHandler.getLang();

  // 버튼 텍스트 업데이트
  $('#saveButton').text($mls.getByCode('M_save'));
  $('#deleteButton').text($mls.getByCode('M_delete'));

  // 그리드 컬럼 헤더 업데이트
  const gridObj = $u.gridWrapper.getGrid();
  // ... 그리드 헤더 업데이트 로직
}```
## ⚠️ 주의사항 ​

- 메시지 코드는 대소문자를 구분합니다
- 메시지 키에 줄바꿈(`\n`)이 포함된 경우 자동으로 처리됩니다
- 존재하지 않는 코드나 키를 조회하면 원본 문자열이 반환됩니다
- 다국어 데이터는 캐시되므로, 같은 키를 여러 번 조회해도 성능에 문제없습니다
- 한국어가 기본 언어이며, 한국어 메시지는 별도 조회 없이 키 자체가 메시지입니다
- Mustache 템플릿에서는 메시지 키를 직접 사용할 수 있습니다

## 메시지 코드 네이밍 규칙 ​

### 접두사 ​

- M_ : Message (일반 메시지)
- E_ : Error (에러 메시지)
- W_ : Warning (경고 메시지)
- Q_ : Question (질문 메시지)

### 예시 ​

javascript```
// 성공 메시지
M_save_success
M_delete_success
M_process_complete

// 확인 메시지
Q_save_confirm
Q_delete_confirm
Q_continue_process

// 에러 메시지
E_invalid_input
E_duplicate_key
E_required_field

// 경고 메시지
W_data_not_saved
W_session_expire_soon```