/* 图表类 */
// import Pie from './components/Pie';
// import Line from './components/Line';
// import Column from './components/Column';
import FlowBar from './components/FlowBar';
// import Area from './components/Area';
// import Scatter from './components/Scatter';
import Radar from './components/Radar';
import TreeMap from './components/TreeMap';
//import NumberValue from './components/NumberValue';
// import Table from './components/Table';
import ScatterMap from './components/ScatterMap';
import Gauge from './components/Gauge';
import GaugeSplit from './components/GaugeSplit';
import DoubleAxis from './components/DoubleAxis';

/* 筛选器类 */
// import IndicatorDate from './components/IndicatorDate';
import IndicatorTime from './components/IndicatorTime';
// import IndicatorSelect from './components/IndicatorSelect';
import IndicatorNumber from './components/IndicatorNumber';
import IndicatorCheckbox from './components/IndicatorCheckbox';
import Timeline from './components/Timeline';

/* 简单单图类 */
// import SimpleText from './components/SimpleText'
import SimpleImage from './components/SimpleImage'
import SimpleClock from './components/SimpleClock'
import SimpleBorder from './components/SimpleBorder'

/* 开发调试中 */
// import LabelMap from './components/LabelMap';
import LiquidFill from './components/LiquidFill'

export default {
  // table: Table,
  //numerical_value: NumberValue,
  gauge: Gauge,   //占比饼图
  split_gauge: GaugeSplit,    //仪表盘
  // line: Line,
  // stack_line: Line,
  // cluster_column: Column,
  // stack_bar: Column,
  // horizon_bar: Column,
  // horizon_stack_bar: Column,
  double_axis: DoubleAxis,
  flow_bar: FlowBar,
  // circle_pie: Pie,
  // pie: Pie,
  // rose_pie: Pie,
  // circle_rose_pie: Pie,
  // funnel: Pie,
  // area: Area,
  // stack_area: Area,
  // scatter: Scatter,
  radar: Radar,
  scatter_map: ScatterMap,
  // treemap: TreeMap,
  //select_filter: IndicatorSelect,
  checkbox_filter: IndicatorCheckbox,
  timeline: Timeline,
  time_filter: IndicatorTime,
  // time_interval_filter: IndicatorDate,
  number_filter: IndicatorNumber,
  // simple_text: SimpleText,
  simple_image: SimpleImage,
  simple_clock: SimpleClock,
  simple_border: SimpleBorder,

  liquid_fill: LiquidFill,
  // label_map: LabelMap
}
