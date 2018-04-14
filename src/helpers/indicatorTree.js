/**
 * 1、指标数据有维度
 * 2、指标数据没有children 和 text 等关键属性。
 */
export default function indicatorTree(allIndicator) {
  const _list = allIndicator.slice();

  // odps 表和字段是否已经设置
  const isSetOdps = (indicators) => {
    // 默认不禁用
    let bool = true;
    indicators && indicators.forEach((indicator) => {
      if (Array.isArray(indicator.dimension) && (!indicator.odps_field || !indicator.odps_table)) {
        return bool = true;
      }
    })
    return bool
  }

  const convertTree = (data, field) => {
    for (const j in data) {
      if (data[j].name) {
        data[j].text = data[j].name;
      }
      // 
      if (data[j].indicator && !isSetOdps(data[j].indicator)) {
        delete data[j].indicator
      } else if (data[j][field]) {
        data[j].children = data[j][field].length > 0 ? data[j][field] : null;
        convertTree(data[j][field], field);
      }
    }
    return data
  }

  return convertTree(_list, 'indicator')
}
