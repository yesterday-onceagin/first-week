
import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import IconButton from '../../../components/IconButton'
import classnames from 'classnames'
import icon4chart from '../constants/icon4chart'

import './diagram-alignment-config.less'
import './chart-type-view.less'

const noop = () => { }

class ChartLayerManager extends React.Component {
  static propTypes = {
    selectedDiagrams: PropTypes.array,     // selected-list
    diagramList: PropTypes.array,          // chart-list
    gridLayout: PropTypes.array,           // grid-list
    onSelectChart: PropTypes.func,
    onUpdateGridLayout: PropTypes.func,
    onHoverDiagram: PropTypes.func,
    onDeleteSelectedDiagrams: PropTypes.func,
    onChangeLayerName: PropTypes.func
  };

  static defaultProps = {
    selectedDiagrams: [],
    diagramList: [],
    gridLayout: [],
    onSelectChart: noop,
    onUpdateGridLayout: noop,
  };

  constructor(props) {
    super(props)
    this.state = {
      dragDiagram: null,
      dragToIndex: -1,
      editlayers: {}
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.diagramList, this.props.diagramList)) {
      const layers = {}
      nextProps.diagramList && nextProps.diagramList.forEach((chart) => {
        layers[chart.id] = {
          name: chart.name
        }
      })
      this.setState({
        editlayers: layers
      })
    }
  }

  shouldComponentUpdate() {
    this._editNameInput = null
    return true
  }

  render() {
    const { selectedDiagrams } = this.props
    const { dragToIndex, editlayers } = this.state
    const sortedList = this._getSortedList()

    const hasSelected = selectedDiagrams.length
    const zBricksClass = classnames('bricks', {
      disabled: !hasSelected
    })
    return (<div className="diagram-design-panel">
      <div className="diagram-design-config-group">
        <div className="diagram-design-config-title" style={this.STYLE_SHEET.title}>图层管理</div>
        <div className="clearfix diagram-design-config-title" style={this.STYLE_SHEET.tools}>
          <ul className={zBricksClass}>
            <li title="上移一层" onClick={hasSelected ? this.hadnleClickReZindex.bind(this, false, false) : null}>
              <span className="icon-layer shangyi" />
            </li>
            <li title="下移一层" onClick={hasSelected ? this.hadnleClickReZindex.bind(this, true, false) : null}>
              <span className="icon-layer xiayi" />
            </li>
            <li title="置顶" onClick={hasSelected ? this.hadnleClickReZindex.bind(this, false, true) : null}>
              <span className="icon-layer zhiding" />
            </li>
            <li title="置底" onClick={hasSelected ? this.hadnleClickReZindex.bind(this, true, true) : null}>
              <span className="icon-layer zhidi" />
            </li>
          </ul>
        </div>
        <div className="z-axis-list" onDragOver={this.handleDragOver.bind(this)} ref={(node) => { this.zAxisList = node }}>
          {
            sortedList.map((item, index) => {
              const cn = classnames('icon-checkbox', { checked: selectedDiagrams.indexOf(item) > -1 })
              const isEditing = editlayers[item.id] && editlayers[item.id].isEditing
              return (
                <div draggable={!isEditing}
                  key={`z-axis-item-${index}`}
                  className="z-axis-item"
                  onDragStart={this.handleDragStart.bind(this, item)}
                  onDragEnd={this.handleDragEnd.bind(this)}
                >
                  <div
                    className="z-index-detail overflow-ellipsis"
                    onMouseEnter={this.handleItemHover.bind(this, item)}
                    onMouseLeave={this.handleItemHover.bind(this, null)}
                    onClick={this.handleItemClick.bind(this, item, false)}
                    style={{ position: 'relative' }}
                  >
                    <span className="checkbox-wrapper" onClick={this.handleItemClick.bind(this, item, true)}><i className={cn} /></span>
                    <i className={icon4chart(item.chart_code)} />
                    {
                      isEditing ? (
                        <input type="text"
                          value={editlayers[item.id].name}
                          className="name-input"
                          autoFocus
                          ref={(node) => { this._editNameInput = node }}
                          onFocus={this.onItemNameInputFocus.bind(this)}
                          onChange={this.handleItemNameChange.bind(this, item)}
                          onBlur={this.handleUpdateName.bind(this, item)}
                          onKeyDown={(e) => { e.nativeEvent.stopImmediatePropagation() }}
                          onKeyUp={this.handleKeyUp.bind(this)}
                        />
                      ) : (
                        <span
                          className="name"
                          title={editlayers[item.id].name}
                        >
                          <div style={this.STYLE_SHEET.editBlock} onDoubleClick={this.handleItemDbClick.bind(this, item)}/>
                          {editlayers[item.id].name}
                        </span>
                      )
                    }
                  </div>
                </div>
              )
            })
          }
          {dragToIndex > -1 && <div className="line" style={{ position: 'absolute', width: '100%', top: `${dragToIndex * 40}px` }} />}
        </div>
        <div className="delete-wrap">
          <IconButton onClick={this.handleDelete.bind(this)} disabled={!hasSelected} isNavBar iconClass="dmpicon-del">
            删除
          </IconButton>
        </div>
      </div>
    </div>)
  }

  handleDelete() {
    const { onDeleteSelectedDiagrams, selectedDiagrams } = this.props
    onDeleteSelectedDiagrams(1, selectedDiagrams)
  }

  handleDragStart(diagram) {
    this.setState({
      dragDiagram: diagram
    })
  }

  handleDragOver(e) {
    if (this._editNameInput) {
      return
    }
    const { diagramList } = this.props
    const { dragToIndex } = this.state
    const { clientY } = e
    const offsetY = clientY + this.zAxisList.scrollTop - 50 - 40 - 35
    const itemHeight = 40
    let index = Math.round(offsetY / itemHeight)
    index = Math.max(0, index)
    index = Math.min(index, diagramList.length)

    if (dragToIndex !== index) {
      this.setState({
        dragToIndex: index
      })
    }
  }

  handleDragEnd() {
    // update zindex
    this._dragSeleted()
    this.setState({
      dragDiagram: null,
      dragToIndex: -1,
    })
    const { gridLayout, onUpdateGridLayout } = this.props
    onUpdateGridLayout(gridLayout.concat([]))
  }

  // 当鼠标放到
  handleItemHover(item) {
    this.props.onHoverDiagram(item)
  }

  handleItemClick(item, toggle, e) {
    if (toggle) {
      e.stopPropagation()
    }
    this.props.onSelectChart(item, toggle)
  }

  handleItemDbClick(item) {
    this.setState((prevState) => {
      const { name } = prevState.editlayers && prevState.editlayers[item.id]
      return {
        editlayers: {
          ...prevState.editlayers,
          [item.id]: {
            isEditing: true,
            name: name || item.name
          }
        }
      }
    })
  }

  onItemNameInputFocus(e) {
    e && e.target && e.target.select()
  }

  // 输入框keyUp事件 针对回车键
  handleKeyUp(e) {
    if (e.keyCode === 13 && this._editNameInput) {
      this._editNameInput.blur()
    }
  }

  handleItemNameChange(item, e) {
    this.setState(prevState => ({
      editlayers: {
        ...prevState.editlayers,
        [item.id]: {
          isEditing: true,
          name: e.target && e.target.value
        }
      }
    }))
  }

  handleUpdateName(item, e) {
    const name = e.target && e.target.value
    if (name) {
      this.props.onChangeLayerName(item, name, () => {
        this.setState(prevState => ({
          editlayers: {
            ...prevState.editlayers,
            [item.id]: {
              isEditing: false,
              name
            }
          }
        }))
      })
    } else {
      e && e.target && e.target.focus()
    }
  }

  hadnleClickReZindex(up, endpoint) {
    const { gridLayout } = this.props
    this._reZindex(up, endpoint)
    this.props.onUpdateGridLayout(gridLayout.concat([]))
  }

  _getSortedList() {
    const { diagramList } = this.props
    return diagramList.concat([]).sort((a, b) => (this._getLayoutById(b.id).z - this._getLayoutById(a.id).z))
  }

  _getLayoutById(id) {
    const { gridLayout } = this.props
    for (let i = 0; i < gridLayout.length; i++) {
      const layout = gridLayout[i]
      if (layout.i === id) {
        return layout
      }
    }
    return {}
  }

  // down: true下移 false上移,  endpoint: true到端点, false移动一步
  // 算法的测量是交换zindex, 因为zIndex都是唯一的没有重复值
  _reZindex(down, endpoint, selectedDiagrams) {
    selectedDiagrams = selectedDiagrams || this.props.selectedDiagrams
    let sortedList = this._getSortedList()
    if (down) {
      sortedList = sortedList.reverse()
    }
    let preMoveIndex = -1;

    const swap = (index0, index1) => {
      const D0 = sortedList[index0]
      const D1 = sortedList[index1]
      const layout0 = this._getLayoutById(D0.id)
      const layout1 = this._getLayoutById(D1.id)
      const tempZ = layout0.z
      layout0.z = layout1.z
      layout1.z = tempZ
      sortedList[index0] = D1
      sortedList[index1] = D0
    }

    for (let i = 1; i < sortedList.length; i++) {
      // sortedList 的顺序一直没有变
      const preDiagram = sortedList[i - 1]
      const curDiagram = sortedList[i]
      // 和前一个交换zindex
      if (selectedDiagrams.indexOf(curDiagram) > -1) {
        // 如果有一个选中的在顶部, 那么第二个与第一个不需要交换
        const selectedOnTop = i === 1 && selectedDiagrams.indexOf(preDiagram) > -1
        // 如果前一个选中 但是没有交换, 那么此次不需要交换
        const preNotExchanged = preMoveIndex !== i - 1 && selectedDiagrams.indexOf(preDiagram) > -1
        if (selectedOnTop || preNotExchanged) {
          continue
        }
        // 到顶
        if (endpoint) {
          let j = i
          while (j > 0) {
            if (selectedDiagrams.indexOf(sortedList[j - 1]) === -1) {
              swap(j, j - 1)
            }
            j--
          }
        } else {
          // 移动一步
          swap(i, i - 1)
          preMoveIndex = i
        }
      }
    }
  }

  _dragSeleted() {
    let { selectedDiagrams } = this.props
    const { dragToIndex, dragDiagram } = this.state
    const sortedList = this._getSortedList()
    let dragToListIndex = dragToIndex
    let dragSelect = true
    // 如果是拖动没有选中的
    if (selectedDiagrams.indexOf(dragDiagram) === -1) {
      selectedDiagrams = [dragDiagram]
      dragSelect = false
    }
    // 计算出 需要移动到数组的索引, 因为dragToIndex是视觉上的, 需要减掉选中的个数
    for (let i = 0; i < dragToIndex; i++) {
      if (selectedDiagrams.indexOf(sortedList[i]) > -1) {
        dragToListIndex--
      }
    }
    // 先移动到顶部, 然后移动dragToIndex步
    this._reZindex(false, true, !dragSelect && [dragDiagram])
    for (let i = 0; i < dragToListIndex; i++) {
      this._reZindex(true, false, !dragSelect && [dragDiagram])
    }
  }

  STYLE_SHEET = {
    title: {
      position: 'relative',
      textAlign: 'center',
      paddingLeft: 0,
      height: 40,
      lineHeight: '39px',
      fontSize: '12px',
      cursor: 'pointer',
      borderBottomStyle: 'solid',
      borderBottomWidth: 1
    },
    tools: {
      padding: '2px 12px',
      borderBottomStyle: 'solid',
      borderBottomWidth: 1
    },
    editBlock: {
      position: 'absolute',
      right: 0,
      top: 0,
      left: '56px',
      height: '40px'
    }
  }
}

export default ChartLayerManager

