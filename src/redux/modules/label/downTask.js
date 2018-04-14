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
const FETCH_REQUEST = Symbol('FETCH_REQUEST');
const FETCH_FAILURE = Symbol('FETCH_FAILURE');

const FETCH_LABEL_DETAIL_DOWN_TASK_FILE_LIST_REQUEST = Symbol('FETCH_LABEL_DETAIL_DOWN_TASK_FILE_LIST_REQUEST')
const FETCH_LABEL_DETAIL_DOWN_TASK_FILE_LIST_SUCCESS = Symbol('FETCH_LABEL_DETAIL_DOWN_TASK_FILE_LIST_SUCCESS')
const FETCH_LABEL_DETAIL_DOWN_TASK_FILE_LIST_FAILURE = Symbol('FETCH_LABEL_DETAIL_DOWN_TASK_FILE_LIST_FAILURE')

const FETCH_LABEL_DETAIL_DOWN_TASK_HISTORY_LIST_REQUEST = Symbol('FETCH_LABEL_DETAIL_DOWN_TASK_HISTORY_LIST_REQUEST')
const FETCH_LABEL_DETAIL_DOWN_TASK_HISTORY_LIST_SUCCESS = Symbol('FETCH_LABEL_DETAIL_DOWN_TASK_HISTORY_LIST_SUCCESS')
const FETCH_LABEL_DETAIL_DOWN_TASK_HISTORY_LIST_FAILURE = Symbol('FETCH_LABEL_DETAIL_DOWN_TASK_HISTORY_LIST_FAILURE')

const DOWN_LOAD_SUCCESS = Symbol('DOWN_LOAD_SUCCESS')

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

const fetchList = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('download/download_list', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_LABEL_DETAIL_DOWN_TASK_FILE_LIST_REQUEST,
        {
          type: FETCH_LABEL_DETAIL_DOWN_TASK_FILE_LIST_SUCCESS,
          payload: (action, state, json) => Object.assign({ items: json.data.items, total: json.data.total }, { page: params.page })
        },
        FETCH_LABEL_DETAIL_DOWN_TASK_FILE_LIST_FAILURE
      ]
    }
  }
}

const fetchHistory = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('download/download_history', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_LABEL_DETAIL_DOWN_TASK_HISTORY_LIST_REQUEST,
        {
          type: FETCH_LABEL_DETAIL_DOWN_TASK_HISTORY_LIST_SUCCESS,
          payload: (action, state, json) => Object.assign({ items: json.data.items, total: json.data.total }, { page: params.page })
        },
        FETCH_LABEL_DETAIL_DOWN_TASK_HISTORY_LIST_FAILURE
      ]
    }
  }
}

const download = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('download/download_file', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: DOWN_LOAD_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const actions = {
  fetchList,
  fetchHistory,
  download
};

const initialState = {
  task: {
    list: [],
    total: 0,
    currentPage: 1,
    pending: false // 为区分和详情列表的pending
  },
  history: {
    list: [],
    total: 0,
    currentPage: 1,
    pending: false
  }
};

export default handleActions({

  [FETCH_LABEL_DETAIL_DOWN_TASK_FILE_LIST_REQUEST](state) {
    return { ...state, task: { ...state.task, pending: true } }
  },

  [FETCH_LABEL_DETAIL_DOWN_TASK_FILE_LIST_SUCCESS](state, { payload }) {
    return { ...state, task: { ...state.task, pending: false, list: payload.items, total: +payload.total, currentPage: payload.page } }
  },

  [FETCH_LABEL_DETAIL_DOWN_TASK_FILE_LIST_FAILURE](state) {
    return { ...state, task: { ...state.task, pending: false } }
  },

  [FETCH_LABEL_DETAIL_DOWN_TASK_HISTORY_LIST_REQUEST](state) {
    return { ...state, history: { ...state.history, pending: true } }
  },

  [FETCH_LABEL_DETAIL_DOWN_TASK_HISTORY_LIST_SUCCESS](state, { payload }) {
    return { ...state, history: { ...state.history, pending: false, list: payload.items, total: +payload.total, currentPage: payload.page } }
  },

  [FETCH_LABEL_DETAIL_DOWN_TASK_HISTORY_LIST_FAILURE](state) {
    return { ...state, history: { ...state.history, pending: false } }
  }

}, initialState);

