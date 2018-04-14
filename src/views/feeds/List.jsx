import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import Input from 'react-bootstrap-myui/lib/Input';
import FlexDataTable from '../../components/FlexDataTable';
import IconButton from '../../components/IconButton';

import DatePicker from '@components/DatePicker';
import SwitchButton from '@components/SwitchButton';
import AuthComponent from '@components/AuthComponent';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { actions as feedsActions } from '../../redux/modules/feeds/feeds';

import TipMixin from '@helpers/TipMixin';
import ConfirmMixin from '@helpers/ConfirmsMixin';
import { getCronDesc, decodeCron } from '@helpers/cron';

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
      keyword: ''
    }
  },

  componentDidMount() {
    this.fetchList()
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('订阅列表', [{
      text: '新增邮件订阅',
      icon: 'dmpicon-add',
      pagecode: '订阅管理',
      visiblecode: 'edit',
      style: '',
      func: this.handleAdd
    }]);
  },

  render() {
    //是否加载 和对应的list列表字段
    const { list, pending, page, total } = this.props;
    // 数据表格表头字段
    const dataFields = [{
      idField: true,
      name: '序号'
    }, {
      name: '关联报告',
      key: 'dashboard_name',
      sortable: true,
      width: '120px'
    }, {
      key: 'subject_email',
      name: '邮件名称',
      width: '12%',
    }, {
      key: 'send_frequency',
      name: '发送频率',
      width: '100px',
    }, {
      key: 'schedule_desc',
      name: '发送时间',
      width: '170px'
    }, {
      key: 'created_by',
      name: '创建人',
      width: '60px',
    }, {
      key: 'created_on',
      name: '创建时间',
      width: '170px'
    }, {
      key: 'recipients',
      name: '收件人',
      width: '100px'
    }, {
      key: 'status',
      name: '最近状态',
      width: '80px'
    }, {
      key: 'actions',
      name: '操作',
      width: '250px'
    }];

    // 数据表格行模版
    const rowTemplate = (
      <div>
        <div>%id%</div>
        <div childNodes={rowData => (
          <OverlayTrigger trigger="hover" placement="top" overlay={ (<Tooltip>{rowData.dashboard_name}</Tooltip>) }>
            <div style={this.STYLE_SHEET.textLimit}>{rowData.dashboard_name}</div>
          </OverlayTrigger>
        )}/>
        <div childNodes={rowData => (
          <OverlayTrigger trigger="hover" placement="top" overlay={ (<Tooltip>{rowData.subject_email}</Tooltip>) }>
            <div style={this.STYLE_SHEET.textLimit}>{rowData.subject_email}</div>
          </OverlayTrigger>
        )}/>
        <div childNodes={(rowData) => {
          const send_frequency = rowData.send_frequency
          let value = ['立即发送', '定时发送', '周期发送'][+send_frequency - 1]

          if (send_frequency === 3) {
            value = '周期（天）';
            const scheduleTypes = {
              month: '月',
              week: '周',
              day: '天',
            };
            if (rowData.schedule) {
              value = `周期（${scheduleTypes[decodeCron(rowData.schedule).type]}）`;
            }
          }
          return <OverlayTrigger trigger="hover" placement="top" overlay={ (<Tooltip>{value}</Tooltip>) }>
            <div style={this.STYLE_SHEET.textLimit}>{value}</div>
          </OverlayTrigger>
        }}/>
        <div childNodes={(rowData) => {
          let text = rowData.created_on
          // 定时发送
          if (rowData.send_frequency === 2 && rowData.schedule) {
            const arr = rowData.schedule.split(' ')
            // 去掉 ？
            arr.splice(5, 1)
            // 年月日 + 时分秒
            const hms = arr.slice(0, 3).reverse().join(':')
            const ymd = arr.slice(3, 6).reverse().join('-')

            text = `${ymd} ${hms}`
          } else if (rowData.send_frequency === 3) {
            text = '每天的00:00';
            if (rowData.schedule) {
              text = getCronDesc(rowData.schedule);
            }
          } else {
            text = rowData.created_on ? rowData.created_on.replace('T', ' ') : ''
          }
          return (
            <OverlayTrigger trigger="hover" placement="top" overlay={ (<Tooltip>{text}</Tooltip>) }>
              <div style={this.STYLE_SHEET.textLimit}>{text}</div>
            </OverlayTrigger>
          );
        }}/>
        <div childNodes={(rowData) => {
          const text = rowData.created_by || ''
          return <OverlayTrigger trigger="hover" placement="top" overlay={ (<Tooltip>{text}</Tooltip>) }>
            <div style={this.STYLE_SHEET.textLimit}>{text}</div>
          </OverlayTrigger>
        }}/>
        <div childNodes={(rowData) => {
          const text = rowData.created_on ? rowData.created_on.replace('T', ' ') : ''
          return <OverlayTrigger trigger="hover" placement="top" overlay={ (<Tooltip>{text}</Tooltip>) }>
            <div style={this.STYLE_SHEET.textLimit}>{text}</div>
          </OverlayTrigger>
        }}/>
        <div childNodes={(rowData) => {
          const recipients = JSON.parse(rowData.recipients)
          const names = recipients.map(item => item.name) || []
          return <OverlayTrigger trigger="hover" placement="top" overlay={ (<Tooltip>{names.join('，')}</Tooltip>)}>
            <div style={this.STYLE_SHEET.textLimit}>{names.join('，')}</div>
          </OverlayTrigger>
        }}/>
        <div childNodes={(rowData) => {
          const runStatusClsMap = {
            已创建: 'run-status-created',
            运行中: 'run-status-runing',
            已成功: 'run-status-success',
            已失败: 'run-status-failed',
            已终止: 'run-status-aborted'
          };

          return <div style={{ fontSize: '12px', width: '100%', height: '100%', minWidth: '60px' }}
            className={runStatusClsMap[rowData.run_status] || 'run-status-default'}>
            {rowData.run_status || '未开始'}
          </div>
        }}/>
        <div childNodes={rowData => (
          <div style={{ padding: '8px 0', width: '100%', height: '100%' }}>
            <IconButton onClick={this.handleEdit.bind(this, rowData)}
              className="datatable-action"
              iconClass="dmpicon-edit">编辑</IconButton>
            <IconButton onClick={this.handleDetail.bind(this, rowData)}
              className="datatable-action"
              iconClass="dmpicon-view">明细</IconButton>
            <AuthComponent pagecode="订阅管理" visiblecode="edit">
              <IconButton onClick={this.handleDelete.bind(this, rowData.id)}
                className="datatable-action"
                iconClass="dmpicon-del">删除</IconButton>
            </AuthComponent>
            {
              rowData.send_frequency === 3 && <AuthComponent pagecode="订阅管理" visiblecode="edit"><SwitchButton
                active={rowData.status === '启用'}
                texts={{ on: '启用', off: '停用' }}
                turnOn={this.handleStartFlow.bind(this, rowData.id)}
                turnOff={this.handleStopFlow.bind(this, rowData.id)}
              />
              </AuthComponent>
            }
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
              hasNext={list.length < total}
              dataFields={dataFields}
              rowTemplate={rowTemplate}
              onChangeSorts={this.handleChangeSorts}
              onFetchData={total > this.PAGE_SIZE ? this.fetchList.bind(this, page + 1) : false}
              fetchAction="scroll"
              data={list}
            />
            <Loading show={pending} containerId='datatable-wrapper'/>
          </div>
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
          创建时间
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

  handleStartFlow(id) {
    this.props.actions.startFeedItem({ flow_id: id }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSuccess(json.msg);
      }
    });
  },

  handleStopFlow(id) {
    this.props.actions.stopFeedItem({ flow_id: id }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSuccess(json.msg);
      }
    });
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

  handleDetail(item) {
    this.context.router.push(`${baseAlias}/feeds/detail/${item.id}`);
  },

  // 编辑一个流程
  handleEdit(item) {
    this.context.router.push(`${baseAlias}/feeds/add/${item.id}`);
  },

  // 删除一个流程
  handleDelete(id) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该邮件吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.deleteFeed({ id }, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg);
          } else {
            this.showSuccess(json.msg || '删除成功！');
            this.fetchList()
          }
        })
      }
    });
  },

  // 打开新增数据清洗对话框
  handleAdd() {
    this.context.router.push(`${baseAlias}/feeds/add`);
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

    let _sorts = '';

    if (Array.isArray(sorts) && sorts.length > 0) {
      _sorts = JSON.stringify(sorts)
    } else if (sorts === undefined) {
      _sorts = this.props.sorts || '';
    }

    this.props.actions.fetchList({
      page,
      begin_date,
      end_date,
      keyword,
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
  ...state.feeds
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(feedsActions, dispatch)
})

export default connect(stateToProps, dispatchToProps)(FeedsList);
