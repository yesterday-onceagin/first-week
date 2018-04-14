const { isMobile } = require('@helpers/common');

module.exports = {
  path: 'app',
  indexRoute: {
    getComponent: (nextState, cb) => {
      if (isMobile()) {
        require.ensure([], (require) => {
          cb(null, require('@views/app/IndexMobile').default)
        })
      } else {
        require.ensure([], (require) => {
          cb(null, require('@views/app/Index').default)
        })
      }
    }
  },
  childRoutes: [{
    path: 'index/:id(/:platform)',
    getComponent: (nextState, cb) => {
      const { platform } = nextState.params
      if (isMobile() && platform === 'mobile') {
        require.ensure([], (require) => {
          cb(null, require('@views/app/IndexMobile').default)
        })
      } else {
        require.ensure([], (require) => {
          cb(null, require('@views/app/Index').default)
        })
      }
    }
  }, {
    path: 'external/:type/:id(/:name)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/app/ExternalLink').default)
      })
    }
  }, {
    path: 'dashboard/:id(/:dataview_id)(/:name)',
    getComponent: (nextState, cb) => {
      if (isMobile()) {
        require.ensure([], (require) => {
          cb(null, require('@views/app/AppDashboardMobile').default)
        })
      } else {
        require.ensure([], (require) => {
          cb(null, require('@views/app/AppDashboard').default)
        })
      }
    }
  }, {
    path: 'data_report/:id(/:dataview_id)(/:name)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/app/AppDatareport').default)
      })
    }
  }, {
    path: 'error(/:type)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/app/AppError').default)
      })
    }
  }]
};
