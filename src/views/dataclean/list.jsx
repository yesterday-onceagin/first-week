import PropTypes from 'prop-types';
import React from 'react';
import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import Input from 'react-bootstrap-myui/lib/Input';

import FlexDataTable from '../../components/FlexDataTable';
import IconButton from '../../components/IconButton';
import SwitchButton from '../../components/SwitchButton';
import AddDatacleanDialog from './components/AddDatacleanDialog';
import DispatchConfigDialog from './components/DispatchConfigDialog';

import AuthComponent from '@components/AuthComponent';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataCleanActionCreators } from '../../redux/modules/dataclean/dataclean';

import TipMixin from '../../helpers/TipMixin';
import ConfirmMixin from '../../helpers/ConfirmsMixin';
import { getCronDesc, decodeCron } from '../../helpers/cron';
import { baseAlias } from '../../config';

const DataCleanList = createReactClass({
  displayName: 'DataCleanList',

  //mixin提示框 和确定框 弹窗
  mixins: [TipMixin, ConfirmMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      // 当前显示的流程列表类型：1 -> 内置; 0 -> 自定义;
      buildIn: sessionStorage.getItem('DATACLEAN_BUILD_IN_SETTING') === '1' ? 1 : 0,
      keyword: '',
      addDialog: {
        show: false,
        info: {
          name: '',
          description: ''
        }
      },
      dispatchDialog: {
        show: false,
        data: {}
      }
    }
  },

  componentDidMount() {
    // 获取流程列表
    this.fetchFlowList();
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('数据清洗管理', [{
      pagecode: '数据清洗',
      visiblecode: 'edit',
      text: '新增数据清洗',
      icon: 'dmpicon-add',
      func: this.handleOpenAddDialog
    }]);
  },

  render() {
    //是否加载 和对应的list列表字段
    const { flowList, pending, flowPage, flowTotal, flowSorts } = this.props;
    const { buildIn, addDialog, dispatchDialog } = this.state;
    const sortArray = flowSorts ? JSON.parse(flowSorts) : []
    const defaultSorts = {}
    sortArray.forEach((item) => {
      defaultSorts[item.id] = {
        id: item.id,
        method: item.method
      }
    })
    // 数据表格行模版
    const rowTemplate = (
      <div>
        <div>%id%</div>
        <div childNodes={rowData => (
          <OverlayTrigger trigger="hover" placement="top" overlay={(<Tooltip>{rowData.name}</Tooltip>)}>
            <div style={this.STYLE_SHEET.textLimit}>{rowData.name}</div>
          </OverlayTrigger>
        )} />
        <div childNodes={(rowData) => {
          let text = '周期（天）';
          if (rowData.depend_flow_id) {
            text = '流程';
          } else if (rowData.schedule) {
            text = `周期（${this.SCHEDULE_TYPES[decodeCron(rowData.schedule).type]}）`;
          }
          return (
            <div style={{ width: '100%', height: '100%' }}>{text}</div>
          );
        }} />
        <div childNodes={(rowData) => {
          let text = '每天的00:00';
          if (rowData.depend_flow_id) {
            text = rowData.depend_flow_name;
          } else if (rowData.schedule) {
            text = getCronDesc(rowData.schedule);
          }
          return (
            <OverlayTrigger trigger="hover" placement="top" overlay={(<Tooltip>{text}</Tooltip>)}>
              <div style={this.STYLE_SHEET.textLimit}>{text}</div>
            </OverlayTrigger>
          );
        }} />
        <div childNodes={rowData => (
          rowData.description ? (
            <OverlayTrigger trigger="hover" placement="top"
              overlay={(<Tooltip>{rowData.description}</Tooltip>)}>
              <div style={this.STYLE_SHEET.textLimit}>{rowData.description}</div>
            </OverlayTrigger>
          ) : null
        )} />
        <div childNodes={(rowData) => {
          const runStatusClsMap = {
            已创建: 'run-status-created',
            运行中: 'run-status-runing',
            已成功: 'run-status-success',
            已失败: 'run-status-failed',
            已终止: 'run-status-aborted'
          }
          return (
            <div style={{ fontSize: '12px', width: '100%', height: '100%', minWidth: '60px' }}
              className={runStatusClsMap[rowData.run_status] || 'run-status-default'}>
              {rowData.run_status || '未开始'}
            </div>
          );
        }} />
        <div childNodes={rowData => (
          <AuthComponent pagecode='数据清洗'>
            <div style={{ padding: '8px 0', width: '100%', height: '100%' }}>
              <SwitchButton active={rowData.status === '启用'}
                texts={{ on: '启用', off: '停用' }}
                turnOn={this.handleStartFlow.bind(this, rowData.id)}
                turnOff={this.handleStopFlow.bind(this, rowData.id)} />
            </div>
          </AuthComponent>
        )} />
        <div childNodes={rowData => (
          <div style={{ padding: '8px 0', width: '100%', height: '100%' }}>
            <AuthComponent pagecode='数据清洗' visiblecode="edit">
              <IconButton onClick={this.handleRunFlow.bind(this, rowData.id)}
                className="datatable-action"
                iconClass="dmpicon-run">运行</IconButton>
            </AuthComponent>
            {
              buildIn === 1 ? null : (
                <AuthComponent pagecode='数据清洗' visiblecode="edit">
                  <IconButton onClick={this.handleEditFlow.bind(this, rowData.id)}
                    className="datatable-action"
                    iconClass="dmpicon-edit">编辑</IconButton>
                </AuthComponent>
              )
            }
            {
              buildIn === 1 ? null : (
                <AuthComponent pagecode='数据清洗' visiblecode="edit">
                  <IconButton onClick={this.handleDeleteFlow.bind(this, rowData.id)}
                    className="datatable-action"
                    iconClass="dmpicon-del">删除</IconButton>
                </AuthComponent>
              )
            }
            {
              buildIn === 1 ? (
                <AuthComponent pagecode='数据清洗' visiblecode="edit">
                  <IconButton onClick={this.handleDispatchFlow.bind(this, rowData)}
                    className="datatable-action"
                    iconClass="dmpicon-adjust">调度</IconButton>
                </AuthComponent>
              ) : null
            }
            <IconButton onClick={this.handleViewFlow.bind(this, rowData)}
              className="datatable-action"
              iconClass="dmpicon-monitor">运维</IconButton>
          </div>
        )} />
      </div>
    );

    const _fetchNext = flowTotal > this.PAGE_SIZE ? this.fetchFlowList.bind(this, flowPage + 1) : false;

    return (
      <div className="modules-page-container">
        <div className="data-view dataclean-list-page has-bg-color">
          {this.renderTabbar()}
          <FlexDataTable flexDataTableId="datatable-wrapper"
            headerHeight={40}
            headerCellBorder={true}
            lineHeight={40}
            pending={pending}
            hasNext={flowList.length < flowTotal}
            dataFields={this.DATA_FIELDS}
            rowTemplate={rowTemplate}
            onChangeSorts={this.handleChangeSorts}
            onFetchData={_fetchNext}
            fetchAction="scroll"
            data={flowList}
            defaultSorts={defaultSorts}
          />

          <Loading show={pending} containerId='datatable-wrapper' />
          {
            addDialog.show && (
              <AddDatacleanDialog
                show={addDialog.show}
                data={addDialog.info}
                onSure={this.handleSubmitAddDialog}
                onHide={this.handleCloseAddDialog}
              />
            )
          }
          {
            dispatchDialog.show && (
              <DispatchConfigDialog
                show={dispatchDialog.show}
                flow={dispatchDialog.flow}
                getFlowList={this.props.actions.getFlowList}
                getFlowData={this.props.actions.getFlowData}
                fetchUpdateFlow={this.props.actions.fetchUpdateFlow}
                showTip={this.showTip}
                onHide={this.handleCloseDispatchDialog}
              />
            )
          }
        </div>
      </div>
    )
  },

  // 渲染tab栏
  renderTabbar() {
    const { buildIn, keyword } = this.state;

    return (
      <div className="dataview-tab" style={{ padding: '20px 12px' }}>
        <div className="dataview-tab-btn-container">
          <button type="button"
            className={`btn btn-dataview-tab ${buildIn === 0 ? 'active' : ''}`}
            onClick={this.handleChangeTab.bind(this, 0)}
          >
            自定义
          </button>
          <button type="button"
            className={`btn btn-dataview-tab ${buildIn === 1 ? 'active' : ''}`}
            onClick={this.handleChangeTab.bind(this, 1)}
          >
            内置
          </button>
        </div>

        <div className="form single-search-form" style={{ float: 'right', width: '310px' }}>
          <Input type="text"
            placeholder="请输入关键字"
            value={keyword}
            onChange={this.handleChangeKeyword}
            addonAfter={<i className="dmpicon-search" />}
            className="search-input-box" />
          {
            keyword && <i className="dmpicon-close" onClick={this.handleClearKeyword}></i>
          }
        </div>
      </div>
    );
  },

  // 切换排序数组(sorts) 
  handleChangeSorts(sorts) {
    this.fetchFlowList(1, sorts);
  },

  // 运行一个流程
  handleRunFlow(id) {
    this.props.actions.fetchRunFlow(id, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSucc(json.msg);
      }
    });
  },

  // 编辑一个流程
  handleEditFlow(id) {
    this.context.router.push(`${baseAlias}/dataclean/flow/${id}`);
  },

  // 删除一个流程
  handleDeleteFlow(id) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该数据清洗流程吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.fetchDeleteFlow(id, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg);
          } else {
            this.showSucc(json.msg);
          }
        })
      }
    });
  },

  // 查看一个流程的运维状态
  handleViewFlow(item) {
    this.context.router.push(`${baseAlias}/flow/ops/${item.id}/${item.name}`);
  },

  // 配置内置流程调度(打开弹窗)
  handleDispatchFlow(item) {
    this.setState({
      dispatchDialog: {
        show: true,
        flow: item
      }
    });
  },

  // 关闭内置流程调度配置窗口
  handleCloseDispatchDialog() {
    this.setState({
      dispatchDialog: {
        show: false
      }
    });
  },

  // 启用一个清洗流程
  handleStartFlow(id) {
    this.props.actions.fetchEnableFlow(id, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSucc(json.msg);
      }
    });
  },

  // 禁用一个清洗流程
  handleStopFlow(id) {
    this.props.actions.fetchDisableFlow(id, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSucc(json.msg);
      }
    });
  },

  // 打开新增数据清洗对话框
  handleOpenAddDialog() {
    this.setState({
      addDialog: {
        ...this.state.addDialog,
        show: true
      }
    });
  },

  // 新增数据清洗提交
  handleSubmitAddDialog(data) {
    data.type = '数据清洗';                   // 流程类型默认为数据清洗
    data.schedule = '0 0 0 ? * * *';         // 流程调度方案默认为按天(每天00:00)

    this.props.actions.fetchAddFlow(data, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.handleCloseAddDialog();
        this.context.router.push(`${baseAlias}/dataclean/flow/${json.data}`);
      }
    });
  },

  // 关闭数据清洗对话框
  handleCloseAddDialog() {
    this.setState({
      addDialog: {
        show: false,
        info: {
          name: '',
          description: ''
        }
      }
    });
  },

  // 切换显示buildIn
  handleChangeTab(v) {
    // 缓存当前浏览的tab
    sessionStorage.setItem('DATACLEAN_BUILD_IN_SETTING', v);
    this.setState({
      buildIn: v
    }, this.fetchFlowList.bind(this, 1));
  },

  // 输入搜索关键字
  handleChangeKeyword(e) {
    this.setState({
      keyword: e.target.value
    }, this.fetchFlowList.bind(this, 1));
  },

  // 清除搜索关键字
  handleClearKeyword(e) {
    e.stopPropagation();

    this.setState({
      keyword: ''
    }, this.fetchFlowList.bind(this, 1));
  },

  // 拉取清洗的列表
  fetchFlowList(page = 1, sorts = undefined) {
    const { buildIn, keyword } = this.state;
    let _sorts = '';

    if (Array.isArray(sorts) && sorts.length > 0) {
      _sorts = JSON.stringify(sorts)
    } else if (sorts === undefined) {
      _sorts = this.props.flowSorts || '';
    }

    this.props.actions.fetchFlowList({
      page,
      keyword,
      page_size: this.PAGE_SIZE,
      type: '数据清洗',
      build_in: buildIn,
      sorts: _sorts
    });
  },

  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    });
  },

  showSucc(str) {
    this.showTip({
      status: 'success',
      content: str
    });
  },

  PAGE_SIZE: 40,

  // 样式表
  STYLE_SHEET: {
    // text-overflow(一个字空间)
    textLimit: {
      paddingRight: '14px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
      height: '100%'
    }
  },

  SCHEDULE_TYPES: {
    month: '月',
    week: '周',
    day: '天',
    hour: '小时'
  },

  // 表头模板
  DATA_FIELDS: [{
    idField: true,
    name: '序号'
  }, {
    name: '流程名称',
    key: 'name',
    sortable: true,
    width: '16%',
    minWidth: '200px'
  }, {
    key: 'schedule_type',
    name: '调度依赖',
    width: '110px'
  }, {
    key: 'schedule_desc',
    name: '调度时间/依赖流程',
    width: '18%',
    minWidth: '140px'
  }, {
    key: 'description',
    name: '流程描述',
    width: '18%'
  }, {
    key: 'status',
    name: '状态',
    width: '120px',
    flex: 1,
    minWidth: '60px'
  }, {
    key: 'schedule_option',
    name: '调度配置',
    width: '120px'
  }, {
    key: 'actions',
    name: '操作',
    width: '200px'
  }],
})

const stateToProps = state => ({
  ...state.dataclean
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(dataCleanActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(DataCleanList);
