import React from 'react';
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class'

import Loading from 'react-bootstrap-myui/lib/Loading';
import Select from 'react-bootstrap-myui/lib/Select';
import { Select as TreeSelect, Tree } from 'rt-tree';
import Input from 'react-bootstrap-myui/lib/Input';
import DatasetFieldEditor from '../components/DatasetFieldEditor';
import DatasetResultTable from '../components/DatasetResultTable';
import SavePathDialog from '../components/SavePathDialog';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataSetActionCreators } from '../../../redux/modules/dataset/dataset';
import { actions as userActionCreators } from '../../../redux/modules/organization/user';
import { actions as commonActionCreators } from '../../../redux/modules/common';

import XStorage from '@helpers/XStorage';
import TipMixin from '@helpers/TipMixin';
import ConfirmsMixin from '@helpers/ConfirmsMixin';

import { getArrayFromTree, getFirstValidNode } from '../../../helpers/groupTreeUtils';
import { baseAlias } from '../../../config';
import { TYPE_NAMES } from '../constants';

import '../dataset.less';
import 'rt-tree/dist/css/rt-select.css';

const DatasetDetailLABEL = createReactClass({
  displayName: 'DatasetDetailLABEL',

  mixins: [TipMixin, ConfirmsMixin],

  propTypes: {
    actions: PropTypes.object,
    params: PropTypes.object,
    datasetData: PropTypes.object,
    onChangeNavBar: PropTypes.func,
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      uuid: new Date().getTime(),
      tmpl_id: '',                            // 指标模板id
      org_id: '',                             // 组织架构id
      tag_id: '',                             // 标签id

      previewLength: 100,                     // 预览行数
      rightPanelMode: 'header-edit',          // 当前模式: header-edit -> 表头编辑; body-view -> 预览

      saveDialog: {
        show: false,
        name: ''
      },
      savePending: false,
      hasRun: false
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容 
    this.props.onChangeNavBar([{
      name: '创建数据集',
      url: '/dataset/list'
    }, {
      name: this.props.params.id ? '编辑标签数据集' : '添加标签数据集'
    }], [{
      text: '保存',
      icon: 'dmpicon-save',
      style: 'green',
      func: this.handleOpenSaveDialog,
      ref: 'save-btn'
    }]);
    // 如果存在数据集旧数据 如果不是同一个数据集则清空
    if (this.props.datasetData && (!this.props.params.id || this.props.datasetData.id !== this.props.params.id)) {
      this.props.actions.clearDatasetData()
    }
  },

  componentDidMount() {
    const { params, actions } = this.props
    // 如果是编辑 先获取数据集详情
    if (params.id) {
      actions.fetchTemplates();

      actions.fetchDatasetData(params.id, (json) => {
        // 成功获取数据后初始化页面数据
        if (json.result && json.data && json.data.content) {
          const newState = {
            tmpl_id: json.data.content.tmpl_id || '',
            tag_id: json.data.content.label_id || '',
            org_id: json.data.content.org_id || ''
          };

          if (json.data.field && Object.getOwnPropertyNames(json.data.field).length > 0) {
            newState.hasRun = true;
          }
          this.setState({ ...newState });
          this._getOrg(json)
        }
      })
    } else {
      // 获取指标模板
      actions.fetchTemplates(null, (json) => {
        if (json.result && Array.isArray(json.data.items) && json.data.items.length > 0) {
          this.setState({ tmpl_id: json.data.items[0].id });
        }
      });

      // 获取组织机构
      actions.fetchOrgTrees((json) => {
        if (json.result && Array.isArray(json.data) && json.data.length > 0) {
          const orgArray = getArrayFromTree(json.data);
          const savedOrgId = XStorage.getValue(`ORG_ID-${XStorage.getValue('tenant_code')}-${XStorage.getValue('account')}`);
          // 判断缓存的组织机构id是否有效
          if (savedOrgId && orgArray.filter(item => item.id === savedOrgId && !item.disable)) {
            this.setState({ org_id: savedOrgId });
          } else {
            this.setState({ org_id: getFirstValidNode(json.data).id });
          }
        }
      });
    }
  },

  componentWillUpdate(nextProps, nextState) {
    // 监测org_id和tmpl_id的变化
    const changed = this.state.org_id !== nextState.org_id || this.state.tmpl_id !== nextState.tmpl_id
    if (nextState.org_id && nextState.tmpl_id && changed) {
      // 当org_id和tmpl_id发生改变时清空右侧数据
      this.props.actions.clearDatasetData();
      // 当org_id和tmpl_id发生改变时自动调用接口获取标签列表
      this.props.actions.fetchTags({
        tmpl_id: nextState.tmpl_id,
        org_id: nextState.org_id,
        page_size: 100000
      });
    }
  },

  render() {
    const { pending, orgTrees, orgPending, tagsList, tagsPending, templatesList, templatePending } = this.props;
    const { tmpl_id, org_id, tag_id, saveDialog, savePending } = this.state;

    const loadingStatus = pending || orgPending || tagsPending || templatePending;

    const hasOrgTree = Array.isArray(orgTrees) && orgTrees.length > 0;

    return (
      <div className="modules-page-container">
        <div className="data-view dataset-detail-page dataset-detail-label-page"
          id="dataset-detail-label-page">
          <div className="left-panel" style={this.STYLE_SHEET.leftPanel}>
            <div className="form-group" style={{ width: '100%', marginBottom: '14px' }}>
              <label className="control-label">
                <span><i className="required">*</i>指标模板</span>
              </label>
              <div className="input-wrapper">
                <Select value={tmpl_id}
                  maxHeight={200}
                  width="100%"
                  openSearch={true}
                  onSelected={this.handleSelectTemplate}>
                  {
                    templatesList.map(item => <option value={item.id} key={item.id}>{item.name}</option>)
                  }
                </Select>
              </div>
            </div>
            <div className="form-group" style={{ width: '100%', marginBottom: '14px' }}>
              <label className="control-label">
                <span><i className="required">*</i>组织架构</span>
              </label>
              <div className="input-wrapper">
                <TreeSelect search style={{ width: '100%' }} menuStyle={{ width: '100%', maxHeight: 300 }}>
                  <Tree defaultExpanded={hasOrgTree ? [orgTrees[0].id] : []}
                    data={hasOrgTree ? orgTrees : []}
                    selected={[org_id]}
                    disabled={node => node.disable}
                    onSelect={this.handleSelectTree}
                    onChange={this.handleChangeTree} />
                </TreeSelect>
              </div>
            </div>
            <div className="form-group" style={{ width: '100%', marginBottom: '0px' }}>
              <label className="control-label">
                <span><i className="required">*</i>标签</span>
              </label>
              <div className="input-wrapper">
                <Select value={tag_id}
                  maxHeight={200}
                  width="100%"
                  openSearch={true}
                  onSelected={this.handleSelectTag}>
                  {
                    tagsList.map(item => <option value={item.id} key={item.id}>{item.name}</option>)
                  }
                </Select>
              </div>
            </div>
          </div>

          <div className="right-panel" style={this.STYLE_SHEET.rightPanel}>
            {this.renderRightPanelTitle()}
            <div className="right-panel-content"
              id="dataset-right-panel-content"
              style={this.STYLE_SHEET.rightPanelContent}>
              {this.renderRightPanelTable()}
            </div>
          </div>

          {
            saveDialog.show && (
              <SavePathDialog show={saveDialog.show}
                savePending={savePending}
                name={saveDialog.name}
                onSearch={this.props.actions.filterFloders}
                onHide={this.handleCloseSaveDialog}
                onSure={this.saveDataset} />
            )
          }

          <Loading show={loadingStatus} containerId='dataset-detail-label-page' />
        </div>
      </div>
    );
  },

  // 渲染右侧头部
  renderRightPanelTitle() {
    const { rightPanelMode, previewLength } = this.state;
    const { datasetTableTotal } = this.props;

    return (
      <div className="right-panel-title" style={{ paddingBottom: '10px', height: '38px' }}>
        <div className="right-panel-mode-tab" style={{ float: 'left' }}>
          <i className={`dmpicon-calendar ${rightPanelMode === 'header-edit' ? 'active' : ''}`}
            onClick={this.handleChangeRightPanelMode.bind(this, 'header-edit')}
            style={this.STYLE_SHEET.modeTabBtn}></i>
          <i className={`dmpicon-view ${rightPanelMode === 'body-view' ? 'active' : ''}`}
            onClick={this.handleChangeRightPanelMode.bind(this, 'body-view')}
            style={this.STYLE_SHEET.modeTabBtn}></i>
        </div>
        {
          rightPanelMode === 'body-view' && (
            <div className="form preview-length-config" style={{ float: 'right' }}>
              共计
              <span className="preview-length-number">{datasetTableTotal}</span>
              行
              <span style={{ padding: '0 10px 0 20px' }}>
                预览行数：
              </span>
              <Input type="text"
                placeholder="请输入预览行数"
                disabled={true}
                value={previewLength}
                onChange={this.handleChangePreviewLength}
                className="line-number-input-box" />
            </div>
          )
        }
      </div>
    );
  },

  // 渲染右侧数据表
  renderRightPanelTable() {
    const { datasetTable, datasetData } = this.props;
    const { rightPanelMode } = this.state;

    return rightPanelMode === 'header-edit' ? (
      <DatasetFieldEditor
        fieldLock={{ field_group: true, alias_name: true, data_type: true, format: true, visible: true }}
        data={datasetData.field}
        onUpdate={this.props.actions.updateDatasetField} />
    ) : rightPanelMode === 'body-view' ? (
      <DatasetResultTable data={datasetTable.data} key={this.state.uuid} head={datasetTable.head} editable={false} />
    ) : null;
  },

  // 选择指标模板
  handleSelectTemplate(opts) {
    if (this.state.tmpl_id === opts.value) {
      return;
    }

    this.setState({
      tmpl_id: opts.value,
      tag_id: ''
    });
  },

  // 组织架构树选择
  handleSelectTree(select, value, options) {
    if (options.disable) {
      return false;
    }
  },

  // 组织架构选择值变更
  handleChangeTree(value) {
    const { org_id } = this.state;

    if (value[0] === org_id) {
      return;
    }

    // 缓存组织机构id
    XStorage.setValue(`ORG_ID-${XStorage.getValue('tenant_code')}-${XStorage.getValue('account')}`, value[0]);

    this.setState({
      org_id: value[0],
      tag_id: ''
    });
  },

  // 选择标签
  handleSelectTag(opts) {
    if (this.state.tag_id === opts.value) {
      return
    }

    // 选择的标签变更时清空右侧数据
    this.props.actions.clearDatasetData();

    this.setState({
      tag_id: opts.value
    });

    this._runDataset(opts.value);
  },

  // 修改预览行数
  handleChangePreviewLength(e) {
    const newLength = e.target.value > 1000 ? 1000 : (e.target.value < 1 ? 1 : e.target.value);
    this.setState({
      previewLength: newLength
    });
  },

  // 切换右侧面板模式 
  handleChangeRightPanelMode(mode) {
    // 没有切换不处理
    if (this.state.rightPanelMode === mode) {
      return;
    }

    // 如果是切换到body-view模式 获取结果数据
    if (mode === 'body-view') {
      this._getDatasetResult();
    }

    this.setState({
      rightPanelMode: mode
    });
  },

  // 打开保存对话框
  handleOpenSaveDialog() {
    if (!this.state.tag_id) {
      this.showErr('未选择标签');
      return;
    }

    const { datasetData } = this.props;

    if (!datasetData || !datasetData.field || !this.state.hasRun) {
      this.showErr('请选择已生成明细数据的标签');
      return;
    }

    // 如果是编辑直接保存
    if (this.props.params.id) {
      this.saveDataset();
    } else {
      this.setState({
        saveDialog: {
          show: true,
          name: ''
        }
      });
    }
  },

  // 关闭保存对话框
  handleCloseSaveDialog() {
    this.setState({
      saveDialog: {
        show: false,
        name: ''
      }
    })
  },

  // 执行数据集并获取结果
  _runDataset(tag_id) {
    this.props.actions.fetchRunLabelDataset(tag_id, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
        this.setState({
          hasRun: false
        });
      } else {
        this.setState({
          hasRun: !!json.data,
          uuid: new Date().getTime()
        });
        // 当获取到的结果条数大于等于预览限制时，获取真实条数
        if (Array.isArray(json.data.data) && json.data.data.length >= this.state.previewLength) {
          this._getTableTotal();
        }
      }
    });
  },

  // 保存DATASET
  async saveDataset(name, parentId) {
    const { datasetData, userInfo, params } = this.props;
    const { tmpl_id, org_id, tag_id } = this.state;

    const field = [];

    Object.getOwnPropertyNames(datasetData.field).forEach((key) => {
      field.push(...datasetData.field[key]);
    });

    const newData = {
      field,
      name: name || datasetData.name,
      parent_id: parentId || datasetData.parent_id || '',
      type: TYPE_NAMES.label,
      content: {
        label_id: tag_id,
        tmpl_id,
        org_id
      }
    }

    // 为后台传入 userInfo 中的 user_group_id 字段
    newData.user_group_id = userInfo.group_id

    if (params.id) {
      newData.id = params.id
      // 等待校验
      await this.checkBeforeSave(newData)
    }
    
    // 如果是编辑，加上id & parent_id字段
    if (params.id) {
      this.props.actions.fetchUpdateDataset(newData, (json) => {
        if (json.result) {
          this.showSucc(json.msg);
          setTimeout(() => {
            this.context.router.push(`${baseAlias}/dataset/list`);
          }, 1800);
        } else {
          this.showErr(json.msg);
        }
      });
    } else {
      this.setState({
        savePending: true
      });
      this.props.actions.fetchAddDataset(newData, (json) => {
        if (json.result) {
          this.showSucc(json.msg);
          this.setState({
            saveDialog: {
              show: false,
              name: ''
            },
            savePending: false
          });
          setTimeout(() => {
            this.context.router.push(`${baseAlias}/dataset/list`);
          }, 1800);
        } else {
          this.showErr(json.msg);
          this.setState({
            savePending: false
          });
        }
      });
    }
  },

  checkBeforeSave(data) {
    return new Promise((resolve) => {
      this.props.actions.checkBeforeSave(data, (json) => {
        if (json.result) {
          resolve()
        } else {
          this.showConfirm({
            content: <span style={{ width: '350px', display: 'inline-block' }}>{json.msg}</span>,
            checkbox: false,
            ok: () => {
              resolve()
            }
          });
        }
      })
    })
  },

  // 获取数据集结果
  _getDatasetResult() {
    if (!this.props.datasetTable.data && this.props.params.id) {
      this.props.actions.fetchDatasetResult(this.props.params.id, (json) => {
        if (json.result && Array.isArray(json.data.data) && json.data.data.length >= this.state.previewLength) {
          this._getTableTotal();
        }
      });
    }

    if (this.props.datasetTable.data && Array.isArray(this.props.datasetTable.data) && this.props.datasetTable.data.length >= this.state.previewLength) {
      this._getTableTotal()
    }
  },

  // 获取数据总数
  _getTableTotal() {
    if (!this.state.tag_id || !this.state.tmpl_id || !this.state.org_id) {
      return;
    }
    this.props.actions.fetchDatasetResultTotal({
      type: TYPE_NAMES.label,
      content: JSON.stringify({
        label_id: this.state.tag_id,
        tmpl_id: this.state.tmpl_id,
        org_id: this.state.org_id
      })
    });
  },

  // 获取组织机构
  _getOrg(json) {
    this.props.actions.fetchOrgTrees((_json) => {
      if (_json.result && _json.data.length > 0) {
        const orgArray = getArrayFromTree(_json.data);
        const savedOrgId = XStorage.getValue(`ORG_ID-${XStorage.getValue('tenant_code')}-${XStorage.getValue('account')}`);
        // 判断获取的组织机构id是否有效
        if (json.data.content.org_id && orgArray.filter(item => item.id === json.data.content.org_id && !item.disable).length > 0) {
          this.setState({
            tag_id: json.data.content.label_id || '',
            org_id: json.data.content.org_id
          });
        } else if (savedOrgId && orgArray.filter(item => item.id === savedOrgId && !item.disable).length > 0) {
          this.setState({
            org_id: savedOrgId,
            tag_id: ''
          });
        } else {
          this.setState({
            org_id: getFirstValidNode(_json.data).id,
            tag_id: ''
          });
        }
      }
    });
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
    leftPanel: {
      width: '420px',
      height: '100%',
      padding: '16px',
      overflowX: 'hidden',
      overflowY: 'auto'
    },
    groupTitle: {
      padding: '16px 0 8px',
      height: '38px',
      fontSize: '14px',
      lineHeight: 1
    },
    rightPanel: {
      position: 'absolute',
      left: '432px',
      top: 0,
      bottom: 0,
      right: 0,
      height: '100%',
      padding: '12px 16px 16px'
    },
    modeTabBtn: {
      fontSize: '16px',
      padding: '6px',
      display: 'inline-block',
      marginRight: '20px',
      cursor: 'pointer'
    },
    rightPanelContent: {
      borderWidth: '1px',
      borderStyle: 'solid',
      position: 'absolute',
      left: '16px',
      right: '16px',
      top: '50px',
      bottom: '16px'
    },
  },
})

const stateToProps = state => ({
  ...state.dataset,
  ...state.common,
  userInfo: state.user.userInfo
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataSetActionCreators, userActionCreators, commonActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DatasetDetailLABEL);
