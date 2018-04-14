module.exports = {
  path: 'datasource',
  indexRoute: {
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/datasource/list').default)
      })
    }
  },
  childRoutes: [{
    path: 'list',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/datasource/list').default)
      })
    }
  }, {
    path: 'detail/:type(/:datasource_id)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/datasource/Detail').default)
      })
    }
  }]
};
