import { handleActions } from 'redux-actions'
import { CALL_API } from 'redux-api-middleware'

import getApiPath from '../../helpers/getApiPath';
import getFetchOptions from '../../helpers/getFetchOptions';
import getQuery from '../../helpers/getQuery';
import XStorage from '../../helpers/XStorage';

// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */

// 获取组织机构树（标签、看板、数据集）
const FETCH_ORG_TREES_REQUEST = Symbol('FETCH_ORG_TREES_REQUEST');
const FETCH_ORG_TREES_SUCCESS = Symbol('FETCH_ORG_TREES_SUCCESS');
const FETCH_ORG_TREES_FAILURE = Symbol('FETCH_ORG_TREES_FAILURE');
// 获取指标类型（包含所有指标和维度）
const FETCH_ALL_INDICATOR_REQUEST = Symbol('FETCH_ALL_INDICATOR_REQUEST');
const FETCH_ALL_INDICATOR_SUCCESS = Symbol('FETCH_ALL_INDICATOR_SUCCESS');
const FETCH_ALL_INDICATOR_FAILURE = Symbol('FETCH_ALL_INDICATOR_FAILURE');
// 获取标签列表（看板、数据集）
const FETCH_TAGS_REQUEST = Symbol('FETCH_TAGS_REQUEST');
const FETCH_TAGS_SUCCESS = Symbol('FETCH_TAGS_SUCCESS');
const FETCH_TAGS_FAILURE = Symbol('FETCH_TAGS_FAILURE');
// 获取指标模板列表（看板、标签、数据集）
const FETCH_TEMPLATES_REQUEST = Symbol('FETCH_TEMPLATES_REQUEST');
const FETCH_TEMPLATES_SUCCESS = Symbol('FETCH_TEMPLATES_SUCCESS');
const FETCH_TEMPLATES_FAILURE = Symbol('FETCH_TEMPLATES_FAILURE');
// 获取 oss TOKEN 
const FETCH_OSS_TOKEN_SUCCESS = Symbol('FETCH_OSS_TOKEN_SUCCESS')
// 转换树形结构数据
const _convertTree = (data, field = 'sub') => {
  if (Array.isArray(data) && data.length > 0) {
    return data.map((item) => {
      if (item.name) {
        item.text = item.name;
      }
      item.children = field && Array.isArray(item[field]) && item[field].length > 0 ? _convertTree(item[field], field) : [];
      return item;
    });
  }
  return [];
}

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

// 用户登录
export const fetchLogin = (user, callback) => {
  let returnUrl = getQuery('returnUrl', null, true, true);

  if (returnUrl) {
    returnUrl = decodeURIComponent(returnUrl).replace(`${location.protocol}//${location.host}`, '');
    XStorage.setValue('RETURN_URL', returnUrl);
  }

  const fetchOptions = getFetchOptions(getApiPath('user/login'), 'POST', {
    body: JSON.stringify(user)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_LOGIN_REQUEST',
        {
          type: 'FETCH_LOGIN_SUCCESS',
          payload: (action, state, json) => json.data,
          meta: {
            transition() {
              // 缓存企业编码
              XStorage.setValue('tenant_code', user.tenant_code || '');
              // 移除清洗页tab缓存
              sessionStorage.removeItem('DATACLEAN_BUILD_IN_SETTING');
              // 检查缓存的组织机构id是否与登陆账号匹配
              const org_id = XStorage.getValue(`ORG_ID-${user.tenant_code}-${user.account}`);
              //登录成功后，未tarcklog的存储一个标志到 window 对象
              XStorage.setValue('LOGIN_UNTRACK_MARK', true)
              // 如果未检查到登陆对应的组织机构id则清空组织机构id缓存
              if (!org_id) {
                XStorage.removeObjSeparate('ORG_ID-');
              }
            }
          }
        },
        'FETCH_LOGIN_FAILURE'
      ]
    }
  }
}

/*
* 获取用户登录模式
* data=1为使用旧密码，需要明文传输，0则需要使用sha1密文传输
*/
export const fetchLoginMode = (user, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/login_mode'), 'POST', {
    body: JSON.stringify(user)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_LOGIN_MODE_REQUEST',
        {
          type: 'FETCH_LOGIN_MODE_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_LOGIN_MODE_FAILURE'
      ]
    }
  }
}

// 获取用户登录是否需要验证码
export const fetchLoginCaptchaStatus = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/check_need_captcha'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_LOGIN_CAPTCHA_STATUS_REQUEST',
        {
          type: 'FETCH_LOGIN_CAPTCHA_STATUS_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_LOGIN_CAPTCHA_STATUS_FAILURE'
      ]
    }
  }
}

// 获取用户登录验证码
export const fetchLoginCaptcha = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user/captcha'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_LOGIN_CAPTCHA_REQUEST',
        {
          type: 'FETCH_LOGIN_CAPTCHA_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_LOGIN_CAPTCHA_FAILURE'
      ]
    }
  }
}

// 获取组织机构树（标签、看板）
export const fetchOrgTrees = (callback) => {
  const fetchOptions = getFetchOptions(getApiPath('user_group/organ_tree'));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_ORG_TREES_REQUEST,
        {
          type: FETCH_ORG_TREES_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_ORG_TREES_FAILURE
      ]
    }
  }
}

// 获取指标类型（包含所有指标和维度）
export const fetchAllIndicator = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/type/list?include_indicator=1&include_dimension=1', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_ALL_INDICATOR_REQUEST,
        {
          type: FETCH_ALL_INDICATOR_SUCCESS,
          payload: (action, state, json) => json.data.filter(item => !!item.name && item.indicator)
        },
        FETCH_ALL_INDICATOR_FAILURE
      ]
    }
  }
}

// 获取标签列表（看板）
export const fetchTags = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('label/list', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TAGS_REQUEST,
        {
          type: FETCH_TAGS_SUCCESS,
          payload: (action, state, json) => (json.data ? json.data.items : [])
        },
        FETCH_TAGS_FAILURE
      ]
    }
  }
}

// 获取指标模板列表（看板、标签）
export const fetchTemplates = (params, callback) => {
  params = params || {}
  Object.assign(params, { page_size: 100000 })

  const fetchOptions = getFetchOptions(getApiPath('indicator/template/list', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TEMPLATES_REQUEST,
        {
          type: FETCH_TEMPLATES_SUCCESS,
          payload: (action, state, json) => (json.data ? json.data.items : [])
        },
        FETCH_TEMPLATES_FAILURE
      ]
    }
  }
}

// 上传图片
export const fetchUploadImage = (formData, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('image/upload'), 'POST', {
    headers: {
      'Content-Type': false // 自动Content-type 否则上传不了文件
    },
    body: formData
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_UPLOAD_IMAGE_REQUEST',
        {
          type: 'FETCH_UPLOAD_IMAGE_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_UPLOAD_IMAGE_FAILURE'
      ]
    }
  }
}


// oss 测试上传
export const fetchOssToken = (callback) => {
  const fetchOptions = getFetchOptions(getApiPath('upload/get_tmp_token'));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_OSS_TOKEN_REQUEST',
        {
          type: FETCH_OSS_TOKEN_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_OSS_TOKEN_FAILURE'
      ]
    }
  }
}

/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchLogin,                                           // 用户登录
  fetchLoginMode,                                       // 获取用户登录模式
  fetchLoginCaptchaStatus,                              // 获取用户登录是否需要验证码
  fetchLoginCaptcha,                                    // 获取用户登录验证码

  fetchOrgTrees,                                        // 获取组织机构树（标签、看板）
  fetchTemplates,                                       // 获取指标类型（包含所有指标和维度）
  fetchTags,                                            // 获取标签列表（看板）
  fetchAllIndicator,                                    // 获取指标模板列表（看板、标签）

  fetchUploadImage,                                     // 上传图片
  fetchOssToken                                         // oss token 获取
}

const initialState = {
  // 组织机构
  orgTrees: [],
  orgPending: false,
  // 标签列表
  tagsList: [],
  tagsPending: false,
  // 指标
  allIndicators: [],
  indicatorPending: false,
  // 模版
  templatesList: [],
  templatePending: false,
  // oss TOKEN
  ossToken: null
}

export default handleActions({
  // 获取组织机构树（标签、看板）
  [FETCH_ORG_TREES_REQUEST](state) {
    return {
      ...state,
      orgPending: true
    }
  },

  [FETCH_ORG_TREES_SUCCESS](state, { payload }) {
    return {
      ...state,
      orgPending: false,
      orgTrees: payload ? _convertTree(payload, 'sub') : []
    }
  },

  [FETCH_ORG_TREES_FAILURE](state) {
    return {
      ...state,
      orgPending: false
    }
  },

  // 获取指标类型（包含所有指标和维度
  [FETCH_ALL_INDICATOR_REQUEST](state) {
    return {
      ...state,
      indicatorPending: true
    }
  },

  [FETCH_ALL_INDICATOR_SUCCESS](state, { payload }) {
    return {
      ...state,
      indicatorPending: false,
      allIndicators: payload
    }
  },

  [FETCH_ALL_INDICATOR_FAILURE](state) {
    return {
      ...state,
      indicatorPending: false
    }
  },

  // 获取标签列表（看板）
  [FETCH_TAGS_REQUEST](state) {
    return {
      ...state,
      tagsPending: true
    }
  },

  [FETCH_TAGS_SUCCESS](state, { payload }) {
    return {
      ...state,
      tagsPending: false,
      tagsList: payload
    }
  },

  [FETCH_TAGS_FAILURE](state) {
    return {
      ...state,
      tagsPending: false
    }
  },

  // 获取指标模板列表（看板、标签）
  [FETCH_TEMPLATES_REQUEST](state) {
    return {
      ...state,
      templatePending: true
    }
  },

  [FETCH_TEMPLATES_SUCCESS](state, { payload }) {
    return {
      ...state,
      templatePending: false,
      templatesList: payload
    }
  },

  [FETCH_TEMPLATES_FAILURE](state) {
    return {
      ...state,
      templatePending: false
    }
  },

  [FETCH_OSS_TOKEN_SUCCESS](state, { payload }) {
    return {
      ...state,
      ossToken: payload
    }
  }

}, initialState);
