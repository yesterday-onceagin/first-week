import { createAction, handleActions } from 'redux-actions'
import { CALL_API } from 'redux-api-middleware'

import getApiPath from '../../../helpers/getApiPath';
import getFetchOptions from '../../../helpers/getFetchOptions';
import { parseStringObj, layoutExtendUpgrade } from '../../../helpers/dashboardUtils'
import { DEFAULT_DIAGRAM_CONFIG } from '../../../views/dataview/diagramConfig/constants/index'
import _ from 'lodash'
// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */
const FETCH_REQUEST = Symbol('FETCH_REQUEST')
const FETCH_FAILURE = Symbol('FETCH_FAILURE')
// 获取单图数据
const FETCH_DATA_VIEW_ADD_EDIT_CHART_DATA_REQUEST = 'FETCH_DATA_VIEW_ADD_EDIT_CHART_DATA_REQUEST'
const FETCH_DATA_VIEW_ADD_EDIT_CHART_DATA_SUCCESS = 'FETCH_DATA_VIEW_ADD_EDIT_CHART_DATA_SUCCESS'
const FETCH_DATA_VIEW_ADD_EDIT_CHART_DATA_FAILURE = 'FETCH_DATA_VIEW_ADD_EDIT_CHART_DATA_FAILURE'
// 请求数据集
const FETCH_DATA_VIEW_DATASET_TREE_SUCCESS = Symbol('FETCH_DATA_VIEW_DATASET_TREE_SUCCESS')
// 请求数据集下的指标
const FETCH_DATA_VIEW_DATASET_FIELD_SUCCESS = Symbol('FETCH_DATA_VIEW_DATASET_FIELD_SUCCESS')
// 设置高级计算字段
const FETCH_DATA_VIEW_NUMERAL_INDICATORS_SUCCESS = Symbol('FETCH_DATA_VIEW_NUMERAL_INDICATORS_SUCCESS')
// 获取自定义排序的维度值
const FETCH_DATA_VIEW_DIMS_VALUES_SUCCESS = Symbol('FETCH_DATA_VIEW_DIMS_VALUES_SUCCESS')
// 获取筛选字段的值
const FETCH_DATA_VIEW_FILTER_OPTIONS_SUCCESS = Symbol('FETCH_DATA_VIEW_FILTER_OPTIONS_SUCCESS')
// 保存单图数据
const SAVE_DATA_VIEW_ADD_EDIT_CHART_DATA_REQUEST = Symbol('SAVE_DATA_VIEW_ADD_EDIT_CHART_DATA_REQUEST')
const SAVE_DATA_VIEW_ADD_EDIT_CHART_DATA_SUCCESS = Symbol('SAVE_DATA_VIEW_ADD_EDIT_CHART_DATA_SUCCESS')
const SAVE_DATA_VIEW_ADD_EDIT_CHART_DATA_FAILURE = Symbol('SAVE_DATA_VIEW_ADD_EDIT_CHART_DATA_FAILURE')
// 拉取详情(编辑查询条件)
const FETCH_CHART_DATA_INFO_SUCCESS = Symbol('FETCH_CHART_DATA_INFO_SUCCESS')
// 清空单图数据
const CLEAR_CHART_DATA_SUCCESS = Symbol('CLEAR_CHART_DATA_SUCCESS')
// 清除穿透数据
const CLEAR_CHART_DATA_THROUGH_SUCCESS = Symbol('CLEAR_CHART_DATA_THROUGH_SUCCESS')

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

// 获取单图数据
export const fetchChartData = (params, callback) => {
  const data = {
    dataset_id: params.dataset_id,
    chart_code: params.chart_code,
    dashboard_id: params.dashboard_id,
    dims: params.dims,
    nums: params.nums,
    conditions: params.conditions || [],
    filters: params.filters,
    legendTheme: params.legendTheme || {},
    display_item: JSON.stringify(params.display_item)
  }

  const fetchOptions = getFetchOptions(getApiPath('dashboard/chart/get_data'), 'POST', {
    body: JSON.stringify(data)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_DATA_VIEW_ADD_EDIT_CHART_DATA_REQUEST,
        
        {
          type: FETCH_DATA_VIEW_ADD_EDIT_CHART_DATA_SUCCESS,
          payload: (action, state, json) => json.data.data
        },
        FETCH_DATA_VIEW_ADD_EDIT_CHART_DATA_FAILURE
      ]
    }
  }
}

export const saveChartData = (params, callback) => {
  const url = params.id ? 'dashboard/chart/update' : 'dashboard/chart/add'
  const fetchOptions = getFetchOptions(getApiPath(url), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        SAVE_DATA_VIEW_ADD_EDIT_CHART_DATA_REQUEST,
        {
          type: SAVE_DATA_VIEW_ADD_EDIT_CHART_DATA_SUCCESS,
          payload: (action, state, json) => json.data
        },
        SAVE_DATA_VIEW_ADD_EDIT_CHART_DATA_FAILURE
      ]
    }
  }
}

export const fetchMarkLineValue = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/chart/get_markline_data'), 'POST', {
    body: JSON.stringify(params)
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: 'FETCH_MARKLINE_VALUE_SUCCESS',
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}


export const fetchFilterOptions = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/chart/get_filter_col_options'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_DATA_VIEW_FILTER_OPTIONS_SUCCESS,
          payload: (action, state, json) => Object.assign({ data: json.data }, { id: params.dataset_field_id })
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 设置高级计算字段
export const fetchNumeralIndicators = (params, callback) => {
  let fetchOptions = getFetchOptions(getApiPath('dashboard/chart/add_dataset_field'), 'POST', {
    body: JSON.stringify(params)
  });
  if (params.mode === 'edit') {
    fetchOptions = getFetchOptions(getApiPath('dashboard/chart/update_dataset_field'), 'POST', {
      body: JSON.stringify(params)
    })
  } else if (params.mode === 'delete') {
    fetchOptions = getFetchOptions(getApiPath('dashboard/chart/delete_dataset_field'), 'POST', {
      body: JSON.stringify(params)
    })
  }
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_DATA_VIEW_NUMERAL_INDICATORS_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

export const fetchDimsValues = (params, callback) => {
  const data = {
    dashboard_id: params.dashboard_id,
    dataset_id: params.dataset_id,
    chart_code: params.chart_code,
    dims: params.dims,
    nums: [],  //清空nums
    conditions: params.conditions || [],
    filters: params.filters,
    legendTheme: params.legendTheme || {},
    display_item: JSON.stringify(params.display_item)
  }

  const fetchOptions = getFetchOptions(getApiPath('dashboard/chart/get_data'), 'POST', {
    body: JSON.stringify(data)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_DATA_VIEW_DIMS_VALUES_SUCCESS,
          payload: (action, state, json) => json.data.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 拉取详情(编辑查询条件)
export const fetchInfo = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/chart/get', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_CHART_DATA_INFO_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 获取数据集
export const fetchDataset = (callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/tree'));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_DATA_VIEW_DATASET_TREE_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 获取 数据集结果
export const fetchDatasetField = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/dataset_field/get', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST,
        {
          type: FETCH_DATA_VIEW_DATASET_FIELD_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE
      ]
    }
  }
}

// 清空单图数据
export const clearChartData = createAction(CLEAR_CHART_DATA_SUCCESS)
// 清除穿透数据
export const clearChartDataThrough = createAction(CLEAR_CHART_DATA_THROUGH_SUCCESS)

/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchChartData,           // 获取单图数据
  fetchInfo,                // 拉取详情(编辑查询条件)
  fetchFilterOptions,       // 拉去筛选器下拉值
  saveChartData,            // 保存单图
  fetchDataset,             // 请求数据集
  fetchDatasetField,        // 请求数据集下的指标
  fetchMarkLineValue,       // 获取辅助线的值
  fetchNumeralIndicators,   // 设置高级计算字段
  fetchDimsValues,          // 获取维度值
  clearChartData,           // 清空单图数据
  clearChartDataThrough,    // 清除穿透数据
}

const convertTree = (data, field = 'sub') => {
  if (Array.isArray(data) && data.length > 0) {
    return data.map((item) => {
      if (item.name) {
        item.text = item.name;
      }
      item.children = field && Array.isArray(item[field]) && item[field].length > 0 ? convertTree(item[field], field) : [];
      return item;
    });
  }
  return [];
}

const initialState = {
  pending: false,
  chartDataInfo: null,        // 单图查询数据
  chart_data: null,
  chart_pending: false,

  dataSetTree: [],            // 数据集
  dataFeildList: null,        // 数据字段
  filterOptions: {},          // 筛选字段中字符串对应指标的值【下拉】
}

export default handleActions({
  // 数据集结果
  [FETCH_DATA_VIEW_DATASET_TREE_SUCCESS](state, { payload }) {
    return { ...state, dataSetTree: convertTree(payload, 'sub') }
  },


  [FETCH_DATA_VIEW_DATASET_FIELD_SUCCESS](state, { payload }) {
    return { ...state, dataFeildList: payload }
  },

  [FETCH_DATA_VIEW_NUMERAL_INDICATORS_SUCCESS](state) {
    return { ...state, dataFeild_pending: false }
  },

  [FETCH_DATA_VIEW_DIMS_VALUES_SUCCESS](state) {
    return { ...state }
  },

  [FETCH_DATA_VIEW_FILTER_OPTIONS_SUCCESS](state, { payload }) {
    // 将已经查询好的字段值存储到redux
    const values = []

    payload.data.forEach((item) => {
      values.push(Object.values(item)[0])
    })

    const filterOptions = {
      ...state.filterOptions,
      [payload.id]: values
    }

    return {
      ...state,
      filterOptions
    }
  },

  [SAVE_DATA_VIEW_ADD_EDIT_CHART_DATA_REQUEST](state) {
    return { ...state, pending: true }
  },

  [SAVE_DATA_VIEW_ADD_EDIT_CHART_DATA_SUCCESS](state) {
    return { ...state, pending: false }
  },

  [SAVE_DATA_VIEW_ADD_EDIT_CHART_DATA_FAILURE](state) {
    return { ...state, pending: false }
  },

  [FETCH_CHART_DATA_INFO_SUCCESS](state, { payload }) {
    const defaultConfig = _.cloneDeep(DEFAULT_DIAGRAM_CONFIG[payload.chart_code])
    const layoutExtend = payload.layout_extend ? layoutExtendUpgrade({
      layout_extend: parseStringObj(payload.layout_extend),
      chart_code: payload.chart_code,
      options: { dimsLen: payload.dims.length, numsLen: payload.nums.length }
    }) : defaultConfig
    payload.layout_extend = JSON.stringify(layoutExtend)
    // 穿透的数据
    if (Array.isArray(payload.penetrates) && payload.penetrates.length > 0) {
      payload.penetrates.map((_item) => {
        const _defaultConfig = _.cloneDeep(DEFAULT_DIAGRAM_CONFIG[_item.chart_code])
        const _layoutExtend = _item.layout_extend ? layoutExtendUpgrade({
          layout_extend: parseStringObj(_item.layout_extend),
          chart_code: _item.chart_code,
          options: { dimsLen: _item.dims.length, numsLen: _item.nums.length }
        }) : _defaultConfig
        _item.layout_extend = JSON.stringify(_layoutExtend)
        return _item
      })
    }
    return {
      ...state,
      chartDataInfo: payload
    }
  },

  [CLEAR_CHART_DATA_SUCCESS](state) {
    return {
      ...state,
      chartDataInfo: null
    }
  },

  // 清空单图穿透
  [CLEAR_CHART_DATA_THROUGH_SUCCESS](state) {
    return {
      ...state,
      chartDataInfo: state.chartDataInfo ? ({
        ...state.chartDataInfo,
        penetrates: [],
        layers: []
      }) : null
    }
  }
}, initialState)
