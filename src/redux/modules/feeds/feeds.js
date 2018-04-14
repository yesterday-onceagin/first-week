/**
 * 邮件订阅redux, api 参考后端python代码feeds_api_route.py
 */
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

// 触发pending的请求
const FETCH_REQUEST = Symbol('FETCH_REQUEST')
const FETCH_FAILURE = Symbol('FETCH_FAILURE')
// 触发listPending
const FETCH_FEEDS_LIST_SUCCESS = Symbol('FETCH_FEEDS_LIST_SUCCESS')
const FETCH_FEEDS_DETAIL_SUCCESS = Symbol('FETCH_FEEDS_DETAIL_SUCCESS')

const STOP_FEEDS_ITEM_SUCCESS = Symbol('STOP_FEEDS_ITEM_SUCCESS')
const START_FEEDS_ITEM_SUCCESS = Symbol('START_FEEDS_ITEM_SUCCESS')


const fetchList = (params, cb) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard_feeds/list', params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: cb,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_FEEDS_LIST_SUCCESS,
          payload: (action, state, json) => Object.assign(json.data, {
            sorts: params.sorts || '',
            page: params.page
          })
        },
        FETCH_FAILURE
      ]
    }
  }
}

const updateFeed = (params, cb) => {
  const url = params.id ? 'dashboard_feeds/update' : 'dashboard_feeds/add'

  const fetchOptions = getFetchOptions(getApiPath(url), 'POST', {
    body: JSON.stringify(params)
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: cb,
      types: [
        FETCH_REQUEST,
        Symbol('UPDATE_FEED_SUCCESS'),
        FETCH_FAILURE
      ]
    }
  }
}

const deleteFeed = (params, cb) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard_feeds/delete'), 'POST', {
    body: JSON.stringify(params)
  })
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: cb,
      types: [
        FETCH_REQUEST,
        Symbol('DELETE_FEED_SUCCESS'),
        FETCH_FAILURE
      ]
    }
  }
}

const getFeed = (params, cb) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard_feeds/get', params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: cb,
      types: [
        FETCH_REQUEST,
        Symbol('FETCH_FEEDS_ITEM_SUCCESS'),
        FETCH_FAILURE
      ]
    }
  }
}

const addFeed = (params, cb) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard_feeds/add'), 'POST', {
    body: JSON.stringify(params)
  })
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: cb,
      types: [
        FETCH_REQUEST,
        Symbol('ADD_FEED_SUCCESS'),
        FETCH_FAILURE
      ]
    }
  }
}

/*
 @apiVersion 1.0.5
 @api {get} /api/dashboard_feeds/details 获取邮件订阅详情
 @apiGroup  dashboard
 @apiParam query {string} [keyword] 关键字
 @apiParam query {string} [begin_date] 开始时间
 @apiParam query {string} [end_date] 结束时间
 @apiParam query {string} [type] 流程实例类型（订阅）
 @apiParam query {string} [status] 流程实例状态
 @apiParam query {number} page page
 @apiParam query {number} page_size size
 */
const fetchFeedDetails = (params, cb) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard_feeds/details', params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: cb,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_FEEDS_DETAIL_SUCCESS,
          payload: (action, state, json) => Object.assign(json.data, {
            sorts: params.sorts || '',
            page: params.page
          })
        },
        FETCH_FAILURE
      ]
    }
  }
}

const stopFeedItem = (params, cb) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard_feeds/disable'), 'POST', {
    body: JSON.stringify(params)
  })
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: cb,
      types: [
        FETCH_REQUEST,
        {
          type: STOP_FEEDS_ITEM_SUCCESS,
          payload: () => ({
            id: params.flow_id,
            status: '停用'
          })
        },
        FETCH_FAILURE
      ]
    }
  }
}

const startFeedItem = (params, cb) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard_feeds/enable'), 'POST', {
    body: JSON.stringify(params)
  })
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: cb,
      types: [
        FETCH_REQUEST,
        {
          type: START_FEEDS_ITEM_SUCCESS,
          payload: () => ({
            id: params.flow_id,
            status: '启用'
          })
        },
        FETCH_FAILURE
      ]
    }
  }
}

const resendFeed = (params, cb) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard_feeds/retry', params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: cb,
      types: [
        FETCH_REQUEST,
        Symbol('RESEND_FEED_SUCCESS'),
        FETCH_FAILURE
      ]
    }
  }
}

export const actions = {
  fetchList,
  deleteFeed,
  updateFeed,
  getFeed,
  addFeed,
  fetchFeedDetails,
  resendFeed,
  stopFeedItem,
  startFeedItem
}

const initialState = {
  pending: false,

  list: [],
  total: 0,
  page: 1,
  sorts: '',

  detail_list: [],
  detail_total: 0,
  detail_page: 1,
  detail_sorts: ''
}

export default handleActions({
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

  [FETCH_FEEDS_LIST_SUCCESS](state, { payload }) {
    let newList = payload.items;

    if (+payload.page > 1) {
      newList = state.list.concat(payload.items);
    }

    return {
      ...state,
      pending: false,
      list: newList,
      page: +payload.page,
      total: +payload.total,
      sorts: payload.sorts
    }
  },

  [FETCH_FEEDS_DETAIL_SUCCESS](state, { payload }) {
    let newList = payload.items;

    if (+payload.page > 1) {
      newList = state.detail_list.concat(payload.items);
    }

    return {
      ...state,
      pending: false,
      detail_list: newList,
      detail_page: +payload.page,
      detail_total: +payload.total,
      detail_sorts: payload.sorts
    }
  },

  [START_FEEDS_ITEM_SUCCESS](state, { payload }) {
    const newList = state.list.map((item) => {
      if (item.id === payload.id) {
        item.status = payload.status
      }
      return item
    })

    return {
      ...state,
      pending: false,
      list: newList
    }
  },

  [STOP_FEEDS_ITEM_SUCCESS](state, { payload }) {
    const newList = state.list.map((item) => {
      if (item.id === payload.id) {
        item.status = payload.status
      }

      return item
    })
    console.log(newList)
    return {
      ...state,
      pending: false,
      list: newList
    }
  }

}, initialState)
