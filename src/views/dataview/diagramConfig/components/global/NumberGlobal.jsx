import React from 'react'
import PropTypes from 'prop-types'

import classnames from 'classnames'
import Select from 'react-bootstrap-myui/lib/Select'

import _ from 'lodash'

class NumberGlobal extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      data: {
        position: _.get(props, 'configInfo.position') || 'top',
        align: _.get(props, 'configInfo.align') || 'center',
        scroll: _.get(props, 'configInfo.scroll') || { checked: true }
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const { configInfo } = nextProps
    if (configInfo && !_.isEqual(this.props.configInfo, configInfo)) {
      this.setState({
        data: _.cloneDeep(configInfo)
      })
    }
  }

  render() {
    const { position, align, scroll } = this.state.data
    const cn = classnames('icon-checkbox', { checked: scroll && scroll.checked })
    return <div>
      <div className="layout-config-column form">
        <span className="layout-config-column-title">排列方式</span>
        <Select
          value={position}
          maxHeight={160}
          width={'100%'}
          openSearch={true}
          onSelected={this.handleChangeSelect.bind(this, 'position')}
        >
          {
            _.keys(this.POSITIONS).map(value => (
              <option value={value} key={`number-value-title-pos-${value}`}>
                {this.POSITIONS[value]}
              </option>
            ))
          }
        </Select>
      </div>
      <div className="layout-config-column form">
        <span className="layout-config-column-title">对齐方式</span>
        <Select
          value={align}
          maxHeight={160}
          width={'100%'}
          openSearch={true}
          onSelected={this.handleChangeSelect.bind(this, 'align')}
        >
          {
            _.keys(this.ALIGNS).map(value => (
              <option value={value} key={`number-value-title-align-${value}`}>
                {this.ALIGNS[value]}
              </option>
            ))
          }
        </Select>
      </div>
      <div className="layout-config-column form">
        <span className="layout-config-column-title">翻牌加载</span>
        <i className={cn} style={{ float: 'right', marginTop: '6px' }}onClick={this.handleItemClick.bind(this, 'scroll.checked', !(scroll && scroll.checked))}/>
      </div>
    </div>
  }
  handleItemClick(property, value) {
    _.set(this.state.data, property, value)
    this.setState({
      ...this.state
    }, () => {
      this.props.onChange('global', property, value)
    })
  }
  handleChangeSelect(property, option) {
    _.set(this.state.data, property, option.value)
    this.setState({
      ...this.state
    }, () => {
      this.props.onChange('global', property, option.value)
    })
  }

  // 对齐方式
  ALIGNS = {
    left: '居左对齐',
    center: '居中对齐',
    right: '居右对齐'
  };

  // 字体对齐方式
  POSITIONS = {
    left: '标题在左',
    top: '标题在上',
    bottom: '标题在下',
  };
}

export default NumberGlobal
