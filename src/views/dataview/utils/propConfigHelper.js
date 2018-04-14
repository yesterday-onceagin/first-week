import isEqual from 'lodash/isEqual'
import { getCommonConfig } from '../diagramConfig/propCommonConfig'

// 提取field属性关联的配置项
const getCustomFieldConfig = (chart_config) => {
  const fieldConfigs = {}
  if (chart_config) {
    for (let i = 0; i < chart_config.length; i++) {
      const group = chart_config[i]
      if (!group.field) continue;
      fieldConfigs[group.field] = {}
      if (group.spread !== undefined) {
        fieldConfigs[group.field].spread = group.spread
      }

      if (group.show !== undefined) {
        fieldConfigs[group.field].show = group.show
      }

      if (group && group.items && group.items.length > 0) {
        for (let j = 0; j < group.items.length; j++) {
          const item = group.items[j]
          if (!item.field) continue;

          if (item.field) {
            fieldConfigs[group.field][item.field] = (item.data !== undefined) ? item.data : null
          }

          if ((item.show && item.show.field) || (item.items && item.items.length > 0)) {
            const itemConfig = fieldConfigs[group.field][item.field]
            if (!itemConfig) {
              fieldConfigs[group.field][item.field] = {}
            }

            if (item.show && item.show.field) {
              fieldConfigs[group.field][item.field][item.show.field] = (item.show.data !== undefined) ? item.show.data : null
            }

            if (item.items && item.items.length > 0) {
              for (let k = 0; k < item.items.length; k++) {
                const subItem = item.items[k]
                if (subItem.field) {
                  fieldConfigs[group.field][item.field][subItem.field] = (subItem.data !== undefined) ? subItem.data : null
                }
              }
            }
          }
        }
      }
    }
  }
  return fieldConfigs
}

// 提取scope属性关联的配置项
const getCustomScopeConfig = (chart_config) => {
  const scopeConfigs = {}
  for (let i = 0; i < chart_config.length; i++) {
    const group = chart_config[i]
    if (group.scope) {
      scopeConfigs[group.scope] = {
        show: group.show
      }
    }

    if (group && group.items && group.items.length > 0) {
      for (let j = 0; j < group.items.length; j++) {
        const item = group.items[j]
        if (item && item.scope) {
          if (item.component) delete item.component
          scopeConfigs[item.scope] = {
            ...item
          }
        }

        if (item && item.items && item.items.length > 0) {
          for (let k = 0; k < item.items.length; k++) {
            const subItem = item.items[k]
            if (subItem && subItem.scope) {
              if (subItem.component) delete subItem.component
              scopeConfigs[subItem.scope] = {
                ...subItem
              }
            }
          }
        }
      }
    }
  }
  return scopeConfigs
}

// 提取配置项的数据（不包含component属性）
function _cleanItem(item) {
  const { field, label, data, scope, show, ref, refVal, items } = item
  const dataItem = { field, label }
  if (data !== undefined) { dataItem.data = data }
  if (scope !== undefined) { dataItem.scope = scope }
  if (show !== undefined) { dataItem.show = show }
  if (ref !== undefined) { dataItem.ref = ref }
  if (refVal !== undefined) { dataItem.refVal = refVal }
  if (items !== undefined) {
    const dataItems = items && items.map(subItem => _cleanItem(subItem))
    dataItem.items = dataItems
  }
  return dataItem
}

const getCustomConfigData = chart_config => chart_config && chart_config.map(group => ({
  ...group,
  items: (group.items && group.items.map(item => _cleanItem(item))) || []
}))

// 如果配置数据与组件配置项版本不一致，则升级配置数据
function _fillConfigData(fieldData, designerChartConfig) {
  const config = designerChartConfig || []
  if (config && config.length > 0) {
    for (let i = 0; i < config.length; i++) {
      const group = config[i]
      if (group && group.field && fieldData && fieldData[group.field]) {
        if (fieldData[group.field].spread !== undefined) {
          group.spread = fieldData[group.field].spread
        }

        if (fieldData[group.field].show !== undefined) {
          group.show = fieldData[group.field].show
        }
      }

      if (group && group.items && group.items.length > 0) {
        for (let j = 0; j < group.items.length; j++) {
          const item = group.items[j]
          if (item) {
            if (fieldData && fieldData[group.field] && fieldData[group.field][item.field] !== undefined) {
              item.data = fieldData[group.field][item.field]
            }

            if (item.show && item.show.field && fieldData && fieldData[group.field] && fieldData[group.field][item.field] && fieldData[group.field][item.field][item.show.field] !== undefined) {
              item.show.data = fieldData[group.field][item.field][item.show.field]
            }

            if (item.items && item.items.length > 0) {
              for (let k = 0; k < item.items.length; k++) {
                const subItem = item.items[k]
                if (subItem && subItem.field && fieldData && fieldData[group.field] && fieldData[group.field][item.field] && fieldData[group.field][item.field][subItem.field] !== undefined) {
                  subItem.data = fieldData[group.field][item.field][subItem.field]
                }
              }
            }
          }
        }
      }
    }
  }
  return config
}
const getMergedCustomConfigData = (chartConfigData, designerChartConfigData) => {
  let mergeData
  if (isEqual(chartConfigData, designerChartConfigData)) {
    mergeData = chartConfigData
  } else {
    const chartConfigFieldData = getCustomFieldConfig(chartConfigData)
    mergeData = _fillConfigData(chartConfigFieldData, designerChartConfigData)
  }
  return mergeData
}

// 根据filed获取属性组件
const getPropComponentByField = (chart_config, field, subField) => {
  let propComponent = null
  for (let i = 0; i < chart_config.length; i++) {
    const group = chart_config[i]
    if (group && group.items) {
      for (let j = 0; j < group.items.length; j++) {
        const item = group.items[j]
        if (item.field === field) {
          if (!subField) {
            propComponent = item.component && item.component.props ? item.component.component : item.component
            propComponent && (propComponent.__PROPS = item.component && item.component.props ? item.component.props : null)
            break;
          } else if (subField && item.items) {
            for (let k = 0; k < item.items.length; k++) {
              const subItem = item.items[k]
              if (subItem.field === subField) {
                propComponent = subItem.component && subItem.component.props ? subItem.component.component : subItem.component
                propComponent && (propComponent.__PROPS = subItem.component && subItem.component.props ? subItem.component.props : null)
                break;
              }
            }
            if (propComponent) break;
          }
        }
      }
      if (propComponent) break;
    }
  }

  return propComponent
}

// 合并图表通用配置
const concatCommonConfig = (customConfig, chartCode) => {
  const commonConfig = getCommonConfig(chartCode, customConfig)
  const _customConfig = customConfig.filter(config => config.disabled !== true)
  return _customConfig ? _customConfig.concat(commonConfig) : commonConfig
}

// 获取多级field的值, obj('a.b.c')=> obj[a][b][c]
const getFieldValByStrKeys = (obj, strkeys) => {
  const keys = strkeys.split('.')
  let val = null
  keys && keys.forEach((key) => {
    val = obj[key]
    obj = val
  })
  return val
}

export {
  getCustomFieldConfig,
  getCustomScopeConfig,
  getCustomConfigData,
  getMergedCustomConfigData,
  getPropComponentByField,
  concatCommonConfig,
  getFieldValByStrKeys
}
