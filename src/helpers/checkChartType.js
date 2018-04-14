import _ from 'lodash';
/**
 * 校验图标类型 是否在 当前条件下 可用
 * currentRules -> 当前类型的规则
 * currentData -> 当前数据。为键值对, {dim: 1, value: 2} 
 * @return isvalid  bool
 */
export default function checkChartType(currentRules, currentData, formula_mode) {
  // 默认不符合规则
  let valid = false;
  /*dim: {max: "0", min: "0"}
  value: {max: "1", min: "1"}*/
  currentRules && currentRules.every((r) => {
    // 组满足条件
    let g_valid = true;
    // 默认不存在
    let field_valid = false
    !!currentData && Object.keys(currentData).forEach((item) => {
      // 排除 currentData 有值，但是不匹配的情况
      const _currentData = currentData[item];

      let min_valid = true;
      let max_valid = true;
      let type_valid = true;
      let formula_valid = true;

      if (r[item]) {
        // 最小值 符合
        if (r[item].min) {
          field_valid = true;
          min_valid = +_currentData >= +r[item].min;
        }
        // 最大值 符合
        if (r[item].max) {
          field_valid = true;
          max_valid = +_currentData <= +r[item].max;
        }
      }

      if (item === 'dim' && r.dim) {
        // type 符合
        if ([!!currentData.type, !!r.dim.type].indexOf(false) === -1) {
          field_valid = true;
          //增加下拉框字符串+枚举混合型
          if (Array.isArray(r.dim.type)) {
            const isFind = _.findIndex(r.dim.type, t => t === currentData.type)
            type_valid = (isFind > -1)
          } else {
            type_valid = currentData.type === r.dim.type
          }
        }
        // formula_mode 判断
        if ([!!currentData.formula_mode, !!r.dim.formula_mode].indexOf(false) === -1) {
          field_valid = true;

          const isFind = _.findIndex(r.dim.formula_mode, f => f === currentData.formula_mode)
          formula_valid = (isFind > -1)

          if (formula_mode) {
            formula_valid = r.dim.formula_mode.indexOf(formula_mode) > -1
          }
        }
      }

      g_valid = [field_valid, g_valid, min_valid, max_valid, type_valid, formula_valid].indexOf(false) === -1;
    })
    // 如果组条件满足
    if (g_valid) {
      valid = true;
      return false
    }
    return true
  })

  return currentRules ? valid : false;
}
