import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog'
import Button from 'react-bootstrap-myui/lib/Button'
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';

import classnames from 'classnames'
import _ from 'lodash'
import icon4chart from '@views/dataview/constants/icon4chart'

class TabConfigDialog extends React.PureComponent {
  static propTypes = {
    onSure: PropTypes.func,
    onClose: PropTypes.func,
    data: PropTypes.object,
    diagramList: PropTypes.array,
    dashboardTabData: PropTypes.object,
    chartId: PropTypes.string
  };

  constructor(props) {
    super(props)
    const { data, diagramList, chartId } = props
    this.state = {
      editIndex: -1,
      activeTabIndex: 0,
      ...this._converValidData(data, diagramList, chartId)
    }
  }

  componentWillReceiveProps(nextProps) {
    const { data, diagramList, chartId } = nextProps
    const chartChanged = chartId !== this.props.chartId
    const dataChanged = !_.isEqual(data, this.props.data)
    if (chartChanged || dataChanged || !_.isEqual(diagramList, this.props.diagramList)) {
      this.setState(preState => ({
        editIndex: -1,
        activeTabIndex: chartChanged || dataChanged ? 0 : preState.activeTabIndex,
        ...this._converValidData(data, diagramList, chartId)
      }))
    }
  }

  componentDidUpdate(preProps, preState) {
    if (preState.editIndex !== this.state.editIndex && this.state.editIndex !== -1) {
      this.nameInput && this.nameInput.select()
    }
  }

  render() {
    const { onClose } = this.props
    const { tabConfigArray } = this.state
    const hasValidTab = Array.isArray(tabConfigArray) && tabConfigArray.length > 0;
    return (
      <Dialog
        show
        onHide={onClose}
        className="simple-tab-config-dialog"
        backdrop="static"
        size={{ width: '520px', height: '500px' }}
      >
        <Dialog.Header closeButton>
          <Dialog.Title>标签配置</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="tab-list-container" style={hasValidTab ? null : {
            width: '100%',
            float: 'none',
            margin: 0
          }}>
            <div className="container-title">
              Tab标签
              <i className="dmpicon-add" onClick={this.handleAddTab.bind(this)}/>
            </div>
            <div className="tab-items list-box form">
              {
                hasValidTab ? this.renderTabList() : (
                  <div className="hint-text-box">请先添加一个Tab标签</div>
                )
              }
            </div>
          </div>
          {hasValidTab && this.renderDiagramList()}
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSure.bind(this)}>确定</Button>
          <Button bsStyle="default" onClick={onClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    )
  }

  // 渲染tab标签列表
  renderTabList() {
    const { editIndex, activeTabIndex, tabConfigArray } = this.state
    const editMode = editIndex !== -1
    const SortableItem = SortableElement(({ item, tabIndex }) => {
      const liClass = classnames('simple-tab-config-dialog-tab-list-item', {
        active: tabIndex === activeTabIndex
      })
      const isEditing = tabIndex === editIndex
      return (
        <li className={liClass}
          onClick={isEditing ? null : this.handleChangeActiveTab.bind(this, tabIndex)}
          onDoubleClick={this.handleEditTabName.bind(this, tabIndex)}
          onDragStart={(e) => { e.preventDefault() }}
        >
          {item.name}
          <div className="action-box">
            <i className="dmpicon-edit" onClick={this.handleEditTabName.bind(this, tabIndex)}/>
            <i className="dmpicon-del" onClick={this.handleDeleteTab.bind(this, tabIndex)}/>
          </div>
        </li>
      );
    });

    const SortableList = SortableContainer(({ items }) => (
      <ul className="sortable-list simple-tab-config-dialog-tab-list">
        {
          items.map((item, index) => (
            <SortableItem
              key={`simple-tab-config-dialog-tab-list-item-${index}-${item.name}`}
              index={index}
              tabIndex={index}
              disabled={index === editIndex}
              item={item}
            />
          ))
        }
      </ul>
    ));

    // 区分不同的模式 因为sort组件的渲染方式问题 每次input发生change事件都会失焦
    return editMode ? (
      <ul className="sortable-list simple-tab-config-dialog-tab-list">
        {
          tabConfigArray.map((item, tabIndex) => {
            const liClass = classnames('simple-tab-config-dialog-tab-list-item', {
              active: tabIndex === activeTabIndex
            })
            const isEditing = tabIndex === editIndex

            return (
              <li className={liClass}
                key={`simple-tab-config-dialog-tab-list-item-${tabIndex}`}
                onClick={isEditing ? null : this.handleChangeActiveTab.bind(this, tabIndex)}
                onDoubleClick={this.handleEditTabName.bind(this, tabIndex)}
                onDragStart={(e) => { e.preventDefault() }}
              >
                {
                  isEditing ? (
                    <input
                      ref={(node) => { this.nameInput = node }}
                      type="text"
                      value={item.name}
                      onChange={this.handleChangeTabName.bind(this)}
                      onBlur={this.handleEditTabName.bind(this, -1)}
                    />
                  ) : [
                    item.name,
                    <div className="action-box" key={`tab-list-item-action-box-${tabIndex}`}>
                      <i className="dmpicon-edit" onClick={this.handleEditTabName.bind(this, tabIndex)}/>
                      <i className="dmpicon-del" onClick={this.handleDeleteTab.bind(this, tabIndex)}/>
                    </div>
                  ]
                }
              </li>
            )
          })
        }
      </ul>
    ) : (
      <SortableList
        items={tabConfigArray}
        helperClass="sorting"
        lockAxis="y"
        distance={10}
        lockToContainerEdges={true}
        onSortEnd={this.handleTabRankChange.bind(this)}
      />
    )
  }

  renderDiagramList() {
    const { dashboardTabData, chartId } = this.props
    const { restDiagramList, tabConfigArray, activeTabIndex } = this.state
    // 得到当前tab当前标签已选择的组件
    const currConfigTabDiagrams = _.get(tabConfigArray, `${activeTabIndex}.charts`) || []
    // 得到当前tab组件中其他标签选中的组件
    const currConfigOtherTabDiagrams = _.concat(..._.filter(tabConfigArray, (o, i) => i !== activeTabIndex).map(t => t.charts || []))
    // 得到其他tab组件中关联的所有单图
    const chartsInOtherTab = _.concat(..._.filter(_.keys(dashboardTabData), id => id !== chartId).map(tabId => (
      _.concat(..._.get(dashboardTabData, [tabId, 'data'], []))
    )))
    // 合并（不可用的tab）
    const disabledCharts = _.concat(chartsInOtherTab, currConfigOtherTabDiagrams)
    // 检查是否所有的组件都在当前被选择的组件中
    const validCharts = _.filter(restDiagramList, c => (
      disabledCharts.indexOf(c.id) === -1 && (!Array.isArray(c.subTabs) || c.subTabs.length === 0)
    ))
    // 是否全部选中
    const isSelectAll = validCharts.length > 0 ? validCharts.every(c => currConfigTabDiagrams.indexOf(c.id) > -1) : false
    // 全选外框的样式
    const selectAllBoxClass = classnames('select-all', {
      disabled: validCharts.length === 0
    })
    // 生成checkbox的classname
    const selectAllClass = classnames('icon-checkbox', {
      'some-checked': !isSelectAll && currConfigTabDiagrams.length > 0,
      checked: isSelectAll
    })
    // 需要渲染的组件
    let element;
    // 没有可配置组件时（连不可用组件也没有 除自身外无其他单图的情况）
    if (restDiagramList.length === 0) {
      element = (
        <div className="hint-text-box">
          <span style={{ marginBottom: '10px' }}>没有可配置的组件</span>
          <span>请返回画布添加</span>
        </div>
      )
    } else {
      // 将不可用的排在后面
      const sorted = _.sortBy(restDiagramList, (c) => {
        if (disabledCharts.indexOf(c.id) > -1 || (Array.isArray(c.subTabs) && c.subTabs.length > 0)) {
          return 1
        }
        return 0
      })
      const diagramListClass = classnames('simple-tab-config-dialog-diagram-list', {
        // 因高度固定 此处可简单处理 直接确定超过11个就会出现滚动条
        'has-scroll-bar': sorted.length > 11
      })
      element = (
        <ul className={diagramListClass}>
          {
            sorted.map((item) => {
              const isInOtherTab = disabledCharts.indexOf(item.id) > -1
              const doHaveSubTab = Array.isArray(item.subTabs) && item.subTabs.length > 0
              const isChecked = _.findIndex(currConfigTabDiagrams, o => o === item.id) > -1
              const checkboxClass = classnames('icon-checkbox', {
                checked: isChecked
              })
              const isDisabled = isInOtherTab || doHaveSubTab
              const liClass = classnames('simple-tab-config-dialog-diagram-list-item', {
                disabled: isDisabled
              })
              return (
                <li className={liClass}
                  key={`simple-tab-config-dialog-diagram-list-item-${item.id}`}
                  onClick={this.handleSelectChart.bind(this, item.id, isChecked)}
                  title={doHaveSubTab ? '已包含一个Tab组件' : (isInOtherTab ? '已被其他Tab选择' : '')}
                >
                  <i className={classnames(['chart-icon', icon4chart(item.chart_code)], {
                    disabled: isDisabled
                  })} />
                  {item.name}
                  {isDisabled ? '(不可用)' : <i className={checkboxClass} />}
                </li>
              )
            })
          }
        </ul>
      )
    }

    return (
      <div className="diagram-list-container">
        <div className="container-title">
          选择组件
          <span className={selectAllBoxClass}>
            全选
            <i className={selectAllClass} onClick={this.handleSelectAllChart.bind(this, isSelectAll, validCharts)} />
          </span>
        </div>
        <div className="list-box">
          {element}
        </div>
      </div>
    )
  }

  // 新增tab
  handleAddTab() {
    this.setState((preState) => {
      const newNameLen = _.filter(preState.tabConfigArray, t => /^新增tab/.test(t.name)).length
      const name = `新增tab${newNameLen > 0 ? newNameLen : ''}`
      
      return {
        tabConfigArray: preState.tabConfigArray.concat({
          name,
          charts: []
        })
      }
    })
  }

  // 删除tab
  handleDeleteTab(tabIndex) {
    this.setState(preState => ({
      tabConfigArray: preState.tabConfigArray.filter((d, i) => i !== tabIndex)
    }))
  }

  // 编辑tab名称
  handleEditTabName(tabIndex) {
    console.log(tabIndex)
    this.setState({
      editIndex: tabIndex
    })
  }

  // 变更tab标签名称
  handleChangeTabName(e) {
    const newName = e.target.value
    const { tabConfigArray, editIndex } = this.state
    tabConfigArray[editIndex].name = newName
    this.setState({
      tabConfigArray: tabConfigArray.slice()
    })
  }

  // 单图全选
  handleSelectAllChart(isAllChecked, validCharts) {
    this.setState((preState) => {
      const { activeTabIndex, tabConfigArray } = preState
      let newArray

      if (isAllChecked) {
        newArray = []
      } else {
        newArray = validCharts.map(c => c.id)
      }

      tabConfigArray[activeTabIndex].charts = newArray

      return {
        tabConfigArray: tabConfigArray.slice()
      }
    })
  }

  // 选择单图
  handleSelectChart(id, isChecked) {
    this.setState((preState) => {
      const { activeTabIndex, tabConfigArray } = preState
      const newArray = _.get(tabConfigArray, `${activeTabIndex}.charts`) || []

      if (isChecked) {
        _.remove(newArray, o => o === id)
      } else {
        newArray.push(id)
      }

      tabConfigArray[activeTabIndex].charts = newArray

      return {
        tabConfigArray: tabConfigArray.slice()
      }
    })
  }

  // 切换激活的tab
  handleChangeActiveTab(index) {
    // if (this.state.editIndex !== -1) {
    //   this.handleStopEditTabName()
    // }
    this.setState({
      activeTabIndex: index
    })
  }

  // 切换排序
  handleTabRankChange({ oldIndex, newIndex }) {
    let newActiveTabIndex = this.state.activeTabIndex;

    if (newActiveTabIndex === oldIndex) {
      // 如果移动的是当前激活的tab 那么将激活的index设置为newIndex
      newActiveTabIndex = newIndex
    } else if (oldIndex < newActiveTabIndex && newIndex >= newActiveTabIndex) {
      // 如果将tab从激活的tab上方移动到下方，则激活的tabIndex -1
      newActiveTabIndex--
    } else if (oldIndex > newActiveTabIndex && newIndex <= newActiveTabIndex) {
      // 如果将tab从激活的tab下方移动到上方，则激活的tabIndex +1
      newActiveTabIndex++
    }
    this.setState(preState => ({
      activeTabIndex: newActiveTabIndex,
      tabConfigArray: arrayMove(preState.tabConfigArray, oldIndex, newIndex)
    }))
  }

  // 确认并关闭窗口
  handleSure() {
    this.props.onSure({
      ...this.props.data,
      tabs: this.state.tabConfigArray
    })
    this.props.onClose()
  }

  // 数据合法化
  _converValidData(data, diagramList, chartId) {
    data = _.cloneDeep(data)
    diagramList = _.cloneDeep(diagramList)
    const restDiagramList = _.filter(diagramList, o => o.id !== chartId)
    let newData
    if (data && Array.isArray(data.tabs) && data.tabs.length > 0) {
      newData = data.tabs.map((tab) => {
        if (Array.isArray(tab.charts) && tab.charts.length > 0) {
          // 过滤掉不在列表中的组件
          tab.charts = tab.charts.filter(cid => _.findIndex(restDiagramList, d => d.id === cid) > -1)
        } else {
          tab.charts = []
        }
        return tab
      })
    } else {
      newData = []
    }

    return {
      tabConfigArray: newData,
      restDiagramList
    }
  }
}

export default TabConfigDialog
