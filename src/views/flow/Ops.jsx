import PropTypes from 'prop-types';
import React from 'react';
import createReactClass from 'create-react-class';
import Select from 'react-bootstrap-myui/lib/Select';
import Input from 'react-bootstrap-myui/lib/Input';
import ButtonGroup from 'react-bootstrap-myui/lib/ButtonGroup';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import Loading from 'react-bootstrap-myui/lib/Loading';
import Button from 'react-bootstrap-myui/lib/Button';
import DatePicker from '../../components/DatePicker';
import FlexDataTable from '../../components/FlexDataTable';
import IconButton from '../../components/IconButton';
import LogDialog from './components/LogDialog';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { getDateStr } from '../../helpers/dateUtils';
import TipMixin from '../../helpers/TipMixin';
import ConfirmMixin from '../../helpers/ConfirmsMixin';

import AuthComponent from '@components/AuthComponent';

import { baseAlias } from '../../config';
import { actions as flowOpsActionCreators } from '../../redux/modules/flow/ops';

import './ops.less';

let searchTimer = null;  // 搜索延时器

const FlowOps = createReactClass({
  displayName: 'FlowOps',
  mixins: [TipMixin, ConfirmMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      flow_id: '',
      keyword: '',
      type: '全部',
      status: '全部',
      timeType: '全部',
      begin_date: '',
      end_date: '',
      logDialog: {
        flow: null,
        show: false
      }
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('流程运维');
  },

  componentDidMount() {
    const { searchParams, params } = this.props;
    // 如果上次有缓存记录存在, 仅限于没有params 的情况
    // 有params存在的情况下。应该是按params去查找
    if (params.flow_id || params.status) {
      this.setState({
        flow_id: params.flow_id || this.state.flow_id,
        keyword: params.flow_name || this.state.flow_name,
        type: params.type || this.state.type,
        status: params.status || this.state.status,
        timeType: params.timeType || this.state.timeType,
        begin_date: params.begin_date || this.state.begin_date,
        end_date: params.end_date || this.state.end_date
      }, this.fetchList.bind(this, 1))
    } else if (searchParams && params.instance) {
      this.setState({
        flow_id: searchParams.flow_id,
        keyword: searchParams.keyword,
        type: searchParams.type ? searchParams.type : '全部',
        status: searchParams.status ? searchParams.status : '全部',
        timeType: searchParams.timeType || this.state.timeType,
        begin_date: searchParams.begin_date,
        end_date: searchParams.end_date
      }, this.fetchList.bind(this, 1))
    } else {
      // 不再对当前查询记录进行缓存
      this.fetchList(1)
    }
  },

  render() {
    const { keyword, type, status, timeType, begin_date, end_date, logDialog } = this.state
    const { list, pending, page, total, log_data, log_pending } = this.props;
    // 数据表格表头字段
    const dataFields = [{
      idField: true,
      name: '序号'
    }, {
      name: '实例名称',
      key: 'name',
      width: '20%'
    }, {
      name: '流程类型',
      key: 'type',
      width: '100px'
    }, {
      key: 'startup_time',
      name: '开始时间',
      width: '150px'
    }, {
      key: 'end_time',
      name: '结束时间',
      width: '150px'
    }, {
      key: 'running_time',
      name: '运行时长',
      width: '80px'
    }, {
      key: 'status',
      name: '状态',
      width: '60px',
      flex: 1,
      minWidth: '60px'
    }, {
      key: 'actions',
      name: '操作',
      width: '165px'
    }];

    // 数据表格行模版
    const rowTemplate = (
      <div>
        <div>%id%</div>

        <div childNodes={rowData => (
          <OverlayTrigger trigger="hover" placement="top" overlay={(<Tooltip>{rowData.name}</Tooltip>)}>
            <div style={this.STYLE_SHEET.textLimit}>{rowData.name}</div>
          </OverlayTrigger>
        )}></div>

        <div>%type%</div>

        <div childNodes={rowData => (rowData.startup_time ? rowData.startup_time.replace('T', ' ') : '-')}></div>

        <div childNodes={rowData => (rowData.end_time ? rowData.end_time.replace('T', ' ') : '-')}></div>

        <div childNodes={rowData => (rowData.running_time >= 0 && rowData.running_time !== null ? `${rowData.running_time}s` : '-')}></div>

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
        }}></div>

        <div childNodes={rowData => (
          <div style={{ padding: '8px 0', width: '100%', height: '100%' }}>

            <IconButton onClick={this.handleDetail.bind(this, rowData)}
              className="datatable-action"
              iconClass="dmpicon-view">详情</IconButton>

            <IconButton onClick={this.handleShowLog.bind(this, rowData)}
              className="datatable-action"
              iconClass="dmpicon-journal">日志</IconButton>

            {
              ['已创建', '运行中'].indexOf(rowData.status) > -1 &&
              <AuthComponent pagecode="流程运维" visiblecode="edit">
                <IconButton onClick={this.handleKill.bind(this, rowData)}
                  className="datatable-action"
                  iconClass="dmpicon-stop2">终止</IconButton>
              </AuthComponent>
            }
          </div>
        )}></div>
      </div>
    );

    return (
      <div className="modules-page-container">
        <div className="flow-ops-page">
          <div className="search-panel form">
            {/*<div className="right">
              <Button bsStyle="primary" onClick={this.fetchList.bind(this, 1)}>筛 选</Button>
            </div>*/}
            <div className="left">
              <div className="grid-row" style={{ height: '74px' }}>

                <div className="item" style={{ width: '120px' }}>
                  <label>流程类型：</label>
                  <Select value={type} openSearch width="100%" maxHeight={180} onSelected={this.handleSelect.bind(this, 'type')}>
                    {this.FLOW_TYPES.map((item, index) => <option value={item} key={index}>{item}</option>)}
                  </Select>
                </div>
                <div className="item" style={{ width: '120px' }}>
                  <label>流程状态：</label>
                  <Select value={status} openSearch width="100%" maxHeight={180} onSelected={this.handleSelect.bind(this, 'status')}>
                    {this.FLOW_STATUS.map((item, index) => <option value={item} key={index}>{item}</option>)}
                  </Select>
                </div>
                <div className="item" style={{ width: '200px' }}>
                  <label>流程名称：</label>
                  <Input type="text" value={keyword} onChange={this.handleChangeInfo.bind(this, 'keyword')} />
                </div>

                <div className="item" style={{ marginRight: '0px' }}>
                  <label>日期筛选：</label>
                  <div>
                    <div className="fl" style={{ marginRight: '20px' }}>
                      <ButtonGroup bsSize="small">
                        <Button className={timeType === '全部' ? 'active' : ''} onClick={this.handleChangeInfo.bind(this, 'timeType', { target: { value: '全部' } })}>全部</Button>
                        <Button className={timeType === '今天' ? 'active' : ''} onClick={this.handleChangeInfo.bind(this, 'timeType', { target: { value: '今天' } })}>今天</Button>
                        <Button className={timeType === '昨天' ? 'active' : ''} onClick={this.handleChangeInfo.bind(this, 'timeType', { target: { value: '昨天' } })}>昨天</Button>
                      </ButtonGroup>
                    </div>
                    {
                      timeType === '全部' && <div className="fl">
                        <DatePicker value={begin_date} onSelected={this.handledate.bind(this, 'begin_date')} />
                      </div>
                    }
                    {
                      timeType === '全部' && <div className="fl" style={{ width: '30px', textAlign: 'center' }}>
                        至
                      </div>
                    }
                    {
                      timeType === '全部' && <div className="fl">
                        <DatePicker value={end_date} onSelected={this.handledate.bind(this, 'end_date')} />
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="table-panel">
            <FlexDataTable flexDataTableId="datatable-wrapper"
              headerHeight={40}
              headerCellBorder={true}
              lineHeight={40}
              pending={pending}
              hasNext={list.length < total}
              dataFields={dataFields}
              rowTemplate={rowTemplate}
              onChangeSorts={this.handleChangeSorts}
              onFetchData={total > this.PAGE_SIZE ? this.fetchList.bind(this, page + 1) : false}
              fetchAction="scroll"
              data={list} />
            <Loading show={pending} containerId="datatable-wrapper" />
          </div>
        </div>
        <LogDialog
          show={logDialog.show}
          pending={log_pending}
          data={log_data}
          onFresh={this.handleFresh}
          onHide={this.handleHide}
        />
      </div>
    );
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

  handleKill(item) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要终止该流程吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.killInstance({ id: item.id }, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg);
          } else {
            this.showCrr(json.msg);
            this.fetchList(1)
          }
        })
      }
    });
  },

  handleShowLog(item) {
    // 如果点击的item.id
    // 不相同，则重置page_size
    if (!this.state.logDialog.flow || item.id !== this.state.logDialog.flow.id) {
      this.LOG_PAGE = 1
    }
    // 回调 
    // 如果 page < Math.ceil(json.data.total / page_size)
    const fetchLog = (total) => {
      if (this.LOG_PAGE <= Math.ceil(total / this.LOG_PAGE_SIZE)) {
        this.props.actions.fetchLog({
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

    this.setState({
      logDialog: {
        ...this.state.logDialog,
        show: true,
        flow: item
      }
    }, () => {
      // 未初始化
      if (this.LOG_PAGE === 1) {
        this.props.actions.clearLog();
        this.props.actions.fetchLog({
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

  handleDetail(item) {
    this.context.router.push(`${baseAlias}/flow/ops-instance/${item.id}/${item.name}`)
  },

  handleSelect(field, option) {
    this.state[field] = option.value
    this.setState({
      ...this.state
    }, this.fetchList.bind(this, 1))
  },

  handleChangeInfo(field, e) {
    this.state[field] = e.target.value
    // 时间类型
    if (field === 'timeType') {
      if (e.target.value === '今天') {
        this.state.begin_date = getDateStr(0)
        this.state.end_date = getDateStr(0)
      } else if (e.target.value === '昨天') {
        this.state.begin_date = getDateStr(-1)
        this.state.end_date = getDateStr(-1)
      } else {
        this.state.begin_date = ''
        this.state.end_date = ''
      }
    }

    // 如果是有改变keyword，则清空flow_id
    if (field === 'keyword') {
      clearTimeout(searchTimer)
      this.state.flow_id = ''
    }

    this.setState({
      ...this.state
    }, () => {
      // 搜索延时
      if (field === 'keyword') {
        searchTimer = setTimeout(this.fetchList.bind(this, 1), 300)
      } else {
        this.fetchList(1);
      }
    })
  },

  handledate(field, value) {
    this.state[field] = value
    this.setState({
      ...this.state
    }, this.fetchList.bind(this, 1))
  },

  // 切换排序数组(sorts) 
  handleChangeSorts(sorts) {
    this.fetchList(1, sorts);
  },

  // 拉取清洗的列表
  fetchList(page, sorts) {
    const { flow_id, keyword, type, status, begin_date, end_date, timeType } = this.state;
    let _sorts = '';

    if (Array.isArray(sorts) && sorts.length > 0) {
      _sorts = JSON.stringify(sorts)
    } else if (sorts === undefined) {
      _sorts = this.props.sorts || '';
    }

    this.props.actions.fetchInstanceList({
      flow_id,
      begin_date,
      end_date,
      keyword,
      timeType,
      page: page || 1,
      type: type === '全部' ? '' : type,
      status: status === '全部' ? '' : status,
      page_size: this.PAGE_SIZE,
      sorts: _sorts
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

  LOG_PAGE_SIZE: 10,
  LOG_PAGE: 1,
  PAGE_SIZE: 40,
  FLOW_TYPES: ['全部', '数据清洗', '标签定义', '数据看板', '数据下载', '数据集', '订阅'],
  FLOW_STATUS: ['全部', '已成功', '已创建', '运行中', '已中止', '已失败'],

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

export default connect(stateToProps, dispatchToProps)(FlowOps);

