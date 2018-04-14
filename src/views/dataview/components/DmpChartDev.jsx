import React from 'react'
import PropTypes from 'prop-types'
import { getCustomFieldConfig } from '../utils/propConfigHelper'

// 常量
import Constants from '../constants/ConstantsForDmpChart'

// 实用方法
import Utils from '../utils/UtilsForDmpChart'

// 属性基础组件
import PropComponents from '../diagramConfig/propComponents/index'

// 通用基础组件
import EmptyTip from '../../../components/EmptyStatus'
import { Form, ValidatedInput } from '../../../components/bootstrap-validation'

const BaseComponents = {
  EmptyTip,
  Form,
  ValidatedInput
}

// 高阶组件Connect
const Connect = () => (ChartComponent) => {
  const chartName = ChartComponent.displayName || ChartComponent.name || 'ChartComponent'
  return class extends React.Component {
    displayName = `DmpChartDev(${chartName})`

    static propTypes = {
      designTime: PropTypes.bool,
      through: PropTypes.bool,
      throughList: PropTypes.array,
      editable: PropTypes.bool,
      isHidden: PropTypes.bool,
      clearSelect: PropTypes.bool,
      originData: PropTypes.object,
      dataGrid: PropTypes.object,
      id: PropTypes.string,
      currentId: PropTypes.string,
      uuid: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]),
      scaleRate: PropTypes.number,
      chart_config: PropTypes.array,
      events: PropTypes.object,
      dashboardName: PropTypes.string,
      platform: PropTypes.string,
      operatorShow: PropTypes.bool
    }

    constructor(props) {
      super(props)
      this.state = {
        layer: props.dataGrid || null
      }

      // 暴露的static 方法
      this.getChart = () => {
        if (this.echart && this.echart.getChart && typeof this.echart.getChart === 'function') {
          return this.echart.getChart()
        }
        return null
      }
    }

    componentDidMount() {
      const { layer } = this.state
      if (!layer) {
        this.setState({
          layer: {
            w: this.innerBox.offsetWidth,
            h: this.innerBox.offsetHeight,
            x: 0,
            y: 0,
            z: 0
          }
        })
      }
    }

    componentWillReceiveProps(nextProps) {
      this.setState({
        layer: nextProps.dataGrid || {
          w: this.innerBox.offsetWidth,
          h: this.innerBox.offsetHeight,
          x: 0,
          y: 0,
          z: 0
        }
      })
    }

    render() {
      const {
        originData,
        chart_config,
        designTime,
        scaleRate,
        events,
        through,
        throughList,
        id,
        editable,
        currentId,
        clearSelect,
        uuid,
        dashboardName,
        isHidden,
        platform,
        operatorShow
      } = this.props
      const { layer } = this.state
      return (
        <div className="graph-inner-box" ref={(node) => { this.innerBox = node }}>
          {layer ? <ChartComponent
            ref={(instance) => { this.echart = instance }}
            // chart更新凭证
            chartUuid={uuid}
            chartId={id}
            clearRelated={clearSelect}
            // 同一数据集正在联动的单图id
            currentRelatedChartId={currentId}
            // 设计状态
            designTime={designTime || editable}
            // 是否允许穿透
            through={through}
            // 穿透图层
            throughList={throughList}
            data={originData}
            configInList={chart_config}
            config={getCustomFieldConfig(chart_config)}
            layer={layer}
            layerToolboxShow={operatorShow}
            // 缩放比例
            scale={scaleRate}
            dashboardName={dashboardName}
            // 是否为编辑状态
            editable={editable}
            // 是否因tab组件而隐藏
            isHidden={isHidden}
            // 当前展示的平台类型
            platform={platform}
            events={
              {
                // 设计时修改数据集默认值（用于需要设置默认值的筛选器）
                onChangeDatasetDefaultValue: conditions => events && events.onChangeDatasetDefaultValue && events.onChangeDatasetDefaultValue(conditions, id),
                // 筛选过滤(筛选器)
                onFilterChange: (conditions, chartId, type, dataList, isSubmit, dt) => events && events.onFilterChange && events.onFilterChange(conditions, chartId, type, dataList, isSubmit, dt),
                // 单图联动
                onRelateChart: events && events.onChartChange,
                // 穿透查询
                onPenetrateQuery: events && events.onThrough,
                // tab过滤
                onChangeTab: params => events && events.onChangeTab && events.onChangeTab(params, id),
                // 单图配置保存
                updateConfig: config => events && events.onConfigChange(config, id)
              }
            }
          /> : null}
        </div>
      )
    }
  }
}

export {
  Utils,
  Constants,
  BaseComponents,
  PropComponents,
  Connect
}
