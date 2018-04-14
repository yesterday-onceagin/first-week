module.exports = {
  path: 'nolicense',
  getComponent: (nextState, cb) => {
    require.ensure([], (require) => {
      cb(null, require('@views/NoLicense').default)
    })
  }
};
