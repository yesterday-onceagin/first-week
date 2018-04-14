import React from 'react'
import PropTypes from 'prop-types'
import Select from 'react-bootstrap-myui/lib/Select'
import NumberInput from '@components/NumberInput'
import _ from 'lodash'

export default class ScrollMode extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props)
    this.state = {
      data: _.cloneDeep(props.data)
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
    const { mode, rows } = this.state.data
    return <div>
      <div className="layout-config-column form">
        <span className="layout-config-column-title">滚动模式</span>
        <Select
          value={mode}
          width={110}
          onSelected={this.handleSelect.bind(this)}
        >
          <option value="page">按页</option>
          <option value="row">按行</option>
        </Select>
        {mode === 'row' && <div style={{ width: '85px', display: 'inline-block', marginLeft: '10px', paddingRight: '26px' }}>
          <span className="layout-config-column-suffix">行</span>
          <NumberInput className="border-input"
            changeOnBlur={true}
            debounce={true}
            minValue={1}
            value={rows}
            onChange={this.handleChangeNumberInput.bind(this, 'rows')}
          />
        </div>}
      </div>
    </div>
  }

  handleSelect({ value }) {
    this.setState({
      data: {
        ...this.state.data,
        mode: value
      }
    }, () => {
      this._confirm()
    })
  }

  handleChangeNumberInput(key, value) {
    this.setState({
      data: {
        ...this.state.data,
        [key]: value
      }
    }, () => {
      this._confirm()
    })
  }

  _confirm() {
    this.props.onChange(this.state.data)
  }
}
