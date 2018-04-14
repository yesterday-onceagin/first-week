import PropTypes from 'prop-types';
import React from 'react';

import Button from 'react-bootstrap-myui/lib/Button'
import Dialog from 'react-bootstrap-myui/lib/Dialog'
import Input from 'react-bootstrap-myui/lib/Input'
import Select from 'react-bootstrap-myui/lib/Select'
import Panel from 'react-bootstrap-myui/lib/Panel'
import _ from 'lodash'
import classnames from 'classnames'
import { Select as TreeSelect, Tree } from 'rt-tree'

import 'rt-tree/dist/css/rt-select.css'
import './url-setting-dialog.less'

class UrlSettingDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    onSure: PropTypes.func.isRequired,
    onClose: PropTypes.func,
    loadReportFilters: PropTypes.func,
    configItem: PropTypes.object.isRequired,
    configType: PropTypes.string.isRequired,
    configDims: PropTypes.array,
    reportTreeList: PropTypes.array,
    getReportList: PropTypes.func
  };
  static ICON_STYLE_SHEET = {
    fontFamily: "'dmpicon' !important",
    speak: 'none',
    fontStyle: 'normal',
    fontWeight: 'normal',
    fontVariant: 'normal',
    textTransform: 'none',
    lineHeight: 1,
    color: '#24BBF9',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale'
  };
  constructor(props) {
    super(props)
    this.state = this._generateConfigObj(props)
  }
  componentWillMount() {
    const { selectedScreen } = this.state
    if (selectedScreen[0]) {
      this.resetDashboardFilters(selectedScreen[0])
    }
    const callback = (tree) => {
      this.setState({
        reportTreeList: tree || []
      })
    }
    this.props.getReportList(callback)
  }

  render() {
    const { show, onClose, configType } = this.props
    const { selectedScreen, target_type, directWay, alias, dashboard_filter_id, dashboard_filters, reportTreeList, checked, dimsConfig, target } = this.state
    const iconClass = classnames('icon-checkbox', { checked })
    return (
      show && <Dialog
        show={show}
        onHide={onClose}
        backdrop="static"
        size={{ width: '450px', height: '450px' }}
        className="url-settings-dialog-wrapper"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>跳转设置</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="form-group" style={{ height: '30px' }}>
            <div className="col-xs-3" style={{ paddingRight: 0, lineHeight: '30px' }}>
              <label className="control-label">选择跳转方式</label>
            </div>
            <div className="col-xs-9">
              <div className="input-wrapper" >
                <Select value={target_type || 'dashboard'} maxHeight={180} width='100%' type='single' onSelected={this.handleTypeSelect.bind(this)}>
                  <option value="dashboard">报告跳转</option>
                  <option value="url">url跳转</option>
                </Select>
              </div>
            </div>
          </div>
          {
            target_type === 'url' && <div className="form-group" style={{ height: '100px' }}>
              <div className="col-xs-3" style={{ paddingRight: 0, lineHeight: '30px' }}>
                <label className="control-label">输入网页地址</label>
              </div>
              <div className="col-xs-9">
                <div className="input-wrapper" >
                  <Input type='textarea'
                    ref={(node) => { this.textAreaNode = node }}
                    value={target}
                    style={{
                      backgroundColor: 'rgba(10, 33, 56, 0.3)',
                      color: '#577598',
                      border: 'none',
                      height: '100px',
                      resize: 'none',
                      overflowY: 'auto'
                    }}
                    onChange={this.handleTextarea.bind(this)}
                    width='100%'
                  />
                </div>
              </div>
            </div>
          }
          {
            target_type === 'dashboard' && this._renderSelectReport(reportTreeList, selectedScreen)
          }
          {
            target_type === 'dashboard' && configType === 'dims'
            && Array.isArray(dashboard_filters)
            && dashboard_filters.length > 1
            && this._renderFilterRelate(dashboard_filter_id, dashboard_filters, alias)
          }
          {
            target_type === 'dashboard' && configType === 'numerices'
            && dashboard_filters.length > 1 && dimsConfig.length > 0
            && this._renderNumsRelate(dimsConfig, dashboard_filters)
          }
          <div className="form-group" style={{ height: '90px', paddingLeft: '15px' }}>
            <label className="control-label">跳转打开方式</label>
            <div className="input-wrapper" style={{ marginTop: '10px' }}>
              <Input
                type="radio"
                name="way"
                label="当前窗口打开"
                checked={directWay === 1}
                onChange={this.handleRadio.bind(this, 1)}
                customerNode={{ hover: false }}
              />
              <Input
                type="radio"
                name="way"
                label="新窗口打开"
                checked={directWay === 2}
                onChange={this.handleRadio.bind(this, 2)}
              />
            </div>
          </div>
          <div className="form-group" style={{ height: '60px', paddingLeft: '15px' }}>
            <label className="control-label">是否启用设置</label>
            <span style={{ margin: '0 0 0 40px' }}><i className={iconClass} onClick={this.handleChecked.bind(this, !checked)} /></span>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSure.bind(this)}>确定</Button>
          <Button bsStyle="default" onClick={onClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    )
  }

  _renderSelectReport(tree, screen) {
    return (
      <div className="form-group" style={{ height: '30px' }}>
        <div className="col-xs-3" style={{ paddingRight: 0, lineHeight: '30px' }}>
          <label className="control-label">选择跳转报告</label>
        </div>
        <div className="col-xs-9">
          <div className="input-wrapper" >
            <TreeSelect ref={(instance) => { this.tree_select = instance }} style={{ width: '100%' }} menuStyle={{ width: '100%', height: '200px' }} search>
              <Tree
                data={tree || []}
                defaultExpanded={this.getDefaultExpanded()}
                selected={screen}
                customerIcon={this.genrateIcon}
                onChange={this.onAdd.bind(this)}
              />
            </TreeSelect>
          </div>
        </div>
      </div>
    )
  }

  _renderFilterRelate(id, filters, alias) {
    return (
      <div className="form-group" style={{ height: '90px' }}>
        <div className="col-xs-3" style={{ paddingRight: 0, lineHeight: '90px', height: '90px' }}>
          <label className="control-label">筛选器关联</label>
        </div>
        <div className="col-xs-9" style={{ height: '90px' }}>
          <div className="right">
            <Panel>
              <div className="tree-wrap" style={{ height: '100%' }}>
                <div className="z-axis-list">
                  {
                    this.renderRelatedDetail(id, filters, alias)
                  }
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    )
  }
  _renderNumsRelate(dims, filters) {
    const { related_dims } = this.state
    return (
      <div className="form-group" style={{ height: '90px' }}>
        <div className="col-xs-3" style={{ paddingRight: 0, lineHeight: '90px', height: '90px' }}>
          <label className="control-label">筛选器关联</label>
        </div>
        <div className="col-xs-9" style={{ height: '90px' }}>
          <div className="right">
            <Panel>
              <div className="tree-wrap" style={{ height: '100%' }}>
                <div className="z-axis-list">
                  {
                    dims.map((item, i) => {
                      let id = ''
                      const _index = _.findIndex(related_dims, target => target.chart_dim === item.id)
                      if (_index > -1) {
                        id = related_dims[_index].dashboard_filter_id
                      }
                      return (<div className="z-axis-item" key={`z-axis-item-${i}`}>
                        <div className="z-index-detail">
                          <div className="row">
                            <div className="col-xs-5" style={{ paddingRight: 0 }}>
                              <span style={{ border: '1px solid #263355', width: '100%', height: '32px', textIndent: '10px', display: 'inline-block', lineHeight: '32px' }}>
                                {item.alias_name}
                              </span>
                            </div>
                            <div className="col-xs-2" style={{ padding: 0, textAlign: 'center' }}>
                              <span style={{ lineHeight: '32px' }}> = </span>
                            </div>
                            <div className="col-xs-5" style={{ paddingLeft: 0 }}>
                              <Select value={id || ''} openSearch maxHeight={180} width='100%' type='single' showMultipleBar={false} onSelected={this.handleNumsSelect.bind(this, item.id)}>
                                {filters.map((filter, index) => <option key={index} value={filter.id}>{filter.alias_name || filter.col_name}</option>)}
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                      )
                    })
                  }
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    )
  }

  renderRelatedDetail(id, filters, alias) {
    return (
      <div className="z-axis-item">
        <div className="z-index-detail">
          <div className="row">
            <div className="col-xs-5" style={{ paddingRight: 0 }}>
              <span style={{ border: '1px solid #263355', width: '100%', height: '32px', textIndent: '10px', display: 'inline-block', lineHeight: '32px' }}>
                {alias}
              </span>
            </div>
            <div className="col-xs-2" style={{ padding: 0, textAlign: 'center' }}>
              <span style={{ lineHeight: '32px' }}> = </span>
            </div>
            <div className="col-xs-5" style={{ paddingLeft: 0 }}>
              <Select value={id || ''} openSearch maxHeight={180} width='100%' type='single' showMultipleBar={false} onSelected={this.handleSelect.bind(this)}>
                {filters.map((filter, i) => <option key={i} value={filter.id}>{filter.alias_name || filter.col_name}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </div>
    )
  }

  _generateConfigObj(props) {
    const { alias_name, col_name, dashboard_jump_config } = props.configItem
    const { configType, configDims } = props
    const selectedScreen = []
    const dimsConfig = []
    let related_dims = []
    //url或者id
    let targetStr = ''
    let dashboard_id = ''
    let direct = 1
    let checked = true
    let name = ''
    let targetType = 'dashboard'

    //dimsConfig用来在数值跳转时存储当前维度list
    configDims.length > 0 && configDims.forEach((item) => {
      const dimAlias = item.alias_name || item.col_name
      const dimId = item.id || item.dim
      dimsConfig.push({
        id: dimId,
        alias_name: dimAlias
      })
    })
    if (dashboard_jump_config) {
      let newData = {}
      if (typeof dashboard_jump_config === 'string') {
        newData = JSON.parse(dashboard_jump_config)
      } else {
        newData = dashboard_jump_config
      }
      //数值跳转和维度跳转
      targetType = newData.target_type || 'dashboard'
      name = newData.dashboard_name
      direct = newData.direct_way
      checked = newData.isOpen
      if (configType === 'numerices') {
        if (targetType === 'dashboard') {
          selectedScreen.push(newData.target)
        } else {
          targetStr = newData.target
        }
        related_dims = [...newData.related_dims]
        if (newData.related_dims && newData.related_dims.length > 0) {
          const indexList = []
          newData.related_dims.forEach((dim, i) => {
            //如果维度存在
            const _index = _.findIndex(dimsConfig, d => d.id === dim.chart_dim)
            if (_index === -1) indexList.push(i)
          })
          indexList.forEach((index) => {
            related_dims.splice(index, 1)
          })
        }
      } else if (configType === 'dims') {
        if (targetType === 'dashboard') {
          selectedScreen.push(newData.target_dashboard_id)
        } else {
          targetStr = newData.target
        }
        dashboard_id = newData.dashboard_filter_id
      }
    }
    return {
      checked,
      selectedScreen,
      dimsConfig,                   //维度列表存储
      related_dims,                 //numerices类型跳转设置
      directWay: direct,            //跳转方式
      target_type: targetType,      //跳转类型
      directType: configType,       //跳转设置类型 dims或者是numerices
      alias: alias_name || col_name,
      dashboard_filters: [],
      dashboard_filter_id: dashboard_id,
      target: targetStr,
      reportTreeList: [],
      selectedScreenName: name
    }
  }

  getDefaultExpanded() {
    return []
  }

  onAdd(id, data) {
    //如果类型是文件类型才能被选中
    if (data[0] && data[0].type === 'FILE') {
      this.resetDashboardFilters(id[0])
      this.setState({
        selectedScreen: id,
        selectedScreenName: data[0].name
      })
    }
  }

  resetDashboardFilters(id) {
    const loadFilter = (json) => {
      if (Array.isArray(json) && json.length > 0) {
        this.setState({
          dashboard_filters: [{
            id: '',
            alias_name: '无'
          }].concat(json)
        })
      } else {
        //如果报告没有报告级筛选 则清空dashboard_filter_id
        this.setState({
          dashboard_filters: [],
          dashboard_filter_id: '',
          related_dims: []
        })
      }
    }
    this.props.loadReportFilters(id, loadFilter)
  }

  handleTypeSelect(option) {
    this.setState({
      target_type: option.value
    })
  }

  handleNumsSelect(id, option) {
    const { related_dims } = this.state
    const _index = _.findIndex(related_dims, target => target.chart_dim === id)
    //related_dims设置
    if (_index > -1 && option.value === '') {
      related_dims.splice(_index, 1)
    } else if (_index > -1 && option.value !== '') {
      related_dims[_index].dashboard_filter_id = option.value
    } else if (_index === -1) {
      related_dims.push({
        chart_dim: id,
        chart_alias: option.text,
        dashboard_filter_id: option.value
      })
    }
    this.setState({
      related_dims
    })
  }
  handleSelect(option) {
    this.setState({
      dashboard_filter_id: option.value
    })
  }
  handleRadio(value) {
    this.setState({
      directWay: value
    })
  }
  handleTextarea() {
    const { value } = this.textAreaNode.input
    this.setState({
      target: value
    })
  }

  handleChecked(value) {
    this.setState({
      checked: value
    })
  }
  genrateIcon(item, expanded) {
    let className = expanded ? 'dmpicon-folder-open' : 'dmpicon-folder-close'
    if (item.type !== 'FOLDER') {
      className = 'dmpicon-chart'
    }
    return <i className={className} style={UrlSettingDialog.ICON_STYLE_SHEET} />
  }

  handleSure() {
    const { target, target_type, related_dims } = this.state
    const reg = new RegExp(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/)
    //校验URL
    if (target_type === 'url' && !reg.test(target)) {
      this.props.showErr('请输入正确格式的url')
      return
    }
    //校验dashboard_filter_id不能重复
    if (related_dims.length > 1) {
      const filter_id = related_dims[0].dashboard_filter_id
      const relatedDims = [...related_dims]
      relatedDims.splice(0, 1)
      if (_.findIndex(relatedDims, dim => dim.dashboard_filter_id === filter_id) > -1) {
        this.props.showErr('不同维度必须关联不同的报告筛选条件')
        return
      }
    }
    this.props.onSure({ ...this.state })
  }
}

export default UrlSettingDialog
