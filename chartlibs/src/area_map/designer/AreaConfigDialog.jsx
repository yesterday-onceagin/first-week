import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog'
import Button from 'react-bootstrap-myui/lib/Button'
import Input from 'react-bootstrap-myui/lib/Input'
import _ from 'lodash'
import './area-config-dialog.less'

const _generateDefaultName = (nameList) => {
  const prefix = '自定义区域'
  const nums = [0]
  nameList.forEach((name) => {
    const arr = name.split(prefix)
    const num = parseInt(arr[1], 10)
    if (!Number.isNaN(num)) {
      nums.push(num)
    }
  })
  return `${prefix}${Math.max.apply(null, nums) + 1}`
}

const _createNewGroup = name => ({
  name,
  areas: [],
  style: {
    fontSize: 14,
    color: 'rgba(255,255,255,1)',
    background: 'rgba(51, 107, 255, 0.2)',
    borderColor: 'rgba(44, 213, 255, 0.5)',
  }
})

export default class AreaConfigDialog extends React.Component {
  static propTypes = {
    onSure: PropTypes.func,
    onCancel: PropTypes.func,
    areaGroup: PropTypes.array,
  }

  constructor(props) {
    super(props)
    this.state = {
      mapState: {
        parsing: false,       // 正在解析地址
        parseError: false,   // 解析错误
        areaList: [],
      },
      areaGroupCopy: _.cloneDeep(props.areaGroup) || [],
      selectedIndex: 0,
      editIndex: -1,
      filter: '',
    }
  }

  componentDidMount() {
    this._chart = window.__areaDitu__
    this._handleParseAddressComplete = this.handleParseAddressComplete.bind(this)
    this._handleParseAddressFailed = this.handleParseAddressFailed.bind(this)
    if (!this._chart) {
      this.setState({
        mapState: {
          ...this.state.mapState,
          parseError: true
        }
      })
    } else if (this._chart.isParsing()) {
      this._chart.on('parseComplete', this._handleParseAddressComplete)
      this._chart.on('parseFailed', this._handleParseAddressFailed)
      this.setState({
        mapState: {
          ...this.state.mapState,
          parsing: true
        }
      })
    } else {
      this.setAreaListFromMap()
    }
  }

  componentWillUnmount() {
    // 注意一定要off, 否则可能带来bug
    if (this._chart) {
      this._chart.off('parseComplete', this._handleParseAddressComplete)
      this._chart.off('parseFailed', this._handleParseAddressFailed)
    }
  }

  componentDidUpdate(preProps, preState) {
    if (preState.editIndex !== this.state.editIndex) {
      this._nameInput && this._nameInput.select()
    }
  }

  render() {
    const { onCancel } = this.props
    const { filter } = this.state
    return (<Dialog
      show
      onHide={onCancel}
      className="area-config-dialog"
      size={{ width: '520px' }}
    >
      <Dialog.Header closeButton>
        <Dialog.Title>自定义区域设置</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <div>
          <div className="group-panel">
            <div className="head">
              自定义区域
              <button className="float-r" onClick={this.handleAddNewGroup.bind(this)}><i className="dmpicon-add"/></button>
            </div>
            <div className="group-list-container">
              {this.renderGroupList()}
            </div>
          </div>
          <div className="area-panel">
            <div className="head">
              地区
              <div className="form single-search-form search-input">
                <Input type="text"
                  placeholder="请输入关键字"
                  value={filter}
                  onChange={this.handleChangeFilter.bind(this)}
                  addonAfter={<i className="dmpicon-search" />}
                  className="search-input-box" />
                {filter && <i className="dmpicon-close" onClick={this.handleClearFilter.bind(this)}></i>}
              </div>
              <button className="float-r" style={{ fontSize: '12px' }} onClick={this.handleSelectAllToGroup.bind(this)}>全选</button>
            </div>
            <div className="area-list-container">
              {this.renderAreaList()}
            </div>
          </div>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button bsStyle="primary" onClick={this.handleSure.bind(this)}>确定</Button>
        <Button bsStyle="default" onClick={onCancel}>取消</Button>
      </Dialog.Footer>
    </Dialog>)
  }

  renderGroupList() {
    const { areaGroupCopy, selectedIndex, editIndex } = this.state
    return (<ul>
      {areaGroupCopy.map((group, i) => {
        const cityTitle = `包含: ${(group.areas.join(',') || '(空)')}`
        return <li key={i} className={`${i === selectedIndex && 'active'}`} onClick={this.handleSelectGroup.bind(this, i)}>
          <span title={cityTitle} className="group-name">
            {editIndex === i ? <input ref={(node) => { this._nameInput = node }} value={group.name} onBlur={this.handleEditName.bind(this, -1)} onChange={this.handleEditGroupName.bind(this)}/> : group.name}
          </span>
          <button onClick={this.handleEditName.bind(this, i)}><i className="dmpicon-edit"/></button>
          <button onClick={this.handleDelete.bind(this, i)}><i className="dmpicon-del"/></button>
        </li>
      })}
    </ul>)
  }

  renderAreaList() {
    const { areaGroupCopy, selectedIndex } = this.state
    const { parsing, parseError } = this.state.mapState
    const data = areaGroupCopy[selectedIndex]
    let areasInGroup = []
    if (data) {
      areasInGroup = data.areas
    }
    if (parseError) {
      return (<div style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', paddingTop: '100px' }}>地图错误!</div>)
    }
    if (parsing) {
      return (<div style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', paddingTop: '100px' }}>地图正在解析地址, 请稍等...</div>)
    }
    const filteredList = this._getFilteredList()
    return (<ul>
      { filteredList.map((area, i) => <li title={area} key={i} onClick={this.handleToggleArea.bind(this, area)}>
        <span className="area-name">{area || '--'}</span>
        <i className={`icon-checkbox ${areasInGroup.indexOf(area) > -1 && 'checked'}`} />
      </li>) }
    </ul>)
  }

  _getFilteredList() {
    const { areaList } = this.state.mapState
    const { filter } = this.state
    let filteredList = areaList
    if (filter) {
      filteredList = filteredList.filter(areaName => areaName.indexOf(filter) > -1)
    }
    // 去掉其他区域已经选择的项目
    return filteredList
  }

  handleSelectGroup(i) {
    this.setState({
      selectedIndex: i
    })
  }

  handleAddNewGroup() {
    const { areaGroupCopy } = this.state
    const names = areaGroupCopy.map(group => group.name)
    const newName = _generateDefaultName(names)
    areaGroupCopy.push(_createNewGroup(newName))
    this.setState({
      areaGroupCopy,
      editIndex: areaGroupCopy.length - 1,
      selectedIndex: areaGroupCopy.length - 1
    })
  }

  handleEditName(index) {
    this.setState({
      editIndex: index
    })
  }

  handleEditGroupName(e) {
    const val = e.target.value
    const { editIndex, areaGroupCopy } = this.state
    areaGroupCopy[editIndex].name = val
    this.setState({
      areaGroupCopy
    })
  }

  handleDelete(index) {
    const { areaGroupCopy } = this.state
    areaGroupCopy.splice(index, 1)
    this.setState({
      areaGroupCopy
    })
  }

  handleToggleArea(area) {
    const { areaGroupCopy, selectedIndex } = this.state
    const data = areaGroupCopy[selectedIndex]
    if (data) {
      const { areas } = data
      const index = areas.indexOf(area)
      index > -1 ? areas.splice(index, 1) : areas.push(area)
      areaGroupCopy[selectedIndex] = data
    }
    this.setState({
      areaGroupCopy
    })
  }

  handleSelectAllToGroup() {
    const { areaGroupCopy, selectedIndex, mapState } = this.state
    const data = areaGroupCopy[selectedIndex]
    if (data) {
      const filteredList = this._getFilteredList()
      if (data.areas.length < mapState.areaList.length) {
        data.areas = filteredList.concat([])
      } else {
        data.areas = []
      }
      areaGroupCopy[selectedIndex] = data
    }
    this.setState({
      areaGroupCopy
    })
  }

  setAreaListFromMap() {
    const areaList = this._chart.getAllAreaFromPoints()
    this.setState({
      mapState: {
        ...this.state.mapState,
        parsing: false,
        areaList,
      }
    })
  }

  handleSure() {
    this.props.onSure(this.state.areaGroupCopy)
  }

  handleParseAddressComplete() {
    this.setAreaListFromMap()
  }

  handleParseAddressFailed() {
    this.setAreaListFromMap()
  }

  handleChangeFilter(e) {
    this.setState({
      filter: e.target.value
    })
  }

  handleClearFilter() {
    this.setState({
      filter: ''
    })
  }
}
