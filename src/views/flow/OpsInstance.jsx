import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger'
import Tooltip from 'react-bootstrap-myui/lib/Tooltip'
import Loading from 'react-bootstrap-myui/lib/Loading'
import FlexDataTable from '../../components/FlexDataTable'
import IconButton from '../../components/IconButton'
import LogDialog from './components/LogDialog'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as flowOpsActionCreators } from '../../redux/modules/flow/ops'

import TipMixin from '../../helpers/TipMixin'

import './ops-instance.less'

const OpsInstance = createReactClass({
  displayName: 'OpsInstance',
  mixins: [TipMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      logDialog: {
        item: null,
        show: false,
        data: []
      }
    }
  },

  componentWillMount() {
    const { params } = this.props
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar([{
      name: '流程运维',
      url: '/flow/ops/instance'
    }, {
      name: params.instance_name
    }]);
  },

  componentDidMount() {
    this.fetchList(1)
  },

  render() {
    const { logDialog } = this.state
    const { node_list, node_pending, node_page, node_total, log_data, log_pending } = this.props;
    // 数据表格表头字段
    const dataFields = [{
      idField: true,
      name: '序号'
    }, {
      name: '节点名称',
      key: 'name',
      width: '12%'
    }, {
      key: 'startup_time',
      name: '开始时间',
      width: '200px'
    }, {
      key: 'end_time',
      name: '结束时间',
      width: '200px'
    }, {
      key: 'running_time',
      name: '运行时长',
      width: '120px'
    }, {
      key: 'status',
      name: '状态',
      width: '80px',
      flex: 1,
      minWidth: '60px'
    }, {
      key: 'actions',
      name: '操作',
      width: '100px'
    }];

    // 数据表格行模版
    const rowTemplate = (
      <div>
        <div>%id%</div>

        <div childNodes={rowData => (
          <OverlayTrigger trigger="hover" placement="top" overlay={(<Tooltip>{rowData.name}</Tooltip>)}>
            <div style={this.STYLE_SHEET.textLimit}>{rowData.name ? `[${rowData.type}] ${rowData.name}` : '-'}</div>
          </OverlayTrigger>
        )} />

        <div childNodes={rowData => (rowData.startup_time ? rowData.startup_time.replace('T', ' ') : '')} />

        <div childNodes={rowData => (rowData.end_time ? rowData.end_time.replace('T', ' ') : '-')} />

        <div childNodes={rowData => (rowData.running_time >= 0 && rowData.running_time !== null ? `${rowData.running_time}s` : '-')} />

        <div childNodes={(rowData) => {
          const runStatusClsMap = {
            已创建: 'run-status-created',
            运行中: 'run-status-runing',
            已成功: 'run-status-success',
            已失败: 'run-status-failed',
            已终止: 'run-status-aborted'
          };

          return (
            <div style={{ fontSize: '12px', width: '100%', height: '100%', minWidth: '60px' }}
              className={runStatusClsMap[rowData.status] || 'run-status-default'}>
              {rowData.status || '未开始'}
            </div>
          );
        }} />

        <div childNodes={rowData => (
          <div style={{ padding: '8px 0', width: '100%', height: '100%' }}>
            <IconButton
              onClick={this.handleShowLog.bind(this, rowData)}
              className="datatable-action"
              iconClass="dmpicon-journal"
            >
              日志
            </IconButton>
          </div>
        )} />
      </div>
    );

    return (
      <div className="modules-page-container">
        <div className="flow-ops-instance-page" style={{ width: '100%', height: '100%' }}>
          <FlexDataTable
            flexDataTableId="datatable-wrapper"
            headerHeight={40}
            headerCellBorder={true}
            lineHeight={40}
            pending={node_pending}
            hasNext={node_list.length < node_total}
            dataFields={dataFields}
            rowTemplate={rowTemplate}
            onFetchData={node_total > this.PAGE_SIZE ? this.fetchList.bind(this, node_page + 1) : false}
            fetchAction="scroll"
            data={node_list}
          />
          <Loading show={node_pending} containerId="datatable-wrapper" />
        </div>
        <LogDialog
          show={logDialog.show}
          data={log_data}
          pending={log_pending}
          onFresh={this.handleFresh}
          onHide={this.handleHide}
        />
      </div>
    )
  },

  handleHide() {
    this.setState({
      logDialog: {
        ...this.state.logDialog,
        show: false
      }
    })
  },

  handleFresh() {
    this.LOG_PAGE = 1
    this.handleShowLog(this.state.logDialog.flow)
  },

  handleShowLog(item) {
    const { actions, params } = this.props
    // 回调 如果 page < Math.ceil(json.data.total / page_size)
    const fetchLog = (total) => {
      if (this.LOG_PAGE <= Math.ceil(total / this.LOG_PAGE_SIZE)) {
        actions.fetchLog({
          instance_id: params.instance_id,
          node_id: item.node_id,
          table_name: '',
          page_size: this.LOG_PAGE_SIZE,
          page: this.LOG_PAGE
        }, (json) => {
          if (json.result) {
            ++this.LOG_PAGE
            fetchLog(total)
          }
        })
      }
    }
    // 如果点击的item.id 不相同，则重置page_size
    if (!this.state.logDialog.flow || item.id !== this.state.logDialog.flow.id) {
      this.LOG_PAGE = 1
    }
    this.setState({
      logDialog: {
        ...this.state.logDialog,
        show: true,
        flow: item
      }
    }, () => {
      // 未初始化
      if (this.LOG_PAGE === 1) {
        actions.clearLog();
        actions.fetchLog({
          instance_id: params.instance_id,
          node_id: item.node_id,
          table_name: '',
          page_size: this.LOG_PAGE_SIZE,
          page: this.LOG_PAGE
        }, (json) => {
          if (json.result) {
            fetchLog(+json.data.total)
          }
        })
      }
    })
  },

  // 拉取清洗的列表
  fetchList(page = 1) {
    const { params, actions } = this.props

    actions.fetchNodeList({
      page,
      instance_id: params.instance_id,
      page_size: this.PAGE_SIZE,
    });
  },

  showErr(message) {
    this.showTip({
      show: true,
      status: 'error',
      content: message
    })
  },

  showCrr(message) {
    this.showTip({
      show: true,
      status: 'success',
      content: message
    })
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
})

const stateToProps = state => ({
  ...state.flowOps
})

const dispatchToProps = dispatch => ({ actions: bindActionCreators(flowOpsActionCreators, dispatch) })

export default connect(stateToProps, dispatchToProps)(OpsInstance)
