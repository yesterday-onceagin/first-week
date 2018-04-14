import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import Input from 'react-bootstrap-myui/lib/Input';
import FlexDataTable from '../../components/FlexDataTable';
import IconButton from '../../components/IconButton';
import LogDialog from '../flow/components/LogDialog'
import DatePicker from '@components/DatePicker';
import AuthComponent from '@components/AuthComponent';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { actions as feedsActions } from '../../redux/modules/feeds/feeds';
import { actions as flowOpsActionCreators } from '../../redux/modules/flow/ops'

import TipMixin from '../../helpers/TipMixin';
import ConfirmMixin from '../../helpers/ConfirmsMixin';

import { baseAlias } from '../../config';
import './list.less';

let searchTimer = null; // 查询延时器。避免输入频繁请求

const FeedsList = createReactClass({
  displayName: 'FeedsList',

  //mixin提示框 和确定框 弹窗
  mixins: [TipMixin, ConfirmMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      uuid: new Date().getTime(),
      begin_date: '',
      end_date: '',
      keyword: '',
      logDialog: {
        item: null,
        show: false,
        data: []
      }
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar([{
      name: '订阅列表',
      url: '/feeds/list'
    }, {
      name: '邮件执行详情'
    }]);
  },

  componentDidMount() {
    this.fetchList()
  },

  render() {
    //是否加载 和对应的list列表字段
    const { detail_list, pending, detail_page, detail_total, log_data, log_pending } = this.props;
    const { logDialog } = this.state
    // 数据表格表头字段
    const dataFields = [{
      idField: true,
      name: '序号'
    }, {
      key: 'name',
      name: '邮件名称',
      minWidth: '110px',
      width: '15%',
    }, {
      key: 'dashboard_name',
      name: '关联报告',
      minWidth: '110px',
      width: '15%',
    }, {
      key: 'startup_time',
      name: '发送时间',
      width: '15%',
      minWidth: '140px'
    }, {
      key: 'status',
      name: '状态',
      width: '120px'
    }, {
      key: 'actions',
      name: '操作',
      width: '200px'
    }];

    // 数据表格行模版
    const rowTemplate = (
      <div>
        <div>%id%</div>
        <div childNodes={rowData => (
          <OverlayTrigger trigger="hover" placement="top" overlay={ (<Tooltip>{rowData.name}</Tooltip>) }>
            <div style={this.STYLE_SHEET.textLimit}>
              {
                rowData.relevancy_url ? <a href={rowData.relevancy_url} target="_blank" style={{ cursor: 'pointer', color: '#09bef7' }}>{rowData.name}</a> : rowData.name
              }
            </div>
          </OverlayTrigger>
        )}/>
        <div childNodes={rowData => (
          <span>{rowData.dashboard_name}</span>
        )}/>
        <div childNodes={rowData => (
          <span>{rowData.startup_time ? rowData.startup_time.replace('T', ' ') : ''}</span>
        )}/>
        <div childNodes={(rowData) => {
          const runStatusClsMap = {
            已创建: 'run-status-created',
            运行中: 'run-status-runing',
            已成功: 'run-status-success',
            已失败: 'run-status-failed',
            已终止: 'run-status-aborted'
          };
          return <div style={{ fontSize: '12px', width: '100%', height: '100%', minWidth: '60px' }}
            className={runStatusClsMap[rowData.status] || 'run-status-default'}>
            {rowData.status || '未开始'}
          </div>
        }}/>
        <div childNodes={rowData => (
          <div style={{ padding: '8px 0', width: '100%', height: '100%' }}>
            <IconButton onClick={this.handleShowLog.bind(this, rowData)}
              className="datatable-action"
              iconClass="dmpicon-journal">日志</IconButton>
            <AuthComponent pagecode="订阅管理" visiblecode="edit">
              <IconButton onClick={this.handleResend.bind(this, rowData)}
                className="datatable-action"
                iconClass="dmpicon-refresh">重发</IconButton>
            </AuthComponent>
          </div>
        )}/>
      </div>
    );

    return (
      <div className="modules-page-container">
        <div className="data-view feeds-list-page">
          {this.renderTabbar()}
          <div className="table-view">
            <FlexDataTable
              flexDataTableId="datatable-wrapper"
              headerHeight={40}
              headerCellBorder={true}
              lineHeight={40}
              pending={pending}
              hasNext={detail_list.length < detail_total}
              dataFields={dataFields}
              rowTemplate={rowTemplate}
              onChangeSorts={this.handleChangeSorts}
              onFetchData={detail_total > this.PAGE_SIZE ? this.fetchList.bind(this, detail_page + 1) : false}
              fetchAction="scroll"
              data={detail_list}
            />
            <Loading show={pending} containerId='datatable-wrapper'/>
          </div>
          <LogDialog
            show={logDialog.show}
            data={log_data}
            pending={log_pending}
            onFresh={this.handleFresh}
            onHide={this.handleHide}
          />
        </div>
      </div>
    )
  },

  // 渲染tab栏
  renderTabbar() {
    const { keyword, begin_date, end_date } = this.state;
    return (
      <div className="dataview-tab" style={{ padding: '20px 12px' }}>
        <div className="form" style={{ lineHeight: '32px' }}>
          开始时间
        </div>
        <div className="form">
          <DatePicker
            value={begin_date}
            onSelected={this.handledate.bind(this, 'begin_date')}
            style={{ width: '200px' }}
          />
        </div>
        <div className="form" style={{ margin: '0 10px', lineHeight: '32px' }}>至</div>
        <div className="form">
          <DatePicker
            value={end_date}
            onSelected={this.handledate.bind(this, 'end_date')}
            style={{ width: '200px' }}
          />
        </div>
        <div className="form single-search-form" style={{ float: 'right', width: '310px' }}>
          <Input type="text"
            placeholder="请输入邮件名称"
            value={keyword}
            onChange={this.handleChangeKeyword}
            addonAfter={<i className="dmpicon-search"/>}
            className="search-input-box"
          />
          {
            keyword && <i className="dmpicon-close" onClick={this.handleClearKeyword}/>
          }
        </div>
      </div>
    );
  },

  handledate(field, value) {
    this.setState({
      [field]: value
    }, this.fetchList.bind(this, 1))
  },

  handleClearKeyword() {
    this.setState({
      keyword: ''
    }, this.fetchList.bind(this, 1));
  },

  // 切换排序数组(sorts) 
  handleChangeSorts(sorts) {
    this.fetchList(1, sorts);
  },

  // 重发邮件
  handleResend(data) {
    const { actions, params } = this.props
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要重新发送邮件吗？</span>,
      checkbox: false,
      ok: () => {
        actions.resendFeed({ flow_id: params.id, id: data.id }, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg);
          } else {
            this.showSuccess('操作成功！');
            this.fetchList()
          }
        })
      }
    });
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
    const { actions } = this.props
    // 回调 如果 page < Math.ceil(json.data.total / page_size)
    const fetchLog = (total) => {
      if (this.LOG_PAGE <= Math.ceil(total / this.LOG_PAGE_SIZE)) {
        actions.fetchLog({
          instance_id: item.id,
          node_id: '',
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
          instance_id: item.id,
          node_id: '',
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


  // 输入搜索关键字
  handleChangeKeyword(e) {
    // 清空现有的延时器
    clearTimeout(searchTimer)
    this.setState({
      keyword: e.target.value
    }, () => {
      searchTimer = setTimeout(this.fetchList.bind(this, 1), 300)
    });
  },

  // 拉取清洗的列表
  fetchList(page = 1, sorts = undefined) {
    const { keyword, begin_date, end_date } = this.state;
    const { params, actions, detail_sorts } = this.props

    let _sorts = '';

    if (Array.isArray(sorts) && sorts.length > 0) {
      _sorts = JSON.stringify(sorts)
    } else if (sorts === undefined) {
      _sorts = detail_sorts || '';
    }

    actions.fetchFeedDetails({
      page,
      begin_date,
      end_date,
      keyword,
      flow_id: params.id,
      page_size: this.PAGE_SIZE,
      sorts: _sorts
    });
  },

  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    });
  },

  showSuccess(str) {
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
})

const stateToProps = state => ({
  ...state.feeds,
  log_data: state.flowOps.log_data,
  log_pending: state.flowOps.log_pending
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, flowOpsActionCreators, feedsActions), dispatch)
})

export default connect(stateToProps, dispatchToProps)(FeedsList);
