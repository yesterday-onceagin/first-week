import { createAction, handleActions } from 'redux-actions';
import { CALL_API, getJSON, ApiError } from 'redux-api-middleware';
import { arrayMove } from 'react-sortable-hoc';

import getApiPath from '../../../helpers/getApiPath';
import param from '../../../helpers/param';
import getFetchOptions from '../../../helpers/getFetchOptions';


// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */

// 指标类型请求与失败(触发pending)
const FETCH_TYPE_REQUEST = Symbol('FETCH_TYPE_REQUEST');
const FETCH_TYPE_FAILURE = Symbol('FETCH_TYPE_FAILURE');
// 指标请求与失败(触发pending)
const FETCH_INDICATOR_REQUEST = Symbol('FETCH_INDICATOR_REQUEST');
const FETCH_INDICATOR_FAILURE = Symbol('FETCH_INDICATOR_FAILURE');
// 指标详情的请求与失败(触发pending)
const FETCH_INDICATOR_DETAIL_REQUEST = Symbol('FETCH_INDICATOR_DETAIL_REQUEST');
const FETCH_INDICATOR_DETAIL_FAILURE = Symbol('FETCH_INDICATOR_DETAIL_FAILURE');

// 获取业务指标类型列表
const FETCH_TYPE_LIST_SUCCESS = Symbol('FETCH_TYPE_LIST_SUCCESS');
// 新增业务指标类型
const FETCH_ADD_TYPE_SUCCESS = Symbol('FETCH_ADD_TYPE_SUCCESS');
// 修改业务指标类型
const FETCH_UPDATE_TYPE_SUCCESS = Symbol('FETCH_UPDATE_TYPE_SUCCESS');
// 删除业务指标类型
const FETCH_DELETE_TYPE_SUCCESS = Symbol('FETCH_DELETE_TYPE_SUCCESS');
// 修改业务指标类型排序
const FETCH_RANK_TYPE_SUCCESS = Symbol('FETCH_RANK_TYPE_SUCCESS');
// 获取业务指标列表
const FETCH_INDICATOR_LIST_SUCCESS = Symbol('FETCH_INDICATOR_LIST_SUCCESS');
// 重置指标类型列表、指标列表
const RESET_TYPE_AND_INDICATOR_LIST_SUCCESS = Symbol('RESET_TYPE_AND_INDICATOR_LIST_SUCCESS');
// 清空指标列表
const CLEAR_INDICATOR_LIST_SUCCESS = Symbol('CLEAR_INDICATOR_LIST_SUCCESS');
// 获取指标下的维度列表
const FETCH_DIMENSION_LIST_SUCCESS = Symbol('FETCH_DIMENSION_LIST_SUCCESS');
// 获取指标数据
const FETCH_INDICATOR_DATA_SUCCESS = Symbol('FETCH_INDICATOR_DATA_SUCCESS');
// 新增指标
const FETCH_ADD_INDICATOR_SUCCESS = Symbol('FETCH_ADD_INDICATOR_SUCCESS');
// 修改指标
const FETCH_UPDATE_INDICATOR_SUCCESS = Symbol('FETCH_UPDATE_INDICATOR_SUCCESS');
// 删除指标
const FETCH_DELETE_INDICATOR_SUCCESS = Symbol('FETCH_DELETE_INDICATOR_SUCCESS');
// 修改指标排序
const FETCH_RANK_INDICATOR_SUCCESS = Symbol('FETCH_RANK_INDICATOR_SUCCESS');
// 配置指标
const FETCH_CONFIG_INDICATOR_SUCCESS = Symbol('FETCH_CONFIG_INDICATOR_SUCCESS');

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------

// 获取业务指标类型列表
export const fetchTypeList = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/type/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TYPE_REQUEST, {
          type: FETCH_TYPE_LIST_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_TYPE_FAILURE
      ]
    }
  }
};

// 新增业务指标类型
export const fetchAddType = (newType, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/type/add'), 'POST', {
    body: JSON.stringify(newType)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_ADD_TYPE_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return {
                name: newType.name,
                id: json.data
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

// 修改业务指标类型
export const fetchUpdateType = (newType, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/type/update'), 'POST', {
    body: JSON.stringify(newType)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TYPE_REQUEST, {
          type: FETCH_UPDATE_TYPE_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return {
                id: newType.id,
                name: newType.name
              };
            }
            return null
          }
        },
        FETCH_TYPE_FAILURE
      ]
    }
  }
};

// 删除业务指标类型
export const fetchDeleteType = (typeId, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/type/delete'), 'POST', {
    body: JSON.stringify({ id: typeId })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TYPE_REQUEST, {
          type: FETCH_DELETE_TYPE_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return typeId;
            }
            return null;
          }
        },
        FETCH_TYPE_FAILURE
      ]
    }
  }
};

// 修改业务指标类型排序
export const fetchRankType = (newRank, callback) => {
  const { newIndex, oldIndex, ...rankParams } = newRank;

  const fetchOptions = getFetchOptions(getApiPath('indicator/type/update_rank'), 'POST', {
    body: JSON.stringify(rankParams)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_TYPE_REQUEST, {
          type: FETCH_RANK_TYPE_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return {
                newIndex,
                oldIndex
              }
            }
            return null;
          }
        },
        FETCH_TYPE_FAILURE
      ]
    }
  }
};

// 获取业务指标列表
export const fetchIndicatorList = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_INDICATOR_REQUEST, {
          type: FETCH_INDICATOR_LIST_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_INDICATOR_FAILURE
      ]
    }
  }
};

// 重置指标类型列表、指标列表
export const resetTypeAndIndicatorList = createAction(RESET_TYPE_AND_INDICATOR_LIST_SUCCESS);
// 清空指标列表
export const clearIndicatorList = createAction(CLEAR_INDICATOR_LIST_SUCCESS);

// 获取指标下的维度列表
export const fetchDimensionList = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/dimension/list', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_DIMENSION_LIST_SUCCESS,
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
};

// 获取指标数据
export const fetchIndicatorData = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/get', { id }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_INDICATOR_DETAIL_REQUEST, {
          type: FETCH_INDICATOR_DATA_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_INDICATOR_DETAIL_FAILURE
      ]
    }
  }
};

// 新增指标
export const fetchAddIndicator = (newIndicator, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/add'), 'POST', {
    body: JSON.stringify(newIndicator)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_INDICATOR_DETAIL_REQUEST, {
          type: FETCH_ADD_INDICATOR_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return {
                ...newIndicator,
                id: json.data
              };
            }
            return null;
          }
        },
        FETCH_INDICATOR_DETAIL_FAILURE
      ]
    }
  }
};

// 修改指标
export const fetchUpdateIndicator = (newIndicator, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/update'), 'POST', {
    body: JSON.stringify(newIndicator)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_INDICATOR_DETAIL_REQUEST, {
          type: FETCH_UPDATE_INDICATOR_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return newIndicator;
            }
            return null;
          }
        },
        FETCH_INDICATOR_DETAIL_FAILURE
      ]
    }
  }
};

// 删除指标
export const fetchDeleteIndicator = (indicatorId, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/delete'), 'POST', {
    body: JSON.stringify({ id: indicatorId })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_INDICATOR_REQUEST, {
          type: FETCH_DELETE_INDICATOR_SUCCESS,
          payload: (action, state, json) => {
            if (json.result) {
              return indicatorId;
            }
            return null;
          }
        },
        FETCH_INDICATOR_FAILURE
      ]
    }
  }
};

// 修改指标排序
export const fetchRankIndicator = (newRank, callback) => {
  const { data, ...rankParams } = newRank;

  const fetchOptions = getFetchOptions(getApiPath('indicator/update_rank'), 'POST', {
    body: JSON.stringify(rankParams)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_INDICATOR_REQUEST, {
          type: FETCH_RANK_INDICATOR_SUCCESS,
          payload: (action, state, json) => (json.result ? data : null)
        },
        FETCH_INDICATOR_FAILURE
      ]
    }
  }
};

// 配置指标
export const fetchConfigIndicator = (configData, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('indicator/config'), 'POST', {
    body: JSON.stringify(configData)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_INDICATOR_REQUEST, {
          type: FETCH_CONFIG_INDICATOR_SUCCESS,
          payload: (action, state, json) => (json.result ? configData : null)
        },
        FETCH_INDICATOR_FAILURE
      ]
    }
  }
};

/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchTypeList,                                      // 获取业务指标类型列表
  fetchAddType,                                       // 新增业务指标类型
  fetchUpdateType,                                    // 修改业务指标类型
  fetchDeleteType,                                    // 删除业务指标类型
  fetchRankType,                                      // 修改业务指标类型排序
  fetchIndicatorList,                                 // 获取业务指标列表
  resetTypeAndIndicatorList,                          // 重置指标类型列表、指标列表
  clearIndicatorList,                                 // 清空指标列表
  fetchDimensionList,                                 // 获取指标下的维度列表
  fetchIndicatorData,                                 // 获取指标数据
  fetchAddIndicator,                                  // 新增指标
  fetchUpdateIndicator,                               // 修改指标
  fetchDeleteIndicator,                               // 删除指标
  fetchRankIndicator,                                 // 修改指标排序
  fetchConfigIndicator,                               // 配置指标
};

// ------------------------------------
// Reducers
// ------------------------------------
const initialState = {
  pending: false,
  pending_indicator: false,
  pending_detail: false,
  typeList: [],
  indicatorList: []
};

export default handleActions({
  // 指标类型pending
  [FETCH_TYPE_REQUEST](state) {
    return {
      ...state,
      pending: true
    }
  },
  [FETCH_TYPE_REQUEST](state) {
    return {
      ...state,
      pending: false
    }
  },
  // 指标pending
  [FETCH_INDICATOR_REQUEST](state) {
    return {
      ...state,
      pending_indicator: true
    }
  },
  [FETCH_INDICATOR_FAILURE](state) {
    return {
      ...state,
      pending_indicator: false
    }
  },
  // 指标详情pending
  [FETCH_INDICATOR_DETAIL_REQUEST](state) {
    return {
      ...state,
      pending_detail: true,
    }
  },
  [FETCH_INDICATOR_DETAIL_FAILURE](state) {
    return {
      ...state,
      pending_detail: false,
    }
  },
  // 获取业务指标类型列表
  [FETCH_TYPE_LIST_SUCCESS](state, action) {
    if (action.payload) {
      return {
        ...state,
        typeList: action.payload,
        pending: false
      }
    }
    return {
      ...state,
      pending: false
    };
  },
  // 新增业务指标类型
  [FETCH_ADD_TYPE_SUCCESS](state, action) {
    if (action.payload) {
      const newTypeList = state.typeList.concat();
      newTypeList.push(action.payload);
      return {
        ...state,
        pending: false,
        typeList: newTypeList
      };
    }
    return {
      ...state,
      pending: false
    };
  },
  // 修改业务指标类型
  [FETCH_UPDATE_TYPE_SUCCESS](state, action) {
    if (action.payload) {
      const newTypeList = state.typeList.map((type) => {
        if (type.id === action.payload.id) {
          type.name = action.payload.name;
        }
        return type;
      });
      return {
        ...state,
        pending: false,
        typeList: newTypeList
      };
    }
    return {
      ...state,
      pending: false
    };
  },
  // 删除业务指标类型
  [FETCH_DELETE_TYPE_SUCCESS](state, action) {
    if (action.payload) {
      const newTypeList = state.typeList.filter(type => type.id !== action.payload);
      return {
        ...state,
        typeList: newTypeList,
        pending: false
      }
    }
    return  {
      ...state,
      pending: false
    }
  },
  // 修改业务指标类型排序
  [FETCH_RANK_TYPE_SUCCESS](state, action) {
    if (action.payload) {
      const newTypeList = state.typeList.concat();

      return {
        ...state,
        pending: false,
        typeList: arrayMove(newTypeList, action.payload.oldIndex, action.payload.newIndex)
      }
    }
    return  {
      ...state,
      pending: false
    };
  },
  // 获取业务指标列表
  [FETCH_INDICATOR_LIST_SUCCESS](state, action) {
    if (action.payload) {
      return {
        ...state,
        indicatorList: action.payload,
        pending_indicator: false
      };
    }
    return {
      ...state,
      pending_indicator: false
    };
  },
  // 重置指标类型列表、指标列表
  [RESET_TYPE_AND_INDICATOR_LIST_SUCCESS](state) {
    return {
      ...state,
      pending: false,
      pending_indicator: false,
      pending_detail: false,
      typeList: [],
      indicatorList: [],
    }
  },
  // 清空指标列表
  [CLEAR_INDICATOR_LIST_SUCCESS](state) {
    return {
      ...state,
      indicatorList: []
    };
  },
  // 获取指标数据
  [FETCH_INDICATOR_DATA_SUCCESS](state) {
    return {
      ...state,
      pending_detail: false
    }
  },
  // 新增指标
  [FETCH_ADD_INDICATOR_SUCCESS](state, action) {
    if (action.payload) {
      const newList = state.indicatorList.concat();
      newList.push(action.payload)

      return {
        ...state,
        indicatorList: newList,
        pending_detail: false
      };
    }
    return {
      ...state,
      pending_detail: false
    };
  },
  // 修改指标
  [FETCH_UPDATE_INDICATOR_SUCCESS](state, action) {
    if (action.payload) {
      return {
        ...state,
        indicatorList: state.indicatorList.map((indicator) => {
          if (indicator.id === action.payload.id) {
            // 仅更新列表中展示的项即可
            indicator.name = action.payload.name;
            indicator.type = action.payload.type;
          }
          return indicator;
        }),
        pending_detail: false
      };
    }
    return {
      ...state,
      pending_detail: false
    };
  },
  // 删除指标
  [FETCH_DELETE_INDICATOR_SUCCESS](state, action) {
    if (action.payload) {
      const newIndicatorList = state.indicatorList.filter(indicator => indicator.id !== action.payload);
      return {
        ...state,
        indicatorList: newIndicatorList,
        pending_indicator: false
      }
    }
    return  {
      ...state,
      pending_indicator: false
    }
  },
  // 修改指标排序
  [FETCH_RANK_INDICATOR_SUCCESS](state, action) {
    if (action.payload) {
      return {
        ...state,
        indicatorList: action.payload,
        pending_indicator: false
      }
    }
    return {
      ...state,
      pending_indicator: false
    }
  },
  // 配置指标
  [FETCH_CONFIG_INDICATOR_SUCCESS](state, action) {
    if (action.payload) {
      const newList = state.indicatorList.map((item) => {
        if (item.id === action.payload.id) {
          item.odps_field = action.payload.odps_field;
          item.odps_table = action.payload.odps_table;
        }

        return item;
      });

      return {
        ...state,
        indicatorList: newList,
        pending_indicator: false
      }
    }
    return {
      ...state,
      pending_indicator: false
    }
  }
}, initialState);
