# $u.popup ​

팝업 창 열기 및 제어

## 개요 ​

`$u.popup`은 팝업 창을 열고 제어하는 네임스페이스. UniWORKS 프로그램 팝업, 일반 URL 팝업, POST 방식 팝업 등 다양한 팝업 열기 방식을 지원.

## 주요 메서드 ​

### 기본 팝업 ​

#### `$u.popup.openPopup(url, name, width, height, specs, autoClose)` ​

일반 URL로 팝업을 엽니다.

| 파라미터 | 타입 | 설명 |
| url | string | 팝업 URL |
| name | string | 팝업 창 이름 |
| width | number | 팝업 너비 (픽셀) |
| height | number | 팝업 높이 (픽셀) |
| specs (선택) | object | 추가 window.open 옵션 |
| autoClose (선택) | boolean | 부모 창 포커스 시 자동 닫기 |
**반환값**: `Window` - 열린 팝업 창 객체

javascript```
// 기본 팝업
const popup = $u.popup.openPopup('/custom/page.html', 'customPopup', 1000, 600);

// 추가 옵션과 함께
const popup = $u.popup.openPopup('/custom/page.html', 'customPopup', 1000, 600, {
  resizable: 'no',
  scrollbars: 'no'
});

// 자동 닫기 옵션
const popup = $u.popup.openPopup('/custom/page.html', 'customPopup', 1000, 600, {}, true);```
#### `$u.popup.postOpen(url, name, width, height, data, specs, autoClose)` ​

POST 방식으로 데이터를 전달하며 팝업을 엽니다.

| 파라미터 | 타입 | 설명 |
| url | string | 팝업 URL |
| name | string | 팝업 창 이름 |
| width | number | 팝업 너비 |
| height | number | 팝업 높이 |
| data (선택) | object | 전달할 데이터 |
| specs (선택) | object | 추가 옵션 |
| autoClose (선택) | boolean | 자동 닫기 여부 |
**반환값**: `Window` - 열린 팝업 창 객체

javascript```
// POST 데이터와 함께 팝업 열기
const popup = $u.popup.postOpen('/custom/form.html', 'formPopup', 1200, 800, {
  documentNo: '12345',
  mode: 'edit'
});```
### UniWORKS 프로그램 팝업 ​

#### `$u.popup.openByProgramId(programId, width, height, data, spec, autoClose)` ​

UniWORKS 프로그램 ID로 팝업을 엽니다.

| 파라미터 | 타입 | 설명 |
| programId | string | 프로그램 ID (예: 'UD_1001_020') |
| width | number | 팝업 너비 |
| height | number | 팝업 높이 |
| data (선택) | object | 페이지 파라미터 |
| spec (선택) | object | 추가 옵션 |
| autoClose (선택) | boolean | 자동 닫기 여부 |
**반환값**: `Window` - 열린 팝업 창 객체

javascript```
// 프로그램 ID로 팝업 열기
const popup = $u.popup.openByProgramId('UD_1001_020', 1200, 800, {
  documentNo: '12345',
  mode: 'view'
});

// 팝업이 닫혔는지 확인
const interval = setInterval(function() {
  if (popup.closed) {
    clearInterval(interval);
    console.log('팝업이 닫혔습니다.');
    // 팝업 닫힌 후 처리
    onSearch(); // 예: 목록 재조회
  }
}, 100);```
#### `$u.popup.openByProgramIdWithGiveName(programId, width, height, data, spec, autoClose, givenName)` ​

커스텀 이름으로 UniWORKS 프로그램 팝업을 엽니다.

**파라미터**

- 기본 파라미터는 `openByProgramId`와 동일
- `givenName` (string) - 팝업 창에 부여할 커스텀 이름

javascript```
// 커스텀 이름으로 팝업 열기
const popup = $u.popup.openByProgramIdWithGiveName(
  'UD_1001_020',
  1200,
  800,
  { documentNo: '12345' },
  {},
  false,
  'documentDetailPopup'
);```
### 특수 목적 팝업 ​

#### `$u.popup.openProgramHelp(programId, programTitle)` ​

프로그램 도움말 팝업을 엽니다.

| 파라미터 | 타입 | 설명 |
| programId (선택) | string | 프로그램 ID (생략 시 현재 페이지) |
| programTitle (선택) | string | 프로그램 제목 (생략 시 현재 페이지 제목) |
javascript```
// 현재 페이지 도움말
$u.popup.openProgramHelp();

// 특정 프로그램 도움말
$u.popup.openProgramHelp('UD_1001_010', '구매 발주 관리');```
#### `$u.popup.openUD_0901_020(data)` ​

파일 첨부 팝업을 엽니다.

javascript```
const selectedRow = gridObj.getSELECTEDJSONData()[0];
$u.popup.openUD_0901_020({
  BUKRS: selectedRow.BUKRS,
  BELNR: selectedRow.BELNR,
  GJAHR: selectedRow.GJAHR
});```
#### `$u.popup.openUD_0901_010(params)` ​

파일 조회 팝업을 엽니다.

javascript```
$u.popup.openUD_0901_010({
  BUKRS: '1000',
  BELNR: '12345',
  GJAHR: '2025'
});```
### 유틸리티 메서드 ​

#### `$u.popup.getWindowOpenString(url, name, width, height, specs)` ​

`window.open` 문자열을 생성.

**반환값**: `string` - window.open 실행 문자열

javascript```
const openString = $u.popup.getWindowOpenString('/page.html', 'popup', 800, 600);
// "javascript:window.open('/page.html', 'popup', 'width=800px,height=600px,...')"```
#### `$u.popup.getSpecString(specs, width, height)` ​

팝업 옵션 문자열을 생성.

**반환값**: `string` - window.open의 specs 문자열

javascript```
const specString = $u.popup.getSpecString({
  resizable: 'yes',
  scrollbars: 'yes'
}, 800, 600);
// "resizable=yes,scrollbars=yes,width=800px,height=600px,..."```
#### `$u.popup.replacePopupName(name)` ​

팝업 이름의 공백을 언더스코어로 변환.

javascript```
const safeName = $u.popup.replacePopupName('My Popup Window');
// "My_Popup_Window"```
## 💡 실전 예제 ​

### 선택 팝업 (데이터 반환) ​

**부모 페이지**

javascript```
// 거래처 선택 팝업 열기
$('#selectPartnerButton').click(function() {
  const popup = $u.popup.openByProgramId('UD_PARTNER_SELECT', 1200, 800, {
    mode: 'select',
    multiple: false
  });

  // 팝업에서 데이터 받기 위한 콜백 함수
  window.receivePartnerData = function(partnerData) {
    $u.set('form-table1', 'PARTNER', partnerData.PARTNER);
    $u.set('form-table1', 'PARTNER_NAME', partnerData.PARTNER_NAME);
    $u.set('form-table1', 'PARTNER_ADDR', partnerData.ADDR);
  };
});```
**팝업 페이지 (UD_PARTNER_SELECT)**

javascript```
// 선택 버튼 클릭 시
$u.buttons.setHandler('select', function() {
  const gridObj = $u.gridWrapper.getGrid();
  gridObj.asserts.selectedExactOneRow();

  const selectedRow = gridObj.getSELECTEDJSONData()[0];

  // 부모 페이지로 데이터 전달
  if (opener && opener.receivePartnerData) {
    opener.receivePartnerData(selectedRow);
    window.close();
  }
});```
### 다중 선택 팝업 ​

**부모 페이지**

javascript```
$('#selectMaterialsButton').click(function() {
  const popup = $u.popup.openByProgramId('UD_MATERIAL_SELECT', 1200, 800, {
    mode: 'multiSelect'
  });

  window.receiveMaterialsData = function(materials) {
    const gridObj = $u.gridWrapper.getGrid();

    // 선택된 자재들을 그리드에 추가
    $.each(materials, function(index, material) {
      const newRow = gridObj.addRowWithGridPopupIcon();
      gridObj.$V('MATNR', newRow, material.MATNR);
      gridObj.$V('MAKTX', newRow, material.MAKTX);
      gridObj.$V('MEINS', newRow, material.MEINS);
    });
  };
});```
**팝업 페이지**

javascript```
$u.buttons.setHandler('select', function() {
  const gridObj = $u.gridWrapper.getGrid();
  gridObj.asserts.rowSelected();

  const selectedRows = gridObj.getSELECTEDJSONData();

  if (opener && opener.receiveMaterialsData) {
    opener.receiveMaterialsData(selectedRows);
    window.close();
  }
});```
### 상세 보기 팝업 ​

javascript```
// 그리드 더블클릭 시 상세 팝업
gridObj.setDoubleClickHandler(function(rowIndex) {
  const rowData = gridObj.getJSONData()[rowIndex];

  $u.popup.openByProgramId('UD_1001_020', 1400, 900, {
    documentNo: rowData.DOCNO,
    mode: 'view'
  });
});```
### 팝업 닫힌 후 처리 ​

javascript```
$('#openPopupButton').click(function() {
  const popup = $u.popup.openByProgramId('UD_1001_030', 1200, 800);

  // 팝업이 닫힐 때까지 대기 후 처리
  const interval = setInterval(function() {
    if (popup.closed) {
      clearInterval(interval);

      // 팝업 닫힌 후 목록 재조회
      $u.buttons.triggerFormTableButtonClick();
    }
  }, 100);
});```
### 조건부 팝업 블로킹 처리 ​

javascript```
try {
  const popup = $u.popup.openByProgramId('UD_1001_020', 1200, 800);

  if (!popup) {
    unidocuAlert($mls.getByCode('M_checkAllowPopup'));
    return;
  }
} catch (error) {
  unidocuAlert('팝업을 열 수 없습니다: ' + error.message);
}```
### 팝업 크기 자동 조정 ​

javascript```
// 화면 크기에 맞춰 팝업 크기 조정
const screenWidth = screen.availWidth;
const screenHeight = screen.availHeight;

const popupWidth = Math.min(1400, screenWidth * 0.9);
const popupHeight = Math.min(900, screenHeight * 0.9);

$u.popup.openByProgramId('UD_1001_020', popupWidth, popupHeight, {
  documentNo: '12345'
});```
## ⚠️ 주의사항 ​

- 브라우저 팝업 차단 설정에 의해 팝업이 열리지 않을 수 있습니다
- 팝업이 차단되면 `null`을 반환하므로 반환값을 확인해야 합니다
- `opener` 객체를 통해 부모 창과 통신할 수 있습니다
- 팝업 창 이름에 공백이 있으면 자동으로 언더스코어로 변환됩니다
- `autoClose` 옵션 사용 시 사용자가 부모 창으로 포커스를 옮기면 팝업이 자동으로 닫힙니다
- 팝업 높이가 화면 높이를 초과하면 자동으로 조정됩니다