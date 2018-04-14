import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash';
import Input from 'react-bootstrap-myui/lib/Input';
import Select from 'react-bootstrap-myui/lib/Select';
import NumberInput from '../../../../../components/NumberInput';

class DisplayItem extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)

    this.state = {
      data: _.cloneDeep(props.configInfo.displayItem)
    }
  }

  componentWillReceiveProps(nextProps) {
    const preConfigInfo = this.props.configInfo
    const { configInfo } = nextProps

    if (preConfigInfo && configInfo && !_.isEqual(preConfigInfo.displayItem, configInfo.displayItem)) {
      this.setState({
        data: _.cloneDeep(configInfo.displayItem)
      })
    }
  }

  render() {
    const { checked, value, type } = this.state.data

    return <div>
      <div className="title">
        显示维度条目数
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
              <Select
                value={type}
                maxHeight={160}
                width={'100%'}
                openSearch={false}
                onSelected={this.handleChangeSelect.bind(this)}
              >
                <option value="前">前</option>
                <option value="后">后</option>
              </Select>
            </div>
            <div className="col-md-6" style={{ height: '30px' }}>
              <NumberInput
                changeOnBlur={true}
                debounce={true}
                minValue={0}
                maxValue={1500}
                step={1}
                name="value"
                value={value}
                onChange={this.handleChange.bind(this)}
              />
            </div>
          </div>
        </div>
      }
    </div>
  }

  hanldeChecked(checked) {
    _.set(this.state.data, 'checked', !checked)
    this.setState({ ...this.state }, () => {
      this.props.onChange('dataSeries', 'displayItem', this.state.data)
    })
  }

  handleChange(value) {
    _.set(this.state.data, 'value', value)
    this.setState({ ...this.state }, () => {
      this.props.onChange('dataSeries', 'displayItem', this.state.data)
    })
  }

  handleChangeSelect(option) {
    _.set(this.state.data, 'type', option.value)
    this.setState({ ...this.state }, () => {
      this.props.onChange('dataSeries', 'displayItem', this.state.data)
    })
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

export default DisplayItem
