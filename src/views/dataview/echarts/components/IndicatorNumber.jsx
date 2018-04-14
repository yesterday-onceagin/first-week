/* 数值区间筛选*/
import React from 'react'
import PropTypes from 'prop-types'
import fmtNumber from '../../utils/fmtNumber';
import Slider from 'rc-slider';

import './indicator-number.less';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

const { createSliderWithTooltip } = Slider;
const Range = createSliderWithTooltip(Slider.Range);

class IndicatorNumber extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    defaultValue: PropTypes.string,
    id: PropTypes.string,
    events: {
      onNumberChange: PropTypes.func
    },
    editable: PropTypes.bool
  }
  constructor(props) {
    super(props)
    //获取key
    const selectKey = props.data.dataList[0] ? Object.keys(props.data.dataList[0])[0] : ''
    const { dataList } = props.data
    const minKey = `min_${selectKey}`
    const maxKey = `max_${selectKey}`

    let minValue = dataList[0][selectKey][0] ? Math.ceil(parseFloat(dataList[0][selectKey][0][minKey])) : 0
    let maxValue = dataList[0][selectKey][0] ? Math.ceil(parseFloat(dataList[0][selectKey][0][maxKey])) : 0

    if (Number.isNaN(minValue)) minValue = 0
    if (Number.isNaN(maxValue)) maxValue = 0

    let value = dataList[0] ? [minValue, maxValue] : []
    //如果存在默认值
    if (props.defaultValue && props.defaultValue.length > 0) {
      const valueArr = props.defaultValue ? props.defaultValue.split(',') : []
      value = [parseFloat(valueArr[0]), parseFloat(valueArr[1])]
    }

    this.state = {
      id: new Date().getTime(),
      dim: props.data.dim ? props.data.dim : {}, //别名列表用作placeholder
      isValid: true,
      timeout: {},
      selectKey, //获取数据的key
      minValue,
      maxValue,
      value
    }
  }

  render() {
    const { id, dim, minValue, maxValue, value } = this.state
    const { data } = this.props
    const format = dim && dim.format ? dim.format : ''
    const alias = dim ? (dim.alias || dim.alias_name || dim.col_name) : undefined
    const isEqual = (minValue === maxValue) || maxValue < minValue
    //选值后的marks
    const marks = { [value[0]]: ((value[0] > 1000 || value[0] < -1000) ? fmtNumber(value[0]) : value[0]), [value[1]]: ((value[1] > 1000 || value[1] < -1000) ? fmtNumber(value[1]) : value[1]) }

    const isValid = data && data.dim && data.dim.data_type === '数值'

    return (
      <div className="graph-inner-box">
        <div className="indicator-number-wrap">
          <div className="indicator-number-inner-wrap">
            {!isEqual && isValid && <div>
              <div style={{ marginRight: '15px' }}>
                <label>{alias}</label>
              </div>
              <div className="fl" style={{ minWidth: `${(!isEqual ? 200 : 0)}px`, marginTop: '4px' }}>
                <Range
                  marks={marks}
                  id={`slider-${id}`}
                  value={value}
                  min={minValue}
                  max={maxValue}
                  tipFormatter={values => `${(values > 1000 || values < -1000) ? fmtNumber(values) : values}${format}`}
                  onChange={this.handleChange.bind(this)}
                />
              </div>
            </div>}

            {!isEqual && !isValid && <div className="error-tips">请选择度量(数值类型)作为维度</div>}
            {isEqual && <div className="error-tips">当前数值类型不存在区间</div>}

          </div>
        </div>
      </div>
    );
  }

  handleChange(value) {
    const { dim, timeout } = this.state
    const { id, events, editable } = this.props
    const conditions = []

    this.setState({
      value
    })

    if (timeout[id]) {
      clearTimeout(timeout[id])
    }

    timeout[id] = setTimeout(() => {
      value.forEach((item, i) => {
        conditions.push({
          field_name: dim.col_name,
          field_id: dim.dim || dim.id,
          col_value: item,
          operator: i > 0 ? '<=' : '>='
        })
      })
      if (events.onNumberChange && !editable) {
        events.onNumberChange(conditions, id, 'number_filter')
      }
    }, 500)
  }
}

export default IndicatorNumber;
