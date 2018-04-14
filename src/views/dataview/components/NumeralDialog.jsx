import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';

import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import Row from 'react-bootstrap-myui/lib/Row';
import Col from 'react-bootstrap-myui/lib/Col';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Panel from 'react-bootstrap-myui/lib/Panel';

import uniqueId from 'lodash/uniqueId';
import TipMixin from '../../../helpers/TipMixin';

import 'rt-tree/dist/css/rt-select.css';
import './numeral-dialog.less';

const NUMBER_OPERATORS = ['AVG', 'COUNT', 'SUM', 'MAX', 'MIN', '+', '-', '*', '/', '(', ')', '输入框']
const ICON_SHEET = {
  color: '#488DFB',
  fontStyle: 'italic',
  width: '20px',
  display: 'inline-block',
  textAlign: 'left'
}

const NumeralDialog = createReactClass({
  displayName: 'NumeralDialog',
  mixins: [TipMixin],

  propTypes: {
    show: PropTypes.bool,
    id: PropTypes.string,
    onSure: PropTypes.func,
    mode: PropTypes.string,
    numeralTree: PropTypes.array,
    valueList: PropTypes.array,
    numeralColName: PropTypes.string
  },

  getInitialState() {
    return {
      show: this.props.show,
      id: this.props.id,
      colName: this.props.numeralColName, //字段名称
      numIndicators: this.props.numeralTree, //度量字段数组
      valueList: this.props.valueList,
      mode: this.props.mode ? this.props.mode : 'add' //默认值为add
    }
  },

  componentWillReceiveProps(nextProps) {
    const { show, mode, numeralTree, valueList, numeralColName } = nextProps
    this.setState({
      numIndicators: numeralTree,
      show,
      valueList,
      mode
    })
    //只有编辑状态才设置
    if (mode !== 'add') {
      this.setState({
        colName: numeralColName
      })
    }
  },

  render() {
    const { colName, show } = this.state
    const header = <div>
      <span>度量字段</span>
    </div>
    return (
      show && <Dialog
        show={show}
        backdrop="static"
        onHide={this.handleClose}
        size={{ width: '700px', height: '520px' }}
        className="numeral-indicator-select-dialog">
        <Dialog.Header closeButton>
          <Dialog.Title>添加计算字段</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="indicator-input">
            <Row>
              <Col md="2">
                <span>字段名称</span>
              </Col>
              <Col md="10">
                <Input type="text" value={colName} onChange={this.handleColName} style={{ width: '100%' }} />
              </Col>
            </Row>
          </div>
          <div className="indicator-select-dialog-wrapper">
            <div className="left">
              <Panel header={header}>
                <div className="tree-wrap">
                  <div className="tree-inner-wrap" id="indicator-select-tree-wrap">
                    {this.renderIndicator()}
                  </div>
                </div>
              </Panel>
            </div>
            {this.renderRightArea()}
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSure}>确定</Button>
          <Button bsStyle="default" onClick={this.handleClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    )
  },

  renderIndicator() {
    const { numIndicators } = this.state
    const isEmpty = Array.isArray(numIndicators) && numIndicators.length === 0
    const element = (
      <ul className="micro-tree-list" style={{ display: 'block' }}>
        {
          Array.isArray(numIndicators) && numIndicators.length > 0 && numIndicators.map(item => <li className="micro-tree-list-item" key={uniqueId()} data-id={item.id} onClick={this.handleAddIndicators.bind(this, item)}>
            <i className="dmp-field-icon" style={ICON_SHEET}>#</i>
            <span>{item.text}</span>
          </li>)
        }
      </ul>
    )
    const empty = (<div className="nothing">暂无数据！</div>)

    return isEmpty ? empty : element
  },

  renderRightArea() {
    const { valueList } = this.state

    const Element = (<div className="numeral-selection">
      <div className="operate-bar">
        {
          NUMBER_OPERATORS.map((item, key) => <div key={key} className="item" onClick={this.handleOperatorClick.bind(this, item)}>{item}</div>)
        }
      </div>
      <div className="main-body">
        {
          valueList && valueList.map((item, key) => {
            const value = item.op ? item.op : item.title
            const inputValue = item.value ? item.value : ''
            return item.op && item.op === 'input' ? <div className="cell form">
              <Input
                type="text"
                value={inputValue}
                style={{ width: '80px' }}
                onChange={this.handleChange.bind(this, key)}
              />
              <i className="circle-del" onClick={this.handleDelete.bind(this, key)} />
            </div> : <div className="cell" key={key}>
              <span>{value}</span>
              <i className="circle-del" onClick={this.handleDelete.bind(this, key)} />
            </div>;
          })
        }
      </div>
    </div>)

    const header = (
      <div>
        <span>
          计算结果
        </span>
      </div>
    )

    return (
      <div className="right">
        <Panel header={header}>
          {Element}
        </Panel>
      </div>
    )
  },

  handleClearIndicator() {
    this.setState({
      indicators: null
    })
  },

  handleSure() {
    const { valueList, colName, mode } = this.state
    if (colName && valueList.length > 0) {
      this.props.onSure(mode, this.props.id, valueList, colName, this.props.rank)
    } else {
      this.showErr('计算字段名与计算值都不能为空')
    }
  },

  handleClose() {
    this.setState({
      show: false
    }, this.props.onClose())
  },

  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    })
  },

  //数值栏增加字段
  handleAddIndicators(item) {
    const id = {
      id: item.id,
      title: item.alias || item.alias_name || item.col_name
    }

    this.state.valueList.push(id)
    this.setState({ ...this.state })
  },

  //数值栏点击事件
  handleOperatorClick(value) {
    const item = value === '输入框' ? {
      op: 'input',
      value: ''
    } : {
      op: value
    }

    this.state.valueList.push(item)
    this.setState({ ...this.state })
  },

  // 数值栏输入框
  handleChange(index, e) {
    this.state.valueList[index].value = e.target.value
    this.setState({ ...this.state })
  },

  //数值栏删除
  handleDelete(index) {
    this.state.valueList.splice(index, 1)
    this.setState({ ...this.state })
  },

  //修改计算字段名称
  handleColName(e) {
    this.setState({
      colName: e.target.value
    })
  },

  DEFAULT_TYPE: '日期',
})

export default NumeralDialog;
