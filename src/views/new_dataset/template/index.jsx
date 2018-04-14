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

import TipMixin from '../../../helpers/TipMixin';
import XStorage from '../../../helpers/XStorage';
import { getArrayFromTree, getFirstValidNode } from '../../../helpers/groupTreeUtils';
import { baseAlias } from '../../../config';
import { TYPE_NAMES } from '../constants';

import '../dataset.less';
import 'rt-tree/dist/css/rt-select.css';

const DatasetDetailTEMPLATE = createReactClass({
  displayName: 'DatasetDetailTEMPLATE',
  mixins: [TipMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      uuid: new Date().getTime(),
      previewLength: 100,                     // 预览行数
      rightPanelMode: 'header-edit',          // 当前模式: header-edit -> 表头编辑; body-view -> 预览
      hasRun: false
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容 
    this.props.onChangeNavBar([{
      name: '创建数据集',
      url: '/dataset/list'
    }, {
      name: '查看模版数据集'
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
      actions.fetchDatasetData(params.id)
    }
  },

  render() {
    const { pending } = this.props;

    return (
      <div className="modules-page-container">
        <div className="data-view dataset-detail-page dataset-detail-label-page"
          id="dataset-detail-label-page">
          <div className="right-panel" style={this.STYLE_SHEET.rightPanel}>
            {this.renderRightPanelTitle()}
            <div className="right-panel-content"
              id="dataset-right-panel-content"
              style={this.STYLE_SHEET.rightPanelContent}>
              {this.renderRightPanelTable()}
            </div>
          </div>

          <Loading show={pending} containerId='dataset-detail-label-page' />
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
      <DatasetResultTable data={datasetTable.data} key={this.state.uuid} head={datasetTable.head} />
    ) : null;
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


  // 获取数据集结果
  _getDatasetResult() {
    if (!this.props.datasetTable.data && this.props.params.id) {
      this.props.actions.fetchDatasetResult(this.props.params.id);
    }
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
    groupTitle: {
      padding: '16px 0 8px',
      height: '38px',
      fontSize: '14px',
      lineHeight: 1
    },
    rightPanel: {
      position: 'absolute',
      left: '0px',
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

export default connect(stateToProps, dispatchToProps)(DatasetDetailTEMPLATE);
