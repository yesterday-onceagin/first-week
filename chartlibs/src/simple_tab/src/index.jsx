import React from 'react'
import PropTypes from 'prop-types'

import { Connect } from 'dmp-chart-sdk'

import classnames from 'classnames'
import _ from 'lodash'

import { DEFAULT_TABS_ARRAY } from './constant'

import './index.less'

const _getJustifyValue = (v) => {
  if (v === 'left') {
    return 'flex-start'
  } else if (v === 'right') {
    return 'flex-end'
  }
  return 'center'
}

class SimpleTab extends React.PureComponent {
  static propTypes = {
    // id
    chartId: PropTypes.string,
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
    // 该单图是否显示（因tab隐藏/显示）
    isHidden: PropTypes.bool
  }

  constructor(props) {
    super(props)
    this.hoverTabs = {}
    this.playing = false
    this.playTimer = null
    this.waitPlayTabIndex = []
    const { config, data, isHidden } = props;
    this.isHidden = isHidden
    this.state = {
      uuid: new Date().getTime(),
      activeTabIndex: data ? (data.active || 0) : 0,
      itemStyle: this._getItemStyle(config),
      activeItemStyle: this._getActiveItemStyle(config),
      hoverItemStyle: this._getHoverItemStyle(config),
      playOption: this._getAutoPlayOption(config),
      tabArray: this._getTabsData(config)
    }
  }

  componentDidMount() {
    const { isHidden } = this.props
    const { activeTabIndex, playOption, tabArray } = this.state
    const { isLoop } = playOption
    this.isHidden = isHidden
    if (isLoop && !this.isHidden) {
      const nextTabIndex = (activeTabIndex + 1) > (tabArray.length - 1) ? 0 : (activeTabIndex + 1)
      this._nextPlay(nextTabIndex)
    }
  }

  componentWillReceiveProps(nextProps) {
    const { config, isHidden } = nextProps
    const thisConfig = this.props.config
    const { playOption, activeTabIndex, tabArray } = this.state
    const globalStyleChanged = !_.isEqual(_.get(config, 'globalStyle'), _.get(thisConfig, 'globalStyle'))
    const labelConfigChanged = !_.isEqual(_.get(config, 'labelConfig'), _.get(thisConfig, 'labelConfig'))
    this.isHidden = isHidden
    // 显示是否发生变化
    const hiddenChanged = this.isHidden !== this.props.isHidden
    if (globalStyleChanged || labelConfigChanged) {
      const newState = {
        uuid: new Date().getTime(),
        itemStyle: this._getItemStyle(config),
        activeItemStyle: this._getActiveItemStyle(config),
        hoverItemStyle: this._getHoverItemStyle(config)
      }
      // 如果是标签改变 处理tabArray的更新
      if (labelConfigChanged) {
        newState.tabArray = this._getTabsData(config)
      }
      // 如果是全局样式改变 处理playOption的更新
      if (globalStyleChanged) {
        newState.playOption = this._getAutoPlayOption(config)
        if (!playOption.isLoop && newState.playOption.isLoop) {
          const currTabArray = newState.tabArray || tabArray
          const nextTabIndex = (activeTabIndex + 1) > (currTabArray.length - 1) ? 0 : (activeTabIndex + 1)
          this._restartAutoPlay(nextTabIndex)
        } else if (playOption.isLoop && !newState.playOption.isLoop) {
          this._stopAutoPlay()
        }
      }
      this.setState({
        ...newState
      })
    } else if (hiddenChanged) {
      const nextTabIndex = (activeTabIndex + 1) > (tabArray.length - 1) ? 0 : (activeTabIndex + 1)
      this._restartAutoPlay(nextTabIndex)
    }
  }

  componentWillUnmout() {
    // 停止自动播放
    this._stopAutoPlay()
  }

  render() {
    const { config, layer } = this.props;
    const { activeTabIndex, itemStyle, activeItemStyle, uuid, tabArray } = this.state;

    const chartId = _.get(layer, 'i')
    const isVertical = _.get(config, 'globalStyle.layout') === 'vertical'

    const ulClass = classnames({
      vertical: isVertical
    })

    return (
      <div className="chart-simple-tab">
        <ul className={ulClass}>
          {
            tabArray.map((item, index) => {
              const isActive = activeTabIndex === index
              const isLast = index === tabArray.length - 1
              const liClass = classnames({
                active: isActive
              })
              const _style = Object.assign({}, itemStyle, isActive ? activeItemStyle : {}, isLast ? { margin: 0 } : {})
              return (
                <li
                  ref={(node) => { this.hoverTabs[index] = node }}
                  key={`chart-simple-tab-item-${chartId}-${index}-${uuid}`}
                  className={liClass}
                  style={_style}
                  onMouseEnter={this.handleMouseEnterTab.bind(this, index)}
                  onMouseLeave={this.handleMouseLeaveTab.bind(this, index)}
                  onClick={this.handleChangeTabActive.bind(this, index)}
                >
                  {item.name}
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  }

  // 切换激活的tab
  handleChangeTabActive(index) {
    const { events, chartId } = this.props;
    const { playOption, tabArray } = this.state;
    this.setState({
      activeTabIndex: index
    })
    events && events.onChangeTab && events.onChangeTab({
      id: chartId,
      active: index
    })

    if (playOption.isLoop) {
      const nextTabIndex = (index + 1) > (tabArray.length - 1) ? 0 : (index + 1)
      this._restartAutoPlay(nextTabIndex)
    }
  }

  // 鼠标悬浮上tab
  handleMouseEnterTab(index) {
    const { hoverItemStyle } = this.state
    this.hoverTabs[index].style.backgroundColor = hoverItemStyle.backgroundColor
  }

  // 鼠标离开tab
  handleMouseLeaveTab(index) {
    const { activeTabIndex, itemStyle, activeItemStyle } = this.state
    const isActive = activeTabIndex === index
    if (isActive) {
      this.hoverTabs[index].style.backgroundColor = activeItemStyle.backgroundColor
      this.hoverTabs[index].style.color = activeItemStyle.color
    } else {
      this.hoverTabs[index].style.backgroundColor = itemStyle.backgroundColor
      this.hoverTabs[index].style.color = itemStyle.color
    }
  }

  // 重新开始自动轮播
  _restartAutoPlay(nextTabIndex) {
    clearTimeout(this.playTimer)
    this.playing = false
    this.nextTabIndex = [nextTabIndex]
    this._nextPlay(nextTabIndex)
  }

  // 停止自动播放
  _stopAutoPlay() {
    clearTimeout(this.playTimer)
    this.playing = false
    this.nextTabIndex = []
  }

  // 播放下一个Tab
  _nextPlay(tabIndex) {
    const _this = this

    if (this.playing) {
      this.waitPlayTabIndex.push(tabIndex)
      return;
    }
    const { playOption, tabArray } = this.state
    const { duration, isLoop } = playOption

    if (this.isHidden) {
      this._stopAutoPlay()
      return;
    }
    this.playing = true
    clearTimeout(this.playTimer)
    this.playTimer = setTimeout(() => {
      _this.playing = false
      this.handleChangeTabActive(tabIndex)

      if (this.waitPlayTabIndex.length > 0) {
        _this._nextPlay(this.waitPlayTabIndex.shift())
      } else if (isLoop) {
        const nextTabIndex = (tabIndex + 1) > (tabArray.length - 1) ? 0 : (tabIndex + 1)
        _this._nextPlay(nextTabIndex)
      }
    }, duration * 1000)
  }

  // 获取tab配置数组信息
  _getTabsData(config) {
    return _.get(config || this.props.config, 'labelConfig.tabConfig.tabs', DEFAULT_TABS_ARRAY)
  }

  // 获取tab样式
  _getItemStyle(config) {
    const isVertical = _.get(config, 'globalStyle.layout') === 'vertical'
    return {
      backgroundColor: _.get(config, 'labelConfig.backgroundColor', '#3267A7'),
      color: _.get(config, 'labelConfig.color', '#C7E0FF'),
      fontSize: `${_.get(config, 'labelConfig.fontSize', 14)}px`,
      borderRadius: `${_.get(config, 'labelConfig.borderRadius', 6)}px`,
      marginRight: isVertical ? 0 : `${_.get(config, 'labelConfig.space', 6)}px`,
      marginBottom: isVertical ? `${_.get(config, 'labelConfig.space', 6)}px` : 0,
      fontWeight: _.get(config, 'labelConfig.fontStyle.fontWeight', 'normal'),
      fontStyle: _.get(config, 'labelConfig.fontStyle.fontStyle', 'normal'),
      textDecoration: _.get(config, 'labelConfig.fontStyle.textDecoration', 'none'),
      justifyContent: _getJustifyValue(_.get(config, 'labelConfig.textAlign', 'center'))
    }
  }

  // 获取tab激活样式
  _getActiveItemStyle(config) {
    return {
      backgroundColor: _.get(config, 'labelConfig.activeBackgroundColor', '#458EE7'),
      color: _.get(config, 'labelConfig.activeColor', '#3267A7')
    }
  }

  // 获取tab悬浮样式
  _getHoverItemStyle(config) {
    return {
      backgroundColor: _.get(config, 'labelConfig.hoverBackgroundColor', '#458EE7')
    }
  }

  // 获取自动播放的配置
  _getAutoPlayOption(config) {
    const duration = _.get(config, 'globalStyle.play.duration', 0)
    const isLoop = _.get(config, 'globalStyle.play.isLoop', false)
    return {
      duration,
      isLoop: duration ? isLoop : false
    }
  }
}

export default Connect()(SimpleTab)
