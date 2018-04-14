module.exports = {
  path: 'indicator',
  indexRoute: {
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/indicator/list').default)
      })
    }
  },
  childRoutes: [{
    path: 'list',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/indicator/list').default)
      })
    }
  }, {
    path: 'template/:tmpl_id',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/indicator/indicator').default)
      })
    }
  }]
};
