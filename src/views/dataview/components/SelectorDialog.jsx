import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import Panel from 'react-bootstrap-myui/lib/Panel';
import Button from 'react-bootstrap-myui/lib/Button';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import icon4chart from '../constants/icon4chart'
import classnames from 'classnames'

import './selector-dialog.less'

class SelectorDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    selectorContainer: PropTypes.object,
    selectorList: PropTypes.object,
    diagramList: PropTypes.array,
    onClose: PropTypes.func,
    onSure: PropTypes.func
  };

  static defaultProps = {
    show: false
  };

  constructor(props) {
    super(props)
    const diagramList = props.diagramList || []
    this.state = {
      selectAll: diagramList.length > 0 ? this._isSelectAll(props.selectorList[diagramList[0].id], props.selectorContainer[diagramList[0].id]) : false,
      triggerList: diagramList,  //联动图表
      triggeredList: props.selectorContainer || {}, //可以被联动的图表
      selectedList: _.cloneDeep(props.selectorList),         //id:[]
      currentSelectedItem: diagramList.length > 0 ? diagramList[0].id : ''  //当前选中的联动图表
    }
  }

  render() {
    const { show, onClose } = this.props
    const { triggerList, triggeredList, currentSelectedItem, selectedList, selectAll } = this.state
    const currentList = triggeredList[currentSelectedItem] || []
    const isSelectAll = classnames('icon-checkbox', { checked: selectAll })
    const leftHeader = (<div>
      联动图表
    </div>)
    const rightHeader = (<div>
      被联动图表
      <span className="checkbox-wrapper" onClick={this.handleSelectAll.bind(this, !selectAll)} style={{ marginRight: currentList.length > 7 ? '17px' : '5px' }}>
        <i className={isSelectAll} />
      </span>
      <span className="select-all-label" >全选</span>
    </div>)
    return show && <Dialog
      show={show}
      onHide={onClose}
      backdrop="static"
      size={{ width: '510px', height: '410px' }}
    >
      <Dialog.Header closeButton>
        <Dialog.Title>自定义联动</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <div className="custom-selector-dialog-wrapper">
          <div className="left">
            <Panel header={leftHeader}>
              <div className="tree-wrap" style={{ height: '100%' }}>
                <div className="z-axis-list">
                  {
                    triggerList.map((item, index) => {
                      const classname = classnames('z-index-detail', {
                        active: item.id === currentSelectedItem,
                        'overflow-ellipsis': true
                      })
                      return (
                        <div
                          key={`z-axis-triggerList-${index}`}
                          className="z-axis-item"
                          onClick={this.setCurrentSelected.bind(this, item.id)}
                        >
                          <div className={classname}>
                            <i className={icon4chart(item.chart_code)} />
                            <span className="name overflow-ellipsis" title={item.name}>{item.name}</span>
                          </div>
                        </div>
                      )
                    })
                  }
                  {
                    triggerList.length === 0 && <div className="nothing">暂无联动图表</div>
                  }
                </div>
              </div>
            </Panel>
          </div>
          <div className="right">
            <Panel header={rightHeader}>
              <div className="tree-wrap" style={{ height: '100%' }}>
                <div className="z-axis-list">
                  {
                    currentList.length > 0 && currentList.map((item, index) => {
                      const isChecked = selectedList[currentSelectedItem] && selectedList[currentSelectedItem].indexOf(item.id) > -1
                      const cn = classnames('icon-checkbox', { checked: isChecked })
                      return (
                        <div
                          key={`z-axis-triggeredList-${index}`}
                          className="z-axis-item"
                        >
                          <div className="z-index-detail">
                            <span className="checkbox-wrapper" onClick={this.handleItemClick.bind(this, item, !isChecked)}><i className={cn} /></span>
                            <i className={icon4chart(item.chart_code)} />
                            <span className="name overflow-ellipsis" title={item.name}>{item.name}</span>
                          </div>
                        </div>
                      )
                    })
                  }
                  {
                    currentList.length === 0 && <div className="nothing">暂无可被联动图表</div>
                  }
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button bsStyle="primary" onClick={this.handleSure.bind(this)} >确定</Button>
        <Button bsStyle="default" onClick={onClose}>取消</Button>
      </Dialog.Footer>
    </Dialog>;
  }

  handleSure() {
    this.props.onSure(this.state.selectedList)
  }
  handleItemClick(item, status) {
    const { currentSelectedItem, selectedList, triggeredList } = this.state
    const newList = selectedList[currentSelectedItem] || []
    if (status) {
      newList.push(item.id)
    } else {
      _.remove(newList, itemId => itemId === item.id)
    }
    selectedList[currentSelectedItem] = newList
    this.setState({
      selectedList,
      selectAll: this._isSelectAll(newList, triggeredList[currentSelectedItem])
    })
  }

  //全选控制
  handleSelectAll(status) {
    const { currentSelectedItem, triggeredList, selectedList } = this.state
    const enableList = triggeredList[currentSelectedItem]
    const newList = []
    //如果设成true, 则当前选中联动图标下 所有可被联动图标勾选
    //如果当前并没有全选,则newList全部勾选
    if (status && !this._isSelectAll(selectedList[currentSelectedItem], triggeredList[currentSelectedItem])) {
      Array.isArray(enableList) && enableList.forEach((item) => {
        newList.push(item.id)
      })
    }
    selectedList[currentSelectedItem] = newList
    this.setState({
      selectedList,
      selectAll: status
    })
  }
  //判断当前是否全选
  _isSelectAll(list, triList) {
    if (Array.isArray(list) && Array.isArray(triList) && list.length === triList.length) {
      return true
    }
    return false
  }
  setCurrentSelected(id) {
    const { selectedList, triggeredList } = this.state
    this.setState({
      currentSelectedItem: id,
      selectAll: this._isSelectAll(selectedList[id], triggeredList[id])
    })
  }
}


export default SelectorDialog;
