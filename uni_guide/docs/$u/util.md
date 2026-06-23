# $u.util ​

범용 유틸리티 함수 모음

## 개요 ​

`$u.util`은 UniWORKS 시스템에서 자주 사용되는 범용 유틸리티 함수들을 제공하는 네임스페이스. 배열 처리, 문자열 포맷, 브라우저 감지, 숫자 포맷, 예외 처리 등 다양한 기능을 포함.

## 하위 네임스페이스 ​

- $u.util.date - 날짜 관련 유틸리티
- $u.util.localStorage - 로컬 스토리지 관리

## 주요 카테고리 ​

### 배열 및 객체 처리 ​

#### `$u.util.keys(jsonObj)` ​

객체의 키 배열을 반환.

javascript```
const obj = { name: '홍길동', age: 30, dept: '개발팀' };
const keys = $u.util.keys(obj);
console.log(keys); // ['name', 'age', 'dept']```
#### `$u.util.uniqueFieldDataList(jsonArray, fieldName)` ​

배열에서 특정 필드의 고유 값 목록을 반환.

javascript```
const data = [
  { dept: '개발팀', name: '홍길동' },
  { dept: '영업팀', name: '김철수' },
  { dept: '개발팀', name: '이영희' }
];

const uniqueDepts = $u.util.uniqueFieldDataList(data, 'dept');
console.log(uniqueDepts); // ['개발팀', '영업팀']```
#### `$u.util.contains(source, array)` ​

배열에 특정 값이 포함되어 있는지 확인.

javascript```
const array = ['apple', 'banana', 'orange'];
console.log($u.util.contains('banana', array)); // true
console.log($u.util.contains('grape', array)); // false```
#### `$u.util.isSubArray(source, array)` ​

source 배열의 모든 요소가 array에 포함되어 있는지 확인.

javascript```
const source = ['apple', 'banana'];
const target = ['apple', 'banana', 'orange', 'grape'];
console.log($u.util.isSubArray(source, target)); // true```
### 문자열 처리 ​

#### `$u.util.formatString(str, args)` ​

문자열 템플릿을 포맷.

javascript```
// 객체로 치환
const message = $u.util.formatString('안녕하세요, {name}님! 오늘은 {day}입니다.', {
  name: '홍길동',
  day: '월요일'
});
console.log(message); // "안녕하세요, 홍길동님! 오늘은 월요일."

// 배열로 치환
const url = $u.util.formatString('/api/{0}/{1}', ['users', '12345']);
console.log(url); // "/api/users/12345"```
#### `$u.util.isJSONString(str)` ​

문자열이 유효한 JSON인지 확인.

javascript```
console.log($u.util.isJSONString('{"name":"홍길동"}')); // true
console.log($u.util.isJSONString('invalid json')); // false```
#### `$u.util.getRandomString()` ​

랜덤 문자열을 생성.

javascript```
const random = $u.util.getRandomString();
console.log(random); // "047192836465"```
### 숫자 및 통화 처리 ​

#### `$u.util.comma(value)` ​

숫자에 천단위 구분자를 추가.

javascript```
console.log($u.util.comma(1234567)); // "1,234,567"```
#### `$u.util.uncomma(value)` ​

천단위 구분자를 제거.

javascript```
console.log($u.util.uncomma('1,234,567')); // "1234567"```
#### `$u.util.convertAmountNumberFormat(value, precision, waers)` ​

통화 코드에 맞는 숫자 형식으로 변환.

| 파라미터 | 타입 | 설명 |
| value | number | 변환할 값 |
| precision (선택) | number | 소수점 자리수 |
| waers (선택) | string | 통화 코드 |
javascript```
// 기본 포맷 (시스템 설정 따름)
console.log($u.util.convertAmountNumberFormat(1234.56)); // "1,234.56"

// 소수점 자리수 지정
console.log($u.util.convertAmountNumberFormat(1234.567, 2)); // "1,234.57"

// 통화 코드로 자동 소수점 결정
console.log($u.util.convertAmountNumberFormat(1234, 0, 'KRW')); // "1,234"
console.log($u.util.convertAmountNumberFormat(1234.56, 2, 'USD')); // "1,234.56"```
#### `$u.util.getNumberFormatByPrecision(precision)` ​

소수점 자리수에 맞는 숫자 포맷 문자열을 반환.

javascript```
console.log($u.util.getNumberFormatByPrecision(2)); // "#,##0.00"
console.log($u.util.getNumberFormatByPrecision(0)); // "#,##0"```
### 브라우저 감지 ​

#### `$u.util.isIE11()` ​

IE11인지 확인.

javascript```
if ($u.util.isIE11()) {
  console.log('IE11에서 실행 중.');
}```
#### `$u.util.getIEVersion()` ​

IE 버전을 반환.

javascript```
const version = $u.util.getIEVersion();
console.log(version); // "IE11" 또는 "EDGE12" 또는 ""```
### URL 및 위치 ​

#### `$u.util.getLocationOrigin()` ​

현재 페이지의 origin을 반환.

javascript```
const origin = $u.util.getLocationOrigin();
console.log(origin); // "https://uniworks.example.com"```
### 이미지 및 파일 ​

#### `$u.util.previewImage(url, file_seq)` ​

이미지 미리보기 다이얼로그를 표시.

javascript```
$u.util.previewImage('/files/image.jpg');

// 파일 SEQ와 함께 (이전/다음 버튼 표시)
$u.util.previewImage('/files/image.jpg', 'FILE001');```
#### `$u.util.displayThumbnail($el, url, errorMessage, onLoadComplete, file_seq)` ​

썸네일을 표시.

javascript```
$u.util.displayThumbnail(
  $('#thumbnailContainer'),
  '/files/thumbnail.jpg',
  '이미지를 불러올 수 없습니다.',
  function() {
    console.log('썸네일 로드 완료');
  }
);```
#### `$u.util.openPDF(downloadUrl)` ​

PDF 뷰어로 PDF 파일을 엽니다.

javascript```
$u.util.openPDF('/files/document.pdf');```
### 파일 업로드 ​

#### `$u.util.singleFileUploader(params)` ​

단일 파일 업로더를 생성.

javascript```
$u.util.singleFileUploader({
  buttonEl: 'uploadButton',
  url: '/api/uploadFile',
  filters: {
    max_file_size: '10mb',
    mime_types: [
      { title: "Image files", extensions: "jpg,gif,png" }
    ]
  },
  getMultipartParams: function() {
    return {
      documentNo: '12345'
    };
  },
  FileUploaded: function(up, file, info) {
    console.log('파일 업로드 완료:', file.name);
    const response = JSON.parse(info.response);
    // 업로드 후 처리
  }
});```
#### `$u.util.multiFileUploader(params)` ​

다중 파일 업로더를 생성.

javascript```
$u.util.multiFileUploader({
  buttonEl: 'uploadMultipleButton',
  url: '/api/uploadFiles',
  filters: {
    max_file_size: '50mb'
  },
  getMultipartParams: function() {
    return {
      folderId: 'FOLDER001'
    };
  },
  FileUploaded: function(up, file, info) {
    console.log('파일 업로드:', file.name);
  },
  UploadComplete: function() {
    console.log('모든 파일 업로드 완료');
  }
});```
### 예외 처리 ​

#### `$u.util.tryCatchCall(fn, errorCallback)` ​

함수를 try-catch로 감싸서 실행.

javascript```
$u.util.tryCatchCall(
  function() {
    // 실행할 코드
    const gridObj = $u.gridWrapper.getGrid();
    gridObj.asserts.selectedExactOneRow();
    // ...
  },
  function() {
    // 에러 발생 시 추가 처리
    console.log('에러가 발생했습니다.');
  }
);```
#### `$u.util.throwRuntimeException(name, message, time)` ​

런타임 예외를 발생시킵니다.

javascript```
if (!isValid) {
  $u.util.throwRuntimeException(
    'ValidationException',
    '입력값이 유효하지 않습니다.',
    new Date().getTime()
  );
}```
#### `$u.util.handleException(error)` ​

예외를 처리.

javascript```
try {
  // 코드 실행
} catch (error) {
  $u.util.handleException(error);
}```
### 다이얼로그 및 폼 ​

#### `$u.util.getDialogFormValues(formId)` ​

다이얼로그 폼의 값을 가져옵니다.

javascript```
const values = $u.util.getDialogFormValues('dialog-form');
console.log(values);```
#### `$u.util.setDialogFormValues(formId, values)` ​

다이얼로그 폼에 값을 설정.

javascript```
$u.util.setDialogFormValues('dialog-form', {
  name: '홍길동',
  dept: '개발팀'
});```
### 윈도우 및 화면 ​

#### `$u.util.resizeWindowBy$el($contents, tolerance)` ​

요소 크기에 맞춰 윈도우 크기를 조정.

javascript```
$u.util.resizeWindowBy$el($('#mainContent'), 20);```
#### `$u.util.copyTextToClipboard(text)` ​

텍스트를 클립보드에 복사.

javascript```
$u.util.copyTextToClipboard('복사할 텍스트');```
## 💡 실전 예제 ​

### 배열 데이터 필터링 ​

javascript```
const orderData = [
  { orderId: '001', status: 'pending', amount: 10000 },
  { orderId: '002', status: 'completed', amount: 20000 },
  { orderId: '003', status: 'pending', amount: 15000 }
];

// 고유한 상태 목록
const uniqueStatuses = $u.util.uniqueFieldDataList(orderData, 'status');
console.log(uniqueStatuses); // ['pending', 'completed']

// 특정 상태 확인
if ($u.util.contains('pending', uniqueStatuses)) {
  console.log('대기 중인 주문이 있습니다.');
}```
### 동적 메시지 생성 ​

javascript```
// 다국어 메시지 포맷
const template = '{name}님의 주문 {orderNo}가 {status} 상태.';
const message = $u.util.formatString(template, {
  name: '홍길동',
  orderNo: 'ORD-12345',
  status: '배송중'
});

unidocuAlert(message);```
### 금액 표시 ​

javascript```
// 그리드에 금액 표시
const gridData = [
  { itemName: '상품A', price: 1234567.89, currency: 'KRW' },
  { itemName: '상품B', price: 987654.32, currency: 'USD' }
];

$.each(gridData, function(index, row) {
  const formattedPrice = $u.util.convertAmountNumberFormat(
    row.price,
    null,
    row.currency
  );
  console.log(row.itemName + ': ' + formattedPrice);
});
// 출력:
// 상품A: 1,234,568 (KRW는 소수점 없음)
// 상품B: 987,654.32 (USD는 소수점 2자리)```
### 브라우저별 처리 ​

javascript```
if ($u.util.isIE11()) {
  // IE11 전용 처리
  console.log('IE11 호환 모드로 실행.');
  // 특정 CSS 클래스 추가
  $('body').addClass('ie11-compatibility');
} else {
  // 최신 브라우저 기능 사용
  console.log('표준 모드로 실행.');
}```
### 파일 업로드 구현 ​

javascript```
// 엑셀 파일 업로드
$u.util.singleFileUploader({
  buttonEl: 'excelUploadButton',
  url: '/api/uploadExcel',
  filters: {
    max_file_size: '10mb',
    mime_types: [
      { title: "Excel files", extensions: "xls,xlsx" }
    ]
  },
  getMultipartParams: function() {
    return {
      programId: $u.page.getPROGRAM_ID(),
      userId: staticProperties.user.ID
    };
  },
  FileUploaded: function(up, file, info) {
    const response = JSON.parse(info.response);

    if (response.success) {
      unidocuAlert('파일 업로드 성공: ' + response.uploadedRows + '건');
      // 목록 재조회
      $u.buttons.triggerFormTableButtonClick();
    } else {
      unidocuAlert('업로드 실패: ' + response.message);
    }
  }
});```
## ⚠️ 주의사항 ​

- 배열 관련 함수는 빈 배열에도 안전하게 동작합니다
- 숫자 포맷은 사용자의 DCPFM 설정에 따라 달라집니다
- IE 관련 함수는 최신 브라우저에서는 의미가 없을 수 있습니다
- 이미지 미리보기는 이미지 파일만 지원합니다
- 클립보드 복사는 보안 정책에 따라 동작하지 않을 수 있습니다