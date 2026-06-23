# 데이터 접근 ​

Grid의 개별 셀 데이터를 읽고 쓰는 방법을 안내.

## 개요 ​

개발자는 Grid의 셀 데이터에 접근하기 위해 `$V`와 `$F` 메서드를 사용. 이 메서드들은 Grid 데이터 조작의 가장 기본이 되는 API.

## 메서드 ​

- `$V`: 특정 셀의 값을 읽거나 쓰는 메서드
- `$F`: 특정 값을 가진 행들의 인덱스를 찾는 메서드

## 사용법 ​

### $V 메서드 ​

`$V` 메서드는 Grid의 특정 셀 값을 읽거나 쓰는 데 사용됩니다.

#### 셀 값 읽기 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 0번째 행의 'BUKRS' 컬럼 값 읽기
const bukrs = gridObj.$V('BUKRS', 0);

// 5번째 행의 'WRBTR' 컬럼 값 읽기
const amount = gridObj.$V('WRBTR', 5);```
#### 셀 값 쓰기 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 0번째 행의 'BUKRS' 컬럼에 '1000' 값 설정
gridObj.$V('BUKRS', 0, '1000');

// 2번째 행의 'WRBTR' 컬럼에 금액 설정
gridObj.$V('WRBTR', 2, '1000000');```
#### 파라미터 설명 ​

- `columnKey` (string): 컬럼의 키(필드명)
- `rowIndex` (number): 행 인덱스 (0부터 시작)
- `value` (any, optional): 설정할 값 (생략 시 읽기)

### $F 메서드 ​

`$F` 메서드는 특정 값을 가진 행들의 인덱스를 찾는 데 사용됩니다.

#### 기본 예제 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 'BUKRS' 컬럼 값이 '1000'인 행들의 인덱스 배열 반환
const rowIndexes = gridObj.$F('1000', 'BUKRS');
// 결과 예시: [0, 3, 5]

// 'STATUS' 컬럼 값이 'A'인 행들의 인덱스 배열 반환
const activeRows = gridObj.$F('A', 'STATUS');```
#### 선택된 행 찾기 ​

`SELECTED` 컬럼을 사용하면 사용자가 체크박스로 선택한 행들을 찾을 수 있습니다:

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 선택된 행들의 인덱스 배열
const selectedIndexes = gridObj.$F('1', 'SELECTED');

// 또는 getSelectedRowIndexes 메서드 사용 (동일한 결과)
const selectedIndexes = gridObj.getSelectedRowIndexes();```
#### 파라미터 설명 ​

- `value` (any): 찾을 값
- `columnKey` (string): 검색할 컬럼의 키

## 활용 예제 ​

### 💡 실전 예제 1: 선택된 행의 값 변경 ​

javascript```
function updateSelectedStatus() {
    const gridObj = $u.gridWrapper.getGrid();

    // 선택된 행들의 인덱스 가져오기
    const selectedIndexes = gridObj.$F('1', 'SELECTED');

    if (selectedIndexes.length === 0) {
        throw '행을 선택해주세요.';
    }

    // 선택된 모든 행의 상태를 'P'(처리중)로 변경
    selectedIndexes.forEach((rowIndex) => {
        gridObj.$V('STATUS', rowIndex, 'P');
    });

    unidocuAlert('상태가 변경되었습니다.');
}```
### 💡 실전 예제 2: 금액 자동 계산 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 수량 변경 시 금액 자동 계산
gridObj.onChangeCell((columnKey, rowIndex, oldValue, newValue) => {
    if (columnKey === 'QUANTITY') {
        // 단가 가져오기
        const price = gridObj.$V('PRICE', rowIndex);

        // 금액 계산 (수량 * 단가)
        const amount = Number(newValue) * Number(price);

        // 금액 컬럼에 설정
        gridObj.$V('AMOUNT', rowIndex, amount);
    }
});```
### 💡 실전 예제 3: 특정 조건의 행 찾기 및 처리 ​

javascript```
function processCompletedItems() {
    const gridObj = $u.gridWrapper.getGrid();

    // 상태가 'COMPLETED'인 행들 찾기
    const completedRows = gridObj.$F('COMPLETED', 'STATUS');

    if (completedRows.length === 0) {
        unidocuAlert('완료된 항목이 없습니다.');
        return;
    }

    // 완료된 행들을 읽기 전용으로 설정
    completedRows.forEach((rowIndex) => {
        gridObj.makeRowReadOnly(rowIndex);
    });

    unidocuAlert(`${completedRows.length}개 항목을 처리했습니다.`);
}```
### 💡 실전 예제 4: 빈 값 체크 ​

javascript```
function validateRequiredFields() {
    const gridObj = $u.gridWrapper.getGrid();
    const rowCount = gridObj.getRowCount();

    for (let i = 0; i  rowCount; i++) {
        // 'BUKRS' 필드가 비어있는지 확인
        const bukrs = gridObj.$V('BUKRS', i);
        if (!bukrs || bukrs === '') {
            throw `${i + 1}번째 행의 회사코드를 입력해주세요.`;
        }
    }

    unidocuAlert('검증이 완료되었습니다.');
}```
### 💡 실전 예제 5: 중복 값 체크 ​

javascript```
function checkDuplicateDocumentNo() {
    const gridObj = $u.gridWrapper.getGrid();
    const documentNo = gridObj.$V('DOCUMENT_NO', 0);

    // 같은 문서번호를 가진 행 찾기
    const duplicateRows = gridObj.$F(documentNo, 'DOCUMENT_NO');

    if (duplicateRows.length > 1) {
        throw `문서번호가 중복되었습니다: ${documentNo}`;
    }

    unidocuAlert('중복 검사가 완료되었습니다.');
}```
## ❌ 안티 패턴 ​

개발자는 다음과 같은 잘못된 사용 방법을 피해야 합니다:

### ❌ 직접 데이터 객체 접근 ​

javascript```
// ❌ 잘못된 방법
const data = gridObj._rg.getValues(0);
data.BUKRS = '1000';

// ✅ 올바른 방법
gridObj.$V('BUKRS', 0, '1000');```
### ❌ 존재하지 않는 컬럼 접근 ​

javascript```
// ❌ 잘못된 방법 (에러 발생)
const value = gridObj.$V('NONEXISTENT_COLUMN', 0);

// ✅ 올바른 방법 (컬럼 존재 여부 확인)
if (gridObj.getGridHeader('OPTIONAL_COLUMN')) {
    const value = gridObj.$V('OPTIONAL_COLUMN', 0);
}```
### ❌ 잘못된 rowIndex 사용 ​

javascript```
// ❌ 잘못된 방법 (rowIndex는 0부터 시작)
const firstRowValue = gridObj.$V('BUKRS', 1); // 2번째 행을 가져옴

// ✅ 올바른 방법
const firstRowValue = gridObj.$V('BUKRS', 0); // 첫 번째 행을 가져옴```
## ⚠️ 주의사항 ​

개발자는 다음 사항에 주의해야 합니다:

- `rowIndex`는 0부터 시작합니다 (첫 번째 행은 0)
- 존재하지 않는 컬럼에 접근하면 에러가 발생합니다
- `$V` 메서드로 값을 변경하면 CRUD 상태가 'U'(수정)로 자동 설정됩니다
- `$F` 메서드는 정확히 일치하는 값만 찾습니다 (부분 일치 불가)
- 날짜 타입 컬럼의 경우 Date 객체 또는 문자열 형식으로 값을 설정할 수 있습니다