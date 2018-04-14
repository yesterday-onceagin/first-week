module.exports = {
  path: 'organization',
  childRoutes: [{
    path: 'user',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/organization/User').default)
      })
    }
  }, {
    path: 'auth',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/organization/Auth').default)
      })
    }
  }, {
    path: 'user_log',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/organization/UserLog').default)
      })
    }
  }]
};
