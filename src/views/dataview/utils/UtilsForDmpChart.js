import { OPTION_MAPS, RESERVE_OPTION_MAPS } from '../constants/incOption'
import { formatDisplay, generateReportRedirectUrl } from './generateDisplayFormat'
import { scaleChart, getEchartRenderer } from './echartOptionHelper'
import { getColorFromTheme, generateDefaultColorTheme, getEchartColorFromTheme } from '@constants/echart'
import { pluckDimsData, pluckNumsData, pluckZaxisData } from './dataConverter'

import fmtSeries from './fmtSeries'
import fmtNumber from './fmtNumber'
import markLine from '@views/dataview/echarts/extension/markLine'

export default {
  OPERATE_OPTION_MAPS: OPTION_MAPS,
  OPERATE_OPTION_RESERVE_MAPS: RESERVE_OPTION_MAPS,
  applyOptionMarkline: markLine,
  Theme: { getColorFromTheme, generateDefaultColorTheme, getEchartColorFromTheme },
  DataUtils: { pluckDimsData, pluckNumsData, pluckZaxisData, noValueFormatter: fmtSeries, fmtNumber },
  formatDisplay,
  generateReportRedirectUrl, //生成报告跳转的URL
  scaleChart,
  getEchartRenderer
}
