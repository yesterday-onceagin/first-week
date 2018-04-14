import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import { Connect, Utils } from 'dmp-chart-sdk'
import './style.less'

const { DataUtils } = Utils

// 转换数据
const _dataProcess = (data, indicators) => {
  const numsData = DataUtils.pluckNumsData(data, indicators)
  const { nums, primaryNum } = numsData
  const toArr = nums && primaryNum ? nums[primaryNum] : []
  const to = toArr.length > 0 ? toArr[0] : 0
  return { ...numsData, to }
}

// 获取flex水平对齐样式
const _getFlexAlignStyle = (key) => {
  switch (key) {
    case 'left':
      return 'flex-start';
    case 'right':
      return 'flex-end';
    default:
      return 'center'
  }
}

class NumericalValue extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  static propTypes = {
    designTime: PropTypes.bool,    // 设计时(编辑区)
    data: PropTypes.object,        // 数据集返回的数据
    config: PropTypes.object,      // 样式配置数据
    events: PropTypes.object,      // 可触发的事件
    layer: PropTypes.object,       // 组件在编辑区的图层信息
    scale: PropTypes.number,       // 组件在编辑区的缩放比例
    chartId: PropTypes.string,     // 组件id
    platform: PropTypes.string,    // 平台类型 pc or mobile
    dashboardName: PropTypes.string
  }

  constructor(props) {
    super(props)
    const { data, indicators } = props.data || {}
    const { to, primaryNum, numsDisplayFormat, numsReportRedirect } = _dataProcess(data, indicators)
    this.state = {
      styleObj: this._getStyle(props.config),
      isInit: true,   //用来表示是否是第一次加载
      delay: 10,      //interval时延
      speed: 600,    //切换速度
      counter: 0,     //用来做真正的值显示
      from: 0,
      to: typeof to === 'number' ? to : 0,
      name: primaryNum,
      df: numsDisplayFormat,
      dr: numsReportRedirect
    }
    this.start = this.start.bind(this)
    this.clear = this.clear.bind(this)
    this.next = this.next.bind(this)
  }

  componentDidMount() {
    const { config } = this.props
    if (config && config.global.scroll) this.start()
  }

  componentWillUnmount() {
    const { config } = this.props
    if (config && config.global.scroll) this.clear()
  }

  componentWillReceiveProps(nextProps) {
    const { config } = nextProps
    const thisLayoutOptions = this.props.config
    const { data, indicators } = nextProps.data
    const { to, primaryNum, numsDisplayFormat, numsReportRedirect } = _dataProcess(data, indicators)
    if (!_.isEqual(thisLayoutOptions, nextProps.config)) {
      this.setState({
        styleObj: this._getStyle(nextProps.config)
      })
    }
    //2种情况重新开始翻牌
    if (!_.get(thisLayoutOptions, 'global.scroll') && _.get(config, 'global.scroll')) {
      if (to !== this.state.to) {
        //重设from-to值
        this.setState(preState => ({
          from: preState.to,
          to: typeof to === 'number' ? to : 0
        }), () => this.start())
      } else {
        this.setState({
          from: 0,
          to: typeof to === 'number' ? to : 0
        }, () => this.start())
      }
    }
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState(preState => ({
        from: preState.to,
        to: typeof to === 'number' ? to : 0,
        name: primaryNum,
        df: numsDisplayFormat,
        dr: numsReportRedirect
      }), () => _.get(config, 'global.scroll') && this.start())
    }
  }

  render() {
    const { chartId, config } = this.props
    const { styleObj, dr, name } = this.state

    const { value, suffixValue } = this._getValueAndSuffix()

    let prefixValue = ''
    if (config.numberPrefix && config.numberPrefix.content) {
      prefixValue = config.numberPrefix.content
    }
    // 组装number数字
    const valueContent = (
      <span className="number-value-content" style={styleObj.numberValue}>
        {
          value.toString().split('').map((letter, index) => (
            <span className="number-value-letter"
              key={`${chartId}-number-letter-${index}`}
              style={/[.,]/.test(letter) ? styleObj.dotStyle : styleObj.numberLetter}
            >
              {letter}
            </span>
          ))
        }
        <div style={{ clear: 'both' }}/>
      </span>
    )
    // 组装前缀
    const prefixContent = prefixValue ? (
      <span className="number-value-prefix" style={styleObj.numberPrefix}>
        {prefixValue}
      </span>
    ) : null
    // 组装后缀
    const suffixContent = suffixValue ? (
      <span className="number-value-suffix" style={styleObj.numberSuffix}>
        {suffixValue}
      </span>
    ) : null

    return (
      <div className="graph-inner-box">
        <div className="number-value-wrap" style={styleObj.whole}>
          {this.renderNumberValue(prefixContent, valueContent, suffixContent, dr[name])}
        </div>
      </div>
    )
  }

  // 开始翻牌
  start() {
    this.clear()
    const { from } = this.state
    this.setState({
      counter: from,
    }, () => {
      const { delay, speed, to, counter } = this.state
      this.loopsCounter = 0
      this.loops = Math.ceil(speed / delay)
      this.increment = (to - counter) / this.loops
      this.interval = setInterval(this.next.bind(this), delay)
    })
  }

  //清空翻牌状态
  clear() {
    clearInterval(this.interval)
  }

  next() {
    if (this.loopsCounter < this.loops) {
      this.loopsCounter++;
      this.setState(({ counter }) => ({
        counter: (+counter) + this.increment,
      }));
    } else {
      //清空interval并且设置展示值
      this.clear()
      this.setState({
        counter: this.state.to,
      }, () => {
        this._getValueAndSuffix()
      })
    }
  }

  // 渲染numbervalue-inner
  renderNumberValue(prefixContent, valueContent, suffixContent, reportObj) {
    const { config, chartId, designTime } = this.props
    const { styleObj, name } = this.state
    const hasTitle = name
    const showTitle = config.title && config.title.show
    const hasReportRedirect = !!reportObj
    // 如果标题在左 返回
    if (styleObj.whole && styleObj.whole.type === 'left') {
      return (
        <div className="number-value-inner-wrap" style={{ cursor: !designTime && hasReportRedirect ? 'pointer' : 'default' }} onClick={this.handleRedirect.bind(this, reportObj)}>
          <div className="title">
            {
              hasTitle && showTitle && (
                <span style={{ ...styleObj.title, paddingRight: '5px', float: 'left' }}>
                  {`${name}：`}
                </span>
              )
            }
            {prefixContent}
            {valueContent}
            {suffixContent}
          </div>
        </div>
      )
    }

    // 插入固定内容
    const content = [(
      <div className="value" key={`number-value-content-${chartId}`} style={styleObj.numberValueAlign}>
        {prefixContent}
        {valueContent}
        {suffixContent}
      </div>
    )]

    // 如果有标题 并且需要显示
    if (hasTitle && showTitle) {
      const titleContent = (
        <div className="title" style={styleObj.title} key={`number-value-title-${chartId}`}>
          {name}
        </div>
      )
      // 根据标题的上下组装内容
      if (styleObj.whole && styleObj.whole.type === 'bottom') {
        content.push(titleContent)
      } else {
        content.unshift(titleContent)
      }
    }

    return (
      <div className="number-value-inner-wrap" style={{ cursor: !designTime && hasReportRedirect ? 'pointer' : 'default' }} onClick={this.handleRedirect.bind(this, reportObj)}>
        {content}
      </div>
    )
  }

  handleRedirect(config) {
    const { protocol, host } = window.location
    //如果config不为null
    //callback新增 isHref 是否直接跳转标识
    if (config && !this.props.designTime) {
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
      Utils.generateReportRedirectUrl(config, '', this.props.dashboardName, callback)
    }
  }

  // 获取值和后缀
  _getValueAndSuffix() {
    const { config } = this.props
    const { counter, to, df, name } = this.state
    let dF = null
    let value = ''
    let suffixValue = ''

    //如果设置了翻牌器 没有insertValue就取counter
    dF = df[name]
    if (config.global.scroll) {
      if (dF && dF.display_mode === 'percentage') {
        value = counter
      } else {
        //为了处理dF不存在特殊导入数据情况
        value = dF ? counter.toFixed(dF.fixed_decimal_places) : counter.toFixed(0)
      }
    } else {
      value = to
    }
    if (dF) {
      const unit = dF.unit === '无' ? '' : dF.unit
      value = Utils.formatDisplay(value, dF, false)
      suffixValue = (unit + dF.column_unit_name) || ''
    
      if (dF.display_mode === 'percentage') {
        suffixValue = ''
      }
    }

    if (!config.numberSuffix || !config.numberSuffix.show) {
      suffixValue = ''
    }

    return {
      value,
      suffixValue
    }
  }

  _getStyle(layoutOptions) {
    layoutOptions = layoutOptions || this.props.config

    const style = {
      whole: {
        type: 'top',
        padding: '5px',
        cursor: 'default',
        alignItems: 'center'
      }
    }

    if (layoutOptions) {
      if (layoutOptions.title) {
        const fontStyleObj = layoutOptions.title.fontStyle || {}
        style.title = {
          textAlign: layoutOptions.title.textAlign,
          color: layoutOptions.title.color,
          fontSize: `${layoutOptions.title.fontSize}px`,
          lineHeight: `${layoutOptions.title.lineHeight}px`,
          textDecoration: fontStyleObj.textDecoration,
          fontWeight: fontStyleObj.fontWeight,
          fontStyle: fontStyleObj.fontStyle,
        }
      }

      if (layoutOptions.global) {
        style.whole = {
          ...style.whole,
          alignItems: _getFlexAlignStyle(layoutOptions.global.align),
          type: layoutOptions.global.position
        }
      }

      if (layoutOptions.numberValue) {
        const fontStyleObj = layoutOptions.numberValue.fontStyle || {}
        // 有背景色的之后根据字号加上一些内边距 让背景色块左右不会紧贴着数字
        const letterPadding = !layoutOptions.numberValue.background || layoutOptions.numberValue.background === 'transparent' ? 0 : Math.max(layoutOptions.numberValue.fontSize / 12, 2)
        style.numberValue = {
          color: layoutOptions.numberValue.color,
          fontSize: `${layoutOptions.numberValue.fontSize}px`,
          lineHeight: `${layoutOptions.numberValue.lineHeight}px`
        }
        style.numberValueAlign = {
          textAlign: layoutOptions.numberValue.textAlign
        }
        style.numberLetter = {
          textDecoration: fontStyleObj.textDecoration,
          fontWeight: fontStyleObj.fontWeight,
          fontStyle: fontStyleObj.fontStyle,
          padding: `0 ${letterPadding}px`,
          margin: `0 ${layoutOptions.numberValue.margin ? (layoutOptions.numberValue.margin / 2) : 0}px`,
          background: layoutOptions.numberValue.background,
          borderRadius: `${layoutOptions.numberValue.borderRadius}px`,
          transition: '2s'
        }
        style.dotStyle = {
          fontWeight: fontStyleObj.fontWeight,
          fontStyle: fontStyleObj.fontStyle,
        }
      }

      const background = style.numberLetter ? style.numberLetter.background : 'transparent'
      const borderRadius = style.numberLetter ? style.numberLetter.borderRadius : 2

      if (layoutOptions.numberPrefix) {
        const letterPadding = Math.max(layoutOptions.numberPrefix.fontSize / 12, 2)
        style.numberPrefix = {
          padding: `0 ${letterPadding}px`,
          color: layoutOptions.numberPrefix.color,
          fontSize: `${layoutOptions.numberPrefix.fontSize}px`,
          lineHeight: `${layoutOptions.numberPrefix.lineHeight}px`,
          background,
          borderRadius
        }
      }

      if (layoutOptions.numberSuffix) {
        const fontStyleObj = layoutOptions.numberSuffix.fontStyle || {}
        const letterPadding = Math.max(layoutOptions.numberSuffix.fontSize / 12, 2)
        style.numberSuffix = {
          padding: `0 ${letterPadding}px`,
          color: layoutOptions.numberSuffix.color,
          fontSize: `${layoutOptions.numberSuffix.fontSize}px`,
          lineHeight: `${layoutOptions.numberSuffix.lineHeight}px`,
          textDecoration: fontStyleObj.textDecoration,
          fontWeight: fontStyleObj.fontWeight,
          fontStyle: fontStyleObj.fontStyle,
          background,
          borderRadius
        }
      }
    }
    return style
  }

  DOT_STYLE = {
    lineHeight: 1,
    verticalAlign: 'bottom'
  }
}

export default Connect()(NumericalValue)
