import { createAction, handleActions } from 'redux-actions'
import { CALL_API, getJSON, ApiError } from 'redux-api-middleware'

import getApiPath from '../../../helpers/getApiPath';
import getFetchOptions from '../../../helpers/getFetchOptions';

import {
  treeFormat,
  addTreeNodeByPath,
  deleteTreeNodeByPath,
  updateTreeNodeByPath,
  getTreeNodeByPath,
  getArrayFromTree
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
// 触发机构pending
const FETCH_USER_ORGAN_REQUEST = Symbol('FETCH_USER_ORGAN_REQUEST');
const FETCH_USER_ORGAN_FAILURE = Symbol('FETCH_USER_ORGAN_FAILURE');
// 触发访问权限pending
const FETCH_USER_FUNC_REQUEST = Symbol('FETCH_USER_FUNC_REQUEST');
const FETCH_USER_FUNC_FAILURE = Symbol('FETCH_USER_FUNC_FAILURE');
// 获取用户组树
const FETCH_USER_GROUP_TREE_SUCCESS = Symbol('FETCH_USER_GROUP_TREE_SUCCESS');
// 添加用户组
const FETCH_ADD_USER_GROUP_SUCCESS = Symbol('FETCH_ADD_USER_GROUP_SUCCESS');
// 修改用户组信息
const FETCH_UPDATE_USER_GROUP_SUCCESS = Symbol('FETCH_UPDATE_USER_GROUP_SUCCESS');
// 删除用户组
const FETCH_DELETE_USER_GROUP_SUCCESS = Symbol('FETCH_DELETE_USER_GROUP_SUCCESS');
// 获取用户组下机构树
const FETCH_USER_GROUP_ORGAN_SUCCESS = Symbol('FETCH_USER_GROUP_ORGAN_SUCCESS');
// 获取用户组下机构树（编辑用）
const FETCH_USER_GROUP_EDITABLE_ORGAN_SUCCESS = Symbol('FETCH_USER_GROUP_EDITABLE_ORGAN_SUCCESS');
// 设置用户组下机构树
const FETCH_UPDATE_USER_GROUP_ORGAN_SUCCESS = Symbol('FETCH_UPDATE_USER_GROUP_ORGAN_SUCCESS');
// 获取用户组下菜单权限
const FETCH_USER_GROUP_FUNC_SUCCESS = Symbol('FETCH_USER_GROUP_FUNC_SUCCESS');
// 获取用户组下菜单权限（编辑用）
const FETCH_USER_GROUP_EDITABLE_FUNC_SUCCESS = Symbol('FETCH_USER_GROUP_EDITABLE_FUNC_SUCCESS');
// 设置用户组下菜单权限
const FETCH_UPDATE_USER_GROUP_FUNC_SUCCESS = Symbol('FETCH_UPDATE_USER_GROUP_FUNC_SUCCESS');
// 访问权限树的选中
const SELECT_FUNC_TREE_NODE_SUCCESS = Symbol('SELECT_FUNC_TREE_NODE_SUCCESS');
// 机构权限树的选中
const SELECT_ORGAN_TREE_NODE_SUCCESS = Symbol('SELECT_ORGAN_TREE_NODE_SUCCESS');
// 机构权限树的搜索
const FILTER_ORGAN_TREE_BY_KEYWORD = Symbol('FILTER_ORGAN_TREE_BY_KEYWORD');

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

// 获取用户组下机构树
export const fetchUserGroupOrgan = (group_id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user_group/organ_tree', { id: group_id }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_ORGAN_REQUEST,
        {
          type: FETCH_USER_GROUP_ORGAN_SUCCESS,
          payload: (action, state, json) => (json.result ? json.data : null)
        },
        FETCH_USER_ORGAN_FAILURE
      ]
    }
  }
}

// 获取用户组下机构树（编辑用）
export const fetchUserEditableGroupOrgan = (group_id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user_group/editable_organ_tree', { id: group_id }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_ORGAN_REQUEST,
        {
          type: FETCH_USER_GROUP_EDITABLE_ORGAN_SUCCESS,
          payload: (action, state, json) => (json.result ? json.data : null)
        },
        FETCH_USER_ORGAN_FAILURE
      ]
    }
  }
}

// 设置用户组下机构树
export const fetchUpdateUserGroupOrgan = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user_group/organ'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_ORGAN_REQUEST,
        {
          type: FETCH_UPDATE_USER_GROUP_ORGAN_SUCCESS,
          payload: (action, state, json) => (json.result ? params : null)
        },
        FETCH_USER_ORGAN_FAILURE
      ]
    }
  }
}

// 获取用户组下菜单权限
export const fetchUserGroupFunc = (group_id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user_group/func_tree', { id: group_id }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_FUNC_REQUEST,
        {
          type: FETCH_USER_GROUP_FUNC_SUCCESS,
          payload: (action, state, json) => (json.result ? json.data : null)
        },
        FETCH_USER_FUNC_FAILURE
      ]
    }
  }
}

// 获取用户组下菜单权限（编辑用）
export const fetchUserEditableGroupFunc = (group_id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user_group/editable_func_tree', { id: group_id }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_FUNC_REQUEST,
        {
          type: FETCH_USER_GROUP_EDITABLE_FUNC_SUCCESS,
          payload: (action, state, json) => (json.result ? json.data : null)
        },
        FETCH_USER_FUNC_FAILURE
      ]
    }
  }
}

// 设置用户组下菜单权限
export const fetchUpdateUserGroupFunc = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user_group/func'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_FUNC_REQUEST,
        {
          type: FETCH_UPDATE_USER_GROUP_FUNC_SUCCESS,
          payload: (action, state, json) => (json.result ? params : null)
        },
        FETCH_USER_FUNC_FAILURE
      ]
    }
  }
}


// 访问权限树的选中
export const selectFuncTreeNode = createAction(SELECT_FUNC_TREE_NODE_SUCCESS);

// 机构权限树的选中
export const selectOrganTreeNode = createAction(SELECT_ORGAN_TREE_NODE_SUCCESS);

// 机构权限树的搜索
export const filterOrganTreeByKeyword = createAction(FILTER_ORGAN_TREE_BY_KEYWORD);


/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchUserGroupTree,                               // 获取用户组树
  fetchAddUserGroup,                                // 添加用户组
  fetchUpdateUserGroup,                             // 修改用户组信息
  fetchDeleteUserGroup,                             // 删除用户组
  fetchUserGroupOrgan,                              // 获取用户组下机构树
  fetchUserEditableGroupOrgan,                      // 获取用户组下机构树（编辑用）
  fetchUpdateUserGroupOrgan,                        // 设置用户组下机构树
  fetchUserGroupFunc,                               // 获取用户组下菜单权限
  fetchUserEditableGroupFunc,                       // 获取用户组下菜单权限（编辑用）
  fetchUpdateUserGroupFunc,                         // 设置用户组下菜单权限
  selectFuncTreeNode,                               // 访问权限树的选中
  selectOrganTreeNode,                              // 机构权限树的选中
  filterOrganTreeByKeyword,                         // 机构权限树的搜索
}

// ------------------------------------
// Reducers
// ------------------------------------

const initialState = {
  pending: false,
  userGroupTree: [],
  organ_pending: false,
  userOrganTree: [],
  userEditableOrganTree: [],
  func_pending: false,
  userFuncTree: [],
  userEditableFuncTree: []
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

  // 触发机构pending
  [FETCH_USER_ORGAN_REQUEST](state) {
    return {
      ...state,
      organ_pending: true
    }
  },
  [FETCH_USER_ORGAN_FAILURE](state) {
    return {
      ...state,
      organ_pending: false
    }
  },

  // 触发访问权限pending
  [FETCH_USER_FUNC_REQUEST](state) {
    return {
      ...state,
      func_pending: true
    }
  },
  [FETCH_USER_FUNC_FAILURE](state) {
    return {
      ...state,
      func_pending: false
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

  // 获取用户组下机构树
  [FETCH_USER_GROUP_ORGAN_SUCCESS](state, { payload }) {
    if (payload) {
      const leafs = [];
      const newList = treeFormat(payload, 0, [], leafs);
      // 过滤出已选择的叶子节点，并为其父级设置展开状态
      leafs
        .filter(item => !item.disable)
        .map(item => setTreeSpreadStatus(newList, item));

      return {
        ...state,
        userOrganTree: newList,
        organ_pending: false
      };
    }
    return {
      ...state,
      userOrganTree: [],
      organ_pending: false
    };
  },

  // 获取用户组下机构树（编辑用）
  [FETCH_USER_GROUP_EDITABLE_ORGAN_SUCCESS](state, { payload }) {
    if (payload) {
      const leafs = [];
      const newList = treeFormat(payload, 0, [], leafs);
      // 过滤出已选择的叶子节点，并为其父级设置展开状态
      leafs
        .filter(item => item.selected)
        .map(item => setTreeSpreadStatus(newList, item));

      return {
        ...state,
        userEditableOrganTree: newList,
        organ_pending: false
      };
    }
    return {
      ...state,
      userEditableOrganTree: [],
      organ_pending: false
    };
  },

  // 设置用户组下机构树
  [FETCH_UPDATE_USER_GROUP_ORGAN_SUCCESS](state) {
    return {
      ...state,
      organ_pending: false
    };
  },

  // 获取用户组下菜单权限
  [FETCH_USER_GROUP_FUNC_SUCCESS](state, { payload }) {
    if (payload) {
      const leafs = [];

      payload = payload.map((app) => {
        app.sub = Array.isArray(app.function) && app.function.length > 0 ? app.function.concat() : [];
        return app;
      });

      const newList = treeFormat(payload, 0, [], leafs);
      // 过滤出已选择的叶子节点，并为其父级设置展开状态
      leafs
        .filter(item => !item.disable)
        .map(item => setTreeSpreadStatus(newList, item));

      return {
        ...state,
        userFuncTree: newList,
        func_pending: false
      };
    }
    return {
      ...state,
      userFuncTree: [],
      func_pending: false
    };
  },

  // 获取用户组下菜单权限（编辑用）
  [FETCH_USER_GROUP_EDITABLE_FUNC_SUCCESS](state, { payload }) {
    if (payload) {
      const leafs = [];

      payload = payload.map((app) => {
        app.sub = Array.isArray(app.function) && app.function.length > 0 ? app.function.concat() : [];
        return app;
      });

      const newList = treeFormat(payload, 0, [], leafs);
      // 过滤出已选择的叶子节点，并为其父级设置展开状态
      leafs
        .filter(item => item.selected)
        .map(item => setTreeSpreadStatus(newList, item));

      return {
        ...state,
        userEditableFuncTree: newList,
        func_pending: false
      };
    }
    return {
      ...state,
      userEditableFuncTree: [],
      func_pending: false
    };
  },

  // 设置用户组下菜单权限
  [FETCH_UPDATE_USER_GROUP_FUNC_SUCCESS](state) {
    return {
      ...state,
      func_pending: false
    };
  },

  // 访问权限树的选中
  [SELECT_FUNC_TREE_NODE_SUCCESS](state, { payload }) {
    const newList = state.userEditableFuncTree.concat();

    funcTreeNodeSelect(newList, payload);

    return {
      ...state,
      userEditableFuncTree: newList
    };
  },

  // 机构权限树的选中
  [SELECT_ORGAN_TREE_NODE_SUCCESS](state, { payload }) {
    const newList = state.userEditableOrganTree.concat();

    funcTreeNodeSelect(newList, payload);

    return {
      ...state,
      userEditableOrganTree: newList
    };
  },

  // 机构权限树的搜索
  [FILTER_ORGAN_TREE_BY_KEYWORD](state, { payload }) {
    const newList = setNodeHideStatusByKeyword(state.userEditableOrganTree.concat(), payload);

    return {
      ...state,
      userEditableOrganTree: newList
    }
  },
}, initialState);


// 遍历访问权限（编辑）树，进行选中操作
function funcTreeNodeSelect(treeArr, selectNode) {
  // 设置状态
  if (selectNode.selected === true) {
    selectNode.selected = false;
  } else {
    selectNode.selected = true;
  }

  updateTreeNodeByPath(treeArr, selectNode, selectNode.path.slice());

  return treeArr;
}

// 向下遍历所有子节点并设置选中状态
function setAllSubSelectState(node, nextSeletStatus) {
  node.sub = node.sub.map((item) => {
    item.selected = nextSeletStatus;
    if (Array.isArray(item.sub) && item.sub.length > 0) {
      item = setAllSubSelectState(item, nextSeletStatus);
    }
    return item;
  });
  return node;
}

// 向上遍历树结构的SELECTED状态
function setTreeSelectStatus(treeArr, node) {
  if (node.parent_id) {
    const parent_path = node.path.slice(0, -1);
    const parentNode = getTreeNodeByPath(treeArr, parent_path.slice());

    // 若父节点的所有子节点的selected值均为true 则设置父节点为全选
    if (parentNode.sub.every(item => item.selected === true)) {
      parentNode.selected = true;
      updateTreeNodeByPath(treeArr, parentNode, parent_path.slice());
    // 若父节点中存在selected值不为false的子节点 则设置父节点为部分选择
    } else if (parentNode.sub.some(item => item.selected)) {
      parentNode.selected = 'not-all';
      updateTreeNodeByPath(treeArr, parentNode, parent_path.slice());
    }
    // 继续检查父节点
    setTreeSelectStatus(treeArr, parentNode);
  }
}


// 向上遍历需要展开的节点
function setTreeSpreadStatus(treeArr, node) {
  if (node.parent_id) {
    const parent_path = node.path.slice(0, -1);
    const parentNode = getTreeNodeByPath(treeArr, parent_path.slice());

    if (parentNode.sub.some(item => item.selected || !item.disable || item.init_spread)) {
      parentNode.init_spread = true;
      updateTreeNodeByPath(treeArr, parentNode, parent_path.slice());
    }
    // 继续检查父节点
    setTreeSpreadStatus(treeArr, parentNode);
  }
}

// 根据关键字过滤树
function setNodeHideStatusByKeyword(treeArr, keyword) {
  keyword = keyword.trim();

  const newTree = setTreeNodeHiddenStatus(treeArr, keyword);

  // 如果关键字为空 直接返回结果 跳过过滤计算
  if (!keyword) {
    return newTree;
  }

  const newList = getArrayFromTree(newTree).filter(item => !item.hidden);

  // 向上检查需要显示的节点父级是否hidden
  newList.map(node => setNodeParentHideStatus(newTree, node));

  // 向下检查所有节点的子节点是否有权限并将其显示
  newList.map((node) => {
    if (Array.isArray(node.sub) && node.sub.length > 0) {
      node.sub = setTreeSelectedShow(node.sub);
      updateTreeNodeByPath(newTree, node, node.path.slice());
    }
  });

  // 向下检查是否子节点均被过滤
  newList.map((node) => {
    if (Array.isArray(node.sub) && node.sub.length > 0) {
      let _node = getTreeNodeByPath(newTree, node.path.slice());
      _node = setTreeNodeAllSubHide(_node);
      updateTreeNodeByPath(newTree, _node, _node.path.slice());
    }
  });

  return newTree;
}

// 向上检查需要显示的节点父级是否hidden
function setNodeParentHideStatus(treeArr, node) {
  if (node.parent_id) {
    const parent_path = node.path.slice(0, -1);

    const parentNode = getTreeNodeByPath(treeArr, parent_path.slice());

    if (parentNode.hidden) {
      parentNode.hidden = false;
      updateTreeNodeByPath(treeArr, parentNode, parent_path.slice());
    }
    // 继续检查父节点
    setNodeParentHideStatus(treeArr, parentNode);
  }
}

// 根据关键字为树的各节点设置hidden属性
function setTreeNodeHiddenStatus(treeArr, keyword) {
  return treeArr.map((node) => {
    node.hidden = !new RegExp(keyword, 'g').test(node.name);
    node.all_sub_hidden = false;
    if (Array.isArray(node.sub) && node.sub.length > 0) {
      node.sub = setTreeNodeHiddenStatus(node.sub, keyword);
    }

    return node;
  });
}

// 向下检查并设置显示子级的节点
function setTreeSelectedShow(treeArr) {
  return treeArr.map((item) => {
    if (!item.disable && item.hidden) {
      item.hidden = false;
    }
    if (Array.isArray(item.sub) && item.sub.length > 0) {
      if (item.sub.some(s => !s.disable)) {
        item.hidden = false;
      }
      item.sub = setTreeSelectedShow(item.sub);
    }
    return item;
  });
}

// 向下检查是否存在所有子节点都被隐藏的情况
function setTreeNodeAllSubHide(node) {
  if (Array.isArray(node.sub) && node.sub.length > 0) {
    if (node.sub.every(item => item.hidden)) {
      node.all_sub_hidden = true;
    }
    node.sub = node.sub.map(item => setTreeNodeAllSubHide(item));
  }

  return node;
}
