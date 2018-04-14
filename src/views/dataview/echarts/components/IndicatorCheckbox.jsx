import React from 'react'
import PropTypes from 'prop-types'
import { Form, ValidatedInput } from '../../../../components/bootstrap-validation';
import _ from 'lodash'

import './indicator-checkbox.less';

class IndicatorCheckbox extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    select_mode: PropTypes.string,
    events: PropTypes.shape({
      onSelectorChange: PropTypes.func
    }),
    id: PropTypes.string,
    editable: PropTypes.bool
  }
  constructor(props) {
    super(props)
    this.state = {
      selector_value: props.data.selector_value,  //当前存储value值的数组
      dim_name: props.data.dim_name ? props.data.dim_name : '', //别名列表用作placeholder
      dataList: props.data.dataList ? props.data.dataList : [], //数据列表
      height: props.wrapperHeight ? props.wrapperHeight : 160 //checkbox-wrapper的高度
    }
  }

  render() {
    let selectKey = ''

    const { dim_name, dataList, selector_value } = this.state
    const { dim } = this.props.data
    
    if (dim) {
      selectKey = dim.formula_mode ? `${dim.formula_mode}_${dim.col_name}` : dim.col_name
    }

    return <div className="graph-inner-box">
      <div className="indicator-checkbox-wrap">
        <div className="indicator-checkbox-inner-wrap">
          <div className="checkbox-wrap" id="checkbox-wrap">
            <label>{dim_name}</label>
            <div className="checkbox-wrapper">
              <Form onValidSubmit={this.handleSubmit}>
                {selectKey && !Array.isArray(dataList[0][selectKey]) && Array.isArray(dataList) && dataList.map((item, i) => {
                  const isSelect = (selector_value.indexOf(item[selectKey]) > -1)
                  const value = item[selectKey] && item[selectKey].toString()
                  return (
                    value ? <ValidatedInput type="checkbox"
                      label={value || '空数据'}
                      key={i}
                      autoComplete="off"
                      name={value || 'empty'}
                      rows="3"
                      checked={isSelect}
                      onChange={this.handleChange.bind(this, item[selectKey], !isSelect)}
                      labelClassName="checkbox-in-form"/> : null
                  )
                })}
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  }
  handleSubmit() {
    
  }
  handleChange(field, value) {
    const { data, id, events, editable } = this.props
    const { selector_value } = this.state
    const conditions = []

    //根据value操作结果集
    if (value && selector_value.indexOf(field) === -1) {
      selector_value.push(field)
    } else {
      _.remove(selector_value, item => item === field)
    }

    if (selector_value.length > 0) {
      conditions.push({
        field_name: data.dim.col_name,
        col_value: JSON.stringify(selector_value),
        operator: 'in',
        field_id: data.dim.dim || data.dim.id
      })
    }

    this.setState({
      ...this.state
    }, () => {
      if (events.onCheckboxChange && !editable) {
        events.onCheckboxChange(conditions, id)
      }
    })
  }
}

IndicatorCheckbox.PropTypes = {
  /**
   * 待注入的数据
   * @type {[type]}
   */
  data: PropTypes.object,
  /**
   * 用作筛选报告
   * @type {[type]}
   */
  events: {
    onCheckboxChange: PropTypes.func
  },
  wrapperHeight: PropTypes.number
}

export default IndicatorCheckbox;
