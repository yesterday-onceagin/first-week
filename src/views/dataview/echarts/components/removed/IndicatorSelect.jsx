import React from 'react'
import PropTypes from 'prop-types'
import Select from 'react-bootstrap-myui/lib/Select';
import isEqual from 'lodash/isEqual';
import _ from 'lodash';
import './indicator-select.less';

class IndicatorSelect extends React.Component {
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
      selector_value: props.data.selector_value ? props.data.selector_value : {},  //当前存储下拉框value值的对象
      selector_key: props.data.selector_key ? props.data.selector_key : [],
      dim_name: props.data.dims_name ? props.data.dims_name : [], //别名列表用作placeholder
      dataList: props.data.dataList ? props.data.dataList : [] //数据列表
    }
  }

  componentWillReceiveProps(nextProps) {
    const { data } = this.props
    if (!isEqual(data, nextProps.data)) {
      //给state重新赋值
      this.setState({
        dim_name: nextProps.data.dims_name,
        selector_value: nextProps.data.selector_value,
        selector_key: nextProps.data.selector_key,
        dataList: nextProps.data.dataList
      })
    }
  }

  render() {
    const { selector_key, dataList, dim_name, selector_value } = this.state
    const { data } = this.props
    const { dims } = data

    return <div className="graph-inner-box">
      <div className="indicator-select-wrap">
        <div className="indicator-select-inner-wrap">
          {selector_key && selector_key.length > 0 && selector_key.map((key, index) => {
            let selectKey = key
            //2017-08-04新增判断，防止维度切换时dims为[]
            if (dims[index]) {
              selectKey = dims[index].formula_mode ? `${dims[index].formula_mode}_${key}` : key
            }
            const value = selector_value[key] ? selector_value[key] : undefined
            return (
              <div className="selector-container" key={index}>
                {Array.isArray(dataList[0][key]) && <div>
                  <Select
                    placeholder={dim_name[index]}
                    value={value}
                    openSearch
                    showMultipleBar={false}
                    type="multiple"
                    hasIcon
                    onClear={value && value.length > 0 ? this.handleClear.bind(this, key) : null}
                    style={{ width: '100%' }}
                    maxHeight={180}
                    onSelected={this.handleSelect.bind(this, key)}
                  >
                    {dataList[0][key].map((item, i) => {
                      //避免key为空的情况
                      if (item[selectKey] === undefined || item[selectKey] === '') {
                        item[selectKey] = '-'
                      }
                      return <option value={item[selectKey]} key={i}>{item[selectKey]}</option>
                    })}
                  </Select>
                </div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  }

  _handleFieldChange(fields, value) {
    const { selector_value, selector_key, dataList } = this.state
    const { select_mode, data, events, id, editable } = this.props
    const { dims } = data
    //拼接当前的dataList(需要缓存,因为后台不返回) 与 conditions
    const conditions = []
    //根据fields的index 把之后的dataList清空
    const _index = _.findIndex(dims, dim => dim.col_name === fields)
    //是否触发selectChange
    let isSubmit = true
    //设置当前下拉key的value值
    selector_value[fields] = value || undefined

    dims.forEach((item, index) => {
      if (index > _index) {
        selector_value[item.col_name] = undefined
        dataList[0][item.col_name] = []
      }
    })

    selector_key.forEach((key) => {
      //加入当前dim作为参数
      const currentDim = _.find(dims, dim => dim.col_name === key)
      //2017-09-27 避免报错
      if (!currentDim.dim) {
        currentDim.dim = currentDim.id
      }
      if (selector_value[key] && selector_value[key].length > 0) {
        conditions.push({
          col_name: key,
          field_name: key,
          field_id: currentDim.dim || currentDim.id,
          col_value: JSON.stringify(selector_value[key]),
          operator: 'in',
          dim: currentDim
        })
      }
    })
    //是否提交
    if (dims.length < 2 || (dims.length >= 2 && _index === (dims.length - 1))) {
      isSubmit = false
    }
    //如果维度大于1把当前dataList传出,以便做merge
    this.setState({
      selector_value,
      dataList
    }, () => {
      if ((isSubmit || select_mode === 'show') && events.onSelectorChange) {
        //在编辑状态下需要触发级联请求
        events.onSelectorChange(conditions, id, 'select_filter', dataList, isSubmit, editable)
      }
    })
  }

  handleSelect(fields, option) {
    const values = option.map(item => item.value)
    this._handleFieldChange(fields, values)
  }

  handleClear(fields) {
    this._handleFieldChange(fields, [])
  }
}

export default IndicatorSelect
