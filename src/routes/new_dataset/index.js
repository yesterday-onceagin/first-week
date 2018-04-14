module.exports = {
  path: 'dataset',
  indexRoute: {
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/new_dataset/list').default)
      })
    }
  },
  childRoutes: [{
    path: 'list',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/new_dataset/list').default)
      })
    }
  }, {
    path: 'detail_error/:type(/:id)',

    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/new_dataset/DatasetErrorType').default)
      })
    }
  }, {
    path: 'detail_sql(/:id)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/new_dataset/sql/index').default)
      })
    }
  }, {
    path: 'detail_label(/:id)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/new_dataset/label/index').default)
      })
    }
  }, {
    path: 'detail_excel(/:id)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/new_dataset/excel/index').default)
      })
    }
  }, {
    path: 'detail_combo(/:id)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/new_dataset/combo/index').default)
      })
    }
  }, {
    path: 'detail_api(/:id)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/new_dataset/api/index').default)
      })
    }
  }, {
    path: 'detail_template(/:id)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/new_dataset/template/index').default)
      })
    }
  }]
};
