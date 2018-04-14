import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import Input from 'react-bootstrap-myui/lib/Input';

import './number-input.less';

class NumberInput extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    changeOnBlur: PropTypes.bool,
    disabled: PropTypes.bool,
    debounce: PropTypes.bool,
    maxValue: PropTypes.number,
    minValue: PropTypes.number,
    step: PropTypes.number
  };

  static defaultProps = {
    changeOnBlur: false,
    debounce: false,
    value: '',
    disabled: false,
    maxValue: +Infinity,
    minValue: 0,
    step: 1
  };

  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      disablePlus: false,
      disableMinus: false
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.value !== nextProps.value) {
      this.setState({
        value: nextProps.value
      });
    }
  }

  render() {
    const { disabled, style } = this.props;
    const { value } = this.state;

    return (
      <div style={{
        ...this.STYLE_SHEET.container,
        ...style
      }} className="dmp-number-input-container form">
        <Input type="text"
          ref={(instance) => { this.inputBox = instance; }}
          disabled={disabled}
          value={value}
          onKeyUp={this.handleKeyUp.bind(this)}
          onChange={this.handleInput.bind(this)}
          onBlur={this.handleBlur.bind(this)}
          className="dmp-number-input-box"
        />

        <div className={`dmp-number-input-btn-container ${disabled ? 'disabled' : ''}`}
          style={this.STYLE_SHEET.btnCon}
        >
          <i className="dmpicon-triangle-up dmp-number-input-btn"
            style={this.STYLE_SHEET.btnUp}
            onClick={this.handleClick.bind(this, '+')}
          />
          <i className="dmpicon-triangle dmp-number-input-btn"
            style={this.STYLE_SHEET.btnDown}
            onClick={this.handleClick.bind(this, '-')}
          />
        </div>
      </div>
    )
  }

  handleBlur(e) {
    const { changeOnBlur, onChange } = this.props;
    if (!changeOnBlur) {
      return;
    }
    let v = +e.target.value;

    v = this._checkBoundary(v);

    // 防止触碰边界时 全选输入在第二位插入刚才输入的值
    e.target.value = v;

    this.setState({
      value: v
    });

    onChange(v);
  }

  // 仅处理按下回车键的情况
  handleKeyUp(e) {
    if (e.keyCode === 13 && this.inputBox.input && typeof this.inputBox.input.blur === 'function') {
      // 触发blur事件进行值的提交
      this.inputBox.input.blur()
    }
    if (e.keyCode === 38 || e.keyCode === 40) { //键盘方向键
      this.handleKeywordUpAndDown(e.keyCode)
    }
  }

  handleKeywordUpAndDown = _.debounce((keyCode) => {
    const { value } = this.state
    let newValue = keyCode === 38 ? value + 1 : (keyCode === 40 ? value - 1 : value)
    newValue = this._checkBoundary(newValue)
    this.setState({
      value: newValue
    })
    this.props.onChange(newValue);
  }, 250)

  // 点击事件
  handleClick(action, e) {
    e.stopPropagation();

    const { value, maxValue, minValue, step } = this.props;

    let v;
    // 加时要使用强制类型转换 避免出现字符串拼接
    if (action === '+') {
      if (value >= maxValue) {
        return;
      }
      v = +value + step;
    } else if (action === '-') {
      if (value <= minValue) {
        return;
      }
      v = value - step;
    }

    this.setState({
      value: v
    });

    this.props.onChange(v);
  }

  // 输入事件
  handleInput(e) {
    let v = e.target.value === '' ? 0 : Number.parseInt(e.target.value, 10);

    if (Number.isNaN(v)) {
      return;
    }

    const { changeOnBlur, debounce, onChange } = this.props;

    // 如果是在blur中变更 直接输入
    if (changeOnBlur) {
      this.setState({
        value: v
      })
      return;
    }

    if (debounce) {
      clearTimeout(this.numberInputTimer);

      this.setState({
        value: v
      });
      // 将修正值的动作延迟400ms
      this.numberInputTimer = setTimeout(() => {
        v = this._checkBoundary(v);

        this.setState({
          value: v
        });

        onChange(v);
      }, 400);
    } else {
      v = this._checkBoundary(v);

      // 防止触碰边界时 全选输入在第二位插入刚才输入的值
      e.target.value = v;

      this.setState({
        value: v
      });

      onChange(v);
    }
  }

  // 边界值检查
  _checkBoundary(v) {
    const { maxValue, minValue } = this.props;

    if (v > maxValue) {
      return maxValue
    } else if (v < minValue) {
      return minValue
    }
    return v
  }

  numberInputTimer = 0;

  STYLE_SHEET = {
    container: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },
    btnCon: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: '16px',
      height: '100%'
    },
    btnUp: {
      fontSize: '12px',
      transition: 'color 0.3s',
      transform: 'scale(0.75)',
      position: 'absolute',
      right: '50%',
      marginRight: '-4px',
      top: '1px'
    },
    btnDown: {
      fontSize: '12px',
      transition: 'color 0.3s',
      transform: 'scale(0.75)',
      position: 'absolute',
      right: '50%',
      marginRight: '-4px',
      bottom: '1px'
    }
  };
}

export default NumberInput;
