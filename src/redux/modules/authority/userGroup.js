import { createAction, handleActions } from 'redux-actions'
import { CALL_API, getJSON, ApiError } from 'redux-api-middleware'

import getApiPath from '../../../helpers/getApiPath';
import getFetchOptions from '../../../helpers/getFetchOptions';

import {
  treeFormat,
  addTreeNodeByPath,
  deleteTreeNodeByPath,
  updateTreeNodeByPath
} from '../../../helpers/groupTreeUtils';

// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */

// 触发用户组相关请求的pending
const FETCH_USER_GROUP_REQUEST = Symbol('FETCH_USER_GROUP_REQUEST');
const FETCH_USER_GROUP_FAILURE = Symbol('FETCH_USER_GROUP_FAILURE');

// 获取用户组树
const FETCH_USER_GROUP_TREE_SUCCESS = Symbol('FETCH_USER_GROUP_TREE_SUCCESS');
// 添加用户组
const FETCH_ADD_USER_GROUP_SUCCESS = Symbol('FETCH_ADD_USER_GROUP_SUCCESS');
// 修改用户组信息
const FETCH_UPDATE_USER_GROUP_SUCCESS = Symbol('FETCH_UPDATE_USER_GROUP_SUCCESS');
// 删除用户组
const FETCH_DELETE_USER_GROUP_SUCCESS = Symbol('FETCH_DELETE_USER_GROUP_SUCCESS');

const FETCH_UN_GROUP_USER_REQUEST = Symbol('FETCH_UN_GROUP_USER_REQUEST')
const FETCH_UN_GROUP_USER_SUCCESS = Symbol('FETCH_UN_GROUP_USER_SUCCESS')
const FETCH_UN_GROUP_USER_FAILURE = Symbol('FETCH_UN_GROUP_USER_FAILURE')

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
      types: [
        FETCH_USER_GROUP_REQUEST,
        {
          type: FETCH_USER_GROUP_TREE_SUCCESS,
          payload: (action, state, json) => (!json.result ? [] : json.data)
        },
        FETCH_USER_GROUP_FAILURE
      ]
    }
  }
}

// 添加用户组
export const fetchAddUserGroup = (newGroup, callback) => {
  // 分离parent_path和需要提交的data
  const { parent_path, ...data } = newGroup;

  const fetchOptions = getFetchOptions(getApiPath('user_group/add'), 'POST', {
    body: JSON.stringify(data)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_GROUP_REQUEST,
        {
          type: FETCH_ADD_USER_GROUP_SUCCESS,
          payload: (action, state, json) => (!json.result ? null : {
            ...data,
            parent_path,
            id: json.data
          })
        },
        FETCH_USER_GROUP_FAILURE
      ]
    }
  }
}

// 修改用户组信息
export const fetchUpdateUserGroup = (groupData, callback) => {
  const { level, path, ...data } = groupData;

  const fetchOptions = getFetchOptions(getApiPath('user_group/update'), 'POST', {
    body: JSON.stringify(data)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_GROUP_REQUEST,
        {
          type: FETCH_UPDATE_USER_GROUP_SUCCESS,
          payload: (action, state, json) => (json.result ? { ...data, level, path } : null)
        },
        FETCH_USER_GROUP_FAILURE
      ]
    }
  }
}

// 删除用户组
export const fetchDeleteUserGroup = (group, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user_group/delete'), 'POST', {
    body: JSON.stringify({ id: group.id })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_GROUP_REQUEST,
        {
          type: FETCH_DELETE_USER_GROUP_SUCCESS,
          payload: (action, state, json) => (json.result ? group : null)
        },
        FETCH_USER_GROUP_FAILURE
      ]
    }
  }
}

export const saveUserGroupRoles = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/group/add-roles'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST',
        {
          type: 'SAVE_USER_GROUP_ROLES_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

export const fetchGroupRoles = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/group/roles', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST',
        {
          type: 'FETCH_GROUP_ROLES_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

export const deleteGroupUser = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/user/group', params), 'DELETE');

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST',
        {
          type: 'DELETE_GROUP_USER_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

export const fetchUnGroupUser = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/list', params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_UN_GROUP_USER_REQUEST,
        {
          type: FETCH_UN_GROUP_USER_SUCCESS,
          payload: (action, state, json) => ({ ...json.data, page: params.page })
        },
        FETCH_UN_GROUP_USER_FAILURE
      ]
    }
  }
}

export const addGroupUser = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/users/update-group'), 'POST', {
    body: JSON.stringify(params)
  })
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST',
        {
          type: 'ADD_GROUP_USER_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}


/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchUserGroupTree,                               // 获取用户组树
  fetchAddUserGroup,                                // 添加用户组
  fetchUpdateUserGroup,                             // 修改用户组信息
  fetchDeleteUserGroup,                             // 删除用户组
  fetchGroupRoles,
  fetchUnGroupUser,
  saveUserGroupRoles,                               // 保存和编辑用户组的角色
  deleteGroupUser,
  addGroupUser
}

// ------------------------------------
// Reducers
// ------------------------------------

const initialState = {
  pending: false,
  userGroupTree: [],
  un_group_pending: false,
  un_group_page: 1,
  un_group_list: [],
  un_group_total: 0
}


export default handleActions({
  // 触发用户组相关请求的pending
  [FETCH_USER_GROUP_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },
  [FETCH_USER_GROUP_FAILURE](state) {
    return {
      ...state,
      pending: false
    }
  },

  // 获取用户组树
  [FETCH_USER_GROUP_TREE_SUCCESS](state, action) {
    const newList = treeFormat(action.payload, 0, []);
    return {
      ...state,
      userGroupTree: newList,
      pending: false
    }
  },

  // 添加用户组
  [FETCH_ADD_USER_GROUP_SUCCESS](state, action) {
    if (action.payload) {
      const { parent_path, ...groupData } = action.payload;
      const newList = state.userGroupTree.concat();

      addTreeNodeByPath(newList, groupData, parent_path.slice());

      return {
        ...state,
        userGroupTree: newList,
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  // 修改用户组信息
  [FETCH_UPDATE_USER_GROUP_SUCCESS](state, action) {
    if (action.payload) {
      const newList = state.userGroupTree.concat();

      updateTreeNodeByPath(newList, action.payload, action.payload.path.slice());

      return {
        ...state,
        userGroupTree: newList,
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  // 删除用户组
  [FETCH_DELETE_USER_GROUP_SUCCESS](state, action) {
    if (action.payload) {
      const newList = state.userGroupTree.concat();

      deleteTreeNodeByPath(newList, action.payload.path.slice());

      return {
        ...state,
        userGroupTree: treeFormat(newList, 0, []),
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  [FETCH_UN_GROUP_USER_REQUEST](state) {
    return {
      ...state,
      un_group_pending: true
    }
  },

  [FETCH_UN_GROUP_USER_SUCCESS](state, { payload }) {
    const list = +payload.page === 1 ? payload.items : state.un_group_list.concat(payload.items)
    return {
      ...state,
      un_group_pending: false,
      un_group_total: +payload.total,
      un_group_page: +payload.page,
      un_group_list: list || []
    }
  },

  [FETCH_UN_GROUP_USER_FAILURE](state) {
    return {
      ...state,
      un_group_pending: false
    }
  }

}, initialState);
