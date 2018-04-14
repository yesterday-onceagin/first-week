import React from 'react'
import PropTypes from 'prop-types'

import Select from 'react-bootstrap-myui/lib/Select'
import NumberInput from '../../../../../components/NumberInput'
import SliderInput from '../../../../../components/SliderInput';
import ColorOptionColumn from '../../../components/ColorOptionColumn'

import _ from 'lodash'
import classnames from 'classnames'

class TimelineGlobal extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      data: _.cloneDeep(props.configInfo)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.configInfo && !_.isEqual(this.props.configInfo, nextProps.configInfo)) {
      this.setState({
        data: _.cloneDeep(nextProps.configInfo)
      })
    }
  }

  render() {
    const { data } = this.state
    const cn = classnames('icon-checkbox', { checked: data.isCarousel })
    return (
      <div>
        <div className="layout-config-column">
          <span className="layout-config-column-title">布局</span>
          <Select
            value={data.layout}
            maxHeight={160}
            width="100%"
            openSearch={false}
            onSelected={this.handleChangeSelectValue.bind(this, 'layout')}
          >
            <option value="horizon" >水平排列</option>
            <option value="vertical" >垂直排列</option>
          </Select>
        </div>

        <hr/>

        <div className="title">
          轮播
          <i className={cn} onClick={this.handleItemClick.bind(this, 'isCarousel')}/>
        </div>

        <hr/>

        <div className="title">
          轮播设置
        </div>
        <div className="content">
          <div className="layout-config-column has-suffix">
            <span className="layout-config-column-title sub">间隔时间</span>
            <span className="layout-config-column-suffix">s</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={5}
              maxValue={60}
              step={1}
              name="interVal"
              value={data.interval}
              onChange={this.handleChange.bind(this, 'interval')}
            />
          </div>
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">{data.layout === 'vertical' ? '上下边距' : '左右边距'}</span>
            <SliderInput
              className="config"
              tipFormatter= { v => `${v}%`}
              minValue={0}
              maxValue={50}
              step={1}
              value={data.distance}
              onChange={this.handleChange.bind(this, 'distance')}
            />
          </div>
        </div>
        <hr/>

        <div className="title">
          轴线背景
        </div>
        <div className="content">
          <div className="layout-config-column has-suffix">
            <span className="layout-config-column-title sub">粗细</span>
            <span className="layout-config-column-suffix">px</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={1}
              maxValue={5}
              step={1}
              name="size"
              value={data.size}
              onChange={this.handleChange.bind(this, 'size')}
            />
          </div>
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">默认背景色</span>
            <ColorOptionColumn
              onChange={this.handleConfirmColorChange.bind(this)}
              field="default_bg_color"
              color={data.default_bg_color}
            />
          </div>
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">选中背景色</span>
            <ColorOptionColumn
              onChange={this.handleConfirmColorChange.bind(this)}
              field="default_selected_color"
              color={data.default_selected_color}
            />
          </div>
        </div>
      </div>
    )
  }

  // 确定颜色选择
  handleConfirmColorChange(field, color) {
    _.set(this.state.data, field, color)
    this.setState({
      ...this.state
    }, () => {
      this.props.onChange('global', field, this.state.data[field])
    })
  }

  handleChangeSelectValue(type, option) {
    const { data } = this.state
    data[type] = option.value
    this.props.onChange('global', type, option.value)
  }

  handleChange(property, value) {
    const { data } = this.state
    data[property] = value
    this.setState({
      ...data
    }, () => {
      this.props.onChange('global', property, this.state.data[property])
    })
  }

  handleItemClick(property) {
    const { data } = this.state
    data[property] = !data[property]
    this.setState({
      ...data
    }, () => {
      this.props.onChange('global', property, this.state.data[property])
    })
  }
}

export default TimelineGlobal
