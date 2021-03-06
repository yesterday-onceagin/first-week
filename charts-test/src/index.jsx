import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import echarts from "echarts"

import { Connect, Utils } from 'dmp-chart-sdk'
import './style.less'

const { DataUtils } = Utils

// 转换Table数据
const _dataProcess = (data, indicators) => {
  const dimsData = DataUtils.pluckDimsData(data, indicators, (hookData) => {
    hookData.key = `_${hookData.key}`
    return hookData
  })

  const numsData = DataUtils.pluckNumsData(data, indicators, (hookData, num) => {
    hookData.key = `_${hookData.key}`
    const suffix = dimsData.dims[hookData.key] ? (Utils.OPERATE_OPTION_RESERVE_MAPS[num.formula_mode] ? `(${Utils.OPERATE_OPTION_RESERVE_MAPS[num.formula_mode]})` : '') : ''
    hookData.key += suffix
    return hookData
  })

  return { ...dimsData, ...numsData }
}

const _transformTableData = (data, indicators) => {
  const { dims, nums } = _dataProcess(data, indicators);
  const _data = []

  for (let i = 0; i < data.length; i++) {
    let item = {};
    Object.keys(dims).forEach((dim) => {
      item = {
        ...item,
        [`${dim}`]: dims[dim][i]
      }
    });

    Object.keys(nums).forEach((num) => {
      item = {
        ...item,
        [`${num}`]: nums[num][i]
      }
    });
    _data.push(item)
  }

  return {
    data: _data
  }
}

const _parseFontStyle = function (fontStyle) {
  return {
    fontStyle: fontStyle.fontStyle || 'normal',
    fontWeight: fontStyle.fontWeight || 'normal',
    textDecoration: fontStyle.textDecoration || 'none'
  }
}

//react组件
class Table extends React.Component {

  //指定react的props的类型，用react-native引入的插件prop-types--百度
  //(1:要求属性是指定的javascript类型propTypes.type)
  //(2:要求属性是可渲染的节点:propTypes.node)
  //(3:)4 5 6 7 8 9 10
  //模式：属性:propTypes.array  属性：类型
  //isRequired 必须的

  //实例属性 相当于constructor里面的属性 可以拿出来写
  //静态属性  static关键字 只能用类直接调用的静态属性 Foo.prop=1/static prop=1


  static propTypes = {
    designTime: PropTypes.bool,    // 设计时(编辑区),是否处于设计时状态
    data: PropTypes.object,        // 数据集返回的数据,从数据集选择维度和数值字段后返回的数据
    config: PropTypes.object,      // 样式配置数据,全部样式配置的对象数据
    events: PropTypes.object,      // 可触发的事件,组件内部可调用平台的内置事件
    layer: PropTypes.object,       // 组件在编辑区的图层信息
    scale: PropTypes.number,       // 组件在编辑区的缩放比例
  }

  constructor(props) {
    //props的传入与否 取决与是否需要在constructor中调用props
    super(props)
    const { data, indicators } = props.data || {}
    this.state = {
      data: _transformTableData(data, indicators)
    }

    console.log(props,'props');
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
        data: _transformTableData(nextProps.data.data, nextProps.data.indicators)
      })
    }
  }

  render() {
    const { data } = this.state
    return (
      <div className="graph-inner-box">
        <div className="table-view-wrap">
          <table className="data-view-table">
            {data && data.data && data.data.length > 0 && this.renderTableHeader()}
            {data && data.data && data.data.length > 0 && this.renderTableBodys()}
          </table>
        </div>
      </div>
    );
  }

  renderTableHeader() {
    const { config } = this.props
    const { data } = this.state

    const thead = []
    Object.keys(data.data[0]).forEach((item, i) => {
      const style = this._getHeaderStyle(config, i)
      thead.push(<th style={style} key={`${item}_${i}`}>{item.substr(1)}</th>)
    })

    return <thead><tr>{thead}</tr></thead>
  }

  renderTableBodys() {
    const { data } = this.state
    const dataList = data.data
    const rows = []
    const dataKeys = Object.keys(dataList[0])
    for (let i = 0; i < dataList.length; i++) {
      const dataObj = dataList[i]
      const tds = []
      for (let j = 0; j < dataKeys.length; j++) {
        const col = dataKeys[j]
        const text = dataObj[col]
        tds.push(<td key={`td_${i}_${j}`}>{text}</td>)
      }
      rows[i] = <tr key={`tr_${i}`}>{tds}</tr>
    }

    return (
      <tbody>{rows}</tbody>
    )
  }

  _getHeaderStyle(config) {
    let style = {}
    if (config && config.tableHeader && config.tableHeader.show) {
      style = {
        color: config.tableHeader.color,
        fontSize: `${config.tableHeader.fontSize}px`,
        textAlign: config.tableHeader.textAlign,
        background: config.tableHeader.background,
        lineHeight: `${config.tableHeader.lineHeight}px`,
        ..._parseFontStyle(config.tableHeader.fontStyle)
      }
    } else if (config.tableHeader && !config.tableHeader.show) {
      style = {
        display: 'none'
      }
    }
    return style
  }
}

export default Connect()(Table)
