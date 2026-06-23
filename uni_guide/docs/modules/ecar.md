# $ecar - e-Car 모듈 ​

차량 관리 모듈의 전역 객체

## 개요 ​

`$ecar`는 UniWORKS의 차량(e-Car) 관리 모듈을 위한 전역 객체. 차량 문서 관리, 권한 검증, 읽기 전용 설정 등의 기능을 제공.

## 주요 네임스페이스 ​

### $ecar.dialog ​

다이얼로그 관리

## 주요 메서드 ​

### 페이지 이동 ​

#### `$ecar.moveToCarDoc(paramMap, grono)` ​

차량 문서 화면으로 이동.

| 파라미터 | 타입 | 설명 |
| paramMap | Object | ZUNIEFI_6611 RFC 호출 파라미터 |
| grono (선택) | string | 그룹번호 (있으면 읽기 전용 모드) |
**반환값**

- (void)

javascript```
// 편집 모드로 이동
$ecar.moveToCarDoc({
  BUKRS: '1000',
  BELNR: '12345',
  GJAHR: '2025'
});

// 읽기 전용 모드로 이동 (grono가 있는 경우)
$ecar.moveToCarDoc({
  BUKRS: '1000',
  BELNR: '12345',
  GJAHR: '2025'
}, 'GR12345');```
### 권한 검증 ​

#### `$ecar.isCarRole()` ​

현재 사용자가 차량 권한을 가지고 있는지 확인.

**반환값**: `boolean` - 차량 권한이 있으면 `true`

javascript```
if ($ecar.isCarRole()) {
  // 차량 관련 기능 활성화
  $('#carManagementButton').show();
} else {
  // 차량 관련 기능 비활성화
  $('#carManagementButton').hide();
}```
**권한 종류**

- `CAR_01`: 차량 관리자
- `CAR_02`: 차량 사용자
- `CAR_03`: 차량 조회

#### `$ecar.isCarFIProgramId()` ​

현재 프로그램이 차량 비용 관련 프로그램인지 확인.

**반환값**: `boolean` - 차량 비용 프로그램이면 `true`

javascript```
if ($ecar.isCarFIProgramId()) {
  // 차량 비용 관련 처리
  loadCarExpenseData();
}```
**차량 비용 프로그램 목록**

- `UD_0208_001`: 차량 비용 관리
- `UD_0208_000C`: 차량 비용 생성
- `UD_0208_011`: 차량 비용 조회1
- `UD_0208_021`: 차량 비용 조회2
- `UD_0208_031`: 차량 비용 조회3

### 읽기 전용 설정 ​

#### `$ecar.makeReadOnlyHeaderALL()` ​

모든 헤더 필드를 읽기 전용으로 설정.

javascript```
// 읽기 전용 모드 설정
if ($ewf.draftUtil.isReadOnly()) {
  $ecar.makeReadOnlyHeaderALL();
}```
#### `$ecar.makeReadOnlyGridALL(...args)` ​

주어진 모든 그리드를 읽기 전용으로 설정.

**파라미터**

- `...args` (gridObj[]) - 읽기 전용으로 설정할 그리드들

javascript```
// 단일 그리드 읽기 전용 설정
const gridObj1 = $u.gridWrapper.getGrid();
$ecar.makeReadOnlyGridALL(gridObj1);

// 여러 그리드 동시 설정
const gridObj2 = $u.gridWrapper.getGrid('grid2');
const gridObj3 = $u.gridWrapper.getGrid('grid3');
$ecar.makeReadOnlyGridALL(gridObj1, gridObj2, gridObj3);```
**동작**

- 각 그리드의 `SELECTED` 컬럼을 숨김
- 팝업 코드 컬럼의 서브 컬럼(`_` 접미사)을 숨김
- 모든 컬럼을 읽기 전용으로 설정

## 💡 실전 예제 ​

### 차량 문서 조회 버튼 ​

javascript```
// 차량 문서 조회 버튼 클릭
$('#viewCarDocButton').click(function() {
  const selectedRow = gridObj.getSelectedJSONData();

  if (selectedRow.length === 0) {
    unidocuAlert($mls.getByCode('M_selectRow'));
    return;
  }

  const rowData = selectedRow[0];

  // 차량 문서 화면으로 이동
  $ecar.moveToCarDoc({
    BUKRS: rowData.BUKRS,
    BELNR: rowData.BELNR,
    GJAHR: rowData.GJAHR
  }, rowData.GRONO);
});```
### 권한 기반 UI 제어 ​

javascript```
$(document).ready(function() {
  // 차량 권한 확인
  if (!$ecar.isCarRole()) {
    // 권한이 없으면 차량 관리 메뉴 숨김
    $('#carManagementMenu').hide();

    unidocuAlert($mls.getByCode('M_noPermission'));
    return;
  }

  // 차량 비용 프로그램인지 확인
  if ($ecar.isCarFIProgramId()) {
    // 차량 비용 관련 추가 UI 표시
    $('#carExpenseSection').show();
  }
});```
### 읽기 전용 모드 설정 ​

javascript```
$(document).ready(function() {
  const mode = $u.page.getPageParams().mode;

  if (mode === 'readOnly') {
    // 모든 헤더 필드 읽기 전용
    $ecar.makeReadOnlyHeaderALL();

    // 모든 그리드 읽기 전용
    const gridObj1 = $u.gridWrapper.getGrid('grid1');
    const gridObj2 = $u.gridWrapper.getGrid('grid2');
    $ecar.makeReadOnlyGridALL(gridObj1, gridObj2);

    // 버튼 숨김
    $u.buttons.hide('save');
    $u.buttons.hide('submit');
  }
});```
### 차량 비용 프로그램 분기 처리 ​

javascript```
$(document).ready(function() {
  if ($ecar.isCarFIProgramId()) {
    // 차량 비용 프로그램에서만 실행되는 로직
    loadCarExpenseSettings();

    // 차량 정보 조회
    $nst.is_data_ot_data('GET_CAR_INFO', {}, function(ot_data) {
      // 차량 목록 렌더링
      renderCarList(ot_data);
    });
  } else {
    // 일반 차량 프로그램
    loadGeneralCarSettings();
  }
});```
## ⚠️ 주의사항 ​

- `$ecar` 객체는 e-Car 모듈이 로드된 경우에만 사용 가능합니다
- `moveToCarDoc`는 ZUNIEFI_6611 RFC가 정상적으로 응답해야 동작합니다
- `isCarRole`은 사용자의 ROLE 정보가 로드되어 있어야 합니다
- `makeReadOnlyHeaderALL`은 헤더 필드가 초기화된 후에 호출해야 합니다
- `makeReadOnlyGridALL`은 그리드가 렌더링된 후에 호출해야 합니다