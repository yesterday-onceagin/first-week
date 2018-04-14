import React from 'react';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

import configureStore from './redux/configureStore';
import routes from './routes/index';
import { DEV } from './config';

const store = configureStore(browserHistory);
const history = syncHistoryWithStore(browserHistory, store)

function devTools() {
  if (DEV) {
    const DevTools = require('./containers/DevTools').default;
    return <DevTools />
  }

  return null
}

const App = () => (
  <Provider store={store}>
    <div>
      <Router history={history} routes={routes} />
      {/*devTools()*/}
    </div>
  </Provider>
)

export default App
