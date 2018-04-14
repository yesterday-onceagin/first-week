import React from 'react'
import PropTypes from 'prop-types'

import Input from 'react-bootstrap-myui/lib/Input';
import Select from 'react-bootstrap-myui/lib/Select';
import NumberInput from '../../../../../components/NumberInput'

import _ from 'lodash'

class Refresh extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      data: _.cloneDeep(props.configInfo.refresh)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.configInfo.refresh, nextProps.configInfo.refresh)) {
      this.setState({
        data: _.cloneDeep(nextProps.configInfo.refresh)
      })
    }
  }

  render() {
    const { checked, value, unit } = this.state.data
    return (
      <div>
        <div className="title">
          定时刷新
          <span onClick={this.hanldeChecked.bind(this, checked)}>
            <Input
              type="checkbox"
              checked={checked}
              onChange={() => { }}
            />
          </span>
        </div>
        {
          checked && <div className="content">
            <div className="row">
              <div className="col-md-6">
                <NumberInput
                  changeOnBlur={true}
                  debounce={true}
                  minValue={0}
                  maxValue={60}
                  step={1}
                  name="interVal"
                  value={value}
                  onChange={this.handleChange.bind(this)}
                />
              </div>
              <div className="col-md-6">
                <Select
                  value={unit}
                  maxHeight={160}
                  width={'100%'}
                  openSearch={false}
                  onSelected={this.handleChangeSelect.bind(this)}
                >
                  <option value="H">小时</option>
                  <option value="M">分钟</option>
                  <option value="S">秒</option>
                </Select>
              </div>
            </div>
          </div>
        }
      </div>
    )
  }

  hanldeChecked(checked) {
    _.set(this.state.data, 'checked', !checked)
    this.setState({ ...this.state }, () => {
      this.props.onChange('dataSeries', 'refresh', this.state.data)
    })
  }

  handleChange(value) {
    _.set(this.state.data, 'value', value)
    this.setState({ ...this.state }, () => {
      this.props.onChange('dataSeries', 'refresh', this.state.data)
    })
  }

  handleChangeSelect(option) {
    _.set(this.state.data, 'unit', option.value)
    this.setState({ ...this.state }, () => {
      this.props.onChange('dataSeries', 'refresh', this.state.data)
    })
  }

  STYLE_SHEET = {
    selectText: {
      position: 'absolute',
      left: '104px',
      lineHeight: '30px',
      zIndex: 1
    }
  };
}

export default Refresh
