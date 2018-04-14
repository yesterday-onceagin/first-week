import React from 'react'
import PropTypes from 'prop-types'
import Checkbox from '../Checkbox'
import Select from 'react-bootstrap-myui/lib/Select'
import NumberInput from '@components/NumberInput'
import ColorPicker from '../ColorPicker'
import MarklineConfigDialog from './MarklineConfigDialog'
import _ from 'lodash'

export default class MarklineConfig extends React.Component {
  static propTypes = {
    chart: PropTypes.object,
    data: PropTypes.object,
    onChange: PropTypes.func,
    axis: PropTypes.string, //y左轴, z右轴
    dynamic: PropTypes.bool, // 是否支持计算值
  }

  constructor(props) {
    super(props)
    this.state = {
      data: _.cloneDeep(props.data),
      configDialog: {
        show: false
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        data: _.cloneDeep(nextProps.data)
      })
    }
  }

  render() {
    const { axis, chart, dynamic } = this.props
    const { data, configDialog } = this.state
    const { show, color, width, style } = data
    return (<div>
      <div className="title">
        辅助线
        <span className="dmpicon-edit float-r" style={{ cursor: 'pointer', lineHeight: '20px' }} onClick={this.toggleConfigDialog.bind(this)}></span>
      </div>
      <div className="content">
        <div className="layout-config-column">
          <span className="layout-config-column-title sub">显示名称</span>
          <Checkbox data={show} onChange={this.updateValue.bind(this, 'show')}/>
        </div>
        <div className="layout-config-column form">
          <span className="layout-config-column-title sub">粗细</span>
          <Select
            value={style}
            maxHeight={160}
            width={85}
            openSearch={false}
            onSelected={this.updateValue.bind(this, 'style')}
          >
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
          </Select>
          <div style={{ width: '85px', display: 'inline-block', marginLeft: '10px', height: '30px' }}>
            <NumberInput className="border-input"
              changeOnBlur={true}
              debounce={true}
              value={+width}
              onChange={this.updateValue.bind(this, 'width')}
            />
          </div>
          <span className="layout-config-column-suffix">px</span>
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title sub">颜色</span>
          <ColorPicker
            data={color}
            onChange={this.updateValue.bind(this, 'color')}
          />
        </div>
      </div>
      {
        configDialog.show && <MarklineConfigDialog
          show={true}
          axis={axis}
          dynamic={dynamic}
          select_list={chart.nums || []}
          data={data.data}
          onSure={this.handleSureDialog.bind(this)}
          onClose={this.toggleConfigDialog.bind(this)}
        />
      }
    </div>)
  }

  toggleConfigDialog() {
    this.setState({
      configDialog: {
        ...this.state.configDialog,
        show: !this.state.configDialog.show
      }
    })
  }

  updateValue(key, value) {
    value = typeof value === 'object' ? value.value : value
    this.setState({
      data: {
        ...this.state.data,
        [key]: value
      }
    }, () => {
      this.commitData()
    })
  }

  handleSureDialog(data) {
    this.setState({
      data: {
        ...this.state.data,
        data
      }
    }, () => {
      this.toggleConfigDialog()
      this.commitData()
    })
  }

  commitData() {
    this.props.onChange(this.state.data)
  }
}
