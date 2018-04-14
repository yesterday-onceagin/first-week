import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { apiMiddleware } from 'redux-api-middleware';
import transitionMiddleware from '../../../../middleware/transitionMiddleware';
import { routerReducer as routing } from 'react-router-redux';

// 数据看板
import dataViewList from '../../../../redux/modules/dataview/list';
import dataViewItemDetail from '../../../../redux/modules/dataview/itemDetail'

const rootReducer = combineReducers({
  // 看板
  dataViewList,
  dataViewItemDetail,
  //routing，这个Key值不能变，在redux-simple-router.syncHistory(history).listenForReplays(store)会用到
  routing
});

export default function configureStore(history, initialState) {
  const middlewares = [apiMiddleware, thunkMiddleware];
  const storeEnhancers = [transitionMiddleware(history)];
  const createStoreWithMiddleware = compose(applyMiddleware(...middlewares), ...storeEnhancers)
  const store = createStoreWithMiddleware(createStore)(rootReducer, initialState);
  return store
}
