import { createAction, handleActions } from 'redux-actions'
import { CALL_API, getJSON, ApiError } from 'redux-api-middleware'

import getApiPath from '../../../helpers/getApiPath'
import getFetchOptions from '../../../helpers/getFetchOptions'

// pending
const FETCH_REQUEST = Symbol('FETCH_REQUEST')
const FETCH_FAILURE = Symbol('FETCH_FAILURE')

const FETCH_ROLE_LIST_REQUEST = Symbol('FETCH_ROLE_LIST_REQUEST')
const FETCH_ROLE_LIST_SUCCESS = Symbol('FETCH_ROLE_LIST_SUCCESS')
const FETCH_ROLE_LIST_FAILURE = Symbol('FETCH_ROLE_LIST_FAILURE')

const FETCH_AUTH_LIST_REQUEST = Symbol('FETCH_AUTH_LIST_REQUEST')
const FETCH_AUTH_LIST_SUCCESS = Symbol('FETCH_AUTH_LIST_SUCCESS')
const FETCH_AUTH_LIST_FAILURE = Symbol('FETCH_AUTH_LIST_FAILURE')

const FETCH_ROLE_USER_REQUEST = Symbol('FETCH_ROLE_USER_REQUEST')
const FETCH_ROLE_USER_SUCCESS = Symbol('FETCH_ROLE_USER_SUCCESS')
const FETCH_ROLE_USER_FAILURE = Symbol('FETCH_ROLE_USER_FAILURE')

const FETCH_UN_ROLE_USER_REQUEST = Symbol('FETCH_UN_ROLE_USER_REQUEST')
const FETCH_UN_ROLE_USER_SUCCESS = Symbol('FETCH_UN_ROLE_USER_SUCCESS')
const FETCH_UN_ROLE_USER_FAILURE = Symbol('FETCH_UN_ROLE_USER_FAILURE')


export const fetchRoleList = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/roles', params))

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_ROLE_LIST_REQUEST,
        {
          type: FETCH_ROLE_LIST_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_ROLE_LIST_FAILURE
      ]
    }
  }
}

// 更新 role Item
export const saveRoleItem = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/roles'), 'PUT', {
    body: JSON.stringify(params)
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'SAVE_ROLE_ITEM_SUCCESS',
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const deleteRole = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath(`rbac/roles/${id}`), 'DELETE')

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'DELETE_ROLE_ITEM_SUCCESS',
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 获取权限列表
export const fetchAuthList = (callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/funcs'))

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_AUTH_LIST_REQUEST,
        {
          type: FETCH_AUTH_LIST_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_AUTH_LIST_FAILURE
      ]
    }
  }
}

// 获取角色用户
export const fetchRoleUser = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/role/users', params))

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_ROLE_USER_REQUEST,
        {
          type: FETCH_ROLE_USER_SUCCESS,
          payload: (action, state, json) => Object.assign({}, { ...json.data, page: params.page })
        },
        FETCH_ROLE_USER_FAILURE
      ]
    }
  }
}

// 获取角色用户
export const fetchRoleAuth = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/role/funcs', params))

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'FETCH_ROLE_AUTH_SUCCESS',
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}


// 获取 剩余未 设置的 用户
export const fetchUnRoleUser = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/role/users', params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_UN_ROLE_USER_REQUEST,
        {
          type: FETCH_UN_ROLE_USER_SUCCESS,
          payload: (action, state, json) => Object.assign({}, { ...json.data, page: params.page })
        },
        FETCH_UN_ROLE_USER_FAILURE
      ]
    }
  }
}

export const deleteRoleUser = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/delete-role', params), 'DELETE')

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'DELETE_ROLE_USER_SUCCESS',
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const addRoleUser = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/add-roles'), 'POST', {
    body: JSON.stringify(params)
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'ADD_ROLE_USER_SUCCESS',
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const saveRoleAuth = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/grant/role/funcs'), 'POST', {
    body: JSON.stringify(params)
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'SAVE_ROLE_AUTH_SUCCESS',
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}


const initialState = {
  pending: false,
  roleList: [],
  authList: [],
  auth_pending: false,
  user_pending: false,
  role_user: [],
  total: 0,
  page: 1,
  un_role_user: [],       // 获取没有在角色内的用户
  un_user_pending: false,
  un_total: 0,
  un_page: 1
}

export const actions = {
  fetchRoleList,
  fetchAuthList,
  fetchRoleUser,
  fetchRoleAuth,
  fetchUnRoleUser,
  deleteRoleUser,
  deleteRole,
  addRoleUser,
  saveRoleItem,
  saveRoleAuth
}

export default handleActions({
  [FETCH_ROLE_LIST_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },

  [FETCH_ROLE_LIST_FAILURE](state) {
    return {
      ...state,
      pending: false
    }
  },

  [FETCH_ROLE_LIST_SUCCESS](state, { payload }) {
    const LOCK_ROLE_ID = [
      '00000001-0000-0000-0000-000000000001',
      '39e47d2d-3f20-d160-776e-9db51a51eaee',
      '39e47d2d-3f20-422b-94c9-e286d7190967',
      '39e47d2d-3f20-d160-776e-1db51a51ea33'
    ]

    let newRoleList = payload.items

    if (payload.items.length > 0) {
      const customer_roleList = payload.items.filter(item => LOCK_ROLE_ID.indexOf(item.id) > -1)
      const un_customer_roleList = payload.items.filter(item => LOCK_ROLE_ID.indexOf(item.id) === -1)
      // 添加排序字段
      const sort_customer_roleList = customer_roleList.map(item => ({
        ...item,
        rank: LOCK_ROLE_ID.indexOf(item.id)
      }))

      // 排序
      sort_customer_roleList.sort((a, b) => a.rank - b.rank)

      newRoleList = sort_customer_roleList.concat(un_customer_roleList)
    }

    return {
      ...state,
      pending: false,
      roleList: newRoleList || []
    }
  },


  [FETCH_AUTH_LIST_REQUEST](state) {
    return {
      ...state,
      auth_pending: true
    }
  },

  [FETCH_AUTH_LIST_SUCCESS](state, { payload }) {
    return {
      ...state,
      auth_pending: false,
      authList: payload
    }
  },

  [FETCH_AUTH_LIST_FAILURE](state) {
    return {
      ...state,
      auth_pending: false
    }
  },

  [FETCH_ROLE_USER_REQUEST](state) {
    return {
      ...state,
      user_pending: true
    }
  },

  [FETCH_ROLE_USER_SUCCESS](state, { payload }) {
    return {
      ...state,
      role_user: payload.items || [],
      total: payload.total,
      page: payload.page,
      user_pending: false
    }
  },

  [FETCH_ROLE_USER_FAILURE](state) {
    return {
      ...state,
      user_pending: false
    }
  },

  [FETCH_UN_ROLE_USER_REQUEST](state) {
    return {
      ...state,
      un_user_pending: true
    }
  },

  [FETCH_UN_ROLE_USER_SUCCESS](state, { payload }) {
    const list = payload.page === 1 ? payload.items : state.un_role_user.concat(payload.items)
    return {
      ...state,
      un_role_user: list || [],
      un_total: payload.total,
      un_page: payload.page,
      un_user_pending: false
    }
  },

  [FETCH_UN_ROLE_USER_FAILURE](state) {
    return {
      ...state,
      un_user_pending: false
    }
  }

}, initialState)
