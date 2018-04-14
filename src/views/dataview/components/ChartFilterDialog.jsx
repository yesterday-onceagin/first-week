import React from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Select from 'react-bootstrap-myui/lib/Select';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import Input from 'react-bootstrap-myui/lib/Input';
import DatePicker from '../../../components/DatePicker';
import Row from 'react-bootstrap-myui/lib/Row';
import Col from 'react-bootstrap-myui/lib/Col';
import _ from 'lodash';
import isEqual from 'lodash/isEqual';

import './mark-line-dialog.less';
import './chart-filter-dialog.less'

const DIM_OPERATORS = [{
  value: '=',
  text: '等于'
}, {
  value: '!=',
  text: '不等于'
}, {
  value: 'in',
  text: '包含'
}, {
  value: 'not in',
  text: '不包含'
}]

const NUM_OPERATORS = [{
  value: '>',
  text: '大于'
}, {
  value: '<',
  text: '小于'
}, {
  value: '>=',
  text: '大于等于'
}, {
  value: '<=',
  text: '小于等于'
}, {
  value: 'between',
  text: '区间'
}]

const _generateDateDescribe = function (operator, values) {
  const v0 = values[0]
  const v1 = values[1]
  switch (operator) {
    case 'far':
      return `距今${v0}天`
    case 'far_yesterday':
      return `距昨天${v0}天`
    case 'from_week':
      if (+v0 === 0) {
        return '本周'
      } else if (+v0 === 1) {
        return '上周'
      }
      return `前${v0}周`
    case 'from_month':
      if (+v0 === 0) {
        return '本月'
      } else if (+v0 === 1) {
        return '上月'
      }
      return `前第${v0}月`
    case 'from_year':
      if (+v0 === 0) {
        return '今年'
      } else if (+v0 === 1) {
        return '去年'
      }
      return `前第${v0}年`
    case 'from_quarter':
      if (+v0 === 0) {
        return '本季度'
      } else if (+v0 === 1) {
        return '上季度'
      }
      return `前第${v0}季度`
    case 'between':
      const keyMap = {
        today: '今天',
        yesterday: '昨天',
        lastweek: '上周',
        lastmonth: '上月',
      }
      return [`${v0}`, <br />, '至', <br />, `${keyMap[v1] || v1}`]
    case '=':
      if (v0 === '*') {
        return '全部时间'
      }
      return v0
    default:
      return '未命名过滤'
  }
}

const DYNAMIC_DATE_OPERATORS = ['from_week', 'from_month', 'from_quarter', 'from_year']

class ChartFilterDialog extends React.Component {
  static propTypes = {
    filterOptions: PropTypes.array,
    // 显示
    show: PropTypes.bool,
    //模式 'add' 'edit'
    mode: PropTypes.string,
    // 确定
    onSave: PropTypes.func,
    //关闭
    onClose: PropTypes.func,
    //删除
    onDel: PropTypes.func,
    // 当前数据类型
    type: PropTypes.string,
    // 当前筛选符
    operator: PropTypes.string,
    // 当前筛选值
    colValue: PropTypes.array
  };

  constructor(props) {
    super(props)
    this.state = this._initState(props)
  }

  componentWillReceiveProps(nextProps) {
    const { operator, colValue, filterOptions, show } = nextProps
    if (operator !== this.props.operator || !_.isEqual(colValue, this.props.colValue)) {
      this.setState({
        colValue,
        operator,
        mode: (operator === 'in' || operator === 'not in') ? 'multiple' : 'single',
      })
    }
    if (filterOptions !== this.props.filterOptions) {
      this.setState({
        filterOption: filterOptions || [],
      })
    }
    if (show !== this.props.show) {
      this.setState({
        show
      })
    }
  }

  render() {
    const { show, showDropDown, colValue, colName, operator } = this.state
    const { type, alias } = this.props
    const alias_name = alias || colName
    const normalStyle = { width: '460px', height: '220px' }
    const timeStyle = { width: '450px', height: '460px' }
    return (
      <div className="chart-filter-wrapper">
        <div className="form-group">
          <div className="item-title" >
            <label className="control-label title-label" title={alias_name} style={{ position: 'relative', paddingLeft: '20px' }} onClick={this.handleDropdown.bind(this)}>
              <i className={`spread-icon dmpicon-arrow-down ${this.state.spread ? '' : 'unspread'}`} style={{ left: '2px', right: 'auto', cursor: 'pointer' }} />{alias_name}
            </label>
            <label className="control-label" style={{ float: 'right' }} onClick={this.handleDelete.bind(this)}>
              <i className="dmpicon-del" />
            </label>
            <label className="control-label" style={{ float: 'right' }} onClick={this.handleSettings.bind(this)}>
              <i className="dmpicon-set" />
            </label>
          </div>
          {showDropDown && <div className="choice-wrap">
            <ul>
              {operator && <li className="operator-wrap">
                <label>{this.getOperator()}</label>
              </li>}
              {type !== '日期' && colValue.length > 0 && colValue.map((item, key) => <li className="value-wrap" key={key}>
                <label>{item}</label>
              </li>)}
            </ul>
          </div>}
        </div>
        {show && <Dialog
          show={show}
          backdrop="static"
          onHide={this.onClose.bind(this)}
          size={type === '日期' ? timeStyle : normalStyle}
          className="chart-filter-dialog">
          <Dialog.Header closeButton>
            <Dialog.Title>添加筛选器</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <div className="chart-filter-container">
              <div className="title">筛选条件 <span className="alias-wrapper">{alias_name}</span></div>
              {type && this.renderRow()}
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Button bsStyle="primary" onClick={this.handleSure.bind(this)}>确定</Button>
            <Button bsStyle="default" onClick={this.onClose.bind(this)}>取消</Button>
          </Dialog.Footer>
        </Dialog>
        }
      </div>
    );
  }

  // generatorOperator(operator) {
  //   let obj = {}
  // }

  renderRow() {
    const { operator, colValue, colName, filterOption, mode } = this.state
    const { type, alias } = this.props
    const alias_name = alias || colName
    let element

    switch (type) {
      case '枚举':
      case '字符串': {
        element = this.generateString(colValue, filterOption, alias_name, mode, operator)
      } break;

      case '数值':
        element = this.generateNumber(operator, colValue);
        break;

      case '日期':
        element = this.generateDate();
        break;

      default: {
        element = (<div className="tip"><span>当前数据类型不能作为筛选器</span></div>)
        break;
      }
    }

    return element
  }

  generateString(colValue, filterOption, alias, mode, operator) {
    const selectValue = (mode === 'multiple') ? colValue : colValue[0]
    let options = Array.isArray(filterOption) && filterOption.map((option) => {
      if (option === null || option === '') {
        option = '(空)'
      }
      return option
    })
    options = _.uniq(options)
    return (
      <div className="dim-selection"><div className="row">
        <div className="cell indicator">
          <OverlayTrigger placement="bottom" overlay={<Tooltip>{alias}</Tooltip>}>
            <span>{alias}</span>
          </OverlayTrigger>
        </div>
        <div className="cell operator">
          <Select value={operator || ''} openSearch maxHeight={180} width={120} onSelected={this.handleSelect.bind(this, 'operator', false)}>
            {DIM_OPERATORS.map((op, i) => <option key={i} value={op.value}>{op.text}</option>)}
          </Select>
        </div>
        <div className="cell dimension">
          <Select value={selectValue || ''} openSearch maxHeight={180} width={140} type={mode} showMultipleBar={false} hasIcon={mode === 'multiple'} onSelected={this.handleSelect.bind(this, 'value', mode === 'multiple')}>
            {Array.isArray(options) && options.map((dimension, i) => <option key={i} value={dimension}>{dimension}</option>)}
          </Select>
        </div>
        {this.state.error_tips && <div className="cell error">
          <span style={{ color: 'red' }}>{this.state.error_tips}</span>
        </div>}
      </div>
      </div>)
  }

  generateNumber(operator, colValue) {
    return (
      <div className="dim-selection"><div className="row">
        <div className="cell operator">
          <Select value={operator || ''} openSearch maxHeight={180} width={120} onSelected={this.handleSelect.bind(this, 'operator', false)}>
            {NUM_OPERATORS.map((op, i) => <option key={i} value={op.value}>{op.text}</option>)}
          </Select>
        </div>
        {operator === 'between' && <div className="cell between">
          <Input type="text" value={colValue[0] ? colValue[0] : ''} placeholder="请输入最小值" onChange={this.handleNumChange.bind(this, 'min')} style={{ width: '120px' }} />
          <span>~</span>
          <Input type="text" value={colValue[1] ? colValue[1] : ''} placeholder="请输入最大值" onChange={this.handleNumChange.bind(this, 'max')} style={{ width: '120px' }} />
        </div>}
        {operator !== 'between' && <div className="cell single">
          <Input type="text" value={colValue[0] ? colValue[0] : ''} placeholder="请输入数值" onChange={this.handleNumChange.bind(this, 'value')} style={{ width: '120px' }} />
        </div>}
        {this.state.error_tips && <div className="cell error">
          <span style={{ color: 'red' }}>{this.state.error_tips}</span>
        </div>}
      </div>
      </div>
    );
  }

  generateDate() {
    const { dateCategory, dynamic_date, range_date, daysValue, daysOperator, range_date_custom } = this.state
    return (
      <div className="form" style={{ margin: '10px' }}>
        <Row>
          <Input
            type="checkbox"
            label="动态时间段"
            checked={dateCategory === 0}
            onChange={this.handleDateCheckbox.bind(this, 0)}
          />
        </Row>
        <Row className="dynamic-date" style={{ marginBottom: '10px' }}>
          <Col sm={4} style={{ paddingLeft: '20px' }}>
            <Select style={{ width: '110px' }} value={dynamic_date} onSelected={this.handleDate.bind(this, 'dynamic_date')}>
              <option value="fromDay">距今天</option>
              <option value="from_week&0">本周</option>
              <option value="from_week&1">上周</option>
              <option value="from_month&0">本月</option>
              <option value="from_month&1">上月</option>
              <option value="from_quarter&0">本季度</option>
              <option value="from_quarter&1">上季度</option>
              <option value="from_year&0">本年</option>
              <option value="from_year&1">去年</option>
              <option value="=&*">全部时间</option>
            </Select>
          </Col>
          {
            dynamic_date === 'fromDay' && [<Col sm={5} style={{ padding: '0 10px' }}>
              <input
                type="number"
                min={0}
                value={daysValue}
                style={{ width: '120px', height: '30px', padding: '0 5px', marginRight: '5px' }}
                onChange={this.handleDate.bind(this, 'daysValue')}
              />
              天
            </Col>,
            <Col sm={3} style={{ padding: '0' }}>
              <Input
                type="checkbox"
                label="包含今天"
                checked={daysOperator === 'far'}
                onChange={this.toggleDaysOperator.bind(this, 'daysOperator')}
              />
            </Col>]
          }
        </Row>
        <Row>
          <Input
            type="checkbox"
            label="静态时间段"
            checked={dateCategory === 1}
            onChange={this.handleDateCheckbox.bind(this, 1)}
          />
        </Row>
        <Row style={{ marginBottom: '10px' }}>
          <Col md={12} style={{ paddingLeft: '20px' }}>
            <DatePicker value={range_date} single={false} onSelected={this.handleDate.bind(this, 'range_date')} />
          </Col>
        </Row>
        <Row>
          <Input
            type="checkbox"
            label="自定义"
            checked={dateCategory === 2}
            onChange={this.handleDateCheckbox.bind(this, 2)}
          />
        </Row>
        <Row style={{ marginBottom: '10px' }}>
          <Col sm={3} style={{ padding: '5px 0 0 20px', width: 'auto' }}>开始时间</Col>
          <Col sm={9} style={{ width: 'auto' }}>
            <DatePicker value={range_date_custom[0]} single={true} onSelected={this.handleChangeDateCustom.bind(this, 0)} />
          </Col>
        </Row>
        <Row>
          <Col sm={3} style={{ padding: '5px 0 0 20px', width: 'auto' }}>结束时间</Col>
          <Col sm={9} style={{ width: '315px' }}>
            <Select style={{ width: '285px' }} value={range_date_custom[1]} onSelected={this.handleChangeDateCustom.bind(this, 1)}>
              <option value="today">今天</option>
              <option value="yesterday">昨天</option>
              <option value="lastweek">上周</option>
              <option value="lastmonth">上月</option>
            </Select>
          </Col>
        </Row>
        {this.state.error_tips && <Row>
          <span style={{ color: 'red' }}>{this.state.error_tips}</span>
        </Row>}
      </div>
    );
  }

  _initState(props) {
    let { show, colValue, colName, operator, filterOptions, type } = props || this.props

    let dynamic_date = '=&*'
    let daysValue = 7
    let daysOperator = 'far'
    let dateCategory = 0
    let range_date = []
    let range_date_custom = [null, 'today']

    if (type === '日期') {
      // 动态时间段
      if (DYNAMIC_DATE_OPERATORS.indexOf(operator) > -1) {
        dynamic_date = `${operator}&${colValue}`
      }
      if (operator === 'far' || operator === 'far_yesterday') {
        dynamic_date = 'fromDay'
        daysValue = colValue[0]
        daysOperator = operator
      }
      if (operator === '=') {
        if (colValue[0] === '*') {
          operator = '='
          dynamic_date = '=&*'
        } else {
          // 兼容日期的 =
          operator = 'between'
          colValue = [colValue[0], colValue[0]]
        }
      }

      if (operator === 'between') {
        // 静态时间段
        if (/\d{4}/.test(colValue[1])) {
          range_date = colValue
          dateCategory = 1
          // 自定义
        } else {
          range_date_custom = colValue
          dateCategory = 2
        }
      }
      if (colValue.length === 0 && !operator) {
        colValue = ['*']
        operator = '='
      }
    }

    return {
      show,
      colValue,
      colName,
      operator,
      range_date,
      range_date_custom,
      dateCategory,
      daysValue,
      daysOperator,
      dynamic_date,
      spread: false,
      showDropDown: false,
      error_tips: '',
      filterOption: filterOptions || [],
      mode: (operator === 'in' || operator === 'not in') ? 'multiple' : 'single'   //下拉模式切换
    }
  }

  //获取操作符的value
  getOperator() {
    const { operator, colValue } = this.state
    const { type } = this.props
    let value = ''
    switch (type) {
      case '数值': {
        if (operator) {
          value = _.result(_.find(NUM_OPERATORS, item => item.value === operator), 'text')
        }
        break;
      }
      case '日期': {
        if (operator) {
          value = _generateDateDescribe(operator, colValue)
        }
        break;
      }
      case '字符串':
      case '枚举': {
        if (operator) {
          value = _.result(_.find(DIM_OPERATORS, item => item.value === operator), 'text')
        }
        break;
      }
      default:
        break;
    }
    return value
  }

  // getDateFilterType() {
  //   const { type } = this.props
  //   const { operator, colValue } = this.state
  //   // 动态类型
  //   if (DYNAMIC_DATE_OPERATORS.indexOf(operator) > -1) {
  //     return 0
  //   }
  //   // 静态类型
  //   if ('between' === operator) {
  //     // 静态时间段
  //     if (/\d{4}/.test(colValue[1])) {
  //       return 1
  //     // 自定义
  //     } else {
  //       return 2
  //     }
  //   }
  // }

  handleDropdown() {
    const { showDropDown, spread, operator } = this.state
    const isShow = operator && !showDropDown
    this.setState({
      showDropDown: isShow,
      spread: !spread
    })
  }

  //删除filter
  handleDelete() {
    this.props.onDel && this.props.onDel(this.props.colName)
  }

  handleNumChange(key, e) {
    const values = this.state.colValue
    switch (key) {
      case 'min': {
        values[0] = e.target.value
        this.setState({
          colValue: values
        })
        break;
      }
      case 'max': {
        values[1] = e.target.value
        this.setState({
          colValue: values
        })
        break;
      }
      case 'value': {
        values[0] = e.target.value
        if (values[1]) {
          values.splice(1, 1)
        }
        this.setState({
          colValue: values
        })
        break;
      }
      default:
        break;
    }
    if (this.state.operator === 'between' && values.length > 1) {
      this.setState({
        error_tips: ''
      })
    }
    if (this.state.operator && this.state.operator !== 'between' && values.length > 0) {
      this.setState({
        error_tips: ''
      })
    }
  }

  handleSelect(key, IsMultiple, option) {
    const values = []
    switch (key) {
      case 'operator': {
        if (option.value === 'in' || option.value === 'not in') {
          this.setState({
            operator: option.value,
            mode: 'multiple',
            colValue: values
          })
        } else {
          this.setState({
            operator: option.value,
            mode: 'single',
            colValue: values
          })
        }
        break;
      }
      case 'value': {
        if (IsMultiple) {
          option.length > 0 && option.forEach((item) => {
            values.push(item.value)
          })
          this.setState({
            colValue: values
          })
        } else {
          values.push(option.value)
          this.setState({
            colValue: values
          })
        }
        break;
      }
      default:
        break;
    }
    if (this.state.operator && values.length > 0) {
      this.setState({
        error_tips: ''
      })
    }
  }

  //日期变化
  handleDate(key, option) {
    if (key === 'range_date') {
      this.state[key] = option
    } else if (key === 'dynamic_date') {
      this.state[key] = option.value
    } else {
      this.state[key] = option.target.value
    }
    if (this.state.operator === key && this.state[key]) {
      this.state.error_tips = ''
    }
    this.setState({
      ...this.state
    }, () => {
      this.udpateDateColValue()
    })
  }

  toggleDaysOperator() {
    const daysOperator = this.state.daysOperator === 'far' ? 'far_yesterday' : 'far'
    this.setState({
      daysOperator
    }, () => {
      this.udpateDateColValue()
    })
  }

  handleChangeDateCustom(index, option) {
    const { range_date_custom } = this.state
    range_date_custom[index] = typeof option === 'object' ? option.value : option
    this.setState({
      range_date_custom
    }, () => {
      this.udpateDateColValue()
    })
  }

  //距今日
  handleDateCheckbox(type) {
    // if (this.state.operator && this.state[key]) {
    //   this.setState({
    //     error_tips: '',
    //     operator: key
    //   })
    // } else {
    //   this.setState({
    //     operator: key
    //   })
    // }
    // caculate operator
    this.setState({
      error_tips: '',
      dateCategory: type
    }, () => {
      this.udpateDateColValue()
    })
  }

  handleSettings() {
    this.setState({
      show: true
    })
  }

  onClose() {
    const { mode } = this.props
    //关闭时恢复初始值
    // if (type === '日期') {
    //   this.setState({
    //     operator,
    //     colValue,
    //     show: false,
    //     date: (operator === '=' && colValue[0]) ? colValue[0] : '',
    //     range_date: (operator === 'between' && colValue.length > 0) ? colValue : [],
    //     step_date: (operator === 'far' && colValue[0]) ? colValue[0] : '',
    //   })
    // } else {
    //   this.setState({
    //     show: false,
    //     operator,
    //     colValue
    //   })
    // }
    this.props.onClose && this.props.onClose(false, this.props.colName, mode)
    this.setState({
      ...this._initState(),
      show: false,
    })
  }

  //确认
  handleSure() {
    const type = this.props.type
    let isEmpty = false     //输入是否为空
    const colValue = this.state.colValue
    //日期date、range_date、far转换为colValue
    // if (this.props.type === '日期') {
    //   colValue = this.formatDate(colValue)
    // }

    //校验输入情况
    colValue.forEach((item) => {
      if (item === '' || item === null || item === undefined) {
        isEmpty = true
      }
    })
    if (['数值', '日期', '字符串', '枚举'].indexOf(type) === -1) {
      this.onClose()
      return
    } else if (!this.state.operator) {
      this.setState({
        error_tips: '操作符不能为空'
      })
      return
    } else if (isEmpty || colValue.length === 0) {
      this.setState({
        error_tips: '筛选值不能为空'
      })
      return
    } else if (this.state.operator === 'between' && colValue.length < 2) {
      this.setState({
        error_tips: '区间类型筛选值都不能为空'
      })
      return
    }

    this.setState({
      show: false,
      error_tips: '',
      colValue
    }, this.props.onSave && this.props.onSave(this.state.operator, colValue, this.props.colName))
  }

  udpateDateColValue() {
    const { dateCategory, dynamic_date, range_date, range_date_custom, daysOperator, daysValue } = this.state
    let { colValue, operator } = this.state
    switch (dateCategory) {
      // 动态时间段
      case 0:
        if (dynamic_date === 'fromDay') {
          operator = daysOperator
          //转成数字
          colValue = [+daysValue]
        } else {
          const parseOpts = dynamic_date.split('&')
          operator = parseOpts[0]
          if (operator !== '=') {
            colValue = [+parseOpts[1]]
          } else {
            colValue = [parseOpts[1]]
          }
        }
        break;
      // 静态
      case 1:
        operator = 'between'
        colValue = range_date
        break
      // 自定义
      case 2:
        operator = 'between'
        colValue = range_date_custom
        break
      default:
        break;
    }
    this.setState({
      operator,
      colValue
    })
  }
}

export default ChartFilterDialog;
