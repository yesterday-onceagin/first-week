import React from 'react';
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class'

import Loading from 'react-bootstrap-myui/lib/Loading';
import Input from 'react-bootstrap-myui/lib/Input';

import GroupTree from '@components/GroupTree';
import DatasetAddItem from './components/DatasetAddItem';
import DatasetNodeItem from './components/DatasetNodeItem';
import DatasetViewPanel from './components/DatasetViewPanel';
import AuthorityDialog from './components/AuthorityDialog';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataSetActionCreators } from '../../redux/modules/dataset/dataset';
import { actions as userActionCreators } from '../../redux/modules/organization/user';
import { actions as authorityRoleActionCreators } from '../../redux/modules/authority/role';
import { actions as dateviewItemDetailActionCreators } from '../../redux/modules/dataview/itemDetail';

import AuthComponent from '@components/AuthComponent';

import _ from 'lodash';
import TipMixin from '@helpers/TipMixin';
import ConfirmMixin from '@helpers/ConfirmsMixin';
import { getLeafs } from '@helpers/groupTreeUtils';
import { baseAlias } from '../../config';
import { TYPE_NAMES, DATASET_TYPES } from './constants';

import './list.less';

let _searchTimer = 0;

// 检查剩余层级是否符合要求
const checkRestLevel = (target) => {
  const validLevel = 4;
  // 剩余可用层级
  const restLevel = validLevel - target.level;
  if (restLevel <= 0) {
    this.sourceNode = null;
  } else if (Array.isArray(this.sourceNode.sub) && this.sourceNode.sub.length > 0) {
    // 有sub的情况
    const leafs = [];

    getLeafs(this.sourceNode.sub, leafs);

    const max = arr => arr.reduce((acc, cur) => {
      if (cur.level >= acc.level) {
        return cur;
      }
      return acc;
    }, arr[0]);

    const maxLevelSubNode = max(leafs);

    if (restLevel + (maxLevelSubNode.type === TYPE_NAMES.folder ? 0 : 1) < (maxLevelSubNode.level - this.sourceNode.level)) {
      this.sourceNode = null;
    }
  }
}

const DatasetList = createReactClass({
  displayName: 'DatasetList',

  mixins: [TipMixin, ConfirmMixin],

  propTypes: {
    actions: PropTypes.object,
    onChangeNavBar: PropTypes.func
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      keyword: '',                                // 文件搜索关键字
      index: 0,
      treeUuid: new Date().getTime(),             // 树形组件key
      newFolderId: '',                            // 新建文件夹的id
      isFileMoving: false,
      menuShowId: '',
      node: null,
      authority_dialog: {
        show: false,
        pending: false,
        loading: false,
        node: null,
        data: []
      }
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容 
    this.props.onChangeNavBar('创建数据集');
  },

  componentDidMount() {
    this.props.actions.fetchDatasetTree();
  },

  render() {
    const { treePending, pending, datasetTree, datasetTable, datasetData, datasetRelate, datasetLog, datasetTableTotal, datasetTableUserTotal, actions } = this.props;
    const { keyword, isFileMoving, menuShowId, treeUuid, newFolderId, node, index } = this.state;
    // 节点模版
    const nodeTemplate = (_node, spread) => (
      <AuthComponent pagecode="创建数据集" allowevents={['onSelectNode']}>
        <DatasetNodeItem
          data={_node}
          treeData={datasetTree}
          spread={spread}
          initEdit={_node.id === newFolderId}
          hasItemMoving={isFileMoving}
          container={this.dataset_explorer}
          onAddFolder={this.handleAddFolder.bind(this, _node)}
          onTempAddFolder={this.handleTempAddFolder.bind(this, _node)}
          onRename={this.handleRenameDataset.bind(this, _node)}
          onAuthority={this.handleAuthority.bind(this, _node)}
          onSetMenuShow={this.handleSetMenuShowNodeId}
          onSelectNode={this.handleSelectNode}
          onEditDataset={this.handleGoDatasetDetail.bind(this, _node.type, _node.id)}
          onShowErr={this.showErr}
          onDel={this.handleDeleteItem.bind(this, _node)}
        />
      </AuthComponent>
    )

    return (
      <div className="modules-page-container">
        <div className="data-view dataset-detail-page dataset-list-page" style={{ overflow: 'hidden' }}>
          {this.renderDatasetTypes()}
          {this.renderAuthorityDialog()}
          <div className="page-list-main">
            <div className="left-tree-panel">
              <div className="title">数据集</div>
              <div className="dataset-explorer" ref={(_node) => { this.dataset_explorer = _node }} style={this.STYLE_SHEET.explorer}>
                <div className="dataset-explorer-search-box"
                  style={{ padding: '10px 40px 10px 16px', position: 'relative' }}
                >
                  <div className="form single-search-form" style={{ width: '100%' }}>
                    <Input type="text"
                      placeholder="请输入关键字"
                      value={keyword}
                      onChange={this.handleChangeKeyword}
                      addonAfter={<i className="dmpicon-search" />}
                      className="search-input-box"
                    />
                    {
                      keyword && <i className="dmpicon-close" onClick={this.handleClearKeyword}></i>
                    }
                  </div>
                  <AuthComponent pagecode="创建数据集" visiblecode="edit">
                    <div className="main-menu-btn"
                      title="新建文件夹"
                      style={this.STYLE_SHEET.addFolderBtn}
                      onClick={this.handleTempAddFolder.bind(this, null)}>
                      <i className="dmpicon-folder-add" style={this.STYLE_SHEET.menuIcon}></i>
                    </div>
                  </AuthComponent>
                </div>
                <div className="dataset-explorer-content"
                  style={this.STYLE_SHEET.explorerContent} id="dataset-group-tree">
                  <AuthComponent pagecode="创建数据集">
                    <GroupTree
                      key={`file-tree-${treeUuid}`}
                      activeId={menuShowId}
                      canActive={false}
                      data={datasetTree}
                      spreadCallback={this._setDatasetSpreads}
                      draggable
                      onDragStart={this.handleFileMoveStart}
                      onDragOver={this.handleFileMoving}
                      onDragEnd={this.handleFileMoveEnd}
                      nodeTemplate={nodeTemplate}
                      hasSpreadIcon={false}
                      useTreeLine={true}
                      paddingUnit={16}
                      nodeHeight={30}
                    />
                  </AuthComponent>
                  <Loading show={treePending} containerId='dataset-group-tree' />
                </div>
              </div>
            </div>
            <div className="page-list-content">
              <DatasetViewPanel
                node={node}
                activeIndex={index}
                onEditDataset={this.handleGoDatasetDetail.bind(this, null)}
                onSelectedTab={this.handleSwitchTab}
                onUpdateDatasetField={this.handleUpdateFiled}
                onDownload={actions.fetchDownloadDataset}
                onFetchSheetData={actions.fetchDownSheetData}
                onShowErr={this.showErr}
                datasetTableTotal={datasetTableTotal}
                datasetTableUserTotal={datasetTableUserTotal}
                datasetData={datasetData}
                datasetTable={datasetTable}
                datasetRelate={datasetRelate}
                datasetLog={datasetLog}
                pending={pending}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },

  renderAuthorityDialog() {
    const { authority_dialog } = this.state
    const { roleList, datasetData, actions } = this.props

    return (
      authority_dialog.show && <AuthorityDialog
        show={authority_dialog.show}
        node={authority_dialog.node}
        pending={authority_dialog.pending}
        loading={authority_dialog.loading}
        datasetField={datasetData.field}
        roleList={roleList}
        onFetchRoleList={actions.fetchRoleList}
        onFetchDatasetAuthFilters={actions.fetchDatasetAuthFilters}
        onFetchFilterOptions={actions.fetchFilterOptions}
        onClose={this.handleCloseDialog}
        onSure={this.handleSureDialog}
      />
    )
  },

  renderDatasetTypes() {
    const { project } = this.props
    return (
      <div className="dataset-container">
        <div className="dataset-add-item-box" >
          {
            DATASET_TYPES.map((item, index) => {
              // 不在项目包含的数据集类型不渲染
              if (project.datasetTypes.indexOf(item.type) === -1) {
                return null
              }
              return (
                <AuthComponent pagecode="创建数据集" key={index}>
                  <DatasetAddItem
                    icon={item.icon}
                    name={item.name}
                    type={item.type}
                    description={item.description}
                    onAdd={this.handleGoDatasetDetail.bind(this, item)}
                  />
                </AuthComponent>
              )
            })
          }
        </div>
      </div>
    )
  },

  handleUpdateFiled(data) {
    // 更新本地
    this.props.actions.updateDatasetField(data)
    
    this.props.actions.updateFieldTable({
      id: data.id,
      data_type: data.key === 'data_type' ? data.value : data.data_type,
      alias_name: data.key === 'alias_name' ? data.value : data.alias_name,
      field_group: data.key === 'field_group' ? data.value : data.field_group,
      visible: data.key === 'visible' ? data.value : data.visible
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      }
    })
  },

  handleCloseDialog() {
    this.setState({
      authority_dialog: {
        ...this.state.authority_dialog,
        show: false,
        node: null
      }
    })
  },

  handleSureDialog(auths, filterFields, selectRole) {
    const { authority_dialog } = this.state
    const role_conditions = []
    const unsetRoleNames = []

    Object.keys(auths).forEach((role) => {
      const role_id = role
      const conditionArr = Object.values(auths[role])

      const item = {
        role_id,
        hide_field_ids: [],
        condition: ''
      }

      if (Array.isArray(conditionArr) && conditionArr.length > 0) {
        item.condition = JSON.stringify(conditionArr)
      }

      if (filterFields[role_id]) {
        item.hide_field_ids = filterFields[role_id]
      }

      // 如果 hide_field_ids 和 condition 没有设置
      if (item.hide_field_ids.length === 0 && !item.condition) {
        const role = selectRole.find(item => item.id === role_id)
        unsetRoleNames.push(role.name)
      } else {
        role_conditions.push(item)
      }
    })

    // 过滤没有设置的角色
    if (unsetRoleNames.length > 0) {
      this.showErr(`${unsetRoleNames.join('、')} 还没有进行设置！`)
      return;
    }

    // start loading 
    this.setState({
      authority_dialog: {
        ...this.state.authority_dialog,
        loading: true
      }
    })

    this.props.actions.saveDatasetAuthFilters({
      dataset_id: authority_dialog.node.id,
      role_conditions
    }, (json) => {
      if (json.result) {
        this.setState({
          authority_dialog: {
            ...this.state.authority_dialog,
            show: false
          }
        })
        this.showSucc('授权成功')
      } else {
        this.showErr(json.msg)
      }

      this.setState({
        authority_dialog: {
          ...this.state.authority_dialog,
          loading: false
        }
      })
    })
  },

  handleAuthority(node) {
    this.setState({
      authority_dialog: {
        node,
        loading: false,
        show: true,
        pending: true
      }
    })

    // 请求数据集的字段
    this.props.actions.fetchDatasetData(node.id, () => {
      this.setState({
        authority_dialog: {
          ...this.state.authority_dialog,
          pending: false
        }
      })
    })
  },

  // 切换 tab  
  handleSwitchTab(index) {
    this.state.index = index
    this._fetchDataView(index)
  },

  // 清空最新新建的文件夹id
  handleClearNewFolder() {
    if (!this.state.newFolderId) {
      return
    }
    this.setState({ newFolderId: '' })
  },

  // 设置显示菜单的节点
  handleSetMenuShowNodeId(nodeId) {
    this.setState({ menuShowId: nodeId });
  },

  // 移动文件开始
  handleFileMoveStart(/* e */) {
    // const target = e.target
    // console.log('开始移动', target)
  },

  // 移动文件
  handleFileMoving(e) {
    const { target } = e
    const targetStr = $(target).closest('.dmp-tree-node-box').attr('data-node')
    this.targetNode = JSON.parse(targetStr)
  },

  // 移动文件结束
  handleFileMoveEnd(e) {
    const source = e.target
    // console.log('移动结束', source)
    const sourceStr = $(source).attr('data-node')
    this.sourceNode = JSON.parse(sourceStr)
    

    if (this.targetNode && this.sourceNode) {
      // 移动到自身或自身所在父级 取消操作
      if (this.targetNode.id === this.sourceNode.id || this.sourceNode.parent_id === this.targetNode.id) {
        this.sourceNode = null;
        this.targetNode = null
        return;
      }
      // 目标不是文件夹 取消操作 并警告
      if (this.targetNode.type !== TYPE_NAMES.folder) {
        this.showErr('目标不是文件夹');
        this.sourceNode = null;
        this.targetNode = null
        return;
      }
      // 源为文件夹的情况 判断总层级是否会大于5
      if (this.sourceNode.type === TYPE_NAMES.folder) {
        // 根据目标检查层级是否合法
        checkRestLevel(this.targetNode);

        if (this.sourceNode === null) {
          this.showErr('最大只允许存在5级文件夹');
          return;
        }
      }
      this._moveDataset(this.sourceNode, this.targetNode);
    } else {
      // 移出范围的情况或 this.sourceNode 没拿到
      this.sourceNode = null;
    }
  },

  // 新增文件夹
  handleAddFolder(node) {
    // 关闭overlay
    document.body.click();

    const newFolder = {
      ...node,
      type: TYPE_NAMES.folder
    };

    // 当node.parent_id 存在的时候，则
    if (node && node.parent_id) {
      newFolder.parent_path = _.dropRight(node.path);
    }

    return new Promise((resolve, reject) => {
      this.props.actions.fetchAddDataset(newFolder, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
          // 出错的情况应该要使编辑的节点再次高亮
          node.id = 'tempFolders_id'
          this.setState({
            newFolderId: 'tempFolders_id',
            treeUuid: new Date().getTime()
          })
          resolve();
        } else {
          this.showSucc(json.msg);
          this.setState({
            newFolderId: json.data,
            treeUuid: new Date().getTime()
          }, this.handleClearNewFolder)

          reject()
        }
      })
    })
  },

  // 临时新增
  handleTempAddFolder(node, e) {
    e && e.stopPropagation();
    e && e.nativeEvent && e.nativeEvent.stopPropagation();
    e && e.preventDefault();

    // 关闭overlay
    document.body.click();

    const name = this._getInitNodeName(node, '新建文件夹')

    const newFolder = {
      ...node,
      name,
      id: 'tempFolders_id',
      parent_id: node ? (node.id || '') : '',
      type: TYPE_NAMES.folder
    };

    if (node && node.id) {
      newFolder.parent_path = node.path;
    }

    // 为后台传入 userInfo 中的 user_group_id 字段
    newFolder.user_group_id = this.props.userInfo.group_id
   
    this.props.actions.tempFolders(newFolder).then(() => {
      this.setState({
        newFolderId: 'tempFolders_id',  // 生成临时id
        treeUuid: new Date().getTime()
      })
    });
  },

  // 重命名文件夹/数据集
  handleRenameDataset(node, newName) {
    return new Promise((resolve) => {
      this.props.actions.fetchRenameDataset(node, newName, (json) => {
        if (!json.result) {
          this.showErr(json.msg || '修改失败');
          this.setState({
            newFolderId: node.id,
            treeUuid: new Date().getTime()
          })
          resolve()
        } else {
          this.handleClearNewFolder();
          this.showSucc(json.msg || '修改成功');
        }
      });
    })
  },

  // 删除文件夹/数据集
  handleDeleteItem(node) {
    // 关闭overlay
    document.body.click();
    // 弹出二次确认对话框
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>{`确定要删除该${node.type === TYPE_NAMES.folder ? '文件夹' : '数据集'}吗？`}</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.fetchDeleteDataset(node, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg || '删除失败');
          } else {
            this.showSucc(json.msg || '删除成功');
          }
        })
      }
    });
  },

  // 添加/编辑数据集
  handleGoDatasetDetail(item) {
    const node = item || this.state.node
    let path = `detail_error/${node.type}`;

    switch (node.type) {
      case TYPE_NAMES.sql:
        path = 'detail_sql';
        break;
      case TYPE_NAMES.label:
        path = 'detail_label';
        break;
      case TYPE_NAMES.excel:
        path = 'detail_excel';
        break;
      case TYPE_NAMES.combo:
        path = 'detail_combo';
        break;
      case TYPE_NAMES.template:
        path = 'detail_template';
        break;
      case TYPE_NAMES.api:
        path = 'detail_api';
        break;
      default:
        break;
    }

    // 如果有id则加上id
    if (node.id) {
      path = `${path}/${node.id}`;
    }

    this.context.router.push(`${baseAlias}/dataset/${path}`);
  },

  // 输入搜索关键字
  handleChangeKeyword(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();

    clearTimeout(_searchTimer);

    const searchKeyword = e.target.value;

    this.setState({
      keyword: searchKeyword,
      treeUuid: new Date().getTime()
    }, () => {
      _searchTimer = setTimeout(() => {
        this.props.actions.filterDatasets(searchKeyword)
      }, 300);
    });
  },

  // 清除搜索关键字
  handleClearKeyword(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();

    this.props.actions.filterDatasets('');

    this.setState({
      keyword: '',
      treeUuid: new Date().getTime()
    });
  },

  // 选中的节点, 重新切换到 数据预览
  // 以免发生更新报错
  handleSelectNode(node) {
    this.setState({
      node,
      index: 0
    }, () => {
      this._fetchDataView(0)
    })
  },
  
  // 拉取数据
  _fetchDataView(index) {
    const { actions } = this.props
    const { node } = this.state

    // 预览数据
    const fetchPrevData = () => {
      actions.fetchDatasetResult(node.id);
    }

    // 字段设置 
    // ****
    // 注意：更新的数据在本地更新的时候，放存在datasetTable中。所以，如果datasetTable 没有数据的时候是需要重新更新的
    const fetchFieldData = () => {
      actions.fetchDatasetData(node.id)
    }

    // 关联报告
    const fetchRelateData = () => {
      actions.fetchDatasetRelate(node.id)
    }

    // 操作日志
    const fetchLogData = () => {
      actions.fetchDatasetLog({ dataset_id: node.id, type: node.type })
    }

    switch (index) {
      case 0:
        return fetchPrevData();
      case 1:
        return fetchFieldData();
      case 2:
        return fetchRelateData();
      case 3:
        return fetchLogData();
      default:
        return false
    }
  },

  // 移动数据集
  _moveDataset(source, target) {
    this.props.actions.fetchMoveDataset(source, target, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSucc(json.msg);
      }
    });
  },

  // 更新数据集展开状态缓存
  _setDatasetSpreads(node, spread) {
    this.props.actions.updateDatasetSpreads({ [node.id]: spread });
  },

  // 是否重复定义名字
  _getInitNodeName(node, name) {
    const treeData = this.props.datasetTree
    const parent_path = node ? node.path : null
    let target = null

    if (Array.isArray(parent_path)) {
      parent_path.forEach((item, index) => {
        if (index === 0) {
          target = treeData[item]
        } else {
          target = target.sub[item]
        }
      })
    }

    const bortherNode = target ? target.sub : treeData
    // 计数
    let i = 1;
    let initname = name
    // 初始化名字
    const initName = () => {
      if (bortherNode.find(item => item.name === initname)) {
        initname = `${name}_${i}`
        i++;
        initName();
      }
    }

    initName();

    return initname
  },

  showSucc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  },

  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    })
  },

  STYLE_SHEET: {
    explorer: {
      width: '240px',
      height: 'calc(100% - 35px)',
      borderWidth: '1px',
      borderStyle: 'solid',
      position: 'relative',
      zIndex: 5
    },
    explorerContent: {
      position: 'absolute',
      top: '54px',
      right: 0,
      bottom: 0,
      left: 0,
      overflow: 'auto',
    },
    addFolderBtn: {
      position: 'absolute',
      right: 0,
      top: '11px',
      cursor: 'pointer',
      padding: '8px'
    },
    menuIcon: {
      display: 'block',
      fontSize: '15px',
      transition: 'color .3s'
    }
  },
})

const stateToProps = state => ({
  ...state.dataset,
  userInfo: state.user.userInfo,
  project: state.user.project,
  roleList: state.authorityRole.roleList
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, userActionCreators, dataSetActionCreators, authorityRoleActionCreators, dateviewItemDetailActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DatasetList);
