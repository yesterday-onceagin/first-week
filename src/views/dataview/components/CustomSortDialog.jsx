import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';

import Button from 'react-bootstrap-myui/lib/Button';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Panel from 'react-bootstrap-myui/lib/Panel';

import TipMixin from '@helpers/TipMixin';

import './custom-sort-dialog.less';

const ICON_SHEET = {
  color: '#488DFB',
  width: '15px',
  fontStyle: 'italic',
  paddingLeft: '20px',
  paddingRight: '15px',
  fontSize: '13px',
  display: 'inline-block',
  textAlign: 'left'
}

const CustomSortDialog = createReactClass({
  displayName: 'CustomSortDialog',

  mixins: [TipMixin],

  propTypes: {
    show: PropTypes.bool,
    data: PropTypes.object,
    chartId: PropTypes.string,
    onSure: PropTypes.func,
    onClose: PropTypes.func,
    onSearch: PropTypes.func
  },

  getInitialState() {
    return {
      show: this.props.show,
      dimIndicators: [],
      dragToIndex: -1,  //拖动后的index
      currentIndex: -1, //拖动前index
      dragItem: null,
      haveData: true
    }
  },

  componentWillMount() {
    this._setDimsValues(this.props.data)
  },

  componentWillReceiveProps(nextProps) {
    const { show } = nextProps
    this.setState({
      show
    })
  },

  render() {
    const { show, dragToIndex, dimIndicators, haveData, currentIndex } = this.state
    return (
      show && <Dialog
        show={show}
        backdrop="static"
        onHide={this.handleClose}
        size={{ width: '450px', height: '340px' }}
        className="custom-sort-select-dialog"
        ref={(node) => { this.dialog = node }}>
        <Dialog.Header closeButton>
          <Dialog.Title>自定义排序</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="custom-sort-dialog-wrapper">
            <div className="center">
              <Panel>
                { haveData && <div className="tree-wrap" style={{ height: '100%' }}>
                  <div className="z-axis-list" onDragOver={this.handleDragOver} ref={(node) => { this.zAxisList = node }}>
                    {
                      dimIndicators.map((item, index) => (
                        <div draggable
                          key={`z-axis-item-${index}`}
                          className="z-axis-item"
                          onDragStart={this.handleDragStart.bind(this, item, index)}
                          onDragEnd={this.handleDragEnd}
                        >
                          <div
                            className="z-index-detail overflow-ellipsis"
                          >
                            <i className="dmp-field-icon" style={ICON_SHEET}>#</i>
                            <span className="name">{item.text}</span>
                          </div>
                        </div>
                      ))
                    }
                    { dragToIndex > -1 && <div className="line" style={{ position: 'absolute', width: '100%', top: (dragToIndex - 1 > currentIndex) ? `${dragToIndex * 30}px` :  `${(dragToIndex - 1) * 30}px` }}/> }
                  </div>
                </div>}
                {!haveData && <div className="nothing">暂无数据</div>}
              </Panel>
            </div>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSure}>确定</Button>
          <Button bsStyle="default" onClick={this.handleClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    )
  },

  // 设置维度值 现在每次打开Dialog都需要请求维度值,因为前端暂时无法判断filters是否发生变化
  _setDimsValues(data) {
    const { id, col_name, dataset_id, formula_mode } = data
    const { chartId } = this.props
    
    //加入formula_mode
    const selectKey = formula_mode ? `${formula_mode}_${col_name}` : col_name

    const params = {
      dataset_id,
      col_name: selectKey,
      dim: id,
      chart_id: chartId || ''
    }
    this.props.onSearch(params, (isSuccess, list) => {
      if (isSuccess && list.length > 0) {
        //加入index字段
        const dimList = []
        list.forEach((item) => {
          dimList.push({
            text: item
          })
        })
        this.setState({
          dimIndicators: dimList
        })
      } else {
        //暂无数据
        this.setState({
          haveData: false
        })
      }
    })
  },
  handleSure() {
    this.props.onSure(this.generateList())
  },

  handleClose() {
    this.props.onClose()
  },

  generateList() {
    const { dimIndicators } = this.state
    const list = []
    dimIndicators.forEach((i) => {
      list.push(i.text)
    })
    return list
  },

  handleDragStart(item, index) {
    this.setState({
      dragItem: item,
      currentIndex: index
    })
  },

  handleDragOver(e) {
    const { dragToIndex, dimIndicators } = this.state
    const { clientY } = e
    const offsetY = clientY + this.zAxisList.scrollTop - 70 - ((window.innerHeight / 2) - 170) + 15
    const itemHeight = 30
    let index = Math.round(offsetY / itemHeight)
    index = Math.max(1, index)
    index = Math.min(index, dimIndicators.length)
    if (dragToIndex !== index) {
      this.setState({
        dragToIndex: index
      })
    }
  },

  handleDragEnd() {
    // update zindex
    this._dragSeleted()
    this.setState({
      dragDiagram: null,
      dragToIndex: -1,
    })
  },

  _dragSeleted() {
    const { dragToIndex, dragItem, currentIndex, dimIndicators } = this.state
    // 交换数组对象的值
    dimIndicators.splice(currentIndex, 1)
    dimIndicators.splice(dragToIndex - 1, 0, dragItem)
    this.setState({
      dimIndicators
    })
  }
})

export default CustomSortDialog
