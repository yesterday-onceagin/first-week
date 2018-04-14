import { handleActions } from 'redux-actions'
import { CALL_API } from 'redux-api-middleware'

import getApiPath from '../../../helpers/getApiPath'
import getFetchOptions from '../../../helpers/getFetchOptions'

// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */
const FETCH_REQUEST = Symbol('FETCH_REQUEST')
const FETCH_FAILURE = Symbol('FETCH_FAILURE')
const FETCH_SUCCESS = Symbol('FETCH_SUCCESS')
const FETCH_MULTI_SCREEN_DETAIL_SUCCESS = Symbol('FETCH_MULTI_SCREEN_DETAIL_SUCCESS')


// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

// 获取用户组树
export const fetchUserGroupTree = (callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user_group/tree'));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      error: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_SUCCESS,
          payload: (action, state, json) => ({
            ...json.data
          })
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 获取多屏详情
export const fetchMultiScreenDetail = (params, callback) => {
  let apiUrl = 'dashboard/screen/detail'
  const { id, pwd, isShareView, tenantCode } = params
  const _params = { id }
  // 如果有密码
  if (pwd) {
    _params.pwd = pwd
  }
  // 如果是发布
  if (isShareView) {
    apiUrl = 'released_dashboard/get'
    _params.code = tenantCode
  }

  const fetchOptions = getFetchOptions(getApiPath(apiUrl, _params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      error: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_MULTI_SCREEN_DETAIL_SUCCESS,
          payload: (action, state, json) => ({
            ...json.data,
            id: params.id
          })
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 保存多屏
export const saveMutilScreen = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/screen/save'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 发布多屏
export const publishMutilScreen = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/async_release'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_SUCCESS,
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
  fetchMultiScreenDetail,
  saveMutilScreen,
  publishMutilScreen,
  fetchUserGroupTree
}

const initialState = {
  screenPending: false,
  multiScreenData: {       // 多屏演示数据
    reports: {},           // 报告数据
    screens: {}            // 多屏数据
  }
}

export default handleActions({
  [FETCH_REQUEST](state) {
    return {
      ...state,
      screenPending: true
    }
  },

  [FETCH_FAILURE](state) {
    return {
      ...state,
      screenPending: false
    }
  },

  [FETCH_SUCCESS](state) {
    return {
      ...state,
      screenPending: false
    }
  },

  [FETCH_MULTI_SCREEN_DETAIL_SUCCESS](state, { payload }) {
    const screen_reports = {}
    payload.screens.forEach((screen) => {
      screen_reports[screen.id] = screen
    })

    return {
      ...state,
      screenPending: false,
      multiScreenData: {
        reports: {
          ...state.multiScreenData.reports,
          ...screen_reports
        },
        screens: {
          ...state.multiScreenData.screens,
          [payload.id]: payload.screens && payload.screens.map(screen => screen.id)
        }
      }
    }
  }

}, initialState)
