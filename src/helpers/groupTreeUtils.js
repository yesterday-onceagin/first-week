// 遍历树，为每个节点添加层级和路径, 并获取所有的叶子
function treeFormat(treeArr, currLevel, path = [], leafs = [], folderOnly = false) {
  if (folderOnly) {
    treeArr = treeArr.filter(item => item.type === 'FOLDER')
  }
  return treeArr.map((item, index) => {
    item.level = currLevel;
    const _path_ = [...path, index];
    item.path = _path_;
    if (Array.isArray(item.sub) && item.sub.length > 0) {
      item.sub = treeFormat(item.sub, currLevel + 1, _path_, leafs, folderOnly);
    } else {
      leafs.push(item);
    }
    return item;
  });
}

// 获取所有的叶子节点
function getLeafs(treeArr, leafs) {
  return treeArr.map((item) => {
    if (Array.isArray(item.sub) && item.sub.length > 0) {
      item.sub = getLeafs(item.sub, leafs);
    } else {
      leafs.push(item);
    }
    return item;
  });
}

// 根据路径为树添加节点
function addTreeNodeByPath(treeArr, data, path) {
  const idx = path.shift();
  if (Array.isArray(path) && path.length > 0) {
    addTreeNodeByPath(treeArr[idx].sub, data, path);
  } else if (Array.isArray(treeArr[idx].sub)) {
    treeArr[idx].sub.push({
      ...data,
      path: [...treeArr[idx].path, treeArr[idx].sub.length],
      level: treeArr[idx].level + 1
    });
  } else {
    treeArr[idx].sub = [{
      ...data,
      path: [...treeArr[idx].path, 0],
      level: treeArr[idx].level + 1
    }];
  }
}

// 根据路径删除树节点
function deleteTreeNodeByPath(treeArr, path) {
  const idx = path.shift();
  if (Array.isArray(path) && path.length > 0) {
    deleteTreeNodeByPath(treeArr[idx].sub, path);
  } else {
    treeArr.splice(idx, 1);
  }
}

// 根据路径更新树节点
function updateTreeNodeByPath(treeArr, data, path) {
  const idx = path.shift();
  if (Array.isArray(path) && path.length > 0) {
    updateTreeNodeByPath(treeArr[idx].sub, data, path);
  } else {
    treeArr[idx] = data;
  }
}

// 根据路径获取树的节点
function getTreeNodeByPath(treeArr, path) {
  if (Array.isArray(path) && path.length > 0) {
    const idx = path.shift();

    if (Array.isArray(path) && path.length > 0) {
      return getTreeNodeByPath(treeArr[idx].sub, path);
    }
    return treeArr[idx];
  }
  return null;
}

// 返回一维数组
function getArrayFromTree(treeArr) {
  const arr = [];
  treeArr.forEach((item) => {
    arr.push(item);
    if (Array.isArray(item.sub) && item.sub.length > 0) {
      arr.push(...getArrayFromTree(item.sub));
    }
  })
  return arr;
}

// 获取完整路径
function getFullPath(treeArr, path, pathArray, key = 'id') {
  if (Array.isArray(path) && path.length > 0) {
    const idx = path.shift();
    if (treeArr[idx]) {
      pathArray.push(treeArr[idx][key]);
      if (Array.isArray(path) && path.length > 0 && treeArr[idx].sub.length > 0) {
        getFullPath(treeArr[idx].sub, path, pathArray, key);
      }
    }
  }
}

function getFullPathByLevelCode(treeArr, level_code, path) {
  treeArr.forEach((item) => {
    // 如果是匹配上了
    if (level_code.indexOf(item.level_code) === 0 && level_code != item.level_code) {
      path.push(item.name)
      getFullPathByLevelCode(item.sub, level_code, path)
    }
  })
}

function getDatasetNodeByName(treeArr, name, list) {
  for (let i = 0; i < treeArr.length; i++) {
    const item = treeArr[i]
    // 如果不是文件夹
    if (item.type !== 'FOLDER' && item.name == name) {
      list.push(item)
      break;
    } else if (item.sub.length > 0) {
      getDatasetNodeByName(item.sub, name, list)
    }
  }
}


// 快速获得第一个不disable的节点
function getFirstValidNode(treeArr) {
  if (treeArr[0].disable) {
    if (Array.isArray(treeArr[0].sub) && treeArr[0].sub.length > 0) {
      return getFirstValidNode(treeArr[0].sub);
    }
    return null;
  }
  return treeArr[0];
}

const map = cb => arr => Array.prototype.map.call(arr, cb);

const max = arr => arr.reduce((acc, cur) => {
  if (cur >= acc) {
    return cur;
  }
  return acc;
}, arr[0]);

// 获取最大深度
const getSubMaxDeepLen = (node) => {
  // 基准条件 
  if (!Array.isArray(node.sub) || node.sub.length === 0) {
    return 1;
  }
  // 求子节点们的长度 并取最大值 
  const deeps = map(getSubMaxDeepLen)(node.sub);
  return 1 + max(deeps);
}

export {
  treeFormat,
  getLeafs,
  addTreeNodeByPath,
  deleteTreeNodeByPath,
  updateTreeNodeByPath,
  getTreeNodeByPath,
  getArrayFromTree,
  getFullPath,
  getFirstValidNode,
  getSubMaxDeepLen,
  getFullPathByLevelCode,
  getDatasetNodeByName
};
