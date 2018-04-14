module.exports = {
  path: 'app_menu',
  indexRoute: {
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/app_menu/List').default)
      })
    }
  },
  childRoutes: [{
    path: 'list',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/app_menu/List').default)
      })
    }
  }, {
    path: 'detail/:id',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/app_menu/Application').default)
      })
    }
  }]
};
