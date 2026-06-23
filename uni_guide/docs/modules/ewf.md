# $ewf - e-Workflow 모듈 ​

전자결재 모듈의 전역 객체

## 개요 ​

`$ewf`는 UniWORKS의 전자결재(e-Workflow) 모듈을 위한 전역 객체. 결재 문서 작성, 결재선 관리, 문서 참조 등의 기능을 제공.

## 주요 네임스페이스 ​

### $ewf.mustache ​

Mustache 템플릿 관리

### $ewf.dialog ​

다이얼로그 관리

### $ewf.popup ​

팝업 관리

### $ewf.draftUtil ​

기안 유틸리티

### $ewf.changeLine ​

결재선 관리

## draftUtil - 기안 유틸리티 ​

결재 문서 기안과 관련된 유틸리티 메서드를 제공.

### 모드 관리 ​

#### `$ewf.draftUtil.getMode()` ​

현재 문서의 모드를 반환.

**반환값**: `string` - 모드 ('readOnly', 'edit', 'create' 등)

javascript```
const mode = $ewf.draftUtil.getMode();

if (mode === 'readOnly') {
  // 읽기 전용 처리
  $u.setReadOnly('form-table1', true);
} else if (mode === 'edit') {
  // 편집 모드 처리
}```
#### `$ewf.draftUtil.isReadOnly()` ​

읽기 전용 모드인지 확인.

**반환값**: `boolean` - 읽기 전용이면 `true`

javascript```
if ($ewf.draftUtil.isReadOnly()) {
  $('#saveButton').hide();
  $('#submitButton').hide();
}```
#### `$ewf.draftUtil.hasSavedData()` ​

저장된 데이터가 있는지 확인.

**반환값**: `boolean` - 저장된 데이터가 있으면 `true`

javascript```
if ($ewf.draftUtil.hasSavedData()) {
  // 기존 데이터 로드
  loadSavedData();
} else {
  // 신규 작성
  initializeNewDocument();
}```
### 결재 구분 관리 ​

#### `$ewf.draftUtil.getWF_GB()` ​

결재 구분(Workflow Group)을 반환.

**반환값**: `string` - 결재 구분 코드

javascript```
const wfGb = $ewf.draftUtil.getWF_GB();
console.log(wfGb); // 'FI01', 'MM01' 등```
#### `$ewf.draftUtil.getWF_GB_TXT(wf_gb)` ​

결재 구분 텍스트를 반환.

| 파라미터 | 타입 | 설명 |
| wf_gb | string | 결재 구분 코드 |
**반환값**: `string` - 결재 구분 명칭

javascript```
const wfGbTxt = $ewf.draftUtil.getWF_GB_TXT('FI01');
console.log(wfGbTxt); // '재무 결재' 등```
### 페이지 초기화 ​

#### `$ewf.draftUtil.initializeDraftPage()` ​

기안 페이지를 초기화.

javascript```
$(document).ready(function() {
  // 기안 페이지 초기화
  $ewf.draftUtil.initializeDraftPage();

  // WF_GB가 설정되어 있어야 함
  // changeLine이 form-table1에 있어야 함
});```
### 요청번호 관리 ​

#### `$ewf.draftUtil.setREQNO(reqno)` ​

요청번호를 설정.

| 파라미터 | 타입 | 설명 |
| reqno | string | 요청번호 |
javascript```
// RFC 호출 후 요청번호 설정
$nst.is_data_nsReturn('CREATE_REQUEST', data, function(nsReturn) {
  const reqno = nsReturn.getStringReturn('REQNO');
  $ewf.draftUtil.setREQNO(reqno);
});```
#### `$ewf.draftUtil.getREQNO()` ​

요청번호를 반환.

**반환값**: `string` - 요청번호

javascript```
const reqno = $ewf.draftUtil.getREQNO();

if (reqno) {
  console.log('요청번호:', reqno);
}```
## changeLine - 결재선 관리 ​

결재선 설정 및 관리 기능을 제공.

### 결재선 초기화 ​

#### `$ewf.changeLine.initialize(ot_data)` ​

결재선 옵션을 초기화.

| 파라미터 | 타입 | 설명 |
| ot_data | Array | 결재선 데이터 배열 |
javascript```
// 결재선 조회
$nst.is_data_ot_data('GET_APPROVAL_LINES', { WF_GB: 'FI01' }, function(ot_data) {
  $ewf.changeLine.initialize(ot_data);
});```
### 결재선 데이터 조회 ​

#### `$ewf.changeLine.getSelectedOT_DATA()` ​

선택된 결재선의 전체 데이터를 반환.

**반환값**: `Object` - 선택된 결재선 데이터

javascript```
const selectedLine = $ewf.changeLine.getSelectedOT_DATA();
console.log(selectedLine);
// { SEQ: '1', SEQ_TXT: '일반 결재선', WF_SECUR: '', ... }```
#### `$ewf.changeLine.getTableReturns()` ​

결재선의 TableReturns를 반환.

**반환값**: `Object` - TableReturns 객체

javascript```
const tableReturns = $ewf.changeLine.getTableReturns();
const approvers = tableReturns.OT_DATA1; // 결재자 목록
const assentients = tableReturns.OT_DATA2; // 합의자 목록```
#### `$ewf.changeLine.setTableReturns(tableReturns)` ​

결재선의 TableReturns를 설정.

| 파라미터 | 타입 | 설명 |
| tableReturns | Object | TableReturns 객체 |
javascript```
$ewf.changeLine.setTableReturns({
  OT_DATA1: approverList,
  OT_DATA2: assentientList
});```
### 결재선 검증 ​

#### `$ewf.changeLine.validateApprovalLineSelected()` ​

결재선이 선택되었는지 검증.

javascript```
// 저장 전 검증
$('#submitButton').click(function() {
  try {
    $ewf.changeLine.validateApprovalLineSelected();

    // 결재 요청
    submitApproval();
  } catch (error) {
    unidocuAlert(error);
  }
});```
### WF_SECUR 관리 ​

#### `$ewf.changeLine.setWF_SECUR(wf_secur)` ​

결재 보안 등급을 설정.

| 파라미터 | 타입 | 설명 |
| wf_secur | string | 보안 등급 |
javascript```
$ewf.changeLine.setWF_SECUR('S'); // Secret```
#### `$ewf.changeLine.getWF_SECUR()` ​

결재 보안 등급을 반환.

**반환값**: `string` - 보안 등급

javascript```
const wfSecur = $ewf.changeLine.getWF_SECUR();```
## 문서 참조 관리 ​

### 조직 변경 문서 참조 ​

#### `$ewf.renderDocumentReferenceWF_ORG(settings, readonly, referenceDocumentList)` ​

조직 변경 문서 참조를 렌더링.

| 파라미터 | 타입 | 설명 |
| settings (선택) | Object | 설정 (기본값: ZUNIEWF_1200 조회 결과) |
| readonly | boolean | 읽기 전용 여부 |
| referenceDocumentList (선택) | Array | 참조 문서 목록 |
**반환값**: `Object` - 문서 참조 객체

javascript```
// 문서 참조 렌더링
const documentReference = $ewf.renderDocumentReferenceWF_ORG(null, false);

// 읽기 전용으로 렌더링
const readOnlyReference = $ewf.renderDocumentReferenceWF_ORG(null, true, existingDocs);```
#### `$ewf.getDocumentReferenceListWF_ORG()` ​

조직 변경 문서 참조 목록을 반환.

**반환값**: `Array` - 문서 참조 목록

javascript```
const referenceList = $ewf.getDocumentReferenceListWF_ORG();

// 저장 시 함께 전송
$nst.is_data_it_data_nsReturn('SAVE_DRAFT', headerData, referenceList, callback);```
## 결재선 표시 ​

#### `$ewf.getApprovalLineEl(header, requester, tableReturns, zuniewf_4323_ot_data)` ​

결재선 표시 엘리먼트를 생성.

| 파라미터 | 타입 | 설명 |
| header | string | 헤더 텍스트 |
| requester | Object | 기안자 정보 |
| tableReturns | Object | TableReturns (결재자/합의자 목록) |
| zuniewf_4323_ot_data | Array | 추가 결재선 데이터 |
**반환값**: `jQuery` - 결재선 표시 jQuery 객체

javascript```
const $approvalLine = $ewf.getApprovalLineEl(
  '결재선',
  { ID: 'USER01', SNAME: '홍길동', DEPT_TXT: '개발팀' },
  tableReturns,
  []
);

$('#approvalLineArea').append($approvalLine);```
## 💡 실전 예제 ​

### 기안 페이지 초기화 ​

javascript```
$(document).ready(function() {
  // 기안 페이지 초기화
  $ewf.draftUtil.initializeDraftPage();

  // 모드에 따른 처리
  if ($ewf.draftUtil.isReadOnly()) {
    // 읽기 전용
    $u.setReadOnly('form-table1', true);
    $('#saveButton').hide();
  } else {
    // 편집 가능
    if ($ewf.draftUtil.hasSavedData()) {
      // 기존 데이터 로드
      loadExistingData();
    }
  }

  // 결재선 조회 및 초기화
  const wfGb = $ewf.draftUtil.getWF_GB();
  $nst.is_data_ot_data('GET_APPROVAL_LINES', { WF_GB: wfGb }, function(ot_data) {
    $ewf.changeLine.initialize(ot_data);
  });
});```
### 임시 저장 ​

javascript```
$('#saveButton').click(function() {
  const headerData = $u.getValues('form-table1');
  const gridData = gridObj.getJSONData();

  $nst.is_data_it_data_nsReturn('SAVE_DRAFT_TEMP', headerData, gridData,
    function(nsReturn) {
      const reqno = nsReturn.getStringReturn('REQNO');
      $ewf.draftUtil.setREQNO(reqno);

      unidocuAlert($mls.getByCode('M_save_success'));
    }
  );
});```
### 결재 요청 ​

javascript```
$('#submitButton').click(function() {
  try {
    // 필수 입력 검증
    $u.validateRequired('form-table1');

    // 결재선 선택 검증
    $ewf.changeLine.validateApprovalLineSelected();

    // 데이터 수집
    const headerData = $u.getValues('form-table1');
    const gridData = gridObj.getJSONData();
    const approvalLine = $ewf.changeLine.getTableReturns();
    const referenceList = $ewf.getDocumentReferenceListWF_ORG();

    // 결재 요청
    const reqno = $ewf.draftUtil.getREQNO();

    unidocuConfirm($mls.getByCode('M_submit_approval_confirm'), function() {
      $nst.is_data_nsReturn('SUBMIT_APPROVAL', {
        REQNO: reqno,
        WF_GB: $ewf.draftUtil.getWF_GB(),
        headerData: JSON.stringify(headerData),
        gridData: JSON.stringify(gridData),
        approvalLine: JSON.stringify(approvalLine),
        referenceList: JSON.stringify(referenceList)
      }, function(nsReturn) {
        unidocuAlert(nsReturn.getReturnMessage(), function() {
          $u.navigateByProgramId('APPROVAL_LIST');
        });
      });
    });
  } catch (error) {
    unidocuAlert(error);
  }
});```
### 결재선 변경 이벤트 ​

javascript```
// 결재선 변경 시
$u.get('form-table1', 'changeLine').$el.change(function() {
  const selectedLine = $ewf.changeLine.getSelectedOT_DATA();

  // 결재선 정보 표시
  console.log('선택된 결재선:', selectedLine.SEQ_TXT);

  // 결재자 목록 조회
  const tableReturns = $ewf.changeLine.getTableReturns();

  if (tableReturns && tableReturns.OT_DATA1) {
    console.log('결재자 수:', tableReturns.OT_DATA1.length);
  }
});```
### 조직 변경 문서 참조 ​

javascript```
// 페이지 로드 시
$(document).ready(function() {
  const isReadOnly = $ewf.draftUtil.isReadOnly();
  const existingDocs = []; // 기존 참조 문서

  // 문서 참조 렌더링
  const documentReference = $ewf.renderDocumentReferenceWF_ORG(
    null,
    isReadOnly,
    existingDocs
  );
});

// 저장 시 참조 문서 포함
$('#saveButton').click(function() {
  const referenceList = $ewf.getDocumentReferenceListWF_ORG();

  console.log('참조 문서:', referenceList);
  // 저장 로직...
});```
## ⚠️ 주의사항 ​

- `$ewf` 객체는 e-Workflow 모듈이 로드된 경우에만 사용 가능합니다
- WF_GB (결재 구분)는 반드시 설정되어 있어야 합니다
- changeLine은 form-table1에 존재해야 합니다
- 결재선이 선택되지 않으면 결재 요청이 불가능합니다
- REQNO는 임시 저장 후에 생성됩니다