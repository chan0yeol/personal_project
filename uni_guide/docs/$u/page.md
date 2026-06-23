# $u.page ​

페이지 정보 관리 및 파라미터 처리

## 개요 ​

`$u.page`는 현재 페이지의 정보를 관리하고, 페이지 간 파라미터 전달을 처리하는 네임스페이스. 프로그램 ID, 뷰 이름, 페이지 파라미터 등의 정보를 제공.

## 주요 메서드 ​

### 페이지 정보 초기화 ​

#### `$u.page.init(pageInfo)` ​

페이지 정보를 초기화.

javascript```
$u.page.init({
  PROGRAM_ID: 'UD_1001_010',
  BASE_PRG: 'Unidocu001',
  VIEW_NAME: 'view/UD_1001_010',
  pageParams: { /* ... */ }
});```
#### `$u.page.update(pageInfo)` ​

기존 페이지 정보를 업데이트.

javascript```
$u.page.update({
  PROGRAM_ID: 'UD_1001_020'
});```
### 페이지 정보 조회 ​

#### `$u.page.getPROGRAM_ID()` ​

현재 페이지의 프로그램 ID를 반환.

javascript```
const programId = $u.page.getPROGRAM_ID();
console.log(programId); // "UD_1001_010"```
#### `$u.page.getBASE_PRG()` ​

현재 페이지의 베이스 프로그램을 반환.

javascript```
const basePrg = $u.page.getBASE_PRG();
console.log(basePrg); // "Unidocu001"```
#### `$u.page.getVIEW_NAME()` ​

현재 페이지의 뷰 이름을 반환.

javascript```
const viewName = $u.page.getVIEW_NAME();
console.log(viewName); // "view/UD_1001_010"```
### 페이지 파라미터 관리 ​

#### `$u.page.getPageParams()` ​

페이지 파라미터 객체를 반환.

javascript```
const params = $u.page.getPageParams();
console.log(params);
// {
//   documentNo: '12345',
//   mode: 'edit',
//   showAsPopup: 'true'
// }

// 특정 파라미터 접근
const documentNo = $u.page.getPageParams()['documentNo'];```
#### `$u.page.clearPageParams()` ​

페이지 파라미터를 초기화.

javascript```
$u.page.clearPageParams();```
### 커스텀 파라미터 관리 ​

#### `$u.page.setCustomParam(key, value)` ​

커스텀 파라미터를 설정.

| 파라미터 | 타입 | 설명 |
| key | string | 파라미터 키 |
| value | any | 파라미터 값 |
javascript```
// 단일 값 설정
$u.page.setCustomParam('selectedItem', { id: 1, name: '항목1' });

// 배열 설정
$u.page.setCustomParam('selectedList', [1, 2, 3]);```
#### `$u.page.getCustomParam(key)` ​

커스텀 파라미터를 가져옵니다.

| 파라미터 | 타입 | 설명 |
| key (선택) | string | 파라미터 키. 생략 시 전체 커스텀 파라미터 객체 반환 |
**반환값**

- 키가 제공된 경우: 해당 키의 값
- 키가 없는 경우: 전체 커스텀 파라미터 객체

javascript```
// 특정 파라미터 가져오기
const selectedItem = $u.page.getCustomParam('selectedItem');
console.log(selectedItem); // { id: 1, name: '항목1' }

// 전체 커스텀 파라미터 가져오기
const allParams = $u.page.getCustomParam();
console.log(allParams);
// {
//   selectedItem: { id: 1, name: '항목1' },
//   selectedList: [1, 2, 3]
// }```
### 검색 조건 관리 ​

#### `$u.page.isSearchConditionTableId(tableId)` ​

주어진 테이블 ID가 검색 조건 테이블인지 확인.

| 파라미터 | 타입 | 설명 |
| tableId | string | 확인할 테이블 ID |
**반환값**: `boolean` - 검색 조건 테이블이면 `true`, 아니면 `false`

javascript```
const isSearchTable = $u.page.isSearchConditionTableId('search-condition');
console.log(isSearchTable); // true

const isFormTable = $u.page.isSearchConditionTableId('form-table1');
console.log(isFormTable); // false```
#### `$u.page.storeSearchConditions()` ​

현재 검색 조건을 저장. (프로그램 ID별로 저장)

javascript```
// 검색 버튼 클릭 시 검색 조건 저장
$('#searchButton').click(function() {
  $u.page.storeSearchConditions();
  // ... 검색 로직
});```
#### `$u.page.clearSearchConditions()` ​

현재 프로그램의 저장된 검색 조건을 삭제.

javascript```
$u.page.clearSearchConditions();```
#### `$u.page.restoreSearchConditions()` ​

저장된 검색 조건을 복원.

javascript```
// 페이지 로드 시 이전 검색 조건 복원
$(document).ready(function() {
  $u.page.restoreSearchConditions();
});```
## 💡 실전 예제 ​

### 페이지 간 데이터 전달 ​

**발신 페이지 (목록 페이지)**

javascript```
// 선택된 항목을 상세 페이지로 전달
const selectedRow = gridObj.getSELECTEDJSONData()[0];
$u.navigateByProgramId('UD_1001_020', {
  documentNo: selectedRow.DOCNO,
  mode: 'view'
});```
**수신 페이지 (상세 페이지)**

javascript```
// 전달받은 파라미터 사용
const params = $u.page.getPageParams();
const documentNo = params['documentNo'];
const mode = params['mode'];

// 데이터 조회
$nst.is_data_os_data('GET_DOCUMENT_DETAIL', {
  DOCNO: documentNo
}, function(result) {
  $u.setValues('form-table1', result);

  // 모드에 따라 읽기 전용 설정
  if (mode === 'view') {
    $u.setReadOnly('form-table1', true);
  }
});```
### 검색 조건 유지 ​

javascript```
// 검색 실행 시 조건 저장
function onSearch() {
  // 검색 조건 저장
  $u.page.storeSearchConditions();

  // 검색 수행
  $nst.is_data_ot_data('SEARCH_FUNCTION', $u.getValues('search-condition'),
    function(ot_data) {
      gridObj.setJSONData(ot_data);
    }
  );
}

// 페이지 로드 시 이전 검색 조건 복원
function onPageLoad() {
  $u.page.restoreSearchConditions();

  // 자동으로 검색 실행 (선택적)
  if (!$.isEmptyObject($u.getValues('search-condition'))) {
    onSearch();
  }
}```
### 팝업과 부모 페이지 간 통신 ​

**부모 페이지**

javascript```
// 팝업 열기
const popup = $u.popup.openByProgramId('UD_1001_030', 1200, 800, {
  mode: 'select',
  returnTarget: 'PARTNER'
});

// 팝업에서 데이터 받기 (opener 사용)
window.receivePopupData = function(data) {
  $u.set('form-table1', 'PARTNER', data.PARTNER);
  $u.set('form-table1', 'PARTNER_NAME', data.PARTNER_NAME);
};```
**팝업 페이지**

javascript```
// 전달받은 파라미터 확인
const params = $u.page.getPageParams();
const mode = params['mode'];
const returnTarget = params['returnTarget'];

// 선택 버튼 클릭 시 부모 페이지로 데이터 전달
$('#selectButton').click(function() {
  const selectedData = gridObj.getSELECTEDJSONData()[0];

  if (opener && opener.receivePopupData) {
    opener.receivePopupData(selectedData);
    window.close();
  }
});```
### 커스텀 파라미터로 복잡한 상태 관리 ​

javascript```
// 여러 단계를 거치는 프로세스
function step1() {
  const formData = $u.getValues('form-table1');

  // 다음 단계로 넘어가기 전 데이터 저장
  $u.page.setCustomParam('step1Data', formData);

  // 다음 단계 표시
  showStep2();
}

function step2() {
  // 이전 단계 데이터 가져오기
  const step1Data = $u.page.getCustomParam('step1Data');

  // 현재 단계 데이터와 병합
  const step2Data = $u.getValues('form-table2');
  $u.page.setCustomParam('step2Data', step2Data);

  // 최종 제출
  submitAllData();
}

function submitAllData() {
  const step1Data = $u.page.getCustomParam('step1Data');
  const step2Data = $u.page.getCustomParam('step2Data');

  const finalData = $.extend({}, step1Data, step2Data);

  $nst.is_data_returnMessage('SAVE_FUNCTION', finalData, function(message) {
    unidocuAlert(message);
  });
}```
## ⚠️ 주의사항 ​

- `pageParams`는 페이지 이동 시 전달되는 일회성 파라미터입니다
- `customParams`는 현재 페이지 세션 내에서만 유지됩니다 (페이지 새로고침 시 초기화)
- 검색 조건은 프로그램 ID별로 브라우저 메모리에 저장됩니다 (페이지 새로고침 시에도 유지)
- 팝업 페이지에서 `$u.page.getPageParams()`는 팝업을 열 때 전달한 파라미터를 반환합니다