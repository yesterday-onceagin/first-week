// 数值类型 有3种 操作. 
// formula_mode - count - 计数
// formula_mode - 'avg': '平均值',
// formula_mode - 'sum': '求和', 
const getDataField = obj => (obj.formula_mode ? `${obj.formula_mode}_${obj.col_name}` : obj.col_name)
const getDataAlias = obj => obj.alias || obj.alias_name || obj.col_name
/*
  提取维度数据
 */
export function pluckDimsData(data, indicators, hook) {
  // 维度
  const dims = {}
  // 报告跳转
  const dimsReportRedirect = {}

  indicators.dims.forEach((dim, i) => {
    let value = []
    let jumpConfig = {}
    const field = getDataField(dim)
    let key = getDataAlias(dim)
    data.forEach((_data) => {
      value.push(_data[field])
    })
    if (dim.dashboard_jump_config) {
      if (typeof dim.dashboard_jump_config === 'string') {
        jumpConfig = JSON.parse(dim.dashboard_jump_config)
      } else {
        jumpConfig = dim.dashboard_jump_config
      }
    }

    let hookData = {
      key,
      value,
      jumpConfig
    }
    if (hook) {
      hookData = hook(hookData, dim, i)
    }

    key = hookData.key
    value = hookData.value
    jumpConfig = hookData.jumpConfig

    dims[key] = value
    if (jumpConfig.isOpen) {
      dimsReportRedirect[key] = jumpConfig || {}
    }
  })

  return { dims, dimsReportRedirect }
}

/*
  提取数值维度数据
 */
export function pluckNumsData(data, indicators, hook) {
  const nums = {}
  const numsDisplayFormat = {}
  const numsReportRedirect = {}
  let primaryNum = null
  indicators.nums.forEach((num, i) => {
    let value = []
    let jumpConfig = {}
    const field = getDataField(num)
    let key = getDataAlias(num)
    data.forEach((_data) => {
      value.push(_data[field])
    })
    let displayFormat = num.display_format
    if (num.dashboard_jump_config) {
      if (typeof num.dashboard_jump_config === 'string') {
        jumpConfig = JSON.parse(num.dashboard_jump_config)
      } else {
        jumpConfig = num.dashboard_jump_config
      }
    }
    let hookData = {
      key,
      value,
      displayFormat,
      jumpConfig
    }

    if (hook) {
      hookData = hook(hookData, num, i)
    }

    key = hookData.key
    value = hookData.value
    displayFormat = hookData.displayFormat
    jumpConfig = hookData.jumpConfig

    nums[key] = value
    numsDisplayFormat[key] = displayFormat
    if (jumpConfig.isOpen) {
      numsReportRedirect[key] = jumpConfig || {}
    }

    if (i === 0) {
      primaryNum = key
    }
  })

  return { nums, numsDisplayFormat, numsReportRedirect, primaryNum }
}
/*
  提取次轴数据
 */
export function pluckZaxisData(data, indicators, hook) {
  const zaxis = {}
  const zaxisDisplayFormat = {}
  let primaryAxis = null
  indicators.zaxis && indicators.zaxis.forEach((axis, i) => {
    let value = []
    const field = getDataField(axis)
    let key = getDataAlias(axis)
    data.forEach((_data) => {
      value.push(_data[field])
    })
    let displayFormat = axis.display_format

    let hookData = {
      key,
      value,
      displayFormat
    }

    if (hook) {
      hookData = hook(hookData, axis, i)
    }

    key = hookData.key
    value = hookData.value
    displayFormat = hookData.displayFormat

    zaxis[key] = value
    zaxisDisplayFormat[key] = displayFormat

    if (i === 0) {
      primaryAxis = key
    }
  })

  return { zaxis, zaxisDisplayFormat, primaryAxis }
}
