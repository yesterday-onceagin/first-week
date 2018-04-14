import { createAction, handleActions } from 'redux-actions'
import { CALL_API, getJSON, ApiError } from 'redux-api-middleware'

import getApiPath from '../../../helpers/getApiPath';
import getFetchOptions from '../../../helpers/getFetchOptions';

// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */
const FETCH_REQUEST = Symbol('FETCH_REQUEST')
const FETCH_FAILURE = Symbol('FETCH_FAILURE')

const FETCH_INSTANCE_LIST_REQUEST = Symbol('FETCH_INSTANCE_LIST_REQUEST');
const FETCH_INSTANCE_LIST_SUCCESS = Symbol('FETCH_INSTANCE_LIST_SUCCESS');
const FETCH_INSTANCE_LIST_FAILURE = Symbol('FETCH_INSTANCE_LIST_FAILURE');

const FETCH_NODE_LIST_REQUEST = Symbol('FETCH_NODE_LIST_REQUEST');
const FETCH_NODE_LIST_SUCCESS = Symbol('FETCH_NODE_LIST_SUCCESS');
const FETCH_NODE_LIST_FAILURE = Symbol('FETCH_NODE_LIST_FAILURE');

const KILL_FLOW_SUCCESS = Symbol('KILL_FLOW_SUCCESS');

const FETCH_LOGS_REQUEST = Symbol('FETCH_LOGS_REQUEST');
const FETCH_LOGS_SUCCESS = Symbol('FETCH_LOGS_SUCCESS');
const FETCH_LOGS_FAILURE = Symbol('FETCH_LOGS_FAILURE');

const CLEAR_LOG_SUCCESS = Symbol('CLEAR_LOG_SUCCESS');

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

const fetchInstanceList = (params, callback) => {
  const { timeType,  ...data } = params;
  const _searct_data = Object.assign({}, data)
  // 由于后端查询不处理名字发生变更的情况. 当传过去名称而导致日志数据查询不到。所以，当流程id存在。则keyword为空 
  // 
  if (data.flow_id) {
    Object.assign(_searct_data, { keyword: '' })
  }

  const fetchOptions = getFetchOptions(getApiPath('flow/instance/list', _searct_data));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_INSTANCE_LIST_REQUEST,
        {
          type: FETCH_INSTANCE_LIST_SUCCESS,
          payload: (action, state, json) => Object.assign(json.data, {
            searchParams: {
              ...data,
              timeType
            },
            sorts: params.sorts || '',
            page: params.page
          })
        },
        FETCH_INSTANCE_LIST_FAILURE
      ]
    }
  }
}

const fetchNodeList = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/instance/node/list', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_NODE_LIST_REQUEST,
        {
          type: FETCH_NODE_LIST_SUCCESS,
          payload: (action, state, json) => Object.assign(json.data, {
            page: params.page
          })
        },
        FETCH_NODE_LIST_FAILURE
      ]
    }
  }
}

const killInstance = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/instance/stop'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: KILL_FLOW_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

const fetchLog = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/instance/logs', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_LOGS_REQUEST,
        {
          type: FETCH_LOGS_SUCCESS,
          payload: (action, state, json) => Object.assign(json.data, {
            page: params.page
          })
        },
        FETCH_LOGS_FAILURE
      ]
    }
  }
}


const clearLog = createAction(CLEAR_LOG_SUCCESS)

/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchInstanceList,
  fetchNodeList,
  killInstance,
  fetchLog,
  clearLog
}


const initialState = {
  pending: false,
  list: [],
  page: 1,
  total: 0,
  sorts: '',
  log_data: [],
  log_pending: false,
  log_total: 0,
  log_page: 1,

  node_pending: false,
  node_list: [],
  node_page: 1,
  node_total: 0,

  searchParams: null // 查询条件
}

export default handleActions({

  [FETCH_INSTANCE_LIST_REQUEST](state) {
    return { ...state, pending: true }
  },

  [FETCH_INSTANCE_LIST_SUCCESS](state, { payload }) {
    let newList = payload.items;

    if (+payload.page > 1) {
      newList = state.list.concat(payload.items);
    }

    return {
      ...state,
      pending: false,
      list: newList,
      searchParams: payload.searchParams,
      page: +payload.page,
      total: +payload.total,
      sorts: payload.sorts
    }
  },

  [FETCH_INSTANCE_LIST_FAILURE](state) {
    return { ...state, pending: false }
  },

  [FETCH_LOGS_REQUEST](state) {
    return { ...state, log_pending: true }
  },

  [FETCH_LOGS_SUCCESS](state, { payload }) {
    let newList = payload.items;

    if (+payload.page > 1) {
      newList = state.log_data.concat(payload.items);
    }

    return {
      ...state,
      log_pending: false,
      log_data: newList,
      log_page: +payload.page,
      log_total: +payload.total
    }
  },

  [FETCH_LOGS_FAILURE](state) {
    return { ...state, log_pending: false }
  },

  [CLEAR_LOG_SUCCESS](state) {
    return {
      ...state,
      log_data: [],
      log_pending: false,
      log_total: 0,
      log_page: 1,
    }
  },

  [FETCH_NODE_LIST_REQUEST](state) {
    return { ...state, node_pending: true }
  },

  [FETCH_NODE_LIST_SUCCESS](state, { payload }) {
    return {
      ...state,
      node_pending: false,
      node_list: payload
    }
  },

  [FETCH_NODE_LIST_FAILURE](state) {
    return { ...state, node_pending: false }
  }

}, initialState)
