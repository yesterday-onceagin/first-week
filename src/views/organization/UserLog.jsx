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
import DataTable from 'react-bootstrap-myui/lib/DataTable';
import DatePicker from '../../components/DatePicker';
import IconButton from '../../components/IconButton';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { getDateStr } from '../../helpers/dateUtils';
import TipMixin from '../../helpers/TipMixin';
import ConfirmMixin from '../../helpers/ConfirmsMixin';

import { DEFAULT_PAGINATION_OPTIONS } from '../../constants/paginationOptions';

import { baseAlias } from '../../config';
import { actions as userLogActionCreators } from '../../redux/modules/organization/userLog';

import './user-log.less';

let searchTimer = null;  // 搜索延时器

const UserLog = createReactClass({
  displayName: 'UserLog',
  mixins: [TipMixin, ConfirmMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      user_name: '',
      from_time: getDateStr(-30),
      to_time: getDateStr(0),
      log_type: '',
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('日志监控');
  },

  componentDidMount() {
    this.fetchList(1)
  },

  render() {
    const { user_name, log_type, from_time, to_time } = this.state

    return (
      <div className="modules-page-container">
        <div className="user-log-page">
          <div className="search-panel form">
            <div className="left">
              <div className="grid-row" style={{ height: '74px' }}>
                <div className="item" style={{ width: '180px' }}>
                  <label>用户名：</label>
                  <Input type="text" value={user_name} onChange={this.handleChangeInfo.bind(this, 'user_name')} />
                </div>
                <div className="item" style={{ width: '180px' }}>
                  <label>操作类型：</label>
                  <Select value={log_type} openSearch width="100%" maxHeight={180} onSelected={this.handleSelect.bind(this, 'log_type')}>
                    {this.OPTS_TYPES.map((item, index) => <option value={item.key} key={index}>{item.name}</option>)}
                  </Select>
                </div>
                <div className="item" style={{ marginRight: '0px' }}>
                  <label>日期筛选：</label>
                  <div>
                    <div className="fl">
                      <DatePicker value={from_time} onSelected={this.handledate.bind(this, 'from_time')} />
                    </div>
                    <div className="fl" style={{ width: '30px', textAlign: 'center' }}>
                      至
                    </div>
                    <div className="fl">
                      <DatePicker value={to_time} onSelected={this.handledate.bind(this, 'to_time')} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {this.renderTable()}
        </div>
      </div>
    );
  },

  renderTable() {
    const { list, page, total, pending } = this.props

    const dataFields = [{
      idField: true,
      name: '序号'
    }, {
      text: '时间',
      name: 'log_time',
    }, {
      text: '用户',
      name: 'account',
    }, {
      text: '操作类型',
      name: 'log_type',
    }, {
      text: '操作描述',
      name: 'log_info'
    }];

    const rowTemplate = <tr>
      <td>%id%</td>
      <td>%log_time%</td>
      <td>%account%</td>
      <td>%log_type%</td>
      <td childrenNode={rowData => (
        <div dangerouslySetInnerHTML={{ __html: rowData.log_info }}></div>
      )}></td>
    </tr>

    const pagination = {
      ...DEFAULT_PAGINATION_OPTIONS,
      activePage: page,
      onChangePage: this.handleChangePage,
      total
    }

    return <div className="table-panel">
      <DataTable
        tableWrapperId='datatable-wrapper'
        pagination={pagination}
        hover
        serialNumber
        bordered={false}
        dataFields={dataFields}
        rowTemplate={rowTemplate}
        emptyText="没有可显示的数据！"
        data={list || []}
      />
      <Loading show={pending} containerId="datatable-wrapper" />
    </div>
  },

  handleChangePage(event, selectEvent) {
    this.fetchList(selectEvent.eventKey)
  },

  handleSelect(field, option) {
    this.state[field] = option.value
    this.setState({
      ...this.state
    }, () => {
      this.fetchList(1)
    })
  },

  handleChangeInfo(field, e) {
    clearTimeout(searchTimer)

    this.setState({
      [field]: e.target.value
    }, () => {
      // 搜索延时
      searchTimer = setTimeout(this.fetchList, 500)
    })
  },

  handledate(field, value) {
    this.state[field] = value
    this.setState({
      ...this.state
    }, () => {
      this.fetchList(1)
    })
  },


  // 拉取清洗的列表
  fetchList(page = page || 1) {
    const { from_time, to_time, log_type, user_name } = this.state
    this.props.actions.fetchUserLog({
      user_name,
      log_type,
      skip: page,
      from_time: from_time ? `${from_time} 00:00` : '',
      to_time: to_time ? `${to_time} 00:00` : '',
      page_size: DEFAULT_PAGINATION_OPTIONS.pageSize
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      }
    });
  },

  showErr(message) {
    this.showTip({
      show: true,
      status: 'error',
      content: message
    })
  },

  OPTS_TYPES: [{
    key: '',
    name: '全部'
  }, {
    key: 'data_source',
    name: '数据源'
  }, {
    key: 'dataset',
    name: '数据集'
  }, {
    key: 'dashboard',
    name: '报告'
  }, {
    key: 'application',
    name: '应用'
  }, {
    key: 'system',
    name: '系统'
  }, {
    key: 'user',
    name: '用户'
  }]

})

const stateToProps = state => ({
  ...state.userLog
})

const dispatchToProps = dispatch => ({ actions: bindActionCreators(userLogActionCreators, dispatch) })

export default connect(stateToProps, dispatchToProps)(UserLog);

