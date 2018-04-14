import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import $ from 'jquery'

import { Connect, Utils } from 'dmp-chart-sdk'
import './table.less'

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
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (item[key] == null) {
        item[key] = '-'
      }
    })
  })

  const { dims, nums, numsDisplayFormat, dimsReportRedirect, numsReportRedirect } = _dataProcess(data, indicators);

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
    dimsReportRedirect,
    numsReportRedirect,
    data: _data,
    displayFormat: numsDisplayFormat,
    dim_total: Object.keys(dims).length,
    value_total: Object.keys(nums).length
  }
}

const _parseFontStyle = function (fontStyle) {
  return {
    fontStyle: fontStyle.fontStyle || 'normal',
    fontWeight: fontStyle.fontWeight || 'normal',
    textDecoration: fontStyle.textDecoration || 'none'
  }
}

class Table extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }
  static propTypes = {
    designTime: PropTypes.bool,
    through: PropTypes.bool,
    data: PropTypes.object,
    config: PropTypes.object,
    events: PropTypes.object,
    layer: PropTypes.object,
    scale: PropTypes.number,
    dashboardName: PropTypes.string,
    editable: PropTypes.bool,
    platform: PropTypes.string
  }

  constructor(props) {
    super(props)
    const { data, indicators } = props.data || {}
    this.state = {
      data: _transformTableData(data, indicators),
      tableUuid: new Date().getTime()
    }
  }

  componentDidMount() {
    const { config } = this.props
    if (config) {
      this._scrollUp(config)
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
    const { config, data } = this.props
    if (nextProps.config && nextProps.config.global && !_.isEqual(config.global.scroll, nextProps.config.global.scroll)) {
      this._scrollUp(nextProps.config)
    }

    if (!_.isEqual(data, nextProps.data)) {
      this.setState({
        tableUuid: new Date().getTime(),
        data: _transformTableData(nextProps.data.data, nextProps.data.indicators)
      })
    }
  }

  componentDidUpdate(prevProps) {
    // 数据更新时回到顶部
    if (!_.isEqual(this.props.data, prevProps.data) && this._scrollBody) {
      $(this._scrollBody).scrollTop(0);
    }
  }

  componentWillUnmout() {
    clearInterval(this.interval)
  }

  render() {
    const { data, tableUuid } = this.state
    return (
      <div className="graph-inner-box">
        <div className="table-view-wrap">
          <table className="data-view-table tbody-scroll"
            key={tableUuid}
            onMouseEnter={this._toggleAutoScroll.bind(this, false)}
            onMouseLeave={this._toggleAutoScroll.bind(this, true)}
          >
            {data && data.data && data.data.length > 0 && this.renderTableHeader()}
            {data && data.data && data.data.length > 0 && this.renderTableBodys()}
          </table>
        </div>
      </div>
    );
  }

  renderTableHeader() {
    const { config } = this.props
    const { indexCol } = config
    const { data } = this.state

    let thead = []
    Object.keys(data.data[0]).forEach((item, i) => {
      const key = `${item}_${i}`
      const style = this._getHeaderStyle(config, i)
      thead.push(<th style={style} key={key}>{item.substr(1)}</th>)
    })

    // 序号列
    if (indexCol && indexCol.show) {
      thead = [<th key="-1" style={this._getHeaderStyle(config, -1)}>{indexCol.header}</th>].concat(thead)
    }

    return <thead><div className="mock-table"><tr>{thead}</tr></div></thead>
  }

  // 需要控制固定行数
  renderTableBodys() {
    const config = this.props.config || {}
    const { global } = config
    const { scroll } = global || {}
    let tableHeaderShow = true
    if (config.tableHeader) {
      tableHeaderShow = config.tableHeader.show
    }
    const borderWidth = this._getBorderWidth()
    const rows = this._genarateRows()
    const borderStyle = this._getBorderStyle()
    const borderBottom = {
      borderBottomColor: borderStyle.borderColor,
      borderBottomWidth: borderStyle.borderWidth,
      borderBottomStyle: borderStyle.borderStyle
    }
    const scrollBodyStyle = {}
    let row0 = []
    let row1 = rows
    if (scroll && scroll.checked) {
      row0 = rows.splice(0, scroll.ln)
      row1 = rows
      // 不然手动滚动
      scrollBodyStyle.overflowY = 'hidden'
      scrollBodyStyle.marginRight = '0'
    }
    row1.push(<tr key="tr_border_bottom" className="mock-border-bottom" style={borderBottom}></tr>)
    const tableStyle = {
      marginTop: `-${tableHeaderShow ? borderWidth : 0}px`
    }
    return [
      <tbody key="tbody_0"><div className="mock-table" style={tableStyle}>{row0}</div></tbody>,
      <tbody key="tbody_1" ref={(node) => { this._scrollBody = node }} style={scrollBodyStyle}><div className="mock-table" style={tableStyle}>{row1}</div></tbody>
    ]
  }
  //跳转页面
  handleReportRedirect(config, col_value, rowObj) {
    const { protocol, host } = window.location
    const colValues = {}
    const filterIds = []
    //callback新增 isHref 是否直接跳转标识
    const callback = (url, isHref) => {
      if (isHref && url) {
        if (config.direct_way === 2) {
          window.open(url, '_blank')
        } else {
          window.location.href = url
        }
      } else if (config.direct_way === 2 && url) {
        window.open(`${protocol}//${host}${url}`, '_blank')
      } else if (url && config.direct_way === 1) {
        if (this.props.platform === 'mobile') {
          this.context.router.push(url)
        } else {
          this.context.router.replace(url)
        }
      }
    }
    if (config.related_dims && config.related_dims.length > 0) {
      config.related_dims.forEach((dim) => {
        const key = `_${dim.chart_alias}`
        const value = rowObj[key]
        if (value) {
          colValues[dim.dashboard_filter_id] = value
          filterIds.push(dim.dashboard_filter_id)
        }
      })
      config.dashboard_filter_id = filterIds
      Utils.generateReportRedirectUrl(config, colValues, this.props.dashboardName, callback)
    } else {
      Utils.generateReportRedirectUrl(config, col_value, this.props.dashboardName, callback)
    }
  }
  handleThrough(item, e) {
    e.stopPropagation()
    const { through, events } = this.props
    if (through) {
      events.onPenetrateQuery('table', item)
    }
  }

  _scrollUp(config) {
    clearInterval(this.interval)

    const scrollBody = this._scrollBody

    const mode = _.at(config, 'global.scroll.scrollMode.mode')[0] || 'page'
    const rows = _.at(config, 'global.scroll.scrollMode.rows')[0] || 1

    let curIndex = -1

    const animate = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollBody
      // 如果到底部相差5个像素 我们认为已经到底部了
      if (Math.abs(scrollTop + clientHeight - scrollHeight) > 5) {
        const trs = $(scrollBody).find('tr:not(.mock-border-bottom)')
        const trsLen = trs.length
        if (trsLen < 2) {
          return
        }
        let trOffset = 0
        if (trs[0]) {
          trOffset = scrollBody.offsetTop - trs[0].offsetTop
        }
        let toTop = 0
        // 按行滚动
        if (mode === 'row') {
          //计算当前的index
          if (curIndex === -1) {
            for (let i = 0; i < trsLen - 1; i++) {
              const top0 = trs[i].offsetTop - scrollBody.offsetTop + trOffset
              const top1 = trs[i + 1].offsetTop - scrollBody.offsetTop + trOffset
              if (top0 <= scrollTop && top1 > scrollTop) {
                curIndex = i
                break
              }
            }
          }
          let nextIndex = curIndex + rows
          if (nextIndex >= trsLen - 1) {
            nextIndex = 0
          }
          toTop = trs[nextIndex].offsetTop - scrollBody.offsetTop + trOffset
          curIndex = nextIndex
          // 按页滚动
        } else {
          toTop = scrollTop + clientHeight
          // 需要滚动后顶部对齐
          for (let i = 1; i < trsLen; i++) {
            const top0 = trs[i - 1].offsetTop - scrollBody.offsetTop + trOffset
            const top1 = trs[i].offsetTop - scrollBody.offsetTop + trOffset
            if (top0 < toTop && top1 >= toTop) {
              toTop = top0
              // 当clientHeight小于一个单元行的时候出现不能滚动的bug
              if (Math.abs(scrollTop - toTop) < 5) {
                // 方案1: 至少滚动一行
                toTop = top1
                // 方案2: 滚动clientHeight
              }
              break
            }
          }
        }
        $(scrollBody).stop().animate({
          scrollTop: Math.ceil(toTop)
        }, 800);
      } else {
        $(scrollBody).stop().animate({
          scrollTop: 0,
        }, 500)
        curIndex = 0
      }
    }

    if (config.global && config.global.scroll && config.global.scroll.checked && +config.global.scroll.interVal > 0) {
      const times = (config.global.scroll.interVal * 1000) + 1000
      this.interval = setInterval(animate, times)
    }
  }

  _getBorderStyle(splitLine) {
    splitLine = splitLine || this.props.config.rows.splitLine
    const style = {}
    if (splitLine.checked) {
      style.borderColor = splitLine.border.borderColor
      style.borderStyle = splitLine.border.borderStyle
      style.borderWidth = `${splitLine.border.borderWidth}px`
    } else {
      style.borderWidth = '0px'
    }
    return style
  }

  _getBorderWidth(splitLine) {
    // 需要解决tr之间水平border没有合并的bug
    splitLine = splitLine || this.props.config.rows.splitLine
    return splitLine.checked ? ((splitLine.border && splitLine.border.borderWidth) || 0) : 0
  }

  _getCellStyle(config, row, col) {
    if (!config) {
      return {}
    }
    // 单元格 前N行设置
    const { cell, qianN } = config.global
    // 行
    const { rows } = config
    // 奇偶
    const { oddEven, splitLine } = rows
    // 列设置
    const { list } = config.cols || {}

    const style = { width: '100%' }
    if (oddEven.checked) {
      style.background = row % 2 === 0 ? oddEven.oddBackgroundColor : oddEven.evenBackgroundColor
    }
    // if (cell.checked) {
    _.extend(style, cell)
    // }
    if (qianN.checked && row < qianN.end) {
      _.extend(style, qianN)
    }
    if (list && list[col]) {
      _.extend(style, list[col].cellTextStyle.checked ? list[col].cellTextStyle : {}, { width: `${list[col].cellOther.cellWidth}%` })
    }

    style.lineHeight += 'px'
    style.fontSize += 'px'

    // 解析fontStyle
    if (style.fontStyle) {
      _.extend(style, _parseFontStyle(style.fontStyle))
    }
    // 边框
    _.extend(style, this._getBorderStyle(splitLine))

    return style
  }

  // 获取序列号的样式
  _getIndexColStyles(index) {
    const { config } = this.props
    const { indexCol, rows } = config
    const { oddEven } = rows
    const { cell, qianN } = config.global
    const cellStyle = {}
    const spanStyle = {}
    if (indexCol && indexCol.show) {
      cellStyle.fontSize = `${indexCol.fontSize}px`
      cellStyle.color = indexCol.color
      cellStyle.width = `${indexCol.colWidth}%`
      spanStyle.height = cell.lineHeight * indexCol.radius / 100
      spanStyle.width = Math.max(spanStyle.height, 1)
      spanStyle.borderRadius = '50%'
      spanStyle.display = 'inline-block'
      spanStyle.whiteSpace = 'nowrap'
      spanStyle.lineHeight = `${spanStyle.width}px`
      spanStyle.textAlign = 'center'
      spanStyle.background = indexCol.background
      _.extend(spanStyle, _parseFontStyle(indexCol.fontStyle))

      // 因为没有背景颜色的设置, 所以序号列的背景颜色需要应用前N行的 和 奇偶的
      if (oddEven.checked) {
        cellStyle.background = index % 2 === 0 ? oddEven.oddBackgroundColor : oddEven.evenBackgroundColor
      }

      if (qianN.checked && index < qianN.end) {
        cellStyle.background = qianN.background
      }
    }
    return { cellStyle, spanStyle }
  }

  _getHeaderStyle(config, col) {
    let style = {}
    if (config) {
      const { list } = config.cols
      const { indexCol } = config
      if (config.rows && config.rows.splitLine.checked) {
        style = {
          ...style,
          borderColor: config.rows.splitLine.border.borderColor,
          borderStyle: config.rows.splitLine.border.borderStyle,
          borderWidth: `${config.rows.splitLine.border.borderWidth}px`,
        }
      }
      if (config.tableHeader && config.tableHeader.show) {
        let width
        if (col === -1) {
          width = `${indexCol.colWidth}%`
        } else {
          width = list && list[col] ? (`${list[col].cellOther.cellWidth}%`) : '100%'
        }
        style = {
          ...style,
          color: config.tableHeader.color,
          fontSize: `${config.tableHeader.fontSize}px`,
          textAlign: config.tableHeader.textAlign,
          background: config.tableHeader.background,
          lineHeight: `${config.tableHeader.lineHeight}px`,
          width,
          ..._parseFontStyle(config.tableHeader.fontStyle)
        }
      } else if (config.tableHeader && !config.tableHeader.show) {
        style = {
          ...style,
          display: 'none'
        }
      }
    }
    return style
  }
  // 计算合并单元格矩阵
  _getRowSpanMatrix() {
    const { data, config } = this.props
    const dataList = this.state.data.data
    const { dims } = data.indicators
    const dimKeys = Object.keys(dataList[0]).slice(0, dims.length)
    const rowSpanMatrix = []
    const dimKeyLen = dimKeys.length

    const { global } = config || {}
    const { scroll } = global || {}
    let fixedRows = 0
    if (scroll && scroll.checked) {
      fixedRows = scroll.ln
    }
    if (dimKeyLen > 0) {
      // 初始化最后一行
      rowSpanMatrix[dataList.length - 1] = dimKeys.map(() => 1)
      // 从底部往上遍历
      for (let i = dataList.length - 2; i >= 0; i--) {
        rowSpanMatrix[i] = []
        const dataObj = dataList[i]
        const nextDataObj = dataList[i + 1]
        for (let j = 0; j < dimKeyLen; j++) {
          rowSpanMatrix[i][j] = 1
          const colName = dimKeys[j]
          if (j === 0) {
            // 合并相同项目, 注意要当是锁定前N行的时候不能合并
            if (dataObj[colName] === nextDataObj[colName] && i !== fixedRows - 1) {
              rowSpanMatrix[i][0] += rowSpanMatrix[i + 1][0]
              rowSpanMatrix[i + 1][0] = 0
            }
          } else {
            // 如果前一项是0(已经合并), 才可以合并下一列
            if (rowSpanMatrix[i + 1][j - 1] === 0 && dataObj[colName] === nextDataObj[colName]) {
              rowSpanMatrix[i][j] += rowSpanMatrix[i + 1][j]
              rowSpanMatrix[i + 1][j] = 0
            }
          }
        }
      }
    }
    return rowSpanMatrix
  }

  // 注意: 遍历的效率很重要
  _genarateRows() {
    const { data } = this.state
    const { through, config, editable } = this.props
    const { displayFormat, dimsReportRedirect, numsReportRedirect, } = data
    const dataList = data.data
    const dimsLength = this.props.data.indicators.dims.length
    let colsConfig = []
    let indexCol = {} // 序号列
    let borderStyle = {}
    let isReportRedirect = false
    let throughData = null
    let isRowSpan = false // 合并同类项
    const rows = []
    if (config) {
      colsConfig = config.cols.list
      indexCol = { ...config.indexCol } // 序号列
      borderStyle = this._getBorderStyle()
      isRowSpan = _.get(config, 'global.cell.rowspan')
    }

    // 合并单元格矩阵
    let rowSpanMatrix = []
    if (isRowSpan) {
      rowSpanMatrix = this._getRowSpanMatrix()
    }
    const dataKeys = Object.keys(dataList[0])
    for (let i = 0; i < dataList.length; i++) {
      const dataObj = dataList[i]
      let tds = []
      dataKeys.forEach((col, j) => {
        let td_throughHandler = null
        const dataItem = dataObj[col]
        //数值或维度跳转
        const reportRedirectConfig = dimsReportRedirect[col] || numsReportRedirect[col]
        const hasReportRedirect = reportRedirectConfig && reportRedirectConfig.isOpen
        if (hasReportRedirect) {
          isReportRedirect = true
        }
        const text = dataItem === null ? '-' : dataItem
        const style = this._getCellStyle(config, i, j)
        const colConfig = colsConfig[j]
        const content = (colConfig && colConfig.cellOther && colConfig.cellOther.contentType === '图片') ?
          <div className="image-container" style={{ height: style.lineHeight }}><div className="image-wrapper"><img src={text} style={{ width: `${colConfig.cellOther.imageWidth}%` }} /></div></div> :
          Utils.formatDisplay(text, displayFormat[col])
        //只有第一列可以穿透
        if (j === 0) {
          throughData = dataItem
          td_throughHandler = through ? this.handleThrough.bind(this, dataItem) : null
        }
        //如果存在报告跳转设置且不在itemDetail编辑页 则可以跳转（跳转优先级高于穿透）
        const td_eventHandler = (!editable && hasReportRedirect) ? this.handleReportRedirect.bind(this, reportRedirectConfig, dataItem, dataObj) : null
        let rowSpan = 1
        // 只合并维度
        if (isRowSpan && j < dimsLength) {
          rowSpan = rowSpanMatrix[i][j]
        }
        if (rowSpan > 0) {
          tds.push(<td
            key={`td_${i}_${j}`}
            style={style}
            rowSpan={rowSpan}
            className={(!editable && hasReportRedirect) || (through && j === 0 && !hasReportRedirect) ? 'link' : ''}
            onClick={hasReportRedirect ? td_eventHandler : td_throughHandler}
          >
            {rowSpan > 1 ? <div className="flex-container">{content}</div> : content}
          </td>)
        }
      })
      // 显示序号列
      if (indexCol.show) {
        const indexColStyles = this._getIndexColStyles(i)
        tds = [
          <td key={`td_${i}_-1`} style={{ ...indexColStyles.cellStyle, ...borderStyle }}>
            <span style={indexColStyles.spanStyle}>
              <span style={{ marginLeft: '-1000%', marginRight: '-1000%' }}>{i + 1}</span>
            </span>
          </td>
        ].concat(tds)
      }

      // tds[1].props.children += 'hhh'

      const tr_class = !isReportRedirect && through ? 'link' : ''
      const tr_throughHandler = !isReportRedirect && through ? this.handleThrough.bind(this, throughData) : null
      rows[i] = <tr key={`tr_${i}`} className={tr_class} onClick={tr_throughHandler}>
        {tds}
      </tr>
    }

    return rows
  }

  _toggleAutoScroll(start) {
    if (start) {
      this._scrollUp(this.props.config)
    } else {
      clearInterval(this.interval)
    }
  }
}

export default Connect()(Table)

