module.exports = {
  path: 'authority',
  childRoutes: [{
    path: 'role',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/authority/Role').default)
      })
    }
  }, {
    path: 'user',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/authority/User').default)
      })
    }
  }, {
    path: 'user_group',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/authority/UserGroup').default)
      })
    }
  }, {
    path: 'add(/:id)(/:name)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/authority/AddOrEdit').default)
      })
    }
  }]
};
