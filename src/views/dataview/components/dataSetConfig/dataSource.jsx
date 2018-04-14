import React from 'react'
import PropTypes from 'prop-types'
import reactMixin from 'react-mixin'

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';

import Sortable from 'react-sortablejs';
import Loading from 'react-bootstrap-myui/lib/Loading';
import Input from 'react-bootstrap-myui/lib/Input';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import { Select as TreeSelect, Tree } from 'rt-tree';
import { Form } from '@components/bootstrap-validation';

import { actions as itemDetailActionCreators } from '@store/modules/dataview/itemDetail';

import MicroTree from '@components/MicroTree';
import AdvancedDataFieldDialog from '@components/AdvancedDataFieldDialog';

import TipMixin from '@helpers/TipMixin';
import ConfirmMixin from '@helpers/ConfirmsMixin';

import { RELEASE_WRAP, NOOP } from '../../../../constants/sortable';

class DataSource extends React.Component {
  static propTypes = {
    sourceId: PropTypes.string,
    dataSetTree: PropTypes.array,
    dataFeildList: PropTypes.object,
    disabled: PropTypes.bool,
    dataFeild_pending: PropTypes.bool,
    onChangeSource: PropTypes.func,
    isFieldUsed: PropTypes.func,
    actions: PropTypes.object,
    isdevtools: PropTypes.bool
  }

  constructor(props) {
    super(props)
    this.state = {
      source: props.sourceId || '',  // 选中数据集Id
      keyword: '',        //搜索字段的关键词
      dataFieldTree: [],  //数据集字段

      rank: '',            //当前排序
      advancedDialogState: {  //计算字段
        show: false,
        data: null
      }
    }

    this.showConfirm = this.showConfirm.bind(this)
  }

  componentDidMount() {
    const { dataSetTree, dataFeildList, actions } = this.props
    const { source } = this.state
    if (!(dataSetTree && dataSetTree.length > 0)) {
      actions.fetchDataset((json) => {
        if (!json.result) {
          this.showErr(json.msg)
        } else if (source && ((dataFeildList && !dataFeildList[source]) || !dataFeildList)) {
          this.fetchDatasetField(source)
        } if (dataFeildList && dataFeildList[source]) {
          this.setDatasetField(dataFeildList[source])
        }
      })
    } else if (source && ((dataFeildList && !dataFeildList[source]) || !dataFeildList)) {
      this.fetchDatasetField(source)
    } else if (dataFeildList && dataFeildList[source]) {
      this.setDatasetField(dataFeildList[source])
    }
  }

  componentWillReceiveProps(nextProps) {
    const { dataFeildList } = nextProps
    if (!_.isEqual(nextProps.sourceId, this.props.sourceId)) {
      this.setState({
        source: nextProps.sourceId,
        dataFieldTree: []
      }, () => {
        const { source } = this.state
        if (source && ((dataFeildList && !dataFeildList[source]) || !dataFeildList)) {
          this.fetchDatasetField(source)
        } else if (dataFeildList && dataFeildList[source]) {
          this.setDatasetField(dataFeildList[source])
        }
      })
    }
  }

  render() {
    const {
      source,
      keyword,
      dataFieldTree,
      advancedDialogState,
    } = this.state

    const {
      dataSetTree,
      dataFeild_pending,
      disabled,
      isdevtools,
      dataFeildList,
    } = this.props

    return (
      <div className="datasource-wrap">
        <div className="inner-box-wrap">
          <Sortable options={RELEASE_WRAP} onChange={NOOP}>
            <Form className="form-horizontal" validationEvent="onBlur" onValidSubmit={NOOP}>
              <div className="form-group">
                <div className="input-wrapper datasource-input-wrapper">
                  {!disabled ? <TreeSelect search placeholder="请选择数据集" style={{ width: '100%' }} menuStyle={{ width: '100%', maxHeight: 300 }}>
                    <Tree
                      defaultExpanded={dataSetTree.length > 0 ? [dataSetTree[0].id] : []}
                      data={dataSetTree || []}
                      disabled={node => node.type === 'FOLDER'}
                      selected={[source]}
                      onSelect={this.handleSelectTree}
                      customerIcon={this.genrateIcon}
                      onChange={this.handleChangeTree} />
                  </TreeSelect> : null}
                </div>
              </div>
            </Form>
          </Sortable>

          <div className={dataFieldTree.length > 0 ? 'tree-wrap tree-hasdata' : 'tree-wrap'}>
            <Sortable options={RELEASE_WRAP} onChange={NOOP}>
              {
                dataFieldTree.length > 0 &&
                <div className="dataset-explorer-search-box" style={{ padding: '10px 40px 0 16px', position: 'relative', flex: 1 }}>
                  <div className="form single-search-form" style={{ width: '100%' }}>
                    <Input type="text"
                      placeholder="请输入关键字"
                      value={keyword}
                      onChange={this.handleChangeKeyword}
                      addonAfter={<i className="dmpicon-search" />}
                      className="search-input-box" />
                    {keyword && <i className="dmpicon-close" onClick={this.handleClearKeyword}></i>}
                  </div>
                  {!isdevtools ? <OverlayTrigger placement="top" overlay={<Tooltip positiontop={20}>添加新字段</Tooltip>}>
                    <div className="add-container" onClick={this.handleShowDialog.bind(this, 'add')}>
                      <i className="btn-icon dmpicon-add"></i>
                    </div>
                  </OverlayTrigger> : null}
                </div>
              }
            </Sortable>

            <div className="tree-inner-wrap" id="tree-wrap-container" style={{ position: 'relative' }} >
              {dataFieldTree.length > 0 ?
                dataFieldTree.map((item, index) =>
                  <MicroTree
                    data={item}
                    key={index}
                    showLine={true}
                    events={{
                      onSpread: this.handleFolderSpread.bind(this, index),
                      onSelect: this.handleShowDialog,
                      onDelete: this.handleNumDelete
                    }}
                  />) : <div className="nothing"><div className="inner-wrap"><i className="dmpicon-help" />无数据源</div></div>
              }
              <Loading show={dataFeild_pending} containerId="tree-wrap-container" />
            </div>
          </div>
        </div>
        {
          advancedDialogState.show && <AdvancedDataFieldDialog
            data={advancedDialogState.data}
            dataField={dataFeildList[source]}
            onSure={this.handleAdvancedDialogSure.bind(this)}
            onClose={this.handleCloseAdvanceDialog.bind(this)}
          />
        }
      </div>
    );
  }

  // 切换数据源
  handleChangeTree = (value) => {
    const selectDatasetId = value[0]
    const { source } = this.state
    if (source !== selectDatasetId) {
      this.setState(prevState => ({
        ...prevState,
        source: selectDatasetId,
        keyword: ''
      }), () => {
        this.fetchDatasetField(selectDatasetId)
        this.props.onChangeSource('source', selectDatasetId)
      })
    }
  }

  // 显示弹窗
  handleShowDialog = (mode, item) => {
    const { advancedDialogState } = this.state
    this.setState({
      advancedDialogState: {
        ...advancedDialogState,
        show: true,
        data: item
      }
    })
  }

  handleNumDelete = (mode, id) => {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该高级计算字段吗？</span>,
      content: '请确认此项操作不会影响其他使用该计算字段的单图',
      checkbox: true,
      ok: () => {
        this.saveNumeralIndicator(mode, { id })
      }
    })
  }

  handleAdvancedDialogSure(data) {
    const { advancedDialogState } = this.state
    const mode = advancedDialogState.data ? 'edit' : 'add'
    this.saveNumeralIndicator(mode, data)
  }

  handleCloseAdvanceDialog() {
    this.setState({
      advancedDialogState: {
        ...this.state.advancedDialogState,
        show: false,
        data: null
      }
    })
  }

  // 禁用点击
  handleSelectTree = (select, value, options) => options.type !== 'FOLDER'

  //搜索关键字改变
  handleChangeKeyword = (e) => {
    clearTimeout(this.SEARCHTIMER)

    const { dataFieldTree } = this.state
    const searchKeyword = e.target.value

    this.setState({
      keyword: searchKeyword
    })

    this.SEARCHTIMER = setTimeout(() => {
      const newTree = this.setFolderHideStatusByKeyword(dataFieldTree, searchKeyword)
      this.setState({
        dataFieldTree: newTree
      })
    }, 300)
  }

  // 清除搜索关键字
  handleClearKeyword = (e) => {
    e.stopPropagation()
    const { dataFieldTree } = this.state
    const newTree = this.setFolderHideStatusByKeyword(dataFieldTree, '')

    this.setState({
      keyword: '',
      dataFieldTree: newTree
    })
  }

  handleFolderSpread = (index) => {
    const spread = this.state.dataFieldTree[index]._spread_
    const newDataFieldTree = this.state.dataFieldTree.concat()
    newDataFieldTree[index]._spread_ = !spread

    this.setState({
      dataFieldTree: newDataFieldTree
    })
  }

  // 保存计算字段
  saveNumeralIndicator = (mode, params) => {
    const { isFieldUsed, actions } = this.props
    const { source } = this.state
    if (mode === 'delete' && isFieldUsed(params.id)) {
      return this.showErr('字段正在使用,不能删除')
    }

    params = _.extend({}, {
      id: '',
      rank: '',
      dataset_id: source,
      alias_name: '',
      visible: 1,
      format: '',
      field_group: '度量',
      data_type: '数值',
      expression: '',
    }, params)

    if (params.expression && typeof params.expression === 'object') {
      params.expression = JSON.stringify(params.expression)
    }

    switch (mode) {
      case 'add':
        params = { ...params, mode: 'add' };
        break;
      case 'edit':
        params = { ...params, mode: 'edit' };
        break;
      case 'delete':
        params = { ...params, mode: 'delete' };
        break;
      default:
        break;
    }

    actions.setNumeralIndicators(params, (json) => {
      if (json.result) {
        this.setState({
          advancedDialogState: {
            ...this.state.advancedDialogState,
            show: false,
            data: null
          }
        })
        this.fetchDatasetField(params.dataset_id)
      } else {
        this.showErr(json.msg)
      }
    })
  }

  // 拉取datasetField数据
  fetchDatasetField = (value) => {
    value = value || this.state.source
    this.props.actions.fetchDatasetField({ dataset_id: value }, (json) => {
      if (json.result) {
        this.setDatasetField(json.data)
      } else {
        this.showErr(json.msg)
      }
    })
  }

  // 设置dataField数据
  setDatasetField = (data) => {
    const newDataFieldTree = []
    data && Object.keys(data).forEach((key) => {
      const item = {
        title: key,
        _spread_: true,
        rank: key === '度量' ? 1 : 0,  // 加上这个用来排序
        children: data[key]
          .filter(child => !!child.visible)
          .map(sub => Object.assign(sub, {
            text: sub.alias_name || sub.col_name,
            parent_id: key,
            alias: sub.alias_name || sub.col_name
          }))
      }

      // 对度量里面的children 数据进行分组排序
      if (key === '度量' || key === '维度') {
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
      newDataFieldTree.push(item)
    })

    newDataFieldTree.sort((a, b) => a.rank - b.rank)
    this.setState(prevState => ({
      dataFieldTree: this.setFolderHideStatusByKeyword(newDataFieldTree, prevState.keyword)
    }))
  }

  genrateIcon = (item, expanded) => {
    let className = expanded ? 'dmpicon-folder-open' : 'dmpicon-folder-close'
    switch (item.type) {
      case 'EXCEL':
        className = 'dmpicon-excel';
        break;
      case 'SQL':
        className = 'dmpicon-sql';
        break;
      case 'LABEL':
        className = 'dmpicon-label-dataset';
        break;
      case 'API':
        className = 'dmpicon-api-dataset';
        break;
      case 'UNION':
        className = 'dmpicon-combo-dataset';
        break;
      case 'TEMPLATE':
        className = 'dmpicon-dataset';
        break;
      default:
        break;
    }

    return <i className={className} style={this.ICON_STYLE_SHEET} />
  }

  // 以关键字过滤文件夹
  setFolderHideStatusByKeyword = (treeArr, keyword) => {
    keyword = keyword.trim();
    const newTree = this.setTreeNodeHiddenStatus(treeArr, keyword)

    // 如果关键字为空 直接返回结果 跳过过滤计算
    if (!keyword) {
      return newTree
    }

    const nodeTree = this.getArrayFromTree(newTree)
    const newList = nodeTree.filter(item => !item.hidden)
    // 向上检查需要显示的节点父级是否hidden
    newList.map(node => this.setNodeParentHideStatus(newTree, node))

    return newTree
  }

  // 向上检查需要显示的节点父级是否hidden
  setNodeParentHideStatus = (treeArr, node) => {
    if (node.parent_id) {
      treeArr.forEach((item) => {
        if (node.parent_id === item.title) {
          item.hidden = false
        }
      })
    }
  }

  // 返回一维数组
  getArrayFromTree = (treeArr) => {
    const arr = []
    treeArr.forEach((item) => {
      arr.push(item)
      if (Array.isArray(item.children) && item.children.length > 0) {
        arr.push(...(this.getArrayFromTree(item.children)))
      }
    })
    return arr
  }

  // 根据关键字为树的各节点设置hidden属性
  setTreeNodeHiddenStatus = (treeArr, keyword) => treeArr.map((node) => {
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
        node.children = this.setTreeNodeHiddenStatus(node.children, keyword)
      }
    } else {
      node.hidden = !new RegExp(keyword.toLowerCase(), 'g').test(node.text)
    }
    return node
  })

  showErr = (msg) => {
    this.showTip({
      status: 'error',
      content: msg
    })
  }

  showScc = (msg) => {
    this.showTip({
      status: 'success',
      content: msg
    })
  }

  NAMETIMER = 0 // 名称输入频率控制

  SEARCHTIMER = 0 //搜索数据集时间戳

  ICON_STYLE_SHEET = {
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
  }
}

reactMixin.onClass(DataSource, TipMixin)
reactMixin.onClass(DataSource, ConfirmMixin)

const stateToProps = state => ({
  ...state.dataViewItemDetail
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(itemDetailActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(DataSource)
