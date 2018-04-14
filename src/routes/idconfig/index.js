module.exports = {
  path: 'idconfig',
  indexRoute: {
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/idconfig/list').default)
      })
    }
  },
  childRoutes: [{
    path: 'list',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/idconfig/list').default)
      })
    }
  }, {
    path: 'config/:tmpl_id',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/idconfig/config').default)
      })
    }
  }]
};
