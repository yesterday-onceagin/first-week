import { createAction, handleActions } from 'redux-actions'
import { CALL_API } from 'redux-api-middleware'

import getApiPath from '../../../helpers/getApiPath'
import getFetchOptions from '../../../helpers/getFetchOptions'

// pending
const FETCH_USER_LOG_REQUEST = Symbol('FETCH_USER_LOG_REQUEST')
const FETCH_USER_LOG_SUCCESS = Symbol('FETCH_USER_LOG_SUCCESS')
const FETCH_USER_LOG_FAILURE = Symbol('FETCH_USER_LOG_FAILURE')

export const fetchUserLog = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user_log/view_log'), 'POST', {
    body: JSON.stringify(params)
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_LOG_REQUEST,
        {
          type: FETCH_USER_LOG_SUCCESS,
          payload: (action, state, json) =>  Object.assign(json.data, {
            page: params.skip
          })
        },
        FETCH_USER_LOG_FAILURE
      ]
    }
  }
}

const initialState = {
  pending: false,
  list: [],
  total: 0,
  page: 1
}

export const actions = {
  fetchUserLog
}

export default handleActions({
  [FETCH_USER_LOG_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },
  [FETCH_USER_LOG_SUCCESS](state, action) {
    const { payload } = action
    const list = payload.items;

    return {
      list,
      pending: false,
      page: +payload.page,
      total: +payload.total
    }
  },
  [FETCH_USER_LOG_FAILURE](state) {
    return {
      ...state,
      pending: false
    }
  },
}, initialState)
