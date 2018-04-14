import { createAction, handleActions } from 'redux-actions';
import { CALL_API, getJSON, ApiError } from 'redux-api-middleware';

import { arrayMove } from 'react-sortable-hoc';

import getApiPath from '../../../helpers/getApiPath';
import getFetchOptions from '../../../helpers/getFetchOptions';

// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */

// 触发pending的请求
const FETCH_REQUEST = Symbol('FETCH_REQUEST');
const FETCH_FAILURE = Symbol('FETCH_FAILURE');

// 触发listPending
const FETCH_LIST_REQUEST = Symbol('FETCH_LIST_REQUEST');
const FETCH_LIST_FAILURE = Symbol('FETCH_LIST_FAILURE');

// 获取应用列表
const FETCH_APPLICATION_LIST_SUCCESS = Symbol('FETCH_APPLICATION_LIST_SUCCESS');
// 添加应用
const FETCH_ADD_APPLICATION_SUCCESS = Symbol('FETCH_ADD_APPLICATION_SUCCESS');
// 修改应用
const FETCH_UPDATE_APPLICATION_SUCCESS = Symbol('FETCH_UPDATE_APPLICATION_SUCCESS');
// 启用/禁用应用
const FETCH_CHANGE_APPLICATION_ENABLE_SUCCESS = Symbol('FETCH_CHANGE_APPLICATION_ENABLE_SUCCESS');
// 删除应用
const FETCH_DELETE_APPLICATION_SUCCESS = Symbol('FETCH_DELETE_APPLICATION_SUCCESS');
// 修改应用排序
const FETCH_CHANGE_APPLICATION_RANK_SUCCESS = Symbol('FETCH_CHANGE_APPLICATION_RANK_SUCCESS');
// 获取应用详情
const FETCH_APPLICATION_DETAIL_SUCCESS = Symbol('FETCH_APPLICATION_DETAIL_SUCCESS');
// 获取应用下的菜单树
const FETCH_MENU_TREE_SUCCESS = Symbol('FETCH_MENU_TREE_SUCCESS');
// 获取单个菜单项
const FETCH_MENU_DETAIL_SUCCESS = Symbol('FETCH_MENU_DETAIL_SUCCESS');
// 添加应用菜单
const FETCH_ADD_MENU_SUCCESS = Symbol('FETCH_ADD_MENU_SUCCESS');
// 修改应用菜单
const FETCH_UPDATE_MENU_SUCCESS = Symbol('FETCH_UPDATE_MENU_SUCCESS');
// 删除应用菜单
const FETCH_DELETE_MENU_SUCCESS = Symbol('FETCH_DELETE_MENU_SUCCESS');
// 修改应用菜单排序
const FETCH_CHANGE_MENU_RANK_SUCCESS = Symbol('FETCH_CHANGE_MENU_RANK_SUCCESS');
// 获取报告树
const FETCH_DASHBOARD_TREE_SUCCESS = Symbol('FETCH_DASHBOARD_TREE_SUCCESS');

// 清除应用数据/菜单数据
const CLEAR_APPLICATION_DATA_SUCCESS = Symbol('CLEAR_APPLICATION_DATA_SUCCESS');

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

// 获取应用列表
export const fetchApplicationList = (params, callback) => {
  if (!params.page) {
    params.page = 1;
  }
  const fetchOptions = getFetchOptions(getApiPath('app_menu/app/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_LIST_REQUEST,
        {
          type: FETCH_APPLICATION_LIST_SUCCESS,
          payload: (action, state, json) => (json.result ? {
            ...json.data,
            page: 1
          } : null)
        },
        FETCH_LIST_FAILURE
      ]
    }
  };
};

// 添加应用
export const fetchAddApplication = (newApplication, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('app_menu/app/add'), 'POST', {
    body: JSON.stringify(newApplication)
  });

  return  {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_ADD_APPLICATION_SUCCESS,
          payload: (action, state, json) => (json.result ? {
            id: json.data,
            description: '',
            enable: 0,
            icon: '',
            is_buildin: 0,
            name: '',
            ...newApplication
          } : null)
        },
        FETCH_FAILURE
      ]
    }
  };
};

// 修改应用
export const fetchUpdateApplication = (newApplication, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('app_menu/app/update'), 'POST', {
    body: JSON.stringify(newApplication)
  });

  return  {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_UPDATE_APPLICATION_SUCCESS,
          payload: (action, state, json) => (json.result ? newApplication : null)
        },
        FETCH_FAILURE
      ]
    }
  };
};

// 启用/禁用应用
export const fetchChangeApplicationEnable = (id, enable, callback) => {
  const fetchOptions = getFetchOptions(getApiPath(`app_menu/app/${enable ? 'enable' : 'disable'}`), 'POST', {
    body: JSON.stringify({ id })
  });

  return  {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_CHANGE_APPLICATION_ENABLE_SUCCESS,
          payload: (action, state, json) => (json.result ? {
            id,
            enable
          } : null)
        },
        FETCH_FAILURE
      ]
    }
  };
}

// 删除应用
export const fetchDeleteApplication = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('app_menu/app/delete'), 'POST', {
    body: JSON.stringify({ id })
  });

  return  {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_DELETE_APPLICATION_SUCCESS,
          payload: (action, state, json) => (json.result ? id : null)
        },
        FETCH_FAILURE
      ]
    }
  };
};

// 修改应用排序
export const fetchChangeApplicationRank = (params, callback) => {
  const { source_id, target_id, oldIndex, newIndex } = params;

  const fetchOptions = getFetchOptions(getApiPath('app_menu/app/update_rank'), 'POST', {
    body: JSON.stringify({ source_id, target_id })
  });

  return  {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_CHANGE_APPLICATION_RANK_SUCCESS,
          payload: (action, state, json) => (json.result ? {
            oldIndex,
            newIndex
          } : null)
        },
        FETCH_FAILURE
      ]
    }
  };
};

// 获取应用详情
export const fetchApplicationDetail = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('app_menu/app/get', { id }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_APPLICATION_DETAIL_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  };
};

// 获取应用门户(包含应用菜单)
export const fetchApplication = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('app_menu/app/get', {
    id,
    list_func: 1
  }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST',
        'FETCH_SUCCESS',
        'FETCH_FAILURE'
      ]
    }
  };
};

// 获取应用下的菜单树
export const fetchMenuTree = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('app_menu/func/tree', { application_id: id }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_LIST_REQUEST,
        {
          type: FETCH_MENU_TREE_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_LIST_FAILURE
      ]
    }
  };
}

// 获取单个菜单项
export const fetchMenuDetail = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('app_menu/func/get', { id }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_MENU_DETAIL_SUCCESS,
          payload: (action, state, json) => (json.result ? json.data : null)
        },
        FETCH_FAILURE
      ]
    }
  };
}

// 添加应用菜单
export const fetchAddMenu = (newMenu, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('app_menu/func/add'), 'POST', {
    body: JSON.stringify(newMenu)
  });

  return  {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_ADD_MENU_SUCCESS,
          payload: (action, state, json) => (json.result ? {
            id: json.data,
            parent_id: '',
            sub: [],
            target: '',
            url: '',
            icon: '',
            ...newMenu
          } : null)
        },
        FETCH_FAILURE
      ]
    }
  };
}

// 修改应用菜单                          
export const fetchUpdateMenu = (newMenu, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('app_menu/func/update'), 'POST', {
    body: JSON.stringify(newMenu)
  });

  return  {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_UPDATE_MENU_SUCCESS,
          payload: (action, state, json) => (json.result ? newMenu : null)
        },
        FETCH_FAILURE
      ]
    }
  };
}

// 删除应用菜单                
export const fetchDeleteMenu = (menuItem, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('app_menu/func/delete'), 'POST', {
    body: JSON.stringify({ id: menuItem.id })
  });

  return  {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_DELETE_MENU_SUCCESS,
          payload: (action, state, json) => (json.result ? menuItem : null)
        },
        FETCH_FAILURE
      ]
    }
  };
}

// 修改应用菜单排序
export const fetchChangeMenuRank = (params, callback) => {
  const { source_id, target_id, oldIndex, newIndex, subIndex } = params;

  const fetchOptions = getFetchOptions(getApiPath('app_menu/func/update_rank'), 'POST', {
    body: JSON.stringify({ source_id, target_id })
  });

  return  {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_CHANGE_MENU_RANK_SUCCESS,
          payload: (action, state, json) => (json.result ? {
            oldIndex,
            newIndex,
            subIndex
          } : null)
        },
        FETCH_FAILURE
      ]
    }
  };
}

// 获取报告树
export const fetchDashboardTree = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DASHBOARD_TREE_REQUEST',
        {
          type: FETCH_DASHBOARD_TREE_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_DASHBOARD_TREE_FAILURE'
      ]
    }
  }
}

// 清除应用数据/菜单数据
export const clearApplicationData = createAction(CLEAR_APPLICATION_DATA_SUCCESS);

/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchApplicationList,                               // 获取应用列表
  fetchAddApplication,                                // 添加应用
  fetchUpdateApplication,                             // 修改应用
  fetchChangeApplicationEnable,                       // 启用/禁用应用
  fetchDeleteApplication,                             // 删除应用
  fetchChangeApplicationRank,                         // 修改应用排序
  fetchApplicationDetail,                             // 获取应用详情
  fetchApplication,                                   // 获取应用门户(包含应用菜单)
  fetchMenuTree,                                      // 获取应用下的菜单树
  fetchMenuDetail,                                    // 获取单个菜单项
  fetchAddMenu,                                       // 添加应用菜单
  fetchUpdateMenu,                                    // 修改应用菜单
  fetchDeleteMenu,                                    // 删除应用菜单
  fetchChangeMenuRank,                                // 修改应用菜单排序

  fetchDashboardTree,                                 // 获取报告树

  clearApplicationData,                               // 清除应用数据/菜单数据
}


const initialState = {
  pending: false,
  listPending: false,
  applicationList: [],
  applicationPage: 1,
  applicationData: {},
  applicationMenus: [],
  dashboardTree: []
}


export default handleActions({
  // 触发pending的请求
  [FETCH_REQUEST](state) {
    return  {
      ...state,
      pending: true
    };
  },
  [FETCH_FAILURE](state) {
    return  {
      ...state,
      pending: false
    };
  },
  // 触发listPending的请求
  [FETCH_LIST_REQUEST](state) {
    return  {
      ...state,
      listPending: true
    };
  },
  [FETCH_LIST_FAILURE](state) {
    return  {
      ...state,
      listPending: false
    };
  },

  // 获取应用列表
  [FETCH_APPLICATION_LIST_SUCCESS](state, { payload }) {
    return {
      ...state,
      listPending: false,
      applicationList: payload ? payload.items : [],
      applicationPage: payload ? payload.page : 1
    };
  },

  // 添加应用
  [FETCH_ADD_APPLICATION_SUCCESS](state, { payload }) {
    if (payload) {
      const newList = [].concat(state.applicationList);
      newList.push(payload);
      return {
        ...state,
        applicationList: newList,
        pending: false
      }
    }
    return  {
      ...state,
      pending: false
    };
  },

  // 修改应用
  [FETCH_UPDATE_APPLICATION_SUCCESS](state, { payload }) {
    if (payload) {
      return {
        ...state,
        applicationData: {
          ...state.applicationData,
          ...payload
        },
        pending: false
      }
    }
    return  {
      ...state,
      pending: false
    };
  },

  // 启用/禁用应用
  [FETCH_CHANGE_APPLICATION_ENABLE_SUCCESS](state, { payload }) {
    if (payload) {
      return {
        ...state,
        applicationList: state.applicationList.map((app) => {
          if (app.id === payload.id) {
            app.enable = payload.enable;
          }
          return app;
        }),
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  // 删除应用
  [FETCH_DELETE_APPLICATION_SUCCESS](state, { payload }) {
    if (payload) {
      return {
        ...state,
        applicationList: state.applicationList.filter(application => (payload !== application.id)),
        pending: false
      };
    }
    return  {
      ...state,
      pending: false
    };
  },

  // 修改应用排序
  [FETCH_CHANGE_APPLICATION_RANK_SUCCESS](state, { payload }) {
    if (payload) {
      return {
        ...state,
        applicationList: arrayMove(state.applicationList.concat(), payload.oldIndex, payload.newIndex),
        pending: false
      };
    }
    return  {
      ...state,
      pending: false
    };
  },

  // 获取应用详情
  [FETCH_APPLICATION_DETAIL_SUCCESS](state, { payload }) {
    return  {
      ...state,
      applicationData: payload || {},
      pending: false
    }
  },

  // 获取应用下的菜单树
  [FETCH_MENU_TREE_SUCCESS](state, { payload }) {
    return {
      ...state,
      listPending: false,
      applicationMenus: payload || []
    }
  },

  // 获取单个菜单项
  [FETCH_MENU_DETAIL_SUCCESS](state, { payload }) {
    if (payload) {
      return {
        ...state,
        applicationMenus: getUpdatedMenu(payload, state.applicationMenus.concat()),
        pending: false
      }
    }
    return {
      ...state,
      pending: false
    };
  },

  // 添加应用菜单
  [FETCH_ADD_MENU_SUCCESS](state, { payload }) {
    if (!payload) {
      return {
        ...state,
        pending: false
      }
    }
    return {
      ...state,
      applicationMenus: getInsertedMenu(payload, state.applicationMenus.slice()),
      pending: false
    };
  },

  // 修改应用菜单
  [FETCH_UPDATE_MENU_SUCCESS](state, { payload }) {
    if (payload) {
      return {
        ...state,
        applicationMenus: getUpdatedMenu(payload, state.applicationMenus.concat()),
        pending: false
      }
    }
    return {
      ...state,
      pending: false
    };
  },

  // 删除应用菜单
  [FETCH_DELETE_MENU_SUCCESS](state, { payload }) {
    if (payload) {
      let newList;

      if (!payload.parent_id) {
        newList = state.applicationMenus.filter(item => (item.id !== payload.id));
      } else {
        newList = state.applicationMenus.map((item) => {
          if (item.id === payload.parent_id) {
            item.sub = item.sub.filter(m => (m.id !== payload.id))
          }
          return item;
        })
      }
      return {
        ...state,
        applicationMenus: newList,
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  // 修改应用菜单排序
  [FETCH_CHANGE_MENU_RANK_SUCCESS](state, { payload }) {
    if (payload) {
      let newMenu;

      // 如果有subIndex 说明移动的是二级菜单
      if (payload.subIndex !== undefined) {
        newMenu = state.applicationMenus.concat();
        newMenu[payload.subIndex].sub = arrayMove(state.applicationMenus.concat()[payload.subIndex].sub, payload.oldIndex, payload.newIndex);
      } else {
        newMenu = arrayMove(state.applicationMenus.concat(), payload.oldIndex, payload.newIndex)
      }

      return {
        ...state,
        applicationMenus: newMenu,
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  // 获取报告树
  [FETCH_DASHBOARD_TREE_SUCCESS](state, { payload }) {
    if (payload && payload.tree && payload.tree.length > 0) {
      return {
        ...state,
        dashboardTree: convertTree(payload.tree, 'sub')
      }
    }
    return {
      ...state,
      pending: false
    }
  },

  // 清除应用数据/菜单数据
  [CLEAR_APPLICATION_DATA_SUCCESS](state) {
    return {
      ...state,
      applicationData: {},
      applicationMenus: []
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

// 更新一个菜单详情
function getUpdatedMenu(data, baseArr) {
  if (data.parent_id) {
    return baseArr.map((menu) => {
      if (menu.id === data.parent_id) {
        menu.sub = menu.sub.map((m) => {
          if (m.id === data.id) {
            m = {
              ...m,
              ...data
            };
          }
          return m;
        })
      }
      return menu;
    })
  }
  return baseArr.map((menu) => {
    if (menu.id === data.id) {
      menu = {
        ...menu,
        ...data
      };
    }
    return menu;
  });
}

// 插入一个新菜单
function getInsertedMenu(data, baseArr) {
  const arr = baseArr.concat();
  if (data.parent_id) {
    arr.map((menu) => {
      if (menu.id === data.parent_id) {
        if (Array.isArray(menu.sub)) {
          menu.sub.push(data);
        } else {
          menu.sub = [data];
        }
      }
      return menu;
    })
  } else {
    arr.push(data);
  }
  return arr;
}
