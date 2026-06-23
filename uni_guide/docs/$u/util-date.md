# $u.util.date ​

날짜 관련 유틸리티 함수

## 개요 ​

`$u.util.date`는 날짜 처리, 포맷 변환, 날짜 계산 등 날짜 관련 기능을 제공하는 네임스페이스. SAP의 날짜 포맷(YYYYMMDD)과 사용자 표시 포맷 간 변환을 지원.

## 날짜 포맷 ​

### 데이터 포맷 (Data Format) ​

SAP 시스템에서 사용하는 날짜 포맷: `YYYYMMDD`

- 예: `20250130` (2025년 1월 30일)

### 사용자 포맷 (User Format) ​

사용자 설정에 따른 표시 포맷

- `YYYY-MM-DD` (예: `2025-01-30`)
- `DD.MM.YYYY` (예: `30.01.2025`)
- `MM/DD/YYYY` (예: `01/30/2025`)
- `YYYY.MM.DD` (예: `2025.01.30`)
- `YYYY/MM/DD` (예: `2025/01/30`)

## 주요 메서드 ​

### 현재 날짜 조회 ​

#### `$u.util.date.getCurrentServerDate()` ​

서버 시간 기준 현재 날짜를 Date 객체로 반환.

javascript```
const serverDate = $u.util.date.getCurrentServerDate();
console.log(serverDate); // Date 객체```
#### `$u.util.date.getCurrentDateAsDataFormat()` ​

현재 날짜를 데이터 포맷(YYYYMMDD)으로 반환.

javascript```
const today = $u.util.date.getCurrentDateAsDataFormat();
console.log(today); // "20250130"```
#### `$u.util.date.getCurrentDateAsUserDateFormat()` ​

현재 날짜를 사용자 포맷으로 반환.

javascript```
const today = $u.util.date.getCurrentDateAsUserDateFormat();
console.log(today); // "2025-01-30" (사용자 설정에 따라 다름)```
### 날짜 포맷 변환 ​

#### `$u.util.date.getDateAsDataFormat(value)` ​

날짜를 데이터 포맷(YYYYMMDD)으로 변환.

javascript```
// Date 객체를 데이터 포맷으로
const date = new Date(2025, 0, 30);
const dataFormat = $u.util.date.getDateAsDataFormat(date);
console.log(dataFormat); // "20250130"

// 사용자 포맷을 데이터 포맷으로
const dataFormat2 = $u.util.date.getDateAsDataFormat('2025-01-30');
console.log(dataFormat2); // "20250130"```
#### `$u.util.date.getDateAsUserDateFormat(value)` ​

날짜를 사용자 포맷으로 변환.

javascript```
const userFormat = $u.util.date.getDateAsUserDateFormat('20250130');
console.log(userFormat); // "2025-01-30" (사용자 설정에 따라 다름)```
#### `$u.util.date.addUserDateFormatDelimiter(userFormattedDateWithoutDelimiter)` ​

구분자 없는 사용자 포맷 날짜에 구분자를 추가.

javascript```
const formatted = $u.util.date.addUserDateFormatDelimiter('20250130');
console.log(formatted); // "2025-01-30"```
### 날짜 계산 ​

#### `$u.util.date.addDate(value, offset)` ​

날짜에 일수를 더.

javascript```
// 7일 후
const nextWeek = $u.util.date.addDate('20250130', 7);
console.log(nextWeek); // "20250206"

// 3일 전
const threeDaysAgo = $u.util.date.addDate('20250130', -3);
console.log(threeDaysAgo); // "20250127"```
#### `$u.util.date.addMonth(value, offset)` ​

날짜에 월수를 더.

javascript```
// 2개월 후
const twoMonthsLater = $u.util.date.addMonth('20250130', 2);
console.log(twoMonthsLater); // "20250330"

// 1개월 전
const lastMonth = $u.util.date.addMonth('20250130', -1);
console.log(lastMonth); // "20241230"```
#### `$u.util.date.getDiffDays(toDate, fromDate)` ​

두 날짜 간 일수 차이를 계산.

javascript```
const diff = $u.util.date.getDiffDays('20250206', '20250130');
console.log(diff); // 7

// 음수도 가능
const diff2 = $u.util.date.getDiffDays('20250130', '20250206');
console.log(diff2); // -7```
#### `$u.util.date.getNightDaysString(toDate, fromDate)` ​

숙박 일정 형식으로 문자열을 반환.

javascript```
const nightDays = $u.util.date.getNightDaysString('20250203', '20250130');
console.log(nightDays); // "4박 5일"```
### 날짜 정보 추출 ​

#### `$u.util.date.getCurrentYear()` ​

현재 연도를 반환.

javascript```
const year = $u.util.date.getCurrentYear();
console.log(year); // "2025"```
#### `$u.util.date.getCurrentMonth()` ​

현재 월을 반환.

javascript```
const month = $u.util.date.getCurrentMonth();
console.log(month); // "01"```
#### `$u.util.date.getCurrentHourMinute()` ​

현재 시각(시분)을 반환.

javascript```
const time = $u.util.date.getCurrentHourMinute();
console.log(time); // "1430" (14시 30분)```
#### `$u.util.date.getDayOfWeek(dateString)` ​

날짜의 요일을 반환.

javascript```
const dayOfWeek = $u.util.date.getDayOfWeek('20250130');
console.log(dayOfWeek); // "목"```
### Select 옵션 생성 ​

#### `$u.util.date.getYearSelectOptions()` ​

연도 선택 옵션을 생성. (현재년도 ±5년)

javascript```
const yearOptions = $u.util.date.getYearSelectOptions();
$('#yearSelect').append(yearOptions);```
#### `$u.util.date.getMonthSelectOptions()` ​

월 선택 옵션을 생성. (01~12)

javascript```
const monthOptions = $u.util.date.getMonthSelectOptions();
$('#monthSelect').append(monthOptions);```
#### `$u.util.date.getHourSelectOptions()` ​

시간 선택 옵션을 생성. (00~23)

javascript```
const hourOptions = $u.util.date.getHourSelectOptions();
$('#hourSelect').append(hourOptions);```
#### `$u.util.date.getMinuteSelectOptions()` ​

분 선택 옵션을 생성. (00~59)

javascript```
const minuteOptions = $u.util.date.getMinuteSelectOptions();
$('#minuteSelect').append(minuteOptions);```
### 날짜 포맷 정보 ​

#### `$u.util.date.getUserDateFormat()` ​

사용자 날짜 포맷을 반환.

javascript```
const format = $u.util.date.getUserDateFormat();
console.log(format); // "yy-mm-dd"```
#### `$u.util.date.getUserDateMonthFormat()` ​

사용자 년월 포맷을 반환.

javascript```
const format = $u.util.date.getUserDateMonthFormat();
console.log(format); // "yy-mm"```
## 💡 실전 예제 ​

### 검색 조건 기본값 설정 ​

javascript```
// 페이지 로드 시 검색 조건 기본값
$(document).ready(function() {
  // 오늘 날짜
  const today = $u.util.date.getCurrentDateAsDataFormat();
  $u.set('search-condition', 'DATE_FROM', today);

  // 한 달 후
  const oneMonthLater = $u.util.date.addMonth(today, 1);
  $u.set('search-condition', 'DATE_TO', oneMonthLater);
});```
### 날짜 범위 검증 ​

javascript```
function validateDateRange() {
  const fromDate = $u.get('search-condition', 'DATE_FROM').getValue();
  const toDate = $u.get('search-condition', 'DATE_TO').getValue();

  // 날짜 차이 계산
  const diff = $u.util.date.getDiffDays(toDate, fromDate);

  if (diff  0) {
    throw '시작일은 종료일보다 이전이어야 합니다.';
  }

  if (diff > 365) {
    throw '조회 기간은 1년을 초과할 수 없습니다.';
  }
}```
### 날짜 표시 형식 변환 ​

javascript```
// 그리드 데이터 표시
const gridData = gridObj.getJSONData();

$.each(gridData, function(index, row) {
  // 데이터 포맷(YYYYMMDD)을 사용자 포맷으로 변환
  if (row.ORDER_DATE) {
    const displayDate = $u.util.date.getDateAsUserDateFormat(row.ORDER_DATE);
    gridObj.$V('ORDER_DATE_DISPLAY', index, displayDate);
  }
});```
### 기간 계산 ​

javascript```
// 출장 기간 계산
const startDate = $u.get('form-table1', 'TRIP_START').getValue();
const endDate = $u.get('form-table1', 'TRIP_END').getValue();

if (startDate && endDate) {
  const nightDays = $u.util.date.getNightDaysString(endDate, startDate);
  $('#tripDuration').text(nightDays);

  const days = $u.util.date.getDiffDays(endDate, startDate) + 1;
  const totalCost = days * 50000; // 일당 계산
  $u.set('form-table1', 'DAILY_ALLOWANCE', totalCost);
}```
### 동적 날짜 Select 생성 ​

javascript```
// 연월 선택 UI 생성
function createYearMonthSelector() {
  const $yearSelect = $('');
  const $monthSelect = $('');

  // 옵션 추가
  $yearSelect.append($u.util.date.getYearSelectOptions());
  $monthSelect.append($u.util.date.getMonthSelectOptions());

  // 현재 연월로 초기화
  const currentYear = $u.util.date.getCurrentYear();
  const currentMonth = $u.util.date.getCurrentMonth();

  $yearSelect.val(currentYear);
  $monthSelect.val(currentMonth);

  // 컨테이너에 추가
  $('#dateSelector')
    .append($yearSelect)
    .append($monthSelect);
}```
### 날짜 간격 제한 ​

javascript```
// DatePickerFromTo에 날짜 간격 제한 적용
const $dateFromTo = $u.get('search-condition', 'PERIOD');

// 최대 30일 간격으로 제한
$u.util.limitDateInterval($dateFromTo, 30);```
### 날짜 포맷 통일 ​

javascript```
// 사용자 입력 날짜를 데이터 포맷으로 통일
function normalizeDate(userInput) {
  try {
    // 구분자 제거
    const normalized = userInput.replace(/[./-]/g, '');

    // 데이터 포맷으로 변환
    return $u.util.date.getDateAsDataFormat(normalized);
  } catch (error) {
    throw '올바른 날짜 형식이 아닙니다.';
  }
}

// 사용
const inputDate = '2025-01-30';
const dataFormat = normalizeDate(inputDate);
console.log(dataFormat); // "20250130"```
## ⚠️ 주의사항 ​

- 모든 날짜 계산은 서버 시간을 기준으로 합니다
- 사용자 포맷은 사용자의 `DATFM_TXT` 설정에 따라 달라집니다
- 데이터 포맷은 항상 `YYYYMMDD` 형식을 사용합니다
- 날짜 문자열은 구분자(-, ., /)를 포함하거나 포함하지 않을 수 있습니다
- 월 계산 시 일자가 해당 월의 마지막 날을 초과하면 자동 조정됩니다
- 빈 날짜(`''` 또는 `'00000000'`)는 계산에서 `0`으로 처리됩니다