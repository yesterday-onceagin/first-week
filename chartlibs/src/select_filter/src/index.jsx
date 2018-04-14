import React from 'react'
import PropTypes from 'prop-types'
import Select from 'react-bootstrap-myui/lib/Select'
import _ from 'lodash'

import { Connect } from 'dmp-chart-sdk'
import './style.less'

// 转换Table数据
const _transformSelectData = (data, indicators, conditions) => {
  const dataWithAlias = {}
  const dims_name = []
  //临时key
  const selector_key = []
  const selector_value = {}
  //生成selector_key
  indicators.dims.forEach((item) => {
    const alias = item.alias || item.alias_name || item.col_name
    dims_name.push(alias)
    selector_key.push(item.col_name)
    //根据维度的rank给keys排序
  })
  //缓存选中对象
  if (conditions && conditions.length > 0) {
    conditions.forEach((item) => {
      selector_value[item.col_name] = (item.col_value !== '') ? JSON.parse(item.col_value) : undefined
    })
  }

  //把别名加入放到placeholder
  Object.assign(dataWithAlias, {
    dataList: data,
    dims: indicators.dims,
    dim_name: dims_name,
    selector_key,
    selector_value
  });
  return dataWithAlias
}

class IndicatorSelect extends React.Component {
  static propTypes = {
    designTime: PropTypes.bool,    // 设计时(编辑区)
    data: PropTypes.object,        // 数据集返回的数据
    config: PropTypes.object,      // 样式配置数据
    events: PropTypes.object,      // 可触发的事件
    layer: PropTypes.object,       // 组件在编辑区的图层信息
    scale: PropTypes.number,       // 组件在编辑区的缩放比例
    chartId: PropTypes.string,     // 单图id
  }

  constructor(props) {
    super(props)
    const { data, indicators, conditions } = props.data || {}
    this.state = {
      ..._transformSelectData(data, indicators, conditions)
    }
  }

  shouldComponentUpdate(nextProps) {
    const { scale, layer } = this.props
    if (nextProps.scale !== scale || !_.isEqual(nextProps.layer, layer)) {
      return false
    }
    return true
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        ..._transformSelectData(nextProps.data.data, nextProps.data.indicators, nextProps.data.conditions)
      })
    }
  }

  render() {
    const { selector_key, dataList, dim_name, selector_value, dims } = this.state

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
    const { selector_value, selector_key, dataList, dims } = this.state
    const { events, chartId, designTime } = this.props
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
      //在编辑状态下需要触发级联请求
      events.onFilterChange && events.onFilterChange(conditions, chartId, 'select_filter', dataList, isSubmit, designTime)
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

export default Connect()(IndicatorSelect)
