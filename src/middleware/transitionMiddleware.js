
const dispatcher = (action, store, history) => {
  const { meta } = action;
  const transitionMetaFunc = meta ? meta.transition : null;


  store.dispatch(action);

  const nextState = transitionMetaFunc && store.getState();

  const transitionData = transitionMetaFunc && (
    transitionMetaFunc(nextState, action)
  );

  if (transitionData) {
    const { path: pathname, query: search, replace, state } = transitionData;
    const method = replace ? 'replace' : 'push';

    history[method]({ pathname, state, search });
  }

  return action;
}

/**
 * store enhancer
 */
export default history => next => (reducer, initialState) => {
  const store = next(reducer, initialState);
  return {
    ...store,
    dispatch(action) {
      dispatcher(action, store, history)
    }
  }
}
