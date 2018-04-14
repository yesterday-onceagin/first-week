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

import './mark-line-dialog.less';

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

const DATE_OPERATORS = [{
  value: '=',
  text: '日期'
}, {
  value: 'between',
  text: '日期段'
}, {
  value: 'far',
  text: '距今日'
}]

class ChartFilter extends React.Component {
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
    colValue: PropTypes.string,
    alias: PropTypes.string,
    colName: PropTypes.string
  };

  constructor(props) {
    super(props)
    const { show, colValue, colName, operator, filterOptions } = props;

    this.state = {
      show,
      colValue,
      colName,
      operator,
      spread: false,
      showDropDown: false,
      error_tips: '',
      filterOption: filterOptions || [],
      mode: (operator === 'in' || operator === 'not in') ? 'multiple' : 'single',   //下拉模式切换
      date: (operator === '=' && colValue[0]) ? colValue[0] : '',
      range_date: (operator === 'between' && colValue.length > 0) ? colValue : [],
      step_date: (operator === 'far' && colValue[0]) ? colValue[0] : ''
    }
  }

  componentWillReceiveProps(nextProps) {
    const { operator, colValue, filterOptions, show } = nextProps
    if (operator !== this.props.operator || !_.isEqual(colValue, this.props.colValue)) {
      this.setState({
        colValue,
        operator,
        mode: (operator === 'in' || operator === 'not in') ? 'multiple' : 'single',
        date: (operator === '=' && colValue[0]) ? colValue[0] : '',
        range_date: (operator === 'between' && colValue.length > 0) ? colValue : [],
        step_date: (operator === 'far' && colValue[0]) ? colValue[0] : ''
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
    const { show, showDropDown, colValue, operator } = this.state
    const { type, alias, colName } = this.props
    const alias_name = alias || colName
    const normalStyle = { width: '460px', height: '220px' }
    const timeStyle = { width: '460px', height: '460px' }
    return (
      <div className="chart-filter-wrapper">
        <div className="form-group">
          <div className="item-title" >
            <label className="control-label title-label" title={alias_name} style={{ position: 'relative', paddingLeft: '20px' }} onClick={this.handleDropdown.bind(this)}>
              <i className={`spread-icon dmpicon-arrow-down ${this.state.spread ? '' : 'unspread'}`} style={{ left: '2px', right: 'auto', cursor: 'pointer' }} />{alias}
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
              {colValue.length > 0 && colValue.map((item, key) => <li className="value-wrap" key={key}>
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
              <div className="title">筛选条件 <span className="alias-wrapper">{alias}</span></div>
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
    const { operator, colValue, filterOption, mode, date, step_date, range_date } = this.state
    const { type, alias } = this.props
    let element

    switch (type) {
      case '枚举':
      case '字符串': {
        element = this.generateString(colValue, filterOption, alias, mode, operator)
        break;
      }

      case '数值':
        element = this.generateNumber(operator, colValue);
        break;

      case '日期':
        element = this.generateDate(operator, date, range_date, step_date);
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

  generateDate(operator, date, range_date, step_date) {
    return (
      <div className="form" style={{ marginTop: '10px' }}>
        <Row>
          <Input
            type="checkbox"
            label="日期"
            checked={operator === '='}
            onChange={this.handleDateCheckbox.bind(this, '=')}
          />
        </Row>
        <Row style={{ marginBottom: '10px' }}>
          <Col md={12}>
            <DatePicker value={date} onSelected={this.handleDate.bind(this, 'date')} />
          </Col>
        </Row>
        <Row>
          <Input
            type="checkbox"
            label="日期段"
            checked={operator === 'between'}
            onChange={this.handleDateCheckbox.bind(this, 'between')}
          />
        </Row>
        <Row style={{ marginBottom: '10px' }}>
          <Col md={12}>
            <DatePicker value={range_date} single={false} onSelected={this.handleDate.bind(this, 'range_date')} />
          </Col>
        </Row>
        <Row>
          <Input
            type="checkbox"
            label="距今日"
            checked={operator === 'far'}
            onChange={this.handleDateCheckbox.bind(this, 'far')}
          />
        </Row>
        <Row style={{ marginLeft: '18px', display: 'flex' }} className="far">
          <Input type="text" value={step_date} onChange={this.handleDate.bind(this, 'step_date')} style={{ width: '140px' }} /> &nbsp;天
        </Row>
        {this.state.error_tips && <Row>
          <span style={{ color: 'red' }}>{this.state.error_tips}</span>
        </Row>}
      </div>
    );
  }

  //获取操作符的value
  getOperator() {
    const { operator } = this.state
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
          value = _.result(_.find(DATE_OPERATORS, item => item.value === operator), 'text')
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
    const newState = {}
    if (key === 'date' || key === 'range_date') {
      newState[key] = option
    } else {
      newState[key] = option.target.value
    }
    if (this.state.operator === key && this.state[key]) {
      newState.error_tips = ''
    }
    this.setState(() => newState)
  }

  //距今日
  handleDateCheckbox(key) {
    if (this.state.operator && this.state[key]) {
      this.setState({
        error_tips: '',
        operator: key
      })
    } else {
      this.setState({
        operator: key
      })
    }
  }

  handleSettings() {
    this.setState({
      show: true
    })
  }

  onClose() {
    const { colValue, mode, operator, type } = this.props
    //关闭时恢复初始值
    if (type === '日期') {
      this.setState({
        operator,
        colValue,
        show: false,
        date: (operator === '=' && colValue[0]) ? colValue[0] : '',
        range_date: (operator === 'between' && colValue.length > 0) ? colValue : [],
        step_date: (operator === 'far' && colValue[0]) ? colValue[0] : '',
      })
    } else {
      this.setState({
        show: false,
        operator,
        colValue
      })
    }
    this.props.onClose && this.props.onClose(false, this.props.colName, mode)
  }

  //确认
  handleSure() {
    // 输入是否为空
    let isEmpty = false
    let { colValue } = this.state
    //日期date、range_date、far转换为colValue
    if (this.props.type === '日期') {
      colValue = this.formatDate(colValue)
    }
    //校验输入情况
    colValue.forEach((item) => {
      if (!item) {
        isEmpty = true
      }
    })
    if (!this.state.operator) {
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

  formatDate(colValue) {
    switch (this.state.operator) {
      case 'between':
        colValue = this.state.range_date;
        break;
      case '=': {
        if (this.state.date) {
          colValue[0] = this.state.date
          if (this.state.colValue[1]) {
            colValue.splice(1, 1)
          }
        } else {
          colValue = []
        }
        break;
      }
      case 'far': {
        if (this.state.step_date) {
          colValue[0] = this.state.step_date
          if (this.state.colValue[1]) {
            colValue.splice(1, 1)
          }
        } else {
          colValue = []
        }
        break;
      }
      default:
        break;
    }
    return colValue
  }
}

export default ChartFilter;
