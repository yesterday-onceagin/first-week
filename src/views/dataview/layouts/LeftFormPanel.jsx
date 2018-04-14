import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';

import Sortable from 'react-sortablejs';
import Loading from 'react-bootstrap-myui/lib/Loading';
import Input from 'react-bootstrap-myui/lib/Input';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import { Select as TreeSelect, Tree } from 'rt-tree';
import { Form, ValidatedInput } from '../../../components/bootstrap-validation';

import { actions as dataViewAddOrEditActionCreators } from '../../../redux/modules/dataview/addOrEdit';

import MicroTree from '../../../components/MicroTree';

import TipMixin from '../../../helpers/TipMixin';
import ConfirmMixin from '../../../helpers/ConfirmsMixin';
import AdvancedDataFieldDialog from '@components/AdvancedDataFieldDialog';

import { RELEASE_WRAP, NOOP } from '../../../constants/sortable';

/**
 *  左侧功能： 
 *  1、选择数据集
 *  2、高级字段的编辑
 *  3、保存
 *  4、同步部分数据到 父组件
 */

const LeftFormPanel = createReactClass({
  displayName: 'LeftFormPanel',
  mixins: [TipMixin, ConfirmMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      info: {
        name: '',         // 标题
        source: '',       // 选中数据集Id
      },
      keyword: '',        //字段的关键词
      dataFieldTree: [],  //
      advancedDialogState: {  //计算字段
        show: false,
        data: null
      }
    }
  },

  componentDidMount() {
    const { dataSetTree, data } = this.props
    // 拉取 数据集数据
    if (!(dataSetTree && dataSetTree.length > 0)) {
      this.props.actions.fetchDataset()
    }
    // data 存在则同步到 info. 
    if (data && data.source) {
      this.state.info = {
        ...this.state.info,
        ...data
      }
    }
  },

  componentWillReceiveProps(nextProps) {
    // 如果外层传入source 和 name
    if (!_.isEqual(nextProps.data, this.props.data)) {
      this.state.info = _.cloneDeep(nextProps.data)
    }
    // 如果 datafieldList存在
    if (!_.isEqual(nextProps.dataFeildList, this.props.dataFeildList)) {
      this.setDatasetField(nextProps.dataFeildList)
    }
  },

  render() {
    const {
      info,
      keyword,
      dataFieldTree,
      advancedDialogState
    } = this.state

    const {
      dataSetTree,
      dataFeild_pending,
      dataFeildList,
    } = this.props
    console.log(dataFieldTree)
    return (
      <div className="left">
        <div className="inner-box-wrap">
          <Sortable options={RELEASE_WRAP} onChange={NOOP}>
            <Form className="form-horizontal" validationEvent="onBlur" onValidSubmit={NOOP}>
              <ValidatedInput type="text"
                id="data-view-chart-title-input"
                label={<span style={{ marginLeft: '-10px' }}><i className="required">*</i>图表标题</span>}
                autoComplete="off"
                name="name"
                value={info.name}
                maxLength="20"
                wrapperClassName="input-wrapper"
                onChange={this.handleChange.bind(this, 'name')}
                validate='required'
                errorHelp={{
                  required: '请输入图表标题'
                }} />

              <div className="form-group">
                <label className="control-label">数据集</label>
                <div className="input-wrapper">
                  <TreeSelect search style={{ width: '100%' }} menuStyle={{ width: '100%', maxHeight: 300 }}>
                    <Tree
                      defaultExpanded={dataSetTree.length > 0 ? [dataSetTree[0].id] : []}
                      data={dataSetTree || []}
                      disabled={node => node.type === 'FOLDER'}
                      selected={[info.source]}
                      onSelect={this.handleSelectTree}
                      customerIcon={this.genrateIcon}
                      onChange={this.handleChangeTree} />
                  </TreeSelect>
                </div>
              </div>
            </Form>
          </Sortable>
          <div className="tree-wrap">
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
                  <OverlayTrigger placement="top" overlay={<Tooltip positiontop={20}>添加计算字段</Tooltip>}>
                    <div className="add-container" onClick={this.handleShowDialog.bind(this, 'add')}>
                      <i className="btn-icon dmpicon-add"></i>
                    </div>
                  </OverlayTrigger>
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
                  />) : <div className="nothing"><div className="inner-wrap"><i className="dmpicon-help" />请选择数据集</div></div>
              }
              <Loading show={dataFeild_pending} containerId="tree-wrap-container" />
            </div>
          </div>
        </div>
        {
          advancedDialogState.show && <AdvancedDataFieldDialog
            data={advancedDialogState.data}
            dataField={dataFeildList}
            onSure={this.handleAdvancedDialogSure}
            onClose={this.handleCloseAdvanceDialog}
          />
        }
      </div>
    );
  },

  // 切换数据源 通知到父组件
  handleChangeTree(value) {
    if (this.state.info.source !== value[0]) {
      this.state.info.source = value[0]
      this.state.keyword = ''
      this.props.onChangeTree(value[0], (data) => {
        this.setDatasetField(data)
      })
    }
  },

  // 设置 Info 的数据 通知到父组件
  handleChange(field, e) {
    const newValue = e.target.value
    this.setState(preState => ({
      info: {
        ...preState.info,
        [field]: newValue
      }
    }), () => {
      // 对通知父组件的频率进行控制
      clearTimeout(this.NAMETIMER)
      this.NAMETIMER = setTimeout(() => {
        this.props.onChange(newValue)
      }, 300)
    })
  },

  // 显示弹窗
  handleShowDialog(mode, item) {
    const { advancedDialogState } = this.state
    this.setState({
      advancedDialogState: {
        ...advancedDialogState,
        show: true,
        data: item
      }
    }) 
  },

  handleAdvancedDialogSure(data) {
    const { advancedDialogState } = this.state
    const mode = advancedDialogState.data ? 'edit' : 'add'
    this.saveNumeralIndicator(mode, data)
  },

  handleCloseAdvanceDialog() {
    this.setState({
      advancedDialogState: {
        ...this.state.advancedDialogState,
        show: false,
        data: null
      }
    })
  },

  handleNumDelete(mode, id) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该高级计算字段吗？</span>,
      content: '请确认此项操作不会影响其他使用该计算字段的单图',
      checkbox: true,
      ok: () => {
        this.saveNumeralIndicator(mode, { id })
      }
    })
  },

  handleSure(mode, id, list, name, rank) {
    this.saveNumeralIndicator(mode, id, list, name, rank)
  },

  // 禁用点击
  handleSelectTree(select, value, options) {
    return options.type !== 'FOLDER'
  },

  //搜索关键字改变
  handleChangeKeyword(e) {
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
  },

  // 清除搜索关键字
  handleClearKeyword(e) {
    e.stopPropagation()
    const { dataFieldTree } = this.state
    const newTree = this.setFolderHideStatusByKeyword(dataFieldTree, '')

    this.setState({
      keyword: '',
      dataFieldTree: newTree
    })
  },

  handleFolderSpread(index) {
    const spread = this.state.dataFieldTree[index]._spread_

    this.state.dataFieldTree[index]._spread_ = !spread
    this.setState({
      ...this.state
    })
  },

  // 保存计算字段
  saveNumeralIndicator(mode, params) {
    const { info } = this.state
    if (mode === 'delete' && !this.props.isFieldUsed(params.id)) {
      return this.showErr('字段正在使用,不能删除')
    }
    params = _.extend({}, {
      id: '',
      rank: '',
      dataset_id: info.source,
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

    this.props.onFetchNumeralIndicators(params, (dataset_id, isSuccess) => {
      if (isSuccess) {
        this.setState({
          advancedDialogState: {
            ...this.state.advancedDialogState,
            show: false,
            data: null
          }
        })
        this.fetchDatasetField(dataset_id)
      } else {
        this.setState({
          advancedDialogState: {
            show: true
          }
        })
      }
    })
  },

  // 拉取 datasetField 数据
  fetchDatasetField(value) {
    value = value || this.state.info.source

    this.props.actions.fetchDatasetField({ dataset_id: value }, (json) => {
      if (json.result) {
        this.setDatasetField(json.data)
      }
    })
  },

  // 设置 dataField 数据
  setDatasetField(data) {
    this.state.dataFieldTree = []

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
      this.state.dataFieldTree.push(item)
    })
    // 排序
    this.state.dataFieldTree.sort((a, b) => a.rank - b.rank)
    // 查询
    this.state.dataFieldTree = this.setFolderHideStatusByKeyword(this.state.dataFieldTree, this.state.keyword)
  },

  genrateIcon(item, expanded) {
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
      case 'UNION':
        className = 'dmpicon-combo-dataset';
        break;
      case 'API':
        className = 'dmpicon-api-dataset';
        break;
      case 'TEMPLATE':
        className = 'dmpicon-dataset';
        break;
      default:
        break;
    }

    return <i className={className} style={this.ICON_STYLE_SHEET} />
  },

  // 以关键字过滤文件夹
  setFolderHideStatusByKeyword(treeArr, keyword) {
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
  },

  // 向上检查需要显示的节点父级是否hidden
  setNodeParentHideStatus(treeArr, node) {
    if (node.parent_id) {
      treeArr.forEach((item) => {
        if (node.parent_id === item.title) {
          item.hidden = false
        }
      })
    }
  },

  // 返回一维数组
  getArrayFromTree(treeArr) {
    const arr = []
    treeArr.forEach((item) => {
      arr.push(item)
      if (Array.isArray(item.children) && item.children.length > 0) {
        arr.push(...(this.getArrayFromTree(item.children)))
      }
    })
    return arr
  },

  // 根据关键字为树的各节点设置hidden属性
  setTreeNodeHiddenStatus(treeArr, keyword) {
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
          node.children = this.setTreeNodeHiddenStatus(node.children, keyword)
        }
      } else {
        node.hidden = !new RegExp(keyword.toLowerCase(), 'g').test(node.text)
      }
      return node
    })
  },

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  },

  showScc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  },

  NAMETIMER: 0, // 名称输入频率控制

  SEARCHTIMER: 0, //搜索数据集时间戳

  ICON_STYLE_SHEET: {
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
  },
})

const stateToProps = state => ({
  ...state.dataViewAddOrEdit
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(dataViewAddOrEditActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(LeftFormPanel);
