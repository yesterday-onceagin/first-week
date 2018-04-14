const convertFolderTree = function (data, folderOnly, level = 0) {
  let treeData = []
  treeData = data && data.concat()
  if (folderOnly) {
    treeData = treeData.filter(item => item.type === 'FOLDER')
  }
  treeData = treeData.map((node) => {
    if (node.sub && node.sub.length > 0) {
      return {
        ...node,
        text: node.name,
        children: convertFolderTree(node.sub, folderOnly, level + 1),
        level
      }
    }
    return {
      ...node,
      text: node.name,
      children: null,
      level,
    }
  })
  return treeData
}

const convertUserTree = function (data, level = 0) {
  let treeData = []
  treeData = data && data.concat()
  treeData = treeData.map((node) => {
    if (node.sub && node.sub.length > 0) {
      return {
        ...node,
        text: node.name,
        level_code: node.code,
        children: convertUserTree(node.sub, level + 1),
        level
      }
    }
    return {
      ...node,
      text: node.name,
      level_code: node.code,
      children: null,
      level,
    }
  })
  return treeData
}

export {
  convertFolderTree,
  convertUserTree
}
