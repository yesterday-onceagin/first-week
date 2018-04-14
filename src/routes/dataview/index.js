const { isMobile } = require('@helpers/common');

module.exports = {
  path: 'dataview',
  indexRoute: {
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/dataview/List').default)
      })
    }
  },
  childRoutes: [{
    // index为根目录 或有参数folderId
    path: '(index)(:folderId)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/dataview/List').default)
      })
    }
  }, {
    // index为根目录 或有参数folderId
    path: 'report/add(/:folderId)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/dataview/AddReport').default)
      })
    }
  }, {
    path: 'report(/:folderId)/:kanban_id/:kanban_name',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/dataview/ItemDetail').default)
      })
    }
  }, {
    path: 'chart/:folderId/:kanban_id/:kanban_name/add(/:id/:name)',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/dataview/AddOrEdit').default)
      })
    }
  }, {
    path: 'preview/:screenId',
    getComponent: (nextState, cb) => {
      if (isMobile()) {
        require.ensure([], (require) => {
          cb(null, require('@views/dataview/ScreensViewMobile').default)
        })
      } else {
        require.ensure([], (require) => {
          cb(null, require('@views/dataview/ScreensView').default)
        })
      }
    }
  }, {
    path: 'share/:screenId',
    getComponent: (nextState, cb) => {
      if (isMobile()) {
        require.ensure([], (require) => {
          cb(null, require('@views/dataview/ScreensViewMobile').default)
        })
      } else {
        require.ensure([], (require) => {
          cb(null, require('@views/dataview/ScreensView').default)
        })
      }
    }
  }, {
    path: 'multi-screen/add',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/dataview/CreateMultiScreen').default)
      })
    }
  }, {
    path: 'multi-screen/edit/:screenId',
    getComponent: (nextState, cb) => {
      require.ensure([], (require) => {
        cb(null, require('@views/dataview/CreateMultiScreen').default)
      })
    }
  }]
};
