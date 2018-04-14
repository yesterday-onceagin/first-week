import { createAction, handleActions } from 'redux-actions'
import { CALL_API, getJSON, ApiError } from 'redux-api-middleware'

import getApiPath from '../../../helpers/getApiPath';
import param from '../../../helpers/param';
import getFetchOptions from '../../../helpers/getFetchOptions';


// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */

// 业务指标模版内数据通用(REQ/FAIL)
const FETCH_TEMPLATE_REQUEST = Symbol('FETCH_TEMPLATE_REQUEST');
const FETCH_TEMPLATE_FAILURE = Symbol('FETCH_TEMPLATE_FAILURE');

// 获取业务指标模版列表
const FETCH_TEMPLATE_LIST_SUCCESS = Symbol('FETCH_TEMPLATE_LIST_SUCCESS');
// 新增业务指标模版
const FETCH_ADD_TEMPLATE_SUCCESS = Symbol('FETCH_ADD_TEMPLATE_SUCCESS');
// 删除业务指标模版
const FETCH_DELETE_TEMPLATE_SUCCESS = Symbol('FETCH_DELETE_TEMPLATE_SUCCESS');
// 获取业务指标模版基本信息
const FETCH_TEMPLATE_DATA_SUCCESS = Symbol('FETCH_TEMPLATE_DATA_SUCCESS');
// 更新业务指标模版基本信息
const FETCH_UPDATE_TEMPLATE_SUCCESS = Symbol('FETCH_UPDATE_TEMPLATE_SUCCESS');
// 重置模版编辑页的数据
const RESET_TEMPLATE_PAGE_DATA_SUCCESS = Symbol('RESET_TEMPLATE_PAGE_DATA_SUCCESS');
// 获取模版关键表
const FETCH_TEMPLATE_KEY_TABLE_SUCCESS = Symbol('FETCH_TEMPLATE_KEY_TABLE_SUCCESS');
// 设置模版关键表
const UPDATE_TEMPLATE_KEY_TABLE_SUCCESS = Symbol('UPDATE_TEMPLATE_KEY_TABLE_SUCCESS');


// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

// 获取业务指标模版列表
export const fetchTemplateList = (params, callback) => {
  if (!params.page) {
    params.page = 1;
  }

  const fetchOptions = getFetchOptions(getApiPath('indicator/template/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TEMPLATE_REQUEST, {
          type: FETCH_TEMPLATE_LIST_SUCCESS,
          payload: (action, state, json) => {
            json.data.page = params.page;
            return json.data;
          }
        },
        FETCH_TEMPLATE_FAILURE
      ]
    }
  }
};

// 新增业务指标模版
export const fetchAddTemplate = (newTemplate, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/template/add'), 'POST', {
    body: JSON.stringify(newTemplate)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TEMPLATE_REQUEST, {
          type: FETCH_ADD_TEMPLATE_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return {
                ...newTemplate,
                id: json.data,
                indicator_configured: 0,
                indicator_total: 0,
              }
            }
            return null
          }
        },
        FETCH_TEMPLATE_FAILURE
      ]
    }
  }
};

// 删除业务指标模版
export const fetchDeleteTemplate = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/template/delete'), 'POST', {
    body: JSON.stringify({ id })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TEMPLATE_REQUEST, {
          type: FETCH_DELETE_TEMPLATE_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return id;
            }
            return null;
          }
        },
        FETCH_TEMPLATE_FAILURE
      ]
    }
  }
};

// 获取业务指标模版基本信息
export const fetchTemplateData = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/template/get', { id }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TEMPLATE_REQUEST, {
          type: FETCH_TEMPLATE_DATA_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_TEMPLATE_FAILURE
      ]
    }
  }
};

// 更新业务指标模版基本信息
export const fetchUpdateTemplate = (data, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/template/update'), 'POST', {
    body: JSON.stringify(data)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TEMPLATE_REQUEST, {
          type: FETCH_UPDATE_TEMPLATE_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return data;
            }
            return null;
          }
        },
        FETCH_TEMPLATE_FAILURE
      ]
    }
  }
};

// 重置模版编辑页的数据
export const resetTemplatePageData = createAction(RESET_TEMPLATE_PAGE_DATA_SUCCESS);

// 获取模版关键表
export const fetchTemplateKeyTable = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/template/get_key_tables', { id }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TEMPLATE_REQUEST, {
          type: FETCH_TEMPLATE_KEY_TABLE_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_TEMPLATE_FAILURE
      ]
    }
  }
};

// 设置模版关键表
export const updateTemplateKeyTable = (data, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/template/set_key_tables'), 'POST', {
    body: JSON.stringify(data)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TEMPLATE_REQUEST, {
          type: UPDATE_TEMPLATE_KEY_TABLE_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_TEMPLATE_FAILURE
      ]
    }
  }
};


/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchTemplateList,                                // 获取业务指标模版列表
  fetchAddTemplate,                                 // 新增业务指标模版
  fetchDeleteTemplate,                              // 删除业务指标模版
  fetchTemplateData,                                // 获取业务指标模版基本信息
  fetchUpdateTemplate,                              // 更新业务指标模版基本信息
  resetTemplatePageData,                            // 重置模版编辑页的数据
  fetchTemplateKeyTable,                            // 获取模版关键表
  updateTemplateKeyTable,                           // 设置模版关键表
};

// ------------------------------------
// Reducers
// ------------------------------------
const initialState = {
  pending: false,
  templateList: [],
  templatePage: 1,
  templateTotal: 0,
  templateData: null
};

export default handleActions({
  // 触发PENDING的通用场合
  [FETCH_TEMPLATE_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },
  [FETCH_TEMPLATE_FAILURE](state) {
    return {
      ...state,
      pending: false
    }
  },
  // 获取业务指标模版列表
  [FETCH_TEMPLATE_LIST_SUCCESS](state, action) {
    if (action.payload) {
      const newPage = +action.payload.page,
        newTotal = +action.payload.total;

      return {
        ...state,
        templateList: newPage > 1 ? state.templateList.concat(action.payload.items) : action.payload.items,
        templatePage: newPage,
        templateTotal: newTotal,
        pending: false
      }
    }
    return {
      ...state,
      pending: false
    };
  },
  // 新增业务指标模版
  [FETCH_ADD_TEMPLATE_SUCCESS](state, action) {
    if (action.payload) {
      const newList = state.templateList.concat();
      newList.unshift(action.payload);
      return {
        ...state,
        templateList: newList,
        pending: false,
      };
    }
    return {
      ...state,
      pending: false,
    };
  },
  // 删除业务指标模版
  [FETCH_DELETE_TEMPLATE_SUCCESS](state, action) {
    if (action.payload) {
      return {
        ...state,
        templateList: state.templateList.filter(t => t.id !== action.payload),
        pending: false
      }
    }
    return {
      ...state,
      pending: false
    }
  },
  // 获取业务指标模版基本信息
  [FETCH_TEMPLATE_DATA_SUCCESS](state, action) {
    return {
      ...state,
      pending: false,
      templateData: action.payload
    }
  },
  // 更新业务指标模版基本信息
  [FETCH_UPDATE_TEMPLATE_SUCCESS](state, action) {
    if (action.payload) {
      const newList = state.templateList.map((item) => {
        if (item.id === action.payload.id) {
          item.name = action.payload.name;
          item.description = action.payload.description;
        }
        return item;
      });
      return {
        ...state,
        templateData: action.payload,
        templateList: newList,
        pending: false
      }
    }
    return {
      ...state,
      pending: false
    }
  },
  // 重置模版编辑页的数据
  [RESET_TEMPLATE_PAGE_DATA_SUCCESS](state) {
    return {
      ...state,
      pending: false,
      templateData: null
    }
  },
  // 获取模版关键表
  [FETCH_TEMPLATE_KEY_TABLE_SUCCESS](state) {
    return {
      ...state,
      pending: false
    }
  },
  // 设置模版关键表
  [UPDATE_TEMPLATE_KEY_TABLE_SUCCESS](state) {
    return {
      ...state,
      pending: false
    }
  }
}, initialState);
