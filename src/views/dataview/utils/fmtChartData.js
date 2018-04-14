import { RESERVE_OPTION_MAPS } from '../constants/incOption';
import fmtSeries from './fmtSeries';

import { SIMPLE_TYPES, FILTER_TYPES } from '../../../constants/dashboard'
import { pluckDimsData, pluckNumsData } from './dataConverter'

// 对数据进行加工 
// -------- 改版后 -------------------
// 前端不再处理数据的准确. 
// 别名 匹配规则. ${formula_mode}_${col_name}

function dataProcess(type, indicators, data) {
  let primaryNum = ''             //记录第一个num, 因为多数值的时候y轴需要需要第一个num 的display_format
  const axisNum = []                //双轴图y轴需要需要两个num的display_format

  const dimsData = pluckDimsData(data, indicators, (hookData) => {
    if (type === 'table') {
      hookData.key = `_${hookData.key}`
    }
    return hookData
  })

  // 数值类型 有3种 操作. 
  // formula_mode - count - 计数
  // formula_mode - 'avg': '平均值',
  // formula_mode - 'sum': '求和', 
  const numsData = pluckNumsData(data, indicators, (hookData, num, index) => {
    // table 已经重构出去成为了单独组建, 所以这里没有验证, 以后需要删除
    if (type === 'table') {
      hookData.key = `_${hookData.key}`
      const suffix = dimsData.dims[key] ? (RESERVE_OPTION_MAPS[num.formula_mode] ? `(${RESERVE_OPTION_MAPS[num.formula_mode]})` : '') : ''
      hookData.key += suffix
    }
    if (index === 0) {
      primaryNum = hookData.key
    }
    axisNum.push(hookData.key)
    return hookData
  })

  return { ...dimsData, ...numsData, primaryNum, axisNum }
}

// 对 data 数据 null -> '-'
function filter(data) {
  data.forEach((item) => {
    Object.keys(item).map((key) => {
      if (item[key] == null) {
        item[key] = '-'
      }
    })
  })
}

export default function fmtChartData(type, indicators, data, conditions) {
  if (SIMPLE_TYPES.indexOf(type) > -1) return data
  filter(data)
  //暂时先把下拉框特殊处理服你
  if (type === 'select_filter') {
    const dataWithAlias = {}
    const dims_name = []
    const selector_key = []
    const selector_value = {}
    //生成selector_key
    indicators.dims.forEach((item) => {
      const alias = item.alias || item.alias_name || item.col_name
      dims_name.push(alias)
      selector_key.push(item.col_name)
    })
    //缓存选中对象
    if (conditions && conditions.length > 0) {
      conditions.forEach((item) => {
        selector_value[item.col_name] = (item.col_value !== '') ? JSON.parse(item.col_value) : undefined
      })
    }
    //把别名加入放到placeholder
    Object.assign(dataWithAlias, {
      dataList: data,
      dims: indicators.dims,
      dims_name,
      selector_key,
      selector_value
    });
    return dataWithAlias
  } else if (FILTER_TYPES.indexOf(type) > -1) {
    //只有一个维度
    const dim = indicators.dims[0]
    const alias = dim ? dim.alias || dim.alias_name || dim.col_name : ''
    let selector_value = []
    if (type === 'checkbox_filter' && conditions && conditions.length > 0) {
      //只有一个conditions
      selector_value = JSON.parse(conditions[0].col_value)
    }
    return Object.assign({}, { dataList: data, dim_name: alias, dim, selector_value })
  }

  const { dims, nums, numsDisplayFormat, primaryNum, axisNum } = dataProcess(type, indicators, data);
  let chart_data; // line, cluster_column, scatter_map

  switch (type) {
    case 'stack_area':
    case 'area': {
      let xAxis = []
      Object.keys(dims).map((dim) => { xAxis = dims[dim] })
      chart_data = { xAxis, primaryNum, series: nums, displayFormat: numsDisplayFormat, dimsForRelated: indicators.dims[0] }
    } break;
    case 'circle_rose_pie':
    case 'circle_pie':
    case 'rose_pie':
    case 'treemap':
    case 'funnel':
    case 'pie': {
      // 1个维度， 1个数值,0 维度， 多数值
      const __data = []
      const _dims = Object.entries(dims)
      const _nums = Object.entries(nums)
      let total_data = 0
      let total_percent = 0
      if (_dims.length > 0) {
        _dims[0][1].forEach((item, i) => {
          const value = _nums[0] ? +_nums[0][1][i] : null
          total_data += Number(value)
          __data.push({ name: item, value })
        })
      } else {
        _nums.forEach((item) => {
          total_data += Number(item[1][0])
          __data.push({ name: item[0], value: item[1][0] })
        })
      }
      // 添加百分比
      __data.forEach((item, index) => {
        if (index === __data.length - 1) {
          item.percent = 1 - total_percent
        } else {
          item.percent = +Number(item.value / total_data).toFixed(4)
          total_percent += +item.percent
        }
      })
      chart_data = { dataArr: __data, dimsForRelated: indicators.dims[0], displayFormat: numsDisplayFormat }
    } break;
    case 'radar': {
      let dim = []
      const __data = []
      Object.keys(dims).map((_dim) => {
        dim = dims[_dim]
      })
      Object.keys(nums).map((num) => {
        __data.push({ name: num, value: nums[num] })
      })

      chart_data = { dim, primaryNum, series: __data, displayFormat: numsDisplayFormat }
    } break;
    case 'scatter': {
      const series = []
      const title_text = []

      Object.keys(nums).forEach((item) => {
        title_text.push(item)
      })

      // 有维度的情况
      if (Object.keys(dims).length > 0) {
        // 转换成对象
        const _dims = Object.entries(dims);
        const names = [];
        data.forEach((_data, key) => {
          const name = []
          _dims.forEach((item) => {
            name.push(`${item[0]}：${item[1][key]}`)
          })
          names.push(name)
        })

        data.forEach((item, i) => {
          const value = []
          title_text.forEach((item) => {
            value.push(fmtSeries(nums[item][i]))
          })
          series.push({
            name: names[i],
            value
          })
        })
      } else {
        const value = []
        title_text.forEach((item) => {
          value.push(fmtSeries(nums[item][0]))
        })
        series.push({
          name: '',
          value
        })
      }
      chart_data = { title_text, series, displayFormat: numsDisplayFormat }
    } break;
    case 'table': {
      const _data = []
      for (let i = 0; i < data.length; i++) {
        let item = {};
        Object.keys(dims).forEach((dim) => {
          item = {
            ...item,
            [`${dim}`]: dims[dim][i]
          }
        });
        Object.keys(nums).forEach((num) => {
          item = {
            ...item,
            [`${num}`]: nums[num][i]
          }
        });
        _data.push(item)
      }
      chart_data = { data: _data, displayFormat: numsDisplayFormat, dim_total: Object.keys(dims).length, value_total: Object.keys(nums).length }
    } break;
    case 'liquid_fill':
    case 'split_gauge':
    case 'gauge':
    case 'numerical_value': {
      let name = ''
      let value = [0]
      let desire = null
      if (indicators && indicators.nums) {
        indicators.nums.forEach((item, i) => {
          const alias = item.alias || item.alias_name || item.col_name
          if (i === 0) {
            name = alias
            value = nums[alias]
          } else if (i === 1) {
            desire = nums[alias]
          }
        })
      }
      chart_data = { name, value, desire, displayFormat: numsDisplayFormat }
    } break;
    case 'double_axis': {
      chart_data = { dims, nums, axisNum, primaryNum, dimsForRelated: indicators.dims, displayFormat: numsDisplayFormat }
    } break;
    default:
      chart_data = { dims, nums, axisNum, primaryNum, dimsForRelated: indicators.dims, displayFormat: numsDisplayFormat }
  }

  return chart_data
}
