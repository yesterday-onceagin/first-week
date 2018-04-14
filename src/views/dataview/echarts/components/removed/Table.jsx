import React from 'react';
import PropTypes from 'prop-types'
import _ from 'lodash'

import { formatDisplay } from '../../utils/generateDisplayFormat';
import pxSuffix from '@helpers/pxSuffix'
import './table.less';

const _parseFontStyle = function (fontStyle) {
  const fontStyleArr = fontStyle.split(',')
  return {
    fontStyle: fontStyleArr.indexOf('italic') > -1 ? 'italic' : 'normal',
    fontWeight: fontStyleArr.indexOf('bold') > -1 ? 'bold' : 'normal',
    textDecoration: fontStyleArr.indexOf('underline') > -1 ? 'underline' : 'none'
  }
}

class Table extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    layoutOptions: PropTypes.object,
    scaleRate: PropTypes.number,
    through: PropTypes.bool,
    events: PropTypes.shape({
      onSort: PropTypes.func,
      onChartChange: PropTypes.func,
      onThrough: PropTypes.func
    }),
    id: PropTypes.string,
    dataGrid: PropTypes.object
  };

  constructor(props) {
    super(props)
    this.state = {
      data: props.data,
      tableUuid: props.id + new Date().getTime()
    }
  }

  componentDidMount() {
    const { layoutOptions } = this.props
    if (layoutOptions) {
      this._scrollUp(layoutOptions)
    }
  }

  shouldComponentUpdate(nextProps) {
    const { scaleRate, dataGrid } = this.props
    if (
      nextProps.scaleRate !== scaleRate ||
      !_.isEqual(nextProps.dataGrid, dataGrid)
    ) {
      return false
    }
    return true
  }

  componentWillReceiveProps(nextProps) {
    const { layoutOptions, data } = this.props
    if (nextProps.layoutOptions && !_.isEqual(layoutOptions, nextProps.layoutOptions)) {
      this._scrollUp(nextProps.layoutOptions)
    }

    if (!_.isEqual(data, nextProps.data)) {
      this.setState({
        tableUuid: nextProps.id + new Date().getTime(),
        data: nextProps.data
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
    const { layoutOptions } = this.props
    const { indexCol } = layoutOptions
    const { data } = this.state
    let thead = []

    Object.keys(data.data[0]).forEach((item, i) => {
      const key = `${item}_${i}`
      const style = this._getHeaderStyle(layoutOptions, i)

      thead.push(<th style={style} key={key}>{item.substr(1)}</th>)
    })
    // 序号列
    if (indexCol && indexCol.show) {
      thead = [<th key="-1" style={this._getHeaderStyle(layoutOptions, -1)}>{indexCol.header}</th>].concat(thead)
    }

    return <thead><tr>{thead}</tr></thead>
  }
  // 需要控制固定行数
  renderTableBodys() {
    const { layoutOptions, id } = this.props
    const { scroll } = layoutOptions.global
    const rows = this._genarateRows()
    const borderStyle = this._getBorderStyle()
    const borderBottom = {
      borderBottomColor: borderStyle.borderColor,
      borderBottomWidth: borderStyle.borderWidth,
      borderBottomStyle: borderStyle.borderStyle,
      // bottom: borderStyle.borderWidth,
    }
    const scrollBodyStyle = {}
    let row0 = []
    let row1 = rows
    if (scroll.checked) {
      row0 = rows.splice(0, scroll.ln)
      row1 = rows
      // 不然手动滚动
      scrollBodyStyle.overflowY = 'hidden'
      scrollBodyStyle.marginRight = '0'
    }
    row1.push(<tr key={`${id}-border_bottom`} className="mock-border-bottom" style={borderBottom}></tr>)
    return [
      <tbody key="tbody_0">{row0}</tbody>,
      <tbody key="tbody_1" ref={(node) => { this._scrollBody = node }} style={scrollBodyStyle}>{row1}</tbody>
    ]
  }

  handleThrough(item) {
    if (this.props.through) {
      this.props.events.onThrough('table', item)
    }
  }

  _scrollUp(layoutExtend) {
    clearInterval(this.interval)

    const scrollBody = this._scrollBody

    const animate = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollBody
      if (scrollTop + clientHeight < scrollHeight) {
        const trs = $(scrollBody).children()
        const trsLen = trs.length
        let toTop = scrollTop + clientHeight
        // 需要滚动后顶部对齐
        for (let i = 1; i < trsLen; i++) {
          const top0 = trs[i - 1].offsetTop - scrollBody.offsetTop
          const top1 = trs[i].offsetTop - scrollBody.offsetTop
          if (top0 < toTop && top1 >= toTop) {
            toTop = top0
            break
          }
        }
        $(scrollBody).stop().animate({
          scrollTop: toTop
        }, 1000);
      } else {
        $(scrollBody).stop().animate({
          scrollTop: 0,
        }, 500)
      }
    }

    if (layoutExtend.global && layoutExtend.global.scroll && layoutExtend.global.scroll.checked && +layoutExtend.global.scroll.interVal > 0) {
      const times = (layoutExtend.global.scroll.interVal * 1000) + 1000
      this.interval = setInterval(animate, times)
    }
  }

  _getBorderStyle(splitLine) {
    splitLine = splitLine || this.props.layoutOptions.rows.splitLine
    const style = {}
    if (splitLine.checked) {
      style.borderColor = splitLine.color
      style.borderStyle = splitLine.style
      style.borderWidth = `${splitLine.width}px`
    } else {
      style.borderWidth = '0px'
    }
    return style
  }

  _getBorderWidth(splitLine) {
    // 需要解决 tr 之间 水平 border 没有合并的bug
    splitLine = splitLine || this.props.layoutOptions.rows.splitLine
    return splitLine.checked ? (splitLine.width || 0) : 0
  }

  _getCellStyle(layoutExtend, row, col) {
    if (!layoutExtend) {
      return {}
    }
    // 单元格 前N行设置
    const { cell, qianN } = layoutExtend.global
    // 行
    const { rows } = layoutExtend
    // 奇偶
    const { oddEven, splitLine } = rows
    // 列设置
    const { list } = layoutExtend.cols

    const style = { width: '100%' }
    if (oddEven.checked) {
      style.background = row % 2 === 0 ? oddEven.oddBackgroundColor : oddEven.evenBackgroundColor
    }
    if (cell.checked) {
      _.extend(style, cell)
    }
    if (qianN.checked && row < qianN.end) {
      _.extend(style, qianN)
    }
    if (list[col]) {
      _.extend(style, list[col].styleChecked ? list[col] : {}, { width: `${list[col].colWidth}%` })
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
    const { layoutOptions } = this.props
    const { indexCol, rows } = layoutOptions
    const { oddEven } = rows
    const { cell, qianN } = layoutOptions.global
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

  _getHeaderStyle(layoutExtend, col) {
    let style = {}
    if (layoutExtend) {
      const { list } = layoutExtend.cols
      const { indexCol } = layoutExtend
      if (layoutExtend.rows && layoutExtend.rows.splitLine.checked) {
        style = {
          ...style,
          borderColor: layoutExtend.rows.splitLine.color,
          borderStyle: layoutExtend.rows.splitLine.style,
          borderWidth: pxSuffix(layoutExtend.rows.splitLine.width),
        }
      }
      if (layoutExtend.tableHeader && layoutExtend.tableHeader.show) {
        let width
        if (col === -1) {
          width = `${indexCol.colWidth}%`
        } else {
          width = list[col] ? (`${list[col].colWidth}%`) : '100%'
        }
        style = {
          ...style,
          color: layoutExtend.tableHeader.color,
          fontSize: pxSuffix(layoutExtend.tableHeader.fontSize),
          textAlign: layoutExtend.tableHeader.textAlign,
          background: layoutExtend.tableHeader.background,
          lineHeight: `${layoutExtend.tableHeader.lineHeight}px`,
          width,
          ..._parseFontStyle(layoutExtend.tableHeader.fontStyle)
        }
      } else if (layoutExtend.tableHeader && !layoutExtend.tableHeader.show) {
        style = {
          ...style,
          display: 'none'
        }
      }
    }
    return style
  }
  // 注意: 遍历的效率很重要
  _genarateRows() {
    const { data } = this.state
    const { through, layoutOptions, id } = this.props
    const { displayFormat } = data
    const dataList = data.data
    const borderWidth = this._getBorderWidth()
    let colsConfig = []
    let indexCol = {} // 序号列
    let borderStyle = {}
    let tableHeaderShow = true
    const rows = []

    if (layoutOptions) {
      colsConfig = layoutOptions.cols.list
      indexCol = layoutOptions.indexCol // 序号列
      borderStyle = this._getBorderStyle()
      tableHeaderShow = layoutOptions.tableHeader.show
    }

    const dataKeys = Object.keys(dataList[0])

    for (let i = 0; i < dataList.length; i++) {
      const dataObj = dataList[i]
      let throughData = null
      let tds = dataKeys.map((col, j) => {
        const dataItem = dataObj[col]
        const text = dataItem === null ? '-' : dataItem
        const style = this._getCellStyle(layoutOptions, i, j)
        const colConfig = colsConfig[j]
        const content = (colConfig && colConfig.type === 'image') ?
          <div className="image-container" style={{ height: style.lineHeight }}><div className="image-wrapper"><img src={text} style={{ width: `${colConfig.imageWidth}%` }} /></div></div> :
          formatDisplay(text, displayFormat[col])

        if (j === 0) {
          throughData = dataItem
        }

        return <td
          key={`${id}_${i}_${j}`}
          style={style}
          className={through && j === 0 ? 'link' : ''}
        >
          {content}
        </td>
      })
      // 显示序号列
      if (indexCol.show) {
        const indexColStyles = this._getIndexColStyles(i)
        tds = [
          <td key={`${id}_${i}_-1`} style={{ ...indexColStyles.cellStyle, ...borderStyle }}>
            <span style={indexColStyles.spanStyle}>
              <span style={{ marginLeft: '-1000%', marginRight: '-1000%' }}>{i + 1}</span>
            </span>
          </td>
        ].concat(tds)
      }

      const tr_style = { marginTop: `-${!tableHeaderShow && i === 0 ? 0 : borderWidth}px` }
      const tr_class = through ? 'link' : ''
      const tr_eventHandler = through ? this.handleThrough.bind(this, throughData) : null

      rows[i] = <tr key={`${id}_${i}`} style={tr_style} onClick={tr_eventHandler} className={tr_class}>
        {tds}
      </tr>
    }

    return rows
  }

  _toggleAutoScroll(start) {
    if (start) {
      this._scrollUp(this.props.layoutOptions)
    } else {
      clearInterval(this.interval)
    }
  }
}

export default Table;
