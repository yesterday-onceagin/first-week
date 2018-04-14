import { createAction, handleActions } from 'redux-actions'
import { CALL_API } from 'redux-api-middleware'

import getApiPath from '../../../helpers/getApiPath';
import getFetchOptions from '../../../helpers/getFetchOptions';
import XStorage from '../../../helpers/XStorage';

// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */

// 获取清洗流程详情
const FETCH_FLOW_DATA_REQUEST = Symbol('FETCH_FLOW_DATA_REQUEST');
const FETCH_FLOW_DATA_SUCCESS = Symbol('FETCH_FLOW_DATA_SUCCESS');
const FETCH_FLOW_DATA_FAILURE = Symbol('FETCH_FLOW_DATA_FAILURE');
// 获取数据表
const FETCH_TABLES_SUCCESS = Symbol('FETCH_TABLES_SUCCESS');
// 重置数据清洗详情数据
const RESET_LOCAL_FLOW_DATA_SUCCESS = Symbol('RESET_LOCAL_FLOW_DATA_SUCCESS');
// 更新数据清洗流程数据(本地更新/接口提交)
const UPDATE_FLOW_DATA_REQUEST = Symbol('UPDATE_FLOW_DATA_REQUEST');
const UPDATE_LOCAL_FLOW_DATA_SUCCESS = Symbol('UPDATE_LOCAL_FLOW_DATA_SUCCESS');
const UPDATE_FLOW_DATA_SUCCESS = Symbol('UPDATE_FLOW_DATA_SUCCESS');
const UPDATE_FLOW_DATA_FAILURE = Symbol('UPDATE_FLOW_DATA_FAILURE');
// 新增流程节点
const ADD_FLOW_NODE_SUCCESS = Symbol('ADD_FLOW_NODE_SUCCESS');
// 删除流程节点
const DELETE_FLOW_NODE_SUCCESS = Symbol('DELETE_FLOW_NODE_SUCCESS');
const DELETE_LOCAL_FLOW_NODE_SUCCESS = Symbol('DELETE_LOCAL_FLOW_NODE_SUCCESS');
// 更新流程节点(本地更新/接口提交)
const UPDATE_LOCAL_FLOW_NODE_SUCCESS = Symbol('UPDATE_LOCAL_FLOW_NODE_SUCCESS');
const UPDATE_FLOW_NODE_SUCCESS = Symbol('UPDATE_FLOW_NODE_SUCCESS');
// 获取右侧弹出菜单系统函数详情
const FETCH_SYS_FUNCTIONS_REQUEST = Symbol('FETCH_SYS_FUNCTIONS_REQUEST');
const FETCH_SYS_FUNCTIONS_SUCCESS = Symbol('FETCH_SYS_FUNCTIONS_SUCCESS');
const FETCH_SYS_FUNCTIONS_FAILURE = Symbol('FETCH_SYS_FUNCTIONS_FAILURE');
// 测试SQL节点
const FETCH_SQL_EXEC_SUCCESS = Symbol('FETCH_SQL_EXEC_SUCCESS');
// 获取SQL日志
const FETCH_SQL_LOGS_SUCCESS = Symbol('FETCH_SQL_LOGS_SUCCESS');
// 格式化SQL
const FETCH_FORMAT_SQL_SUCCESS = Symbol('FETCH_FORMAT_SQL_SUCCESS');

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

// 获取数据清洗流程详情
export const fetchFlowData = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/get', { id }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_FLOW_DATA_REQUEST, {
          type: FETCH_FLOW_DATA_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FLOW_DATA_FAILURE
      ]
    }
  }
};

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
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
};

// 重置数据清洗详情数据
export const resetLocalFlowData = createAction(RESET_LOCAL_FLOW_DATA_SUCCESS);

// 更新数据清洗流程数据(本地更新/接口提交)
export const updateLocalFlowData = createAction(UPDATE_LOCAL_FLOW_DATA_SUCCESS);

export const updateFlowData = (data, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/update'), 'POST', {
    body: JSON.stringify(data)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        UPDATE_FLOW_DATA_REQUEST, {
          type: UPDATE_FLOW_DATA_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return data;
            }
            return null;
          }
        },
        UPDATE_FLOW_DATA_FAILURE
      ]
    }
  }
};

// 增加流程节点
export const addFlowNode = (data, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/node/add'), 'POST', {
    body: JSON.stringify(data)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: (json) => {
        if (json.result) {
          json.node = {
            id: json.data,
            is_end: 1,
            is_start: 1,
            content: '',
            ...data
          };
        } else {
          json.node = null;
        }
        callback(json);
      },
      types: [
        'FETCH_REQUEST',
        {
          type: ADD_FLOW_NODE_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              json.node = {
                id: json.data,
                is_end: 1,
                is_start: 1,
                content: '',
                ...data
              };
            } else {
              json.node = null;
            }
            return json.node;
          }
        },
        'FETCH_FAILURE'
      ]
    }
  }
};

// 删除流程节点(本地更新/接口提交)
export const deleteLocalFlowNode = createAction(DELETE_LOCAL_FLOW_NODE_SUCCESS);

export const deleteFlowNode = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/node/delete'), 'POST', {
    body: { id }
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: DELETE_FLOW_NODE_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return id;
            }
            return null;
          }
        },
        'FETCH_FAILURE'
      ]
    }
  }
};

// 更新流程节点(本地更新/接口提交)
export const updateLocalFlowNode = createAction(UPDATE_LOCAL_FLOW_NODE_SUCCESS);

export const updateFlowNode = (node, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/node/update'), 'POST', {
    body: JSON.stringify(node)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: UPDATE_FLOW_NODE_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              json.node = node;
            } else {
              json.node = null;
            }
            return json.node;
          }
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 获取系统函数
export const fetchSysFunctions = (callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/odps_sql_node/functions'));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_SYS_FUNCTIONS_REQUEST, {
          type: FETCH_SYS_FUNCTIONS_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_SYS_FUNCTIONS_FAILURE
      ]
    }
  }
};

// 测试SQL
export const fetchSQLEXEC = (sqlText, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/odps_sql_node/exec_odps_sql'), 'POST', {
    body: JSON.stringify({
      sql_text: sqlText
    })
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_SQL_EXEC_SUCCESS,
          payload: (action, state, json) => json
        },
        'FETCH_FAILURE'
      ]
    }
  }
};

// 获取SQL logs
export const fetchSQLLogs = (instanceId, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/odps_sql_node/get_sql_log', {
    instance_id: instanceId
  }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_SQL_LOGS_SUCCESS,
          payload: (action, state, json) => json
        },
        'FETCH_FAILURE'
      ]
    }
  }
};

// 格式化SQL
export const fetchFormatSQL = (sqlText, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('flow/odps_sql_node/format_odps_sql'), 'POST', {
    body: JSON.stringify({
      sql_text: sqlText
    })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_FORMAT_SQL_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
};

// 获取表字段
export const fetchRDSTableCloumns = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/table_columns', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'FETCH_RDS_TABLES_COLUMNS_SUCCESS',
          payload: (action, state, json) => json
        },
        'FETCH_FAILURE'
      ]
    }
  }
};

// 建表
export const createTable = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/create_table'), 'POST', {
    body: JSON.stringify(params)
  });
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'CREATE_TABLES_BY_SQL_SUCCESS',
          payload: (action, state, json) => json
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 获取表字段的值
export const fetchTableColumnValue = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/table_column_values', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'FETCH_TABLES_COLUMNS_VALUE_SUCCESS',
          payload: (action, state, json) => json
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 获取指标
export const fetchDimIndicator = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/list', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'FETCH_DIM_INDICATOR_SUCCESS',
          payload: (action, state, json) => json
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 获取指标维度
export const fetchTableColumnDimension = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/dimension/list', params));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'FETCH_TABLES_COLUMNS_VALUE_DIMENSION_SUCCESS',
          payload: (action, state, json) => json
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 获取数据源列表
export const fetchDataSources = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('data_source/list', {
    ...params,
    page_size: 100000
  }));
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_DATASOURCE_REQUEST', {
          type: 'FETCH_DATASOURCE_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_DATASOURCE_FAILURE'
      ]
    }
  }
}


/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchFlowData,        // 获取清洗流程
  fetchTables,          // 获取数据表
  resetLocalFlowData,   // 本地重置清洗详情数据
  updateLocalFlowData,  // 本地更新清洗流程数据
  updateFlowData,       // 更新清洗流程数据到服务器
  addFlowNode,          // 增加流程节点
  deleteLocalFlowNode,  // 本地删除流程节点
  deleteFlowNode,       // 删除流程节点提交到服务器
  updateLocalFlowNode,  // 本地更新流程节点
  updateFlowNode,       // 更新流程节点到服务器
  fetchSysFunctions,    // 获取右侧菜单-系统函数
  fetchSQLEXEC,         // 测试SQL节点
  fetchSQLLogs,         // 获取SQL日志
  fetchFormatSQL,       // 格式化SQL
  fetchRDSTableCloumns, // RDS 获取对应表的字段
  createTable,          // 创建table

  fetchTableColumnValue, // MAPING
  fetchDimIndicator,
  fetchTableColumnDimension, // MAPING

  fetchDataSources,     // 获取数据源
}

// ------------------------------------
// Reducers
// ------------------------------------
const initialState = {
  pending: false,
  // 流程主数据
  isEdit: false,
  flowData: {
    build_in: 0,
    depend_flow_id: null,
    description: '',
    id: '',
    lines: [],
    name: '',
    nodes: [],
    schedule: null,
    status: '禁用',
    type: '数据清洗'
  },
  // 右侧菜单-系统函数
  sysFunctions: {
    pending: false,
    data: []
  }
}


export default handleActions({
  [FETCH_FLOW_DATA_REQUEST](state) {
    return {
      ...state,
      isEdit: false,
      pending: true
    }
  },
  [FETCH_FLOW_DATA_FAILURE](state) {
    return {
      ...state,
      isEdit: false,
      pending: false
    }
  },
  // 获取flow-data
  [FETCH_FLOW_DATA_SUCCESS](state, action) {
    const newFlowData = action.payload;

    if (Array.isArray(newFlowData.nodes) && newFlowData.nodes.length > 0) {
      newFlowData.nodes = newFlowData.nodes.map((node, index) => {
        const newPos = {
          x: 250 * (Math.floor(index / 5) + 1),
          y: 10 + (index % 5) * 150
        };
        if (!node.position || !node.position.x) {
          node.position = newPos;
        }
        return node;
      });
    }

    return {
      ...state,
      pending: false,
      isEdit: false,
      flowData: newFlowData
    }
  },
  // 重置flowdata
  [RESET_LOCAL_FLOW_DATA_SUCCESS](state) {
    return {
      ...state,
      isEdit: false,
      flowData: {
        build_in: 0,
        depend_flow_id: null,
        description: '',
        id: '',
        lines: [],
        name: '',
        nodes: [],
        schedule: null,
        status: '禁用',
        type: '数据清洗'
      }
    };
  },
  // 更新清洗流程数据loading
  [UPDATE_FLOW_DATA_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },
  [UPDATE_FLOW_DATA_FAILURE](state) {
    return {
      ...state,
      pending: false
    }
  },
  // 更新本地清洗流程数据
  [UPDATE_LOCAL_FLOW_DATA_SUCCESS](state, { payload }) {
    return {
      ...state,
      pending: false,
      isEdit: true,
      flowData: {
        ...payload
      }
    }
  },
  // 更新清洗流程数据到服务器
  [UPDATE_FLOW_DATA_SUCCESS](state, action) {
    if (action.payload) {
      // 删除该流程下所有节点缓存数据
      if (action.payload.nodes.length > 0) {
        removeNodesCache(action.payload.nodes.map(node => node.id));
      }
      return {
        ...state,
        pending: false,
        isEdit: false,
        flowData: { ...action.payload }
      };
    }
    return {
      ...state
    };
  },
  // 获取系统函数
  [FETCH_SYS_FUNCTIONS_REQUEST](state) {
    // 加载的时候 loading
    return {
      ...state,
      sysFunctions: {
        ...state.sysFunctions,
        pending: true
      }
    }
  },
  [FETCH_SYS_FUNCTIONS_FAILURE](state) {
    // 加载的时候 loading
    return {
      ...state,
      sysFunctions: {
        ...state.sysFunctions,
        pending: false
      }
    }
  },
  [FETCH_SYS_FUNCTIONS_SUCCESS](state, action) {
    // 加载的时候 loading
    return {
      ...state,
      sysFunctions: {
        ...state.sysFunctions,
        pending: false,
        data: action.payload
      }
    }
  },
  // 新增流程节点
  [ADD_FLOW_NODE_SUCCESS](state, action) {
    if (action.payload) {
      const newFlowData = {
        ...state.flowData,
        nodes: nodesManager(state.flowData.nodes, 'add', action.payload)
      };
      return {
        ...state,
        isEdit: true,
        flowData: newFlowData
      };
    }
    return {
      ...state
    };
  },

  // 本地删除流程节点(传ID)
  [DELETE_LOCAL_FLOW_NODE_SUCCESS](state, { payload }) {
    const newLines = deleteLinesByNode(state.flowData.lines, payload);
    let newNodes = nodesManager(state.flowData.nodes, 'delete', payload);

    newNodes = newNodes.map((node) => {
      if (newLines.some(line => line.ahead_node_id === node.id)) {
        // 若目前的线当中仍然有以该节点为终点的
        node.is_end = 0;
      } else {
        node.is_end = 1;
      }

      if (newLines.some(line => line.behind_node_id === node.id)) {
        node.is_start = 0;
      } else {
        node.is_start = 1;
      }

      return node;
    });

    const newFlowData = {
      ...state.flowData,
      lines: newLines,
      nodes: newNodes
    };
    return {
      ...state,
      isEdit: true,
      flowData: newFlowData
    };
  },

  // 更新本地流程节点数据
  [UPDATE_LOCAL_FLOW_NODE_SUCCESS](state, { payload }) {
    const newFlowData = {
      ...state.flowData,
      nodes: nodesManager(state.flowData.nodes, 'update', payload)
    };
    return {
      ...state,
      isEdit: true,
      flowData: newFlowData
    };
  },

  // 更新流程节点数据到服务器
  [UPDATE_FLOW_NODE_SUCCESS](state, action) {
    if (action.payload) {
      // 已更新到服务器成功，删除本地缓存
      removeNodesCache(action.payload.id);
      const newFlowData = {
        ...state.flowData,
        nodes: nodesManager(state.flowData.nodes, 'update', action.payload)
      };
      return {
        ...state,
        flowData: newFlowData
      };
    }
    return {
      ...state
    };
  },

}, initialState)

/*
* 节点管理
* @nodes：原节点数据
* @action：即将进行的操作（delete/add/update）
* @newNode：add/update时为节点object，delete时为节点id
*/
function nodesManager(nodes, action, newNode) {
  let newNodes = [];

  switch (action) {
    case 'delete':
      // 同时删除相关缓存
      removeNodesCache(newNode);
      newNodes = nodes.filter(node => node.id !== newNode);
      break;
    case 'add':
      newNodes = nodes.concat();
      newNodes.push(newNode);
      break;
    case 'update':
      newNodes = nodes.map((node) => {
        if (node.id === newNode.id) {
          return newNode;
        }
        return node;
      });
      break;
    default:
      break;
  }

  return newNodes;
}

/*
* 删除节点时同时删除连线
*/
function deleteLinesByNode(lines, nodeId) {
  return lines.filter(line =>
    // 删除的该节点相关的所有连线都需要过滤掉
    nodeId !== line.behind_node_id && nodeId !== line.ahead_node_id);
}

/*
* 清除流程下所有节点的缓存
*/
function removeNodesCache(nodeIds) {
  if (typeof nodeIds === 'string') {
    XStorage.removeObjSeparate(nodeIds);
  } else if (Array.isArray(nodeIds) && nodeIds.length > 0) {
    nodeIds.map((nodeId) => {
      XStorage.removeObjSeparate(nodeId);
    });
  }
}

