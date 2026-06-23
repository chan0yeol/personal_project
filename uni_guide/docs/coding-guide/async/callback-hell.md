# 콜백 지옥 해결하기 ​

중첩된 콜백을 Promise와 async/await으로 개선

## 개요 ​

UniWORKS는 서버 통신 시 콜백 함수를 사용합니다. 여러 작업을 순차 실행하면 콜백이 깊게 중첩되어 **콜백 지옥(Callback Hell)**이 발생하며, 코드 가독성과 유지보수성이 저하됩니다.

## 콜백 함수 기본 ​

콜백 함수는 다른 함수의 인자로 전달되어 나중에 실행됩니다.

javascript```
// ✅ 기본 콜백 예제
function fetchData(callback) {
    setTimeout(() => {
        const data = { name: 'UniWORKS', version: '6.0' };
        callback(data);
    }, 1000);
}

fetchData((result) => {
    console.log(result); // { name: 'UniWORKS', version: '6.0' }
});```
UniWORKS의 서버 호출도 콜백 기반입니다:

javascript```
// UniWORKS 서버 호출
$nst.is_data_ot_data('GET_USER', {}, (data) => {
    // 이 부분이 콜백 함수
    console.log('데이터:', data);
});```
## 콜백 지옥 ​

비동기 작업을 순차 실행하면 콜백이 중첩됩니다.

**문제점**

| 항목 | 설명 |
| 가독성 | 오른쪽 들여쓰기로 코드 파악 어려움 |
| 에러 처리 | 각 단계마다 에러 처리 필요 |
| 디버깅 | 문제 발생 지점 추적 어려움 |
| 유지보수 | 로직 추가/수정 복잡 |
### 피라미드 패턴 ​

javascript```
// ❌ 콜백 지옥 - 5단계 중첩
$nst.is_data_os_data('GET_USER', { USER_ID: '001' }, (userData) => {
    $nst.is_data_ot_data('GET_ORDERS', { USER_ID: userData.USER_ID }, (ordersData) => {
        $nst.is_data_os_data('GET_PAYMENT', { ORDER_ID: ordersData[0].ORDER_ID }, (paymentData) => {
            $nst.it_data_returnMessage('UPDATE_STATUS', { STATUS: 'PROCESSED' }, (message) => {
                unidocuAlert(message, () => {
                    console.log('완료');
                });
            });
        });
    });
});```
## 실전 예제 ​

javascript```
// ❌ 콜백 지옥
function saveGridData() {
    const gridObj = $u.gridWrapper.getGrid();

    // 1. 선택된 데이터 가져오기
    const selectedData = gridObj.getSELECTEDJSONData();

    if (selectedData.length === 0) {
        throw '행을 선택해주세요.';
    }

    // 2. 검증을 위해 서버에서 데이터 조회
    $nst.is_data_os_data('VALIDATE_DATA', { DATA: selectedData }, (validationResult) => {
        if (!validationResult.isValid) {
            unidocuAlert(validationResult.message);
            return;
        }

        // 3. 검증 통과 후 저장
        $nst.it_data_returnMessage('SAVE_DATA', selectedData, (saveMessage) => {
            console.log('저장 완료');

            // 4. 저장 후 재조회
            $nst.is_data_ot_data('GET_DATA', {}, (newData) => {
                gridObj.setJSONData(newData);

                // 5. 완료 알림
                unidocuAlert(saveMessage, () => {
                    console.log('모든 작업 완료');
                });
            });
        });
    });
}```
이 코드는 5단계가 중첩되어 있어 매우 읽기 어렵습니다!

## 해결 방법 ​

### 방법 1: 함수 분리 ​

콜백을 별도 함수로 분리하여 가독성을 높입니다.

javascript```
// ✅ 함수 분리
function saveGridData() {
    const gridObj = $u.gridWrapper.getGrid();
    const selectedData = gridObj.getSELECTEDJSONData();

    if (selectedData.length === 0) {
        throw '행을 선택해주세요.';
    }

    validateData(selectedData);
}

function validateData(data) {
    $nst.is_data_os_data('VALIDATE_DATA', { DATA: data }, (result) => {
        if (!result.isValid) {
            unidocuAlert(result.message);
            return;
        }
        saveData(data);
    });
}

function saveData(data) {
    $nst.it_data_returnMessage('SAVE_DATA', data, (message) => {
        console.log('저장 완료');
        reloadData(message);
    });
}

function reloadData(message) {
    const gridObj = $u.gridWrapper.getGrid();

    $nst.is_data_ot_data('GET_DATA', {}, (newData) => {
        gridObj.setJSONData(newData);
        unidocuAlert(message);
    });
}```
**개선 효과:**

- ✅ 중첩이 사라져 가독성 향상
- ✅ 각 함수의 역할이 명확
- ✅ 재사용 가능
- ⚠️ 하지만 여전히 콜백 기반

### 방법 2: Promise 사용 (권장) ​

Promise를 사용하여 체이닝으로 작성합니다.

javascript```
// ✅ Promise로 변환
function saveGridDataPromise() {
    const gridObj = $u.gridWrapper.getGrid();
    const selectedData = gridObj.getSELECTEDJSONData();

    if (selectedData.length === 0) {
        return Promise.reject('행을 선택해주세요.');
    }

    // Promise 체인
    return validateDataPromise(selectedData)
        .then(() => saveDataPromise(selectedData))
        .then((message) => reloadDataPromise(message))
        .then((message) => {
            unidocuAlert(message);
        })
        .catch((error) => {
            unidocuAlert(error);
        });
}

// Promise 래퍼 함수들
function validateDataPromise(data) {
    return new Promise((resolve, reject) => {
        $nst.is_data_os_data('VALIDATE_DATA', { DATA: data }, (result) => {
            if (result.isValid) {
                resolve();
            } else {
                reject(result.message);
            }
        });
    });
}

function saveDataPromise(data) {
    return new Promise((resolve) => {
        $nst.it_data_returnMessage('SAVE_DATA', data, (message) => {
            resolve(message);
        });
    });
}

function reloadDataPromise(message) {
    return new Promise((resolve) => {
        const gridObj = $u.gridWrapper.getGrid();
        $nst.is_data_ot_data('GET_DATA', {}, (newData) => {
            gridObj.setJSONData(newData);
            resolve(message);
        });
    });
}```
**개선 효과:**

- ✅ 체이닝으로 순차 실행이 명확
- ✅ 에러 처리가 catch 하나로 통일
- ✅ 각 단계의 데이터 흐름이 보임

### 방법 3: async/await 사용 (최고 권장) ​

async/await으로 마치 동기 코드처럼 작성합니다.

javascript```
// ✅✅ async/await - 가장 깔끔!
async function saveGridDataAsync() {
    try {
        const gridObj = $u.gridWrapper.getGrid();
        const selectedData = gridObj.getSELECTEDJSONData();

        if (selectedData.length === 0) {
            throw '행을 선택해주세요.';
        }

        // 1. 검증
        await validateDataPromise(selectedData);

        // 2. 저장
        const message = await saveDataPromise(selectedData);

        // 3. 재조회
        await reloadDataPromise(message);

        // 4. 완료
        unidocuAlert(message);

    } catch (error) {
        unidocuAlert(error);
    }
}```
**개선 효과:**

- ✅ 동기 코드처럼 읽힘
- ✅ try-catch로 에러 처리 간단
- ✅ 디버깅 쉬움
- ✅ 유지보수 쉬움

## 비교 요약 ​

### Before: 콜백 지옥 (15줄, 5단계 중첩) ​

javascript```
// ❌ 콜백 지옥
function saveData() {
    step1(() => {
        step2(() => {
            step3(() => {
                step4(() => {
                    step5(() => {
                        // 완료
                    });
                });
            });
        });
    });
}```
### After: async/await (7줄, 중첩 없음) ​

javascript```
// ✅ async/await
async function saveData() {
    await step1();
    await step2();
    await step3();
    await step4();
    await step5();
}```
## 실전 리팩토링 예제 ​

### Before: 복잡한 콜백 체인 ​

javascript```
// ❌ Before - 콜백 지옥
function processDocument() {
    const gridObj = $u.gridWrapper.getGrid();
    const selectedData = gridObj.getSELECTEDJSONData();

    if (selectedData.length === 0) {
        throw '문서를 선택해주세요.';
    }

    // 단계 1: 문서 잠금
    $nst.it_data_returnMessage('LOCK_DOCUMENT', selectedData, (lockResult) => {
        if (!lockResult.success) {
            unidocuAlert('문서를 잠글 수 없습니다.');
            return;
        }

        // 단계 2: 승인 요청
        $nst.it_data_returnMessage('REQUEST_APPROVAL', selectedData, (approvalResult) => {
            // 단계 3: 이메일 발송
            $nst.it_data_returnMessage('SEND_EMAIL', { TO: approvalResult.approver }, (emailResult) => {
                // 단계 4: 로그 기록
                $nst.it_data_returnMessage('LOG_ACTION', { ACTION: 'APPROVAL_REQUEST' }, (logResult) => {
                    // 단계 5: 화면 새로고침
                    $u.buttons.triggerFormTableButtonClick(() => {
                        unidocuAlert('승인 요청이 완료되었습니다.');
                    });
                });
            });
        });
    });
}```
### After: async/await ​

javascript```
// ✅ After - async/await
async function processDocument() {
    try {
        const gridObj = $u.gridWrapper.getGrid();
        const selectedData = gridObj.getSELECTEDJSONData();

        if (selectedData.length === 0) {
            throw '문서를 선택해주세요.';
        }

        // 단계 1: 문서 잠금
        const lockResult = await lockDocument(selectedData);
        if (!lockResult.success) {
            unidocuAlert('문서를 잠글 수 없습니다.');
            return;
        }

        // 단계 2: 승인 요청
        const approvalResult = await requestApproval(selectedData);

        // 단계 3: 이메일 발송
        await sendEmail({ TO: approvalResult.approver });

        // 단계 4: 로그 기록
        await logAction({ ACTION: 'APPROVAL_REQUEST' });

        // 단계 5: 화면 새로고침
        await refreshScreen();

        unidocuAlert('승인 요청이 완료되었습니다.');

    } catch (error) {
        console.error('처리 중 오류:', error);
        unidocuAlert('처리 중 오류가 발생했습니다.');
    }
}

// Promise 래퍼 함수들
function lockDocument(data) {
    return new Promise((resolve) => {
        $nst.it_data_returnMessage('LOCK_DOCUMENT', data, resolve);
    });
}

function requestApproval(data) {
    return new Promise((resolve) => {
        $nst.it_data_returnMessage('REQUEST_APPROVAL', data, resolve);
    });
}

function sendEmail(params) {
    return new Promise((resolve) => {
        $nst.it_data_returnMessage('SEND_EMAIL', params, resolve);
    });
}

function logAction(params) {
    return new Promise((resolve) => {
        $nst.it_data_returnMessage('LOG_ACTION', params, resolve);
    });
}

function refreshScreen() {
    return new Promise((resolve) => {
        $u.buttons.triggerFormTableButtonClick(resolve);
    });
}```
**개선 효과:**

- 코드 길이: 35줄 → 45줄 (래퍼 포함)
- 중첩 깊이: 5단계 → 0단계
- 가독성: ⭐⭐ → ⭐⭐⭐⭐⭐
- 유지보수성: ⭐⭐ → ⭐⭐⭐⭐⭐

## 콜백 지옥 자가 진단 ​

다음 중 3개 이상 해당하면 콜백 지옥입니다:

- [ ] 들여쓰기가 4단계 이상
- [ ] 코드가 오른쪽으로 치우쳐 있음
- [ ] 중괄호 `}`가 연속으로 4개 이상
- [ ] 에러 처리가 각 콜백마다 중복
- [ ] 변수 스코프 때문에 let/var를 바깥에 선언
- [ ] 코드를 읽을 때 눈이 위아래로 왔다갔다

## 주의사항 ​

개발자는 다음 사항에 유의해야 합니다:

- 콜백 자체가 나쁜 것은 아닙니다 (단순한 경우는 OK)
- 중첩이 3단계 이상이면 리팩토링 고려
- Promise 래퍼 함수를 만들 때 에러 처리 잊지 말기
- async/await을 사용할 때 try-catch 필수

## 참고 자료 ​

- Callback Hell 사이트
- MDN - async/await