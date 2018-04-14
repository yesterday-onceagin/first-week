module.exports = {
  path: 'flow',
  indexRoute: {
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/flow/Overview').default)
      })
    }
  },
  childRoutes: [{
    path: 'overview',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/flow/Overview').default)
      })
    }
  }, {
    path: 'ops(/:flow_id/:flow_name)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/flow/Ops').default)
      })
    }
  }, {
    path: 'ops/:instance',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/flow/Ops').default)
      })
    }
  }, {
    path: 'ops(/:flow_id/:flow_name/:type)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/flow/Ops').default)
      })
    }
  }, {
    path: 'ops(/:status/:timeType/:begin_date/:end_date)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/flow/Ops').default)
      })
    }
  }, {
    path: 'ops(/:flow_id/:flow_name/:timeType/:begin_date/:end_date)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/flow/Ops').default)
      })
    }
  }, {
    path: 'ops-instance/:instance_id/:instance_name',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/flow/OpsInstance').default)
      })
    }
  }]
};
