import { createAction, handleActions } from 'redux-actions';
import { CALL_API } from 'redux-api-middleware';

import getApiPath from '../../../helpers/getApiPath';
import getFetchOptions from '../../../helpers/getFetchOptions';
import { treeFormat, deleteTreeNodeByPath, updateTreeNodeByPath, getTreeNodeByPath, getArrayFromTree } from '../../../helpers/groupTreeUtils';
import { TYPE_NAMES } from '../../../views/new_dataset/constants';
import _ from 'lodash';

// 根据关键字为树的各节点设置hidden属性
function setTreeNodeHiddenStatus(treeArr, keyword) {
  return treeArr.map((node) => {
    // 大小写忽略
    node.hidden = node.name.toUpperCase().indexOf(keyword.toUpperCase()) === -1
    if (keyword !== '') {
      node.init_spread = !node.hidden || node.init_spread
    }
    node.all_sub_hidden = false;
    if (Array.isArray(node.sub) && node.sub.length > 0) {
      node.sub = setTreeNodeHiddenStatus(node.sub, keyword);
    }
    return node;
  });
}

// 根据 path 找出 对应节点的 
function findNodeByParentPath(treeArr, paths) {
  let node = null

  if (Array.isArray(treeArr)) {
    if (paths.length > 1) {
      node = paths.reduce((target, curr) => target[curr].sub, treeArr)
    } else {
      node = treeArr[paths[0]].sub
    }
  }

  return node
}

// 向上检查需要显示的节点父级是否hidden
function setNodeParentHideStatus(treeArr, node) {
  if (node.parent_id) {
    const parent_path = node.path.slice(0, -1);
    const parentNode = getTreeNodeByPath(treeArr, parent_path.slice());
    // 展开所有父节点
    if (parentNode) {
      parentNode.init_spread = true;
      if (parentNode.hidden) {
        parentNode.hidden = false;
        updateTreeNodeByPath(treeArr, parentNode, parent_path.slice());
      }
      // 继续检查父节点
      setNodeParentHideStatus(treeArr, parentNode);
    }
  }
}

// 向下检查并设置所有的子节点显示
function setTreeNodeAllSubShow(treeArr) {
  return treeArr.map((item) => {
    item.hidden = false;
    if (Array.isArray(item.sub) && item.sub.length > 0) {
      item.sub = setTreeNodeAllSubShow(item.sub);
    }
    return item;
  });
}

// 树节点的移动
function treeMove(treeArr, source, target) {
  const delPath = source.path.slice();
  const insertPath = target.path.slice();
  const delIndex = delPath.pop();

  const insertNode = getTreeNodeByPath(treeArr, insertPath.slice());

  if (source.parent_id && delPath.length > 0) {
    const delNodeParent = getTreeNodeByPath(treeArr, delPath.slice());
    const delNode = delNodeParent.sub.splice(delIndex, 1)[0];
    // 改变parent_id
    delNode.parent_id = insertNode.id;
    // 目标文件夹强制展开
    insertNode.init_spread = true;

    if (delNode.type !== TYPE_NAMES.folder) {
      insertNode.sub.push(delNode);
    } else {
      insertNode.sub.unshift(delNode);
    }
  } else {
    const delNode = treeArr.splice(delIndex, 1)[0];

    // 改变parent_id
    delNode.parent_id = insertNode.id;
    // 目标文件夹强制展开
    insertNode.init_spread = true;

    if (delNode.type !== TYPE_NAMES.folder) {
      insertNode.sub.push(delNode);
    } else {
      insertNode.sub.unshift(delNode);
    }
  }
}

// 以关键字过滤文件夹
function setFolderHideStatusByKeyword(treeArr, keyword) {
  keyword = keyword.trim();
  const newTree = setTreeNodeHiddenStatus(treeArr, keyword);
  // 如果关键字为空 直接返回结果 跳过过滤计算
  if (!keyword) {
    return newTree;
  }
  const newList = getArrayFromTree(newTree).filter(item => !item.hidden);
  // 向上检查需要显示的节点父级是否hidden
  newList.map(node => setNodeParentHideStatus(newTree, node));

  // 向下遍历 展示所有子节点
  newList.forEach((node) => {
    if (Array.isArray(node.sub) && node.sub.length > 0) {
      node.sub = setTreeNodeAllSubShow(node.sub);
      updateTreeNodeByPath(newTree, node, node.path.slice());
    }
  });
  return newTree;
}

// 数据集格式化同时还原spread状态
function datasetTreeFormat(treeArr, currLevel, path = [], spreads = {}) {
  return treeArr.map((item, index) => {
    item.level = currLevel;
    const _path_ = [...path, index];
    item.path = _path_;
    if (spreads && spreads[item.id]) {
      item.init_spread = true;
    }
    if (Array.isArray(item.sub) && item.sub.length > 0) {
      item.sub = datasetTreeFormat(item.sub, currLevel + 1, _path_, spreads);
    }
    return item;
  });
}

// 过滤仅有文件夹的树并同时格式化
function folderTreeFormat(treeArr, currLevel, path = []) {
  return treeArr.filter(item => item.type === TYPE_NAMES.folder).map((item, index) => {
    item.level = currLevel;
    const _path_ = [...path, index];
    item.path = _path_;
    if (Array.isArray(item.sub) && item.sub.length > 0) {
      item.sub = folderTreeFormat(item.sub, currLevel + 1, _path_);
    }
    return item;
  });
}

// 根据路径为树添加节点
function addFolderByPath(treeArr, data, path, isInsert) {
  const idx = path.shift();
  if (Array.isArray(path) && path.length > 0) {
    addFolderByPath(treeArr[idx].sub, data, path, isInsert);
  } else if (Array.isArray(treeArr[idx].sub) && treeArr[idx].sub.length > 0) {
    const newFolder = {
      ...data,
      path: [...treeArr[idx].path, 0],
      level: treeArr[idx].level + 1,
      sub: []
    };
    treeArr[idx].init_spread = true;
    // 不再是 直接添加。而是替换
    let _path = -1
    if (Array.isArray(data.path) && data.path.length > 0) {
      _path = data.path[data.path.length - 1]
    }
    if (_path > -1 && !isInsert) {
      treeArr[idx].sub[_path] = newFolder;
    } else {
      treeArr[idx].sub.unshift(newFolder)
    }
  } else {
    treeArr[idx].init_spread = true;
    treeArr[idx].sub = [{
      ...data,
      path: [...treeArr[idx].path, 0],
      level: treeArr[idx].level + 1,
      sub: []
    }];
  }
}

// ------------------------------------
// Constants (Action Types)
// ------------------------------------

/**
 * 这里需要使用Symbol类型，避免和其它模块的值相同
 */
// pending的请求 REQUEST / FAILURE
const FETCH_REQUEST_WITH_PENDING = Symbol('FETCH_REQUEST_WITH_PENDING');
const FETCH_FAILURE_WITH_PENDING = Symbol('FETCH_FAILURE_WITH_PENDING');

// 获取数据集/文件夹树
const FETCH_DATASET_TREE_REQUEST = Symbol('FETCH_DATASET_TREE_REQUEST');
const FETCH_DATASET_TREE_SUCCESS = Symbol('FETCH_DATASET_TREE_SUCCESS');
const FETCH_DATASET_TREE_FAILURE = Symbol('FETCH_DATASET_TREE_FAILURE');
// 获取只有文件夹的树
const FETCH_FOLDER_TREE_SUCCESS = Symbol('FETCH_FOLDER_TREE_SUCCESS');
// 添加文件夹 （包含数据集）
const FETCH_ADD_FOLDER_SUCCESS = Symbol('FETCH_ADD_FOLDER_SUCCESS');
// 添加文件夹
const FETCH_ADD_ONLY_FOLDER_SUCCESS = Symbol('FETCH_ADD_ONLY_FOLDER_SUCCESS');
// 添加数据集
const FETCH_ADD_DATASET_SUCCESS = Symbol('FETCH_ADD_DATASET_SUCCESS');
// 删除数据集/文件夹
const FETCH_DELETE_DATASET_SUCCESS = Symbol('FETCH_DELETE_DATASET_SUCCESS');
// 编辑数据集
const FETCH_UPDATE_DATASET_SUCCESS = Symbol('FETCH_UPDATE_DATASET_SUCCESS');
// 重命名数据集/文件夹
const FETCH_RENAME_DATASET_SUCCESS = Symbol('FETCH_RENAME_DATASET_SUCCESS');
// 移动数据集/文件夹
const FETCH_MOVE_DATASET_SUCCESS = Symbol('FETCH_MOVE_DATASET_SUCCESS');
// 获取数据集详情
const FETCH_DATASET_DATA_SUCCESS = Symbol('FETCH_DATASET_DATA_SUCCESS');
const FETCH_DATASET_DATA_FAILUER = Symbol('FETCH_DATASET_DATA_FAILUER');
// 运行数据集获取结果(通用)
const FETCH_RUN_DATASET_SUCCESS = Symbol('FETCH_RUN_DATASET_SUCCESS');
// 获取数据集结果
const FETCH_DATASET_RESULT_SUCCESS = Symbol('FETCH_DATASET_RESULT_SUCCESS');
const FETCH_DATASET_RESULT_FAILURE = Symbol('FETCH_DATASET_RESULT_FAILURE');
// 获取数据集结果数据条数
const FETCH_DATASET_RESULT_TOTAL_SUCCESS = Symbol('FETCH_DATASET_RESULT_TOTAL_SUCCESS');
// 上传xls, txt, csv
const FETCH_UPLOAD_DATAFILE_SUCCESS = Symbol('FETCH_UPLOAD_DATAFILE_SUCCESS');
// excel刷新原数据
const FETCH_GET_FILE_DATA_SUCCESS = Symbol('FETCH_GET_FILE_DATA_SUCCESS');
const FETCH_GET_FILE_DATA_FAILURE = Symbol('FETCH_GET_FILE_DATA_FAILURE');
// 更新本地数据集字段
const UPDATE_DATASET_FIELD_SUCCESS = Symbol('UPDATE_DATASET_FIELD_SUCCESS');
// 清除数据集数据
const CLEAR_DATASET_DATA_SUCCESS = Symbol('CLEAR_DATASET_DATA_SUCCESS');
// 以关键字过滤文件夹
const FILTER_FOLDERS_SUCCESS = Symbol('FILTER_FOLDERS_SUCCESS');
// 以关键字过滤数据集/文件夹
const FILTER_DATASETS_SUCCESS = Symbol('FILTER_DATASETS_SUCCESS');
// 缓存数据集列表的展开状态
const UPDATE_DATASET_SPREADS_SUCCESS = Symbol('UPDATE_DATASET_SPREADS_SUCCESS');
// 获取 数据集下的字段
const FETCH_DATASET_TREE_FIELD_SUCCESS = Symbol('FETCH_DATASET_TREE_FIELD_SUCCESS');
// 暂存 FOLDER (包含数据集)
const TEMP_ADD_FOLDER_SUCCESS = Symbol('TEMP_ADD_FOLDER_SUCCESS')
// 暂存 FOLDER
const TEMP_ADD_ONLY_FOLDER_SUCCESS = Symbol('TEMP_ADD_ONLY_FOLDER_SUCCESS')
// 获取api 测试响应数据
const FETCH_API_DATASET_TEST_SUCCESS = Symbol('FETCH_API_DATASET_TEST_SUCCESS')
// 移除 remove folderTree
const REMOVE_TEMP_FOLDER_SUCCESS = Symbol('REMOVE_TEMP_FOLDER_SUCCESS')
// 获取 关联报告成功
const FETCH_DATASET_RELATE_SUCCESS = Symbol('FETCH_DATASET_RELATE_SUCCESS')
const FETCH_DATASET_RELATE_FAILUER = Symbol('FETCH_DATASET_RELATE_FAILUER')
// 获取 操作日志成功
const FETCH_DATASET_LOG_SUCCESS = Symbol('FETCH_DATASET_LOG_SUCCESS')
const FETCH_DATASET_LOG_FAILUER = Symbol('FETCH_DATASET_LOG_FAILUER')
// 获取 sheet id
const FETCH_DATASET_SHEET_ID_SUCCESS = Symbol('FETCH_DATASET_SHEET_ID_SUCCESS')
// 获取 sheet 数据
const FETCH_DATASET_SHEET_DATA_SUCCESS = Symbol('FETCH_DATASET_SHEET_DATA_SUCCESS')

// 清除 work sheet
const CLEAR_WORK_SHEET_SUCCESS = Symbol('CLEAR_WORK_SHEET_SUCCESS')
// 清除 sheets data
const CLEAR_SHEETS_DATA_SUCCESS = Symbol('CLEAR_SHEETS_DATA_SUCCESS')

// ------------------------------------
// Actions (Action Creator)
// ------------------------------------
//获取异步下载的链接
export const fetchDownloadDataset = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/async_download'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST',
        Symbol('FETCH_DOWNLOAD_DATASET_SUCCESS'),
        'FETCH_FAILURE'
      ]
    }
  }
}

// 获取 work sheets 的数据
export const fetchNameTask = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/get_excel_worksheet'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'FETCH_DATASET_WORKSHEET_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

export const fetchWorkSheetNames = (datasetId, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/get_task_data', { task_id: datasetId }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'FETCH_WORK_SHEET_NAMES_SUCCESS',
          payload: (action, state, json) => json.data.info
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

export const checkDatasetName = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/validation_name'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'CHECK_DATASET_WORKSHEET_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 获取sheet表的内容
export const fetchSheetId = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/async_preview'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_DATASET_SHEET_ID_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}

export const fetchDownSheetData = (datasetId, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/get_task_data', { task_id: datasetId }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST',
        Symbol('FETCH_DATASET_SHEET_DOWN_LOAD_DATA_SUCCESS'),
        'FETCH_FAILURE'
      ]
    }
  }
}

// 获取sheet表的内容
export const fetchSheetData = (datasetId, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/get_task_data', { task_id: datasetId }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_DATASET_SHEET_DATA_SUCCESS,
          payload: (action, state, json) => json.data.info
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}

// 获取关联报告数据
export const fetchDatasetRelate = (id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/relate_dashboard'), 'POST', {
    body: JSON.stringify({ id })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_DATASET_RELATE_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_DATASET_RELATE_FAILUER
      ]
    }
  }
}

// 获取 操作日志
export const fetchDatasetLog = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/operate_record'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_DATASET_LOG_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_DATASET_LOG_FAILUER
      ]
    }
  }
}

// 获取数据集/文件夹树
export const fetchDatasetTree = (folderOnly, parentId, callback) => {
  const fetchOptions = parentId === undefined ? getFetchOptions(getApiPath('dataset/tree')) : getFetchOptions(getApiPath('dataset/tree', { parent_id: parentId }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_DATASET_TREE_REQUEST, {
          type: folderOnly ? FETCH_FOLDER_TREE_SUCCESS : FETCH_DATASET_TREE_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_DATASET_TREE_FAILURE
      ]
    }
  }
}

// 获取数据集/文件夹树
export const fetchDatasetTreeParams = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/tree', params))
  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_DATASET_TREE_REQUEST, {
          type: FETCH_DATASET_TREE_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_DATASET_TREE_FAILURE
      ]
    }
  }
}

// 编辑数据集
export const fetchUpdateDataset = (newData, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/update'), 'POST', {
    body: JSON.stringify(newData)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_UPDATE_DATASET_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}

// 添加数据集/文件夹
export const fetchAddDataset = (newData, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/add'), 'POST', {
    body: JSON.stringify(newData)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: newData.type === TYPE_NAMES.folder ? FETCH_ADD_FOLDER_SUCCESS : FETCH_ADD_DATASET_SUCCESS,
          payload: (action, state, json) => (json.result ? {
            ...newData,
            id: json.data
          } : null)
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}

// 添加文件夹 (仅)
export const fetchAddFolder = (newData, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/add'), 'POST', {
    body: JSON.stringify(newData)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_ADD_ONLY_FOLDER_SUCCESS,
          payload: (action, state, json) => (json.result ? {
            ...newData,
            id: json.data
          } : null)
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}

// 删除数据集/文件夹
export const fetchDeleteDataset = (data, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/delete'), 'POST', {
    body: JSON.stringify({ id: data.id })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_DELETE_DATASET_SUCCESS,
          payload: (action, state, json) => (json.result ? data : null)
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}

// 重命名数据集/文件夹
export const fetchRenameDataset = (node, newName, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/rename'), 'POST', {
    body: JSON.stringify({
      id: node.id,
      name: newName,
      type: node.type,
      parent_id: node.parent_id
    })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_RENAME_DATASET_SUCCESS,
          payload: (action, state, json) => (json.result ? {
            ...node,
            name: newName
          } : null)
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}

// 移动数据集/文件夹
export const fetchMoveDataset = (source, target, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/move'), 'POST', {
    body: JSON.stringify({ id: source.id, target_id: target.id })
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_MOVE_DATASET_SUCCESS,
          payload: (action, state, json) => (json.result ? {
            source,
            target
          } : null)
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}

// 获取数据集详情
export const fetchDatasetData = (datasetId, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/get', {
    id: datasetId
  }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_DATASET_DATA_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_DATASET_DATA_FAILUER
      ]
    }
  }
}

// 运行SQL数据集获取结果
export const fetchRunSQLDataset = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/run_get_data'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_RUN_DATASET_SUCCESS,
          payload: (action, state, json) => (json.result ? json.data : null)
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}

// 获取api 测试响应数据
export const fetchApiTestDataset = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/run_test_data'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_API_DATASET_TEST_SUCCESS,
          payload: (action, state, json) => (json.result ? json.data : '')
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}


// 运行LABEL数据集获取结果
export const fetchRunLabelDataset = (labelId, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/get_label_data', {
    label_id: labelId
  }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_RUN_DATASET_SUCCESS,
          payload: (action, state, json) => (json.result ? json.data : null)
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}

// 获取数据集结果
export const fetchDatasetResult = (dataset_id, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/get_result_data', {
    id: dataset_id
  }));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_DATASET_RESULT_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_DATASET_RESULT_FAILURE
      ]
    }
  }
}

// 获取数据集结果数据条数
export const fetchDatasetResultTotal = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/run_get_data_count'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING, {
          type: FETCH_DATASET_RESULT_TOTAL_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}

// 上传数据文件csv, txt, xls, xlsx
export const fetchUploadDataFile = (formData, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/upload'), 'POST', {
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
        FETCH_REQUEST_WITH_PENDING,
        {
          type: FETCH_UPLOAD_DATAFILE_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_FAILURE_WITH_PENDING
      ]
    }
  }
}

// 刷新excel原始数据
export const fetchGetFileData = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/run_get_file_data'), 'POST', {
    body: JSON.stringify(params)
  })

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        FETCH_REQUEST_WITH_PENDING,
        {
          type: FETCH_GET_FILE_DATA_SUCCESS,
          payload: (action, state, json) => json.data
        },
        FETCH_GET_FILE_DATA_FAILURE
      ]
    }
  }
}

// 获取数据集 字段
export const fetchDatasetField = (params, callback) => {
  const { node, ...data } = params
  const fetchOptions = getFetchOptions(getApiPath('dataset/dataset_field/get', data));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: FETCH_DATASET_TREE_FIELD_SUCCESS,
          payload: (action, state, json) => Object.assign({ data: json.data }, node)
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

export const saveMutiExcelDataset = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/multi_add'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'SAVE_MUTI_EXCEL_DATASET_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

export const updateFieldTable = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/dataset_field/update'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'UPDATA_FIELD_TABLE_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

export const checkBeforeSave = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('dataset/validate_senior_field'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'CHECK_BEFORE_SAVE_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

export const fetchDatasetAuthVisible = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/dataset/fields', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'GET_DATASET_AUTH_VISIBLE_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

export const fetchDatasetAuthFilters = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/dataset/filter', params));

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'GET_DATASET_AUTH_FILTERS_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

export const saveDatasetAuthVisible = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/grant/dataset/fields'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'GET_DATASET_AUTH_FILTERS_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

export const saveDatasetAuthFilters = (params, callback) => {
  const fetchOptions = getFetchOptions(getApiPath('rbac/grant/dataset/filter'), 'POST', {
    body: JSON.stringify(params)
  });

  return {
    [CALL_API]: {
      ...fetchOptions,
      complete: callback,
      types: [
        'FETCH_REQUEST', {
          type: 'GET_DATASET_AUTH_FILTERS_SUCCESS',
          payload: (action, state, json) => json.data
        },
        'FETCH_FAILURE'
      ]
    }
  }
}

// 更新本地数据集字段
// @payload: {groupKey, index, key, col_name, value}
export const updateDatasetField = createAction(UPDATE_DATASET_FIELD_SUCCESS);

// 清除数据集数据
export const clearDatasetData = createAction(CLEAR_DATASET_DATA_SUCCESS);

// 以关键字过滤文件夹
export const filterFloders = createAction(FILTER_FOLDERS_SUCCESS);

// 以关键字过滤数据集/文件夹
export const filterDatasets = createAction(FILTER_DATASETS_SUCCESS);

// 缓存数据集列表的展开状态{id: true/false}
export const updateDatasetSpreads = createAction(UPDATE_DATASET_SPREADS_SUCCESS);

// 暂存数据到 datasetTree
export const tempFolders = createAction(TEMP_ADD_FOLDER_SUCCESS);

// 暂存数据到 datasetTree
export const tempOnlyFolders = createAction(TEMP_ADD_ONLY_FOLDER_SUCCESS);

// 移除 folderTree
export const removeTempFolders = createAction(REMOVE_TEMP_FOLDER_SUCCESS);
// 移除 workSheet
export const clearWorkSheet = createAction(CLEAR_WORK_SHEET_SUCCESS)
// 移除 sheetsData 数据
export const clearSheetsData = createAction(CLEAR_SHEETS_DATA_SUCCESS)
/**
 * 暴露actions到外面，方便使用react-redux connect绑定到Container Component
 */
export const actions = {
  fetchSheetId, // 获取sheet id
  fetchSheetData, // 获取 选择的 sheets表的内容
  fetchDatasetTree, // 获取数据集/文件夹树
  fetchDatasetTreeParams,
  fetchAddDataset, // 添加数据集/文件夹
  fetchAddFolder, // 添加文件夹 (仅)
  fetchDeleteDataset, // 删除数据集/文件夹
  fetchUpdateDataset, // 编辑数据集
  fetchRenameDataset, // 重命名数据集/文件夹
  fetchMoveDataset, // 移动数据集/文件夹
  fetchDatasetData, // 获取数据集详情
  fetchRunSQLDataset, // 运行SQL数据集获取结果
  fetchRunLabelDataset, // 运行LABEL数据集获取结果
  fetchDatasetResult, // 获取数据集结果
  fetchDatasetResultTotal, // 获取数据集结果数据条数
  fetchDatasetRelate, // 获取数据集关联报告
  fetchDatasetLog, // 获取数据集操作报告
  fetchUploadDataFile, // 上传数据文件csv, txt, xls, xlsx
  fetchGetFileData, // excel刷新原数据
  fetchDatasetField, // 获取当前数据集的字段
  fetchNameTask, // 获取 work sheet
  fetchDownloadDataset, // 获取数据集下载的oss 地址
  fetchDownSheetData,  // 异步数据请求
  updateDatasetField, // 更新本地数据集字段
  clearDatasetData, // 清除数据集数据
  filterFloders, // 以关键字过滤文件夹
  filterDatasets, // 以关键字过滤数据集/文件夹
  updateDatasetSpreads, // 缓存数据集列表的展开状态
  tempFolders, // 添加文件夹(包括数据集)
  tempOnlyFolders, // 添加文件夹
  removeTempFolders, // 移除文件夹
  fetchApiTestDataset, // api 响应结果
  clearWorkSheet, // 清除
  clearSheetsData, // 清除 sheetData
  saveMutiExcelDataset, // 多excel 同步保存
  checkDatasetName,     // 校验数据集名称是否被用
  updateFieldTable,     // 更新 table 字段
  fetchWorkSheetNames,  // 轮询获取 sheetname 
  checkBeforeSave,      // 保存数据集之前 校验高级字段
  fetchDatasetAuthVisible,   // 获取数据集显示字段 （授权）
  fetchDatasetAuthFilters,   // 获取数据集过滤条件 （授权）
  saveDatasetAuthVisible,  // 保存数据集显示字段 （授权）
  saveDatasetAuthFilters   // 获取数据集过滤条件 （授权）
}


// ------------------------------------
// Reducers
// ------------------------------------
const initialState = {
  pending: false,
  treePending: false,
  datasetSpread: {},
  datasetTree: [],
  folderTree: [],
  excelData: {},
  datasetData: {},
  datasetTable: {},
  datasetRelate: {},
  datasetLog: {},
  datasetTableTotal: 0,
  datasetTableUserTotal: 0,
  sheetsData: [],
  apiTestData: ''
}


export default handleActions({
  [CLEAR_SHEETS_DATA_SUCCESS](state) {
    return {
      ...state,
      sheetsData: []
    }
  },

  [FETCH_DATASET_SHEET_DATA_SUCCESS](state, { payload }) {
    return {
      ...state,
      pending: false,
      sheetsData: payload
    }
  },


  [FETCH_DATASET_RELATE_SUCCESS](state, { payload }) {
    // 渲染的图表组件不更新。所以针对后端返回的数据进行改造
    const head = [{
      alias_name: '报告名称',
      col_name: 'dashboard_name',
      visible: 1
    }, {
      alias_name: '所属文件夹',
      col_name: 'folder',
      visible: 1
    }, {
      alias_name: '所属图表',
      col_name: 'dashboard_chart_name',
      visible: 1
    }]

    return {
      ...state,
      pending: false,
      datasetRelate: {
        head,
        data: payload
      }
    }
  },

  [FETCH_DATASET_RELATE_FAILUER](state) {
    return {
      ...state,
      pending: false,
      datasetRelate: {}
    }
  },

  [FETCH_DATASET_LOG_SUCCESS](state, { payload }) {
    // 渲染的图表组件不更新。所以针对后端返回的数据进行改造
    const head = [{
      alias_name: '数据集名称',
      col_name: 'dataset_name',
      visible: 1
    }, {
      alias_name: '数据源',
      col_name: 'datasource',
      visible: 1
    }, {
      alias_name: '操作日期',
      col_name: 'created_on',
      visible: 1
    }, {
      alias_name: '操作类型',
      col_name: 'operating_mode',
      visible: 1
    }, {
      alias_name: '操作用户',
      col_name: 'created_by',
      visible: 1
    }]

    return {
      ...state,
      pending: false,
      datasetLog: {
        head,
        data: payload.items
      }
    }
  },

  [FETCH_DATASET_LOG_FAILUER](state) {
    return {
      ...state,
      pending: false,
      datasetLog: {}
    }
  },

  // pending的请求 REQUEST / FAILURE
  [FETCH_REQUEST_WITH_PENDING](state) {
    return {
      ...state,
      pending: true
    }
  },
  [FETCH_FAILURE_WITH_PENDING](state) {
    return {
      ...state,
      pending: false
    }
  },

  // 获取数据集/文件夹树
  [FETCH_DATASET_TREE_REQUEST](state) {
    return {
      ...state,
      treePending: true
    }
  },

  [FETCH_DATASET_TREE_SUCCESS](state, { payload }) {
    const newTree = payload ? datasetTreeFormat(payload, 0, [], state.datasetSpread) : [];
    const tableList = getArrayFromTree(newTree).filter(item => !item.hidden && item.type !== 'FOLDER');

    return {
      ...state,
      treePending: false,
      datasetTree: newTree,
      tableList
    }
  },

  [FETCH_DATASET_TREE_FAILURE](state) {
    return {
      ...state,
      treePending: false
    }
  },

  // 获取只有文件夹的树
  [FETCH_FOLDER_TREE_SUCCESS](state, { payload }) {
    const newTree = payload ? folderTreeFormat(payload, 0, []) : [];

    return {
      ...state,
      pending: false,
      folderTree: newTree,
    }
  },

  // 添加文件夹, 替换 node path所在的位置 （包含数据集）
  [FETCH_ADD_FOLDER_SUCCESS](state, { payload }) {
    if (payload && payload.type === TYPE_NAMES.folder) {
      let newTree = state.datasetTree.concat();
      const { parent_path, ...newFolder } = payload;

      if (!parent_path || !newFolder.parent_id) {
        const node = newTree[payload.path]
        node.id = payload.id

        newTree = newTree.map((item, index) => {
          item.path = [index];
          return item;
        })
      } else {
        addFolderByPath(newTree, newFolder, parent_path.slice());
        newTree = treeFormat(newTree, 0, []);
      }
      return {
        ...state,
        datasetTree: newTree,
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  [FETCH_ADD_ONLY_FOLDER_SUCCESS](state, { payload }) {
    if (payload && payload.type === TYPE_NAMES.folder) {
      let newTree = state.folderTree.concat();
      const { parent_path, ...newFolder } = payload;
      if (!parent_path || !newFolder.parent_id) {
        const node = newTree[0]
        node.id = payload.id
        node.name = payload.name
        newTree = newTree.map((item, index) => {
          item.path = [index];
          return item;
        })
      } else {
        addFolderByPath(newTree, newFolder, parent_path.slice());
        newTree = treeFormat(newTree, 0, []);
      }
      return {
        ...state,
        folderTree: newTree,
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  // 添加文件夹 （包含数据集）
  [TEMP_ADD_FOLDER_SUCCESS](state, { payload }) {
    if (payload && payload.type === TYPE_NAMES.folder) {
      let newTree = state.datasetTree.concat();
      const { parent_path, ...newFolder } = payload;
      if (!parent_path || parent_path.length === 0) {
        newTree.unshift({
          ...newFolder,
          parent_path: parent_path || [],
          level: 0,
          path: [0],
          sub: []
        });
        newTree = newTree.map((item, index) => {
          item.path = [index];
          return item;
        })
      } else {
        addFolderByPath(newTree, newFolder, parent_path.slice(), true);
        newTree = treeFormat(newTree, 0, []);
      }
      return {
        ...state,
        datasetTree: newTree,
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  [REMOVE_TEMP_FOLDER_SUCCESS](state, { payload }) {
    if (payload && payload.type === TYPE_NAMES.folder) {
      const newTree = state.folderTree.concat();
      const { parent_path } = payload;

      if (!parent_path || parent_path.length === 0) {
        const index = newTree.find(item => item.id === 'tempFolders_id')
        newTree.splice(index, 1)
        // 重置 path
        newTree.map((item, _index) => {
          item.path = [_index];
          return item;
        })
      } else {
        // 如果 parent_path 的length > 1
        const target = findNodeByParentPath(newTree, parent_path)
        const index = newTree.find(item => item.id === 'tempFolders_id')

        target.splice(index, 1)
        // 重置 path
        target.map((item, _index) => {
          item.path = [_index];
          return item;
        })
      }

      return {
        ...state,
        folderTree: newTree,
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  [TEMP_ADD_ONLY_FOLDER_SUCCESS](state, { payload }) {
    if (payload && payload.type === TYPE_NAMES.folder) {
      let newTree = state.folderTree.concat();
      const { parent_path, ...newFolder } = payload;
      if (!parent_path || parent_path.length === 0) {
        newTree.unshift({
          ...newFolder,
          parent_path: parent_path || [],
          level: 0,
          path: [0],
          sub: []
        });
      } else {
        addFolderByPath(newTree, newFolder, parent_path.slice(), true);
      }

      newTree = treeFormat(newTree, 0, []);

      return {
        ...state,
        folderTree: newTree,
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  // 添加数据集
  [FETCH_ADD_DATASET_SUCCESS](state) {
    return {
      ...state,
      pending: false
    }
  },

  // 删除数据集/文件夹
  [FETCH_DELETE_DATASET_SUCCESS](state, { payload }) {
    if (payload) {
      const newTree = state.datasetTree.concat();

      deleteTreeNodeByPath(newTree, payload.path.concat());

      return {
        ...state,
        datasetTree: treeFormat(newTree, 0, []),
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    }
  },

  // 编辑数据集
  [FETCH_UPDATE_DATASET_SUCCESS](state) {
    return {
      ...state,
      pending: false
    }
  },

  // 重命名数据集/文件夹
  [FETCH_RENAME_DATASET_SUCCESS](state, { payload }) {
    if (payload) {
      const newTree = state.datasetTree.concat();

      updateTreeNodeByPath(newTree, payload, payload.path.concat());

      return {
        ...state,
        datasetTree: newTree,
        pending: false
      }
    }
    return {
      ...state,
      pending: false
    }
  },

  // 移动数据集/文件夹
  [FETCH_MOVE_DATASET_SUCCESS](state, { payload }) {
    if (payload) {
      const newTree = state.datasetTree.concat();

      treeMove(newTree, payload.source, payload.target);

      return {
        ...state,
        datasetTree: treeFormat(newTree, 0, []),
        pending: false
      }
    }
    return {
      ...state,
      pending: false
    }
  },

  // 获取数据集详情
  [FETCH_DATASET_DATA_SUCCESS](state, { payload }) {
    return {
      ...state,
      datasetData: payload || {},
      pending: false
    }
  },

  [FETCH_DATASET_DATA_FAILUER](state) {
    return {
      ...state,
      datasetData: {},
      pending: false
    }
  },

  [FETCH_API_DATASET_TEST_SUCCESS](state, { payload }) {
    return {
      ...state,
      apiTestData: typeof payload === 'string' ? payload : JSON.stringify(payload),
      pending: false
    }
  },

  // 运行数据集获取结果(通用)
  [FETCH_RUN_DATASET_SUCCESS](state, { payload }) {
    if (payload) {
      return {
        ...state,
        datasetData: {
          ...state.datasetData,
          field: payload.field
        },
        datasetTable: {
          ...state.datasetTable,
          head: payload.head,
          data: payload.data
        },
        datasetTableTotal: payload.data ? (payload.data.length || 0) : 0,
        datasetTableUserTotal: payload.filter_amount,
        pending: false
      };
    }
    return {
      ...state,
      pending: false
    };
  },

  // 获取数据集结果
  [FETCH_DATASET_RESULT_SUCCESS](state, { payload }) {
    if (payload) {
      const total = payload.count ? payload.count : (payload.data ? (payload.data.length || 0) : 0)
      return {
        ...state,
        datasetTable: payload,
        datasetTableTotal: total,
        datasetTableUserTotal: payload.filter_amount,
        pending: false
      }
    }
    return {
      ...state,
      pending: false
    }
  },

  [FETCH_DATASET_RESULT_FAILURE](state) {
    return {
      ...state,
      pending: false,
      datasetTableTotal: 0,
      datasetTableUserTotal: 0,
      datasetTable: {}
    }
  },

  // 获取数据集结果数据条数
  [FETCH_DATASET_RESULT_TOTAL_SUCCESS](state, { payload }) {
    return {
      ...state,
      pending: false,
      datasetTableTotal: payload || 0
    }
  },

  // 上传数据文件csv, txt, xls, xlsx
  [FETCH_UPLOAD_DATAFILE_SUCCESS](state, { payload }) {
    return {
      ...state,
      excelData: payload,
      pending: false
    }
  },

  // excel刷新原数据
  [FETCH_GET_FILE_DATA_SUCCESS](state, { payload }) {
    return {
      ...state,
      datasetData: payload,
      datasetTable: {
        ...state.datasetTable,
        head: payload.head,
        data: payload.data
      },
      datasetTableTotal: payload.count || 0,
      datasetTableUserTotal: payload.filter_amount || 0,
      pending: false
    }
  },

  // excel刷新原数据(失败后清空)
  [FETCH_GET_FILE_DATA_FAILURE](state) {
    // 清空数据
    return {
      ...state,
      datasetData: {},
      datasetTable: {},
      datasetTableTotal: 0,
      datasetTableUserTotal: 0,
      pending: false
    }
  },

  // 更新本地数据集字段
  [UPDATE_DATASET_FIELD_SUCCESS](state, { payload }) {
    const field = payload.type === 'EXCEL' ? state.sheetsData[payload.active].field : state.datasetData.field
    const head = payload.type === 'EXCEL' ? state.sheetsData[payload.active].head : state.datasetTable.head

    if (field) {
      if (payload.key === 'field_group') {
        const changeNode = field[payload.groupKey].splice(payload.index, 1)[0];
        changeNode[payload.key] = payload.value;
        field[payload.value].push(changeNode);
      } else {
        field[payload.groupKey][payload.index][payload.key] = payload.value;
      }
    }

    // 如果是excel 
    if (payload.type === 'EXCEL') {
      let activeSheet = state.sheetsData[payload.active]
      activeSheet = {
        ...activeSheet,
        field,
        head: head.map((item) => {
          if (item.col_name === payload.col_name) {
            item[payload.key] = payload.value;
          }
          return item;
        })
      }
      state.sheetsData[payload.active] = activeSheet
      state.sheetsData = state.sheetsData.slice()
    } else {
      state.datasetData = {
        ...state.datasetData,
        field
      }
      state.datasetTable = {
        ...state.datasetTable,
        head: head.map((item) => {
          if (item.col_name === payload.col_name) {
            item[payload.key] = payload.value;
          }
          return item;
        })
      }
    }

    return {
      ...state
    };
  },

  // 清除数据集数据
  [CLEAR_DATASET_DATA_SUCCESS](state) {
    return {
      ...state,
      datasetData: {},
      datasetTable: {},
      excelData: {},
      datasetTableTotal: 0,
      datasetTableUserTotal: 0,
    }
  },

  // 以关键字过滤文件夹
  [FILTER_FOLDERS_SUCCESS](state, { payload }) {
    const newTree = setFolderHideStatusByKeyword(state.folderTree.concat(), payload);

    return {
      ...state,
      folderTree: newTree
    }
  },

  // 以关键字过滤数据集/文件夹
  [FILTER_DATASETS_SUCCESS](state, { payload }) {
    const newTree = setFolderHideStatusByKeyword(state.datasetTree.concat(), payload);

    return {
      ...state,
      datasetTree: newTree
    }
  },

  // 缓存数据集列表的展开状态
  [UPDATE_DATASET_SPREADS_SUCCESS](state, { payload }) {
    return {
      ...state,
      datasetSpread: {
        ...state.datasetSpread,
        ...payload
      }
    }
  },

  [FETCH_DATASET_TREE_FIELD_SUCCESS](state, { payload }) {
    const pathArr = payload.path.slice()
    const newTree = _.cloneDeep(state.datasetTree)
    const sub = []

    let targetNode = null

    if (pathArr) {
      pathArr.forEach((path, index) => {
        if (index === 0) {
          targetNode = newTree[path]
        } else {
          targetNode = targetNode.sub[path]
        }
      })
    }

    payload.data.filter(item => (item.type === '普通' && item.visible === 1)).forEach((item, index) => {
      const _path = pathArr.concat([index])
      const _level = payload.level + 1

      sub.push({
        ...item,
        path: _path,
        level: _level,
        parent_id: payload.id,
        name: item.alias_name || item.col_name,
        field: true, // 字段识别标志
        type: item.data_type
      })
    })

    // 赋值 加 分组排序
    targetNode.sub = sub.sort((a, b) => {
      const a_ascii = a.type.charCodeAt(0).toString(10)
      const b_ascii = b.type.charCodeAt(0).toString(10)
      return a_ascii - b_ascii
    })

    return {
      ...state,
      datasetTree: newTree
    }
  }
}, initialState)
