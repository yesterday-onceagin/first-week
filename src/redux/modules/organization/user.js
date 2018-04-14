import { createAction, handleActions } from 'redux-actions';
import { CALL_API } from 'redux-api-middleware';

import _ from 'lodash'
import getApiPath from '@helpers/getApiPath';
import getFetchOptions from '@helpers/getFetchOptions';
import { getCurrentAppAndModule, getCurrentFunction, getFormatedApp } from '@helpers/appUtils';
import { hex_sha1 } from '@helpers/sha1';
import { DMP_THEMES, PROJECT_TYPES } from '@constants/dmp';


// 获取app、module、function的url匹配映射表
const getAppUrlMap = (appTree) => {
  const appMap = {};

  appTree.forEach((app) => {
    appMap[app.id] = {
      appRoute: '',
      modulesMap: {}
    };
    if (!app.link && Array.isArray(app.function) && app.function.length > 0) {
      app.function.forEach((item) => {
        appMap[app.id].modulesMap[item.id] = {
          moduleRoute: '',
          functionMap: {}
        };

        if (!item.link && Array.isArray(item.sub) && item.sub.length > 0) {
          appMap[app.id].modulesMap[item.id].moduleRoute = item.sub.map((s) => {
            const urlReg = `${s.link}.*`
            appMap[app.id].modulesMap[item.id].functionMap[s.id] = urlReg;
            return urlReg;
          }).join('|');
        } else {
          appMap[app.id].modulesMap[item.id].moduleRoute = `${item.link}.*`;
        }
      })
      appMap[app.id].appRoute = Object.getOwnPropertyNames(appMap[app.id].modulesMap).map(key => appMap[app.id].modulesMap[key].moduleRoute).join('|');
    } else {
      appMap[app.id].appRoute = `${app.target === '_blank' ? app.link : (`/${app.id}`)}.*`
    }
    appMap[app.id].appRoute += `|/app/index/${app.id}.*`
  });

  return appMap;
}

// 转化侧边及顶部菜单
const _convertMenus = (appId, moduleId, data, appMap) => {
  let sideMenus = [];
  let topMenus = [];
  // 当前模块ID
  let current_module_id = moduleId;
  let current_func_id = moduleId;
  let current_app_id = appId;

  if (data) {
    // 模块id和appid任意缺少时都重新获取
    if (!current_module_id || !current_app_id) {
      const currAppAndModule = getCurrentAppAndModule(appMap);

      current_app_id = currAppAndModule.app_id;
      current_module_id = currAppAndModule.module_id;
    }

    let currAppIndex = 0;

    // 顶部菜单
    topMenus = Array.isArray(data) ? data.map((app, index) => {
      // 记录当前激活的app index
      if (app.id === current_app_id) {
        currAppIndex = index;
      }
      return {
        ...app,
        active: app.id === current_app_id
      };
    }) : [];

    current_func_id = getCurrentFunction(appMap, current_app_id, current_module_id);

    // 侧边菜单
    sideMenus = data[currAppIndex] && Array.isArray(data[currAppIndex].function) && data[currAppIndex].function.length > 0 ? data[currAppIndex].function.map(item => ({
      ...item,
      active: item.id === current_module_id
    })) : [];
  }
  return {
    sideMenus,
    topMenus,
    module_id: current_module_id,
    app_id: current_app_id,
    function_id: current_func_id
  }
}

// 处理project
const _resolveProject = (projectData = {}) => {
  const project = _.cloneDeep(projectData)
  const projectType = project.type || ''
  // 通常项目的情况
  project.datasetTypes = ['EXCEL', 'SQL', 'UNION', 'API']
  project.authTypes = ['func']
  // 如果是平台项目
  if (projectType.indexOf(PROJECT_TYPES.platform) > -1) {
    // 包含标签数据集
    project.datasetTypes = ['EXCEL', 'SQL', 'LABEL', 'UNION', 'API']
    // 包含组织机构权限
    project.authTypes = ['organ', 'func']
  }
  return project
}

// ------------------------------------
// Reducers
// ------------------------------------

const initialState = {
  pending: false,
  userList: [],
  userPage: 1,
  userTotal: 0,

  userProfileOK: false,
  userProfilePending: false,                        // userProfile Pending
  userProfile: null,                                // 获取的profile原始数据
  topMenus: null,                                   // 顶部APP菜单
  sideMenus: null,                                  // 当前模块的侧边菜单
  appMap: {},                                       // 模块高亮匹配映射
  app_id: '',                                       // 当前访问的应用
  module_id: '',                                    // 当前访问的应用下的模块
  functionIds: {},                                  // 每个APP下最后访问的模块
  userInfo: null,                                   // 用户信息
  project: null,                                    // 项目配置
  trackLogs: null,                                  // aliyun tarck logs
}

// userProfile successType func
const userProfileSucc = (action, state, json) => {
  const formatedApp = Array.isArray(json.data.app) && json.data.app.length > 0 ? getFormatedApp(json.data.app) : [];

  initialState.userProfile = {
    ...json.data,
    app: formatedApp
  };

  initialState.appMap = Array.isArray(formatedApp) && formatedApp.length > 0 ? getAppUrlMap(formatedApp) : {};

  return {
    ...json.data,
    app: formatedApp
  }
}

// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */

// 触发用户相关请求的pending
const FETCH_USER_REQUEST = Symbol('FETCH_USER_REQUEST');
const FETCH_USER_FAILURE = Symbol('FETCH_USER_FAILURE');

// 获取用户列表
const FETCH_USER_LIST_SUCCESS = Symbol('FETCH_USER_LIST_SUCCESS');
// 添加用户
const FETCH_ADD_USER_SUCCESS = Symbol('FETCH_ADD_USER_SUCCESS');
// 修改用户基本信息
const FETCH_UPDATE_USER_SUCCESS = Symbol('FETCH_UPDATE_USER_SUCCESS');
// 删除用户
const FETCH_DELETE_USER_SUCCESS = Symbol('FETCH_DELETE_USER_SUCCESS');
// 重置用户密码
const FETCH_RESET_USER_PASSWORD_SUCCESS = Symbol('FETCH_RESET_USER_PASSWORD_SUCCESS');
// 获取当前用户信息
const FETCH_USER_PROFILE_REQUEST = Symbol('FETCH_USER_PROFILE_REQUEST')
const FETCH_USER_PROFILE_SUCCESS = Symbol('FETCH_USER_PROFILE_SUCCESS')
const FETCH_USER_PROFILE_FAILURE = Symbol('FETCH_USER_PROFILE_FAILURE')
const MOCK_FETCH_USER_PROFILE = Symbol('MOCK_FETCH_USER_PROFILE')
// 修改当前登录用户的密码
const FETCH_CHANGE_USER_PASSWORD_SUCCESS = Symbol('FETCH_CHANGE_USER_PASSWORD_SUCCESS');
// 设置用户主题
const FETCH_SET_USER_THEME_SUCCESS = Symbol('FETCH_SET_USER_THEME_SUCCESS');

// 设置本地激活的菜单模块
const SET_SIDE_MENU_MODULE_SUCCESS = Symbol('SET_SIDE_MENU_MODULE_SUCCESS');
// 更新App-function数据（用于应用门户实时更新）
const UPDATE_APP_DATA_SUCCESS = Symbol('UPDATE_APP_DATA_SUCCESS')

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------


// 获取用户列表
export const fetchUserList = (params, callback) => {
  if (!params.page) {
    params.page = 1;
  }
  const fetchOptions = getFetchOptions(getApiPath('user/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_REQUEST,
        {
          type: FETCH_USER_LIST_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              json.data.page = params.page;
              return json.data;
            }
            return null
          }
        },
        FETCH_USER_FAILURE
      ]
    }
  }
}

// 添加用户
export const fetchAddUser = (newUser, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/add'), 'POST', {
    body: JSON.stringify(newUser)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_REQUEST,
        {
          type: FETCH_ADD_USER_SUCCESS,
          payload: (action, state, json) => (!json.result ? null : {
            ...newUser,
            id: json.data
          })
        },
        FETCH_USER_FAILURE
      ]
    }
  }
}

// 修改用户基本信息
export const fetchUpdateUser = (userData, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/update'), 'POST', {
    body: JSON.stringify(userData)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_REQUEST,
        {
          type: FETCH_UPDATE_USER_SUCCESS,
          payload: (action, state, json) => (!json.result ? null : userData)
        },
        FETCH_USER_FAILURE
      ]
    }
  }
}

// 删除用户
export const fetchDeleteUser = (userId, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/delete'), 'POST', {
    body: JSON.stringify({ id: userId })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_REQUEST,
        {
          type: FETCH_DELETE_USER_SUCCESS,
          payload: (action, state, json) => (!json.result ? null : userId)
        },
        FETCH_USER_FAILURE
      ]
    }
  }
}

// 重置用户密码
export const fetchResetUserPassword = (newUser, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/reset_password'), 'POST', {
    body: JSON.stringify(newUser)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_REQUEST,
        {
          type: FETCH_RESET_USER_PASSWORD_SUCCESS,
          payload: (action, state, json) => (!json.result ? null : newUser)
        },
        FETCH_USER_FAILURE
      ]
    }
  }
}

// 获取当前用户信息
export const fetchUserProfile = (callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/profile'))

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_USER_PROFILE_REQUEST,
        {
          type: FETCH_USER_PROFILE_SUCCESS,
          payload: userProfileSucc
        },
        FETCH_USER_PROFILE_FAILURE
      ]
    }
  }
}

// 获取当前用户信息（无request failure action）
export const fetchUserProfileSilent = (callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/profile'))

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_USER_PROFILE_REQUEST',
        {
          type: FETCH_USER_PROFILE_SUCCESS,
          payload: userProfileSucc
        },
        'FETCH_USER_PROFILE_FAILURE'
      ]
    }
  }
}

// 修改当前登录用户的密码
export const fetchChangeUserPassword = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/change_password'), 'POST', {
    body: JSON.stringify({
      old_password: hex_sha1(params.old_password),
      new_password: hex_sha1(params.new_password)
    })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_CHANGE_USER_PASSWORD_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 设置用户主题
export const fetchSetUserTheme = (theme, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/theme/set'), 'POST', {
    body: JSON.stringify({ theme })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST',
        {
          type: FETCH_SET_USER_THEME_SUCCESS,
          payload: (action, state, json) => (json.result ? theme : null)
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 设置本地激活的菜单模块
export const setSideMenuModule = createAction(SET_SIDE_MENU_MODULE_SUCCESS);
// 模拟userProfile接口
export const mockFetchUserProfile = createAction(MOCK_FETCH_USER_PROFILE)
// 更新App-function数据（用于应用门户实时更新）
export const updateAppData = createAction(UPDATE_APP_DATA_SUCCESS)

// 获取客服链接
export const fetchSupportLink = (callback) => {
  const fetchOptions = getFetchOptions(getApiPath('system/service'))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_SUPPORT_LINK',
        'FETCH_SUPPORT_LINK_SUCCESS',
        'FETCH_SUPPORT_LINK_FAILURE'
      ]
    }
  }
}

/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchUserList,                                    // 获取用户列表
  fetchAddUser,                                     // 添加用户
  fetchUpdateUser,                                  // 修改用户基本信息
  fetchDeleteUser,                                  // 删除用户
  fetchResetUserPassword,                           // 重置用户密码
  fetchUserProfile,                                 // 获取当前用户信息
  fetchUserProfileSilent,                           // 获取当前用户信息（无request failure action）
  fetchChangeUserPassword,                          // 修改当前登录用户的密码
  fetchSetUserTheme,                                // 设置用户主题
  setSideMenuModule,                                // 设置本地激活的菜单模块
  mockFetchUserProfile,                             // 模拟userProfile接口
  updateAppData,                                    // 更新App-function数据（用于应用门户实时更新）
  fetchSupportLink,                                 // 获取客服的地址链接
}

export default handleActions({
  // 触发用户相关请求的pending
  [FETCH_USER_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },
  [FETCH_USER_FAILURE](state) {
    return {
      ...state,
      pending: false
    }
  },

  // 获取用户列表
  [FETCH_USER_LIST_SUCCESS](state, { payload }) {
    const newPage = +payload.page;
    return {
      ...state,
      pending: false,
      userList: newPage > 1 ? state.userList.concat(payload.items) : payload.items,
      userPage: newPage,
      userTotal: +payload.total
    }
  },

  // 添加用户
  [FETCH_ADD_USER_SUCCESS](state, { payload }) {
    const newList = state.userList.concat();
    newList.push(payload);
    return {
      ...state,
      userList: newList,
      pending: false
    }
  },

  // 修改用户基本信息
  [FETCH_UPDATE_USER_SUCCESS](state, { payload }) {
    const {
      group_id,
      ...userData
    } = payload;

    const newList = Array.isArray(state.userList) && state.userList.length > 0 ? state.userList.map((user) => {
      if (user.id === payload.id) {
        user = userData;
      }
      return user;
    }) : [];

    if (state.userInfo.id === payload.id) {
      // 修改的是当前登录用户
      return {
        ...state,
        userInfo: payload,
        userProfile: {
          ...state.userProfile,
          ...userData,
          group_id
        },
        userList: newList,
        pending: false
      };
    }
    return {
      ...state,
      userList: newList,
      pending: false
    };
  },

  // 删除用户
  [FETCH_DELETE_USER_SUCCESS](state, { payload }) {
    if (payload) {
      return {
        ...state,
        userList: state.userList.filter(user => (user.id !== payload)),
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  // 重置用户密码
  [FETCH_RESET_USER_PASSWORD_SUCCESS](state) {
    return {
      ...state,
      pending: false
    };
  },

  // 获取当前用户信息
  [FETCH_USER_PROFILE_REQUEST](state) {
    return {
      ...state,
      userProfileOK: false,
      userProfilePending: true
    }
  },
  [FETCH_USER_PROFILE_SUCCESS](state, { payload }) {
    const {
      topMenus,
      sideMenus,
      module_id,
      app_id,
      function_id
    } = _convertMenus(null, null, payload.app, initialState.appMap);

    if (!payload.theme || DMP_THEMES.map(item => item.key).indexOf(payload.theme) === -1) {
      payload.theme = 'theme-black';
    }

    // 设置 trackLogs 
    const trackLogs = setTrackLogs(payload)

    // 将授权的actions点 挂载到 window 下
    setFuncs_map(payload)

    return {
      ...state,
      topMenus,
      sideMenus,
      app_id,
      module_id,
      trackLogs,
      functionIds: {
        ...state.functionIds,
        [app_id]: function_id || module_id
      },
      userProfile: payload,
      userInfo: {
        account: payload.account,
        email: payload.email,
        group_id: payload.group_id,
        id: payload.id,
        mobile: payload.mobile,
        name: payload.name,
      },
      project: _resolveProject(payload.project),
      userProfileOK: true,
      userProfilePending: false
    }
  },
  [FETCH_USER_PROFILE_FAILURE](state) {
    return {
      ...state,
      userProfileOK: false,
      userProfilePending: false
    }
  },

  [MOCK_FETCH_USER_PROFILE](state) {
    const { hostname, href } = window.location
    return {
      ...state,
      userProfile: {},
      userInfo: {},
      project: {},
      userProfileOK: true,
      trackLogs: {
        domain: hostname,
        url: href,
        brower: navigator.userAgent
      },
      userProfilePending: false
    }
  },

  // 设置用户主题
  [FETCH_SET_USER_THEME_SUCCESS](state, { payload }) {
    if (payload) {
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          theme: payload
        }
      };
    }
    return {
      ...state,
    };
  },

  // 设置本地激活的菜单模块
  [SET_SIDE_MENU_MODULE_SUCCESS](state) {
    const currAppAndModule = getCurrentAppAndModule(initialState.appMap);

    const current_app_id = currAppAndModule.app_id;
    const current_module_id = currAppAndModule.module_id

    if (state.module_id !== current_module_id || state.app_id !== current_app_id) {
      const { topMenus, sideMenus, module_id, app_id, function_id } = _convertMenus(current_app_id, current_module_id, initialState.userProfile && initialState.userProfile.app, initialState.appMap);
      return {
        ...state,
        topMenus,
        sideMenus,
        app_id,
        module_id,
        functionIds: {
          ...state.functionIds,
          [app_id]: function_id || module_id
        }
      };
    }

    return {
      ...state
    }
  },

  // 更新App-function数据（用于应用门户实时更新）
  [UPDATE_APP_DATA_SUCCESS](state, { payload }) {
    if (payload.action === 'delete') {
      // 删除一个应用
      const { appId } = payload
      Reflect.deleteProperty(initialState.appMap, appId)
      initialState.userProfile.app = _.filter(initialState.userProfile.app, item => item.id !== appId)
      return {
        ...state,
        topMenus: _.filter(state.topMenus, item => item.id !== appId),
        userProfile: {
          ...state.userProfile,
          app: _.filter(state.userProfile.app, item => item.id !== appId)
        }
      }
    }

    return {
      ...state
    }
  }
}, initialState)

// 设置 trackLogs 
function setTrackLogs(payload) {
  const trackLogs = {
    account: payload.account,
    account_id: payload.id,
    org_code: payload.project.code,
    project_title: payload.project.title,
    project_id: payload.project.id
  }

  localStorage.setItem('trackLogs', JSON.stringify(trackLogs))

  return trackLogs
}

// 挂载 funcs_map 
function setFuncs_map(payload) {
  if (payload.funcs_map) {
    window['dmp::funcs_map'] = payload.funcs_map
  }
}
