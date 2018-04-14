import PropTypes from 'prop-types';
import React from 'react';

import { SketchPicker } from 'react-color';

import './color-picker.less';

// 16进制转10进制
const parse16to10 = v => (Number.parseInt(`0x${v}`, 16))

// 将rgb颜色对象转换为字符串
const _encodeColor = color => (!color.a ? 'transparent' : `rgba(${color.r},${color.g},${color.b},${color.a})`);

// 转换颜色值字符串为对象
const _decodeColor = (color) => {
  const colorObj = { r: 0, g: 0, b: 0, a: 0 }
  if (/^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/.test(color)) {
    // 如果传入的是16进制颜色值(#ffffff、#000)
    const colorArray = color.replace('#', '').split('')
    const colorLen = colorArray.length
    // 透明度设置为1
    colorObj.a = 1
    if (colorLen === 3) {
      colorObj.r = parse16to10(colorArray[0] + colorArray[0])
      colorObj.g = parse16to10(colorArray[1] + colorArray[1])
      colorObj.b = parse16to10(colorArray[2] + colorArray[2])
    } else if (colorLen === 6) {
      colorObj.r = parse16to10(colorArray[0] + colorArray[1])
      colorObj.g = parse16to10(colorArray[2] + colorArray[3])
      colorObj.b = parse16to10(colorArray[4] + colorArray[5])
    }
  } else if (/^rgba?/i.test(color)) {
    // 以rgb或rgba开头的值
    const c = color.replace(/^rgba?\(|\)$/gi, '').split(',')
    if (c.length >= 3) {
      return {
        r: c[0],
        g: c[1],
        b: c[2],
        a: c[3] ? c[3] : 1
      }
    }
  }
  // 其他任何不符合上述情况的color一律返回透明色
  return colorObj
};

class ColorPicker extends React.Component {
  static propTypes = {
    disableAlpha: PropTypes.bool,
    color: PropTypes.string.isRequired,
    onSure: PropTypes.func.isRequired,
    onHide: PropTypes.func.isRequired,
    onReset: PropTypes.func,
    changeAtOnce: PropTypes.bool
  };

  static defaultProps = {
    disableAlpha: false,
    changeAtOnce: false,
    color: 'transparent'
  };

  constructor(props) {
    super(props);
    this.state = {
      currentColor: _decodeColor(this.props.color),
      oldHue: 0,
      initColor: this.props.color
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.color !== this.props.color) {
      this.setState({
        currentColor: _decodeColor(nextProps.color)
      })
    }
  }

  render() {
    const { disableAlpha, onReset } = this.props
    const { currentColor } = this.state

    return (
      <div className="dmp-color-picker-container form"
        style={this.STYLE_SHEET.container}
        onKeyDown={e => e.nativeEvent.stopImmediatePropagation()}
      >
        <SketchPicker
          className="dmp-color-picker-content"
          color={currentColor}
          onChangeComplete={this.handleChangeColorComplete.bind(this)}
          disableAlpha={disableAlpha}
        />
        <div className="dmp-color-picker-btns-container" style={{ paddingTop: '5px' }}>
          <button
            style={this.STYLE_SHEET.btn}
            className="btn btn-secondary btn-sm"
            onClick={this.handleClickCancel.bind(this)}
          >
            取消
          </button>

          <button
            style={this.STYLE_SHEET.btn}
            className="btn btn-secondary btn-sm"
            onClick={this.handleClickOk.bind(this)}
          >
            确定
          </button>

          {
            typeof onReset === 'function' && (
              <span
                style={this.STYLE_SHEET.resetBtn}
                className="reset-color-btn"
                onClick={onReset}
              >
                还原
              </span>
            )
          }
          <div style={{ clear: 'both' }} />
        </div>
      </div>
    );
  }

  // 颜色变化结束
  handleChangeColorComplete({ rgb }) {
    const { currentColor } = this.state
    // 如果颜色变化 但透明度仍为0时 默认将透明度设置为1
    const colorChanged = +currentColor.r !== rgb.r || +currentColor.g !== rgb.g || +currentColor.b !== rgb.b;
    const alphaStillZero = +currentColor.a === 0 && rgb.a === 0;
    if (alphaStillZero && colorChanged) {
      rgb.a = 1;
    }
    this.setState({
      currentColor: rgb
    });
    // 如果需要立即更新 则马上调用onSure方法
    if (this.props.changeAtOnce) {
      this.props.onSure(_encodeColor(rgb));
    }
  }

  // 点击确定
  handleClickOk() {
    this.props.onSure(_encodeColor(this.state.currentColor));
    this.props.onHide(null);
  }

  // 点击取消
  handleClickCancel() {
    // 将上一次的颜色返回
    this.props.onHide(this.state.initColor);
  }

  STYLE_SHEET = {
    container: {
      width: '225px'
    },
    btn: {
      float: 'right',
      marginLeft: '10px',
      width: '60px',
      minWidth: '60px',
    },
    resetBtn: {
      float: 'right',
      lineHeight: '28px',
      fontSize: '12px',
      paddingRight: '8px',
      cursor: 'pointer',
      transition: 'color 0.3s'
    }
  }
}

export default ColorPicker;
