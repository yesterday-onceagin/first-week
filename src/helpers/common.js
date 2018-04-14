// 获取字符串长度（1中文=2英文）
const getStringEnLength = (str) => {
  if (!str) {
    return 0;
  }
  return str.replace(/[^\x00-\xff]/g, 'aa').length;
}

// 检测是否为url地址
const isUrl = str => (/^https?:\/\//.test(str))

// 检查是否为移动端
const isMobile = () => {
  /*
  * 取得userAgent
  * 移动端包含 iPad, iPhone, Android
  */
  const uA = navigator.userAgent
  const sW = window.innerWidth
  // 是否为移动端操作系统
  const isOsForMobile = uA.indexOf('Android') > -1 || uA.indexOf('iPhone') > -1 || uA.indexOf('iPad') > -1
  return sW <= 800 && isOsForMobile
}

export {
  getStringEnLength,
  isUrl,
  isMobile
}
