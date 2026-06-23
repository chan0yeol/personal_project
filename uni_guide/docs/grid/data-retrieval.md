# 데이터 조회 ​

Grid의 전체 데이터 또는 선택된 데이터 조회 방법을 안내.

## 개요 ​

Grid 데이터를 조회하기 위해 다양한 메서드를 . 개별 셀 데이터가 아닌 여러 행의 데이터를 한번에 가져와야 하는 경우에 사용.

## 메서드 ​

- `getJSONData()`: 전체 행 데이터 조회
- `getSELECTEDJSONData()`: 선택된 행 데이터 조회
- `getCRUDJSONData()`: 변경된 행 데이터 조회 (CRUD 모드)
- `getJSONDataByRowIndex()`: 특정 행 데이터 조회

## 사용법 ​

### getJSONData - 전체 데이터 조회 ​

`getJSONData` 메서드는 Grid의 모든 행 데이터를 JSON 배열로 반환.

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 전체 데이터 조회
const allData = gridObj.getJSONData();

// 결과 예시
// [
//   { BUKRS: '1000', WRBTR: '100000', WAERS: 'KRW', SELECTED: '0' },
//   { BUKRS: '2000', WRBTR: '200000', WAERS: 'KRW', SELECTED: '1' },
//   { BUKRS: '3000', WRBTR: '300000', WAERS: 'USD', SELECTED: '0' }
// ]

console.log('총 행 수:', allData.length);```
### getSELECTEDJSONData - 선택된 데이터 조회 ​

`getSELECTEDJSONData` 메서드는 사용자가 체크박스로 선택한 행들의 데이터만 반환.

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 선택된 행 데이터 조회
const selectedData = gridObj.getSELECTEDJSONData();

// 결과 예시 (SELECTED = '1'인 행만)
// [
//   { BUKRS: '2000', WRBTR: '200000', WAERS: 'KRW', SELECTED: '1' }
// ]

console.log('선택된 행 수:', selectedData.length);```
### getCRUDJSONData - 변경된 데이터 조회 ​

`getCRUDJSONData` 메서드는 CRUD 모드에서 생성(C), 수정(U), 삭제(D)된 행들의 데이터만 반환.

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 변경된 행 데이터 조회
const changedData = gridObj.getCRUDJSONData();

// 결과 예시
// [
//   { BUKRS: '1000', WRBTR: '100000', CRUD: 'C', SELECTED: '1' }, // 생성
//   { BUKRS: '2000', WRBTR: '200000', CRUD: 'U', SELECTED: '0' }, // 수정
//   { BUKRS: '3000', WRBTR: '300000', CRUD: 'D', SELECTED: '0' }  // 삭제
// ]```
**참고**: `getCRUDJSONData`를 사용하려면 먼저 `gridObj.useCRUDHeader()`를 호출해야 합니다.

### getJSONDataByRowIndex - 특정 행 데이터 조회 ​

`getJSONDataByRowIndex` 메서드는 특정 행의 전체 데이터를 객체로 반환.

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 0번째 행 데이터 조회
const firstRow = gridObj.getJSONDataByRowIndex(0);

// 결과 예시
// { BUKRS: '1000', WRBTR: '100000', WAERS: 'KRW', SELECTED: '0' }

console.log('회사코드:', firstRow.BUKRS);
console.log('금액:', firstRow.WRBTR);```
### getRowCount - 행 개수 조회 ​

`getRowCount` 메서드는 Grid의 총 행 개수를 반환.

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 총 행 개수
const rowCount = gridObj.getRowCount();

console.log('총 행 수:', rowCount);```
## 활용 예제 ​

### 💡 실전 예제 1: 선택된 데이터 서버 전송 ​

javascript```
function saveSelectedData() {
    const gridObj = $u.gridWrapper.getGrid();

    // 선택된 행 확인
    gridObj.asserts.rowSelected();

    // 선택된 데이터 가져오기
    const selectedData = gridObj.getSELECTEDJSONData();

    // 서버로 전송
    $nst.it_data_returnMessage('ZUNIEFI_SAVE', selectedData, (message) => {
        unidocuAlert(message, () => {
            // 저장 후 재조회
            $u.buttons.triggerFormTableButtonClick();
        });
    });
}```
### 💡 실전 예제 2: 전체 데이터 검증 ​

javascript```
function validateAllData() {
    const gridObj = $u.gridWrapper.getGrid();
    const allData = gridObj.getJSONData();

    if (allData.length === 0) {
        throw '데이터가 없습니다.';
    }

    // 모든 행의 필수 필드 검증
    allData.forEach((row, index) => {
        if (!row.BUKRS || row.BUKRS === '') {
            throw `${index + 1}번째 행의 회사코드를 입력해주세요.`;
        }

        if (!row.WRBTR || row.WRBTR === '0') {
            throw `${index + 1}번째 행의 금액을 입력해주세요.`;
        }
    });

    unidocuAlert('검증이 완료되었습니다.');
}```
### 💡 실전 예제 3: CRUD 데이터만 저장 ​

javascript```
function saveCRUDData() {
    const gridObj = $u.gridWrapper.getGrid();

    // 변경된 데이터만 가져오기
    const crudData = gridObj.getCRUDJSONData();

    if (crudData.length === 0) {
        unidocuAlert('변경된 데이터가 없습니다.');
        return;
    }

    // CRUD별로 분류
    const crudWithKey = gridObj.getCRUDJSONDataWithCRUDKey();
    console.log('생성:', crudWithKey.C.length);
    console.log('수정:', crudWithKey.U.length);
    console.log('삭제:', crudWithKey.D.length);

    // 서버로 전송
    $nst.it_data_returnMessage('ZUNIEFI_CRUD_SAVE', crudData, (message) => {
        unidocuAlert(message);
    });
}```
### 💡 실전 예제 4: 선택된 데이터 합계 계산 ​

javascript```
function calculateSelectedSum() {
    const gridObj = $u.gridWrapper.getGrid();
    const selectedData = gridObj.getSELECTEDJSONData();

    if (selectedData.length === 0) {
        throw '행을 선택해주세요.';
    }

    // 선택된 행의 금액 합계 계산
    const totalAmount = selectedData.reduce((sum, row) => {
        return sum + Number(row.WRBTR || 0);
    }, 0);

    unidocuAlert(`선택된 항목의 합계: ${totalAmount}`);
}```
### 💡 실전 예제 5: 데이터 필터링 후 조회 ​

javascript```
function processActiveData() {
    const gridObj = $u.gridWrapper.getGrid();
    const allData = gridObj.getJSONData();

    // 상태가 'A'(활성)인 데이터만 필터링
    const activeData = allData.filter(row => row.STATUS === 'A');

    console.log('활성 데이터:', activeData.length);

    // 필터링된 데이터로 다른 처리
    if (activeData.length > 0) {
        // 서버 전송 또는 다른 그리드에 설정 등
        $nst.it_data_returnMessage('PROCESS_ACTIVE', activeData, (message) => {
            unidocuAlert(message);
        });
    } else {
        unidocuAlert('활성 데이터가 없습니다.');
    }
}```
### 💡 실전 예제 6: 단일 행 선택 후 상세 조회 ​

javascript```
function viewDetailPage() {
    const gridObj = $u.gridWrapper.getGrid();

    // 정확히 1개 행 선택 확인
    gridObj.asserts.selectedExactOneRow();

    // 선택된 행 데이터
    const selectedRow = gridObj.getSELECTEDJSONData()[0];

    // 상세 화면으로 이동
    $u.navigateByProgramId('DETAIL_PROGRAM', {
        DOCUMENT_NO: selectedRow.DOCUMENT_NO,
        FISCAL_YEAR: selectedRow.FISCAL_YEAR
    });
}```
## ❌ 안티 패턴 ​

개발자는 다음과 같은 잘못된 사용 방법을 피해야 합니다:

### ❌ 불필요한 전체 데이터 조회 ​

javascript```
// ❌ 잘못된 방법 (단일 행 데이터가 필요한 경우)
const allData = gridObj.getJSONData();
const firstRow = allData[0];

// ✅ 올바른 방법
const firstRow = gridObj.getJSONDataByRowIndex(0);```
### ❌ 선택 검증 없이 데이터 접근 ​

javascript```
// ❌ 잘못된 방법 (선택된 행이 없으면 에러)
const selectedData = gridObj.getSELECTEDJSONData();
const firstSelected = selectedData[0].BUKRS; // 에러 발생 가능

// ✅ 올바른 방법
gridObj.asserts.rowSelected();
const selectedData = gridObj.getSELECTEDJSONData();
const firstSelected = selectedData[0].BUKRS;```
### ❌ CRUD 헤더 설정 없이 getCRUDJSONData 호출 ​

javascript```
// ❌ 잘못된 방법 (에러 발생)
const crudData = gridObj.getCRUDJSONData();

// ✅ 올바른 방법
// 먼저 CRUD 모드 활성화 필요
gridObj.useCRUDHeader();
// 이후 사용
const crudData = gridObj.getCRUDJSONData();```
## ⚠️ 주의사항 ​

개발자는 다음 사항에 주의해야 합니다:

- `getJSONData()`는 Tree 모드에서 사용할 수 없습니다
- `getSELECTEDJSONData()`는 체크박스로 선택된 행만 반환합니다
- `getCRUDJSONData()`는 `useCRUDHeader()` 호출 후에만 사용 가능합니다
- 반환된 데이터는 복사본이므로 직접 수정해도 Grid에 반영되지 않습니다
- Group By 모드에서는 그룹 헤더/푸터 행이 제외됩니다