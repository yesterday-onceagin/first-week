import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { apiMiddleware } from 'redux-api-middleware';
import transitionMiddleware from '../middleware/transitionMiddleware';

import rootReducer from './rootReducer';
import { DEV } from '../config'

export default function configureStore(history, initialState) {
  const middlewares = [apiMiddleware, thunkMiddleware];
  const storeEnhancers = [transitionMiddleware(history)];

  if (DEV) {
    // const { logger } = require('redux-logger');  ----> 暂时不用打印log
    const DevTools = require('../containers/DevTools').default;

    // middlewares.push(logger); ----> 暂时不用打印log
    storeEnhancers.push(DevTools.instrument())
  }

  const createStoreWithMiddleware = compose(applyMiddleware(...middlewares), ...storeEnhancers)

  const store = createStoreWithMiddleware(createStore)(rootReducer, initialState);

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./rootReducer', () => {
      const nextRootReducer = require('./rootReducer').default
      store.replaceReducer(nextRootReducer)
    })
  }

  return store
}
