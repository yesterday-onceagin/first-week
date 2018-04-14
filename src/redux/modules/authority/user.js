import { createAction, handleActions } from 'redux-actions'
import { CALL_API, getJSON, ApiError } from 'redux-api-middleware'

import getApiPath from '../../../helpers/getApiPath'
import getFetchOptions from '../../../helpers/getFetchOptions'

// pending

const FETCH_REQUEST = Symbol('FETCH_REQUEST')
const FETCH_FAILURE = Symbol('FETCH_FAILURE')

const FETCH_USER_LIST_REQUEST = Symbol('FETCH_USER_LIST_REQUEST')
const FETCH_USER_LIST_SUCCESS = Symbol('FETCH_USER_LIST_SUCCESS')
const FETCH_USER_LIST_FAILURE = Symbol('FETCH_USER_LIST_FAILURE')

const CLEAR_USER_LIST = Symbol('CLEAR_USER_LIST')

const FETCH_USER_GROUP_TREE_SUCCESS = Symbol('FETCH_USER_GROUP_TREE_SUCCESS')

export const clearUserList =  createAction(CLEAR_USER_LIST)

// 获取用户列表
export const fetchUserList = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_LIST_REQUEST,
        {
          type: FETCH_USER_LIST_SUCCESS,
          payload: (action, state, json) => ({ ...json.data, page: params.page })
        },
        FETCH_USER_LIST_FAILURE
      ]
    }
  }
}

// 添加用户
export const saveUser = (params, callback) => {
  const url = params.id ? 'user/update' : 'user/add'
  const fetchOptions = getFetchOptions(getApiPath(url), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'SAVE_USER_ITEM_SUCCESS',
          payload: (action, state, json) => (!json.result ? null : {
            ...newUser,
            id: json.data
          })
        },
        FETCH_FAILURE
      ]
    }
  }
}


export const resetUserPassword = (newUser, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/reset_password'), 'POST', {
    body: JSON.stringify(newUser)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'RESET_USER_PASSWORD_SUCCESS',
          payload: (action, state, json) => (!json.result ? null : newUser)
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const deleteUser = (userId, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/delete'), 'POST', {
    body: JSON.stringify({ id: userId })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'DELETE_USER_SUCCESS',
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const fetchUserGroupTree = (callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user_group/tree'));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_USER_GROUP_TREE_SUCCESS,
          payload: (action, state, json) => (!json.result ? [] : json.data)
        },
        FETCH_FAILURE
      ]
    }
  }
}


const initialState = {
  userGroupTree: [],
  pending: false,
  list: [],
  total: 0,
  page: 1
}

export const actions = {
  resetUserPassword,
  saveUser,
  fetchUserList,
  deleteUser,
  fetchUserGroupTree,
  clearUserList,
}

export default handleActions({
  [FETCH_USER_LIST_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },

  [FETCH_USER_LIST_SUCCESS](state, { payload }) {
    const items = payload.items.map(item => Object.assign({}, {
      ...item,
      role_ids: item.roles ? item.roles.map(r => r.role_id) : [],
      role_names: item.roles ? item.roles.map(r => r.role_name) : []
    }))

    const list = payload.page > 1 ? state.list.concat(items) : items.slice();
    
    return {
      ...state,
      list,
      pending: false,
      page: +payload.page,
      total: +payload.total
    }
  },

  [FETCH_USER_LIST_FAILURE](state) {
    return {
      ...state,
      pending: false
    }
  },

  [CLEAR_USER_LIST](state) {
    return {
      ...state,
      list: []
    }
  },

  [FETCH_USER_GROUP_TREE_SUCCESS](state, { payload }) {
    return {
      ...state,
      userGroupTree: convertTree(payload, 'sub')
    }
  }
}, initialState)


// 转化
function convertTree(data, field) {
  for (const j in data) {
    if (data[j].name) {
      data[j].text = data[j].name;
    }
    if (data[j][field]) {
      if (data[j][field].length > 0) {
        data[j].children = data[j][field];
      }
      convertTree(data[j][field], field)
    }
  }
  return data
}
