import { createAction, handleActions } from 'redux-actions'
import { CALL_API } from 'redux-api-middleware'
import getApiPath from '../../../helpers/getApiPath'
import getFetchOptions from '../../../helpers/getFetchOptions'
import _ from 'lodash'

// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */

// 获取数据源列表
const FETCH_DATASOURCE_REQUEST = Symbol('FETCH_DATASOURCE_REQUEST')
const FETCH_DATASOURCE_SUCCESS = Symbol('FETCH_DATASOURCE_SUCCESS')
const FETCH_DATASOURCE_FAILURE = Symbol('FETCH_DATASOURCE_FAILURE')
// 获取数据源详情
const FETCH_DATASOURCE_DETAIL_REQUEST = Symbol('FETCH_DATASOURCE_DETAIL_REQUEST')
const FETCH_DATASOURCE_DETAIL_SUCCESS = Symbol('FETCH_DATASOURCE_DETAIL_SUCCESS')
const FETCH_DATASOURCE_DETAIL_FAILURE = Symbol('FETCH_DATASOURCE_DETAIL_FAILURE')
// 添加数据源
const ADD_DATASOURCE_SUCCESS = Symbol('ADD_DATASOURCE_SUCCESS')
// 编辑数据源
const EDIT_DATASOURCE_SUCCESS = Symbol('EDIT_DATASOURCE_SUCCESS')
// 删除数据源
const DELETE_DATASOURCE_SUCCESS = Symbol('DELETE_DATASOURCE_SUCCESS')
// 测试数据源链接
const TEST_DATASOURCE_LINK_SUCCESS = Symbol('TEST_DATASOURCE_LINK_SUCCESS')
// 获取API数据源参数
const FETCH_API_DATASOURCE_PARAMS_REQUEST = Symbol('FETCH_API_DATASOURCE_PARAMS_REQUEST')
const FETCH_API_DATASOURCE_PARAMS_SUCCESS = Symbol('FETCH_API_DATASOURCE_PARAMS_SUCCESS')
const FETCH_API_DATASOURCE_PARAMS_FAILURE = Symbol('FETCH_API_DATASOURCE_PARAMS_FAILURE')
// 获取系统内置参数
const FETCH_API_DATASOURCE_SYS_PARAMS_SUCCESS = Symbol('FETCH_API_DATASOURCE_SYS_PARAMS_SUCCESS')
// 获取数据表
const FETCH_TABLES_SUCCESS = Symbol('FETCH_TABLES_SUCCESS')
// 获取数据表字段
const FETCH_TABLES_COLUMNS_SUCCESS = Symbol('FETCH_TABLES_COLUMNS_SUCCESS')
// 获取数据表
const FETCH_DATASOURCE_TABLES_REQUEST = Symbol('FETCH_DATASOURCE_TABLES_REQUEST')
const FETCH_DATASOURCE_TABLES_SUCCESS = Symbol('FETCH_DATASOURCE_TABLES_SUCCESS')
const FETCH_DATASOURCE_TABLES_FAILURE = Symbol('FETCH_DATASOURCE_TABLES_FAILURE')

// 清空数据源详情
const CLEAR_DATASOURCE_INFO_SUCCESS = Symbol('CLEAR_DATASOURCE_INFO_SUCCESS')
// 清空数据表
const CLEAR_DATASOURCE_TABLES_SUCCESS = Symbol('CLEAR_DATASOURCE_TABLES_SUCCESS')
// 清空参数数据
const CLEAR_DATASOURCE_PARAMS_SUCCESS = Symbol('CLEAR_DATASOURCE_PARAMS_SUCCESS')

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

// 获取数据源列表
export const fetchDataSources = (page, opts, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/list', {
    ...opts,
    page
  }));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_DATASOURCE_REQUEST, {
          type: FETCH_DATASOURCE_SUCCESS,
          payload: (action, state, json) => {
            json.data.page = page;
            return json.data;
          }
        },
        FETCH_DATASOURCE_FAILURE
      ]
    }
  }
}


// 获取数据源详情
export const fetchDataSourceDetail = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/get', {
    id
  }))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_DATASOURCE_DETAIL_REQUEST, {
          type: FETCH_DATASOURCE_DETAIL_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_DATASOURCE_DETAIL_FAILURE
      ]
    }
  }
}


// 添加数据源
export const addDataSource = (data, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/add'), 'POST', {
    body: JSON.stringify(data)
  })
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: ADD_DATASOURCE_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}


// 编辑数据源
export const editDataSource = (data, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/update'), 'POST', {
    body: JSON.stringify(data)
  })
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: EDIT_DATASOURCE_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}


// 测试数据源链接
export const testDataSourceLink = (data, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/test'), 'POST', {
    body: JSON.stringify(data)
  })
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: TEST_DATASOURCE_LINK_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}


// 删除数据源
export const deleteDataSource = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath(`data_source/delete?id=${id}`), 'POST');
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: DELETE_DATASOURCE_SUCCESS,
          payload: () => id
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 获取API数据源参数
export const fetchApiDatasourceParams = (params, range, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/get_api_params'), 'POST', {
    body: JSON.stringify(params)
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_API_DATASOURCE_PARAMS_REQUEST, {
          type: FETCH_API_DATASOURCE_PARAMS_SUCCESS,
          payload: (action, state, json) => ({
            params: Array.isArray(json.data) ? json.data : [],
            range
          })
        },
        FETCH_API_DATASOURCE_PARAMS_FAILURE
      ]
    }
  }
}

// 获取API数据源参数(利用数据源ID获取)
export const fetchApiDatasourceParamsById = (id, range, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/get_api_params_by_id'), 'POST', {
    body: JSON.stringify({ id })
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_API_DATASOURCE_PARAMS_REQUEST, {
          type: FETCH_API_DATASOURCE_PARAMS_SUCCESS,
          payload: (action, state, json) => ({
            params: Array.isArray(json.data) ? json.data : [],
            range
          })
        },
        FETCH_API_DATASOURCE_PARAMS_FAILURE
      ]
    }
  }
}

// 获取系统内置参数
export const fetchApiDatasourceSysParams = (callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/get_sys_params'), 'POST')

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_API_DATASOURCE_PARAMS_REQUEST, {
          type: FETCH_API_DATASOURCE_SYS_PARAMS_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_API_DATASOURCE_PARAMS_FAILURE
      ]
    }
  }
}

// 获取数据表
export const fetchTables = (id, opts, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/tables', {
    id,
    ...opts,
  }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_TABLES_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return {
                id,
                tables: json.data.items,
                total: json.data.total
              };
            }
            return null;
          }
        },
        'FETCH_FAILURE'
      ]
    }
  }
};

// 获取数据表字段
export const fetchTableColumns = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/table_columns', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_TABLES_COLUMNS_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
};
// 获取数据表的不更新redux state
export const fetchDataSourceTableSilent = (id, opts, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/tables', {
    id,
    ...opts,
  }));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'silent0',
        'silent1',
        'silent2',
      ]
    }
  }
};
// 获取数据表
export const fetchDataSourceTable = (id, opts, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/tables', {
    id,
    ...opts,
  }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_DATASOURCE_TABLES_REQUEST,
        {
          type: FETCH_DATASOURCE_TABLES_SUCCESS,
          payload: (action, state, json) => {
            if (json.data) {
              return {
                list: json.data.items,
                page: opts.page || 1,
                total: json.data.total
              }
            }
            return {
              list: [],
              page: 1,
              total: 0
            }
          }
        },
        FETCH_DATASOURCE_TABLES_FAILURE
      ]
    }
  }
}

// 清空数据源详情
export const clearDatasourceInfo = createAction(CLEAR_DATASOURCE_INFO_SUCCESS);

// 清空数据表
export const clearDatasourceTable = createAction(CLEAR_DATASOURCE_TABLES_SUCCESS)

// 清空参数数据
export const clearDatasourceParams = createAction(CLEAR_DATASOURCE_PARAMS_SUCCESS)

/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchDataSources,                               // 获取数据源列表
  fetchDataSourceDetail,                          // 获取数据源详情
  addDataSource,                                  // 添加数据源
  editDataSource,                                 // 编辑数据源
  testDataSourceLink,                             // 删除数据源
  deleteDataSource,                               // 测试数据源链接

  fetchApiDatasourceParams,                       // 获取API数据源参数
  fetchApiDatasourceParamsById,                   // 获取API数据源参数(利用数据源ID获取)
  fetchApiDatasourceSysParams,                    // 获取系统内置参数

  fetchTables,                                    // 获取数据表
  fetchDataSourceTable,                           // 获取数据表
  fetchDataSourceTableSilent,                           // 获取数据表 不更新redux state
  fetchTableColumns,                              // 获取数据表字段

  clearDatasourceInfo,                            // 清空数据源详情
  clearDatasourceTable,                           // 清空数据表
  clearDatasourceParams,                          // 清空参数数据
}


// ------------------------------------
// Reducers
// ------------------------------------
const initialState = {
  list: [],
  page: 1,
  total: 0,
  info: {},
  pending: false,
  tableList: {},
  dataSourceTables: [],
  dataSourceTablesPage: 1,
  dataSourceTablesTotal: 0,
  // API数据源
  apiDatasourceSysParams: [],
  apiDatasourceParams: [],
  apiDatasourceParamsPending: false
}


export default handleActions({
  // 获取数据源列表
  [FETCH_DATASOURCE_REQUEST](state) {
    return {
      ...state,
      dataSourceTables: [],
      pending: true
    }
  },

  [FETCH_DATASOURCE_SUCCESS](state, { payload }) {
    const newPage = +payload.page
    const newTotal = +payload.total

    return {
      ...state,
      list: newPage > 1 ? state.list.concat(payload.items) : payload.items,
      page: newPage,
      total: newTotal,
      pending: false
    }
  },

  [FETCH_DATASOURCE_FAILURE](state) {
    return {
      ...state,
      dataSourceTables: [],
      pending: false
    }
  },

  // 获取数据源详情
  [FETCH_DATASOURCE_DETAIL_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },

  [FETCH_DATASOURCE_DETAIL_SUCCESS](state, { payload }) {
    return {
      ...state,
      pending: false,
      info: payload
    }
  },

  [FETCH_DATASOURCE_DETAIL_FAILURE](state) {
    return {
      ...state,
      pending: false
    }
  },

  // 删除数据源
  [DELETE_DATASOURCE_SUCCESS](state, { payload }) {
    const { list, total } = state
    return {
      ...state,
      total: total - 1,
      list: _.filter(list, item => item.id !== payload)
    }
  },

  // 获取API数据源参数
  [FETCH_API_DATASOURCE_PARAMS_REQUEST](state) {
    return {
      ...state,
      apiDatasourceParamsPending: true
    }
  },

  [FETCH_API_DATASOURCE_PARAMS_SUCCESS](state, { payload }) {
    const newParams = payload.range === 'all' ? payload.params :
      payload.params.filter(item => item.range === payload.range || item.range === 'all')
    return {
      ...state,
      apiDatasourceParams: newParams,
      apiDatasourceParamsPending: false
    }
  },

  [FETCH_API_DATASOURCE_PARAMS_FAILURE](state) {
    return {
      ...state,
      apiDatasourceParamsPending: false
    }
  },

  // 获取系统内置参数
  [FETCH_API_DATASOURCE_SYS_PARAMS_SUCCESS](state, { payload }) {
    return {
      ...state,
      apiDatasourceSysParams: payload,
      apiDatasourceParamsPending: false
    }
  },

  // 获取数据表
  [FETCH_TABLES_SUCCESS](state, { payload }) {
    if (payload) {
      return {
        ...state,
        tableList: {
          ...state.tableList,
          [payload.id]: payload
        }
      };
    }
    return {
      ...state,
    }
  },

  [FETCH_DATASOURCE_TABLES_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },

  // 获取数据表
  [FETCH_DATASOURCE_TABLES_SUCCESS](state, { payload }) {
    const newList = payload.page > 1 ? state.dataSourceTables.concat(payload.list) : payload.list
    return {
      ...state,
      pending: false,
      dataSourceTables: newList,
      dataSourceTablesPage: +payload.page,
      dataSourceTablesTotal: +payload.total
    }
  },

  [FETCH_DATASOURCE_TABLES_FAILURE](state) {
    return {
      ...state,
      pending: false
    }
  },
  
  // 清空数据源详情
  [CLEAR_DATASOURCE_INFO_SUCCESS](state) {
    return {
      ...state,
      info: {}
    }
  },

  // 清空数据表
  [CLEAR_DATASOURCE_TABLES_SUCCESS](state) {
    return {
      ...state,
      dataSourceTables: []
    }
  },

  // 清空参数数据
  [CLEAR_DATASOURCE_PARAMS_SUCCESS](state) {
    return {
      ...state,
      apiDatasourceParams: []
    }
  }
}, initialState)
