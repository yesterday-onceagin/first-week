import { createAction, handleActions } from 'redux-actions';
import { CALL_API } from 'redux-api-middleware';

import getApiPath from '../../../helpers/getApiPath';
import getFetchOptions from '../../../helpers/getFetchOptions';

// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */
const FETCH_REQUEST = Symbol('FETCH_REQUEST')
const FETCH_FAILURE = Symbol('FETCH_FAILURE')

// 获取模版数据
const FETCH_MODULES_DATA_SUCCESS = Symbol('FETCH_MODULES_DATA_SUCCESS')

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

const fetchModulesData = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard_tpl/list', params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_MODULES_DATA_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 新增报告文件
const saveReportItem = (params, callback) => {
  const url = params.id ? 'dashboard_tpl/generate_dashboard' : 'dashboard/add'
  // 空白模板的报告 加上layout和background默认值
  if (!params.id) {
    params.layout = params.platform === 'mobile' ? '{"ratio":"free","width":750,"height":500}' : '{"ratio":"16:9","width":960,"height":540}'
    params.background = '{"show":true,"color":"transparent","image":"","size":"stretch"}'
  }
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
          type: 'SAVE_REPORT_ITEM_SUCCESS',
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchModulesData,
  saveReportItem
}

const emptyModule = {
  id: '0',
  name: '空白',
  background: JSON.stringify(null),
  layout: JSON.stringify({ ratio: '尺寸定义' }),
  description: '在空白画布上尽情施展您的创意吧！'
}

const initialState = {
  pending: false,
  moduleList: []
}

export default handleActions({
  // pending request
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

  // 获取报告列表
  [FETCH_MODULES_DATA_SUCCESS](state, { payload }) {
    let moduleList = []

    // 加入空模块数据
    moduleList.push(emptyModule)

    // 串联返回的模版数据
    moduleList = moduleList.concat(payload)

    return {
      ...state,
      moduleList,
      pending: false
    }
  }

}, initialState)
