// 对 echarts 数据进行 处理. 
// null ->  '-'
// 12.000002121 -> 保留2位小数
export default function fmtSeries(data, noData = '-') {
  let _data = data
  if (!isNaN(+data)) {
    if (data != null && data !== '') {
      // 如果含有小数点
      // if (data.toString().indexOf('.') > -1) {
      //   _data = Number(+data).toFixed(2)
      // }
    } else {
      _data = noData
    }
  } else {
    _data = noData
  }
  return _data
}
