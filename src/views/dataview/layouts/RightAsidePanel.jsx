import PropTypes from 'prop-types';
import React, { Component } from 'react';

import ChartTypeView from '../components/ChartTypeView'
import CHARTS_TYPE from '../constants/chartTypes'

class RightAsidePanel extends Component {
  static PropTypes = {
    data: PropTypes.object,       // 传递的 data
    ruleData: PropTypes.object,   // 规则
    throughAble: PropTypes.bool,  // 是否能穿透
    onSelectType: PropTypes.func  // 选中数据
  };

  constructor(props) {
    super(props);
    this.state = {
      info: {
        chart_code: props.data.chart_code
      },
      spread: {
        chartType: true
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data) {
      this.setState({
        ...this.state,
        info: {
          chart_code: nextProps.data.chart_code
        }
      })
    }
  }

  render() {
    return <div className="chart-type-wrap">
      {this.renderBlock(
        '基础图表类型', 'chartType', (
          [
            this.renderChartTypeSection()
          ]
        )
      )}
    </div>
  }

  renderBlock(title, spreadKey, sections) {
    const { spread } = this.state
    const style = { display: spread[spreadKey] ? 'block' : 'none' }
    if (sections.some(v => v)) {
      return <div className="form-group config">
        <div className="title" onClick={this.handleFuncConfigSpread.bind(this, spreadKey)}>
          <label className="control-label">
            <i className={`spread-icon dmpicon-arrow-down ${spread[spreadKey] ? '' : 'unspread'}`} />{title}
          </label>
        </div>
        <div className="choice-wrap" style={style}>
          <div className="form">{sections}</div>
        </div>
      </div>
    }
    return ''
  }

  renderChartTypeSection() {
    const { onSelectType, ruleData, throughAble, switchingDataSet } = this.props
    const chartData = CHARTS_TYPE['基础']

    return (
      <div className="form-group" key={new Date().getTime()}>
        <div className="input-wrapper">
          <ChartTypeView
            select_code={this.state.info.chart_code}
            data={chartData}
            select_data={CHARTS_TYPE['筛选']}
            onSelectType={onSelectType}
            switchingDataSet={switchingDataSet}
            ruleData={ruleData}
            through={throughAble}
          />
        </div>
      </div>
    )
  }

  handleFuncConfigSpread(key) {
    this.state.spread[key] = !this.state.spread[key]
    this.setState({
      ...this.state
    })
  }
}

export default RightAsidePanel
