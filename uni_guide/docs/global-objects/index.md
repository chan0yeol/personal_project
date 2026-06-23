# 전역 객체 ​

UniWORKS 시스템의 전역 객체 개요

## 개요 ​

UniWORKS 시스템은 `$` 로 시작하는 여러 전역 객체를 `window` 객체에 등록하여 사용. 이들 객체는 애플리케이션 전체에서 접근 가능하며, 각각 특정 목적과 기능을 제공.

## 코어 전역 객체 ​

### $u - 유틸리티 객체 ​

UniWORKS의 핵심 유틸리티 객체로, 페이지 관리, 팝업 제어, AJAX 통신, 날짜 처리 등 가장 많이 사용되는 기능을 제공.

javascript```
$u.setPageTitle('페이지 제목');
$u.popup.openByProgramId('UD_1001_010', 1200, 800);
$u.util.date.getCurrentDateAsDataFormat();```
### $nst - Named Service Template ​

SAP RFC 함수를 호출하는 Named Service Template 객체. 서버와의 데이터 통신을 담당.

javascript```
$nst.is_data_ot_data('FUNCTION_NAME', { param1: 'value' }, function(ot_data) {
  console.log(ot_data);
});```
### $mls - Multi Language System ​

다국어 메시지를 관리하는 객체. 코드로 다국어 메시지를 조회.

javascript```
const message = $mls.getByCode('M_save_success');
unidocuAlert(message);```
### $debug - 디버그 유틸리티 ​

개발 중 디버깅을 위한 유틸리티 객체.

javascript```
$debug.log('디버그 메시지');```
### $mlsCode - 다국어 코드 맵 ​

다국어 메시지 코드와 키를 매핑하는 객체.

javascript```
const key = $mlsCode['M_save_success'];```
### $customize - 커스터마이징 ​

고객사별 커스터마이징을 위한 객체.

### $guide - 가이드 ​

개발 가이드 및 도움말 기능을 제공하는 객체.

## 모듈 전역 객체 (일반소스) ​

### $ecar - e-Car 모듈 ​

차량 관리 모듈의 전역 객체.

javascript```
$ecar.someFunction();```
### $ewf - e-Workflow 모듈 ​

전자결재 모듈의 전역 객체.

javascript```
$ewf.approvalFunction();```
### $efa - e-Fixed Assets 모듈 ​

고정자산 관리 모듈의 전역 객체.

javascript```
$efa.assetFunction();```
### $efi - e-FI 모듈 ​

재무 관리 모듈의 전역 객체.

javascript```
$efi.financeFunction();```
## 사용 가이드 ​

### 전역 객체 접근 ​

모든 전역 객체는 `window` 객체에 등록되어 있습니다.

javascript```
// 직접 접근
$u.page.getPROGRAM_ID();

// window를 통한 접근
window.$u.page.getPROGRAM_ID();```
### 객체 존재 여부 확인 ​

페이지 로드 타이밍에 따라 객체가 아직 초기화되지 않을 수 있습니다.

javascript```
// 안전한 접근
if (window.$u) {
  $u.setPageTitle('제목');
}

// 또는
if (typeof $u !== 'undefined') {
  $u.setPageTitle('제목');
}```
### 주요 사용 패턴 ​

#### 1. 페이지 초기화 시 ​

javascript```
$(document).ready(function() {
  // 페이지 제목 설정
  $u.setPageTitle('구매 발주 조회');

  // 다국어 메시지 표시
  $('#saveButton').text($mls.getByCode('M_save'));
});```
#### 2. 서버 데이터 조회 ​

javascript```
function searchData() {
  const searchConditions = $u.getValues('search-condition');

  $nst.is_data_ot_data('SEARCH_FUNCTION', searchConditions, function(ot_data) {
    const gridObj = $u.gridWrapper.getGrid();
    gridObj.setJSONData(ot_data);
  });
}```
#### 3. 에러 메시지 표시 ​

javascript```
try {
  // 처리 로직
} catch (error) {
  unidocuAlert($mls.getByCode('M_error_occurred'));
}```
## ⚠️ 주의사항 ​

- 전역 객체는 시스템이 제공하는 것이므로 임의로 수정하지 않습니다
- 페이지 로드 완료 후에 전역 객체를 사용해야 합니다
- 모듈 전역 객체($ecar, $ewf 등)는 해당 모듈이 로드된 경우에만 사용 가능합니다
- 전역 네임스페이스 오염을 방지하기 위해 새로운 전역 객체 생성은 지양합니다