require('es6-promise').polyfill();

import fetch from 'isomorphic-fetch';
import Cookies from 'js-cookie';
import CALL_API from './CALL_API';
import { isRSAA, validateRSAA } from './validation';
import { InvalidRSAA, RequestError } from './errors';
import { getJSON, normalizeTypeDescriptors, actionWith } from './util';

import XStorage from '../../helpers/XStorage';
import { baseAlias } from '../../config';

/**
 * A Redux middleware that processes RSAA actions.
 *
 * @type {ReduxMiddleware}
 * @access public
 */
function apiMiddleware({ getState }) {
  return next => async (action) => {
    //response object
    let res;

    // Do not process actions without a [CALL_API] property
    if (!isRSAA(action)) {
      return next(action);
    }

    // Try to dispatch an error request FSA for invalid RSAAs
    const validationErrors = validateRSAA(action);
    if (validationErrors.length) {
      const callAPI = action[CALL_API];
      if (callAPI.types && Array.isArray(callAPI.types)) {
        let requestType = callAPI.types[0];
        if (requestType && requestType.type) {
          requestType = requestType.type;
        }
        next({
          type: requestType,
          payload: new InvalidRSAA(validationErrors),
          error: true
        });
      }
      return null;
    }

    // Parse the validated RSAA action
    const callAPI = action[CALL_API];
    const { endpoint, method, headers, body, credentials, bailout, types, complete, error } = callAPI;
    const [requestType, successType, failureType] = normalizeTypeDescriptors(types);

    // Should we bail out?
    try {
      if ((typeof bailout === 'boolean' && bailout) ||
        (typeof bailout === 'function' && bailout(getState()))) {
        return null;
      }
    } catch (e) {
      return next(await actionWith(
        {
          ...requestType,
          payload: new RequestError('[CALL_API].bailout function failed'),
          error: true
        },
        [action, getState()]
      ));
    }

    // We can now dispatch the request FSA
    next(await actionWith(
      requestType,
      [action, getState()]
    ));

    try {
      // Make the API call
      res = await fetch(endpoint, { method, body, credentials, headers });
    } catch (e) {
      // The request was malformed, or there was a network error
      const json = {
        result: false,
        msg: e.message,
        preState: getState()
      }
      error && error(json)

      return next(await actionWith(
        {
          ...failureType,
          payload: new RequestError(e.message),
          error: true
        },
        [action, getState()]
      ));
    }

    // Process the server response
    if (res.ok) {
      //这里统一处理业务异常，仅当json.result === true时，调用其successType，否则则调用failureType，并且把payload设为ApiError
      return res.json().then(async (json) => {
        if (json && !json.result) json.preState = getState()
        complete && complete(json);

        if (json && json.result === true) {
          return next(await actionWith(successType, [action, getState(), json]))
        }
        return next(await actionWith({
          ...failureType,
          // payload: new ApiError(json.code, json.msg, json),
          payload: json,
          error: true
        }, [action, getState(), json]));
      });
    }
    if (res.status === 401) {
      //未登录
      getJSON(res).then(() => {
        const { hostname, pathname } = window.location
        // 清除本地的cookie
        Cookies.remove('token', { domain: `.${hostname}` });
        // 清除RETURN_URL
        XStorage.removeValue('RETURN_URL');
        // 当前不在登陆页的情况进行跳转
        if (!new RegExp(`^${baseAlias}/login.*`).test(pathname)) {
          window.location.href = `${baseAlias}/login?returnUrl=${encodeURIComponent(window.location.href)}`;
        }
      });
      return next(await actionWith(
        {
          ...failureType,
          error: true
        },
        [action, getState(), res]
      ));
    } else if (res.status === 403) {
      //没有权限，给它添加meta属性，让它路由到没有权限的页面去
      return next(await actionWith(
        {
          ...failureType,
          meta: {
            transition: () => ({ path: `${baseAlias}/nolicense` })
          }
        },
        [action, getState(), res]
      ));
    }
    const json = {
      result: false,
      code: res.status,
      // msg:res.status==403 ? '没有权限' : (res.statusText || '请求异常')
      msg: '请求异常',
      preState: getState()
    }
    complete && complete(json);

    return next(await actionWith(
      {
        ...failureType,
        error: true
      },
      [action, getState(), res]
    ));
  }
}

export { apiMiddleware };
