(function () {
  function waitForU(callback) {
    if (window.$u) {
      callback()
    } else {
      const timer = setInterval(() => {
        if (window.$u) { clearInterval(timer); callback() }
      }, 100)
    }
  }

  function emit(event) {
    window.postMessage({ __UNI_EV__: true, event }, '*')
  }

  function emitFire(event) {
    window.postMessage({ __UNI_EV__: true, event: { ...event, fired: true } }, '*')
  }

  function getFnName(fn) {
    return (fn && fn.name && fn.name !== '') ? fn.name : 'anonymous'
  }

  function hookU() {
    const $u = window.$u
    window.__UNI_FN_MAP__  = window.__UNI_FN_MAP__  || {}
    window.__UNI_DISABLED__ = window.__UNI_DISABLED__ || new Set()
    window.__UNI_ORIG__     = window.__UNI_ORIG__     || {}

    // RealGrid/jQuery 등 대형 객체를 걸러내는 안전 직렬화
    function safeSerializeArgs(args) {
      return Array.from(args).slice(0, 6).map(function (arg) {
        if (arg === null || arg === undefined) return String(arg)
        var t = typeof arg
        if (t === 'number' || t === 'boolean') return arg
        if (t === 'string') return arg.length > 100 ? arg.slice(0, 100) + '…' : arg
        if (t === 'function') return '[Function]'
        if (t === 'object') {
          if (typeof arg.getDataSource === 'function' || typeof arg.getItemCount === 'function') return '[GridInstance]'
          if (arg.jquery) return '[jQuery(' + arg.length + ')]'
          if (arg.nodeType) return '[' + (arg.tagName || 'Node') + ']'
          if (arg.type && arg.target) return '[Event:' + arg.type + ']'
          try {
            var safe = {}
            Object.keys(arg).slice(0, 8).forEach(function (k) {
              var v = arg[k]
              if (v === null || v === undefined || typeof v === 'number' || typeof v === 'boolean') safe[k] = v
              else if (typeof v === 'string') safe[k] = v.length > 50 ? v.slice(0, 50) + '…' : v
              else if (typeof v === 'function') safe[k] = '[fn]'
              else safe[k] = '[' + typeof v + ']'
            })
            return safe
          } catch (e) { return '[Object]' }
        }
        return String(arg)
      })
    }
    window.__UNI_SAFE_ARGS__ = safeSerializeArgs

    function getProgramId() {
      try { return $u.page?.getPROGRAM_ID?.() || '' } catch (e) { return '' }
    }

    // $u.addHandler 후킹 (동적 등록만 잡힘)
    if ($u.addHandler) {
      const _orig = $u.addHandler.bind($u)
      $u.addHandler = function (id, fn) {
        const resolvedId = (typeof id === 'string' || typeof id === 'number') ? String(id)
          : (id && (id.id || id.name || id.btnId)) || JSON.stringify(id)
        const resolvedFn = typeof id === 'function' ? id : fn
        emit({ type: 'HDL', id: resolvedId, fnName: getFnName(resolvedFn), time: new Date().toLocaleTimeString(), programId: getProgramId() })
        return _orig(id, fn)
      }
    }

    // $u.buttons.addCustomHandler 후킹 (동적 등록만 잡힘)
    if ($u.buttons && $u.buttons.addCustomHandler) {
      const _orig = $u.buttons.addCustomHandler.bind($u.buttons)
      $u.buttons.addCustomHandler = function (id, fn) {
        const resolvedId = (typeof id === 'string' || typeof id === 'number') ? String(id)
          : (id && (id.id || id.name || id.btnId)) || JSON.stringify(id)
        const resolvedFn = typeof id === 'function' ? id : fn
        emit({ type: 'BTN', id: resolvedId, fnName: getFnName(resolvedFn), time: new Date().toLocaleTimeString(), programId: getProgramId() })
        return _orig(id, fn)
      }
    }

    // $u.get() 래핑 → $el 이벤트 등록 + 실행 모두 추적
    // $u.get(fieldId) / $u.get(tableId, fieldName) 오버로딩 모두 지원
    if ($u.get) {
      const _origGet = $u.get.bind($u)
      $u.get = function (fieldId, fieldName) {
        const result = _origGet.apply($u, arguments)
        const id = fieldName ? `${fieldId}/${fieldName}` : String(fieldId)
        if (result && result.$el && !result.__uni_hooked__) {
          result.__uni_hooked__ = true
          const elProxy = new Proxy(result.$el, {
            get(target, prop) {
              const jqEvents = ['change', 'click', 'keyup', 'keydown', 'blur', 'focus']
              if (jqEvents.includes(prop)) {
                return function (fn) {
                  if (typeof fn === 'function') {
                    const fnName = getFnName(fn)
                    const fnKey = `FLD:${id}:${prop}:${Date.now()}`
                    window.__UNI_FN_MAP__[fnKey] = fn
                    emit({ type: 'FLD', id, fnName, event: prop, time: new Date().toLocaleTimeString(), fnKey, programId: getProgramId() })
                    const trackedFn = function () {
                      if (window.__UNI_DISABLED__.has(fnKey)) return
                      const markName = `uni:FLD:${id}:${prop}`
                      performance.mark(markName + ':start')
                      const t0 = performance.now()
                      const ret = fn.apply(this, arguments)
                      const duration = Math.round(performance.now() - t0)
                      performance.mark(markName + ':end')
                      try { performance.measure(markName, markName + ':start', markName + ':end') } catch (_) {}
                      emitFire({ type: 'FLD', id, fnName, event: prop, fnKey, time: new Date().toLocaleTimeString(), programId: getProgramId(), duration, ts: Date.now(), args: safeSerializeArgs(arguments) })
                      return ret
                    }
                    return target[prop].call(target, trackedFn)
                  }
                  return target[prop].apply(target, arguments)
                }
              }
              const val = target[prop]
              return typeof val === 'function' ? val.bind(target) : val
            }
          })
          result.$el = elProxy
        }
        return result
      }
    }

    // ── 그리드 후킹 ────────────────────────────────────
    function hookGrid(gridObj) {
      if (!gridObj || gridObj.__uni_grid_hooked__) return
      gridObj.__uni_grid_hooked__ = true
      const gridId = gridObj.id || '(unknown)'

      function wrapGridEvent(obj, methodName) {
        if (typeof obj[methodName] !== 'function') return
        const _orig = obj[methodName].bind(obj)
        obj[methodName] = function (fn) {
          if (typeof fn !== 'function') return _orig(fn)
          const fnKey = `GRD:${gridId}:${methodName}:${Date.now()}`
          window.__UNI_FN_MAP__[fnKey] = fn
          emit({ type: 'GRD', id: gridId, event: methodName, fnName: getFnName(fn), time: new Date().toLocaleTimeString(), programId: getProgramId(), fnKey })
          return _orig(function () {
            if (window.__UNI_DISABLED__.has(fnKey)) return
            const markName = `uni:GRD:${gridId}:${methodName}`
            performance.mark(markName + ':start')
            const t0 = performance.now()
            const ret = fn.apply(this, arguments)
            const duration = Math.round(performance.now() - t0)
            performance.mark(markName + ':end')
            try { performance.measure(markName, markName + ':start', markName + ':end') } catch (_) {}
            emitFire({ type: 'GRD', id: gridId, event: methodName, fnName: getFnName(fn), time: new Date().toLocaleTimeString(), programId: getProgramId(), duration, ts: Date.now(), fnKey, args: safeSerializeArgs(arguments) })
            return ret
          })
        }
      }

      const directEvents = [
        'onHeaderClick', 'onCellClick', 'onChangeCell', 'onBlockPaste',
        'onRowScroll', 'onBeforeShowUserContextMenu', 'onChangeHeaderCheckBox',
        'onRowActivate', 'onCellDblClick', 'onChangeRow', 'onTreeNodeClick', 'onShowTooltip'
      ]
      directEvents.forEach(name => wrapGridEvent(gridObj, name))

      if (gridObj._rg) {
        const rgEvents = [
          'onColumnHeaderClicked', 'onCellClicked', 'onCellDblClicked',
          'onEditRowPasted', 'onRowsPasted', 'onCurrentChanged', 'onEditRowChanged',
          'onItemChecked', 'onItemAllChecked', 'onColumnCheckedChanged',
          'onTreeItemExpanding', 'onContextMenuItemClicked', 'onTopIndexChanged',
          'onCurrentRowChanged', 'onGetEditValue', 'onInnerDragStart', 'onInnerDrop',
          'onRowCountChanged'
        ]
        rgEvents.forEach(name => wrapGridEvent(gridObj._rg, name))
      }
    }

    function hookGridWrapper() {
      if (!$u.gridWrapper || typeof $u.gridWrapper.getGridObjMap !== 'function') {
        setTimeout(hookGridWrapper, 100)
        return
      }
      const gridMap = $u.gridWrapper.getGridObjMap()
      Object.keys(gridMap).forEach(id => hookGrid(gridMap[id]))

      const _origGetGrid = $u.gridWrapper.getGrid.bind($u.gridWrapper)
      $u.gridWrapper.getGrid = function (id) {
        const gridObj = _origGetGrid(id)
        hookGrid(gridObj)
        return gridObj
      }
    }
    hookGridWrapper()

    // ── $nst 호출 후킹 ────────────────────────────────────
    // 모든 $nst 메서드는 내부적으로 is_data_tableParams_nsReturn 하나를 호출
    // → 이 함수 하나만 후킹하면 전체 $nst 호출을 캡처 가능
    function safeNstObj(obj) {
      if (obj === null || obj === undefined) return null
      if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj
      if (Array.isArray(obj)) {
        return {
          _arr: obj.length,
          preview: obj.slice(0, 5).map(function(row) {
            try {
              var s = {}
              Object.keys(row).slice(0, 12).forEach(function(k) {
                var v = row[k]
                s[k] = (v === null || v === undefined || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') ? v : '[object]'
              })
              return s
            } catch(e) { return {} }
          })
        }
      }
      if (typeof obj === 'object') {
        try {
          var s = {}
          Object.keys(obj).slice(0, 20).forEach(function(k) {
            var v = obj[k]
            if (v === null || v === undefined || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') s[k] = v
            else if (Array.isArray(v)) s[k] = safeNstObj(v)
            else if (typeof v !== 'function') s[k] = '[object]'
          })
          return s
        } catch(e) { return {} }
      }
      return String(obj)
    }

    function extractNsReturn(rw) {
      if (!rw) return null
      var r = {}
      try { r.returnMessage = typeof rw.getReturnMessage === 'function' ? rw.getReturnMessage() : null } catch(e) {}
      try { r.tableReturns  = safeNstObj(typeof rw.getTableReturns  === 'function' ? rw.getTableReturns()  : null) } catch(e) {}
      try { r.exportMaps    = safeNstObj(typeof rw.getExportMaps    === 'function' ? rw.getExportMaps()    : null) } catch(e) {}
      try { r.stringReturns = safeNstObj(typeof rw.getStringReturns === 'function' ? rw.getStringReturns() : null) } catch(e) {}
      return r
    }

    function applyNstHook(nst) {
      if (!nst || typeof nst.is_data_tableParams_nsReturn !== 'function') return
      if (nst.__uni_nst_hooked__) return  // 이미 후킹된 객체는 스킵
      nst.__uni_nst_hooked__ = true

      // 어떤 래퍼 메서드를 통해 들어왔는지 추적
      var _callerMethod = null
      var WRAPPERS = [
        'is_data_ot_data', 'it_data_nsReturn', 'is_data_nsReturn',
        'is_data_it_data_nsReturn', 'is_data_returnMessage',
        'tableParams_nsReturn', 'is_data_tableReturns', 'is_data_os_data',
        'is_data_stringReturns', 'is_data_it_data_returnMessage',
        'is_data_tableParams_os_docno'
      ]
      WRAPPERS.forEach(function(method) {
        if (typeof nst[method] !== 'function') return
        var _origW = nst[method].bind(nst)
        nst[method] = function() {
          var prev = _callerMethod
          _callerMethod = method
          try { return _origW.apply(this, arguments) }
          finally { _callerMethod = prev }
        }
      })

      var _orig = nst.is_data_tableParams_nsReturn.bind(nst)
      nst.is_data_tableParams_nsReturn = function(namedServiceId, is_data, tableParams, callback, errorCallback) {
        var calledVia = _callerMethod || 'direct'
        var callId = Date.now() + '_' + Math.random().toString(36).slice(2, 6)
        var t0 = performance.now()

        window.postMessage({ __UNI_NST__: true, data: {
          callId,
          serviceId:   namedServiceId,
          method:      calledVia,
          is_data:     safeNstObj(is_data),
          tableParams: safeNstObj(tableParams),
          programId:   getProgramId(),
          time:        new Date().toLocaleTimeString(),
          ts:          Date.now(),
          status:      'pending'
        }}, '*')

        if (!callback) {
          var result = _orig(namedServiceId, is_data, tableParams, callback, errorCallback)
          window.postMessage({ __UNI_NST__: true, data: {
            callId, serviceId: namedServiceId, method: calledVia,
            duration: Math.round(performance.now() - t0),
            status: 'done',
            response: extractNsReturn(result),
            time: new Date().toLocaleTimeString()
          }}, '*')
          return result
        }

        return _orig(namedServiceId, is_data, tableParams, function(resultWrapper) {
          window.postMessage({ __UNI_NST__: true, data: {
            callId, serviceId: namedServiceId, method: calledVia,
            duration: Math.round(performance.now() - t0),
            status: 'done',
            response: extractNsReturn(resultWrapper),
            time: new Date().toLocaleTimeString()
          }}, '*')
          callback(resultWrapper)
        }, errorCallback)
      }

      console.log('[UNI Event Viewer] $nst 후킹 완료')
    }

    function hookNst() {
      // window.$nst 자체에 setter 등록 → 화면 전환 시 재할당돼도 자동 재후킹
      var _nstVal = window.$nst
      try {
        Object.defineProperty(window, '$nst', {
          configurable: true,
          get: function() { return _nstVal },
          set: function(val) {
            _nstVal = val
            setTimeout(function() { applyNstHook(_nstVal) }, 0)
          }
        })
      } catch(e) {}

      // 현재 값이 이미 있으면 즉시 후킹
      if (_nstVal && typeof _nstVal.is_data_tableParams_nsReturn === 'function') {
        applyNstHook(_nstVal)
      } else {
        // 아직 없으면 폴링으로 대기
        var t = setInterval(function() {
          if (window.$nst && typeof window.$nst.is_data_tableParams_nsReturn === 'function') {
            clearInterval(t)
            applyNstHook(window.$nst)
          }
        }, 200)
      }
    }
    hookNst()

    console.log('[UNI Event Viewer] 후킹 완료')
  }

  // 화면 컨텍스트 수집 요청 처리
  window.addEventListener('message', function(e) {
    if (e.source !== window || !e.data?.__UNI_CTX_REQ__) return
    var context = { fields: {}, grids: {} }
    try {
      if (window.$u && typeof window.$u.getValues === 'function') {
        context.fields = window.$u.getValues() || {}
      }
    } catch (_) {}
    try {
      if (window.$u && window.$u.gridWrapper && typeof window.$u.gridWrapper.getGridObjMap === 'function') {
        var gridMap = window.$u.gridWrapper.getGridObjMap()
        Object.keys(gridMap).forEach(function(gridId) {
          var gridObj = gridMap[gridId]
          try {
            if (typeof gridObj.getGridHeaders === 'function') {
              context.grids[gridId] = gridObj.getGridHeaders()
            }
          } catch (_) {}
        })
      }
    } catch (_) {}
    window.postMessage({ __UNI_CTX__: true, context }, '*')
  })

  waitForU(hookU)
})()
