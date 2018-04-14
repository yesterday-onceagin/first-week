import React from 'react'
import NumberGlobal from './NumberGlobal'
import TableGlobal from './TableGlobal'
import TimelineGlobal from './TimelineGlobal'
import DoubleAxisGlobal from './DoubleAxisGlobal'
import GaugeGlobal from './GaugeGlobal'
import ColumnGlobal from './ColumnGlobal'
import LineGlobal from './LineGlobal'
import PieGlobal from './PieGlobal'
import ScatterGlobal from './ScatterGlobal'
import RadarGlobal from './RadarGlobal'
import ScatterMapGlobal from './ScatterMapGlobal'
import AreamapGlobal from './AreamapGlobal'
import LabelmapGlobal from './LabelmapGlobal'
import TreeMapGlobal from './TreeMapGlobal'

/* 全局样式设置*/
const Global = (props) => {
  const chartCode = props.chart ? props.chart.chart_code : ''
  switch (chartCode) {
    case 'timeline':
      return <TimelineGlobal {...props}/>
    case 'numerical_value':
      return <NumberGlobal {...props}/>
    case 'table':
      return <TableGlobal {...props}/>
    case 'double_axis':
      return <DoubleAxisGlobal {...props}/>
    case 'split_gauge':
    case 'gauge':
      return <GaugeGlobal {...props} chartCode= {chartCode}/>
    case 'horizon_bar':
    case 'cluster_column':
    case 'stack_bar':
    case 'horizon_stack_bar':
      return <ColumnGlobal {...props} chartCode= {chartCode}/>
    case 'line':
    case 'stack_line':
    case 'area':
    case 'stack_area':
      return <LineGlobal {...props} chartCode= {chartCode}/>
    case 'pie':
    case 'rose_pie':
    case 'circle_pie':
    case 'circle_rose_pie':
      return <PieGlobal {...props} chartCode={chartCode} />
    case 'scatter':
      return <ScatterGlobal {...props} chartCode={chartCode} />
    case 'scatter_map':
      return <ScatterMapGlobal {...props} chartCode={chartCode} />
    case 'area_map':
      return <AreamapGlobal {...props} chartCode={chartCode} />
    case 'label_map':
      return <LabelmapGlobal {...props} chartCode={chartCode} />
    case 'radar':
      return <RadarGlobal {...props} chartCode={chartCode} />
    case 'treemap':
      return <TreeMapGlobal {...props} chartCode={chartCode} />
    default:
      return null
  }
}

export default Global
