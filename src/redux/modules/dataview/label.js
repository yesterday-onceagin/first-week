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

const FETCH_LABEL_COLS_SUCCESS = Symbol('FETCH_LABEL_COLS_SUCCESS');
const FETCH_LABEL_DETAIL_SUCCESS = Symbol('FETCH_LABEL_DETAIL_SUCCESS');

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------
//获取label的列表


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

const initialState = {

};

export const actions = {
  fetchLabelDetail,
  fetchLabelCol
};


export default handleActions({

}, initialState);
