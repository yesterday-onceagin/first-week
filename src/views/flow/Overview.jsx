import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';
import DataTable from 'react-bootstrap-myui/lib/DataTable';
import IconButton from '../../components/IconButton';
import Area from './components/Area';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as flowOverviewActionCreators } from '../../redux/modules/flow/overview'

import { getDateStr } from '../../helpers/dateUtils';
import TipMixin from '../../helpers/TipMixin';

import { baseAlias } from '../../config';

import './overview.less';

const FlowOverview = createReactClass({
  displayName: 'FlowOverview',
  mixins: [TipMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      TODAY_STATUS: {
        已成功: 0,
        已失败: 0,
        运行中: 0,
        已创建: 0
      }
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('概览');
    this._createTableOptions();
  },

  componentWillReceiveProps(nextProps) {
    const { spread } = this.props
    if (spread !== nextProps.spread) {
      // 折叠过程
      this._spread();
    }
  },

  componentDidMount() {
    // 拉取top10 数据
    this.props.actions.fetchTopTen('day');
    this.props.actions.fetchTopTen('month');
    this.props.actions.fetchToday(null, (json) => {
      if (json.result) {
        this.state.TODAY_STATUS = {
          已成功: json.data.successful,
          已失败: json.data.failed,
          运行中: json.data.running,
          已创建: json.data.created
        }
        this.setState({
          ...this.state
        })
      }
    });

    // 今日24h的数据 +  昨天24h的数据
    this.props.actions.fetchPerHour()
    //
    $(window).on('resize', this._spread)
  },

  componentWillUnmount() {
    $(window).off('resize', this._spread)
  },

  render() {
    const { topList, charts_data } = this.props;
    const emptyText = '没有可显示的数据！'
    return (
      <div className="modules-page-container">
        <div className="flow-overview-page">
          <div className="mark-wrap">
            {
              Object.keys(this.state.TODAY_STATUS).map(item =>
                <div className="item" onClick={this.handleiew.bind(this, null, '今天', item)}>
                  <div className="item-wrap">
                    <div className="mark"><i></i></div>
                    <div className="context">
                      <div className="context-wrap">
                        <span>{`今天${item}任务`}</span>
                        <b>{this.state.TODAY_STATUS[item]}</b>
                      </div>
                    </div>
                  </div>
                </div>)
            }
          </div>
          <div className="echarts-panel">
            <div className="col-md-12 grid-panel">
              <div className="main-wrap">
                <div className="title">任务运行情况</div>
                <div className="echarts-wrap" id="echarts-panel">
                  <Area data={charts_data} ref={(instance) => { this.area_charts = instance }} />
                </div>
              </div>
            </div>
          </div>
          <div className="table-panel">
            <div className="col-md-6 grid-panel">
              <div className="main-wrap">
                <div className="title">今日任务执行时长排行（top10）</div>
                <div className="data-view">
                  <DataTable
                    hover
                    serialNumber
                    bordered={false}
                    emptyText={emptyText}
                    dataFields={this.DATAFIELDS.day}
                    rowTemplate={this.ROWTEMPLATE.day}
                    data={topList ? topList.day : []} />
                </div>
              </div>
            </div>
            <div className="col-md-6 grid-panel">
              <div className="main-wrap">
                <div className="title">近一个月失败排行（top10）</div>
                <div className="data-view">
                  <DataTable
                    hover
                    serialNumber
                    bordered={false}
                    emptyText={emptyText}
                    dataFields={this.DATAFIELDS.month}
                    rowTemplate={this.ROWTEMPLATE.month}
                    data={topList ? topList.month : []} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },

  handleiew(rowData, mode, status) {
    const flow_id = rowData && rowData.flow_id ? rowData.flow_id : ''
    const flow_name = rowData && rowData.name ? rowData.name : ''
    const timeType = mode

    let begin_date = getDateStr(0)
    const end_date = getDateStr(0)

    // 近一个月
    if (mode === '全部') {
      const year = new Date().getFullYear()
      const month = new Date().getMonth()
      const day = new Date().getDate()

      begin_date = `${year}-${month}-${day}`
    }

    const url = flow_id ?
      `${baseAlias}/flow/ops/${flow_id}/${flow_name}/${timeType}/${begin_date}/${end_date}` :
      `${baseAlias}/flow/ops/${status}/${timeType}/${begin_date}/${end_date}`

    this.context.router.push(url)
  },

  _spread() {
    if (this.area_charts) {
      this.area_charts.getChart().resize({
        width: $('#echarts-panel').width(),
        height: $('#echarts-panel').height()
      });
    }
  },

  _createTableOptions() {
    // 创建 fileds
    const creatFields = (mode) => {
      const dataFields = [{
        idField: true,
        name: '序号'
      }, {
        text: '流程名称',
        name: 'name',
      }, {
        text: '类型',
        name: 'type',
      }, {
        text: '运行时长',
        name: 'running_time',
      }, {
        name: 'actions',
        text: '操作',
      }];

      if (mode === 'month') {
        dataFields[3] = {
          text: '失败次数',
          name: 'error_times',
          width: '60px'
        }
      }

      return dataFields
    }

    const creatTemplate = mode => (
      <tr>
        <td>%id%</td>
        <td>%name%</td>
        <td>%type%</td>
        <td>{mode === 'day' ? '%running_time%s' : '%error_times%'}</td>
        <td width="100" style={{ padding: '0 0 0 10px' }} childrenNode={rowData => (
          <div style={{ paddingTop: '8px' }}>
            <IconButton onClick={this.handleiew.bind(this, rowData, mode === 'day' ? '今天' : '全部')}
              className="datatable-action"
              iconClass="dmpicon-view">详情</IconButton>
          </div>
        )}></td>
      </tr>
    )

    // 数据表格行模版
    this.DATAFIELDS = {
      day: creatFields('day'),
      month: creatFields('month')
    }

    this.ROWTEMPLATE = {
      day: creatTemplate('day'),
      month: creatTemplate('month')
    }
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
})

const stateToProps = state => ({
  ...state.flowOverview
})

const dispatchToProps = dispatch => ({ actions: bindActionCreators(flowOverviewActionCreators, dispatch) })

export default connect(stateToProps, dispatchToProps)(FlowOverview);

