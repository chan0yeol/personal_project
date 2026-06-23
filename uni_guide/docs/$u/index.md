# $u 객체 ​

UniWORKS 시스템의 핵심 유틸리티 전역 객체

## 개요 ​

`$u`는 UniWORKS 시스템에서 전역으로 사용되는 핵심 유틸리티 객체. `window.$u`로 선언되어 애플리케이션 전체에서 접근 가능하며, 페이지 관리, 팝업 제어, AJAX 통신, 유틸리티 함수 등 가장 많이 사용되는 기능을 제공.

## UniWORKS 전역 객체 생태계 ​

UniWORKS는 `$`로 시작하는 여러 전역 객체를 제공합니다:

- $u - 핵심 유틸리티 객체 (이 문서)
- $nst - Named Service Template (SAP RFC 호출)
- $mls - Multi Language System (다국어)
- $debug - 디버그 유틸리티
- $mlsCode - 다국어 코드 맵
- $customize - 커스터마이징
- $guide - 가이드 및 도움말

모듈별 전역 객체:

- $ecar - e-Car 모듈
- $ewf - e-Workflow 모듈 (전자결재)
- $efa - e-Fixed Assets 모듈 (고정자산)
- $efi - e-FI 모듈 (재무)

📖 전체 전역 객체 목록은 전역 객체 가이드를 참고하세요.

## $u 객체 구조 ​

$u 객체는 크게 두 가지 형태로 구성됩니다:

### 1. 루트 레벨 함수 ​

`$u.함수명()` 형태로 직접 호출하는 함수들.

### 2. 네임스페이스 객체 ​

`$u.객체명.함수명()` 형태로 한 단계 더 들어가는 구조.

## 주요 네임스페이스 ​

$u 객체는 다음과 같은 주요 네임스페이스를 제공합니다:

### 페이지 관리 ​

- $u.page - 페이지 정보 관리 및 파라미터 처리

### 팝업 제어 ​

- $u.popup - 팝업 창 열기 및 제어

### 네트워크 통신 ​

- $u.ajax - AJAX 요청 처리

### 유틸리티 ​

- $u.util - 범용 유틸리티 함수 모음 $u.util.date - 날짜 관련 유틸리티
- $u.util.localStorage - 로컬 스토리지 관리

### UI 컴포넌트 ​

- $u.dialog - 다이얼로그 관리
- $u.buttons - 버튼 제어
- $u.panel - 패널 관리
- $u.menu - 메뉴 관리

### 그리드 ​

- $u.gridWrapper - 그리드 래퍼 객체

### 데이터 관리 ​

- $u.webData - 웹 데이터 관리
- $u.f4Data - F4 데이터 관리

### 파일 처리 ​

- $u.fineUploader - 파일 업로드
- $u.fileUI - 파일 UI 관리
- $u.excel - 엑셀 처리

### 차트 및 렌더링 ​

- $u.renderChart - 차트 렌더링
- $u.renderUIComponents - UI 컴포넌트 렌더링

### 기타 ​

- $u.programInfo - 프로그램 정보
- $u.programSetting - 프로그램 설정
- $u.mustache - Mustache 템플릿
- $u.unidocuCurrency - 통화 관리
- $u.LANGUHandler - 다국어 처리

## 루트 레벨 주요 함수 ​

### 페이지 관련 ​

javascript```
$u.setPageTitle(title)        // 페이지 제목 설정
$u.getPageTitle()              // 페이지 제목 가져오기
$u.isPopupView()               // 팝업 뷰 여부 확인
$u.pageReload()                // 페이지 새로고침
$u.locationReload()            // 전체 페이지 새로고침```
### 네비게이션 ​

javascript```
$u.navigate(url, params)       // 페이지 이동
$u.moveToHome()                // 홈으로 이동
$u.navigateByProgramId(programId, params)  // 프로그램 ID로 이동```
### 프로그램 정보 ​

javascript```
$u.getProgramInfo(programId)   // 프로그램 정보 가져오기```
### 엑셀 다운로드 ​

javascript```
$u.excelDownload()             // 그리드 엑셀 다운로드```
### 문서 참조 ​

javascript```
$u.documentReference.render(domId, params)  // 문서 참조 렌더링
$u.getDocumentReference(domId)  // 문서 참조 객체 가져오기```
### 프로그레스 바 ​

javascript```
$u.progressBar.show()          // 프로그레스 바 표시
$u.progressBar.hide()          // 프로그레스 바 숨김
$u.progressBar.hasMask()       // 프로그레스 바 표시 여부```
### 유틸리티 ​

javascript```
$u.getUrlFromRoot(url)         // 루트 경로 기준 URL 생성
$u.addCss(path)                // CSS 파일 동적 추가
$u.generatePostRequestForm(url, params)  // POST 폼 생성```
## 사용법 ​

### 페이지 제목 설정 ​

javascript```
// 페이지 제목 설정
$u.setPageTitle('구매 발주 관리');

// 페이지 제목 가져오기
const title = $u.getPageTitle();
console.log(title); // "구매 발주 관리"```
### 페이지 이동 ​

javascript```
// URL로 이동
$u.navigate('/unidocu/view.do', {
  programId: 'UD_1001_010',
  param1: 'value1'
});

// 프로그램 ID로 이동
$u.navigateByProgramId('UD_1001_010', {
  param1: 'value1'
});```
### 팝업 열기 ​

javascript```
// 프로그램 ID로 팝업 열기
$u.popup.openByProgramId('UD_1001_020', 1200, 800, {
  documentNo: '12345'
});

// URL로 팝업 열기
$u.popup.openPopup('/custom/page.html', 'customPopup', 1000, 600);```
### 날짜 유틸리티 ​

javascript```
// 현재 날짜 가져오기 (서버 시간 기준)
const currentDate = $u.util.date.getCurrentDateAsDataFormat();
console.log(currentDate); // "20250130"

// 날짜 형식 변환
const formatted = $u.util.date.getDateAsUserDateFormat('20250130');
console.log(formatted); // "2025-01-30" (사용자 설정에 따라 다름)

// 날짜 계산
const nextWeek = $u.util.date.addDate('20250130', 7);
console.log(nextWeek); // "20250206"```
### AJAX 요청 ​

javascript```
// 비동기 요청
$u.ajax.ajaxRequest('/api/getData',
  { param1: 'value1' },
  function(result) {
    console.log('성공:', result);
  },
  function(error) {
    console.log('실패:', error);
  }
);

// 동기 요청
const result = $u.ajax.synchronousRequest('/api/getData', {
  param1: 'value1'
});```
## 소스 코드 위치 ​

- 메인 파일: `D:\unidocu\unidocu6-core\unidocu6-core\unidocu6-clientcore\src\main\resources\META-INF\resources\webjars\unidocu-ui\$u.js`
- 모듈 파일들: 각 네임스페이스별로 별도 파일 존재

## ⚠️ 주의사항 ​

- `$u` 객체는 전역 객체이므로 임의로 수정하지 않습니다
- 페이지 로드 후 `$u` 객체가 초기화되므로, 페이지 로드 완료 후에 사용해야 합니다
- 일부 함수는 특정 페이지 레이아웃에서만 동작할 수 있습니다

## 다음 단계 ​

각 네임스페이스의 상세한 사용법은 개별 가이드 문서를 참고하세요:

- 페이지 관리 ($u.page)
- 팝업 제어 ($u.popup)
- 네트워크 통신 ($u.ajax)
- 유틸리티 ($u.util)
- 날짜 유틸리티 ($u.util.date)
- 로컬 스토리지 ($u.util.localStorage)

**소스 파일**: `$u.js:95`