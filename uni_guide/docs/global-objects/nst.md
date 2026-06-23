# $nst - Named Service Template ​

SAP RFC 함수 호출을 위한 Named Service Template 객체

## 개요 ​

`$nst`는 UniWORKS에서 SAP RFC 함수를 호출하기 위한 전역 객체. Named Service Template을 통해 서버와 데이터를 주고받으며, 동기/비동기 호출, 다양한 파라미터 형식을 지원.

## Named Service란? ​

Named Service는 SAP RFC 함수를 UniWORKS에서 사용하기 위한 래퍼(Wrapper)입니다. RFC 함수의 Import/Export 파라미터와 Table 파라미터를 쉽게 사용할 수 있도록 추상화.

### RFC 파라미터 매핑 ​

- IS_DATA → Import Structure (입력 단일 구조체)
- IT_DATA → Import Table (입력 테이블)
- OS_DATA → Export Structure (출력 단일 구조체)
- OT_DATA → Export Table (출력 테이블)

## 주요 메서드 ​

### 기본 호출 ​

#### `$nst.is_data_nsReturn(namedServiceId, is_data, callback, errorCallback)` ​

Import Structure로 데이터를 전달하고 전체 결과를 반환받습니다.

| 파라미터 | 타입 | 설명 |
| namedServiceId | string | Named Service ID (RFC 함수명) |
| is_data | object | Import 데이터 |
| callback (선택) | function | 성공 콜백 (생략 시 동기 호출) |
| errorCallback (선택) | function | 실패 콜백 |
**반환값** (동기 호출 시)

- (NSReturn) - 결과 래퍼 객체

javascript```
// 비동기 호출
$nst.is_data_nsReturn('GET_USER_INFO', { USER_ID: 'USER01' }, function(nsReturn) {
  console.log(nsReturn.getReturnMessage());
  console.log(nsReturn.getStringReturns());
  console.log(nsReturn.getTableReturns());
});

// 동기 호출
const nsReturn = $nst.is_data_nsReturn('GET_USER_INFO', { USER_ID: 'USER01' });
console.log(nsReturn.getReturnMessage());```
### 테이블 데이터 조회 ​

#### `$nst.is_data_ot_data(namedServiceId, is_data, callback, errorCallback)` ​

가장 많이 사용되는 메서드로, OT_DATA 테이블을 직접 반환.

| 파라미터 | 타입 | 설명 |
| namedServiceId | string | Named Service ID |
| is_data | object | 검색 조건 |
| callback (선택) | function | 성공 콜백 |
| errorCallback (선택) | function | 실패 콜백 |
**반환값** (동기 호출 시)

- (Array) - OT_DATA 배열

javascript```
// 비동기 조회
$nst.is_data_ot_data('SEARCH_MATERIALS', {
  MATNR: '',
  WERKS: '1000'
}, function(ot_data) {
  const gridObj = $u.gridWrapper.getGrid();
  gridObj.setJSONData(ot_data);
});

// 동기 조회
const materials = $nst.is_data_ot_data('SEARCH_MATERIALS', {
  MATNR: '',
  WERKS: '1000'
});
console.log(materials);```
#### `$nst.is_data_os_data(namedServiceId, is_data, callback)` ​

OS_DATA 구조체를 반환.

**반환값** (동기 호출 시)

- (Object) - OS_DATA 객체

javascript```
// 상세 정보 조회
$nst.is_data_os_data('GET_DOCUMENT_DETAIL', {
  DOCNO: '12345'
}, function(os_data) {
  $u.setValues('form-table1', os_data);
});

// 동기 조회
const detail = $nst.is_data_os_data('GET_DOCUMENT_DETAIL', {
  DOCNO: '12345'
});```
### 테이블 데이터 전송 ​

#### `$nst.it_data_nsReturn(namedServiceId, it_data, callback, errorCallback)` ​

IT_DATA 테이블을 전송.

| 파라미터 | 타입 | 설명 |
| namedServiceId | string | Named Service ID |
| it_data | Array | 전송할 데이터 배열 |
| callback (선택) | function | 성공 콜백 |
| errorCallback (선택) | function | 실패 콜백 |
javascript```
// 그리드 데이터 저장
const gridObj = $u.gridWrapper.getGrid();
const gridData = gridObj.getCRUDJSONData();

$nst.it_data_nsReturn('SAVE_MATERIALS', gridData, function(nsReturn) {
  unidocuAlert(nsReturn.getReturnMessage());
});```
#### `$nst.is_data_it_data_nsReturn(namedServiceId, is_data, it_data, callback, errorCallback)` ​

IS_DATA와 IT_DATA를 함께 전송.

javascript```
$nst.is_data_it_data_nsReturn('SAVE_ORDER',
  { ORDER_NO: '12345', ORDER_TYPE: 'PO' },
  gridObj.getCRUDJSONData(),
  function(nsReturn) {
    unidocuAlert(nsReturn.getReturnMessage());
  }
);```
### 문자열 반환값 조회 ​

#### `$nst.is_data_stringReturns(namedServiceId, is_data, callback)` ​

문자열 반환 파라미터들을 조회.

**반환값** (동기 호출 시)

- (Object) - 문자열 반환값 객체

javascript```
const stringReturns = $nst.is_data_stringReturns('CHECK_AUTHORITY', {
  PROGRAM_ID: 'UD_1001_010'
});

console.log(stringReturns.IS_EDITABLE); // 'X' 또는 ''
console.log(stringReturns.IS_DELETABLE); // 'X' 또는 ''```
### 메시지 반환 ​

#### `$nst.is_data_returnMessage(namedServiceId, is_data, callback)` ​

리턴 메시지만 받아서 Alert를 표시.

javascript```
$nst.is_data_returnMessage('DELETE_DOCUMENT', {
  DOCNO: '12345'
}, function(message) {
  unidocuAlert(message, function() {
    // 삭제 후 처리
    $u.buttons.triggerFormTableButtonClick();
  });
});```
## NSReturn 객체 ​

`NSReturn`은 RFC 호출 결과를 래핑한 객체.

## 메서드 ​

#### `getReturnMessage()` ​

리턴 메시지를 반환.

javascript```
const nsReturn = $nst.is_data_nsReturn('SOME_FUNCTION', {});
const message = nsReturn.getReturnMessage();
unidocuAlert(message);```
#### `getReturnType()` ​

리턴 타입을 반환. ('S': 성공, 'E': 에러, 'W': 경고)

javascript```
const returnType = nsReturn.getReturnType();
if (returnType === 'S') {
  console.log('성공');
} else if (returnType === 'E') {
  console.log('에러');
}```
#### `getStringReturns()` ​

모든 문자열 반환값을 객체로 반환.

javascript```
const stringReturns = nsReturn.getStringReturns();
console.log(stringReturns);
// { FIELD1: 'value1', FIELD2: 'value2' }```
#### `getStringReturn(fieldName)` ​

특정 문자열 반환값을 가져옵니다.

javascript```
const value = nsReturn.getStringReturn('RESULT_CODE');```
#### `getTableReturns()` ​

모든 테이블 반환값을 객체로 반환.

javascript```
const tableReturns = nsReturn.getTableReturns();
console.log(tableReturns);
// { OT_DATA: [...], OT_DATA2: [...] }```
#### `getTableReturn(tableName)` ​

특정 테이블 반환값을 가져옵니다.

javascript```
const otData = nsReturn.getTableReturn('OT_DATA');
gridObj.setJSONData(otData);```
#### `getExportMaps()` ​

모든 Export Structure를 반환.

javascript```
const exportMaps = nsReturn.getExportMaps();
console.log(exportMaps);```
#### `getExportMap(structureName)` ​

특정 Export Structure를 가져옵니다.

javascript```
const osData = nsReturn.getExportMap('OS_DATA');
$u.setValues('form-table1', osData);```
## 💡 실전 예제 ​

### 검색 기능 구현 ​

javascript```
$('#searchButton').click(function() {
  const searchConditions = $u.getValues('search-condition');

  $nst.is_data_ot_data('SEARCH_ORDERS', searchConditions, function(ot_data) {
    const gridObj = $u.gridWrapper.getGrid();
    gridObj.setJSONData(ot_data);

    // 건수 표시
    $('#resultCount').text(ot_data.length + '건');
  });
});```
### 저장 기능 구현 ​

javascript```
$('#saveButton').click(function() {
  const gridObj = $u.gridWrapper.getGrid();

  // 필수 입력 검증
  try {
    gridObj.asserts.requiredFilled(['MATNR', 'MENGE']);
  } catch (error) {
    unidocuAlert(error);
    return;
  }

  // CRUD 데이터 가져오기
  const crudData = gridObj.getCRUDJSONData();

  if (crudData.length === 0) {
    unidocuAlert('변경된 데이터가 없습니다.');
    return;
  }

  // 헤더 정보
  const headerData = $u.getValues('form-table1');

  // 저장
  $nst.is_data_it_data_nsReturn('SAVE_ORDER', headerData, crudData,
    function(nsReturn) {
      unidocuAlert(nsReturn.getReturnMessage(), function() {
        $u.pageReload();
      });
    }
  );
});```
### 삭제 기능 구현 ​

javascript```
$('#deleteButton').click(function() {
  const gridObj = $u.gridWrapper.getGrid();
  gridObj.asserts.selectedExactOneRow();

  const selectedRow = gridObj.getSELECTEDJSONData()[0];

  unidocuConfirm('삭제하시겠습니까?', function() {
    $nst.is_data_returnMessage('DELETE_ORDER', {
      ORDER_NO: selectedRow.ORDER_NO
    }, function(message) {
      unidocuAlert(message, function() {
        $u.buttons.triggerFormTableButtonClick();
      });
    });
  });
});```
### 권한 체크 ​

javascript```
function checkAuthority() {
  const stringReturns = $nst.is_data_stringReturns('CHECK_AUTHORITY', {
    PROGRAM_ID: $u.page.getPROGRAM_ID(),
    USER_ID: staticProperties.user.ID
  });

  // 편집 권한
  if (stringReturns.IS_EDITABLE !== 'X') {
    $u.setReadOnly('form-table1', true);
    $('#saveButton').hide();
  }

  // 삭제 권한
  if (stringReturns.IS_DELETABLE !== 'X') {
    $('#deleteButton').hide();
  }
}```
### 코드 콤보 데이터 조회 ​

javascript```
function loadComboData() {
  // 여러 코드를 한번에 조회
  const nsReturn = $nst.is_data_nsReturn('GET_CODE_LIST', {
    CODE_GROUP: 'MATERIAL_TYPE'
  });

  const otData = nsReturn.getTableReturn('OT_DATA');

  // 콤보박스에 데이터 설정
  const options = otData.map(function(item) {
    return {
      value: item.CODE,
      text: item.CODE + ' ' + item.TEXT
    };
  });

  $u.get('search-condition', 'MATERIAL_TYPE').setOptions(options);
}```
### 에러 처리 ​

javascript```
$nst.is_data_ot_data('SEARCH_DATA', searchConditions,
  function(ot_data) {
    // 성공 처리
    gridObj.setJSONData(ot_data);
  },
  function(error) {
    // 에러 처리
    console.error('조회 실패:', error);
    unidocuAlert('데이터 조회에 실패했습니다.');
  }
);```
## ⚠️ 주의사항 ​

- 동기 호출(`callback` 없이 호출)은 UI를 차단하므로 최소화해야 합니다
- Named Service ID는 SAP에 등록된 RFC 함수명과 일치해야 합니다
- IS_DATA, IT_DATA의 필드명은 RFC 파라미터명과 정확히 일치해야 합니다
- 대용량 데이터 조회 시 성능을 고려해야 합니다
- RFC 호출 결과는 캐시되므로, 같은 파라미터로 재호출 시 캐시된 값이 반환됩니다
- 에러가 발생하면 자동으로 Alert가 표시됩니다