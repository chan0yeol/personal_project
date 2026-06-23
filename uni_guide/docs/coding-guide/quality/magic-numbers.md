# 매직 넘버 제거 가이드 ​

코드 속 숫자에 의미를 부여하여 더 명확하고 유지보수하기 쉬운 코드를 작성하는 방법을 알아봅니다.

## 개요 ​

매직 넘버(Magic Number)란 코드에 직접 작성된 숫자를 말합니다.

앞으로 코드를 작성할 때 이런 숫자들을 의미 있는 상수로 표현하면:

- 📖 가독성 향상: 숫자의 의미를 이름으로 명확히 전달
- 🔧 유지보수 용이: 값 변경 시 한 곳만 수정하면 됨
- 🐛 오류 감소: 실수로 잘못된 값을 사용하는 것을 방지

앞으로 새로운 코드를 작성할 때는 의미 있는 상수 사용을 권장합니다.

## 상수로 표현하면 좋은 경우 ​

### 직접 작성된 숫자 ​

**기존 방식**:

javascript```
if (Date.now() - lastUpdate > 86400000) {  // 86400000이 무엇을 의미하는가?
    refresh();
}

if (password.length  8 || password.length > 20) {  // 8, 20이 왜 사용되는가?
    alert('비밀번호는 8-20자여야 합니다.');
}

if (userAge > 100) {  // 100은 무엇을 의미하는가?
    return false;
}```
**권장 방식**:

javascript```
// 상수로 의미를 명확히 표현
const ONE_DAY_IN_MILLIS = 86400000;
if (Date.now() - lastUpdate > ONE_DAY_IN_MILLIS) {
    refresh();
}

// 제약 조건을 상수로 관리
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 20;
if (password.length  MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    alert(`비밀번호는 ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH}자여야 합니다.`);
}

// 비즈니스 규칙을 상수로 표현
const MAX_REASONABLE_AGE = 100;
if (userAge > MAX_REASONABLE_AGE) {
    return false;
}```
**이렇게 하면 좋은 점**:

- ✨ 숫자의 의미가 코드에 명확히 표현됨
- ✨ 값 변경 시 한 곳만 수정하면 됨
- ✨ 오타나 잘못된 값 사용을 방지

## 매직 넘버가 아닌 경우 ​

모든 숫자가 매직 넘버는 아닙니다:

javascript```
// ✅ 명확한 의미를 가진 숫자들
const items = [];  // 빈 배열
const count = 0;   // 초기값 0
const half = value / 2;  // 절반
const doubled = value * 2;  // 2배

// ✅ 배열 인덱스
const firstItem = items[0];
const secondItem = items[1];

// ✅ 수학적 상수
const radius = 5;
const area = Math.PI * radius * radius;

// ✅ 백분율 계산
const percentage = (value / total) * 100;```
## 상수 선언 방법 ​

### 1. 파일 레벨 상수 ​

javascript```
// ✅ 파일 최상단에 선언
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT_MILLIS = 5000;
const PAGE_SIZE = 20;

function fetchData() {
    // 상수 사용
    let retries = 0;
    while (retries  MAX_RETRY_COUNT) {
        // ...
    }
}```
### 2. 객체로 그룹화 ​

관련된 상수들은 객체로 묶어서 관리:

javascript```
// ✅ 관련 상수 그룹화
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
};

const GRID_STATUS = {
    ACTIVE: 'A',
    INACTIVE: 'I',
    DELETED: 'D',
    PENDING: 'P'
};

// 사용
if (response.status === HTTP_STATUS.OK) {
    const activeRows = data.filter(row => row.STATUS === GRID_STATUS.ACTIVE);
}```
### 3. 설정 파일로 분리 ​

프로젝트 전체에서 사용하는 상수는 별도 파일로:

javascript```
// config/constants.js
export const API_CONFIG = {
    BASE_URL: 'https://api.example.com',
    TIMEOUT: 30000,
    MAX_RETRIES: 3
};

export const VALIDATION = {
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 20,
    MIN_USERNAME_LENGTH: 4,
    MAX_USERNAME_LENGTH: 30
};

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    FIRST_PAGE: 1
};

// 다른 파일에서 사용
import { API_CONFIG, VALIDATION } from './config/constants.js';

function validatePassword(password) {
    return password.length >= VALIDATION.MIN_PASSWORD_LENGTH
        && password.length  VALIDATION.MAX_PASSWORD_LENGTH;
}```
## 실전 예제 (일반소스 기반) ​

### 예제 1: RGB 색상 매직 넘버 ​

**참고 소스**: `uni-e-fi/view/UD_0220_001.js:134-136` (출장비 신청)

**기존 방식**:

javascript```
// ❌ 매직 넘버 사용
$nst.is_data_ot_data('ZUNIEWF_6640', {}, function(ot_data) {
    const dialogGridObj = $u.gridWrapper.getGrid('dialog-search-grid');
    dialogGridObj.setColumnHide('SELECTED', true);
    dialogGridObj.setJSONData(ot_data);
    $.each(ot_data, function (index, data) {
        if (data['FLAG'] === 'X') {
            dialogGridObj.setRowBgColor(index, '255|255|0');  // ❌ 이 RGB 값은?
        }
    });
});```
**권장 방식**:

javascript```
// ✅ 색상 코드를 상수로 관리
const BUSINESS_TRIP_COLORS = {
    HIGHLIGHTED_ROW: '255|255|0',    // 노란색 (강조 표시 행)
    WARNING_ROW: '255|200|200',      // 연한 빨강 (경고 행)
    NORMAL_ROW: '255|255|255'        // 흰색 (일반 행)
};

$nst.is_data_ot_data('ZUNIEWF_6640', {}, function(ot_data) {
    const dialogGridObj = $u.gridWrapper.getGrid('dialog-search-grid');
    dialogGridObj.setColumnHide('SELECTED', true);
    dialogGridObj.setJSONData(ot_data);
    $.each(ot_data, function (index, data) {
        if (data['FLAG'] === 'X') {
            dialogGridObj.setRowBgColor(index, BUSINESS_TRIP_COLORS.HIGHLIGHTED_ROW);
        }
    });
});```
**개선 효과**:

- RGB 값의 의미가 명확해짐 (강조 표시를 나타냄)
- 색상을 일관되게 관리 가능
- 디자인 변경 시 한 곳만 수정하면 됨

### 예제 2: 루프 인덱스와 블록 페이스트 ​

**참고 소스**: `uni-e-fi/view/UD_0220_001.js:66-72` (출장비 신청)

**기존 방식**:

javascript```
// ❌ 매직 넘버와 불명확한 루프
gridObj.onBlockPaste(function (startColumnKey, startRowIndex, endColumnKey, endRowIndex){
    const columnKey = gridObj.getActiveColumnKey();
    for (var i = startRowIndex, len = endRowIndex; i  len; i++) {  // ❌ i, len이 무엇?
        if (columnKey === 'LAND1') {
            gridObj.$V('D_GRADE', i, gridObj.getCachedCodeMap('LAND1')[gridObj.$V(columnKey, i)]['D_GRADE']);
        }
        if (/DATE$/.test(columnKey)) {
            gridObj.triggerChangeCell(columnKey, i);
        }
    }
});```
**권장 방식**:

javascript```
// ✅ 명확한 변수명 사용
gridObj.onBlockPaste(function (startColumnKey, startRowIndex, endColumnKey, endRowIndex){
    const activeColumnKey = gridObj.getActiveColumnKey();
    const startRow = startRowIndex;
    const endRow = endRowIndex;

    for (let currentRowIndex = startRow; currentRowIndex  endRow; currentRowIndex++) {
        if (activeColumnKey === 'LAND1') {
            const cachedValue = gridObj.getCachedCodeMap('LAND1')[gridObj.$V(activeColumnKey, currentRowIndex)];
            gridObj.$V('D_GRADE', currentRowIndex, cachedValue['D_GRADE']);
        }
        if (/DATE$/.test(activeColumnKey)) {
            gridObj.triggerChangeCell(activeColumnKey, currentRowIndex);
        }
    }
});```
**개선 효과**:

- 변수명이 명확하여 코드 가독성 향상
- 루프 인덱스의 의미가 명확 (`i` → `currentRowIndex`)
- 중간 변수로 복잡한 표현식을 분리하여 이해하기 쉬움

### 예제 3: 시간 제약 조건 ​

**참고 소스**: `uni-e-fi/view/UD_0201_001.js:63` (법인카드 전표등록)

**기존 방식**:

javascript```
// ❌ 매직 넘버 사용
if ($u.page.getPageParams()['TIPS'] > 0 && $u.programSetting.getValue('setTipsInfoMessage') !== ''){
    unidocuAlert($u.programSetting.getValue('setTipsInfoMessage'));
}```
**권장 방식**:

javascript```
// ✅ 상수로 명확하게 표현
const TIPS_THRESHOLD = 0;  // 팁 금액 임계값

const tipsAmount = $u.page.getPageParams()['TIPS'];
const tipsMessage = $u.programSetting.getValue('setTipsInfoMessage');

if (tipsAmount > TIPS_THRESHOLD && tipsMessage !== '') {
    unidocuAlert(tipsMessage);
}

// ✅ 더 나은 방법: 비즈니스 규칙을 명확히 표현
const BUSINESS_RULES = {
    TIPS_MINIMUM_AMOUNT: 0,      // 팁 알림 최소 금액
    EMPTY_STRING: ''             // 빈 문자열
};

const hasTips = tipsAmount > BUSINESS_RULES.TIPS_MINIMUM_AMOUNT;
const hasMessage = tipsMessage !== BUSINESS_RULES.EMPTY_STRING;

if (hasTips && hasMessage) {
    unidocuAlert(tipsMessage);
}```
**개선 효과**:

- 0이라는 임계값의 의미가 명확해짐
- 비즈니스 규칙을 코드로 명확히 표현
- 조건식이 더 읽기 쉬워짐

### 예제 4: DRAFT_0061.js - 비교 문자열 매직 값 ​

**실제 소스**: `uni-e-approval/view/DRAFT_0061.js:33-76`

javascript```
// ❌ 매직 문자열 사용 (기존 코드)
if (columnKey === 'EVI_GB') {
    gridObj3.$V('EVKEY', rowIndex, '');
    $ewf.DRAFT_0061.setEVKEY_Image(rowIndex, 'noEvidence');
    var evi_gb = gridObj3.$V('EVI_GB', rowIndex);
    if (evi_gb === 'C') {  // ❌ 'C'가 무엇을 의미하는가?
        // 법인카드 처리...
    }
    if (evi_gb === 'E') {  // ❌ 'E'가 무엇을 의미하는가?
        $ewf.DRAFT_0061.setAttachableImage(rowIndex);
    }
}```
**개선 제안**:

javascript```
// ✅ 상수로 명확하게 표현
const EVIDENCE_TYPE = {
    CORPORATE_CARD: 'C',    // 법인카드
    EXPENSE_REPORT: 'E',    // 지출결의서
    NONE: ''                // 증빙 없음
};

const EVIDENCE_IMAGE_STATE = {
    NO_EVIDENCE: 'noEvidence',
    HAS_EVIDENCE: 'hasEvidence',
    ATTACHABLE: 'attachable'
};

if (columnKey === 'EVI_GB') {
    gridObj3.$V('EVKEY', rowIndex, EVIDENCE_TYPE.NONE);
    $ewf.DRAFT_0061.setEVKEY_Image(rowIndex, EVIDENCE_IMAGE_STATE.NO_EVIDENCE);
    const evidenceType = gridObj3.$V('EVI_GB', rowIndex);

    if (evidenceType === EVIDENCE_TYPE.CORPORATE_CARD) {
        // 법인카드 처리...
    }
    if (evidenceType === EVIDENCE_TYPE.EXPENSE_REPORT) {
        $ewf.DRAFT_0061.setAttachableImage(rowIndex);
    }
}```
**개선 효과**:

- 'C', 'E' 같은 코드 값의 의미가 명확해짐
- 비즈니스 도메인 지식이 코드에 표현됨
- 새로운 증빙 유형 추가 시 확장 용이

### 예제 5: 타임아웃 처리 ​

javascript```
// ❌ 개선 전
setTimeout(() => {
    checkStatus();
}, 3000);

setInterval(() => {
    refresh();
}, 60000);

// ✅ 개선 후
const STATUS_CHECK_DELAY_MILLIS = 3000;  // 3초
const REFRESH_INTERVAL_MILLIS = 60000;   // 1분

setTimeout(() => {
    checkStatus();
}, STATUS_CHECK_DELAY_MILLIS);

setInterval(() => {
    refresh();
}, REFRESH_INTERVAL_MILLIS);

// ✅ 더 명확하게 (계산식으로 표현)
const SECONDS = 1000;
const MINUTES = 60 * SECONDS;

const STATUS_CHECK_DELAY = 3 * SECONDS;
const REFRESH_INTERVAL = 1 * MINUTES;

setTimeout(checkStatus, STATUS_CHECK_DELAY);
setInterval(refresh, REFRESH_INTERVAL);```
### 예제 2: Grid 데이터 처리 ​

javascript```
// ❌ 개선 전
const data = gridObj.getData();
const filtered = data.filter(row => {
    return row.AMOUNT > 1000000 && row.STATUS === 'A';
});

if (filtered.length > 100) {
    alert('결과가 너무 많습니다.');
}

// ✅ 개선 후
const AMOUNT_THRESHOLD = 1000000;  // 100만원
const ACTIVE_STATUS = 'A';
const MAX_DISPLAY_ROWS = 100;

const allRows = gridObj.getData();
const filteredRows = allRows.filter(row => {
    return row.AMOUNT > AMOUNT_THRESHOLD && row.STATUS === ACTIVE_STATUS;
});

if (filteredRows.length > MAX_DISPLAY_ROWS) {
    alert(`결과가 ${MAX_DISPLAY_ROWS}개를 초과합니다.`);
}```
### 예제 3: 폼 검증 ​

javascript```
// ❌ 개선 전
function validateForm() {
    const userId = $u.get('USER_ID');
    const email = $u.get('EMAIL');

    if (userId.length  5 || userId.length > 20) {
        return '사용자 ID는 5-20자여야 합니다.';
    }

    if (!email.includes('@') || email.length > 100) {
        return '올바른 이메일을 입력하세요.';
    }

    return null;
}

// ✅ 개선 후
const USER_ID_MIN_LENGTH = 5;
const USER_ID_MAX_LENGTH = 20;
const EMAIL_MAX_LENGTH = 100;

function validateForm() {
    const userId = $u.get('USER_ID');
    const email = $u.get('EMAIL');

    if (userId.length  USER_ID_MIN_LENGTH || userId.length > USER_ID_MAX_LENGTH) {
        return `사용자 ID는 ${USER_ID_MIN_LENGTH}-${USER_ID_MAX_LENGTH}자여야 합니다.`;
    }

    if (!email.includes('@') || email.length > EMAIL_MAX_LENGTH) {
        return `올바른 이메일(최대 ${EMAIL_MAX_LENGTH}자)을 입력하세요.`;
    }

    return null;
}```
### 예제 4: 상태 코드 처리 ​

javascript```
// ❌ 개선 전
function handleResponse(response) {
    if (response.status === 200) {
        return response.data;
    } else if (response.status === 401) {
        redirectToLogin();
    } else if (response.status === 404) {
        showNotFound();
    } else if (response.status >= 500) {
        showServerError();
    }
}

// ✅ 개선 후
const HTTP_STATUS = {
    OK: 200,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    SERVER_ERROR_START: 500
};

function handleResponse(response) {
    if (response.status === HTTP_STATUS.OK) {
        return response.data;
    } else if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        redirectToLogin();
    } else if (response.status === HTTP_STATUS.NOT_FOUND) {
        showNotFound();
    } else if (response.status >= HTTP_STATUS.SERVER_ERROR_START) {
        showServerError();
    }
}```
### 예제 5: 페이지네이션 ​

javascript```
// ❌ 개선 전
function loadPage(pageNumber) {
    const startIndex = (pageNumber - 1) * 20;
    const endIndex = startIndex + 20;
    return data.slice(startIndex, endIndex);
}

function hasNextPage(pageNumber, totalItems) {
    return pageNumber * 20  totalItems;
}

// ✅ 개선 후
const PAGE_SIZE = 20;

function loadPage(pageNumber) {
    const startIndex = (pageNumber - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return data.slice(startIndex, endIndex);
}

function hasNextPage(pageNumber, totalItems) {
    return pageNumber * PAGE_SIZE  totalItems;
}

// ✅ 더 나은 방법 (설정 객체)
const PAGINATION_CONFIG = {
    PAGE_SIZE: 20,
    FIRST_PAGE: 1
};

function loadPage(pageNumber) {
    const startIndex = (pageNumber - PAGINATION_CONFIG.FIRST_PAGE) * PAGINATION_CONFIG.PAGE_SIZE;
    const endIndex = startIndex + PAGINATION_CONFIG.PAGE_SIZE;
    return data.slice(startIndex, endIndex);
}```
## UniWORKS 특화 예제 ​

### SAP 상태 코드 ​

javascript```
// ✅ SAP 상태 코드 상수화
const SAP_STATUS = {
    ACTIVE: 'A',
    INACTIVE: 'I',
    DELETED: 'D',
    BLOCKED: 'B'
};

const POSTING_STATUS = {
    NEW: 'N',
    POSTED: 'P',
    CANCELLED: 'C'
};

// 사용
function getActiveRecords() {
    const allRows = gridObj.getData();
    return allRows.filter(row => row.STATUS === SAP_STATUS.ACTIVE);
}```
### Grid 설정 값 ​

javascript```
// ✅ Grid 관련 상수
const GRID_CONFIG = {
    MIN_COLUMN_WIDTH: 50,
    DEFAULT_COLUMN_WIDTH: 100,
    MAX_COLUMN_WIDTH: 300,
    DEFAULT_PAGE_SIZE: 20,
    MAX_SELECTION: 100
};

// 사용
function initializeGrid() {
    gridObj.setColumnWidth('USER_ID', GRID_CONFIG.DEFAULT_COLUMN_WIDTH);
    gridObj.setPageSize(GRID_CONFIG.DEFAULT_PAGE_SIZE);
}```
## 상수 네이밍 규칙 ​

### 1. UPPER_SNAKE_CASE 사용 ​

javascript```
// ✅ 상수는 대문자와 언더스코어
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT_MILLIS = 5000;```
### 2. 의미 있는 이름 ​

javascript```
// ❌ 의미 불명확
const NUM = 5;
const VAL = 100;

// ✅ 의미 명확
const MAX_LOGIN_ATTEMPTS = 5;
const MINIMUM_ORDER_AMOUNT = 100;```
### 3. 단위 명시 ​

javascript```
// ✅ 시간 단위 명시
const CACHE_DURATION_SECONDS = 300;
const SESSION_TIMEOUT_MINUTES = 30;
const FILE_MAX_SIZE_BYTES = 1048576;  // 1MB

// ✅ 또는 계산식으로
const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const MEGABYTES = 1024 * 1024;

const SESSION_TIMEOUT = 30 * MINUTES;
const FILE_MAX_SIZE = 1 * MEGABYTES;```
## 주의사항 ​

### 1. 과도한 상수화 피하기 ​

javascript```
// ❌ 과도한 상수화
const ZERO = 0;
const ONE = 1;
const TWO = 2;
const EMPTY_STRING = '';
const TRUE = true;

// ✅ 의미 있는 것만 상수화
const DEFAULT_PAGE_NUMBER = 1;
const MINIMUM_SEARCH_LENGTH = 2;```
### 2. 상수 변경 시 주의 ​

javascript```
// 상수를 변경할 때는 영향 범위를 확인
const PAGE_SIZE = 20;  // 이 값을 변경하면?
// → 모든 페이지네이션 동작이 변경됨
// → 테스트 필요```
### 3. 환경별 값 처리 ​

javascript```
// ✅ 환경별로 다른 값은 환경 변수 사용
const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// ✅ 환경에 따른 설정
const CONFIG = {
    TIMEOUT: IS_DEVELOPMENT ? 10000 : 5000,
    LOG_LEVEL: IS_DEVELOPMENT ? 'debug' : 'error'
};```
## 리팩토링 체크리스트 ​

코드에서 매직 넘버를 찾을 때:

- [ ] 코드에 직접 작성된 숫자를 찾는다
- [ ] 각 숫자의 의미를 파악한다
- [ ] 0, 1, 2 같은 명백한 값은 제외
- [ ] 의미 있는 상수명을 짓는다
- [ ] 관련된 상수들을 그룹화한다
- [ ] 단위가 있다면 이름에 포함한다
- [ ] 상수로 교체 후 테스트한다

## 참고 자료 ​

- 변수와 함수 네이밍 규칙 - 상수 네이밍 가이드
- var를 const/let으로 변환하기 - const 사용법
- Clean Code - Robert C. Martin