import _ from 'lodash'
/*
* 私有方法
*/

// 取得url
// @type: app or func
function _getUrl(item, type) {
  if (/^https?:\/\//.test(item.url)) {
    return item.target === '_blank' ? (
      `/api/app_menu/${type}/link_to?id=${item.id}`
    ) : (
      `/app/external/${type}/${item.id}`
    )
  }
  return item.target === '_blank' ? (
    `/app/data_report/${item.id}/${item.url}`
  ) : (
    `/app/dashboard/${item.id}/${item.url}`
  )
}

// 转换funcs
function _convertFuncs(functionArray, isBuildin) {
  return functionArray.map((func) => {
    if (Array.isArray(func.sub) && func.sub.length > 0) {
      func.target = '';
      func.url = '';
      func.link = ''
      func.sub = _convertFuncs(func.sub, isBuildin);
    } else if (isBuildin) {
      func.link = func.url
    } else {
      func.link = _getUrl(func, 'func');
    }
    return func;
  });
}

/*
* 将APP中的数据转换为符合前端组件和路由的方式
*/
const getFormatedApp = appTree => appTree.map((app) => {
  if (Array.isArray(app.function) && app.function.length > 0) {
    app.target = ''
    app.url = ''
    app.link = ''
    app.function = _convertFuncs(app.function, app.is_buildin)
  } else if (app.is_buildin) {
    app.link = app.url
  } else {
    app.link = _getUrl(app, 'app')
  }
  return app
})

/*
*   用于菜单当前模块的匹配
*/

// 根据pathname获取当前的APP以及module
function getCurrentAppAndModule(appMap, path) {
  // 因为地址中存在中文 这里要进行解CODE
  const pathname = decodeURIComponent(path || window.location.pathname);

  const app_id = _.find(_.keys(appMap), (appId) => {
    if (appMap[appId].appRoute === '.*') {
      return false;
    }
    return new RegExp(appMap[appId].appRoute).test(pathname);
  });

  let module_id;

  if (app_id) {
    module_id = _.find(_.keys(appMap[app_id].modulesMap), (moduleId) => {
      const moduleMatch = appMap[app_id].modulesMap[moduleId];
      if (typeof moduleMatch === 'string' && moduleMatch !== '.*') {
        return new RegExp(moduleMatch).test(pathname);
      } else if (moduleMatch.moduleRoute && moduleMatch.moduleRoute !== '.*') {
        return new RegExp(moduleMatch.moduleRoute).test(pathname);
      }
      return false;
    })
  }

  return {
    app_id,
    module_id
  };
}

// 根据pathname获取当前的function
function getCurrentFunction(appMap, appId, moduleId, path) {
  if (appId && moduleId) {
    const pathname = path || window.location.pathname;
    const funcMap = appMap[appId].modulesMap[moduleId];

    if (typeof funcMap === 'string' && funcMap !== '.*') {
      return moduleId;
    }
    return _.find(_.keys(funcMap.functionMap), funcId => new RegExp(funcMap[funcId]).test(pathname));
  }
  return null;
}

// 根据获取一个模块
function getModuleById(id, tree) {
  const arr = [];
  tree.forEach((f) => {
    if (f.id === id) {
      arr.push(f);
    }
    if (Array.isArray(f.sub) && f.sub.length > 0) {
      arr.push(...getModuleById(id, f.sub));
    }
  });
  return arr;
}

// 快速获得第一个有URL的节点
function getFirstUrlModule(treeArr) {
  if (!treeArr[0].url) {
    if (Array.isArray(treeArr[0].sub) && treeArr[0].sub.length > 0) {
      return getFirstUrlModule(treeArr[0].sub);
    }
    return null;
  }
  return treeArr[0];
}

export {
  getCurrentAppAndModule,
  getCurrentFunction,
  getModuleById,
  getFirstUrlModule,
  getFormatedApp
}
