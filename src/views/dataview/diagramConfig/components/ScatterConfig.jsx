import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash';
import ColorOptionColumn from '../../components/ColorOptionColumn'
import Select from 'react-bootstrap-myui/lib/Select';
import NumberInput from '../../../../components/NumberInput';

class ScatterConfig extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    //初始化默认值,防止旧数据报错
    let _showIndex = '1'
    let _condition = 'qianN'
    let _showNumber = 5
    let _color = '#41DFE3'
    let _type = 'circle'
    const { configInfo } = props
    if (configInfo) {
      _showIndex = configInfo.showIndex
      _condition = configInfo.condition
      _showNumber = configInfo.showNumber
      _color = configInfo.color
      _type = configInfo.type
    }
    this.state = {
      data: {
        type: _type,
        color: _color,
        showNumber: _showNumber,
        condition: _condition,
        showIndex: _showIndex
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const preConfigInfo = this.props.configInfo
    const { configInfo } = nextProps

    if (preConfigInfo && configInfo && !_.isEqual(preConfigInfo, configInfo)) {
      this.setState({
        data: _.cloneDeep(configInfo)
      })
    }
  }

  render() {
    const { showIndex, condition, showNumber, color, type } = this.state.data
    return <div>
      <div className="layout-config-column">
        <span className="layout-config-column-title">选择条件</span>
        <Select
          value={condition}
          maxHeight={160}
          width={'100%'}
          openSearch={false}
          onSelected={this.handleChangeSelect.bind(this, 'condition')}
        >
          <option value="qianN">前N设置</option>
        </Select>
      </div>
      {
        condition === 'qianN' && <div className="content layout-config-column" style = {{ paddingLeft: 0 }}>
          <div className="row">
            <div className="col-md-6">
              <Select
                value={showIndex}
                maxHeight={160}
                width={'100%'}
                openSearch={false}
                onSelected={this.handleChangeSelect.bind(this, 'showIndex')}
              >
                <option value="1">前</option>
                <option value="2">后</option>
              </Select>
            </div>
            <div className="col-md-6">
              <NumberInput
                changeOnBlur={true}
                debounce={true}
                minValue={0}
                maxValue={100}
                step={1}
                name="showNumber"
                value={showNumber}
                onChange={this.handleChange.bind(this, 'showNumber')}
              />
            </div>
          </div>
        </div>
      }
      <div className="layout-config-column">
        <span className="layout-config-column-title">散点类型</span>
        <Select
          value={type}
          maxHeight={160}
          width={'100%'}
          openSearch={false}
          onSelected={this.handleChangeSelect.bind(this, 'type')}
        >
          <option value="circle">气泡</option>
          <option value="pin">水滴</option>
          <option value="rect">方形</option>
          <option value="roundRect">弧形</option>
          <option value="triangle">三角形</option>
          <option value="diamond">钻石</option>
          <option value="arrow">箭头</option>
        </Select>
      </div>
      {/* <div className="layout-config-column">
        <span className="layout-config-column-title">散点大小</span>
        <NumberInput
          changeOnBlur={true}
          debounce={true}
          minValue={0}
          maxValue={100}
          step={1}
          name="size"
          value={size}
          onChange={this.handleChange.bind(this, 'size')}
        />
      </div> */}
      <div className="layout-config-column">
        <span className="layout-config-column-title">散点颜色</span>
        <ColorOptionColumn
          onChange={this.handleConfirmColorChange.bind(this)}
          field="color"
          color={color}
        />
      </div>
    </div>
  }

  handleChange(field, value) {
    _.set(this.state.data, field, value)
    this.setState({ ...this.state }, () => {
      this.props.onChange('scatterConfig', field, value)
    })
  }

  handleChangeSelect(field, option) {
    _.set(this.state.data, field, option.value)
    this.setState({ ...this.state }, () => {
      this.props.onChange('scatterConfig', field, option.value)
    })
  }

  handleConfirmColorChange(fieldName, color) {
    this.setState(preState => ({
      data: {
        ...preState.data,
        [fieldName]: color
      }
    }))
    this.props.onChange('scatterConfig', fieldName, color)
  }

  STYLE_SHEET = {
    selectText: {
      position: 'absolute',
      left: '104px',
      lineHeight: '30px',
      zIndex: 1
    },
  }
}

export default ScatterConfig
