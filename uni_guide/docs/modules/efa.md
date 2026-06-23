# $efa - e-Fixed Assets 모듈 ​

고정자산 관리 모듈의 전역 객체

## 개요 ​

`$efa`는 UniWORKS의 고정자산(e-Fixed Assets) 관리 모듈을 위한 전역 객체. 자산 등록, 이동, 매각, 폐기 등 고정자산 관련 업무 처리 기능을 제공.

## 주요 메서드 ​

### 입력 검증 ​

#### `$efa.validateInputAmountColumn($input)` ​

금액 입력 필드의 음수 입력을 검증.

**파라미터**

- `$input` (Object) - UniWORKS 입력 객체

**예외**

- 음수 입력 시 입력값을 초기화하고 예외 발생

javascript```
// 금액 입력 검증
try {
  const $wrbtr = $u.get('WRBTR');
  $efa.validateInputAmountColumn($wrbtr);
} catch (error) {
  unidocuAlert(error); // "음수 금액을 입력할 수 없습니다"
}

// change 이벤트에 적용
$u.get('WRBTR').$el.change(function() {
  try {
    $efa.validateInputAmountColumn($u.get('WRBTR'));
  } catch (error) {
    unidocuAlert(error);
  }
});```
### 전표 생성 ​

#### `$efa.generateZUNIEFI_6708StatementFn(dtype)` ​

고정자산 전표 생성 함수를 반환.

| 파라미터 | 타입 | 설명 |
| dtype | string | 문서 타입 |
**반환값**: `Function` - 전표 생성 함수 `fn(grono, wf_gb)`

javascript```
// 전표 생성 함수 생성
const generateStatement = $efa.generateZUNIEFI_6708StatementFn('MASTER');

// 전표 생성 실행
const $statement = generateStatement('GR12345', 'FA01');

// 결재 양식에 추가
$('#approvalFormArea').append($statement);```
**지원 문서 타입**

- `MASTER`: 자산 마스터
- `MOVE`: 자산 이동
- `DISPOSAL`: 자산 폐기
- `DIVESTITURE`: 자산 매각
- `DIVISION`: 자산 분할

### 팝업 관리 ​

#### `$efa.openRequestDetailProgramByParams(openProgramId, params, width, height)` ​

요청 상세 프로그램을 팝업으로 엽니다.

| 파라미터 | 타입 | 설명 |
| openProgramId | string | 프로그램 ID |
| params | Object | 전달 파라미터 |
| width (선택) | number | 팝업 너비 (기본값: 1250) |
| height (선택) | number | 팝업 높이 (기본값: 580) |
javascript```
// 자산 상세 팝업 열기
$efa.openRequestDetailProgramByParams('UD_0901_010', {
  GRONO: 'GR12345',
  REQNO: 'REQ001'
});

// 커스텀 크기로 팝업 열기
$efa.openRequestDetailProgramByParams('UD_0901_020', {
  ANLN1: 'A12345'
}, 1400, 700);```
#### `$efa.openCompleteMessageDialog(params)` ​

처리 완료 메시지 다이얼로그를 표시.

| 파라미터 | 타입 | 설명 |
| params | Object | 파라미터 객체 |
- `REQNO`: 요청번호

javascript```
// 저장 완료 후 메시지 표시
$nst.is_data_nsReturn('SAVE_ASSET', data, function(nsReturn) {
  const reqno = nsReturn.getStringReturn('REQNO');

  $efa.openCompleteMessageDialog({
    REQNO: reqno
  });
});```
**다이얼로그 버튼**

- 전표 계속 작성: 현재 페이지 새로고침
- 결재 요청: 다음 프로그램으로 이동

**다음 프로그램 로직**

- `UD_0201_000C`, `UD_0201_010C` → `UD_0302_000` (전표 조회)
- `UD_0302_000` → `UD_0302_001` (전표 상세)
- 기타 → `UD_0902_001` (결재 요청)

### 데이터 집계 ​

#### `$efa.getSummaryValues(columnKeys)` ​

선택된 행들의 지정된 컬럼 합계를 계산.

**파라미터**

- `columnKeys` (`Array`) - 합계를 계산할 컬럼 키 목록

**반환값**: `Object` - `SUM_컬럼명` 형태의 합계 객체

javascript```
// 선택된 행의 금액 합계 계산
const summary = $efa.getSummaryValues(['KANSW', 'KNAFA', 'KAAFA']);

console.log(summary);
// {
//   SUM_KANSW: 50000000,  // 취득가액 합계
//   SUM_KNAFA: 10000000,  // 감가상각누계액 합계
//   SUM_KAAFA: 40000000   // 장부가액 합계
// }

// 합계를 필드에 설정
$u.setValue('TOTAL_KANSW', summary.SUM_KANSW);
$u.setValue('TOTAL_KNAFA', summary.SUM_KNAFA);
$u.setValue('TOTAL_KAAFA', summary.SUM_KAAFA);```
### 이메일 팝업 ​

#### `$efa.openMailPopup(searchWord)` ​

이메일 검색 팝업을 엽니다.

| 파라미터 | 타입 | 설명 |
| searchWord (선택) | string | 검색어 |
javascript```
// 이메일 검색 팝업
$efa.openMailPopup();

// 검색어와 함께 팝업 열기
$efa.openMailPopup('홍길동');

// 버튼 클릭 시
$('#emailSearchButton').click(function() {
  const searchWord = $u.getValue('KUNNR_NAME');
  $efa.openMailPopup(searchWord);
});```
## 💡 실전 예제 ​

### 자산 등록 화면 ​

javascript```
$(document).ready(function() {
  // 금액 필드 검증 설정
  ['KANSW', 'KNAFA', 'KAAFA'].forEach(function(fieldName) {
    $u.get(fieldName).$el.change(function() {
      try {
        $efa.validateInputAmountColumn($u.get(fieldName));
      } catch (error) {
        unidocuAlert(error);
      }
    });
  });

  // 저장 버튼
  $u.buttons.setHandler('save', function() {
    const headerData = $u.getValues('form-table1');
    const gridData = gridObj.getJSONData();

    $nst.is_data_it_data_nsReturn('SAVE_ASSET', headerData, gridData,
      function(nsReturn) {
        const reqno = nsReturn.getStringReturn('REQNO');

        $efa.openCompleteMessageDialog({
          REQNO: reqno
        });
      }
    );
  });
});```
### 자산 조회 화면 ​

javascript```
// 그리드 더블클릭 시 상세 팝업
gridObj.setOnDBLClick(function(model) {
  const rowData = gridObj.getJSONDataByRowIndex(model.index);

  $efa.openRequestDetailProgramByParams('UD_0901_010', {
    GRONO: rowData.GRONO,
    REQNO: rowData.REQNO
  });
});

// 선택 행 합계 계산
$('#calculateSummaryButton').click(function() {
  const selectedData = gridObj.getSELECTEDJSONData();

  if (selectedData.length === 0) {
    unidocuAlert($mls.getByCode('M_selectRow'));
    return;
  }

  const summary = $efa.getSummaryValues(['KANSW', 'KNAFA', 'KAAFA']);

  // 합계 표시
  $u.setValue('TOTAL_KANSW', summary.SUM_KANSW);
  $u.setValue('TOTAL_KNAFA', summary.SUM_KNAFA);
  $u.setValue('TOTAL_KAAFA', summary.SUM_KAAFA);
});```
### 결재 양식 생성 ​

javascript```
// 자산 마스터 결재 양식 생성
const generateMasterStatement = $efa.generateZUNIEFI_6708StatementFn('MASTER');

// 결재선 설정 후 양식 생성
$ewf.changeLine.setTableReturns(approvalLine);

const $approvalForm = generateMasterStatement(
  $ewf.draftUtil.getREQNO(),
  $ewf.draftUtil.getWF_GB()
);

// 결재 양식 렌더링
$('#approvalFormArea').html($approvalForm);```
### 이메일 수신자 설정 ​

javascript```
// 이메일 필드 클릭 시 검색 팝업
$u.get('KUNNR_EMAIL').$el.click(function() {
  const currentValue = $u.getValue('KUNNR_NAME');

  $efa.openMailPopup(currentValue);
});

// 팝업에서 선택 시 이메일 주소가 자동으로 입력됩니다```
## 주요 데이터 필드 ​

### 고정자산 관련 필드 ​

| 필드명 | 설명 | 타입 |
| ANLN1 | 자산번호 | string |
| KANSW | 취득가액 | number |
| KNAFA | 감가상각누계액 | number |
| KAAFA | 장부가액 | number |
| MENGE | 수량 | number |
| ZNETVA | 순가액 | number |
| ABGAN | 감가상각시작일 | string |
| ZPROLO | 생산설비여부 | string |
| GRONO | 그룹번호 | string |
| REQNO | 요청번호 | string |
## ⚠️ 주의사항 ​

- `$efa` 객체는 e-Fixed Assets 모듈이 로드된 경우에만 사용 가능합니다
- `validateInputAmountColumn`은 try-catch로 감싸서 사용해야 합니다
- `generateZUNIEFI_6708StatementFn`은 ZUNIEFI_6708 RFC가 정상적으로 응답해야 동작합니다
- `getSummaryValues`는 그리드에 선택된 행이 있어야 동작합니다
- 금액 필드는 음수를 허용하지 않습니다