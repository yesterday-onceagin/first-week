module.exports = {
  path: 'dataclean',
  indexRoute: {
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/dataclean/list').default)
      })
    }
  },
  childRoutes: [{
    path: 'list',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/dataclean/list').default)
      })
    }
  }, {
    path: 'flow/:id',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/dataclean/flow').default)
      })
    }
  }]
};
