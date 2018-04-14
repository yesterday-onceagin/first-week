function redirect(path) {
  return function (nextState, replaceState) {
    replaceState(path);
  }
}

function getAuthLinksFromLoginInfo(apps) {
  return [].concat(...apps.map((app) => {
    let urls = [app.link];
    if (app.is_buildin !== 1) {
      urls.push(`/app/index/${app.id}`)
    }
    // 每个app下的function
    if (Array.isArray(app.function) && app.function.length > 0) {
      app.function.forEach((func) => {
        let funcUrls =  [func.link];
        // function下的sub
        if (Array.isArray(func.sub) && func.sub.length > 0) {
          funcUrls = funcUrls.concat(func.sub.map(sub => sub.link));
        }

        urls = urls.concat(funcUrls);
      });
    }
    return urls;
  })).filter(link => !!link);
}


export {
  redirect,
  getAuthLinksFromLoginInfo
}
