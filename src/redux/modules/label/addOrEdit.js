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

const GET_FLOW_LIST_SUCCESS = Symbol('GET_FLOW_LIST_SUCCESS');

const FETCH_ALL_INDICATORS_REQUEST = Symbol('FETCH_ALL_INDICATORS_REQUEST');
const FETCH_ALL_INDICATORS_SUCCESS = Symbol('FETCH_ALL_INDICATORS_SUCCESS');
const FETCH_ALL_INDICATORS_FAILURE = Symbol('FETCH_ALL_INDICATORS_FAILURE');

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

// 取得数据清洗流程列表（用于下拉选单）
export const getFlowList = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/list', params));

  if (!params.page) {
    params.page = 1;
  }

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST, {
          type: GET_FLOW_LIST_SUCCESS,
          payload: (action, state, json) => {
            json.data.page = params.page;
            return json.data;
          }
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const fetchAllIndicators = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/type/list?include_indicator=1&include_dimension=1', params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_ALL_INDICATORS_REQUEST,
        {
          type: FETCH_ALL_INDICATORS_SUCCESS,
          payload: (action, state, json) => json.data.filter(item => !!item.name && item.indicator)
        },
        FETCH_ALL_INDICATORS_FAILURE
      ]
    }
  }
}

export const saveLabel = (params, callback) => {
  const url = params.id ? 'label/update' : 'label/add'
  const fetchOptions = getFetchOptions(getApiPath(url), 'POST', {
    body: JSON.stringify(params)
  })
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'SAVE_LABEL_SUCCESS',
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const fetchLabelItem = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('label/get', params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'FETCH_LABEL_ITEM_SUCCESS',
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const checkLogic = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('label/check_logical_expression'), 'POST', {
    body: JSON.stringify(params)
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'CHECK_LOGICAL_EXPRESSION_SUCCESS',
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  getFlowList,
  fetchAllIndicators,
  saveLabel,
  fetchLabelItem,
  checkLogic
};

// ------------------------------------
// Reducers
// ------------------------------------

const initialState = {
  flowList: [],
  pending: false,
  allIndicator: []
};


export default handleActions({

  [GET_FLOW_LIST_SUCCESS](state, { payload }) {
    return { ...state, flowList: payload.items }
  },

  [FETCH_ALL_INDICATORS_REQUEST](state) {
    return { ...state, pending: true }
  },

  [FETCH_ALL_INDICATORS_SUCCESS](state, { payload }) {
    return { ...state, pending: false, allIndicator: payload }
  },

  [FETCH_ALL_INDICATORS_FAILURE](state) {
    return { ...state, pending: false }
  },

}, initialState)
