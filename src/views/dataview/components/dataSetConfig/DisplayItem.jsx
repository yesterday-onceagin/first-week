import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import Input from 'react-bootstrap-myui/lib/Input'
import Select from 'react-bootstrap-myui/lib/Select'
import NumberInput from '../../../../components/NumberInput'

// 获取默认的条目数值
const _getDefaultDisplayItemValue = echart => (_.get(echart, 'designer.defaultDataSize', 10) || 10)

class DisplayItem extends React.Component {
  static propTypes = {
    config: PropTypes.object,
    echart: PropTypes.object,
    onChangeItemNums: PropTypes.func
  };

  static defaultProps = {
    echart: {}
  };

  constructor(props) {
    super(props)
    const { config } = props
    const type = config.top_head ? 'top_head' : (config.top_tail ? 'top_tail' : 'top_head')

    this.DEFAULT_DISPLAY_ITEM_VALUE = _getDefaultDisplayItemValue(props.echart)

    this.state = {
      type,
      value: config[type] || 0,
      checked: !!(config.top_head || config.top_tail)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.config, this.props.config)) {
      const { config } = nextProps
      const type = config.top_head ? 'top_head' : (config.top_tail ? 'top_tail' : '')
      this.setState({
        type: type || this.state.type || 'top_head',
        value: config[type] || 0,
        checked: !!(config.top_head || config.top_tail)
      })
    }

    if (!_.isEqual(nextProps.echart.designer, this.props.echart.designer)) {
      this.DEFAULT_DISPLAY_ITEM_VALUE = _getDefaultDisplayItemValue(nextProps.echart)
    }
  }

  render() {
    const { type, value, checked } = this.state
    return (
      <div className="item-wrap field-wrap">
        <div className="item-line">
          <div className="item-title">数据显示条目数</div>
          <div className="item-content">
            <Input
              label=" "
              type="checkbox"
              checked={checked}
              onChange={this.hanldeChecked.bind(this, checked)} />
          </div>
          <div style={{ clear: 'both' }}/>
        </div>
        {checked ?
          <div className="item-line" style={{ height: '30px' }}>
            <div style={{ float: 'left', width: '60px' }}>
              <Select
                value={type}
                maxHeight={160}
                width={'100%'}
                openSearch={false}
                onSelected={this.handleChangeSelect.bind(this)}>
                <option value="top_head">前</option>
                <option value="top_tail">后</option>
              </Select>
            </div>
            <div style={{ overflow: 'hidden', height: '100%', paddingLeft: '5px' }}>
              <NumberInput
                changeOnBlur={true}
                debounce={true}
                minValue={0}
                maxValue={1500}
                step={1}
                name="value"
                value={value}
                onChange={this.handleChangeNum.bind(this, type)} />
            </div>
          </div> : null}
      </div>
    )
  }

  hanldeChecked(checked) {
    this.setState(prevState => ({
      checked: !checked,
      type: checked ? 'top_head' : prevState.type
    }), () => {
      this.props.onChangeItemNums('display_item', JSON.stringify({
        top_head: !checked ? this.DEFAULT_DISPLAY_ITEM_VALUE : '',
        top_tail: ''
      }))
    })
  }

  handleChangeSelect(option) {
    this.setState({
      type: option.value
    }, () => {
      const config = { top_head: '', top_tail: '' }
      config[option.value] = this.state.value
      this.props.onChangeItemNums('display_item', JSON.stringify(config))
    })
  }

  handleChangeNum(type, value) {
    this.setState({
      value
    }, () => {
      const config = { top_head: '', top_tail: '' }
      config[this.state.type] = value
      this.props.onChangeItemNums('display_item', JSON.stringify(config))
    })
  }
}

export default DisplayItem
