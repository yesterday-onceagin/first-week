import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog'
import Button from 'react-bootstrap-myui/lib/Button'
import Input from 'react-bootstrap-myui/lib/Input'
import Select from 'react-bootstrap-myui/lib/Select'
import reactMixin from 'react-mixin'
import TipMixin from '@helpers/TipMixin'
import MicroTree from '@components/MicroTree'
import classnames from 'classnames'

import expressionHasAggregateOperator from '@helpers/expressionHasAggregateOperator'

import Popover from 'react-bootstrap-myui/lib/Popover'
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger'

import './advanced-datafield-dialog.less'

import _ from 'lodash'

const FIELD_GROUP = [
  { value: '维度', text: '维度' },
  { value: '度量', text: '度量' },
]

const DATA_TYPES = [
  { value: '数值', text: '数值' },
  { value: '字符串', text: '字符串' },
]

const FUNC_TYPES = [
  { value: '', text: '全部' },
  { value: 'aggregate', text: '聚合函数' },
  { value: 'string', text: '字符函数' },
]

const FUNC_OPERATORS = [
  { value: 'AVG', text: 'AVG', type: 'aggregate', describe: {
    usage: 'AVG(字段)',
    explain: '求字段的平均值',
    example: 'AVG(绿化面积), 返回绿化面积的平均值',
  } },
  { value: 'COUNT', text: 'COUNT', type: 'aggregate', describe: {
    usage: 'COUNT(字段)',
    explain: '求字段的数据条目数',
    example: 'COUNT(绿化面积), 返回绿化面积的数据条数',
  } },
  { value: 'SUM', text: 'SUM', type: 'aggregate', describe: {
    usage: 'SUM(字段)',
    explain: '求字段的总和',
    example: 'SUM(绿化面积), 返回绿化面积的总和',
  } },
  { value: 'MAX', text: 'MAX', type: 'aggregate', describe: {
    usage: 'MAX(字段)',
    explain: '返回字段中的最大值',
    example: 'MAX(绿化面积), 返回绿化面积的最大值',
  } },
  { value: 'MIN', text: 'MIN', type: 'aggregate', describe: {
    usage: 'MIN(字段)',
    explain: '返回字段中的最大值',
    example: 'MIN(绿化面积), 返回绿化面积的最大值',
  } },
  { value: 'SUBSTR', text: 'SUBSTR', type: 'string', describe: {
    usage: 'SUBSTR(字符串, 起始位置, [长度])',
    explain: '从开始位置(字符串从1开始计数)截取指定长度的字符串返回，长度为可选参数，不给则默认截取到字符串尾部',
    example: 'SUBSTR("abc123", 1, 3) = "abc"， SUBSTR("abc123", 1) = "abc123"',
  } },
  { value: 'REPLACE', text: 'REPLACE', type: 'string', describe: {
    usage: 'REPLACE(字段, 字符串A, 字符串B)',
    explain: '将字段中的字符串A替换成字符串B',
    example: 'REPLACE(货品名, "车厘子", "樱桃"), 将货品名中的车厘子替换成樱桃',
  } },
  { value: 'IF', text: 'IF', type: 'string', describe: {
    usage: 'IF(表达式, 结果1, 结果2)',
    explain: 'IF为判断函数, 表达式为比较型或计算型语句. 若标识是的计算结果正确, 则返回"结果1", 否则, 返回"结果2"',
    example: 'IF(订单数 > 500, "合格", "不合格"). 结果为若该行"订单数"字段对应值大于500, 则返回"合格", 否则返回"不合格"',
  } },
]

function _getFilterFuncs(filter = '', keyword = '') {
  if (filter === '') {
    if (keyword === '') {
      return FUNC_OPERATORS.concat()
    }
    return FUNC_OPERATORS.filter(func => func.text.indexOf(keyword.toUpperCase()) > -1)
  }
  return FUNC_OPERATORS.filter((op) => {
    const hasKeyword = keyword === '' || op.text.indexOf(keyword.toUpperCase()) > -1
    return op.type === filter && hasKeyword
  })
}

// 返回一维数组
function getArrayFromTree(treeArr) {
  const arr = []
  treeArr.forEach((item) => {
    arr.push(item)
    if (Array.isArray(item.children) && item.children.length > 0) {
      arr.push(...(getArrayFromTree(item.children)))
    }
  })
  return arr
}

// 向上检查需要显示的节点父级是否hidden
function setNodeParentHideStatus(treeArr, node) {
  if (node.parent_id) {
    treeArr.forEach((item) => {
      if (node.parent_id === item.title) {
        item.hidden = false
      }
    })
  }
}

// 根据关键字为树的各节点设置hidden属性
function setTreeNodeHiddenStatus(treeArr, keyword) {
  return treeArr.map((node) => {
    //如果是维度、度量
    if (node.title) {
      node.hidden = !new RegExp(keyword.toLowerCase(), 'g').test(node.title)
      //如果输入的是度量、维度
      if (!node.hidden) {
        //默认展开
        node._spread_ = true
        Array.isArray(node.children) && node.children.forEach((item) => {
          item.hidden = false
        })
      } else if (Array.isArray(node.children) && node.children.length > 0) {
        node.children = setTreeNodeHiddenStatus(node.children, keyword)
      }
    } else {
      node.hidden = !new RegExp(keyword.toLowerCase(), 'g').test(node.text)
    }
    return node
  })
}

// 以关键字过滤文件夹
function setFolderHideStatusByKeyword(treeArr, keyword) {
  keyword = keyword.trim();
  const newTree = setTreeNodeHiddenStatus(treeArr, keyword)

  // 如果关键字为空 直接返回结果 跳过过滤计算
  if (!keyword) {
    return newTree
  }

  const nodeTree = getArrayFromTree(newTree)
  const newList = nodeTree.filter(item => !item.hidden)
  // 向上检查需要显示的节点父级是否hidden
  newList.map(node => setNodeParentHideStatus(newTree, node))

  return newTree
}

function _generateFuncDescribePopover(title, des) {
  const node = (<div className="describe-popover-wrapper">
    <div className="title">{title}</div>
    <div className="content">
      <div className="row-section">
        <span className="header">用法</span>
        <span className="describe-item">{des.usage}</span>
      </div>
      <div className="row-section">
        <span className="header">说明</span>
        <span className="describe-item">{des.explain}</span>
      </div>
      <div className="row-section">
        <span className="header">示例</span>
        <span className="describe-item">{des.example}</span>
      </div>
    </div>
  </div>)
  return (<Popover>{node}</Popover>)
}

class AdvancedDataFieldDialog extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    onSure: PropTypes.func.isRequired,
    dataField: PropTypes.object,
    data: PropTypes.object,
  }

  constructor(props) {
    super(props)
    const originData = props.data || {}
    this.state = {
      data: {
        alias_name: originData.alias_name || '',
        id: originData.id || '',
        field_group: originData.field_group || '度量',
        data_type: originData.data_type || '数值',
        expression: originData.expression && JSON.parse(originData.expression) || [],
        rank: originData.rank || '',
      },
      dataFieldTree: this.getDatasetField(_.cloneDeep(props.dataField)),
      keyword: '',
      funcType: '',
      funcList: _getFilterFuncs('', ''),
      cursorIndex: -1,              // -1 表示在最后面
      cursorShow: true,
      funcKeyword: '',
    }

    this._debounceUpdateFieldTree = _.debounce(() => {
      const { dataFieldTree, keyword } = this.state
      this.setState({
        dataFieldTree: setFolderHideStatusByKeyword(dataFieldTree, keyword)
      })
    }, 300)

  }

  componentDidMount() {
    this._CRUSOR_INTERVAL = setInterval(() => {
      if (this._cursorDom) {
        this._cursorDom.style.visibility = this._cursorDom.style.visibility ? '' : 'hidden'
      }
    }, 500)
    this.setState({},() => {
      if (this._dialogBody) {
        this._dialogBody.focus()
      }
    })
  }

  componentWillUnmount() {
    clearInterval(this._CRUSOR_INTERVAL)
  }

  render() {
    const { data, keyword, funcKeyword, funcType } = this.state
    return <Dialog
      show
      backdrop="static"
      onHide={this.handleClose.bind(this)}
      size={{ width: '600px' }}
      className="advanced-datafield-dialog"
      onKeyDown={this.handleEditorKeyDown.bind(this)}
    >
      <Dialog.Header closeButton>
        <Dialog.Title>添加新字段</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <div className="body-container form"
          tabIndex="0"
          ref={(node) => { this._dialogBody = node }}
        >
          <div className="config-section clearfix">
            <div className="section-name">
              <span className="label-title">字段名称</span>
              <div className="input-wrapper">
                <Input
                  type="text"
                  value={data.alias_name}
                  onChange={this.handleChangeName.bind(this)}
                />
              </div>
            </div>
            <div className="section-group">
              <span className="label-title">字段类别</span>
              <div className="input-wrapper">
                <Select value={data.field_group} onSelected={this.handleChangeField.bind(this)}>
                  {
                    FIELD_GROUP.map(g => <option key={g.value} value={g.value}>{g.text}</option>)
                  }
                </Select>
              </div>
            </div>
            <div className="section-type">
              <span className="label-title">字段类型</span>
              <div className="input-wrapper">
                <Select value={data.data_type} onSelected={this.handleChangeDataType.bind(this)}>
                  {
                    DATA_TYPES.map(g => <option key={g.value} value={g.value}>{g.text}</option>)
                  }
                </Select>
              </div>
            </div>
          </div>
          <div className="editor-section">
            <div tabIndex="0" className="editor" onClick={this.handleEditorClick.bind(this)}>
              { this.renderExpressionList() }
            </div>
          </div>
          <div className="operator-section clearfix">
            <div className="operators-wrapper">
              {
                ['+', '-', '*', '/', '(', ')', ',', '=', '>', '<', '>=', '<=', '<>', '输入框'].map((item, i) => {
                  return <span key={i} className="op" title={`插入 ${item}`} onClick={this.handleOperatorClick.bind(this, item, false)}>{item}</span>
                })
              }
            </div>
          </div>
          <div className="tool-section clearfix">
            <div className="func-section">
              <div className="operators clearfix">
                <div className="type-select">
                  <Select value={funcType} onSelected={this.handleSelectFuncType.bind(this)}>
                    {
                      FUNC_TYPES.map(t => (<option key={t.value} value={t.value}>{t.text}</option>))
                    }
                  </Select>
                </div>
              </div>
              <div className="search-wrapper">
                <div className="form single-search-form" style={{ width: '100%' }}>
                  <Input type="text"
                    placeholder="请输入关键字"
                    value={funcKeyword}
                    onChange={this.handleChangeFuncKeyword.bind(this)}
                    addonAfter={<i className="dmpicon-search" />}
                    className="search-input-box" />
                  {funcKeyword && <i className="dmpicon-close" onClick={this.handleClearFuncKeyword.bind(this)}></i>}
                </div>
              </div>
              <div className="funcs-wrapper">
                { this.renderFuncList() }
              </div>
            </div>
            <div className="source-section">
              <div className="title">
                字段名
              </div>
              <div className="search-wrapper">
                <div className="form single-search-form" style={{ width: '100%' }}>
                  <Input type="text"
                    placeholder="请输入关键字"
                    value={keyword}
                    onChange={this.handleChangeKeyword.bind(this)}
                    addonAfter={<i className="dmpicon-search" />}
                    className="search-input-box" />
                  {keyword && <i className="dmpicon-close" onClick={this.handleClearKeyword.bind(this)}></i>}
                </div>
              </div>
              <div className="source-list">
                {this.renderSourceList()}
              </div>
            </div>
          </div>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button bsStyle="primary" onClick={this.handleSure.bind(this)}>确定</Button>
        <Button bsStyle="default" onClick={this.handleClose.bind(this)}>取消</Button>
      </Dialog.Footer>
    </Dialog>
  }

  renderFuncList() {
    const { funcList, data } = this.state
    return (<ul className="func-list">
      {
        funcList.map((f) => {
          const disabled = data.field_group === '维度' && f.type === 'aggregate'
          const cn = classnames({
            disabled
          })
          return <li
            draggable
            className={cn}
            key={f.value}
            data-value={f.value}
            onClick={disabled ? null : this.handleOperatorClick.bind(this, f.value, true)}
            onDragStart={this.handleDragStart.bind(this)}
            onDragEnter={this.handleDragEnter.bind(this)}
            onDragOver={this.handleDragOver.bind(this)}
            onDragLeave={this.handleDragLeave.bind(this)}
            onDragEnd={this.handleDragEnd.bind(this)}
          >
            <OverlayTrigger
              trigger="hover"
              placement="left"
              rootClose
              overlay={_generateFuncDescribePopover(f.text, f.describe)}
            >
              <div className="value">{ f.text }</div>
            </OverlayTrigger>
          </li>
        })
      }
    </ul>)
  }

  renderSourceList() {
    const { dataFieldTree } = this.state
    return dataFieldTree.map((item, index) =>
      <MicroTree
        sort={false}
        data={item}
        key={index}
        showLine={true}
        events={{
          onSpread: this.handleFolderSpread.bind(this, index),
          onSelect: this.handleSelectSouce.bind(this, index),
          // onDelete: this.handleNumDelete
        }}
      />)
  }

  renderExpressionList() {
    const { data, cursorIndex, cursorShow } = this.state
    const domsList = data.expression.map((item, i) => {
      const value = item.op ? item.op : item.title
      const inputValue = item.value ? item.value : ''
      const cn = classnames('expression-unit', {
        'has-cursor-before': cursorShow && (cursorIndex === i)
      })
      return <li key={i} className={cn} onClick={this.handleExpressionClick.bind(this, i)}>
        {
          item.op && item.op === 'input' ?
            <Input
              type="text"
              value={inputValue}
              style={{ width: '80px' }}
              onChange={this.handleChangeInputValue.bind(this, i)}
              onFocus={this.handleInputFocus.bind(this)}
              onBlur={this.handleInputBlur.bind(this)}
            /> :
            <span>{ value }</span>
        }
      </li>
    })
    if (cursorShow) {
      const cursorDom = <li className="cursor"><span key="mock-cursor" ref={(node) => { this._cursorDom = node }} className="mock-cursor"></span></li>
      if (cursorIndex < 0) {
        domsList.push(cursorDom)
      } else {
        domsList.splice(cursorIndex, 0, cursorDom)
      }
    }
    return (<ul className="expression-list clearfix">{ domsList }</ul>)
  }

  handleChangeName(e) {
    this.updateData('alias_name', e.target.value)
  }

  handleChangeField(option) {
    this.updateData('field_group', option.value)
  }

  handleChangeDataType(option) {
    this.updateData('data_type', option.value)
  }

  handleSelectFuncType(option) {

    const type = option.value
    const newFuncList = _getFilterFuncs(type, this.state.funcKeyword)
    this.setState({
      funcType: option.value,
      funcList: newFuncList
    })
  }

  updateData(key, value) {
    this.setState({
      data: {
        ...this.state.data,
        [key]: value
      }
    })
  }

  getDatasetField(data) {
    const newDataFieldTree = []
    data && Object.keys(data).forEach((key) => {
      const item = {
        title: key,
        _spread_: true,
        children: data[key]
          .filter(child => !!child.visible && !child.expression)   // 滤掉隐藏字段和高级字段
          .map(sub => Object.assign(sub, {
            text: sub.alias_name || sub.col_name,
            parent_id: key,
            alias: sub.alias_name || sub.col_name
          }))
      }

      // 对度量里面的children 数据进行分组排序
      if (key === '度量') {
        const normal = []        // 普通字段
        const higher = []        // 高级字段
        item.children.forEach((it) => {
          if (it.type === '普通') {
            normal.push(it)
          } else {
            higher.push(it)
          }
        })
        item.children = normal.concat(higher)
      }
      if (key === '度量') {
        newDataFieldTree[1] = item
      } else {
        newDataFieldTree[0] = item
      }
    })
    return newDataFieldTree
  }

  handleChangeFuncKeyword(e) {
    const { value } = e.target
    this.setState({
      funcKeyword: value,
      funcList: _getFilterFuncs(this.state.funcType, value)
    })
  }

  handleClearFuncKeyword() {
    this.setState({
      funcKeyword: '',
      funcList: _getFilterFuncs(this.state.funcType, '')
    })
  }

  handleChangeKeyword(e) {
    this.setState({
      keyword: e.target.value
    }, () => {
      this._debounceUpdateFieldTree()
    })
  }

  handleClearKeyword() {
    this.setState({
      keyword: ''
    }, () => {
      this._debounceUpdateFieldTree()
    })
  }

  handleEditorClick() {
    this.setState({
      cursorIndex: -1
    })
  }

  handleEditorKeyDown(e) {
    if (e.target.tagName === 'INPUT') {
      return
    }
    const { keyCode } = e
    // delete backspace
    if (keyCode === 8 || keyCode === 46) {
      this.deleteOperatorAtCursor()
    }
    // left arrow
    if (keyCode === 37) {
      this.moveCursor(-1)
    }
    // right arrow
    if (keyCode === 39) {
      this.moveCursor(1)
    }
  }
  // 修改input的值
  handleChangeInputValue(index, e) {
    const { value } = e.target
    const { data } = this.state
    const expression = data.expression[index]
    if (expression) {
      expression.value = value
    }
    this.setState({
      data
    })
  }

  handleInputFocus() {
    this.setState({
      cursorShow: false
    })
  }

  handleInputBlur() {
    this.setState({
      cursorShow: true
    })
  }

  // 定位光标
  handleExpressionClick(clickIndex, e) {
    e.stopPropagation()
    const { data } = this.state
    const cursorX = e.clientX
    const $target = $(e.currentTarget)
    const tWidth = $target.width()
    const tLeft = $target.offset().left
    let nextCursorIndex = clickIndex
    if (cursorX > tLeft + tWidth / 2) {
      nextCursorIndex = clickIndex + 1
    }
    if (nextCursorIndex >= data.expression.length) {
      nextCursorIndex = -1
    }
    this.setState({
      cursorIndex: nextCursorIndex
    })
  }

  handleFolderSpread(index) {
    const { dataFieldTree } = this.state
    const spread = this.state.dataFieldTree[index]._spread_

    dataFieldTree[index]._spread_ = !spread
    this.setState({
      dataFieldTree
    })
  }
  // 插入字段
  handleSelectSouce(mode, data) {
    this.insertExpression([{
      id: data.id,
      title: data.alias || data.alias_name || data.col_name
    }])
  }
  // 插入符号, bracket: 自动添加括号, 比如插入函数的时候
  handleOperatorClick(value, bracket) {
    const isInput = value === '输入框'
    const expression = isInput ? {
      op: 'input',
      value: ''
    } : {
      op: value
    }
    const expressions = [expression]
    if (bracket) {
      expressions.push({ op: '(' })
      expressions.push({ op: ')' })
    }
    this.insertExpression(expressions, bracket, () => {
      // 自动聚焦插入的input
      if (isInput && this._cursorDom) {
        $(this._cursorDom).closest('li').prev().find('input').focus()
      }
    })
  }

  insertExpression(expressions, bracket, callback) {
    const { data, cursorIndex } = this.state
    let newCursorIndex = cursorIndex
    if (cursorIndex === -1) {
      data.expression = data.expression.concat(expressions)
    } else {
      const slice2 = data.expression
      const slice1 = data.expression.splice(0, cursorIndex)
      let expression = slice1.concat(expressions)
      expression = expression.concat(slice2)
      data.expression = expression
      newCursorIndex = newCursorIndex + expressions.length
    }
    this.setState({
      data,
      cursorIndex: newCursorIndex
    }, () => {
      if (bracket) {
        this.moveCursor(-1)
      }
      callback && callback()
    })
  }

  handleClose() {
    this.props.onClose()
  }

  handleSure() {
    const { data } = this.state
    let errorMsg = ''
    if (data.alias_name === '') {
      errorMsg = '请输入字段名称'
    }
    if (data.expression.length === 0) {
      errorMsg = '表达式不能为空'
    }
    if (data.field_group === '维度') {
      // const excludeDimValues = ['SUM', 'AVG', 'MIN', 'MAX', 'COUNT']
      if (expressionHasAggregateOperator(data.expression)) {
        errorMsg = `维度不能包含聚合函数`
      }
    }
    if (errorMsg) {
      this.showErr(errorMsg)
      return
    }
    this.props.onSure(this.state.data)
  }

  deleteOperatorAtCursor() {
    const { cursorIndex, data } = this.state
    if (cursorIndex === 0) {
      return
    }
    let newCursorIndex = cursorIndex
    // 从尾部还是删除
    if (cursorIndex === -1) {
      data.expression.splice(-1)
    // 从中间开始删除
    } else if (cursorIndex > 0) {
      data.expression.splice(cursorIndex - 1, 1)
      newCursorIndex--
    }
    this.setState({
      data,
      cursorIndex: newCursorIndex
    })
  }

  moveCursor(step = 1) {
    const { cursorIndex, data } = this.state
    let nextCursorIndex = cursorIndex + step
    // 原本在末尾, 右移
    if (cursorIndex === -1 && step > 0) {
      return
    }
    // 原本在最开头, 左移
    if (nextCursorIndex === -1) {
      return
    }
    // 原本在最后, 往前移
    if (cursorIndex === -1 && data.expression.length > 0 && step < 0) {
      nextCursorIndex = data.expression.length - 1
    }
    // 移动到了最后
    if (nextCursorIndex >= data.expression.length && step > 0) {
      nextCursorIndex = -1
    }
    this.setState({
      cursorIndex: nextCursorIndex
    })
  }

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  }

  handleDragStart() {

  }

  handleDragEnter() {

  }

  handleDragOver() {

  }

  handleDragLeave() {

  }

  handleDragEnd() {
    
  }
}

reactMixin.onClass(AdvancedDataFieldDialog, TipMixin)

export default AdvancedDataFieldDialog
