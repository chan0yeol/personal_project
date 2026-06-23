# 변수와 함수 네이밍 가이드 ​

일관되고 명확한 네이밍으로 더 읽기 쉬운 코드를 작성하는 방법을 알아봅니다.

## 개요 ​

좋은 변수명과 함수명은 코드를 문서화하는 가장 효과적인 방법입니다.

명확한 네이밍을 사용하면:

- 📖 가독성 향상: 주석 없이도 코드의 의도를 전달
- 🐛 버그 감소: 변수의 목적이 명확하여 실수 방지
- 🤝 협업 용이: 다른 개발자가 코드를 쉽게 이해

앞으로 새로운 코드를 작성할 때는 이 가이드의 네이밍 규칙을 참고하면 좋습니다.

## 기본 원칙 ​

### 1. 의미를 명확하게 표현 ​

javascript```
// ❌ 의미 불명확
const d = new Date();
const arr = [];
const temp = data[0];
const flag = true;

// ✅ 의미 명확
const currentDate = new Date();
const activeUsers = [];
const firstRow = data[0];
const isValidated = true;```
### 2. 약어보다는 전체 단어 사용 ​

javascript```
// ❌ 약어 남용
const usrCnt = getUserCount();
const msgTxt = getMessage();
const btnClk = handleClick;

// ✅ 전체 단어 사용
const userCount = getUserCount();
const messageText = getMessage();
const buttonClick = handleClick;

// ✅ 널리 알려진 약어는 허용
const userId = 'USER001';  // ID는 일반적
const htmlContent = '...';  // HTML은 일반적
const maxCount = 100;  // max, min은 일반적```
### 3. 일관된 케이스 사용 ​

javascript```
// 변수와 함수: camelCase
const userName = '홍길동';
const gridData = [];
function getUserInfo() { }

// 상수: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PAGE_SIZE = 20;

// 클래스: PascalCase
class UserManager { }
class GridController { }

// 컴포넌트 파일: PascalCase
UserProfile.vue
GridComponent.vue```
## 변수 네이밍 ​

### Boolean 변수 ​

`is`, `has`, `can`, `should` 접두사 사용:

javascript```
// ❌ 의도 불명확
const visible = true;
const permission = false;
const validation = true;

// ✅ Boolean임을 명확히 표현
const isVisible = true;
const hasPermission = false;
const canEdit = true;
const shouldValidate = true;```
### 배열과 컬렉션 ​

복수형 사용:

javascript```
// ❌ 단수형
const user = getUsers();
const item = gridObj.getData();

// ✅ 복수형
const users = getUsers();
const items = gridObj.getData();
const selectedRows = gridObj.getSELECTEDJSONData();
const activeUsers = users.filter(u => u.isActive);```
### 숫자 변수 ​

단위나 의미를 명확히:

javascript```
// ❌ 의미 불명확
const time = 5000;
const size = 100;
const limit = 50;

// ✅ 단위와 의미 명확
const timeoutMillis = 5000;
const maxFileSizeBytes = 100;
const pageLimit = 50;
const retryCount = 3;
const totalAmount = 1000000;```
### 함수 파라미터 ​

javascript```
// ❌ 짧고 의미 없는 이름
function calc(a, b, c) {
    return a + b * c;
}

// ✅ 의미 명확한 이름
function calculateTotalPrice(basePrice, quantity, taxRate) {
    return basePrice + quantity * taxRate;
}```
## 함수 네이밍 ​

### 동사로 시작 ​

함수는 행동을 나타내므로 동사로 시작:

javascript```
// ❌ 명사로 시작
function userData() { }
function validation() { }

// ✅ 동사로 시작
function getUserData() { }
function validateForm() { }
function handleClick() { }
function fetchData() { }
function renderGrid() { }```
### 일반적인 함수 네이밍 패턴 ​

javascript```
// 조회: get, find, fetch
function getUserById(id) { }
function findActiveUsers() { }
function fetchGridData() { }

// 설정: set, update, modify
function setUserName(name) { }
function updateGridCell(row, col, value) { }
function modifyStatus(status) { }

// 생성: create, make, generate
function createNewUser(userData) { }
function makeRequest(params) { }
function generateReport() { }

// 삭제: delete, remove, clear
function deleteUser(id) { }
function removeSelectedRows() { }
function clearCache() { }

// 검증: validate, check, verify
function validateEmail(email) { }
function checkPermission(user) { }
function verifyToken(token) { }

// 변환: convert, transform, parse
function convertToJson(data) { }
function transformData(input) { }
function parseResponse(response) { }

// 이벤트 핸들러: handle, on
function handleSubmit(event) { }
function onGridRowClick(row) { }
function handleUserInput(value) { }```
### Boolean 반환 함수 ​

javascript```
// is, has, can, should로 시작
function isValid(value) {
    return value !== null && value !== undefined;
}

function hasPermission(user, action) {
    return user.permissions.includes(action);
}

function canEdit(user, document) {
    return user.id === document.ownerId || user.isAdmin;
}

function shouldRefresh(lastUpdate) {
    const now = Date.now();
    return now - lastUpdate > 60000; // 1분 경과
}```
## 실무 적용 예제 ​

💡 **참고**: 아래 예제는 일반소스의 실제 코드를 기반으로, 앞으로 코드 작성 시 참고할 수 있는 좋은 네이밍 패턴을 소개합니다.

## 실전 예제 ​

### 예제 1: 버튼 핸들러 네이밍 - CRUD 동작 ​

**참고 소스**: `uni-e-approval/view/DRAFT_0061.js:80-104` (출장비정산)

javascript```
// 명확한 버튼 핸들러 네이밍
$u.buttons.addHandler({
    "addEmp_exp": function () {
        gridObj.asserts.rowSelected($mls.getByCode('M_draft_0031_gridObjNotSelected'));
        gridObj3.addRow();
        const selectedjsonData = gridObj.getSELECTEDJSONData()[0];
        delete selectedjsonData['BELNR'];
        delete selectedjsonData['GJAHR'];
        delete selectedjsonData['BUKRS'];
        if($u.get('WAERS')) selectedjsonData['WAERS'] = $u.get('WAERS').getValue();
        gridObj3.setRowDataByJSONObj(gridObj3.getActiveRowIndex(), selectedjsonData)
    },
    "deleteEmp_exp": function () {
        gridObj3.asserts.rowSelected();
        $.each(gridObj3.getSELECTEDJSONData(), function (index, item) {
            if (item['BELNR']) throw $mls.getByCode('M_DRAFT_0061_cannotDelete');
        });
        gridObj3.deleteSelectedRows();
        $ewf.DRAFT_0061.summaryGrid3ToGrid();
    },
    "grid3CreateBELNR": function () {
        gridObj3.asserts.rowSelected();
        // ... 전표 생성 로직
    }
});```
**네이밍 분석**:

- `addEmp_exp`: 직원 경비 항목을 추가한다는 의도가 명확
- `deleteEmp_exp`: 경비 항목을 삭제한다는 동작 명시
- `grid3CreateBELNR`: grid3에서 전표번호(BELNR)를 생성
- 동사로 시작하여 수행하는 동작을 명확히 표현

### 예제 2: 커스텀 핸들러 네이밍 - 셀 편집 제어 ​

**참고 소스**: `uni-e-fi/view/UD_0220_001.js:147-166` (출장비 신청)

javascript```
// 커스텀 핸들러 네이밍
$u.buttons.addCustomHandler({
    "setCellEditableByTranType": function(rowIndex) {
        if (!gridObj.getGridHeader('TRAN_TYPE')) return;
        const tranType = gridObj.$V('TRAN_TYPE', rowIndex);
        if (tranType === 'A') {
            gridObj.makeCellReadOnly('TRAN_EXP', rowIndex);
            gridObj.makeCellEditable('KM', rowIndex);
            gridObj.makeCellEditable('OIL', rowIndex);
        }
        else {
            gridObj.makeCellEditable('TRAN_EXP', rowIndex);
            readOnlyAndBlankCell('KM', rowIndex);
            readOnlyAndBlankCell('OIL', rowIndex);
        }

        function readOnlyAndBlankCell(columnKey, rowIndex) {
            gridObj.makeCellReadOnly(columnKey, rowIndex);
            gridObj.$V(columnKey, rowIndex, '');
        }
    },
    "calculateTrans": function() {
        const deferred = $.Deferred();
        $nst.is_data_it_data_nsReturn($u.programSetting.getValue('CalculateFunction'),
            $u.getValues(), gridObj.getJSONData(), function (nsReturn) {
            deferred.resolve(nsReturn.getTableReturn('OT_DATA'));
        });
        return deferred.promise();
    }
});```
**네이밍 분석**:

- `setCellEditableByTranType`: 교통수단 유형에 따라 셀 편집 가능 여부를 설정
- `calculateTrans`: 교통비를 계산한다는 의도 명확
- `readOnlyAndBlankCell`: 내부 함수도 명확한 동사 + 목적어 패턴
- 함수명만으로도 어떤 작업을 수행하는지 이해 가능

### 예제 3: 변수 네이밍 - 선택된 데이터 처리 ​

**참고 소스**: `uni-e-approval/view/DRAFT_0061.js:156-158` (출장비정산)

javascript```
// 명확한 변수 네이밍
"deleteEmployee": function () {
    gridObj.asserts.rowSelected();
    const selectedPERNR = gridObj.getSELECTEDJSONData()[0]['PERNR'];
    if (gridObj3.$F(selectedPERNR, 'PERNR').length > 0) {
        throw $mls.getByCode('M_DRAFT_0061_deleteEmployee') + gridObj.getSELECTEDJSONData()[0]['PERNR_TXT'];
    }
    gridObj.deleteSelectedRows();
}```
**네이밍 분석**:

- `selectedPERNR`: 선택된 사번이라는 의미가 명확
- `selected` 접두사로 선택된 값임을 표현
- SAP 필드명(PERNR)과 조합하여 의미 전달

### 예제 4: 이벤트 핸들러 네이밍 - 셀 변경 이벤트 ​

**참고 소스**: `uni-e-fi/view/UD_0220_001.js:46-64` (출장비 신청)

javascript```
// 이벤트 핸들러의 명확한 파라미터 네이밍
gridObj.onChangeCell(function (columnKey, rowIndex, oldValue, newValue, jsonObj) {
    if (/_EXP$/.test(columnKey) && columnKey !== 'SUM_EXP') {
        const rowData = gridObj.getJSONDataByRowIndex(rowIndex);
        let sum = 0;
        $.each(rowData, function(key, value) {
            if (/_EXP$/.test(key) && key !== 'SUM_EXP') {
                sum += parseFloat(value !== '' ? value : 0);
            }
        });
        gridObj.$V('SUM_EXP', rowIndex, sum);
    } else if (/DATE$/.test(columnKey) && gridObj.getGridHeader('TR_DAY')) {
        $u.buttons.runCustomHandler('calculateDate', rowIndex);
    } else if (columnKey === 'TRAN_TYPE') {
        $u.buttons.runCustomHandler('setCellEditableByTranType', rowIndex);
        if (newValue === 'A') gridObj.$V('TRAN_EXP', rowIndex, '');
    }
    if (columnKey === 'LAND1') {
        jsonObj ? gridObj.$V('D_GRADE', rowIndex, jsonObj['D_GRADE']) : gridObj.$V('D_GRADE', rowIndex, '');
    }
});```
**네이밍 분석**:

- `columnKey`: 변경된 컬럼의 키
- `rowIndex`: 변경된 행의 인덱스
- `oldValue`, `newValue`: 변경 전후 값을 명확히 표현
- `jsonObj`: 컬럼에 연결된 JSON 객체
- `rowData`: 행 데이터라는 의미 명확

### 예제 5: 전표 생성 핸들러 네이밍 ​

**참고 소스**: `uni-e-fi/view/UD_0220_001.js:74-99` (출장비 신청)

javascript```
// 복잡한 비즈니스 로직의 명확한 핸들러 네이밍
$u.buttons.addHandler({
    'createStatement': function () {
        $u.validateRequired();
        gridObj.validateGridRequired();
        if ($u.programSetting.getValue('isAttachmentRequired') === 'true' && $('.file-count').html() === '0') {
            throw $mls.getByCode('M_shouldAttachEvidence');
        }
        const formData = $u.getValues('header-invoicer-content');
        const gridData = gridObj.getJSONData();
        $u.fileUI.setFileAttachKeyParam(formData);

        if ($u.programSetting.getValue('shouldCalculateEXP') === 'true') {
            $u.buttons.runCustomHandler('calculateTrans')
                .then(function (calculatedGridData) {
                    $.each(calculatedGridData, function (index, data) {
                        $.each($u.programSetting.getValue('CalculateTarget'), function (_, value) {
                            if ($u.util.contains(value, $u.programSetting.getValue('CalculateTarget'))
                                && parseFloat(data[value]) !== parseFloat(gridData[index][value] || 0)) {
                                unidocuAlert($mls.getByCode('M_UD_0220_001_calculateEXPBeforeCreateStatement'));
                                throw $mls.getByCode('M_UD_0220_001_calculateEXPBeforeCreateStatement');
                            }
                        });
                    });
                    return calculatedGridData;
                })
                .then(function (calculatedGridData) {
                    $u.buttons.runCustomHandler('createStatement', formData, calculatedGridData);
                })
        } else {
            $u.buttons.runCustomHandler('createStatement', formData, gridData);
        }
    }
});```
**네이밍 분석**:

- `createStatement`: 전표를 생성한다는 명확한 의도
- `formData`, `gridData`: 폼 데이터와 그리드 데이터를 구분
- `calculatedGridData`: 계산된 그리드 데이터라는 의미 표현
- Promise 체인 내에서도 일관된 네이밍 유지

### 예제 6: Grid 관련 코드 ​

javascript```
// ❌ 개선 전
function proc() {
    const d = gridObj.getData();
    let r = [];
    for (let i = 0; i  d.length; i++) {
        if (d[i].S === 'A') {
            r.push(d[i]);
        }
    }
    return r;
}

// ✅ 개선 후
function getActiveGridRows() {
    const allRows = gridObj.getData();
    const activeRows = [];

    for (let i = 0; i  allRows.length; i++) {
        const row = allRows[i];
        if (row.STATUS === 'A') {
            activeRows.push(row);
        }
    }

    return activeRows;
}

// ✅ 더 나은 방법
function getActiveGridRows() {
    const allRows = gridObj.getData();
    return allRows.filter(row => row.STATUS === 'A');
}```
### 예제 2: 폼 검증 ​

javascript```
// ❌ 개선 전
function chk() {
    const u = $u.get('USER_ID');
    const p = $u.get('PWD');

    if (!u || !p) {
        return false;
    }

    if (u.length  5) {
        return false;
    }

    return true;
}

// ✅ 개선 후
function validateLoginForm() {
    const userId = $u.get('USER_ID');
    const password = $u.get('PWD');

    if (!userId || !password) {
        return false;
    }

    const MIN_USER_ID_LENGTH = 5;
    if (userId.length  MIN_USER_ID_LENGTH) {
        return false;
    }

    return true;
}

// ✅ 더 나은 방법 (명확한 에러 메시지)
function validateLoginForm() {
    const userId = $u.get('USER_ID');
    const password = $u.get('PWD');
    const MIN_USER_ID_LENGTH = 5;

    if (!userId || !password) {
        throw new Error('사용자 ID와 비밀번호를 입력해주세요.');
    }

    if (userId.length  MIN_USER_ID_LENGTH) {
        throw new Error(`사용자 ID는 최소 ${MIN_USER_ID_LENGTH}자 이상이어야 합니다.`);
    }

    return true;
}```
### 예제 3: 데이터 처리 ​

javascript```
// ❌ 개선 전
const data = gridObj.getData();
let total = 0;
for (let i = 0; i  data.length; i++) {
    total += Number(data[i].AMT);
}
const avg = total / data.length;

// ✅ 개선 후
const allGridRows = gridObj.getData();
let totalAmount = 0;

for (let i = 0; i  allGridRows.length; i++) {
    const row = allGridRows[i];
    totalAmount += Number(row.AMOUNT);
}

const averageAmount = totalAmount / allGridRows.length;

// ✅ 더 나은 방법 (함수 분리)
function calculateAverageAmount(rows) {
    const totalAmount = rows.reduce((sum, row) => {
        return sum + Number(row.AMOUNT);
    }, 0);

    return totalAmount / rows.length;
}

const allGridRows = gridObj.getData();
const averageAmount = calculateAverageAmount(allGridRows);```
### 예제 4: 이벤트 핸들러 ​

javascript```
// ❌ 개선 전
function click() {
    const v = $u.get('SEARCH_TEXT');
    if (v) {
        search(v);
    }
}

// ✅ 개선 후
function handleSearchButtonClick() {
    const searchText = $u.get('SEARCH_TEXT');

    if (searchText) {
        performSearch(searchText);
    }
}

function performSearch(keyword) {
    // 검색 로직
    const results = fetchSearchResults(keyword);
    displaySearchResults(results);
}```
## UniWORKS 특화 네이밍 ​

### SAP 필드명 매핑 ​

SAP 필드명은 그대로 사용하되, 로컬 변수는 의미 있게:

javascript```
// ✅ SAP 필드는 원본 유지, 로컬 변수는 명확하게
const companyCode = $u.get('BUKRS');  // BUKRS는 SAP 표준
const fiscalYear = $u.get('GJAHR');   // GJAHR는 SAP 표준
const documentAmount = $u.get('WRBTR'); // WRBTR는 SAP 표준

// Grid 컬럼도 SAP 필드명 유지
const selectedRows = gridObj.getSELECTEDJSONData();
selectedRows.forEach(row => {
    const amount = Number(row.WRBTR);  // 필드명은 WRBTR 유지
    const currency = row.WAERS;        // 필드명은 WAERS 유지
});```
### UniWORKS API 패턴 ​

javascript```
// 조회
function loadUserList() { }
function fetchCompanyData() { }

// 저장
function saveFormData() { }
function updateGridChanges() { }

// 검증
function validateRequiredFields() { }
function checkDuplicateEntry() { }```
## 주의사항 ​

### 1. 너무 긴 이름 피하기 ​

javascript```
// ❌ 과도하게 긴 이름
const listOfAllActiveUserAccountsWithAdminPrivileges = [];

// ✅ 적절한 길이
const activeAdminUsers = [];```
### 2. 문맥상 중복 피하기 ​

javascript```
// ❌ 중복된 문맥
class User {
    getUserName() { }  // 이미 User 클래스 안이므로 user 중복
    getUserEmail() { }
}

// ✅ 간결하게
class User {
    getName() { }
    getEmail() { }
}```
### 3. 부정형 Boolean 피하기 ​

javascript```
// ❌ 부정형 (이중 부정 발생)
const isNotValid = false;
if (!isNotValid) { }  // 이중 부정

// ✅ 긍정형
const isValid = true;
if (isValid) { }```
## 네이밍 체크리스트 ​

코드 리뷰 시 확인할 사항:

- [ ] 변수명이 저장된 값의 의미를 명확히 표현하는가?
- [ ] 함수명이 수행하는 동작을 정확히 설명하는가?
- [ ] Boolean 변수는 is/has/can/should로 시작하는가?
- [ ] 배열은 복수형 이름을 사용하는가?
- [ ] 일관된 케이스(camelCase, PascalCase 등)를 사용하는가?
- [ ] 약어보다는 전체 단어를 사용하는가? (일반적인 약어 제외)
- [ ] 매직 넘버 대신 상수명을 사용하는가?

## 참고 자료 ​

- Clean Code - Robert C. Martin