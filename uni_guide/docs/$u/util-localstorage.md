# $u.util.localStorage ​

로컬 스토리지 관리 유틸리티

## 개요 ​

`$u.util.localStorage`는 브라우저의 localStorage를 편리하게 사용할 수 있도록 래핑한 네임스페이스. JSON 자동 직렬화/역직렬화, 그리드 커스텀 레이아웃 저장 등의 기능을 제공.

## 주요 메서드 ​

### 기본 저장소 관리 ​

#### `$u.util.localStorage.set(key, value)` ​

로컬 스토리지에 데이터를 저장. 객체는 자동으로 JSON으로 변환됩니다.

| 파라미터 | 타입 | 설명 |
| key | string | 저장할 키 |
| value | any | 저장할 값 |
javascript```
// 문자열 저장
$u.util.localStorage.set('userName', '홍길동');

// 객체 저장 (자동 JSON 직렬화)
$u.util.localStorage.set('userSettings', {
  theme: 'dark',
  language: 'ko',
  notifications: true
});

// 배열 저장
$u.util.localStorage.set('favoriteItems', ['item1', 'item2', 'item3']);```
#### `$u.util.localStorage.get(key)` ​

로컬 스토리지에서 데이터를 가져옵니다. JSON은 자동으로 객체로 변환됩니다.

| 파라미터 | 타입 | 설명 |
| key | string | 가져올 키 |
**반환값**: `any` - 저장된 값 (없으면 `null`)

javascript```
// 문자열 가져오기
const userName = $u.util.localStorage.get('userName');
console.log(userName); // "홍길동"

// 객체 가져오기 (자동 JSON 역직렬화)
const settings = $u.util.localStorage.get('userSettings');
console.log(settings.theme); // "dark"

// 배열 가져오기
const favorites = $u.util.localStorage.get('favoriteItems');
console.log(favorites); // ['item1', 'item2', 'item3']

// 없는 키
const notExist = $u.util.localStorage.get('notExist');
console.log(notExist); // null```
#### `$u.util.localStorage.clear(key)` ​

특정 키의 데이터를 삭제.

| 파라미터 | 타입 | 설명 |
| key | string | 삭제할 키 |
javascript```
$u.util.localStorage.clear('userName');```
#### `$u.util.localStorage.clearAll()` ​

로컬 스토리지의 모든 데이터를 삭제.

javascript```
// 주의: 모든 데이터가 삭제됩니다
$u.util.localStorage.clearAll();```
### 그리드 커스텀 레이아웃 관리 ​

#### `$u.util.localStorage.getGridUserCustomLayout(key)` ​

그리드 사용자 커스텀 레이아웃을 가져옵니다.

| 파라미터 | 타입 | 설명 |
| key (선택) | string | 레이아웃 키 (생략 시 전체 레이아웃 객체 반환) |
**반환값**: `object` - 커스텀 레이아웃 객체

javascript```
// 특정 그리드 레이아웃 가져오기
const layout = $u.util.localStorage.getGridUserCustomLayout('grid-main');
console.log(layout);
// {
//   columnWidths: { MATNR: 120, MAKTX: 200 },
//   columnOrder: ['MATNR', 'MAKTX', 'MEINS'],
//   hiddenColumns: ['COLUMN1']
// }

// 전체 레이아웃 가져오기
const allLayouts = $u.util.localStorage.getGridUserCustomLayout();
console.log(allLayouts);
// {
//   'grid-main': { /* ... */ },
//   'grid-detail': { /* ... */ }
// }```
#### `$u.util.localStorage.setGridUserCustomLayout(key, customLayout)` ​

그리드 사용자 커스텀 레이아웃을 저장.

| 파라미터 | 타입 | 설명 |
| key | string | 레이아웃 키 |
| customLayout | object | 저장할 레이아웃 객체 |
javascript```
// 그리드 레이아웃 저장
$u.util.localStorage.setGridUserCustomLayout('grid-main', {
  columnWidths: {
    MATNR: 120,
    MAKTX: 200,
    MEINS: 80
  },
  columnOrder: ['MATNR', 'MAKTX', 'MEINS'],
  hiddenColumns: []
});```
## 💡 실전 예제 ​

### 사용자 설정 저장 ​

javascript```
// 페이지 설정 저장
function saveUserSettings() {
  const settings = {
    showAdvancedSearch: $('#advancedSearch').is(':checked'),
    defaultRowCount: $('#rowCount').val(),
    autoRefresh: $('#autoRefresh').is(':checked'),
    refreshInterval: $('#refreshInterval').val()
  };

  $u.util.localStorage.set('pageSettings_' + $u.page.getPROGRAM_ID(), settings);
  unidocuAlert('설정이 저장되었습니다.');
}

// 페이지 로드 시 설정 복원
function loadUserSettings() {
  const settings = $u.util.localStorage.get('pageSettings_' + $u.page.getPROGRAM_ID());

  if (settings) {
    $('#advancedSearch').prop('checked', settings.showAdvancedSearch);
    $('#rowCount').val(settings.defaultRowCount);
    $('#autoRefresh').prop('checked', settings.autoRefresh);
    $('#refreshInterval').val(settings.refreshInterval);
  }
}```
### 최근 검색 기록 저장 ​

javascript```
// 최근 검색어 저장
function saveSearchHistory(searchText) {
  const maxHistory = 10;
  let history = $u.util.localStorage.get('searchHistory') || [];

  // 중복 제거
  history = history.filter(item => item !== searchText);

  // 최신 검색어를 맨 앞에 추가
  history.unshift(searchText);

  // 최대 개수 제한
  if (history.length > maxHistory) {
    history = history.slice(0, maxHistory);
  }

  $u.util.localStorage.set('searchHistory', history);
}

// 최근 검색어 표시
function showSearchHistory() {
  const history = $u.util.localStorage.get('searchHistory') || [];
  const $list = $('#searchHistoryList').empty();

  $.each(history, function(index, searchText) {
    const $item = $('- 
')
      .text(searchText)
      .click(function() {
        $('#searchInput').val(searchText);
        performSearch(searchText);
      });

    $list.append($item);
  });
}```
### 그리드 컬럼 설정 저장/복원 ​

javascript```
// 그리드 컬럼 폭 변경 시 자동 저장
const gridObj = $u.gridWrapper.getGrid();

gridObj._rg.onColumnWidthChanged(function(grid, column) {
  const layout = $u.util.localStorage.getGridUserCustomLayout('grid-main') || {};

  if (!layout.columnWidths) {
    layout.columnWidths = {};
  }

  layout.columnWidths[column.name] = column.width;

  $u.util.localStorage.setGridUserCustomLayout('grid-main', layout);
});

// 페이지 로드 시 컬럼 폭 복원
function restoreGridLayout() {
  const layout = $u.util.localStorage.getGridUserCustomLayout('grid-main');

  if (layout && layout.columnWidths) {
    $.each(layout.columnWidths, function(columnName, width) {
      gridObj._rg.setColumnWidth(columnName, width);
    });
  }
}```
### 임시 데이터 저장 (초안 저장) ​

javascript```
// 폼 데이터 임시 저장
$('#saveDraftButton').click(function() {
  const draftData = $u.getValues('form-table1');
  const draftKey = 'draft_' + $u.page.getPROGRAM_ID();

  $u.util.localStorage.set(draftKey, {
    data: draftData,
    savedAt: new Date().toISOString()
  });

  unidocuAlert('임시 저장되었습니다.');
});

// 페이지 로드 시 임시 데이터 복원
$(document).ready(function() {
  const draftKey = 'draft_' + $u.page.getPROGRAM_ID();
  const draft = $u.util.localStorage.get(draftKey);

  if (draft) {
    const savedDate = new Date(draft.savedAt);
    const message = '임시 저장된 데이터가 있습니다.\n' +
                    '저장 시각: ' + savedDate.toLocaleString() + '\n' +
                    '복원하시겠습니까?';

    unidocuConfirm(message, function() {
      $u.setValues('form-table1', draft.data);
      unidocuAlert('임시 저장 데이터를 복원했습니다.');
    });
  }
});

// 정상 저장 시 임시 데이터 삭제
$('#saveButton').click(function() {
  // ... 저장 로직 ...

  // 저장 성공 후 임시 데이터 삭제
  const draftKey = 'draft_' + $u.page.getPROGRAM_ID();
  $u.util.localStorage.clear(draftKey);
});```
### 즐겨찾기 관리 ​

javascript```
// 즐겨찾기 추가
function addToFavorites(item) {
  const favorites = $u.util.localStorage.get('favoriteItems') || [];

  // 중복 체크
  const exists = favorites.some(fav => fav.id === item.id);

  if (exists) {
    unidocuAlert('이미 즐겨찾기에 추가된 항목.');
    return;
  }

  favorites.push({
    id: item.id,
    name: item.name,
    addedAt: new Date().toISOString()
  });

  $u.util.localStorage.set('favoriteItems', favorites);
  unidocuAlert('즐겨찾기에 추가되었습니다.');
  refreshFavoritesList();
}

// 즐겨찾기 제거
function removeFromFavorites(itemId) {
  let favorites = $u.util.localStorage.get('favoriteItems') || [];

  favorites = favorites.filter(fav => fav.id !== itemId);

  $u.util.localStorage.set('favoriteItems', favorites);
  unidocuAlert('즐겨찾기에서 제거되었습니다.');
  refreshFavoritesList();
}

// 즐겨찾기 목록 표시
function refreshFavoritesList() {
  const favorites = $u.util.localStorage.get('favoriteItems') || [];
  const $list = $('#favoritesList').empty();

  if (favorites.length === 0) {
    $list.append('- 즐겨찾기가 없습니다.
');
    return;
  }

  $.each(favorites, function(index, item) {
    const $item = $('- 
')
      .text(item.name)
      .append(
        $('삭제').click(function() {
          removeFromFavorites(item.id);
        })
      );

    $list.append($item);
  });
}```
### 스토리지 용량 체크 ​

javascript```
// 로컬 스토리지 사용량 확인
function checkStorageUsage() {
  let totalSize = 0;
  const items = {};

  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const size = localStorage[key].length;
      totalSize += size;
      items[key] = size;
    }
  }

  console.log('총 사용량:', totalSize, 'bytes');
  console.log('항목별 사용량:', items);

  // 5MB 이상 사용 시 경고
  if (totalSize > 5 * 1024 * 1024) {
    unidocuAlert('로컬 스토리지 사용량이 5MB를 초과했습니다.\n불필요한 데이터를 삭제하세요.');
  }
}```
### 데이터 유효기간 관리 ​

javascript```
// 유효기간이 있는 데이터 저장
function setWithExpiry(key, value, expiryMinutes) {
  const now = new Date();
  const item = {
    value: value,
    expiry: now.getTime() + (expiryMinutes * 60 * 1000)
  };

  $u.util.localStorage.set(key, item);
}

// 유효기간 체크하며 데이터 가져오기
function getWithExpiry(key) {
  const item = $u.util.localStorage.get(key);

  if (!item) {
    return null;
  }

  const now = new Date();

  // 만료된 경우
  if (now.getTime() > item.expiry) {
    $u.util.localStorage.clear(key);
    return null;
  }

  return item.value;
}

// 사용 예
setWithExpiry('tempToken', 'ABC123', 30); // 30분 유효

// 30분 후 자동 삭제됨
const token = getWithExpiry('tempToken');```
## ⚠️ 주의사항 ​

- 로컬 스토리지는 브라우저별로 약 5~10MB의 용량 제한이 있습니다
- 로컬 스토리지는 도메인별로 분리되어 저장됩니다
- 민감한 정보(비밀번호, 개인정보 등)는 저장하지 않아야 합니다
- 브라우저의 시크릿 모드에서는 로컬 스토리지가 제한될 수 있습니다
- 사용자가 브라우저 캐시를 삭제하면 로컬 스토리지도 삭제됩니다
- 객체와 배열은 자동으로 JSON으로 직렬화됩니다
- `null`과 `undefined`는 다르게 처리되므로 주의가 필요합니다