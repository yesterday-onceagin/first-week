import PropTypes from 'prop-types';
import React from 'react'

import './diagram-alignment-config.less'

const getSelectedLayout = (layout, selectedDiagrams) => {
  const selectedLayout = []
  for (let i = 0; i < layout.length; i++) {
    selectedDiagrams.forEach((item) => {
      if (item.id === layout[i].i) {
        // 注意, 这里需要返回引用, 不要重新构造
        selectedLayout.push(layout[i])
      }
    })
  }
  return selectedLayout
}

// 获取选中单图的上下左右的位置, center=true: 获取每个图的中心边界
const statisticSelectedLayout = (layout, center) => {
  let l = Infinity,
    t = Infinity,
    r = -Infinity,
    b = -Infinity
  layout.forEach((item) => {
    l = center ? Math.min(parseFloat(item.x) + parseFloat(item.w) / 2, l) : Math.min(item.x, l)
    t = center ? Math.min(parseFloat(item.y) + parseFloat(item.h) / 2, t) : Math.min(item.y, t)
    r = center ? Math.max(parseFloat(item.x) + parseFloat(item.w) / 2, r) : Math.max(parseFloat(item.x) + parseFloat(item.w), r)
    b = center ? Math.max(parseFloat(item.y) + parseFloat(item.h) / 2, b) : Math.max(parseFloat(item.y) + parseFloat(item.h), b)
  })
  return {
    l,
    t,
    r,
    b
  }
}

class DiagramsAlignmentConfig extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    designInfo: PropTypes.object,
    selectedDiagrams: PropTypes.array,
    gridLayout: PropTypes.array,
    onUpdateLayout: PropTypes.func,
  }

  static defaultProps = {
    show: false,
  }

  constructor(props) {
    super(props)
    this.state = {
      configGroupShow: {
        alignment: true
      }
    }
  }

  render() {
    const { show } = this.props
    return (<div className="diagram-design-panel" style={{ display: show ? 'block' : 'none' }}>
      <div className="diagram-design-config-group">
        {this.renderAligmentOptions()}
      </div>
    </div>)
  }

  renderAligmentOptions() {
    const { configGroupShow } = this.state
    const { alignment } = configGroupShow
    return (<div>
      {this.generatorGroupTitleOptions('排列布局', 'alignment')}
      <div className="config-section" style={{ height: `${alignment ? 100 : 0}px`, padding: alignment ? '' : 0 }}>
        <div className="config-section-item clearfix">
          <span className="brick-label">对齐</span>
          <ul className="alignment bricks border clearfix">
            <li onClick={this.handleSetAlign.bind(this, 'top')} title="顶对齐"><span className="icon-layer dingbuduiqi"></span></li>
            <li onClick={this.handleSetAlign.bind(this, 'vMiddle')} title="垂直居中对齐"><span className="icon-layer chuizhijuzhongduiqi"></span></li>
            <li onClick={this.handleSetAlign.bind(this, 'bottom')} title="底对齐"><span className="icon-layer diduiqi"></span></li>
            <li onClick={this.handleSetAlign.bind(this, 'left')} title="左对齐"><span className="icon-layer zuoduiqi"></span></li>
            <li onClick={this.handleSetAlign.bind(this, 'hMiddle')} title="水平居中对齐"><span className="icon-layer shuipingjuzhongduiqi"></span></li>
            <li onClick={this.handleSetAlign.bind(this, 'right')} title="右对齐"><span className="icon-layer youduiqi"></span></li>
          </ul>
        </div>
        <div className="config-section-item clearfix">
          <span className="brick-label">分布</span>
          <ul className="position bricks border clearfix">
            <li onClick={this.handleSetPosition.bind(this, 'xAverage')} title="水平平均分布"><span className="icon-layer shuipingjuzhong"></span></li>
            <li onClick={this.handleSetPosition.bind(this, 'yAverage')} title="垂直平均分布"><span className="icon-layer chuizhijuzhong"></span></li>
          </ul>
        </div>
      </div>
    </div>)
  }

  generatorGroupTitleOptions(title, field) {
    const { configGroupShow } = this.state
    return (<div style={this.STYLE_SHEET.title} className="diagram-design-config-title" onClick={this.handleToggleShow.bind(this, field)}>
      <i className="spread-icon dmpicon-arrow-down" style={{
        ...this.STYLE_SHEET.spreadIcon,
        transform: !configGroupShow[field] ? 'scale(0.75) translateY(-50%)' : 'scale(0.75) translateY(-50%) rotateZ(180deg)'
      }} />
      {title}
    </div>)
  }

  handleToggleShow(field) {
    const { configGroupShow } = this.state
    configGroupShow[field] = !configGroupShow[field]
    this.setState({
      configGroupShow
    })
  }
  // 对齐
  handleSetAlign(type) {
    const { onUpdateLayout } = this.props
    const newLayout = this._getAlignedLayout(type)
    onUpdateLayout(newLayout)
  }
  // 分布
  handleSetPosition(type) {
    const { onUpdateLayout } = this.props
    const newLayout = this._getPositionedLayout(type)
    onUpdateLayout(newLayout)
  }
  // 对齐
  _getAlignedLayout(type) {
    const { gridLayout, selectedDiagrams } = this.props
    const selectedLayout = getSelectedLayout(gridLayout, selectedDiagrams)
    // 计算上下左右的边界值
    const { l, t, r, b } = statisticSelectedLayout(selectedLayout)
    selectedLayout.forEach((layout) => {
      if (type === 'top') {
        layout.y = t
      } else if (type === 'right') {
        layout.x = r - layout.w
      } else if (type === 'bottom') {
        layout.y = b - layout.h
      } else if (type === 'left') {
        layout.x = l
      } else if (type === 'vMiddle') { //垂直居中
        layout.y = (t + b) / 2 - layout.h / 2
      } else if (type === 'hMiddle') { //水平居中
        layout.x = (l + r) / 2 - layout.w / 2
      }
    })
    const newLayout = gridLayout.concat([])
    return newLayout
  }
  // 分布
  _getPositionedLayout(type) {
    const { gridLayout, selectedDiagrams } = this.props
    let selectedLayout = getSelectedLayout(gridLayout, selectedDiagrams)
    const { l, t, r, b } = statisticSelectedLayout(selectedLayout, true)
    const len = selectedLayout.length

    if (type === 'xAverage') {
      const xStep = (r - l) / (len - 1)
      // 按中心x排序
      selectedLayout = selectedLayout.sort((a, b) => (a.x + a.w / 2) - (b.x + b.w / 2))
      for (let i = 1; i < len - 1; i++) {
        selectedLayout[i].x = (l + i * xStep) - selectedLayout[i].w / 2
      }
    }

    if (type === 'yAverage') {
      const yStep = (b - t) / (len - 1)
      // 按中心y排序
      selectedLayout = selectedLayout.sort((a, b) => (a.y + a.h / 2) - (b.y + b.h / 2))
      for (let i = 1; i < len - 1; i++) {
        selectedLayout[i].y = (t + i * yStep) - selectedLayout[i].h / 2
      }
    }

    return gridLayout.concat([])
  }

  STYLE_SHEET = {
    title: {
      position: 'relative',
      paddingLeft: '27px',
      height: '30px',
      lineHeight: '29px',
      fontSize: '14px',
      cursor: 'pointer',
      borderBottomStyle: 'solid',
      borderBottomWidth: '1px'
    },
    spreadIcon: {
      right: 'initial',
      left: '9px',
      transition: 'transform .3s'
    },
  }
}

export default DiagramsAlignmentConfig
