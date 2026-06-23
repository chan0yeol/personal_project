# $efi - e-FI 모듈 ​

재무 관리 모듈의 전역 객체

## 개요 ​

`$efi`는 UniWORKS의 재무(FI) 관리 모듈을 위한 전역 객체. 재무 관련 증빙 처리, 전표 생성, 통화 이벤트 처리 등의 기능을 제공.

## 주요 네임스페이스 ​

### $efi.mustache ​

Mustache 템플릿 관리

### $efi.addDataHandler ​

데이터 추가 핸들러

### $efi.createStatement ​

전표 생성

### $efi.createStatementCommon ​

공통 전표 생성

### $efi.dialog ​

다이얼로그 관리

### $efi.f4 ​

F4 도움말

### $efi.popup ​

팝업 관리

### $efi.KOSTL_HKONT_Relation ​

코스트센터-계정과목 관계

### $efi.mwskzNonDeduction ​

부가세 비공제

### $efi.statementInitialData ​

전표 초기 데이터

## 주요 메서드 ​

### 증빙 처리 ​

#### `$efi.get$evidenceIcon(evidenceData)` ​

증빙 아이콘을 생성하고 클릭 이벤트를 설정.

| 파라미터 | 타입 | 설명 |
| evidenceData | Object | 증빙 데이터 |
- `CRD_SEQ`: 카드 SEQ
- `INV_SEQ`: 세금계산서 SEQ
- `EVI_SEQ`: 증빙 SEQ

**반환값**: `jQuery` - 증빙 아이콘 jQuery 객체

javascript```
// 증빙 아이콘 생성
const $icon = $efi.get$evidenceIcon({
  EVI_SEQ: 'EVI12345'
});

// 폼에 추가
$('#evidenceArea').append($icon);```
#### `$efi.evidenceHandler()` ​

증빙 핸들러를 초기화.

javascript```
$(document).ready(function() {
  $efi.evidenceHandler();
});```
#### `$efi.evikbClickHandler(paramMap)` ​

증빙 클릭 이벤트를 처리.

| 파라미터 | 타입 | 설명 |
| paramMap | Object | 증빙 검색 파라미터 |
javascript```
$efi.evikbClickHandler({
  BUKRS: '1000',
  BELNR: '12345',
  GJAHR: '2025'
});```
#### `$efi.handleEvidenceByZUNIECM_5013_RowData(rowData)` ​

증빙 데이터를 처리.

| 파라미터 | 타입 | 설명 |
| rowData | Object | ZUNIECM_5013 조회 결과 행 데이터 |
javascript```
$nst.is_data_ot_data('ZUNIECM_5013', searchParams, function(ot_data) {
  if (ot_data.length === 1) {
    $efi.handleEvidenceByZUNIECM_5013_RowData(ot_data[0]);
  }
});```
### 거래처 상태 조회 ​

#### `$efi.showExGateClosedVendorStatus(bizNo)` ​

사업자번호로 폐업 여부 및 사업자 상태를 조회하여 표시.

| 파라미터 | 타입 | 설명 |
| bizNo | string | 사업자번호 |
javascript```
// 사업자 상태 확인
$efi.showExGateClosedVendorStatus('123-45-67890');```
### 통화 이벤트 처리 ​

#### `$efi.currencyEventAfterRender($scope)` ​

통화 변경 이벤트를 설정하고 소수점 자리수를 조정.

**파라미터**

- `$scope` (jQuery, optional) - 적용할 범위 (기본값: $('body'))

javascript```
// 페이지 로드 시
$(document).ready(function() {
  $efi.currencyEventAfterRender();
});

// 특정 영역에만 적용
$efi.currencyEventAfterRender($('#formArea'));

// 다이얼로그에 적용
$u.baseDialog.openModalDialog($dialog, {
  open: function() {
    $efi.currencyEventAfterRender($dialog);
  }
});```
### UD_0302_000 이벤트 핸들러 ​

#### `$efi.UD_0302_000EventHandler.editStatement()` ​

전표 수정 이벤트를 처리.

javascript```
$u.buttons.setHandler('edit', function() {
  $efi.UD_0302_000EventHandler.editStatement();
});```
#### `$efi.UD_0302_000EventHandler.cancelGroup()` ​

그룹 취소 이벤트를 처리.

javascript```
$u.buttons.setHandler('cancelGroup', function() {
  $efi.UD_0302_000EventHandler.cancelGroup();
});```
#### `$efi.UD_0302_000EventHandler.corporationCardCancelGroup()` ​

법인카드 그룹 취소 이벤트를 처리.

javascript```
$u.buttons.setHandler('corporationCardCancelGroup', function() {
  $efi.UD_0302_000EventHandler.corporationCardCancelGroup();
});```
## 💡 실전 예제 ​

### 증빙 아이콘 추가 ​

javascript```
// 그리드 렌더링 시 증빙 아이콘 추가
const gridObj = $u.gridWrapper.getGrid();

gridObj.setDrawCellCallback(function(grid, model, column, value) {
  if (column.fieldName === 'EVI_KB') {
    const rowData = gridObj.getJSONDataByRowIndex(model.index);

    if (rowData.EVI_SEQ) {
      const $icon = $efi.get$evidenceIcon({
        EVI_SEQ: rowData.EVI_SEQ,
        INV_SEQ: rowData.INV_SEQ,
        CRD_SEQ: rowData.CRD_SEQ
      });

      return $icon;
    }
  }
});```
### 통화 변경 시 금액 필드 소수점 자동 조정 ​

javascript```
$(document).ready(function() {
  // 통화 이벤트 설정
  $efi.currencyEventAfterRender();

  // WAERS 컬럼이 있으면 자동으로 다음이 설정됨:
  // 1. 통화 변경 시 모든 금액 필드의 소수점 자리수 조정
  // 2. 그리드의 숫자 컬럼 소수점 자리수 조정
  // 3. WRBTR 필드 change 이벤트 자동 트리거
});```
### 사업자 상태 확인 ​

javascript```
// 거래처 입력 후 사업자 상태 확인
$u.get('form-table1', 'LIFNR').$el.change(function() {
  const lifnr = $(this).val();

  if (lifnr) {
    // 거래처 정보 조회
    $nst.is_data_os_data('GET_VENDOR_INFO', { LIFNR: lifnr }, function(os_data) {
      const stcd1 = os_data.STCD1; // 사업자번호

      if (stcd1) {
        // 폐업 여부 확인
        $efi.showExGateClosedVendorStatus(stcd1);
      }
    });
  }
});```
### 전표 수정 버튼 ​

javascript```
// UD_0302_000 화면의 전표 수정 버튼
$u.buttons.setHandler('editStatement', function() {
  try {
    $efi.UD_0302_000EventHandler.editStatement();
  } catch (error) {
    unidocuAlert(error);
  }
});```
### 그룹 취소 ​

javascript```
// 전표 그룹 취소
$u.buttons.setHandler('cancelGroup', function() {
  try {
    $efi.UD_0302_000EventHandler.cancelGroup();
  } catch (error) {
    unidocuAlert(error);
  }
});```
### 증빙 첨부 버튼 ​

javascript```
// 증빙 첨부 버튼 클릭
$('#attachEvidenceButton').click(function() {
  const headerData = $u.getValues('form-table1');

  $efi.evikbClickHandler({
    BUKRS: headerData.BUKRS,
    BELNR: headerData.BELNR,
    GJAHR: headerData.GJAHR
  });
});```
## ⚠️ 주의사항 ​

- `$efi` 객체는 e-FI 모듈이 로드된 경우에만 사용 가능합니다
- 증빙 처리 관련 메서드는 EVI_SEQ, INV_SEQ, CRD_SEQ 등의 키를 필요로 합니다
- 통화 이벤트는 WAERS 필드가 존재해야 동작합니다
- UD_0302_000EventHandler는 특정 프로그램(UD_0302_000)에서만 사용됩니다
- 사업자 상태 조회는 ExGate 시스템과 연동이 필요합니다