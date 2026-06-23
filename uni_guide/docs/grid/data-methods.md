# gridObj 데이터 메서드 ​

그리드 데이터 조작을 위한 메서드 모음

## 개요 ​

`gridObj`는 그리드의 데이터를 읽고 쓰는 다양한 메서드를 제공. 이 문서에서는 `unidocuRgData.js`에 정의된 데이터 접근 및 조작 메서드들을 다룹니다.

## 데이터 접근 메서드 ​

### 셀 값 읽기/쓰기 ​

#### `gridObj.$V(columnKey, rowIndex, value)` ​

그리드 셀의 값을 읽거나 씁니다. 가장 많이 사용되는 핵심 메서드.

| 파라미터 | 타입 | 설명 |
| columnKey | string | 컬럼 키 |
| rowIndex | number | 행 인덱스 (0부터 시작) |
| value (선택) | any | 설정할 값 (생략 시 값 조회) |
**반환값** (읽기 모드)

- (any) - 셀의 값

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 값 읽기
const matnr = gridObj.$V('MATNR', 0);
console.log(matnr); // "MAT001"

// 값 쓰기
gridObj.$V('MENGE', 0, 100);
gridObj.$V('MEINS', 0, 'EA');

// CRUD 컬럼이 있으면 자동으로 'U'로 설정됩니다```
#### `gridObj.$F(value, columnKey)` ​

특정 값을 가진 행의 인덱스 목록을 반환. (Find)

| 파라미터 | 타입 | 설명 |
| value | any | 찾을 값 |
| columnKey | string | 컬럼 키 |
**반환값**

- (`Array`) - 행 인덱스 배열

javascript```
// 특정 값을 가진 행 찾기
const rowIndexes = gridObj.$F('MAT001', 'MATNR');
console.log(rowIndexes); // [0, 3, 5]

// SELECTED 컬럼 체크된 행 찾기
const selectedRows = gridObj.$F('1', 'SELECTED');

// 빈 값 찾기
const emptyRows = gridObj.$F('', 'MATNR');```
## 데이터 조회 메서드 ​

### 전체 데이터 조회 ​

#### `gridObj.getJSONData()` ​

그리드의 모든 데이터를 JSON 배열로 반환.

**반환값**

- (`Array`) - 그리드 데이터 배열

javascript```
const allData = gridObj.getJSONData();
console.log(allData);
// [
//   { MATNR: 'MAT001', MAKTX: '제품1', MENGE: 10 },
//   { MATNR: 'MAT002', MAKTX: '제품2', MENGE: 20 }
// ]

// 데이터 건수 확인
console.log(allData.length);```
⚠️ **주의**: 트리 모드에서는 사용할 수 없습니다.

#### `gridObj.getJSONDataByRowIndex(rowIndex)` ​

특정 행의 데이터를 JSON 객체로 반환.

| 파라미터 | 타입 | 설명 |
| rowIndex | number | 행 인덱스 |
**반환값**: `Object` - 행 데이터 객체

javascript```
const rowData = gridObj.getJSONDataByRowIndex(0);
console.log(rowData);
// { MATNR: 'MAT001', MAKTX: '제품1', MENGE: 10, SELECTED: '0' }```
### 선택된 데이터 조회 ​

#### `gridObj.getSELECTEDJSONData()` ​

체크박스가 선택된 행들의 데이터를 반환.

**반환값**

- (`Array`) - 선택된 행 데이터 배열

javascript```
const selectedData = gridObj.getSELECTEDJSONData();

if (selectedData.length === 0) {
  unidocuAlert($mls.getByCode('M_no_selected_row'));
  return;
}

console.log(selectedData);
// [
//   { MATNR: 'MAT001', MAKTX: '제품1', SELECTED: '1' },
//   { MATNR: 'MAT003', MAKTX: '제품3', SELECTED: '1' }
// ]```
### CRUD 데이터 조회 ​

#### `gridObj.getCRUDJSONData()` ​

생성(C), 수정(U), 삭제(D)된 행들의 데이터를 반환.

**반환값**

- (`Array`) - CRUD 행 데이터 배열

javascript```
const crudData = gridObj.getCRUDJSONData();

if (crudData.length === 0) {
  unidocuAlert('변경된 데이터가 없습니다.');
  return;
}

console.log(crudData);
// [
//   { MATNR: 'MAT001', MENGE: 100, CRUD: 'U' },
//   { MATNR: 'NEW001', MENGE: 50, CRUD: 'C' },
//   { MATNR: 'DEL001', MENGE: 0, CRUD: 'D' }
// ]

// 저장
$nst.it_data_nsReturn('SAVE_FUNCTION', crudData, function(nsReturn) {
  unidocuAlert(nsReturn.getReturnMessage());
});```
📝 **참고**: CRUD 컬럼을 사용하려면 `gridObj.useCRUDHeader()`를 먼저 호출해야 합니다.

#### `gridObj.getCRUDJSONDataWithCRUDKey()` ​

CRUD 타입별로 분류된 데이터를 반환.

**반환값**: `Object` - CRUD 타입별 데이터 객체

- `C`: 생성된 행 배열
- `U`: 수정된 행 배열
- `D`: 삭제된 행 배열

javascript```
const crudDataByType = gridObj.getCRUDJSONDataWithCRUDKey();

console.log('생성:', crudDataByType.C.length + '건');
console.log('수정:', crudDataByType.U.length + '건');
console.log('삭제:', crudDataByType.D.length + '건');

// 타입별 처리
if (crudDataByType.C.length > 0) {
  // 생성 처리
}
if (crudDataByType.U.length > 0) {
  // 수정 처리
}
if (crudDataByType.D.length > 0) {
  // 삭제 처리
}```
## 데이터 조작 메서드 ​

### 행 추가 ​

#### `gridObj.addRow()` ​

그리드에 새 행을 추가.

javascript```
$('#addButton').click(function() {
  gridObj.addRow();

  // 추가된 행 인덱스
  const newRowIndex = gridObj.getRowCount() - 1;

  // 기본값 설정
  gridObj.$V('WERKS', newRowIndex, '1000');
  gridObj.$V('LGORT', newRowIndex, '0001');
});```
### 행 삭제 ​

#### `gridObj.deleteRow(rowIndex)` ​

특정 행을 삭제.

| 파라미터 | 타입 | 설명 |
| rowIndex | number | 삭제할 행 인덱스 |
javascript```
// 특정 행 삭제
gridObj.deleteRow(0);

// CRUD 모드에서는 'D'로 표시만 됨
// CRUD가 'C'인 행은 실제로 삭제됨```
#### `gridObj.deleteSelectedRows(columnKey)` ​

선택된 행들을 삭제.

| 파라미터 | 타입 | 설명 |
| columnKey (선택) | string | 선택 컬럼 키 (기본값: 'SELECTED') |
javascript```
$('#deleteButton').click(function() {
  gridObj.asserts.rowSelected();

  unidocuConfirm($mls.getByCode('M_delete_confirm'), function() {
    gridObj.deleteSelectedRows();
    unidocuAlert($mls.getByCode('M_delete_success'));
  });
});```
#### `gridObj.deleteRowByRowIndexes(rowIndexes)` ​

여러 행을 인덱스 배열로 삭제.

**파라미터**

- `rowIndexes` (`Array`) - 삭제할 행 인덱스 배열

javascript```
// 특정 조건의 행들 삭제
const emptyRows = gridObj.$F('', 'MATNR');
gridObj.deleteRowByRowIndexes(emptyRows);```
### 행 데이터 설정 ​

#### `gridObj.setRowDataByJSONObj(rowIndex, jsonObj)` ​

특정 행에 JSON 객체의 데이터를 설정.

| 파라미터 | 타입 | 설명 |
| rowIndex | number | 행 인덱스 |
| jsonObj | Object | 설정할 데이터 객체 |
javascript```
// 행 데이터 일괄 설정
gridObj.setRowDataByJSONObj(0, {
  MATNR: 'MAT001',
  MAKTX: '제품명1',
  MENGE: 100,
  MEINS: 'EA'
});```
#### `gridObj.clearGridRow(rowIndex, exceptHeader)` ​

특정 행의 데이터를 초기화.

| 파라미터 | 타입 | 설명 |
| rowIndex | number | 행 인덱스 |
javascript```
// 행 전체 초기화
gridObj.clearGridRow(0);

// 특정 컬럼 제외하고 초기화
gridObj.clearGridRow(0, ['WERKS', 'LGORT']);```
### 전체 데이터 클리어 ​

#### `gridObj.clearGridData()` ​

그리드의 모든 데이터를 삭제.

javascript```
$('#clearButton').click(function() {
  unidocuConfirm('모든 데이터를 삭제하시겠습니까?', function() {
    gridObj.clearGridData();
  });
});```
## 데���터 검증 메서드 ​

### 빈 값 체크 ​

#### `gridObj.isEmpty(columnKey, rowIndex)` ​

특정 셀이 비어있는지 확인.

| 파라미터 | 타입 | 설명 |
| columnKey | string | 컬럼 키 |
| rowIndex | number | 행 인덱스 |
**반환값**: `boolean` - 비어있으면 `true`

javascript```
if (gridObj.isEmpty('MATNR', 0)) {
  unidocuAlert('자재번호를 입력하세요.');
  return;
}

// 텍스트 컬럼(~_TXT)도 자동으로 체크
if (gridObj.isEmpty('PARTNER', 0)) {
  // PARTNER_TXT도 함께 체크됨
}```
### 행 개수 조회 ​

#### `gridObj.getRowCount()` ​

그리드의 행 개수를 반환.

**반환값**: `number` - 행 개수

javascript```
const rowCount = gridObj.getRowCount();
console.log('총 ' + rowCount + '건');

if (rowCount === 0) {
  unidocuAlert($mls.getByCode('M_no_data'));
}```
#### `gridObj.getRowCountByValue(value, columnKey)` ​

특정 값을 가진 행의 개수를 반환.

| 파라미터 | 타입 | 설명 |
| value | any | 찾을 값 |
| columnKey | string | 컬럼 키 |
**반환값**: `number` - 행 개수

javascript```
// 특정 창고의 자재 개수
const count = gridObj.getRowCountByValue('1000', 'WERKS');
console.log('1000 창고: ' + count + '건');

// 선택된 행 개수
const selectedCount = gridObj.getRowCountByValue('1', 'SELECTED');```
## 루프 메서드 ​

#### `gridObj.loopRowIndex(fn)` ​

모든 행을 순회하며 함수를 실행.

| 파라미터 | 타입 | 설명 |
| fn | function | 실행할 함수 `function(rowIndex) { }` |
- `return false`를 하면 루프 중단

javascript```
// 모든 행 순회
gridObj.loopRowIndex(function(rowIndex) {
  const matnr = gridObj.$V('MATNR', rowIndex);
  console.log(rowIndex + ': ' + matnr);
});

// 조건에 맞는 행 찾기 (중단)
let foundIndex = -1;
gridObj.loopRowIndex(function(rowIndex) {
  if (gridObj.$V('MATNR', rowIndex) === 'MAT001') {
    foundIndex = rowIndex;
    return false; // 루프 중단
  }
});```
## 숫자 포맷 메서드 ​

#### `gridObj.setColumnNumberPrecision(columnKey, precision)` ​

컬럼의 숫자 소수점 자리수를 설정.

| 파라미터 | 타입 | 설명 |
| columnKey | string | 컬럼 키 |
| precision | number | 소수점 자리수 |
javascript```
// 금액 컬럼: 소수점 2자리
gridObj.setColumnNumberPrecision('WRBTR', 2);

// 수량 컬럼: 소수점 3자리
gridObj.setColumnNumberPrecision('MENGE', 3);```
#### `gridObj.getColumnNumberPrecision(columnKey)` ​

컬럼의 숫자 소수점 자리수를 조회.

| 파라미터 | 타입 | 설명 |
| columnKey | string | 컬럼 키 |
**반환값**: `number` - 소수점 자리수

javascript```
const precision = gridObj.getColumnNumberPrecision('WRBTR');
console.log(precision); // 2```
## 💡 실전 예제 ​

### 그리드 데이터 검증 ​

javascript```
function validateGridData() {
  let isValid = true;

  gridObj.loopRowIndex(function(rowIndex) {
    // 필수 입력 체크
    if (gridObj.isEmpty('MATNR', rowIndex)) {
      unidocuAlert('자재번호를 입력하세요. (행: ' + (rowIndex + 1) + ')');
      gridObj.setCellFocus('MATNR', rowIndex);
      isValid = false;
      return false; // 루프 중단
    }

    // 수량 체크
    const menge = gridObj.$V('MENGE', rowIndex);
    if (Number(menge)  0) {
      unidocuAlert('수량은 0보다 커야 합니다. (행: ' + (rowIndex + 1) + ')');
      gridObj.setCellFocus('MENGE', rowIndex);
      isValid = false;
      return false;
    }
  });

  return isValid;
}```
### 데이터 일괄 수정 ​

javascript```
// 선택된 행의 창고를 일괄 변경
$('#changeWarehouseButton').click(function() {
  const selectedRows = gridObj.$F('1', 'SELECTED');

  if (selectedRows.length === 0) {
    unidocuAlert($mls.getByCode('M_no_selected_row'));
    return;
  }

  const newWerks = '2000';

  $.each(selectedRows, function(index, rowIndex) {
    gridObj.$V('WERKS', rowIndex, newWerks);
  });

  unidocuAlert(selectedRows.length + '건 변경되었습니다.');
});```
### 합계 계산 ​

javascript```
function calculateTotal() {
  let totalAmount = 0;

  gridObj.loopRowIndex(function(rowIndex) {
    const menge = Number(gridObj.$V('MENGE', rowIndex) || 0);
    const price = Number(gridObj.$V('NETPR', rowIndex) || 0);
    const amount = menge * price;

    // 금액 컬럼에 계산 결과 설정
    gridObj.$V('WRBTR', rowIndex, amount);

    totalAmount += amount;
  });

  // 합계 표시
  $('#totalAmount').text($u.util.convertAmountNumberFormat(totalAmount, 2));
}```
### 중복 체크 ​

javascript```
function checkDuplicate() {
  const matnrList = [];
  let hasDuplicate = false;

  gridObj.loopRowIndex(function(rowIndex) {
    const matnr = gridObj.$V('MATNR', rowIndex);

    if (matnr && matnrList.indexOf(matnr) !== -1) {
      unidocuAlert('중복된 자재번호가 있습니다: ' + matnr);
      hasDuplicate = true;
      return false;
    }

    matnrList.push(matnr);
  });

  return !hasDuplicate;
}```
## ⚠️ 주의사항 ​

- `$V` 메서드는 CRUD 컬럼이 있으면 자동으로 'U'로 설정합니다
- 콤보박스 컬럼은 코드값으로 설정해야 합니다 (텍스트 아님)
- 날짜 컬럼은 데이터 포맷(YYYYMMDD)으로 설정해야 합니다
- 트리 모드에서는 `getJSONData()`를 사용할 수 없습니다
- 그룹 모드에서는 행 인덱스가 실제 데이터 인덱스와 다를 수 있습니다
- `deleteRow`는 CRUD 모드에서 실제 삭제가 아닌 'D' 표시만 합니다
- `loopRowIndex`에서 데이터를 수정하면 성능에 영향을 줄 수 있습니다