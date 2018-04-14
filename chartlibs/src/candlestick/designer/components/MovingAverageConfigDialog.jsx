import React from 'react'
import PropTypes from 'prop-types'

import Dialog from 'react-bootstrap-myui/lib/Dialog'
import Button from 'react-bootstrap-myui/lib/Button'
import { PropComponents } from 'dmp-chart-sdk'

import _ from 'lodash'

import './moving-average-config-dialog.less'

class MovingAverageConfigDialog extends React.PureComponent {
  static propTypes = {
    onSure: PropTypes.func,
    onClose: PropTypes.func,
    data: PropTypes.array
  };

  constructor(props) {
    super(props)
    this.state = {
      list: _.cloneDeep(props.data) || [],
      errMsg: {
        show: false,
        text: ''
      }
    }
    this.errTimer = 0
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        list: _.cloneDeep(nextProps.data) || []
      })
    }
  }

  render() {
    const { onClose } = this.props
    const { list, errMsg } = this.state
    const hasValidLine = Array.isArray(list) && list.length > 0
    return (
      <Dialog
        show
        onHide={onClose}
        className="moving-average-config-dialog"
        backdrop="static"
        size={{ width: '520px', height: '360px' }}
      >
        <Dialog.Header closeButton>
          <Dialog.Title>均值曲线配置</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="moving-average-line-list-container">
            <div className="container-title">
              均值曲线
              <div className="err-box" style={{ opacity: errMsg.show ? 1 : 0 }}>{errMsg.text}</div>
              <i className="dmpicon-add add-btn" onClick={this.handleAddLine.bind(this)}/>
            </div>
            <div className="line-items-box form">
              {
                hasValidLine ? this.renderLines() : (
                  <div className="hint-text-box">请先添加一条均值曲线</div>
                )
              }
            </div>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSure.bind(this)}>确定</Button>
          <Button bsStyle="default" onClick={onClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    )
  }

  // 渲染均值曲线列表
  renderLines() {
    const { list } = this.state
    return (
      <ul>
        {
          list.map((line, index) => (
            <li className="line-item" key={`moving-average-config-dialog-line-item-${index}`}>
              <div className="day-count">
                <PropComponents.Spinner
                  min={2}
                  data={line.dayCount}
                  unit={false}
                  onChange={(data) => { this.handleChangeDayCount(index, data) }}
                />
              </div>
              <div className="item-des">日均线</div>
              <i className="dmpicon-del del-btn" onClick={this.handleDeleteLine.bind(this, index)}/>
            </li>
          ))
        }
      </ul>
    )
  }

  // 切换dayCount
  handleChangeDayCount(index, data) {
    const list = _.cloneDeep(this.state.list)
    list[index].dayCount = data
    list[index].name = `${data}日均线`
    this.setState({ list })
  }

  // 添加均值曲线
  handleAddLine() {
    const list = _.cloneDeep(this.state.list)
    if (list.length >= 10) {
      this._showErr('最多只能添加10条均值曲线')
      return;
    }
    list.push({
      name: '5日均线',
      dayCount: 5,
      color: '#C7E0FF'
    })
    this.setState({ list })
  }

  // 删除均值曲线
  handleDeleteLine(index) {
    const list = _.cloneDeep(this.state.list)
    list.splice(index, 1)
    this.setState({ list })
  }

  // 确认提交
  handleSure() {
    const { onSure, onClose } = this.props
    const { list } = this.state
    const dayCounts = list.map(l => l.dayCount)
    // 如果去重后长度减小 说明存在相同的dayCount 禁止提交
    if (_.uniq(dayCounts).length < dayCounts.length) {
      this._showErr('存在相同的均线，请删除或重新设置')
      return;
    }
    onSure(list)
    onClose()
  }

  // 抛出错误提示
  _showErr(msg, delay = 3000) {
    clearTimeout(this.errTimer)
    this.setState({
      errMsg: {
        show: true,
        text: msg
      }
    }, () => {
      this.errTimer = setTimeout(() => {
        this.setState(preState => ({
          errMsg: {
            ...preState.errMsg,
            show: false
          }
        }))
      }, delay)
    })
  }
}

export default MovingAverageConfigDialog
