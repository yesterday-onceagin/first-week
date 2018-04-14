module.exports = {
  path: 'feeds',
  indexRoute: {
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/feeds/List').default)
      })
    }
  },
  childRoutes: [{
    path: 'list',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/feeds/List').default)
      })
    }
  }, {
    path: 'add(/:id)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/feeds/AddOrEdit').default)
      })
    }
  }, {
    path: 'detail(/:id)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/feeds/Detail').default)
      })
    }
  }]
};
