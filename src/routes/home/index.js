module.exports = {
  path: 'home',
  indexRoute: {
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/home/Index').default)
      })
    }
  },
  childRoutes: [{
    path: 'index',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/home/Index').default)
      })
    }
  }, {
    path: 'index/:mode',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/home/Index').default)
      })
    }
  }]
};
