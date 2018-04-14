import { generateDefaultColorTheme } from '../../../constants/echart';
import generateDisplayFormat from './generateDisplayFormat';
import _ from 'lodash';

const createDefaultFuncConfig = function () {
  return {
    markLineDialog: false,
    markLine: [],      // 辅助线
    thumbnail: false,  // 缩略轴
    thumbnail_value: {
      start: '',
      end: '',
    },
    display_item: {
      show: false,
      type: '前',
      value: ''
    },
    autoRefresh: {     // 自动刷新
      on: false,
      value: 1,
      unit: 'H'       //H 小时, M 分钟, S秒
    }
  }
}

const createDefaultChartConfig = function () {
  return {
    pieEmpty: false,    // 空心饼状图
    pieDataSlice: true, // 默认截取前10个数据
    gaugePercent: false, // 仪表盘显示百分比
    gaugeTargetValue: null, // 仪表盘目标值
  }
}

const createDefaultFieldConfig = function () {
  return {
    indicators: {                         // --- 需要存取的数据
      图层: [],
      维度: [],
      数值: [],
    },
    alias_dialog: {                       // 别名设置弹窗 
      show: false,
      type: '',
      active: ''
    },
    chart_pending: false,
    through_active: -1,                   // 穿透index
  }
}

const createTableExtends = function () {
  const default_scrollUp = {
    show: true,
    interval: ''            // 间隔时间
  }

  const default_tableHead = {
    show: true,
    color: window.DEFAULT_ECHARTS_OPTIONS.digramStyle.tableHead.color,
    size: '12px',
    style: '',
    align: 'right',
    background: window.DEFAULT_ECHARTS_OPTIONS.digramStyle.tableHead.background
  }

  const default_tableBody = {
    show: true,
    color: window.DEFAULT_ECHARTS_OPTIONS.digramStyle.tableBody.color,
    size: '12px',
    style: '',
    align: 'right',
    oddBackground: 'transparent',
    evenBackground: 'transparent',
    horizonBorderColor: window.DEFAULT_ECHARTS_OPTIONS.digramStyle.tableBody.horizonBorderColor,
    verticalBorderColor: window.DEFAULT_ECHARTS_OPTIONS.digramStyle.tableBody.horizonBorderColor
  }
  
  return {
    scrollUp: _.cloneDeep(default_scrollUp),
    tableHead: _.cloneDeep(default_tableHead),
    tableBody: _.cloneDeep(default_tableBody),
  }
}

const createNumberValueExtends = function () {
  return {
    numberLayout: {
      type: 'top',
      align: 'left',
      style: '',
    },
    numberValue: {
      color: window.DEFAULT_ECHARTS_OPTIONS.numberValueStyle.valueColor,
      size: '32px',
      style: '',
    },
    numberSuffix: {
      color: window.DEFAULT_ECHARTS_OPTIONS.numberValueStyle.valueColor,
      size: '32px',
      style: '',
    }
  }
}


const resetChartConfigState = function (state, chartType) {
  switch (chartType) {
    case 'select_filter':
    case 'checkbox_filter':
    case 'time_filter':
    case 'number_filter':
    case 'time_interval_filter':
      state.editing = true
      break

    default:
      break
  }
  return state
}

export {
  resetChartConfigState,
  generateDefaultColorTheme,
  generateDisplayFormat,
  createDefaultFuncConfig,
  createDefaultChartConfig,
  createTableExtends,
  createNumberValueExtends,
}
