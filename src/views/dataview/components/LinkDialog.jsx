import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import Panel from 'react-bootstrap-myui/lib/Panel';
import Button from 'react-bootstrap-myui/lib/Button';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Select from 'react-bootstrap-myui/lib/Select'
import icon4chart from '../constants/icon4chart'
import classnames from 'classnames'

import './link-dialog.less'

class LinkDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    data: PropTypes.object,
    linkList: PropTypes.object,
    diagramList: PropTypes.array,
    sourceList: PropTypes.array,
    dataSetTree: PropTypes.array,
    onClose: PropTypes.func,
    onSure: PropTypes.func,
    onGetRelatedsource: PropTypes.func
  };

  static defaultProps = {
    show: false
  };

  constructor(props) {
    super(props)
    const current = props.data && props.data.dims.length > 0 ? props.data.dims[0].col_name : ''
    const list = props.linkList && props.linkList.list ? props.linkList.list : []
    const linkList = []
    const linkRelation = props.linkList && props.linkList.relation ? _.cloneDeep(props.linkList.relation) : {}
    const diagramList = props.diagramList || []
    //防止删除单图导致异常
    list.forEach((id) => {
      if (_.find(diagramList, dia => dia.id === id)) {
        linkList.push(id)
      }
    })
    this.state = {
      diagramList,                              //可以被联动的图表
      linkList,
      linkRelation,
      selectAll: this._isSelectAll(linkList, diagramList),
      sourceList: props.sourceList,             // 单图数据集列表
      relatedsourceList: this.getRelatedsource(linkList, diagramList, props.data),                    // 已被关联的数据集id列表
      relatedsource: [],                        // 后台返回的数据集与数据集字段
      currentTab: current
    }
  }

  componentWillMount() {
    //初始化relatedsource 后台返回的数据集
    const { onGetRelatedsource } = this.props
    const callback = (data) => {
      this.setState({
        relatedsource: data || []
      })
    }
    onGetRelatedsource && onGetRelatedsource(callback)
  }
  render() {
    const { show, onClose, data } = this.props
    console.log(this.props.sourceList)
    const { diagramList, linkList, selectAll, relatedsourceList, relatedsource } = this.state
    const isSelectAll = classnames('icon-checkbox', { checked: selectAll })
    return show && <Dialog
      show={show}
      onHide={onClose}
      backdrop="static"
      size={{ width: '510px', height: '520px' }}
    >
      <Dialog.Header closeButton>
        <Dialog.Title>筛选设置</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <div className="link-dialog-wrapper">
          <div className="link-heading">
            请选择需要与 {data.name} 联动的图表
            <span className="select-all-label" >全选</span>
            <span className="checkbox-wrapper" onClick={this.handleSelectAll.bind(this, !selectAll)}>
              <i className={isSelectAll} />
            </span>
          </div>
          <div className="center">
            <Panel>
              <div className="tree-wrap" style={{ height: '100%' }}>
                <div className="z-axis-list">
                  {
                    diagramList.length > 0 && diagramList.map((item, index) => {
                      const isChecked = linkList && linkList.indexOf(item.id) > -1
                      const cn = classnames('icon-checkbox', { checked: isChecked })
                      return (
                        <div
                          key={`z-axis-diagramList-${index}`}
                          className="z-axis-item"
                        >
                          <div className="z-index-detail" onClick={this.handleItemClick.bind(this, item, !isChecked)}>
                            <span className="checkbox-wrapper"><i className={cn} /></span>
                            <i className={icon4chart(item.chart_code)} />
                            <span className="name overflow-ellipsis" title={item.name}>{item.name}</span>
                          </div>
                        </div>
                      )
                    })
                  }
                  {
                    diagramList.length === 0 && <div className="nothing">暂无可被联动图表</div>
                  }
                </div>
              </div>
            </Panel>
          </div>
          {Array.isArray(relatedsourceList) && relatedsourceList.length > 0 && relatedsource.length > 0 && <div>
            <div className="link-heading">
							请设置与筛选数据集关联的字段
            </div>
            {this.renderRelationSettings()}
          </div>}
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button bsStyle="primary" onClick={this.handleSure.bind(this)} >确定</Button>
        <Button bsStyle="default" onClick={onClose}>取消</Button>
      </Dialog.Footer>
    </Dialog>
  }

  renderRelationSettings() {
    const { data } = this.props
    const { currentTab, linkRelation, relatedsourceList } = this.state
    const source = this.findSource(data.source)
    return (
      <div>
        <div className="tab-header">
          <span>{ source && source.name ? source.name : ''}</span>
        </div>
        <div className="tab-container">
          <div className="tab-item-container">
            <div className="tab-item-scroll">
              {data.dims && data.dims.map((dim, i) => {
                const alias = dim.alias_name || dim.alias || dim.col_name
                const isActive = (currentTab === dim.col_name)
                const tabActive = classnames('tab-item', { active: isActive })
                const currentRelation = linkRelation[dim.col_name]
                const isChecked = currentRelation && currentRelation.active
                const cn = classnames('icon-checkbox', { checked: isChecked })
                return (
                  <div className={tabActive} key={`dim_${i}`} onClick={this.handleChangeTab.bind(this, dim.col_name)}>
                    <span className="checkbox-wrapper" onClick={this.handleRelation.bind(this, dim.col_name, !isChecked)}><i className={cn} /></span>
                    <span>{alias}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="tab-content">
            {data.dims && data.dims.map((dim, i) => {
              //const alias = dim.alias_name || dim.alias || dim.col_name
              const isActive = (currentTab !== dim.col_name)
              const tabActive = classnames('tab-content-item', { inactive: isActive })
              const currentRelation = linkRelation[dim.col_name]
              return (
                <div className={tabActive} key={`tab-content_${i}`}>
                  {relatedsourceList.map((relate, index) => {
                    const currentSource = this.findSource(relate)
                    return (
                      <div className="tab-content-select-item" key={`tab-content-select-item-${index}`}>
                        <div className="col-xs-6 overflow-ellipsis" style={{ textAlign: 'center' }} title={currentSource ? currentSource.name : ''}>
                          {currentSource ? currentSource.name : ''}
                        </div>
                        <div className="col-xs-6">
                          <Select value={currentRelation && currentRelation[relate] ? currentRelation[relate].id : ''}
                            openSearch maxHeight={180}
                            width={100}
                            type='single'
                            showMultipleBar={false}
                            onSelected={this.handleSelect.bind(this, relate, dim.col_name)}>
                            {currentSource && Array.isArray(currentSource.fields) && currentSource.fields.map((field, j) => <option key={j} value={field.id} title={field.col_name}>{field.alias_name || field.col_name}</option>)}
                          </Select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  //切换数据集绑定的tab
  handleChangeTab(name) {
    this.setState({
      currentTab: name
    })
  }
  handleSure() {
    const { data } = this.props
    const { linkList, linkRelation, relatedsourceList } = this.state
    let relations = linkRelation
    //这里要进行一层处理, 删除掉无关的linkRelation
    if (relatedsourceList.length === 0) {
      relations = {}
    } else {
      data.dims.forEach((dim) => {
        const key = dim.col_name
        //删除掉没有被清空的关联关系
        const unrelatedList = []
        linkRelation[key] && Object.getOwnPropertyNames(linkRelation[key]).forEach((name) => {
          if (name !== 'active' && relatedsourceList.indexOf(name) === -1) {
            unrelatedList.push(name)
          }
        })
        unrelatedList.length > 0 && unrelatedList.forEach((item) => {
          delete linkRelation[key][item]
        })
      })
      relations = linkRelation
    }
    this.setState({
      linkRelation: relations
    }, () => this.props.onSure(linkList, relations))
  }

  handleSelect(relateId, col_name, option) {
    const { linkRelation } = this.state
    let relation = {}
    if (linkRelation[col_name]) {
      relation = linkRelation[col_name]
      relation[relateId] = { id: option.value }
    } else {
      relation = {
        active: true,
        [relateId]: { id: option.value }
      }
    }
    this.setState({
      linkRelation: {
        ...linkRelation,
        [col_name]: relation
      }
    })
  }
  findSource(sourceId) {
    const { relatedsource } = this.state
    return  _.find(relatedsource, source => source.id === sourceId)
  }
  handleRelation(col, status, e) {
    e.stopPropagation()
    const { linkRelation } = this.state
    if (linkRelation[col]) {
      linkRelation[col].active = status
    } else {
      linkRelation[col] = { active: status }
    }
    this.setState({
      linkRelation: {
        ...linkRelation,
        [col]: linkRelation[col]
      }
    })
  }
  handleItemClick(item, status) {
    //item为单图obj, status为是否勾选
    const { data, diagramList } = this.props
    const { linkList, relatedsourceList } = this.state
    let rsList = relatedsourceList
    //设置被联动图表
    if (status) {
      linkList.push(item.id)
      //设置当前非主数据集
      if (item.source !== data.source) {
        rsList.push(item.source)
        rsList = _.uniq(rsList)
      }
    } else {
      _.remove(linkList, list => list === item.id)
      //设置当前非主数据集
      let canRemove = true
      linkList.forEach((link) => {
        const diagram = _.find(diagramList, list => list.id === link)
        if (item.source === diagram.source) {
          //如果当前还存在跟当前item同一数据集的数据，则不删除relatedsourceList的内容
          canRemove = false
          return false
        }
      })
      canRemove && _.remove(rsList, rs => rs === item.source)
    }
    const selectAll = this._isSelectAll(linkList, diagramList)
    this.setState({
      linkList,
      selectAll,
      relatedsourceList: rsList
    })
  }

  //全选控制
  handleSelectAll(status) {
    const { diagramList, data, sourceList } = this.props
    const { linkList } = this.state
    const newList = []
    let newSoucelist = []
    //如果没有全选
    if (status && !this._isSelectAll(linkList, diagramList)) {
      Array.isArray(diagramList) && diagramList.forEach((dia) => {
        newList.push(dia.id)
      })
      newSoucelist = [...sourceList]
      // 排除当前source
      _.remove(newSoucelist, list => list === data.source)
    }
    this.setState({
      linkList: newList,
      relatedsourceList: newSoucelist,
      selectAll: status
    })
  }
  //判断当前是否全选
  _isSelectAll(list, triList) {
    if (Array.isArray(list) && Array.isArray(triList) && triList.length > 0 && list.length === triList.length) {
      return true
    }
    return false
  }
  //获取关联数据集
  getRelatedsource(list, diagramList, data) {
    const relateSourcelist = []
    list.length > 0 && list.forEach((item) => {
      const diagram = _.find(diagramList, dia => dia.id === item)
      if (diagram && diagram.source !== data.source) {
        relateSourcelist.push(diagram.source)
      }
    })
    return _.uniq(relateSourcelist)
  }
}


export default LinkDialog;
