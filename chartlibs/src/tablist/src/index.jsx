/**
 * Tab列表组件
 */
import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import { Connect } from '@views/dataview/components/DmpChartDev'

import './tablist.less'

class Tablist extends React.Component {
  static propTypes = {
    // 是否为设计时
    designTime: PropTypes.bool,

    // 数据源
    data: PropTypes.object,

    // 配置项
    config: PropTypes.object,

    // 可用事件
    events: PropTypes.object,

    // 组件图层位置尺寸等信息
    layer: PropTypes.object,
    chartId: PropTypes.string
  }

  constructor(props) {
    super(props)
    this.hoverTabs = {}
    this.waitPlayTabIndex = []

    const nextState = this.fillStateByProps(props)
    this.state = {
      activeTabIndex: 0,
      ...nextState
    }
  }

  componentDidMount() {
    const { activeTabIndex, play, tabs } = this.state
    this.emitLinkEvent(activeTabIndex)
    if (play && play.isLoop) {
      const nextTabIndex = (activeTabIndex + 1) > (tabs.length - 1) ? 0 : (activeTabIndex + 1)
      this.nextPlay(nextTabIndex)
    }
  }

  componentWillReceiveProps(nextProps) {
    const nextStates = this.fillStateByProps(nextProps)
    this.setState({
      ...nextStates
    })
  }

  render() {
    const { tabs, layout } = this.state
    const className = classnames(
      'chart-tablist',
      { [`chart-tablist-${layout}`]: true }
    )

    return (
      <nav className={className}>
        <ul>
          {
            tabs && tabs.map((tab, index) => <li key={index} style={this._formatTabWrapStyles(index)} onClick={this.onClickTab.bind(this, index)}>
              <div
                ref={(node) => { this.hoverTabs[index] = node }}
                className="inner" style={this._formatTabInnerStyles(index)}
                onMouseOver={this.onMouseOverTab.bind(this, index)}
                onMouseOut={this.onMouseOutTab.bind(this, index)}>
                <span>{tab}</span>
              </div>
            </li>)
          }
        </ul>
      </nav>
    )
  }

  // props数据赋值于state
  fillStateByProps = (props) => {
    const { globalStyle, labelConfig } = props.config || {}

    // 获取维度数据
    const { data, indicators } = props.data
    const tabs = data && data.map((tab) => {
      let dimName = indicators && indicators.dims && indicators.dims[0] && indicators.dims[0].col_name
      const tabKeys = Object.keys(tab)
      dimName = tabKeys.find(key => key.indexOf(dimName) > -1)
      return dimName && tab[dimName]
    })

    if (globalStyle && globalStyle.isShowAll) {
      tabs.unshift('全部')
    }

    return {
      tabs: tabs || [],

      // 是否显示全部Tab
      isShowAll: (globalStyle && globalStyle.isShowAll) || false,

      // 轮播设置
      play: {
        isLoop: (globalStyle && globalStyle.play && globalStyle.play.isLoop) || false,
        duration: (globalStyle && globalStyle.play && globalStyle.play.duration) || 10
      },

      // 排列布局
      layout: (globalStyle && globalStyle.layout) || 'horizontal', //horizontal, vertical

      // tab样式
      styles: {
        color: (labelConfig && labelConfig.color) || '#C7E0FF',
        activeColor: (labelConfig && labelConfig.activeColor) || '#3267A7',
        backgroundColor: (labelConfig && labelConfig.backgroundColor) || '#3267A7',
        activeBackgroundColor: (labelConfig && labelConfig.activeBackgroundColor) || '#458EE7',
        hoverBackgroundColor: (labelConfig && labelConfig.hoverBackgroundColor) || '#458EE7',
        fontSize: (labelConfig && labelConfig.fontSize) || 14,
        fontWeight: (labelConfig && labelConfig.fontStyle && labelConfig.fontStyle.fontWeight) || 'normal',
        fontStyle: (labelConfig && labelConfig.fontStyle && labelConfig.fontStyle.fontStyle) || 'normal',
        textDecoration: (labelConfig && labelConfig.fontStyle && labelConfig.fontStyle.textDecoration) || 'none',
        textAlign: (labelConfig && labelConfig.textAlign) || 'center',
        borderRadius: labelConfig && labelConfig.borderRadius >= 0 ? labelConfig.borderRadius : 6,
        space: labelConfig && labelConfig.space >= 0 ? labelConfig.space : 6
      }
    }
  }

  // 计算tab容器样式
  _formatTabWrapStyles(index) {
    const { layer } = this.props
    const { tabs, layout, styles } = this.state
    const formatStyles = {}

    const tablen = tabs.length
    if (layer && layout === 'horizontal') {
      formatStyles.width = tabs ? `${(layer.w - ((tablen - 1) * (styles.space))) / tablen}px` : 0
      if (index !== 0) {
        formatStyles.marginLeft = `${styles.space / 2}px`
      }

      if (index !== tablen - 1) {
        formatStyles.marginRight = `${styles.space / 2}px`
      }
    } else if (layer && layout === 'vertical') {
      formatStyles.height = tabs ? `${(layer.h - ((tablen - 1) * (styles.space))) / tablen}px` : 0
      if (index !== 0) {
        formatStyles.marginTop = `${styles.space / 2}px`
      }

      if (index !== tablen - 1) {
        formatStyles.marginBottom = `${styles.space / 2}px`
      }
    }

    return formatStyles
  }

  // 计算tab内容区域样式
  _formatTabInnerStyles(index) {
    const { activeTabIndex, styles } = this.state
    const formatStyles = {
      ...styles,
      color: activeTabIndex === index ? styles.activeColor : styles.color,
      cursor: activeTabIndex === index ? 'default' : 'pointer',
      backgroundColor: activeTabIndex === index ? styles.activeBackgroundColor : styles.backgroundColor,
      justifyContent: styles.textAlign === 'left' ? 'flex-start' : (styles.textAlign === 'right' ? 'flex-end' : 'center')
    }
    return formatStyles
  }

  onMouseOverTab = (index) => {
    const { activeTabIndex, styles } = this.state
    if (activeTabIndex !== index) {
      this.hoverTabs[index].style.backgroundColor = styles && styles.hoverBackgroundColor
    }
  }

  onMouseOutTab = (index) => {
    const { activeTabIndex, styles } = this.state
    this.hoverTabs[index].style.backgroundColor = activeTabIndex === index ? styles.activeBackgroundColor : styles.backgroundColor
  }

  // 触发联动事件
  emitLinkEvent = (tabIndex) => {
    const { chartId } = this.props
    const { indicators } = this.props.data
    const { tabs, isShowAll } = this.state

    const isAllTab = isShowAll && tabIndex === 0
    const dim = indicators && indicators.dims && indicators.dims[0]

    let conditions = []
    if (!isAllTab) {
      const filterKeys = [tabs[tabIndex]]
      conditions = [{
        col_name: dim.col_name,
        field_name: dim.col_name,
        field_id: dim.dim || dim.id,
        col_value: JSON.stringify(filterKeys),
        operator: 'in'
      }]
    }

    const { events } = this.props
    if (events && events.onFilterChange && !this.props.designTime) {
      events.onFilterChange(conditions, chartId)
    }
  }

  // 播放下一个Tab
  nextPlay = (tabIndex) => {
    const _this = this

    if (this.playing) {
      this.waitPlayTabIndex.push(tabIndex)
      return;
    }

    const { play, tabs } = this.state
    const duration = (play && play.duration && (play.duration * 1000)) || 0

    this.playing = true
    setTimeout(() => {
      _this.emitLinkEvent(tabIndex)
      _this.playing = false
      this.setState({
        activeTabIndex: tabIndex
      })

      if (this.waitPlayTabIndex.length > 0) {
        _this.nextPlay(this.waitPlayTabIndex.shift())
      } else if (play && play.isLoop) {
        const nextTabIndex = (tabIndex + 1) > (tabs.length - 1) ? 0 : (tabIndex + 1)
        _this.nextPlay(nextTabIndex)
      }
    }, duration)
  }

  // 切换Tab
  onClickTab = (index) => {
    this.emitLinkEvent(index)
    this.setState({
      activeTabIndex: index
    })

    const { play, tabs } = this.state
    if (play && play.isLoop) {
      const nextTabIndex = (index + 1) > (tabs.length - 1) ? 0 : (index + 1)
      this.nextPlay(nextTabIndex)
    }
  }
}

export default Connect()(Tablist)
