# Grid ​

UniWORKS의 핵심 UI 컴포넌트인 Grid를 효과적으로 활용하는 방법을 안내.

## 개요 ​

Grid는 UniWORKS에서 테이블 형태의 데이터를 표시하고 편집하는 데 사용되는 핵심 컴포넌트.
 개발자는 `gridObj` 객체를 통해 그리드의 데이터를 조작하고 제어.

### Grid 객체 접근 ​

개발자는 다음과 같이 Grid 객체에 접근합니다:

javascript```
// 기본 그리드 객체 가져오기
const gridObj = $u.gridWrapper.getGrid();

// 특정 그리드 객체 가져오기 (여러 그리드가 있는 경우)
const gridObj2 = $u.gridWrapper.getGrid('gridId');```
## 기능 분류 ​

Grid의 기능은 다음과 같이 분류됩니다:

#### 1. 데이터 접근 및 조회 ​

- 데이터 접근: 개별 셀 값 읽기/쓰기
- 데이터 조회: 전체 또는 선택된 데이터 조회
- 데이터 검색: 특정 값을 가진 행 찾기

#### 2. 행 및 셀 제어 ​

- 행 조작: 행 추가, 삭제, 이동
- 셀 제어: 편집 가능 여부, 필수 입력 설정
- 셀 스타일: 배경색, 글자색 변경

#### 3. 컬럼 제어 ​

- 컬럼 표시: 컬럼 숨김/표시
- 컬럼 편집: 편집 가능 여부 설정
- 컬럼 스타일: 배경색, 글자색, 너비 변경

#### 4. 이벤트 처리 ​

- 클릭 이벤트: 셀 클릭, 더블클릭
- 값 변경 이벤트: 셀 값 변경, 행 변경
- 선택 이벤트: 행 선택 변경

#### 5. 검증 ​

- 행 선택 검증: 행이 선택되었는지 확인
- 데이터 검증: 필수 입력 확인
- 컬럼 존재 검증: 컬럼이 존재하는지 확인

## 기본 사용 패턴 ​

개발자는 일반적으로 다음과 같은 패턴으로 Grid를 사용합니다:

### 패턴 1: 데이터 조회 및 표시 ​

javascript```
function queryGridData() {
    const gridObj = $u.gridWrapper.getGrid();

    // 서버에서 데이터 조회
    $nst.is_data_ot_data('FUNCNAME', $u.getValues(), (ot_data) => {
        // 그리드에 데이터 설정
        gridObj.setJSONData(ot_data);
    });
}```
### 패턴 2: 선택된 데이터 처리 ​

javascript```
function processSelectedData() {
    const gridObj = $u.gridWrapper.getGrid();

    // 행 선택 검증
    gridObj.asserts.rowSelected();

    // 선택된 데이터 가져오기
    const selectedData = gridObj.getSELECTEDJSONData();

    // 서버로 전송
    $nst.it_data_returnMessage('FUNCNAME', selectedData, (message) => {
        unidocuAlert(message);
    });
}```
### 패턴 3: 셀 값 변경 시 처리 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

// 셀 값 변경 이벤트 등록
gridObj.onChangeCell(function(columnKey, rowIndex, oldValue, newValue) {
    // 특정 컬럼 값 변경 시 처리
    if (columnKey === 'QUANTITY') {
        // 금액 자동 계산
        const price = gridObj.$V('PRICE', rowIndex);
        const amount = Number(newValue) * Number(price);
        gridObj.$V('AMOUNT', rowIndex, amount);
    }
});```
### 패턴 4: 행 추가 및 삭제 ​

javascript```
function addNewRow() {
    const gridObj = $u.gridWrapper.getGrid();
    gridObj.addRow();
}

function deleteSelectedRows() {
    const gridObj = $u.gridWrapper.getGrid();
    gridObj.asserts.rowSelected();
    gridObj.deleteSelectedRows();
}```
## 실무 예제 ​

개발자는 다음과 같은 실무 예제를 참고하여 Grid를 활용합니다:

### 예제 1: 선택된 행으로 상세 화면 이동 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onCellClick((columnKey, rowIndex) => {
    if (columnKey !== 'DOCUMENT_NO') return;

    // 문서 번호 클릭 시 상세 화면으로 이동
    const documentNo = gridObj.$V('DOCUMENT_NO', rowIndex);
    $u.navigateByProgramId('DETAIL_PROGRAM_ID', {
        DOCUMENT_NO: documentNo
    });
});```
### 예제 2: 조건에 따른 셀 편집 제어 ​

javascript```
const gridObj = $u.gridWrapper.getGrid();

gridObj.onRowActivate((rowIndex) => {
    // 상태가 '완료'인 경우 편집 불가
    const status = gridObj.$V('STATUS', rowIndex);

    if (status === 'COMPLETED') {
        gridObj.makeRowReadOnly(rowIndex);
    } else {
        gridObj.makeRowEditable(rowIndex);
    }
});```