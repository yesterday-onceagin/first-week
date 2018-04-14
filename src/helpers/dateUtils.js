const formatDate = function (dateObj, format) {
  const date = {
    'M+': dateObj.getMonth() + 1,
    'd+': dateObj.getDate(),
    'h+': dateObj.getHours(),
    'm+': dateObj.getMinutes(),
    's+': dateObj.getSeconds(),
    'q+': Math.floor((dateObj.getMonth() + 3) / 3),
    'S+': dateObj.getMilliseconds()
  };
  if (/(y+)/i.test(format)) {
    format = format.replace(RegExp.$1, (`${dateObj.getFullYear()}`).substr(4 - RegExp.$1.length));
  }
  Object.getOwnPropertyNames(date).forEach((k) => {
    if (new RegExp(`(${k})`).test(format)) {
      format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? date[k] : (`00${date[k]}`).substr((`${date[k]}`).length));
    }
  })
  return format;
}

/**
 * 将时间转换成对应的格式 yyyy-MM-dd hh:mm:ss
 * @param  {string} format 需要转化的格式
 * @param  {object} date   需要转换的时间
 * @return {string}        按照对应格式转换后的时间
 */
function dateToString(format, date) {
  date = date || new Date();
  return formatDate(date, format);
}

/**
 * 将string转换成时间
 * @param  {string} date    需要转成的字符串
 * @param  {string} split   默认为 '-'，如果显示为‘/’可不传
 * @return {object}         返回时间对象 or 返回本身
 */
function stringToDate(date, split) {
  split = split || '-';
  return typeof date === 'string' ? new Date(date.replace(`/${split}/g`, '/')) : date;
}


/**
 * 获取距离今日多少日的 时间 
 * yyyy-mm-dd
 */

function getDateStr(AddDayCount) {
  const dd = new Date();
  dd.setDate(dd.getDate() + AddDayCount);//获取AddDayCount天后的日期 
  const y = dd.getFullYear();
  let m = dd.getMonth() + 1;//获取当前月份的日期 
  let d = dd.getDate();

  m = m > 9 ? m : `0${m}`
  d = d > 9 ? d : `0${d}`
  return `${y}-${m}-${d}`;
}

export {
  dateToString,
  stringToDate,
  getDateStr
}
