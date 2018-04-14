import { createAction, handleActions } from 'redux-actions';
import { CALL_API } from 'redux-api-middleware';

import getApiPath from '../../../helpers/getApiPath';
import getFetchOptions from '../../../helpers/getFetchOptions';

// ------------------------------------
// Constants (Action Types)
// ------------------------------------

const _copyDataById = function (list, id) {
  for (let i = 0; i < list.length; i++) {
    const data = list[i]
    if (data.id === id) {
      return {
        ...data
      }
    }
  }
}

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */

// pending request
const FETCH_REQUEST = Symbol('FETCH_REQUEST');
const FETCH_FAILURE = Symbol('FETCH_FAILURE');

// savePending
const FETCH_SAVE_REQUEST = Symbol('FETCH_SAVE_REQUEST');
const FETCH_SAVE_FAILURE = Symbol('FETCH_SAVE_FAILURE');

// 获取报告列表
const FETCH_DATAVIEW_LIST_SUCCESS = Symbol('FETCH_DATAVIEW_LIST_SUCCESS');
// 获取报告搜索列表
const FETCH_SEARCH_LIST_SUCCESS = Symbol('FETCH_SEARCH_LIST_SUCCESS');
// 新增报告
const FETCH_ADD_DATAVIEW_ITEM_SUCCESS = Symbol('FETCH_ADD_DATAVIEW_ITEM_SUCCESS');
// 更新报告
const FETCH_UPDATE_DATAVIEW_ITEM_SUCCESS = Symbol('FETCH_UPDATE_DATAVIEW_ITEM_SUCCESS');
// 删除报告/文件夹
const FETCH_DELETE_DATAVIEW_ITEM_SUCCESS = Symbol('FETCH_DELETE_DATAVIEW_ITEM_SUCCESS');
// 移动报告文件 或 报告文件夹
const FETCH_MOVE_DATAVIEW_ITEM_SUCCESS = Symbol('FETCH_MOVE_DATAVIEW_ITEM_SUCCESS');
// 复制报告
const FETCH_COPY_DATAVIEW_ITEM_SUCCESS = Symbol('FETCH_COPY_DATAVIEW_ITEM_SUCCESS');
// 获取多屏列表
const FETCH_MULTI_SCREEN_LIST_SUCCESS = Symbol('FETCH_MULTI_SCREEN_LIST_SUCCESS');
// 删除多屏
const DELETE_MULTI_SCREEN_ITEM_SUCCESS = Symbol('DELETE_MULTI_SCREEN_ITEM_SUCCESS');
// 更新多屏
const UPDATE_MULTI_SCREEN_ITEM_SUCCESS = Symbol('UPDATE_MULTI_SCREEN_ITEM_SUCCESS');

// 缓存
const SAVE_DATAVIEW_LIST_LOCAL_DATA_SUCCESS = Symbol('SAVE_DATAVIEW_LIST_LOCAL_DATA_SUCCESS');

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

// 获取报告列表, 不更新redux
export const fetchDataviewListSilent = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: ['1', '2', '3']
    }
  }
}
// 获取报告列表
export const fetchDataviewList = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_DATAVIEW_LIST_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 获取报告搜索列表
export const fetchSearchList = (keyword, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/search', { name: keyword }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_SEARCH_LIST_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 新增报告文件 或 报告文件夹
export const fetchAddDataviewItem = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/add'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_SAVE_REQUEST,
        {
          type: FETCH_ADD_DATAVIEW_ITEM_SUCCESS,
          payload: (action, state, json) => ({
            id: json.data,
            sub: [],
            ...params
          })
        },
        FETCH_SAVE_FAILURE
      ]
    }
  }
}

// 更新报告文件 或 报告文件夹(重命名)
export const fetchUpdateDataviewItem = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/rename'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_SAVE_REQUEST,
        {
          type: FETCH_UPDATE_DATAVIEW_ITEM_SUCCESS,
          payload: () => params
        },
        FETCH_SAVE_FAILURE
      ]
    }
  }
}

// 设置报告为主页
export const fetchSetHomeDataview = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/set_default'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'SET_DATAVIEW_LIST_ITEM_HOME_REQUEST',
        {
          type: 'SET_DATAVIEW_LIST_ITEM_HOME_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'SET_DATAVIEW_LIST_ITEM_HOME_FAILURE'
      ]
    }
  }
}

// 删除报告文件 或 报告文件夹
export const fetchDeleteDataviewItem = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/delete'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_SAVE_REQUEST,
        {
          type: FETCH_DELETE_DATAVIEW_ITEM_SUCCESS,
          payload: () => params.id
        },
        FETCH_SAVE_FAILURE
      ]
    }
  }
}

// 移动报告文件 或 报告文件夹
export const fetchMoveDataviewItem = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/move'), 'POST', {
    body: JSON.stringify(params)
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_SAVE_REQUEST,
        {
          type: FETCH_MOVE_DATAVIEW_ITEM_SUCCESS,
          payload: () => params.dash_id
        },
        FETCH_SAVE_FAILURE
      ]
    }
  }
}

// 复制报告文件
export const fetchCopyDataviewItem = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/copy'), 'POST', {
    body: JSON.stringify({
      dashboard_id: params.dashboardId,
      target_id: params.tragetId,
      dashboard_name: params.newName
    })
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_SAVE_REQUEST,
        {
          type: FETCH_COPY_DATAVIEW_ITEM_SUCCESS,
          payload: (action, state, json) => ({
            oldId: params.dashboardId,
            newId: json.data,
            isCurrent: params.isCurrent,       // 是否复制到当前文件夹
            newName: params.newName
          })
        },
        FETCH_SAVE_FAILURE
      ]
    }
  }
}


// 获取多屏列表
export const fetchMultiScreenList = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/screen/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_MULTI_SCREEN_LIST_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 删除多屏
export const deleteMutilScreenItem = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/delete'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_SAVE_REQUEST,
        {
          type: DELETE_MULTI_SCREEN_ITEM_SUCCESS,
          payload: () => params.id
        },
        FETCH_SAVE_FAILURE
      ]
    }
  }
}

// 更新多屏(重命名)
export const updateMultiScreenItem = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/rename'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_SAVE_REQUEST,
        {
          type: UPDATE_MULTI_SCREEN_ITEM_SUCCESS,
          payload: () => params
        },
        FETCH_SAVE_FAILURE
      ]
    }
  }
}

export const saveLocalData = createAction(SAVE_DATAVIEW_LIST_LOCAL_DATA_SUCCESS)

/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchDataviewListSilent,                  // 获取报告列表但是不改变redux
  fetchDataviewList,                        // 获取报告列表
  fetchSearchList,                          // 获取报告搜索列表
  fetchAddDataviewItem,                     // 新增报告文件 或 报告文件夹
  fetchUpdateDataviewItem,                  // 更新报告文件 或 报告文件夹(重命名)
  fetchSetHomeDataview,                     // 设置报告为主页
  fetchDeleteDataviewItem,                  // 删除报告文件 或 报告文件夹
  fetchMoveDataviewItem,                    // 移动报告文件 或 报告文件夹
  fetchCopyDataviewItem,                    // 复制报告

  fetchMultiScreenList,                     // 获取多屏列表
  deleteMutilScreenItem,                    // 删除多屏
  updateMultiScreenItem,                    // 更新多屏

  saveLocalData,                            // 缓存
}


const initialState = {
  active: -1,
  list: [],                   // 列表
  searchList: [],             // 搜索列表
  screenList: [],             // 多屏列表
  pwd: [],                    // 当前目录路径
  items: null,                // 单个单图的数据
  pending: false,             // loading 状态
  savePending: false,         // 非列表的loading
}

export default handleActions({
  // pending request
  [FETCH_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },
  [FETCH_FAILURE](state) {
    return {
      ...state,
      pending: false
    }
  },

  // pending request
  [FETCH_SAVE_REQUEST](state) {
    return {
      ...state,
      savePending: true
    }
  },
  [FETCH_SAVE_FAILURE](state) {
    return {
      ...state,
      savePending: false
    }
  },

  // 获取报告列表
  [FETCH_DATAVIEW_LIST_SUCCESS](state, { payload }) {
    return {
      ...state,
      pending: false,
      list: payload.tree || [],
      pwd: payload.route || []
    }
  },

  // 获取报告搜索列表
  [FETCH_SEARCH_LIST_SUCCESS](state, { payload }) {
    return {
      ...state,
      pending: false,
      searchList: payload || []
    }
  },

  // 新增报告文件 或 报告文件夹
  [FETCH_ADD_DATAVIEW_ITEM_SUCCESS](state, { payload }) {
    let newList;

    if (payload.type === 'FOLDER') {
      newList = [payload, ...state.list];
    } else {
      const folders = state.list.filter(item => item.type === 'FOLDER');
      const files = state.list.filter(item => item.type === 'FILE');
      newList = [...folders, payload, ...files];
    }
    return {
      ...state,
      savePending: false,
      list: newList
    }
  },

  // 更新报告文件 或 报告文件夹(重命名)
  [FETCH_UPDATE_DATAVIEW_ITEM_SUCCESS](state, { payload }) {
    return {
      ...state,
      savePending: false,
      list: state.list.map((item) => {
        if (item.id === payload.id) {
          item = {
            ...item,
            ...payload
          }
        }
        return item;
      }),
      searchList: state.searchList.map((item) => {
        if (item.id === payload.id) {
          item = {
            ...item,
            ...payload
          }
        }
        return item;
      })
    }
  },

  // 删除报告文件 或 报告文件夹
  [FETCH_DELETE_DATAVIEW_ITEM_SUCCESS](state, { payload }) {
    const newList = state.list.filter(item => item.id !== payload);
    const newSearchList = state.searchList.filter(item => item.id !== payload);
    return {
      ...state,
      savePending: false,
      list: newList,
      searchList: newSearchList
    }
  },

  // 移动报告文件 或 报告文件夹
  [FETCH_MOVE_DATAVIEW_ITEM_SUCCESS](state, { payload }) {
    const newList = state.list.filter(item => item.id !== payload);
    const newSearchList = state.searchList.filter(item => item.id !== payload);
    return {
      ...state,
      savePending: false,
      list: newList,
      searchList: newSearchList
    }
  },

  // 复制报告文件
  [FETCH_COPY_DATAVIEW_ITEM_SUCCESS](state, { payload }) {
    let newSearchList = state.searchList
    let newList = state.list
    const copyData = _copyDataById(state.list, payload.oldId)
    if (copyData) {
      copyData.id = payload.newId
      copyData.name = payload.newName
      copyData.status = 0
      // 如果是在搜索状态下
      if (newSearchList.length > 0) {
        newSearchList = newSearchList.concat([])
        newSearchList.push(copyData)
      }
      if (payload.isCurrent) {
        // 需要插入到文件的第一个位置
        newList = newList.concat([])
        newList.every((item, i) => {
          if (item.type === 'FILE') {
            newList.splice(i, 0, copyData)
            return false
          }
          return true
        })
      }
    }
    return {
      ...state,
      savePending: false,
      list: newList,
      searchList: newSearchList
    }
  },

  // 获取多屏列表
  [FETCH_MULTI_SCREEN_LIST_SUCCESS](state, { payload }) {
    return {
      ...state,
      pending: false,
      screenList: payload.tree || []
    }
  },

  // 删除多屏
  [DELETE_MULTI_SCREEN_ITEM_SUCCESS](state, { payload }) {
    const newScreenList = state.screenList.filter(item => item.id !== payload);
    return {
      ...state,
      savePending: false,
      screenList: newScreenList
    }
  },

  // 更新多屏(重命名)
  [UPDATE_MULTI_SCREEN_ITEM_SUCCESS](state, { payload }) {
    return {
      ...state,
      savePending: false,
      screenList: state.screenList.map((item) => {
        if (item.id === payload.id) {
          item = {
            ...item,
            ...payload
          }
        }
        return item;
      })
    }
  },

  // 缓存
  [SAVE_DATAVIEW_LIST_LOCAL_DATA_SUCCESS](state, { payload }) {
    return {
      ...state,
      active: payload.active
    }
  }

}, initialState)
