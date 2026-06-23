# 이벤트 처리 ​

Grid의 다양한 이벤트를 처리하는 방법을 안내.

## 개요 ​

개발자는 Grid에서 발생하는 사용자 이벤트를 처리하여 동적인 기능을 구현. Grid는 셀 클릭, 값 변경, 행 선택 등 다양한 이벤트를 제공.

### 주요 이벤트 ​

- `onCellClick`: 셀 클릭 이벤트
- `onCellDblClick`: 셀 더블클릭 이벤트
- `onChangeCell`: 셀 값 변경 이벤트
- `onChangeRow`: 행 변경 이벤트
- `onRowActivate`: 행 활성화 이벤트
- `onChangeHeaderCheckBox`: 헤더 체크박스 변경 이벤트

## 사용법 ​

### onCellClick - 셀 클릭 이벤트 ​

`onCellClick` 이벤트는 사용자가 셀을 클릭했을 때 발생.

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onCellClick((columnKey, rowIndex) => {
    console.log('클릭된 컬럼:', columnKey);
    console.log('클릭된 행:', rowIndex);

    // 클릭된 셀의 값
    const cellValue = gridObj.$V(columnKey, rowIndex);
    console.log('셀 값:', cellValue);
});```
#### 파라미터 ​

- `columnKey` (string): 클릭된 셀의 컬럼 키
- `rowIndex` (number): 클릭된 행의 인덱스

### onCellDblClick - 셀 더블클릭 이벤트 ​

`onCellDblClick` 이벤트는 사용자가 셀을 더블클릭했을 때 발생.

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onCellDblClick((columnKey, rowIndex) => {
    console.log('더블클릭된 셀:', columnKey, rowIndex);
});```
### onChangeCell - 셀 값 변경 이벤트 ​

`onChangeCell` 이벤트는 셀의 값이 변경되었을 때 발생.

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onChangeCell((columnKey, rowIndex, oldValue, newValue) => {
    console.log('변경된 컬럼:', columnKey);
    console.log('행:', rowIndex);
    console.log('이전 값:', oldValue);
    console.log('새 값:', newValue);
});```
#### 파라미터 ​

- `columnKey` (string): 변경된 셀의 컬럼 키
- `rowIndex` (number): 변경된 행의 인덱스
- `oldValue` (any): 변경 전 값
- `newValue` (any): 변경 후 값

### onRowActivate - 행 활성화 이벤트 ​

`onRowActivate` 이벤트는 사용자가 다른 행으로 이동했을 때 발생.

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onRowActivate((rowIndex) => {
    console.log('활성화된 행:', rowIndex);

    // 행 데이터 가져오기
    const rowData = gridObj.getJSONDataByRowIndex(rowIndex);
    console.log('행 데이터:', rowData);
});```
#### 파라미터 ​

- `rowIndex` (number): 활성화된 행의 인덱스

### onChangeRow - 행 변경 이벤트 ​

`onChangeRow` 이벤트는 활성 행이 변경되었을 때 발생.

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onChangeRow((oldRowIndex, newRowIndex) => {
    console.log('이전 행:', oldRowIndex);
    console.log('새 행:', newRowIndex);
});```
## 활용 예제 ​

### 💡 실전 예제 1: 특정 컬럼 클릭 시 상세 팝업 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onCellClick((columnKey, rowIndex) => {
    // 문서번호 컬럼 클릭 시에만 처리
    if (columnKey !== 'DOCUMENT_NO') return;

    const documentNo = gridObj.$V('DOCUMENT_NO', rowIndex);
    const fiscalYear = gridObj.$V('FISCAL_YEAR', rowIndex);

    // 상세 팝업 열기
    $u.popup.openProgramId('DOCUMENT_DETAIL', {
        DOCUMENT_NO: documentNo,
        FISCAL_YEAR: fiscalYear
    });
});```
### 💡 실전 예제 2: 금액 자동 계산 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onChangeCell((columnKey, rowIndex, oldValue, newValue) => {
    // 수량 또는 단가 변경 시 금액 자동 계산
    if (columnKey === 'QUANTITY' || columnKey === 'PRICE') {
        const quantity = Number(gridObj.$V('QUANTITY', rowIndex) || 0);
        const price = Number(gridObj.$V('PRICE', rowIndex) || 0);
        const amount = quantity * price;

        // 금액 컬럼에 계산 결과 설정
        gridObj.$V('AMOUNT', rowIndex, amount);
    }
});```
### 💡 실전 예제 3: 세금계산서 번호 클릭 시 이미지 표시 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onCellClick((columnKey, rowIndex) => {
    if (columnKey !== 'ISSUE_ID') return;

    const invSeq = gridObj.$V('INV_SEQ', rowIndex);

    // 세금계산서 팝업 열기
    $efi.popup.openTaxInvoice(invSeq);
});```
### 💡 실전 예제 4: 행 선택 시 상태별 편집 제어 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onRowActivate((rowIndex) => {
    const status = gridObj.$V('STATUS', rowIndex);

    // 상태가 '완료'인 경우 모든 셀을 읽기 전용으로
    if (status === 'COMPLETED') {
        gridObj.makeRowReadOnly(rowIndex);
    }
    // 상태가 '작성중'인 경우 편집 가능하게
    else if (status === 'DRAFT') {
        gridObj.makeRowEditable(rowIndex);

        // 필수 입력 필드 설정
        gridObj.makeCellRequired('BUKRS', rowIndex);
        gridObj.makeCellRequired('WRBTR', rowIndex);
    }
});```
### 💡 실전 예제 5: 콤보박스 값 변경 시 연관 필드 자동 설정 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onChangeCell((columnKey, rowIndex, oldValue, newValue) => {
    if (columnKey === 'KOSTL') {
        // 코스트센터 변경 시 서버에서 관련 정보 조회
        $nst.is_data_os_data('GET_KOSTL_INFO', {
            KOSTL: newValue
        }, (os_data) => {
            // 코스트센터 이름 자동 설정
            gridObj.$V('KOSTL_TXT', rowIndex, os_data.KOSTL_TXT);
            // 담당자 자동 설정
            gridObj.$V('PERNR', rowIndex, os_data.PERNR);
        });
    }
});```
### 💡 실전 예제 6: 중복 값 체크 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onChangeCell((columnKey, rowIndex, oldValue, newValue) => {
    if (columnKey === 'MATNR') {
        // 같은 자재번호를 가진 다른 행 찾기
        const duplicateRows = gridObj.$F(newValue, 'MATNR');

        if (duplicateRows.length > 1) {
            unidocuAlert('동일한 자재번호가 이미 존재.');
            // 이전 값으로 복원
            gridObj.$V('MATNR', rowIndex, oldValue);
        }
    }
});```
### 💡 실전 예제 7: 헤더 체크박스로 전체 선택/해제 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 헤더 체크박스 표시
gridObj.setHeaderCheckBox('SELECTED', true);

gridObj.onChangeHeaderCheckBox((checked) => {
    console.log('전체 선택:', checked);

    if (checked) {
        // 모든 행 선택
        gridObj.checkAll();
    } else {
        // 모든 행 선택 해제
        gridObj.unCheckAll();
    }
});```
### 💡 실전 예제 8: 행 이동 시 폼에 데이터 표시 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onChangeRow((oldRowIndex, newRowIndex) => {
    // 새로 선택된 행의 데이터를 폼에 설정
    const rowData = gridObj.getJSONDataByRowIndex(newRowIndex);

    // 폼 영역에 값 설정
    $u.setValues('form-detail', rowData);
});```
## 이벤트 내에서 값 변경 시 주의사항 ​

### 무한 루프 방지 ​

이벤트 핸들러 내에서 값을 변경할 때 무한 루프가 발생하지 않도록 주의해야 합니다.

javascript```
const gridObj = $u.gridWrapper.getGrid();

// ❌ 잘못된 방법 (무한 루프 발생)
gridObj.onChangeCell((columnKey, rowIndex, oldValue, newValue) => {
    if (columnKey === 'QUANTITY') {
        // QUANTITY를 다시 변경하면 onChangeCell이 다시 호출됨
        gridObj.$V('QUANTITY', rowIndex, newValue * 10); // 무한 루프!
    }
});

// ✅ 올바른 방법 (다른 컬럼 변경 또는 조건 체크)
gridObj.onChangeCell((columnKey, rowIndex, oldValue, newValue) => {
    if (columnKey === 'QUANTITY') {
        // 다른 컬럼을 변경하므로 무한 루프 발생하지 않음
        const price = gridObj.$V('PRICE', rowIndex);
        gridObj.$V('AMOUNT', rowIndex, newValue * price);
    }
});```
### 이벤트 내 검증 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onChangeCell((columnKey, rowIndex, oldValue, newValue) => {
    if (columnKey === 'WRBTR') {
        // 음수 입력 방지
        if (Number(newValue)  0) {
            unidocuAlert('금액은 0 이상이어야 합니다.');
            gridObj.$V('WRBTR', rowIndex, oldValue);
            return;
        }
    }
});```
## ❌ 안티 패턴 ​

개발자는 다음과 같은 잘못된 사용 방법을 피해야 합니다:

### ❌ 이벤트 핸들러 중복 등록 ​

javascript```
// ❌ 잘못된 방법 (이벤트 핸들러가 여러 번 등록됨)
$u.buttons.addHandler({
    "doSomething": function() {
        const gridObj = $u.gridWrapper.getGrid();
        gridObj.onCellClick((columnKey, rowIndex) => {
            console.log('클릭');
        });
    }
});

// ✅ 올바른 방법 (페이지 로드 시 한 번만 등록)
const gridObj = $u.gridWrapper.getGrid();
gridObj.onCellClick((columnKey, rowIndex) => {
    console.log('클릭');
});```
### ❌ 모든 셀 클릭에 대해 처리 ​

javascript```
// ❌ 잘못된 방법 (불필요한 처리)
gridObj.onCellClick((columnKey, rowIndex) => {
    // 모든 컬럼에 대해 처리
    const value = gridObj.$V(columnKey, rowIndex);
    console.log(value);
});

// ✅ 올바른 방법 (특정 컬럼만 처리)
gridObj.onCellClick((columnKey, rowIndex) => {
    if (columnKey !== 'DOCUMENT_NO') return; // 조기 반환

    const documentNo = gridObj.$V('DOCUMENT_NO', rowIndex);
    // 문서번호 클릭 처리
});```
## ⚠️ 주의사항 ​

개발자는 다음 사항에 주의해야 합니다:

- 이벤트 핸들러는 페이지 로드 시 한 번만 등록해야 합니다
- 이벤트 핸들러 내에서 값을 변경할 때 무한 루프에 주의해야 합니다
- `onChangeCell` 이벤트는 사용자 입력뿐만 아니라 프로그래밍 방식의 값 변경에도 발생합니다
- 이벤트 핸들러 내에서 에러가 발생하면 사용자 경험이 나빠질 수 있으므로 적절한 예외 처리가 필요합니다