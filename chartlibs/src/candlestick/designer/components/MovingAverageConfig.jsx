import React from 'react'
import PropTypes from 'prop-types'

import { PropComponents } from 'dmp-chart-sdk'
import Select from 'react-bootstrap-myui/lib/Select'
import MovingAverageConfigDialog from './MovingAverageConfigDialog'

import _ from 'lodash'

class MovingAverageConfig extends React.Component {
  static propTypes = {
    chart: PropTypes.object,
    data: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      option: _.cloneDeep(props.data) || [],
      configDialog: {
        show: false
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        option: _.cloneDeep(nextProps.data) || []
      })
    }
  }

  render() {
    const { option, configDialog } = this.state
    return (
      <div className="diagram-design-config-content">
        <div className="title">
          均线配置
          <span
            className="dmpicon-edit float-r"
            style={{ cursor: 'pointer', lineHeight: '20px' }}
            onClick={this.handleOpenConfigDialog.bind(this)}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title sub">是否显示</span>
          <PropComponents.Checkbox
            data={option.show}
            onChange={(data) => { this.handleChangeConfig('show', data) }}
          />
        </div>
        <div className="layout-config-column form">
          <span className="layout-config-column-title sub">曲线粗细</span>
          <Select
            value={option.lineStyle}
            maxHeight={160}
            width={85}
            openSearch={false}
            onSelected={({ value }) => { this.handleChangeConfig('lineStyle', value) }}
          >
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
          </Select>
          <div style={{ width: '110px', display: 'inline-block', marginLeft: '10px', height: '30px' }}>
            <PropComponents.Spinner
              min={1}
              data={option.lineWidth}
              onChange={(data) => { this.handleChangeConfig('lineWidth', data) }}
            />
          </div>
        </div>

        <div className="layout-config-column">
          <span className="layout-config-column-title sub">圆点半径</span>
          <PropComponents.Spinner
            min={1}
            data={option.circleWidth}
            onChange={(data) => { this.handleChangeConfig('circleWidth', data) }}
          />
        </div>
        {
          Array.isArray(option.lines) && option.lines.length > 0 && (
            <div style={{ paddingLeft: '10px' }}>
              <div className="config-group">
                <div className="title">
                  均线颜色
                </div>
                <div className="content">
                  {
                    option.lines.map((item, index) => (
                      <div className="layout-config-column" key={`candlestick-moving-average-config-${index}`}>
                        <span className="layout-config-column-title sub">{item.name}</span>
                        <PropComponents.ColorPicker
                          data={item.color}
                          onChange={(data) => { this.handleChangeLineColor(index, data) }}
                        />
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )
        }
        {
          configDialog.show && (
            <MovingAverageConfigDialog
              onSure={this.handleChangeLines.bind(this)}
              onClose={this.handleCloseConfigDialog.bind(this)}
              data={option.lines}
            />
          )
        }
      </div>
    )
  }

  // 打开配置对话框
  handleOpenConfigDialog() {
    this.setState(preState => ({
      configDialog: {
        ...preState.configDialog,
        show: true
      }
    }))
  }

  // 关闭配置对话框
  handleCloseConfigDialog() {
    this.setState(preState => ({
      configDialog: {
        ...preState.configDialog,
        show: false
      }
    }))
  }

  // 修改配置
  handleChangeConfig(field, data) {
    this.setState((preState) => {
      const option = _.cloneDeep(preState.option)
      option[field] = data
      return { option }
    }, () => {
      this.props.onChange(this.state.option)
    })
  }

  // 修改均线独立配色
  handleChangeLineColor(index, data) {
    this.setState((preState) => {
      const option = _.cloneDeep(preState.option)
      option.lines[index].color = data
      return { option }
    }, () => {
      this.props.onChange(this.state.option)
    })
  }

  // 变更均线设置
  handleChangeLines(lines) {
    this.setState(preState => ({
      option: {
        ...preState.option,
        lines
      }
    }), () => {
      this.props.onChange(this.state.option)
    })
  }
}

export default MovingAverageConfig
