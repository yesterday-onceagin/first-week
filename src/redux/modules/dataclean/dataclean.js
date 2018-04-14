import { handleActions } from 'redux-actions'
import { CALL_API } from 'redux-api-middleware'

import getApiPath from '../../../helpers/getApiPath';
import getFetchOptions from '../../../helpers/getFetchOptions';
// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */

// 获取清洗流程列表
const FETCH_FLOW_LIST_REQUEST = Symbol('FETCH_FLOW_LIST_REQUEST');
const FETCH_FLOW_LIST_SUCCESS = Symbol('FETCH_FLOW_LIST_SUCCESS');
const FETCH_FLOW_LIST_FAILURE = Symbol('FETCH_FLOW_LIST_FAILURE');
// 新增清洗流程
const FETCH_ADD_FLOW_SUCCESS = Symbol('FETCH_ADD_FLOW_SUCCESS');
// 删除清洗流程
const FETCH_DELETE_FLOW_SUCCESS = Symbol('FETCH_DELETE_FLOW_SUCCESS');
// 启用清洗流程/禁用清洗流程 pending
const FETCH_CHANGE_FLOW_REQUEST = Symbol('FETCH_CHANGE_FLOW_REQUEST');
const FETCH_CHANGE_FLOW_FAILURE = Symbol('FETCH_CHANGE_FLOW_FAILURE');
// 启用清洗流程
const FETCH_ENABLE_FLOW_SUCCESS = Symbol('FETCH_ENABLE_FLOW_SUCCESS');
// 禁用清洗流程
const FETCH_DISABLE_FLOW_SUCCESS = Symbol('FETCH_DISABLE_FLOW_SUCCESS');
// 运行清洗流程
const FETCH_RUN_FLOW_SUCCESS = Symbol('FETCH_RUN_FLOW_SUCCESS');
// 更新清洗流程
const FETCH_UPDATE_FLOW_SUCCESS = Symbol('FETCH_UPDATE_FLOW_SUCCESS');
// 获取数据清洗流程详情
const GET_FLOW_DATA_SUCCESS = Symbol('GET_FLOW_DATA_SUCCESS');


// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

// 获取数据清洗流程列表
export const fetchFlowList = (params, callback) => {
  if (!params.page) {
    params.page = 1;
  }

  const fetchOptions = getFetchOptions(getApiPath('flow/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_FLOW_LIST_REQUEST, {
          type: FETCH_FLOW_LIST_SUCCESS,
          payload: (action, state, json) => {
            json.data.sorts = params.sorts || '';
            json.data.page = params.page;
            return json.data;
          }
        },
        FETCH_FLOW_LIST_FAILURE
      ]
    }
  }
}

// 取得数据清洗流程列表（用于下拉选单）
export const getFlowList = (params, callback) => {
  if (!params.page) {
    params.page = 1;
  }

  const fetchOptions = getFetchOptions(getApiPath('flow/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'GET_FLOW_LIST_SUCCESS',
          payload: (action, state, json) => {
            json.data.page = params.page;
            return json.data;
          }
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 新增数据清洗流程
export const fetchAddFlow = (data, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/add'), 'POST', {
    body: JSON.stringify(data)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_ADD_FLOW_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 删除数据清洗流程
export const fetchDeleteFlow = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/delete'), 'POST', {
    body: JSON.stringify({ id })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_DELETE_FLOW_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return id;
            }
            return null;
          }
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 启用数据清洗流程
export const fetchEnableFlow = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/enable'), 'POST', {
    body: JSON.stringify({ id })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_CHANGE_FLOW_REQUEST, {
          type: FETCH_ENABLE_FLOW_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return id;
            }
            return null;
          }
        },
        FETCH_CHANGE_FLOW_FAILURE
      ]
    }
  }
}

// 禁用数据清洗流程
export const fetchDisableFlow = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/disable'), 'POST', {
    body: JSON.stringify({ id })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_CHANGE_FLOW_REQUEST, {
          type: FETCH_DISABLE_FLOW_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return id;
            }
            return null;
          }
        },
        FETCH_CHANGE_FLOW_FAILURE
      ]
    }
  }
}

// 运行数据清洗流程
export const fetchRunFlow = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/run'), 'POST', {
    body: JSON.stringify({ id })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_RUN_FLOW_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 更新数据清洗流程
export const fetchUpdateFlow = (data, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/update'), 'POST', {
    body: JSON.stringify(data)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_UPDATE_FLOW_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return data;
            }
            return null;
          }
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 获取数据清洗流程详情
export const getFlowData = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/get', { id }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: GET_FLOW_DATA_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
};


/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchFlowList,        // 获取数据清洗流程列表
  getFlowList,          // 取得数据清洗流程列表（用于下拉选单）
  fetchAddFlow,         // 新增数据清洗流程
  fetchDeleteFlow,      // 删除数据清洗流程
  fetchEnableFlow,      // 启用数据清洗流程
  fetchDisableFlow,     // 禁用数据清洗流程
  fetchRunFlow,         // 运行数据清洗流程
  fetchUpdateFlow,      // 更新数据清洗流程
  getFlowData,          // 获取数据清洗流程详情(用于调度配置窗口)
}


// ------------------------------------
// Reducers
// ------------------------------------
const initialState = {
  pending: false,
  flowList: [],
  flowPage: 1,
  flowTotal: 0,
  flowSorts: '[{"id":"name","method":"DESC"}]'
}


export default handleActions({
  // 获取清洗流程列表
  [FETCH_FLOW_LIST_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },
  [FETCH_FLOW_LIST_SUCCESS](state, action) {
    const newFlowList = +action.payload.page > 1 ? state.flowList.concat(action.payload.items) : action.payload.items;

    return {
      ...state,
      pending: false,
      flowList: newFlowList.map((flow) => {
        if (!flow.schedule) {
          flow.schedule = '0 0 0 ? * * *';
        }
        return flow;
      }),
      flowPage: +action.payload.page,
      flowTotal: +action.payload.total,
      flowSorts: action.payload.sorts
    }
  },
  [FETCH_FLOW_LIST_FAILURE](state) {
    return {
      ...state,
      pending: false
    }
  },
  // 启用清洗流程/禁用清洗流程
  [FETCH_CHANGE_FLOW_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },
  [FETCH_CHANGE_FLOW_FAILURE](state) {
    return {
      ...state,
      pending: false
    }
  },
  [FETCH_ENABLE_FLOW_SUCCESS](state, action) {
    if (action.payload) {
      return {
        ...state,
        pending: false,
        flowList: setFlowStatus(action.payload, state.flowList, true)
      }
    }
    return {
      ...state,
      pending: false
    }
  },
  [FETCH_DISABLE_FLOW_SUCCESS](state, action) {
    if (action.payload) {
      return {
        ...state,
        pending: false,
        flowList: setFlowStatus(action.payload, state.flowList, false)
      }
    }
    return {
      ...state,
      pending: false
    }
  },
  // 删除清洗流程
  [FETCH_DELETE_FLOW_SUCCESS](state, action) {
    if (action.payload) {
      const newFlowList = state.flowList.filter(flow => flow.id !== action.payload);

      return {
        ...state,
        flowTotal: state.flowTotal - 1,
        flowList: newFlowList
      };
    }
    return {
      ...state
    };
  },
  // 更新清洗流程
  [FETCH_UPDATE_FLOW_SUCCESS](state, action) {
    if (action.payload) {
      const newFlowList = state.flowList.map((flow) => {
        if (flow.id === action.payload.id) {
          Object.keys(flow).map((key) => {
            flow[key] = action.payload[key];
          })
        }
        return flow;
      });

      return {
        ...state,
        flowList: newFlowList
      };
    }
    return {
      ...state
    };
  }
}, initialState)


/*
* 设置流程状态(用于列表中启用/禁用流程)
*/
function setFlowStatus(id, list, isEnable) {
  const newList = list.map((flow) => {
    if (flow.id === id) {
      flow.status = isEnable ? '启用' : '禁用';
    }
    return flow;
  });

  return newList;
}
