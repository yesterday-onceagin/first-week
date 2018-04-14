export default function getFetchOptions(endpoint, method = 'GET', opts = {}) {
  let headers = opts.headers || {};
  headers = {
    ...headers,
    Accept: 'ajax'
  }

  if (headers['Content-Type'] === false) {
    delete headers['Content-Type']
  } else {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  const defaultOptions = {
    ...opts,
    endpoint,
    method,
    credentials: 'include',
    headers
  }

  return defaultOptions;
}
