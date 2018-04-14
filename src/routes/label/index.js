module.exports = {
  path: 'label',
  indexRoute: {
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/label/List').default)
      })
    }
  },
  childRoutes: [{
    path: 'list',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/label/List').default)
      })
    }
  },
  {
    path: 'detail/:detail_id/:detail_name/:tmpl_id',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/label/Detail').default)
      })
    }
  },
  {
    path: 'downtask/:detail_id/:detail_name/:tmpl_id',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/label/DownTask').default)
      })
    }
  },
  {
    path: 'add/:org_id/:org_name/:tmpl_id',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/label/AddOrEdit').default)
      })
    }
  },
  {
    path: 'add/:org_id/:org_name/:tmpl_id/:detail_id/:detail_name',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/label/AddOrEdit').default)
      })
    }
  }]
};
