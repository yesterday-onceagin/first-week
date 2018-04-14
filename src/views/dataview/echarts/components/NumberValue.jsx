import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { formatDisplay } from '../../utils/generateDisplayFormat'
import './number-value.less';

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

class NumberValue extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    layoutOptions: PropTypes.object,
    id: PropTypes.string
  };

  constructor(props) {
    super(props)
    const { data } = props
    this.state = {
      styleObj: this._getStyle(props.layoutOptions),
      isInit: true,   //用来表示是否是第一次加载
      delay: 10,      //interval时延
      speed: 600,    //切换速度
      counter: 0,     //用来做真正的值显示
      from: 0,
      to: data && Array.isArray(data.value) && typeof data.value[0] === 'number' ? data.value[0] : 0
    }
    this.start = this.start.bind(this)
    this.clear = this.clear.bind(this)
    this.next = this.next.bind(this)
    console.log(props.layoutOptions)
  }

  componentDidMount() {
    const { layoutOptions } = this.props
    if (layoutOptions.global.scroll.checked) this.start()
  }

  componentWillUnmount() {
    const { layoutOptions } = this.props
    if (layoutOptions.global.scroll.checked) this.clear()
  }

  componentWillReceiveProps(nextProps) {
    const { data, layoutOptions } = nextProps
    const thisLayoutOptions = this.props.layoutOptions
    
    if (!_.isEqual(thisLayoutOptions, nextProps.layoutOptions)) {
      this.setState({
        styleObj: this._getStyle(nextProps.layoutOptions)
      })
    }
    //如果value变化则重设值并开始翻牌
    if (!_.get(thisLayoutOptions, 'global.scroll.checked') && _.get(layoutOptions, 'global.scroll.checked')) {
      if (Array.isArray(this.props.data.value) && Array.isArray(data.value) && data.value[0] !== this.props.data.value[0]) {
        //重设from-to值
        this.setState({
          from: typeof this.props.data.value[0] === 'number' ? this.props.data.value[0] : 0,
          to: typeof data.value[0] === 'number' ? data.value[0] : 0
        }, () => this.start())
      } else {
        this.setState({
          from: 0,
          to: typeof data.value[0] === 'number' ? data.value[0] : 0
        }, () => this.start())
      }
    }
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        from: typeof this.props.data.value[0] === 'number' ? this.props.data.value[0] : 0,
        to: typeof data.value[0] === 'number' ? data.value[0] : 0
      }, () => _.get(layoutOptions, 'global.scroll.checked') && this.start())
    }
  }
  render() {
    const { id, layoutOptions } = this.props
    const { styleObj } = this.state

    const { value, suffixValue } = this._getValueAndSuffix()

    let prefixValue = ''

    if (layoutOptions.numberPrefix && layoutOptions.numberPrefix.content) {
      prefixValue = layoutOptions.numberPrefix.content
    }

    // 组装number数字
    const valueContent = (
      <span className="number-value-content" style={styleObj.numberValue}>
        {
          value.toString().split('').map((letter, index) => (
            <span className="number-value-letter"
              key={`${id}-number-letter-${index}`}
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
          {this.renderNumberValue(prefixContent, valueContent, suffixContent)}
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
  renderNumberValue(prefixContent, valueContent, suffixContent) {
    const { data, layoutOptions, id } = this.props
    const { styleObj } = this.state
    const hasTitle = data && data.name
    const showTitle = layoutOptions.title && layoutOptions.title.show

    // 如果标题在左 返回
    if (styleObj.whole && styleObj.whole.type === 'left') {
      return (
        <div className="number-value-inner-wrap">
          <div className="title">
            {
              hasTitle && showTitle && (
                <span style={{ ...styleObj.title, paddingRight: '5px', float: 'left' }}>
                  {`${data.name}：`}
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
      <div className="value" key={`number-value-content-${id}`} style={styleObj.numberValueAlign}>
        {prefixContent}
        {valueContent}
        {suffixContent}
      </div>
    )]

    // 如果有标题 并且需要显示
    if (hasTitle && showTitle) {
      const titleContent = (
        <div className="title" style={styleObj.title} key={`number-value-title-${id}`}>
          {data.name}
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
      <div className="number-value-inner-wrap">
        {content}
      </div>
    )
  }

  // 获取值和后缀
  _getValueAndSuffix() {
    const { data, layoutOptions } = this.props
    const { counter, to } = this.state
    const { displayFormat } = data
    let dF = null
    let value = ''
    let suffixValue = ''

    //如果设置了翻牌器 没有insertValue就取counter
    dF = displayFormat[data.name]
    if (layoutOptions.global.scroll.checked) {
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
      value = formatDisplay(value, dF, false)
      suffixValue = (unit + dF.column_unit_name) || ''
    
      if (dF.display_mode === 'percentage') {
        suffixValue = unit || ''
      }
    }

    if (!layoutOptions.numberSuffix || !layoutOptions.numberSuffix.show) {
      suffixValue = ''
    }

    return {
      value,
      suffixValue
    }
  }

  // 根据option转化style
  _getStyle(layoutOptions) {
    layoutOptions = layoutOptions || this.props.layoutOptions

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
        const fontStyleArr = layoutOptions.title.fontStyle ? layoutOptions.title.fontStyle.split(',') : []
        style.title = {
          textAlign: layoutOptions.title.textAlign,
          color: layoutOptions.title.color,
          fontSize: `${layoutOptions.title.fontSize}px`,
          lineHeight: `${layoutOptions.title.lineHeight}px`,
          textDecoration: fontStyleArr.indexOf('underline') > -1 ? 'underline' : 'none',
          fontWeight: fontStyleArr.indexOf('bold') > -1 ? 'bold' : 'normal',
          fontStyle: fontStyleArr.indexOf('italic') > -1 ? 'italic' : 'normal'
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
        const fontStyleArr = layoutOptions.numberValue.fontStyle ? layoutOptions.numberValue.fontStyle.split(',') : []
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
          textDecoration: fontStyleArr.indexOf('underline') > -1 ? 'underline' : 'none',
          fontWeight: fontStyleArr.indexOf('bold') > -1 ? 'bold' : 'normal',
          fontStyle: fontStyleArr.indexOf('italic') > -1 ? 'italic' : 'normal',
          padding: `0 ${letterPadding}px`,
          margin: `0 ${layoutOptions.numberValue.margin ? (layoutOptions.numberValue.margin / 2) : 0}px`,
          background: layoutOptions.numberValue.background,
          borderRadius: `${layoutOptions.numberValue.borderRadius}px`,
          transition: '2s'
        }
        style.dotStyle = {
          fontWeight: fontStyleArr.indexOf('bold') > -1 ? 'bold' : 'normal',
          fontStyle: fontStyleArr.indexOf('italic') > -1 ? 'italic' : 'normal'
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
        const fontStyleArr = layoutOptions.numberSuffix.fontStyle ? layoutOptions.numberSuffix.fontStyle.split(',') : []
        const letterPadding = Math.max(layoutOptions.numberSuffix.fontSize / 12, 2)
        style.numberSuffix = {
          padding: `0 ${letterPadding}px`,
          color: layoutOptions.numberSuffix.color,
          fontSize: `${layoutOptions.numberSuffix.fontSize}px`,
          lineHeight: `${layoutOptions.numberSuffix.lineHeight}px`,
          textDecoration: fontStyleArr.indexOf('underline') > -1 ? 'underline' : 'none',
          fontWeight: fontStyleArr.indexOf('bold') > -1 ? 'bold' : 'normal',
          fontStyle: fontStyleArr.indexOf('italic') > -1 ? 'italic' : 'normal',
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
  };
}

export default NumberValue
