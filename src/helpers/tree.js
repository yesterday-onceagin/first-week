import DataTree from 'rt-tree/lib/helpers/dataTree';

function treeConvertor(treeData) {
  const tree = []
  Array.isArray(treeData) && treeData.map((item) => {
    const treeNode = {}
    if (item) {
      Object.assign(treeNode, {
        key: item.id,
        value: item.id, // 传递给后台的参数，
        label: item.name, // 显示的数值
        disabled: false // 是否禁用
      })
      hasChildren(item) && Object.assign(treeNode, {
        children: treeConvertor(item.childNode)
      })
    }
    tree.push(treeNode)
  })
  return tree
}
/**
 * treeConvertorPid 以pid id的形式输出 
 * @param  {[type]} treeData     [description]
 * @param  {[type]} pid          [description]
 * @param  {[type]} tree         [description]
 * @param  {bool} needMergePid   是否需要合并pid, 如果出现1对多的情况下。应该合并上级id 
 * @return {[type]}              [description]
 */
function treeConvertorPid(treeData, needMergePid = needMergePid || false, pid = pid || 0, tree = tree || []) {
  Array.isArray(treeData) && treeData.map((item) => {
    if (item) {
      // id
      const id = {
        id: item.id,
        key: item.node_key
      }
      // 在合并的情况下
      needMergePid === true && Object.assign(id, {
        pid: item.org_id
      })
      const node = {
        id: JSON.stringify(id), // 传递给后台的参数，
        label: item.name, // 显示的数值
        disabled: false, // 是否禁用
        pId: pid
      }
      tree.push(node)
      hasChildren(item) && treeConvertorPid(item.childNode, needMergePid, JSON.stringify(id), tree)
    }
  })
  return tree
}

function treeConvertorSimplePid(treeData, pid = pid || 0, tree = tree || []) {
  Array.isArray(treeData) && treeData.map((item) => {
    if (item) {
      // 在合并的情况下
      const node = {
        id: item.id, // 传递给后台的参数，
        label: item.name, // 显示的数值
        disabled: false, // 是否禁用
        node_key: item.node_key,
        pId: pid
      }
      tree.push(node)
      hasChildren(item) && treeConvertorSimplePid(item.childNode, item.id, tree)
    }
  })
  return tree
}

function treeFilter(treeMaps, value) {
  const treeData = []
  const arr = []
  const copyedTreeMaps = [].concat(treeMaps)

  copyedTreeMaps.map((item) => {
    if (item.label.indexOf(value) > -1) {
      treeData.push(item)
    }
  })

  treeData.map((tree) => {
    // 往上查找
    const newTreedata = [].concat(treeData)
    const upTree = findUpFullTree(tree.pId, newTreedata, treeMaps)
    upTree.map((item) => {
      if (contains(item.id, arr) === false) {
        arr.push(item)
      }
    })
  })

  const leaveRealtionTree = [],
    leaveTree = []
  copyedTreeMaps.map((item) => {
    treeData.forEach((tree) => {
      if (contains(item.id, treeData) === false) {
        // 剩余部分
        leaveTree.push(item)
        // 有直接关联的
        tree.pId !== 0 && item.pId === tree.id && leaveRealtionTree.push(item)
      }
    })
  })

  leaveRealtionTree.map((item) => {
    // 往下查找 -> 全查找的话存在重叠的情况，太影响效率，
    // 直接找出剩余 copyedTreeMaps 中不在 treeData里的树
    // 和 treedata 有直接pid 关系的treeData。再接着往下搜索
    const downTree = findDownFullTree(item.id, [], leaveTree)
    // 直接加入有直接关系的节点
    arr.push(item)
    downTree.map((item) => {
      if (contains(item.id, arr) === false) {
        arr.push(item)
      }
    })
  })

  return arr
}
/**
 * 从过滤后的节点中，向上找出自己的完整树形结构
 * @param  {[type]} id       [description]
 * @param  {[type]} treedata [description]
 * @return {[type]}          [description]
 */
function findUpFullTree(pid, filter, all) {
  all.map((item) => {
    if (item.id === pid && contains(pid, filter) === false) {
      filter.push(item)
      if (item.pId !== 0) {
        findUpFullTree(item.pId, filter, all)
      }
    }
  })
  return filter
}


/**
 * 从过滤的节点中往下找出完整的树
 * @param  {[type]} id     [description]
 * @param  {[type]} filter [description]
 * @param  {[type]} all    [description]
 * @return {[type]}        [description]
 */
function findDownFullTree(id, filter, all) {
  all.map((item) => {
    if (item.pId === id && contains(item.id, filter) === false) {
      filter.push(item)
      findDownFullTree(item.id, filter, all)
    }
  })
  return filter
}

/**
 * [hasChildren description]
 * @param  {[type]}  treeNode 当前treeNode
 * @return {Boolean}          是否存在孩子
 */
function hasChildren(treeNode) {
  return !!(treeNode.childNode && treeNode.childNode.length > 0)
}
/**
 * contains 是否包含于数组中
 * @param  {[type]} id     [description]
 * @param  {[type]} source [description]
 * @return {[type]}        [description]
 */
function contains(id, arr) {
  let bool = false
  arr.map((item) => {
    if (item.id === id) {
      return bool = true
    }
  })
  return bool
}
/**
 * isLeaf 是否为叶子
 * @param  {[type]}  node 节点
 * @return {Boolean} 是/否
 */
function isLeaf(options) {
  let bool = false
  if (Array.isArray(options)) {
    bool = !(options[0].children.length > 0)
  }
  return bool
}

/**
 * idToValue 通过实际的id来映射到对应的value 
 * @return {[type]} [description]
 */
function findValueById(id, datas) {
  let value = ''
  datas.map((item) => {
    const json = JSON.parse(item.id)
    if (json.id === id) {
      return value = item.id
    }
  })
  return value
}

function convertDatasSingle(options) {
  const dataModel = {
    headquarters: [],
    branch_company: [],
    project: [],
    project_periods: []
  }
  const option = options[0]
  return {
    ...dataModel,
    [option.node_key]: [option.id]
  }
}

function convertDatasMulti(options) {
  const dataModel = {
    headquarters: [],
    branch_company: [],
    project: [],
    project_periods: []
  }
  const objects = {}

  options.forEach((item) => {
    if (!objects[item.node_key]) {
      objects[item.node_key] = [item.id]
    } else {
      objects[item.node_key].push(item.id)
    }
  })
  return Object.assign(dataModel, objects)
}

function convertDatas(options) {
  if (Array.isArray(options)) {
    return options.length > 1 ? convertDatasMulti(options) : convertDatasSingle(options)
  }
}

// 严格模式。
// 当公司下的所有项目被选上的时候，则只传递公司。
function converDatasStrict(options) {
  const _convertDatas = convertDatas(options)
  // 1、去掉项目期数中的项目子集数据
  // 2、去掉项目中的公司子集数据
  // 3、去掉公司中的集团子集数据

  const __arrs = ['project_periods', 'project', 'branch_company', 'headquarters']

  for (let i = 1; i <= __arrs.length; i++) {
    _convertDatas[__arrs[i]] && _convertDatas[__arrs[i]].forEach((item) => {
      const project = getItemById(item, options)
      if (project && project.children) {
        removeItems(_convertDatas[__arrs[i - 1]], project.children)
      }
    })
  }
  return _convertDatas;
}


function getItemById(id, arr) {
  let result = null
  arr.forEach((item) => {
    if (item.id === id) {
      return result = item
    }
  })
  return result
}

function removeItems(stores, children) {
  // 过滤其相关孩子
  Array.isArray(children) && children.forEach((child) => {
    stores.forEach((item, key) => {
      if (child.id === item) {
        stores.splice(key, 1)
      }
    })
  })
}


function expandTreeRoot(treeData) {
  const store = []
  Array.isArray(treeData) && treeData.map((item) => {
    store.push(item.id)
  })
  return store
}


function filterTreeDatas(keyWord, treeProps) {
  const expanded = [];
  if (!keyWord) {
    return {
      data: treeProps
    }
  }
  // 重置树节点数据
  const tree = new DataTree().import(treeProps.slice())
  // 使用深度优先搜索算法搜索树节点
  tree.traverseDFS((node) => {
    // 如果存在多各根节点的情形
    if (Number.parseInt(node._depth) === 1 && node._childNodes.length > 1) {
      node._childNodes.forEach((nodeItem) => {
        loopDFS_keyWord(nodeItem, expanded, keyWord)
      })
    } else {
      loopDFS_keyWord(node, expanded, keyWord)
    }
  })

  const afterFilter = filterExpanedTree(tree.export())

  // 只搜索到一个节点时，不展开该节点
  if (expanded.length === 0) {
    return {
      data: null
    }
  }

  return {
    data: afterFilter
  }
}

function loopDFS_keyWord(node, expanded, keyWord) {
  const nodeData = node.data()
  if (nodeData.text.indexOf(keyWord) > -1) {
    expanded.push(nodeData.id)
    Object.assign(nodeData, {
      expanded: true
    })
    //获取它所有的祖先节点，把它的ID放到map中
    node.getAncestry().forEach((item) => {
      const id = item.data().id
      item.data({ ...item.data(),
        expanded: true
      })
      if (contains(id, expanded) === false) {
        expanded.push(id)
      }
    })
  } else {
    // 为避免上次记录被保存，没有展开的再次遍历，设置false
    Object.assign(nodeData, {
      expanded: false
    })
  }
}


// 对过滤展开的树进行递归筛选
function filterExpanedTree(treeDatas) {
  const tree = []
  const loopTree = (trees, store) => {
    Array.isArray(trees) && trees.map((item) => {
      if (item.expanded === true) {
        const { ...node
        } = item
        const childrens = childNodeHasExpaned(item.children) ? [] : item.children
        Object.assign(node, {
          children: childrens
        })
        store.push(node)
        loopTree(item.children, node.children)
      }
    })
  }
  loopTree(treeDatas, tree)
  return tree
}

// 判断其孩子中是否包含需要展开的节点。
function childNodeHasExpaned(children) {
  // 假设没有
  let bool = false
  Array.isArray(children) && children.forEach((item) => {
    if (item.expanded === true) {
      return bool = true
    }
  })
  return bool
}

function getNodeDataById(treeProps, id) {
  let node_data = null
  // 重置树节点数据
  const tree = new DataTree().import(treeProps.slice())
  // 使用深度优先搜索算法搜索树节点
  tree.traverseDFS((node) => {
    if (node._data.id === id) {
      return node_data = node._data
    }
  })
  return node_data
}

function getAncestry(treeProps, nodeP) {
  const ancestry = [nodeP]
  // 重置树节点数据
  const tree = new DataTree().import(treeProps.slice())
  // 使用深度优先搜索算法搜索树节点
  tree.traverseDFS((node) => {
    // 如果存在多各根节点的情形
    if (node._depth === 1 && node._childNodes.length > 1) {
      node._childNodes.forEach((nodeItem) => {
        if (nodeItem._data.id === nodeP.id) {
          nodeItem.getAncestry().forEach((item) => {
            if (contains(item._data.id, ancestry) === false) {
              ancestry.push(item._data)
            }
          })
        }
      })
    } else if (node._data.id === nodeP.id) {
      node.getAncestry().forEach((nodeItem) => {
        if (contains(nodeItem._data.id, ancestry) === false) {
          ancestry.push(nodeItem._data)
        }
      })
    }
  })
  return ancestry
}

function getChildren(treeDatas) {
  const tree = []
  const loopTree = (trees, store) => {
    Array.isArray(trees) && trees.map((item) => {
      store.push(item)
      loopTree(item.children, store)
    })
  }
  loopTree(treeDatas, tree)
  return tree
}

function getAllChildrenIds(treeDatas) {
  const tree = []
  const loopTree = (trees, store) => {
    Array.isArray(trees) && trees.map((item) => {
      store.push(item.id)
      loopTree(item.children, store)
    })
  }
  loopTree(treeDatas, tree)
  return tree
}


const tree = {
  // 简单模型
  treeDataSimpleMode: {
    id: 'id',
    rootPId: 0,
  },
  // 数据格式转换 -> id: children
  treeConvertor,
  // 数据格式转换 -> id,pid 模型
  treeConvertorPid,
  // id,pid -》 简洁模式，拓展tree之后，不需要再合并id,key,pid
  treeConvertorSimplePid,
  // 数据过滤器
  treeFilter,
  // 是否是leaf
  isLeaf,
  // id -> value
  findValueById,
  // 单选树形数据格式转换成 后台需要格式
  convertDatasSingle,
  // 复选树形数据格式转换成 后台需要格式
  convertDatasMulti,
  // 数据格式转换
  convertDatas,
  // 严格的数据转换
  converDatasStrict,
  // 默认展开。
  expandTreeRoot,
  // 搜索树形结构
  filterTreeDatas,
  // 获取树形结构所有的祖先节点（本身）
  getAncestry,
  // 获取树形结构所有的孩子节点（本身）
  getChildren,
  // 通过已经id 获取对应树的 node._data
  getNodeDataById,
  // 获取 所有children 的id
  getAllChildrenIds
}

export default tree
