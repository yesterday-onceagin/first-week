/**
 * Created by cuss on 2016/9/28.
 */
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

// 拉取标签的定义列表
const FETCH_LABEL_LIST_REQUEST = Symbol('FETCH_LABEL_LIST_REQUEST');
const FETCH_LABEL_LIST_SUCCESS = Symbol('FETCH_LABEL_LIST_SUCCESS');
const FETCH_LABEL_LIST_FAILURE = Symbol('FETCH_LABEL_LIST_FAILURE');

const FETCH_RUN_FLOW_SUCCESS = Symbol('FETCH_RUN_FLOW_SUCCESS');

const FETCH_CHANGE_FLOW_REQUEST = Symbol('FETCH_CHANGE_FLOW_REQUEST');
const FETCH_ENABLE_FLOW_SUCCESS = Symbol('FETCH_ENABLE_FLOW_SUCCESS');
const FETCH_DISABLE_FLOW_SUCCESS = Symbol('FETCH_DISABLE_FLOW_SUCCESS');
const FETCH_CHANGE_FLOW_FAILURE = Symbol('FETCH_CHANGE_FLOW_FAILURE');

const FETCH_LABEL_DETAIL_SUCCESS = Symbol('FETCH_LABEL_DETAIL_SUCCESS');

const FETCH_LABEL_COLS_SUCCESS = Symbol('FETCH_LABEL_COLS_SUCCESS');

const EXPORT_LABEL_DETAIL_DOWN_TASK_SUCCESS = Symbol('EXPORT_LABEL_DETAIL_DOWN_TASK_SUCCESS');

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------


export const fetchLabelList = (params, callback) => {
  const { org_name, ...data } = params
  const fetchOptions = getFetchOptions(getApiPath('label/list', data), 'GET');
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_LABEL_LIST_REQUEST,
        {
          type: FETCH_LABEL_LIST_SUCCESS,
          payload: (action, state, json) => Object.assign(json.data, {
            searchParams: {
              org_name,
              org_id: params.org_id,
              tmpl_id: params.tmpl_id,
              keyword: params.keyword
            },
            sorts: params.sorts || '',
            page: params.page
          })
        },
        FETCH_LABEL_LIST_FAILURE
      ]
    }
  }
};

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
        FETCH_REQUEST, {
          type: FETCH_RUN_FLOW_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
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

export const deleteLabel = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('label/delete', params), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_LABEL_LIST_FAILURE,
        {
          type: FETCH_LABEL_LIST_FAILURE,
          payload: (action, state, json) => json.data
        },
        FETCH_LABEL_LIST_FAILURE
      ]
    }
  }
}

export const fetchLabelCol = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('label/detail_col', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_LABEL_COLS_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const fetchLabelDetail = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('label/detail_data_list', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_LABEL_DETAIL_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const exportFile = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('download/label_detail/export_file', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'EXPORT_LABEL_DETAIL_DOWN_TASK_REQUEST',
        {
          type: EXPORT_LABEL_DETAIL_DOWN_TASK_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const actions = {
  fetchLabelList,
  fetchRunFlow,
  deleteLabel,
  fetchEnableFlow,      // 启用数据清洗流程
  fetchDisableFlow,     // 禁用数据清洗流程
  fetchLabelDetail,
  fetchLabelCol,         // 获取标签的cols
  exportFile           // 导出文件
};

const initialState = {
  pending: false,
  list: [],
  page: 1,
  total: 0,
  sorts: '',
  searchParams: null // 查询条件
};


export default handleActions({

  [FETCH_LABEL_LIST_REQUEST](state) {
    return { ...state, pending: true }
  },

  [FETCH_LABEL_LIST_SUCCESS](state, { payload }) {
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

  [FETCH_LABEL_LIST_FAILURE](state) {
    return { ...state, pending: false }
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
        list: setFlowStatus(action.payload, state.list, true)
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
        list: setFlowStatus(action.payload, state.list, false)
      }
    }
    return {
      ...state,
      pending: false
    }
  },

}, initialState);

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
