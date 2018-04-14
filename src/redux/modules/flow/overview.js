import { createAction, handleActions } from 'redux-actions'
import { CALL_API, getJSON, ApiError } from 'redux-api-middleware'

import getApiPath from '../../../helpers/getApiPath';
import getFetchOptions from '../../../helpers/getFetchOptions';
import { stringToDate, getDateStr } from '../../../helpers/dateUtils';

// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */
const FETCH_REQUEST = Symbol('FETCH_REQUEST')
const FETCH_FAILURE = Symbol('FETCH_FAILURE')

const FETCH_TOP_LIST_REQUEST = Symbol('FETCH_TOP_LIST_REQUEST');
const FETCH_TOP_LIST_SUCCESS = Symbol('FETCH_TOP_LIST_SUCCESS');
const FETCH_TOP_LIST_FAILURE = Symbol('FETCH_TOP_LIST_FAILURE');

const FETCH_TODAY_SUCCESS = Symbol('FETCH_TODAY_SUCCESS');

const FETCH_PER_HOUR_SUCCESS = Symbol('FETCH_PER_HOUR_SUCCESS');

export const fetchTopTen = (mode, callback) => {
  const url = mode === 'day' ? 'flow/instance/today_running_time_top10' : 'flow/instance/almost_one_month_error_times_top10';
  const fetchOptions = getFetchOptions(getApiPath(url));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TOP_LIST_REQUEST,
        {
          type: FETCH_TOP_LIST_SUCCESS,
          payload: (action, state, json) => Object.assign(json, { mode })
        },
        FETCH_TOP_LIST_FAILURE
      ]
    }
  }
}

export const fetchToday = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/instance/today_running_status'));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_TODAY_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const fetchPerHour = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/instance/per_hour_successful_times', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_PER_HOUR_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}


// ------------------------------------
// Actions (Action Creator)
// ------------------------------------


/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchTopTen,
  fetchToday,
  fetchPerHour
}

/**
 * hour [0 - 23] 
 */
const setFullHour = (data, today_hour) => {
  const _data = []
  for (let i = 0; i < 24; i++) {
    _data.push({
      hour: i < 9 ? `0${i}` : i,
      times: !today_hour || i <= today_hour ? 0 : '-'
    })
  }
  data.forEach((item) => {
    _data.splice(+item.hour, 1, item)
  })
  return _data
}

const initialState = {
  pending: false,
  topList: null,
  charts_data: null
}

export default handleActions({

  [FETCH_TOP_LIST_REQUEST](state) {
    return { ...state, pending: true }
  },

  [FETCH_TOP_LIST_SUCCESS](state, { payload }) {
    return { ...state,
      pending: false,
      topList: {
        ...state.topList,
        [payload.mode]: payload.data
      } }
  },

  [FETCH_TOP_LIST_REQUEST](state) {
    return { ...state, pending: false }
  },

  [FETCH_PER_HOUR_SUCCESS](state, { payload }) {
    const data = Object.entries(payload)
    // 按时间排序
    data.sort((a, b) => {
      const a_h = stringToDate(a[0], '-')
      const b_h = stringToDate(b[0], '-')
      return a_h.getTime() - b_h.getTime()
    })

    let charts_data = []

    const today = getDateStr(0)

    // data 的长度 小于 2
    if (data.length == 1) {
      if (data[0][0] === today) {
        charts_data = [{
          name: '昨天',
          data: setFullHour([])
        }, {
          name: '今天',
          data: setFullHour(data[0][1], new Date().getHours())
        }]
      } else {
        charts_data = [{
          name: '昨天',
          data: setFullHour(data[0][1])
        }, {
          name: '今天',
          data: setFullHour([], new Date().getHours())
        }]
      }
    } else if (data.length == 2) {
      charts_data = [{
        name: '昨天',
        data: setFullHour(data[0][1])
      }, {
        name: '今天',
        data: setFullHour(data[1][1], new Date().getHours())
      }]
    }

    return { ...state, charts_data }
  }

}, initialState)
