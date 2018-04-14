module.exports = {
  path: 'change_password',
  getComponent: (nextState, cb) => {
    require.ensure([], (require) => {
      cb(null, require('@views/change_password/Index.jsx').default)
    })
  }
};
