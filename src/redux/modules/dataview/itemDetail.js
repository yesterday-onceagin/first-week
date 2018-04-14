import { createAction, handleActions } from 'redux-actions'
import { CALL_API } from 'redux-api-middleware'
import _ from 'lodash'

import getApiPath from '../../../helpers/getApiPath'
import getFetchOptions from '../../../helpers/getFetchOptions'
import {
  getRandomPosition,
  parseDisplayFormat,
  getMaxZindex,
  getColorTheme,
  parseStringObj,
  getDisplayItem,
  layoutExtendUpgrade
} from '../../../helpers/dashboardUtils'
import { DEFAULT_DIAGRAM_CONFIG } from '../../../views/dataview/diagramConfig/constants/index'
import { getCustomFieldConfig } from '../../../views/dataview/utils/propConfigHelper'
import { SIMPLE_TYPES, getLayoutWH } from '../../../constants/dashboard'
// import index from 'react-sortable-hoc/dist/commonjs/SortableElement';
// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */
// -------------------- 报告 ------------------------
const FETCH_DASHBOARD_REQUEST = Symbol('FETCH_DASHBOARD_REQUEST')
const FETCH_DASHBOARD_FAILURE = Symbol('FETCH_DASHBOARD_FAILURE')

// 获取报告详细数据
const FETCH_DASHBOARD_DATA_SUCCESS = Symbol('FETCH_DASHBOARD_DATA_SUCCESS')
// 更新报告页面设置
const FETCH_UPDATE_DASHBOARD_LAYOUT_SUCCESS = Symbol('FETCH_UPDATE_DASHBOARD_LAYOUT_SUCCESS')
// 获取报告下的单图列表
const FETCH_DASHBOARD_CHART_LIST_SUCCESS = Symbol('FETCH_DASHBOARD_CHART_LIST_SUCCESS')
const FETCH_DASHBOARD_CHART_LIST_FAILURE = Symbol('FETCH_DASHBOARD_CHART_LIST_FAILURE')

// -------------------- 单图 --------------------
const FETCH_CHART_REQUEST = Symbol('FETCH_CHART_REQUEST')
const FETCH_CHART_FAILURE = Symbol('FETCH_CHART_FAILURE')

// 获取单图详细数据
const FETCH_DASHBOARD_CHART_DATA_SUCCESS = Symbol('FETCH_DASHBOARD_CHART_DATA_SUCCESS')
const FETCH_DASHBOARD_CHART_DATA_FAILURE = Symbol('FETCH_DASHBOARD_CHART_DATA_FAILURE')
// 删除单图
const FETCH_DELETE_CHART_ITEM_SUCCESS = Symbol('FETCH_DELETE_CHART_ITEM_SUCCESS')
// 复制单图
const FETCH_COPY_CHART_ITEM_SUCCESS = Symbol('FETCH_COPY_CHART_ITEM_SUCCESS')
// 添加/保存单图
const FETCH_SAVE_CHART_ITEM_SUCCESS = Symbol('FETCH_SAVE_CHART_ITEM_SUCCESS')
// 修改单图名称
const FETCH_SAVE_CHART_NAME_SUCCESS = Symbol('FETCH_SAVE_CHART_NAME_SUCCESS')
// 查询穿透数据
const FETCH_CHART_THROUGH_DATA_SUCCESS = Symbol('FETCH_CHART_THROUGH_DATA_SUCCESS')
const FETCH_CHART_THROUGH_DATA_FAILURE = Symbol('FETCH_CHART_THROUGH_DATA_FAILURE')

// 更新单图布局位置
const UPDATE_GRID_LAYOUT_SUCCESS = Symbol('UPDATE_GRID_LAYOUT_SUCCESS')
// 更新单图样式
const UPDATE_CHART_LAYOUT_SUCCESS = Symbol('UPDATE_CHART_LAYOUT_SUCCESS')
// 更新单图
const UPDATE_CHART_SUCCESS = Symbol('UPDATE_CHART_SUCCESS')
// 更新单图设置
const FETCH_UPDATE_FILTER_CONFIG_SUCCESS = Symbol('FETCH_UPDATE_FILTER_CONFIG_SUCCESS')
// 更新报告tab数据
const UPDATE_DASHBOARD_TAB_DATA_SUCCESS = Symbol('UPDATE_DASHBOARD_TAB_DATA_SUCCESS')
// 清空一个单图的相关数据
const DELETE_CHART_ITEM_DATA_SUCCESS = Symbol('DELETE_CHART_ITEM_DATA_SUCCESS')

// -------------------- 数据集 ----------------------
const FETCH_DATASET_FIELD_REQUEST = Symbol('FETCH_DATASET_FIELD_REQUEST')
const FETCH_DATASET_FIELD_FAILURE = Symbol('FETCH_DATASET_FIELD_FAILURE')

// 请求数据集
const FETCH_DATA_VIEW_DATASET_TREE_SUCCESS = Symbol('FETCH_DATA_VIEW_DATASET_TREE_SUCCESS')

// 请求数据集下的指标
const FETCH_DATA_VIEW_DATASET_FIELD_SUCCESS = Symbol('FETCH_DATA_VIEW_DATASET_FIELD_SUCCESS')

// 获取筛选字段的值
const FETCH_DATA_VIEW_FILTER_OPTIONS_SUCCESS = Symbol('FETCH_DATA_VIEW_FILTER_OPTIONS_SUCCESS')

// 更新数据集配置
const SAVE_DATASET_REQUEST = Symbol('SAVE_DATASET_REQUEST')
const SAVE_DATASET_SUCCESS = Symbol('SAVE_DATASET_SUCCESS')
const SAVE_DATASET_FAILURE = Symbol('SAVE_DATASET_FAILURE')
const UPDATE_DATASET_CONFIG_SUCCESS = Symbol('UPDATE_DATASET_CONFIG_SUCCESS')
const UPDATE_REPORT_DATASET_CONFIG_SUCCESS = Symbol('UPDATE_REPORT_DATASET_CONFIG_SUCCESS')

// 更新穿透
const CREATE_CHART_THROUGH_SUCCESS = Symbol('CREATE_CHART_THROUGH_SUCCESS')
const CREATE_ADD_THROUGH_SUCCESS = Symbol('CREATE_ADD_THROUGH_SUCCESS')
const CLEAR_CHART_THROUGH_INDEX = Symbol('CLEAR_CHART_THROUGH_INDEX')

// 清空数据集数据
const CLEAR_DATASET_SUCCESS = Symbol('CLEAR_DATASET_SUCCESS')
//通用
const FETCH_REQUEST = Symbol('FETCH_REQUEST')

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

// 获取报告详细数据
export const fetchDashboardData = (dashboardId, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/get', {
    id: dashboardId
  }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_DASHBOARD_REQUEST,
        {
          type: FETCH_DASHBOARD_DATA_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_DASHBOARD_FAILURE
      ]
    }
  }
}

// 更新报告页面设置
export const fetchUpdateDashboardLayout = (dashboard, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/update_layout'), 'POST', {
    body: JSON.stringify(dashboard)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DASHBOARD_REQUEST',
        {
          type: FETCH_UPDATE_DASHBOARD_LAYOUT_SUCCESS,
          payload: () => dashboard
        },
        'FETCH_DASHBOARD_FAILURE'
      ]
    }
  }
}

// 获取报告下的单图列表
export const fetchChartList = (params, callback) => {
  let apiUrl = 'dashboard/chart/list'
  const { dashboard_id, multi_dashboard_id, tenantCode, isShareView } = params
  const _params = { dashboard_id }

  if (isShareView) {
    apiUrl = 'released_dashboard/chart/list'
    _params.multi_dashboard_id = multi_dashboard_id
    _params.code = tenantCode
  }
  const fetchOptions = getFetchOptions(getApiPath(apiUrl, { ..._params }));

  // 异常情况下读取缓存数据
  const callBack = (json) => {
    if (!json.result) {
      const state = json.preState && json.preState.dataViewItemDetail
      json = {
        result: json.result,
        msg: json.msg,
        data: state && state.chartList && state.chartList[params.dashboard_id]
      }
    }
    callback && callback(json)
  }

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callBack,
      error: callBack,
      types: [
        FETCH_CHART_REQUEST,
        {
          type: FETCH_DASHBOARD_CHART_LIST_SUCCESS,
          payload: (action, state, json) => ({
            id: params.dashboard_id,
            chartList: Array.isArray(json.data) ? json.data : []
          })
        },
        FETCH_DASHBOARD_CHART_LIST_FAILURE
      ]
    }
  }
}

// 获取单图详细数据
export const fetchChartItemData = (params, callback) => {
  let apiUrl = 'dashboard/chart/result'
  const data = {
    id: params.id,
    dashboard_id: params.dashboard_id
  }
  // 如果有conditions则加入参数
  if (params.conditions) {
    data.conditions = params.conditions
  }
  // 筛选器联动
  if (params.filter_conditions) {
    data.filter_conditions = params.filter_conditions
  }
  // 报告级筛选跳转参数加入
  if (params.urlJson && params.urlJson.length > 0) {
    data.dashboard_conditions = params.urlJson
  }
  if (params.isShareView) {
    apiUrl = 'released_dashboard/chart/result'
    data.code = params.tenantCode
  }

  const fetchOptions = getFetchOptions(getApiPath(apiUrl), 'POST', {
    body: JSON.stringify(data)
  });

  // 异常情况下读取缓存数据
  const callBack = (json) => {
    if (!json.result) {
      const state = json.preState.dataViewItemDetail
      json = {
        result: json.result,
        msg: json.msg,
        data: state && state.items && state.items[params.id]
      }
    }
    callback && callback(json)
  }

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callBack,
      error: callBack,
      types: [
        'FETCH_REQUEST',
        {
          type: FETCH_DASHBOARD_CHART_DATA_SUCCESS,
          payload: (action, state, json) => Object.assign({
            id: params.id,
            chart_code: params.chart_code
          }, {
              chart_data: json.data.data,
              marklines: json.data.marklines
            })
        },
        {
          type: FETCH_DASHBOARD_CHART_DATA_FAILURE,
          meta: (action, state, res) => Object.assign(res, { id: params.id })
        }
      ]
    }
  }
}

export const fetchFilterConfig = (params, callback) => {
  const _params = {
    dashboard_id: params.dashboard_id
  }
  const fetchOptions = getFetchOptions(getApiPath('dashboard/datasets', _params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: FETCH_REQUEST,
          payload: (action, state, json) => json.data
        },
        'FETCH_DATASET_REQUEST'
      ]
    }
  }
}
export const updateFilterConfig = (params, callback) => {
  const _params = {
    chart_id: params.chart_id,
    filter_config: JSON.stringify(params.filter_config)
  }
  const fetchOptions = getFetchOptions(getApiPath('dashboard/chart/update_filter_config'), 'POST', {
    body: JSON.stringify(_params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: FETCH_UPDATE_FILTER_CONFIG_SUCCESS,
          payload: (action, state, json) => ({
            result: json.result,
            ...params
          })
        },
        'FETCH_DATASET_REQUEST'
      ]
    }
  }
}
// 更新GIRD布局设置
export const fetchUpdateGridLayout = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/chart/layout'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_CHART_REQUEST',
        {
          type: 'FETCH_UPDATE_GRID_LAYOUT_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_CHART_FAILURE'
      ]
    }
  }
}

// 删除单图
export const fetchDeleteChartItem = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/chart/delete'), 'POST', {
    body: JSON.stringify({
      id: params.id,
      chart_code: params.chart_code
    })
  })
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_CHART_REQUEST,
        {
          type: FETCH_DELETE_CHART_ITEM_SUCCESS,
          payload: () => params
        },
        FETCH_CHART_FAILURE
      ]
    }
  }
}

// 复制单图
export const fetchCopyChartItem = (params, callback) => {
  const { newPos, ...paramData } = params
  const fetchOptions = getFetchOptions(getApiPath('dashboard/chart/copy'), 'POST', {
    body: JSON.stringify(paramData)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_CHART_REQUEST,
        {
          type: FETCH_COPY_CHART_ITEM_SUCCESS,
          payload: (action, state, json) => {
            if (typeof json.data === 'string') {
              return {
                ...params,
                id: json.data,
                penetrate_ids: [],
                newPos
              }
            }
            return {
              ...params,
              id: json.data.chart_id,
              penetrate_ids: json.data.penetrate_ids,
              newPos
            }
          }
        },
        FETCH_CHART_FAILURE
      ]
    }
  }
}

// 添加/保存单图
export const fetchSaveChartItem = (params, callback) => {
  const url = params.id ? 'dashboard/chart/update' : 'dashboard/chart/add'
  const fetchOptions = getFetchOptions(getApiPath(url), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_CHART_REQUEST,
        {
          type: FETCH_SAVE_CHART_ITEM_SUCCESS,
          payload: (action, state, json) => {
            const item = params
            if (!params.id) {
              item.id = json.data
              item.isNew = true
            }
            return item
          }
        },
        FETCH_CHART_FAILURE
      ]
    }
  }
}

// 修改单图名称
export const fetchSaveChartName = (params, callback) => {
  const { dashboard_id, ...reqParams } = params
  const fetchOptions = getFetchOptions(getApiPath('dashboard/chart/save_name'), 'POST', {
    body: JSON.stringify(reqParams)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_CHART_REQUEST,
        {
          type: FETCH_SAVE_CHART_NAME_SUCCESS,
          payload: () => ({
            ...reqParams,
            dashboard_id
          })
        },
        FETCH_CHART_FAILURE
      ]
    }
  }
}

// 更新单图配置
export const fetchUpdateChartConfig = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/chart/save_chart_configs'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_CHART_REQUEST',
        {
          type: 'FETCH_UPDATE_CHART_CONFIG_SUCCESS',
          payload: () => params
        },
        'FETCH_CHART_FAILURE'
      ]
    }
  }
}

// 查询穿透数据
export const fetchChartThroughData = (throughData, callback) => {
  const { params, through_index, chartId } = throughData
  const data = {
    id: params.id,
    dashboard_id: params.dashboard_id,
    dataset_id: params.dataset_id,
    chart_code: params.chart_code,
    dims: params.dims,
    nums: params.nums,
    filters: params.filters,
    zaxis: params.zaxis,
    desires: params.desires,
    conditions: params.conditions || [],
    filter_conditions: params.filter_conditions || [],
    dashboard_conditions: params.urlJson || [],
    legendTheme: params.legendTheme || {}
  }
  // 如果有display_item则加上(不需要转换成对象)
  if (params.display_item) {
    data.display_item = params.display_item
  }

  let apiUrl = 'dashboard/chart/get_data'
  // 如果是第一层穿透。
  if (through_index === 0) {
    apiUrl = 'dashboard/chart/result'
  }

  // 如果是预览、发布 加上企业代码
  if (params.isShareView) {
    apiUrl = 'released_dashboard/chart/get_data'
    data.code = params.tenantCode
    if (through_index === 0) {
      apiUrl = 'released_dashboard/chart/result'
    }
  }

  const fetchOptions = getFetchOptions(getApiPath(apiUrl), 'POST', {
    body: JSON.stringify(data)
  });


  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST',
        {
          type: FETCH_CHART_THROUGH_DATA_SUCCESS,
          payload: (action, state, json) => ({
            id: chartId,
            chart_data: json.data.data,
            marklines: json.data.marklines,
            apiParams: data,
            through_index,
          })
        },
        {
          type: FETCH_CHART_THROUGH_DATA_FAILURE,
          meta: (action, state, res) => Object.assign(res, { id: chartId })
        }
      ]
    }
  }
}

// 更新单图布局位置
export const updateGridLayout = createAction(UPDATE_GRID_LAYOUT_SUCCESS)
// 更新单图样式
export const updateChartLayout = createAction(UPDATE_CHART_LAYOUT_SUCCESS)
// 更新单图
export const updateChart = createAction(UPDATE_CHART_SUCCESS)
// 更新报告tab数据
export const updateDashboardTabData = createAction(UPDATE_DASHBOARD_TAB_DATA_SUCCESS)
// 清空一个单图的相关数据
export const deleteChartItemData = createAction(DELETE_CHART_ITEM_DATA_SUCCESS)

// 获取数据集
export const fetchDataset = (callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/tree'));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: FETCH_DATA_VIEW_DATASET_TREE_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_DATASET_FAILURE'
      ]
    }
  }
}

// 清空数据集数据
export const clearDataset = createAction(CLEAR_DATASET_SUCCESS)

// 获取数据集字段
export const fetchDatasetField = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/dataset_field/get', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_DATASET_FIELD_REQUEST,
        {
          type: FETCH_DATA_VIEW_DATASET_FIELD_SUCCESS,
          payload: (action, state, json) => {
            const data = {
              data: json.data,
              dataset_id: params.dataset_id
            }
            return data
          }
        },
        FETCH_DATASET_FIELD_FAILURE
      ]
    }
  }
}

// 设置数据集高级计算字段
export const setNumeralIndicators = (params, callback) => {
  let operate = 'add'
  if (params.mode === 'edit') operate = 'update'
  if (params.mode === 'delete') operate = 'delete'

  const fetchOptions = getFetchOptions(getApiPath(`dashboard/chart/${operate}_dataset_field`), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: 'FETCH_DATA_VIEW_NUMERAL_INDICATORS_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_DATASET_FAILURE'
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
        'FETCH_DATASET_REQUEST',
        {
          type: FETCH_DATA_VIEW_FILTER_OPTIONS_SUCCESS,
          payload: (action, state, json) => Object.assign({ data: json.data }, { id: params.dataset_field_id })
        },
        'FETCH_DATASET_FAILURE'
      ]
    }
  }
}

export const fetchDimValues = (params, callback) => {
  const data = {
    dashboard_id: params.dashboard_id,
    dataset_id: params.dataset_id,
    chart_code: params.chart_code,
    dims: params.dims,
    nums: params.nums,
    filters: params.filters,
    conditions: params.conditions,
    legendTheme: {},
    display_item: JSON.stringify({ top_head: 100, top_tail: '' })
  }

  const fetchOptions = getFetchOptions(getApiPath('dashboard/chart/get_data'), 'POST', {
    body: JSON.stringify(data)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: 'FETCH_DATA_VIEW_DIMS_VALUES_SUCCESS',
          payload: (action, state, json) => json.data.data
        },
        'FETCH_DATASET_FAILURE'
      ]
    }
  }
}

// 更新数据集
export const saveDataset = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/update_chart'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        {
          type: SAVE_DATASET_REQUEST,
          payload: () => ({
            chart_id: params.id,
            through_index: params.through_index || 0
          })
        },
        {
          type: SAVE_DATASET_SUCCESS,
          payload: (action, state, json) => {
            const item = json.data
            item.chart = {
              ...params,
              chart_id: params.id,
              through_index: params.through_index || 0
            }
            return item
          }
        },
        {
          type: SAVE_DATASET_FAILURE,
          payload: params.id
        }
      ]
    }
  }
}

//获取单个报告筛选配置接口
export const getReportSelectorConfig = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/filter/config', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: FETCH_REQUEST,
          payload: (action, state, json) => json.data
        },
        'FETCH_DATASET_FAILURE'
      ]
    }
  }
}

//获取指定数据集字段的信息
export const getReportFieldConfig = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/filter/field_info', params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: FETCH_REQUEST,
          payload: (action, state, json) => json.data
        },
        'FETCH_DATASET_FAILURE'
      ]
    }
  }
}

//添加筛选配置接口
export const addReportSelector = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/filter/add_config'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: FETCH_REQUEST,
          payload: (action, state, json) => json.data
        },
        'FETCH_DATASET_FAILURE'
      ]
    }
  }
}

//编辑筛选配置接口
export const editReportSelector = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/filter/update_config'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: FETCH_REQUEST,
          payload: (action, state, json) => json.data
        },
        'FETCH_DATASET_FAILURE'
      ]
    }
  }
}

//删除筛选配置接口
export const delReportSelector = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/filter/delete_config'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: FETCH_REQUEST,
          payload: (action, state, json) => json.data
        },
        'FETCH_DATASET_FAILURE'
      ]
    }
  }
}
export const getReportFilter = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/filter/get_dashboard_filters', params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: FETCH_REQUEST,
          payload: (action, state, json) => json.data
        },
        'FETCH_DATASET_FAILURE'
      ]
    }
  }
}

// 获取可跳转报告列表
export const fetchReportList = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/filter/dashboards', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: FETCH_REQUEST,
          payload: (action, state, json) => json.data
        },
        'FETCH_DATASET_FAILURE'
      ]
    }
  }
}

export const updateDatasetConfig = createAction(UPDATE_DATASET_CONFIG_SUCCESS)
export const updateReportDatasetConfig = createAction(UPDATE_REPORT_DATASET_CONFIG_SUCCESS)

export const createChartThrough = createAction(CREATE_CHART_THROUGH_SUCCESS)

// 新增穿透
export const createAddThrough = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dashboard/add_chart_penetrate'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASET_REQUEST',
        {
          type: CREATE_ADD_THROUGH_SUCCESS,
          payload: (action, state, json) => {
            params && params.layers && params.layers.push(null)
            return {
              penetrate: json.data,
              chart: {
                ...params
              }
            }
          }
        },
        'FETCH_DATASET_FAILURE'
      ]
    }
  }
}

// 重置图表穿透index
export const clearChartThroughIndex = createAction(CLEAR_CHART_THROUGH_INDEX)

/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchDashboardData,                 // 获取报告详细数据
  fetchUpdateDashboardLayout,         // 更新报告页面设置
  fetchChartList,                     // 获取报告下的单图列表

  fetchChartItemData,                 // 获取单个单图数据
  fetchChartThroughData,              // 查询穿透数据
  fetchUpdateGridLayout,              // 更新GIRD布局设置
  fetchDeleteChartItem,               // 删除单图
  fetchCopyChartItem,                 // 复制单图
  fetchSaveChartItem,                 // 添加/保存单图
  fetchSaveChartName,                 // 修改单图名称
  fetchUpdateChartConfig,             // 更新单图配置

  updateGridLayout,                   // 更新单图布局位置
  updateChart,                        // 更新单图筛选设置
  updateChartLayout,                  // 更新单图样式
  updateDashboardTabData,             // 更新报告tab数据
  deleteChartItemData,                // 清空一个单图的相关数据

  fetchDataset,                       // 请求数据集
  clearDataset,                       // 清空数据集
  fetchDatasetField,                  // 请求数据集下的指标
  fetchFilterOptions,                 // 拉去筛选器下拉值
  fetchDimValues,                     // 请求当前维度具体值
  setNumeralIndicators,               // 设置数据集高级计算字段
  updateDatasetConfig,                // 更新数据集配置
  updateReportDatasetConfig,          // 更新默认单图数据集      
  saveDataset,                        // 保存单图数据集

  getReportSelectorConfig,            // 获取单个报告筛选配置接口
  getReportFieldConfig,               // 获取指定数据集字段的信息
  addReportSelector,                  // 新增筛选配置
  editReportSelector,                 // 编辑
  delReportSelector,                  // 删除
  getReportFilter,                    // 根据报告id 获取报告筛选条件
  fetchReportList,                    // 开放已设置报告级筛选的报告
  fetchFilterConfig,                  // 获取筛选设置的数据集数据
  updateFilterConfig,                 // 更新筛选设置
  createChartThrough,                 // 创建图表穿透
  createAddThrough,                   // 添加图表穿透
  clearChartThroughIndex              // 重置图表穿透index
}


const initialState = {
  dashboardPending: false,        // 报告的pending
  dashboardData: {},              // 报告数据

  chartPending: false,            // 单图列表的loading
  chartList: {},                  // 单图列表(归集于报告)
  items: null,                    // 单个单图的数据
  gridLayout: {},                 // 当前报告的gridLayout
  diagramLayouts: {},             // 当前报告的layouts
  diagramDatasets: {},            // 当前报告的dataSets

  reportDatasetsId: '',            // 当前报告设置的数据集Id
  reportDatasets: {},             // 当前报告设置的数据集数据

  dashboardTabData: {},           // 报告中所有tab的信息

  dataSetTree: [],                // 数据集
  dataFeildList: null,            // 数据字段
  dataFeild_pending: false,
  filterOptions: {},              // 筛选字段中字符串对应指标的值【下拉】
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

const convertDataset = (chart) => {
  const layers = (chart.layers && chart.layers.concat()) || []
  if (chart.penetrates && chart.penetrates.length > 0) {
    chart.penetrates.forEach((penetrate, i) => {
      if (layers && !layers[i + 1]) {
        layers[i + 1] = null
      }
    })
  }

  // 旧数据自动刷新升级
  let { refresh_rate } = chart
  if (chart.layout_extend && !chart.config) {
    const layoutExtend = parseStringObj(chart.layout_extend)
    const { refresh } = (layoutExtend && layoutExtend.dataSeries) || {}

    if (!refresh_rate && refresh && refresh.checked) {
      refresh_rate = JSON.stringify({
        isOpen: refresh.checked,
        time: refresh.value,
        unit: refresh.unit === 'H' ? 'hour' : (refresh.unit === 'M' ? 'minute' : 'second')
      })
    }
  }

  // 同步筛选设置
  if (chart.filter_config && typeof chart.filter_config === 'string') {
    try {
      chart.filter_config = JSON.parse(chart.filter_config)
    } catch (e) {
      chart.filter_config = {}
    }
  }

  return {
    id: chart.id,
    name: chart.name,
    chart_code: chart.chart_code,
    dashboard_id: chart.dashboard_id,
    default_value: chart.default_value,
    dataset_id: chart.source,
    source: chart.source,
    dims: chart.dims || [],
    nums: chart.nums || [],
    filters: chart.filters || [],
    desires: chart.desires || [],
    zaxis: chart.zaxis || [],
    filter_config: chart.filter_config,
    display_item: chart.display_item,
    penetrates: chart.penetrates || [],
    refresh_rate,
    layers
  }
}

// 获取一个tab中所有的单图
const getAllChartsInOneTab = (chartConfig, fullChartList) => {
  // 将数组类型的chartConfig转换成对象类型
  chartConfig = getCustomFieldConfig(chartConfig)
  // 取得tab标签数组
  const tabArray = _.get(chartConfig, 'labelConfig.tabConfig.tabs') || []
  const tabData = []
  // 取得所有被配置在tab中的单图（含tab） 并补全chart信息
  const allChartInTab = _.map(_.concat(...tabArray.map((tab, idx) => {
    // 过滤已不属于当前报告的配置
    const newCharts = _.filter(tab.charts, cid => (_.findIndex(fullChartList, c => c.id === cid) > -1))
    tabData[idx] = newCharts.slice()
    return newCharts
  })), id => _.find(fullChartList, c => c.id === id))

  return {
    allChartInTab,
    tabArray,
    tabData
  }
}

// 统计simpleTab中的各类关联
const _countSubRelate = (chartConfig, fullChartList) => {
  // 被选择下级的tab
  const subTabs = []

  // 取得所有被配置在tab中的单图（含tab） 并补全chart信息
  const _result = getAllChartsInOneTab(chartConfig, fullChartList)
  const { allChartInTab, tabData } = _result

  // 设定标记（当前tab是否包含tab）
  allChartInTab.forEach((_chart) => {
    if (_chart.chart_code === 'simple_tab') {
      subTabs.push(_chart.id)
    }
  })

  return {
    subTabs,
    tabData
  }
}

// 按字段修改dashboard_chart_id
const fixDashboardChartIdByKey = (arr, id) => {
  if (Array.isArray(arr)) {
    return arr.map((item) => {
      item.dashboard_chart_id = id
      return item
    })
  }
  return []
}
// 处理dims、nums、desires、zaxis、layers、filters
const fixDashboardChartId = (chartObj, id) => {
  const keysNeedFix = ['dims', 'nums', 'desires', 'zaxis', 'layers', 'filters']

  keysNeedFix.forEach((key) => {
    chartObj[key] = fixDashboardChartIdByKey(chartObj[key], id)
  })

  return _.cloneDeep(chartObj)
}

export default handleActions({
  // 报告PENDING
  [FETCH_DASHBOARD_REQUEST](state) {
    return {
      ...state,
      dashboardPending: true
    }
  },
  [FETCH_DASHBOARD_FAILURE](state) {
    return {
      ...state,
      dashboardPending: false
    }
  },

  // 请求chartPENDING
  [FETCH_CHART_REQUEST](state) {
    return {
      ...state,
      chartPending: true
    }
  },
  [FETCH_CHART_FAILURE](state) {
    return {
      ...state,
      chartPending: false
    }
  },

  // 获取报告详细数据
  [FETCH_DASHBOARD_DATA_SUCCESS](state, { payload }) {
    if (!payload) {
      return {
        ...state,
        dashboardPending: false
      }
    }
    return {
      ...state,
      dashboardData: {
        ...state.dashboardData,
        [payload.id]: payload
      },
      dashboardPending: false
    }
  },

  // 更新报告页面设置
  [FETCH_UPDATE_DASHBOARD_LAYOUT_SUCCESS](state, { payload }) {
    return {
      ...state,
      dashboardData: {
        ...state.dashboardData,
        [payload.id]: {
          ...state.dashboardData[payload.id],
          ...payload
        }
      }
    }
  },

  // 获取报告下的单图列表
  [FETCH_DASHBOARD_CHART_LIST_SUCCESS](state, { payload }) {
    const { diagramDatasets, diagramLayouts, dashboardTabData } = state
    const newGrid = []
    const newLayouts = diagramLayouts
    const newDatasets = diagramDatasets
    const allZSet = []
    let maxZ = 1500

    // 保证没有相同的zindex
    const newList = payload.chartList.map((chart) => {
      const isSimple = SIMPLE_TYPES.indexOf(chart.chart_code) > -1 || chart.chart_type === 'auxiliary'
      const chartConfig = chart.config ? parseStringObj(chart.config) : null
      let gridPos
      chart.pending = !isSimple
      // 如果是简单单图先给chart_data 防止显示暂无数据
      if (isSimple) {
        chart.chart_data = {}
        if (chart.chart_code === 'simple_tab') {
          const _result = _countSubRelate(chartConfig, payload.chartList)
          // 获取列表时重新初始化tab
          dashboardTabData[chart.id] = {
            data: _result.tabData,
            active: 0
          }
          chart = {
            ...chart,
            subTabs: _result.subTabs
          }
        }
      }
      // 更新位置信息
      try {
        const pos = JSON.parse(chart.position)
        let z = pos.z || maxZ     // zIndex 不存在的 按最大的处理
        if (allZSet.indexOf(z) > -1) {  // 兼容旧的报告, 保证唯一
          z = maxZ
        }
        allZSet.push(z)
        gridPos = {
          i: chart.id,
          x: +pos.col,
          y: +pos.row,
          w: +pos.size_x,
          h: +pos.size_y,
          z
        }
        maxZ = Math.max(z, maxZ) + 1
      } catch (e) {
        const { w, h } = getLayoutWH(chart.chart_code)
        gridPos = {
          i: chart.id,
          x: getRandomPosition(150, 100, 50),
          y: getRandomPosition(150, 100, 50),
          z: maxZ,
          w,
          h,
        }
        maxZ += 1
      }

      const defaultConfig = _.cloneDeep(DEFAULT_DIAGRAM_CONFIG[chart.chart_code])
      // 同步前 N 
      const displayItem = getDisplayItem(chart.chart_code)
      if (displayItem && defaultConfig && defaultConfig.dataSeries) {
        defaultConfig.dataSeries.displayItem = {
          checked: true,
          type: '前',
          value: displayItem.display_item && displayItem.display_item.top_head
        }
      }

      // 如果已有layout_extend则用已有的 否则套用默认配置并合并旧数据中的layout
      const layoutExtend = chart.layout_extend ? layoutExtendUpgrade({
        layout_extend: parseStringObj(chart.layout_extend),
        chart_code: chart.chart_code,
        options: { dimsLen: chart.dims.length, numsLen: chart.nums.length }
      }) : defaultConfig

      newLayouts[chart.id] = {
        layout: '',
        layout_extend: layoutExtend,
        chart_config: chartConfig,
        colorTheme: getColorTheme(chart)
      }

      const chartDataset = convertDataset(chart)
      newDatasets[chart.id] = {
        dataSet: chartDataset || null
      }

      // 穿透的数据
      if (Array.isArray(chart.penetrates) && chart.penetrates.length > 0) {
        chart.penetrates.forEach((_item) => {
          const _defaultConfig = _.cloneDeep(DEFAULT_DIAGRAM_CONFIG[_item.chart_code])
          // 同步前 N 
          const _displayItem = getDisplayItem(_item.chart_code)

          if (_displayItem && _defaultConfig && _defaultConfig.dataSeries) {
            _defaultConfig.dataSeries.displayItem = {
              checked: true,
              type: '前',
              value: _displayItem.display_item.top_head
            }
          }
          newLayouts[_item.id] = {
            layout: '',
            layout_extend: _item.layout_extend ? layoutExtendUpgrade({
              layout_extend: parseStringObj(_item.layout_extend),
              chart_code: _item.chart_code,
              options: { dimsLen: _item.dims.length, numsLen: _item.nums.length }
            }) : _defaultConfig,
            chart_config: _item.config ? parseStringObj(_item.config) : null,
            colorTheme: getColorTheme(_item)
          }

          newDatasets[_item.id] = {
            dataSet: {
              ...convertDataset(_item) || null,
              layers: (chartDataset && chartDataset.layers) || []
            }
          }
        })
      }
      newGrid.push(gridPos)
      // displayFormat
      parseDisplayFormat(chart.nums)
      parseDisplayFormat(chart.zaxis)
      parseDisplayFormat(chart.desires)
      if (chart.penetrates) {
        chart.penetrates.forEach((penetrate) => {
          parseDisplayFormat(penetrate.nums)
          parseDisplayFormat(penetrate.zaxis)
          parseDisplayFormat(penetrate.desires)
        })
      }

      // 新增空穿透时，修正layers值
      if (chart.penetrates && chart.penetrates.length > 0) {
        chart.penetrates.forEach((penetrate, i) => {
          if (chart.layers && !chart.layers[i + 1]) {
            chart.layers[i + 1] = null
          }
        })
      }

      return chart
    })

    const newGridLayout = state.gridLayout
    newGridLayout[payload.id] = newGrid

    const returnValue = {
      ...state,
      chartPending: false,
      chartList: {
        ...state.chartList,
        [payload.id]: newList
      },
      dashboardTabData: {
        ...dashboardTabData
      },
      diagramLayouts: newLayouts,
      diagramDatasets: newDatasets,
      gridLayout: newGridLayout
    }

    return returnValue
  },
  // 获取报告下的单图列表(失败)
  [FETCH_DASHBOARD_CHART_LIST_FAILURE](state) {
    return {
      ...state,
      chartPending: false
    }
  },

  // 获取单个单图数据(成功)
  [FETCH_DASHBOARD_CHART_DATA_SUCCESS](state, { payload }) {
    const baseInfo = {
      pending: false,
      through_index: 0,
    }
    //区分编辑和新增
    if (state && state.items && state.items[payload.id]) {
      return {
        ...state,
        items: {
          ...state.items,
          [payload.id]: {
            ...state.items[payload.id],
            ...baseInfo,
            chart_data: payload.chart_data,
            marklines: payload.marklines
          }
        }
      }
    }
    return {
      ...state,
      items: {
        ...state.items,
        [payload.id]: {
          ...baseInfo,
          ...payload,
          apiParams: null
        }
      }
    }
  },
  // 获取单个单图数据(失败)
  [FETCH_DASHBOARD_CHART_DATA_FAILURE](state, { payload }) {
    return {
      ...state,
      items: {
        ...state.items,
        [payload.id]: {
          pending: false,
          through_index: 0,
          chart_data: payload.msg,
          apiParams: null
        }
      }
    }
  },

  // 删除单图
  [FETCH_DELETE_CHART_ITEM_SUCCESS](state, { payload }) {
    const { dashboard_id, id } = payload
    const { items, gridLayout, diagramLayouts, diagramDatasets, chartList, dashboardTabData } = state
    const newChartList = _.filter(chartList[dashboard_id], item => item.id !== id)
    // 如果tab组件数据中存在这个id 则删除相关数据
    if (dashboardTabData && dashboardTabData[id]) {
      Reflect.deleteProperty(dashboardTabData, id)
    }
    // 如果全部是简单单图 则items为null
    if (items && items[id]) {
      Reflect.deleteProperty(items, id)
    }
    if (diagramLayouts[id]) {
      Reflect.deleteProperty(diagramLayouts, id)
    }
    if (diagramDatasets[id]) {
      Reflect.deleteProperty(diagramDatasets, id)
    }
    return {
      ...state,
      chartPending: false,
      chartList: {
        ...chartList,
        [dashboard_id]: newChartList
      },
      gridLayout: {
        ...gridLayout,
        [dashboard_id]: gridLayout[dashboard_id].filter(item => item.i !== id)
      },
      items,
      diagramLayouts,
      diagramDatasets,
      dashboardTabData
    }
  },

  // 复制单图
  [FETCH_COPY_CHART_ITEM_SUCCESS](state, { payload }) {
    const { chartList, gridLayout, diagramLayouts, diagramDatasets } = state
    const { id, penetrate_ids, dashboard_id, chart_id, position, name, newPos } = payload
    const newList = chartList[dashboard_id].concat([])
    const newGrids = gridLayout[dashboard_id]
    // 取得被复制的单图、位置、样式
    const copyedChart = _.cloneDeep(_.find(chartList[dashboard_id], item => (item.id === chart_id)))
    const copyedLayouts = _.cloneDeep(_.get(diagramLayouts, chart_id))
    const copyedDataset = _.cloneDeep(_.get(diagramDatasets, chart_id))
    newPos.i = id
    // 插入复制的单图position
    newGrids.push(newPos)
    // 如果复制的是simple_tab进行处理（并且是有配置的）
    if (copyedChart.chart_code === 'simple_tab' && Array.isArray(copyedLayouts.chart_config)) {
      // 找到labelConfig在其中的index
      const labelConfigIndex = _.findIndex(copyedLayouts.chart_config, c => c.field === 'labelConfig')
      // 继续找tabConfig的index
      const tabConfigIndex = _.findIndex(copyedLayouts.chart_config[labelConfigIndex].items, c => c.field === 'tabConfig')
      // 获取之前的tab
      const tabs = _.get(copyedLayouts, `chart_config.${labelConfigIndex}.items.${tabConfigIndex}.data.tabs`) || []
      // 写入新的tabs
      _.set(copyedLayouts, `chart_config.${labelConfigIndex}.items.${tabConfigIndex}.data.tabs`, tabs.map(d => (
        { name: d.name, charts: [] }
      )))
      // 因清除了其下所有的标签中的单图配置 所以重置subTabs
      copyedChart.subTabs = []
      // 将修改过的config写回
      copyedChart.config = JSON.stringify(_.get(copyedLayouts, 'chart_config') || [])
    }

    // 处理复制后的单图内的字段
    fixDashboardChartId(copyedChart, id)
    if (Array.isArray(copyedChart.penetrates) && copyedChart.penetrates.length > 0) {
      let lastId
      copyedChart.penetrates = copyedChart.penetrates.map((chart, index) => {
        const pcId = _.get(penetrate_ids, index)
        chart.id = pcId
        if (index === 0) {
          chart.parent_id = id
        } else if (lastId) {
          chart.parent_id = lastId
        }
        lastId = pcId
        fixDashboardChartId(chart, pcId)
        return chart
      })
    }

    // 如果是有数据集的单图
    if (_.get(copyedDataset, 'dataSet')) {
      // 处理复制后的单图数据集内的字段
      copyedDataset.dataSet = fixDashboardChartId(copyedDataset.dataSet, id)
      if (Array.isArray(copyedDataset.dataSet.penetrates) && copyedDataset.dataSet.penetrates.length > 0) {
        let lastId
        copyedDataset.dataSet.penetrates = copyedDataset.dataSet.penetrates.map((chart, index) => {
          const pcId = _.get(penetrate_ids, index)
          // 复制穿透图层样式
          diagramLayouts[pcId] = _.cloneDeep(diagramLayouts[chart.id])
          chart.id = pcId
          if (index === 0) {
            chart.parent_id = id
          } else if (lastId) {
            chart.parent_id = lastId
          }
          lastId = pcId
          chart = fixDashboardChartId(chart, pcId)
          // 写入数据集
          diagramDatasets[pcId] = {
            dataSet: _.cloneDeep(convertDataset(chart))
          }
          return chart
        })
      }
    }

    // 插入复制的单图
    newList.push({
      ...copyedChart,
      name,
      position,
      id,
    })
    // 插入复制的单图layouts
    diagramLayouts[id] = copyedLayouts
    // 如果是使用了数据的
    if (copyedDataset && copyedDataset.dataSet) {
      copyedDataset.dataSet.id = id
      copyedDataset.dataSet.name = name
      diagramDatasets[id] = copyedDataset
    }

    return {
      ...state,
      chartPending: false,
      gridLayout: {
        ...state.gridLayout,
        [dashboard_id]: newGrids
      },
      chartList: {
        ...state.chartList,
        [dashboard_id]: newList
      },
      diagramLayouts,
      diagramDatasets
    }
  },

  // 添加/保存单图
  [FETCH_SAVE_CHART_ITEM_SUCCESS](state, { payload }) {
    const { dashboard_id, isNew, ...chartItem } = payload
    let newList = Array.isArray(state.chartList[dashboard_id]) ? state.chartList[dashboard_id] : []
    const newGrid = Array.isArray(state.gridLayout[dashboard_id]) ? state.gridLayout[dashboard_id] : []
    let newPos
    // 更新位置信息
    newList = newList.concat([])
    try {
      const pos = JSON.parse(chartItem.position);
      newPos = {
        i: chartItem.id,
        x: pos.col,
        y: pos.row,
        w: pos.size_x,
        h: pos.size_y,
        z: pos.z
      }
    } catch (e) {
      const { w, h } = getLayoutWH(chartItem.chart_code)
      const nextZ = getMaxZindex(newGrid) + 1
      newPos = {
        i: chartItem.id,
        x: getRandomPosition(80, 50, 50),
        y: getRandomPosition(80, 50, 50),
        z: nextZ,
        w,
        h
      }
    }
    
    if (SIMPLE_TYPES.indexOf(chartItem.chart_code) > -1 || chartItem.chart_type === 'auxiliary') {
      chartItem.chart_data = {}
    }
    if (isNew) {
      const newChartItem = convertDataset(chartItem)
      newList.push({
        dashboard_id,
        ...chartItem,
        ...newChartItem
      })
      newGrid.push(newPos)
    } else {
      const gridIndex = _.findIndex(newGrid, i => i.i === chartItem.id)
      newGrid[gridIndex] = {
        ...newGrid[gridIndex],
        ...newPos
      }
      const chartIndex = _.findIndex(newList, i => i.id === chartItem.id)
      newList[chartIndex] = {
        ...newList[chartIndex],
        dashboard_id,
        ...chartItem
      }
    }


    const defaultConfig = _.cloneDeep(DEFAULT_DIAGRAM_CONFIG[chartItem.chart_code])
    // 同步前 N 
    const displayItem = getDisplayItem(chartItem.chart_code)

    if (defaultConfig && displayItem && defaultConfig.dataSeries) {
      defaultConfig.dataSeries.displayItem = {
        checked: true,
        type: '前',
        value: displayItem.display_item && displayItem.display_item.top_head
      }
    }

    const layout_extend = chartItem.layout_extend ? parseStringObj(chartItem.layout_extend) : defaultConfig
    const chart_config = chartItem.config ? parseStringObj(chartItem.config) : null

    const items = {
      ...state.items,
      [payload.id]: {
        ...state.items && state.items[payload.id],
        pending: false
      }
    }

    if (isNew) {
      items[payload.id] = {
        ...items[payload.id],
        through_index: 0,
        chart_data: null
      }
    }

    return {
      ...state,
      items,
      chartPending: false,
      chartList: {
        ...state.chartList,
        [dashboard_id]: newList
      },
      gridLayout: {
        ...state.gridLayout,
        [dashboard_id]: newGrid
      },
      diagramLayouts: {
        ...state.diagramLayouts,
        [chartItem.id]: {
          ...state.diagramLayouts[chartItem.id],
          layout_extend,
          chart_config,
          layout: parseStringObj(chartItem.layout),
          colorTheme: getColorTheme(chartItem)
        }
      }
    }
  },

  // 修改单图名称
  [FETCH_SAVE_CHART_NAME_SUCCESS](state, { payload }) {
    const { chartList } = state
    const { id, name, dashboard_id } = payload
    const newList = chartList[dashboard_id].map((item) => {
      if (item.id === id) {
        item.name = name
      }
      return item
    })
    return {
      ...state,
      chartPending: false,
      chartList: {
        ...chartList,
        [dashboard_id]: newList
      }
    }
  },

  // 查询穿透数据
  [FETCH_CHART_THROUGH_DATA_SUCCESS](state, { payload }) {
    const {
      marklines,
      chart_data,
      id,
      through_index,
      apiParams
    } = payload
    return {
      ...state,
      items: {
        ...state.items,
        [id]: {
          pending: false,
          apiParams,
          chart_data,
          through_index,
          marklines
        }
      }
    }
  },
  // 查询穿透数据(失败)
  [FETCH_CHART_THROUGH_DATA_FAILURE](state, { payload }) {
    return {
      ...state,
      items: {
        ...state.items,
        [payload.id]: {
          pending: false,
          apiParams: null,
          chart_data: payload.msg
        }
      }
    }
  },

  [CLEAR_CHART_THROUGH_INDEX](state) {
    const items = _.cloneDeep(state.items)
    items && Object.keys(items).forEach((chart_id) => {
      if (items[chart_id] && items[chart_id].through_index !== undefined) {
        delete items[chart_id].through_index
      }
    })

    return {
      ...state,
      items
    }
  },

  // 创建单图穿透
  [CREATE_CHART_THROUGH_SUCCESS](state, { payload }) {
    const { chart_id, layer, dashboard_id } = payload
    const chartList = state.chartList && state.chartList[dashboard_id]
    const newList = chartList && chartList.map((chart) => {
      if (chart.id === chart_id) {
        chart.layers = chart.layers || []
        chart.layers.push(layer)
      }
      return chart
    })

    return {
      ...state,
      chartList: {
        ...state.chartList,
        [dashboard_id]: newList
      },
    }
  },

  // 添加图表穿透
  [CREATE_ADD_THROUGH_SUCCESS](state, { payload }) {
    const { chart, penetrate } = payload

    const chartList = state.chartList && state.chartList[chart.dashboard_id]
    const newDiagramDatasets = _.cloneDeep(state.diagramDatasets)
    const newDiagramLayouts = _.cloneDeep(state.diagramLayouts)

    const newList = Array.isArray(chartList) && chartList.map((item) => {
      if (item.id === chart.id) {
        item.layers = chart.layers
        item.penetrates = item.penetrates || []
        item.penetrates.push(penetrate)
      }
      // 更新布局和数据集
      const chartDataset = convertDataset(item)
      newDiagramDatasets[item.id] = {
        dataSet: chartDataset || null
      }

      if (Array.isArray(item.penetrates) && item.penetrates.length > 0) {
        item.penetrates.forEach((_item) => {
          newDiagramLayouts[_item.id] = {
            chart_config: newDiagramLayouts[_item.id] ? (newDiagramLayouts[_item.id].chart_config || null) : null
          }

          newDiagramDatasets[_item.id] = {
            dataSet: {
              ...convertDataset(_item) || null,
              layers: (chartDataset && chartDataset.layers) || []
            }
          }
        })
      }

      return item
    })


    return {
      ...state,
      chartList: {
        ...state.chartList,
        [chart.dashboard_id]: newList
      },
      diagramLayouts: newDiagramLayouts,
      diagramDatasets: newDiagramDatasets
    }
  },

  // 更新单图布局位置
  [UPDATE_GRID_LAYOUT_SUCCESS](state, { payload }) {
    const { gridLayout, id } = payload
    return {
      ...state,
      gridLayout: {
        ...state.gridLayout,
        [id]: gridLayout
      }
    }
  },
  // 更新单图筛选设置
  [FETCH_UPDATE_FILTER_CONFIG_SUCCESS](state, { payload }) {
    const { chartList } = state
    const { dashboard_id, chart_id, filter_config, result } = payload
    if (result) {
      const newList = chartList[dashboard_id]
      const index = _.findIndex(newList, chart => chart.id === chart_id)
      _.set(newList, [index, 'filter_config'], filter_config)
      return {
        ...state,
        chartList: {
          ...chartList,
          [dashboard_id]: newList
        }
      }
    }
  },
  // 更新单图
  [UPDATE_CHART_SUCCESS](state, { payload }) {
    const { chartList } = this.state
    const { dashboard_id, chart_id, filter_config } = payload
    const newList = chartList[dashboard_id]
    const index = _.findIndex(newList, chart => chart.id === chart_id)
    _.set(newList, [index, 'filter_config'], filter_config)
    return {
      ...state,
      chartList: {
        ...chartList,
        [dashboard_id]: newList
      }
    }
  },

  // 更新单图样式
  [UPDATE_CHART_LAYOUT_SUCCESS](state, { payload }) {
    const { items, chartList, dashboardTabData } = state
    const { dashboard_id, chart_id, display_item, topChartId, chart_config, chart_code, ...others } = payload
    const isThrough = topChartId !== chart_id
    // 如果需要更新display_item
    const newList = chartList[dashboard_id]
    const topChartIndex = _.findIndex(newList, chart => chart.id === topChartId)
    if (display_item) {
      if (isThrough) {
        const layerIndex = _.findIndex(newList[topChartIndex].penetrates, chart => chart.id === chart_id)
        _.set(newList, [topChartIndex, 'penetrates', layerIndex, 'display_item'], display_item)
      } else {
        _.set(newList, [topChartIndex, 'display_item'], display_item)
      }
    }
    // 如果是tab组件
    if (chart_code === 'simple_tab') {
      const currConfig = getCustomFieldConfig(_.get(state, `diagramLayouts.${chart_id}.chart_config`))
      const nextConfig = getCustomFieldConfig(chart_config)
      const currTabs = _.get(currConfig, 'labelConfig.tabConfig.tabs') || []
      const nextTabs = _.get(nextConfig, 'labelConfig.tabConfig.tabs') || []
      // tabs配置发生变更的情况
      if (!_.isEqual(currTabs, nextTabs)) {
        const _result = _countSubRelate(chart_config, newList)
        // 获取列表时重新初始化tab
        dashboardTabData[chart_id] = {
          data: _result.tabData,
          active: 0
        }
        newList[topChartIndex].subTabs = _result.subTabs
      }
    }
    // 组织diagramConfig
    const diagramConfigs = _.cloneDeep({
      ...state.diagramLayouts[chart_id],
      chart_config,
      ...others
    })

    return {
      ...state,
      diagramLayouts: {
        ...state.diagramLayouts,
        [chart_id]: diagramConfigs
      },
      chartList: {
        ...chartList,
        [dashboard_id]: newList
      },
      dashboardTabData,
      items
    }
  },

  // 更新报告tab数据
  [UPDATE_DASHBOARD_TAB_DATA_SUCCESS](state, { payload }) {
    const { dashboardTabData } = state
    // 获取当前的tab数据
    const curr = dashboardTabData[payload.id] || {}
    // 配置激活
    curr.active = payload.active

    return {
      ...state,
      dashboardTabData: {
        ...dashboardTabData,
        [payload.id]: curr
      }
    }
  },

  // 清空一个单图的相关数据
  [DELETE_CHART_ITEM_DATA_SUCCESS](state, { payload }) {
    const { items } = state
    if (items && items[payload]) {
      Reflect.deleteProperty(items, payload)
    }
    return {
      ...state,
      items
    }
  },

  // ----- 数据集相关reducers -----
  [FETCH_DATASET_FIELD_REQUEST](state) {
    return {
      ...state,
      dataFeild_pending: true
    }
  },

  [FETCH_DATASET_FIELD_FAILURE](state) {
    return {
      ...state,
      dataFeild_pending: false
    }
  },

  [CLEAR_DATASET_SUCCESS](state) {
    return {
      ...state,
      dataSetTree: []
    }
  },
  [FETCH_DATA_VIEW_DATASET_TREE_SUCCESS](state, { payload }) {
    return { ...state, dataSetTree: convertTree(payload, 'sub') }
  },

  [FETCH_DATA_VIEW_DATASET_FIELD_SUCCESS](state, { payload }) {
    const { dataset_id, data } = payload
    return {
      ...state,
      dataFeildList: {
        ...state.dataFeildList,
        [dataset_id]: data
      },
      dataFeild_pending: false
    }
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

  [UPDATE_REPORT_DATASET_CONFIG_SUCCESS](state, { payload }) {
    const { sourceId } = payload
    return {
      ...state,
      reportDatasetsId: sourceId
    }
  },

  [UPDATE_DATASET_CONFIG_SUCCESS](state, { payload }) {
    const { chart, chart_id, through_index, dataSet } = payload
    const dashboard_id = dataSet && dataSet.dashboard_id

    const chartList = state.chartList && state.chartList[dashboard_id]
    let newDiagramDatasets = _.cloneDeep(state.diagramDatasets)

    const newList = chartList && chartList.map((item) => {
      if (chart && item.id === chart.id) {
        item.layers = dataSet.layers
      }

      // 更新数据集
      const chartDataset = convertDataset(item)
      newDiagramDatasets[item.id] = {
        dataSet: chartDataset || null
      }

      if (Array.isArray(item.penetrates) && item.penetrates.length > 0) {
        item.penetrates.forEach((_item) => {
          newDiagramDatasets[_item.id] = {
            dataSet: {
              ...convertDataset(_item) || null,
              layers: (chartDataset && chartDataset.layers) || []
            }
          }
        })
      }

      if (dataSet.name === undefined) {
        dataSet.name = newDiagramDatasets[chart_id] && newDiagramDatasets[chart_id].dataSet && newDiagramDatasets[chart_id].name
      }

      newDiagramDatasets = {
        ...newDiagramDatasets,
        [chart_id]: {
          dataSet: {
            ...newDiagramDatasets[chart_id] && newDiagramDatasets[chart_id].dataSet,
            ...convertDataset(dataSet)
          }
        }
      }

      return item
    })

    const item = state.items && state.items[chart_id]
    if (item && through_index !== undefined) {
      item.through_index = through_index
    }

    return {
      ...state,
      diagramDatasets: newDiagramDatasets,
      chartList: {
        ...state.chartList,
        [dashboard_id]: newList
      },
      items: {
        ...state.items,
        [chart_id]: {
          ...item
        }
      }
    }
  },

  [SAVE_DATASET_REQUEST](state, { payload }) {
    const { chart_id, through_index } = payload
    return {
      ...state,
      items: {
        ...state.items,
        [chart_id]: {
          ...state.items && state.items[chart_id],
          pending: !(through_index !== undefined && through_index !== 0)
        }
      }
    }
  },

  [SAVE_DATASET_FAILURE](state, { payload }) {
    return {
      ...state,
      items: {
        ...state.items,
        [payload]: {
          ...state.items && state.items[payload],
          pending: false
        }
      }
    }
  },

  [SAVE_DATASET_SUCCESS](state, { payload }) {
    const { chart } = payload
    const baseInfo = {
      pending: false,
      through_index: 0
    }

    if (chart.through_index !== undefined && chart.through_index !== baseInfo.through_index) {
      return {
        ...state,
        items: {
          ...state.items,
          [chart.chart_id]: {
            ...(state.items && state.items[chart.chart_id]),
            pending: false
          }
        }
      }
    }

    let newList = state.chartList && state.chartList[chart.dashboard_id] && state.chartList[chart.dashboard_id].concat()
    newList = newList.map((item) => {
      if (item.id === chart.chart_id) {
        if (chart.name === undefined) {
          chart.name = item.name
        }
        return {
          ...item,
          ...convertDataset(chart)
        }
      }
      return item
    })
    return {
      ...state,
      chartList: {
        ...state.chartList,
        [chart.dashboard_id]: newList
      },
      items: {
        ...state.items,
        [chart.chart_id]: {
          ...(state.items && state.items[chart.chart_id]),
          ...baseInfo,
          chart_data: payload.data,
          marklines: payload.marklines
        }
      }
    }
  }
}, initialState)
