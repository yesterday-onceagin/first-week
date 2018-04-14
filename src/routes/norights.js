module.exports = {
  path: 'norights',
  getComponent: (nextState, cb) => {
    require.ensure([], (require) => {
      cb(null, require('@views/NoRights').default)
    })
  }
};
