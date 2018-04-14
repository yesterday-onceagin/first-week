const TRACK_OPTIONS = [
  'cn-hangzhou.log.aliyuncs.com',
  'dmp-app',
  'dmp-webtracking-t'
]

export default function aliyunTrackLogs(logs) {
  const logger = new window.Tracker(TRACK_OPTIONS[0], TRACK_OPTIONS[1], TRACK_OPTIONS[2]);
  if (logger) {
    const _logs = {
      ...logs,
      domain: window.location.hostname,
      url: window.location.href,
      brower: navigator.userAgent
    }

    Object.keys(_logs).forEach((key) => {
      logger.push(key, _logs[key]);
    })
  }

  logger.logger();
}
