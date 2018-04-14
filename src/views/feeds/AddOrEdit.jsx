import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';

import createReactClass from 'create-react-class';

import Input from 'react-bootstrap-myui/lib/Input';
import Loading from 'react-bootstrap-myui/lib/Loading';
import { Form, ValidatedInput } from '@components/bootstrap-validation';
import SchedulePanel from '@components/SchedulePanel';
import DatePicker from '@components/DatePicker';
import { Select as TreeSelect, Tree } from 'rt-tree'
import UserSelect from '@components/UserSelect';
import { baseAlias } from '../../config';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataViewListActionCreators } from '../../redux/modules/dataview/list';
import { actions as feedsActions } from '../../redux/modules/feeds/feeds';
import moment from 'moment';
import TipMixin from '@helpers/TipMixin';

import { convertFolderTree } from '../dataview/utils/treeDataHelper'

import 'rt-tree/dist/css/rt-select.css'

const NOOP = () => { }

const ICON_STYLE_SHEET = {
  fontFamily: "'dmpicon' !important",
  speak: 'none',
  fontStyle: 'normal',
  fontWeight: 'normal',
  fontVariant: 'normal',
  textTransform: 'none',
  lineHeight: 1,
  color: '#24BBF9',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale'
}

import './add-edit.less'

const FeedsAddOrEdit = createReactClass({
  displayName: 'FeedsAddOrEdit',
  propTypes: {
    //{ dashboardId:, dashboardName:, }
    dashboardInfo: PropTypes.object,
    //{}
    feedInfo: PropTypes.object,
    reportTreeList: PropTypes.object,
    // 在报告界面需要用到的props
    setSubmitFunc: PropTypes.func,
    onSuccess: PropTypes.func,
  },
  //mixin提示框 和确定框 弹窗
  mixins: [TipMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    const { dashboardInfo, reportTreeList } = this.props
    return {
      uuid: new Date().getTime(),
      info: {
        dashboard_id: dashboardInfo && dashboardInfo.id || '',       //报告ID
        subject_email: dashboardInfo && dashboardInfo.name || '',      //邮件主题
        send_frequency: 1,    //发送频率
        recipients: [],         //收件人(用户id)
        addresser: '明源云大数据平台',          //发件人
        message: '亲爱的客户，您好：',            //消息正文
        report_from: [2],        //报告形式
        flow: { schedule: '0 0 0 ? * * *', depend_flow_id: '', status: '启用' }                //流程对象
      },
      date: moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss'),  // 默认为明天这个时候
      reportTreeList: reportTreeList && convertFolderTree(reportTreeList, false) || [],
      pending: false,
      adding: false     // 避免重复点击
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar && this.props.onChangeNavBar([{
      name: '订阅列表',
      url: '/feeds/list'
    }, {
      name: '新增邮件订阅'
    }], [{
      text: '保存',
      icon: 'dmpicon-save',
      pagecode: '订阅管理',
      visiblecode: 'edit',
      ref: `add-btn-${this.state.uuid}`,
      style: '',
      func: this.submit
    }]);
  },

  componentDidMount() {
    const { actions, params, setSubmitFunc } = this.props
    if (this.state.reportTreeList.length === 0) {
      actions.fetchDataviewListSilent({
        status: 1, // 已发布报告
      }, (json) => {
        if (!json.result) {
          this.showErr(json.msg || '获取报告列表失败');
        } else {
          const { tree } = json.data
          this.setState({
            reportTreeList: tree ? convertFolderTree(tree, false) : []
          })
        }
      })
    }
    if (params && params.id) {
      this.setState({
        pending: true
      })
      actions.getFeed({ id: params.id }, (json) => {
        if (json.result) {
          const info = json.data
          // const date = this.state.date

          if (typeof info.recipients === 'string') {
            info.recipients = JSON.parse(info.recipients)
          }

          if (info.report_from && typeof info.report_from === 'string') {
            info.report_from = JSON.parse(info.report_from)
          } else {
            info.report_from = []
          }

          // 如果频率方式 2. 则需要 初始话 date
          if (json.data.send_frequency == 2 && json.data.flow) {
            this.state.date = this.deCodeDate(json.data.flow.schedule)
          }

          this.setState({
            info: {
              ...this.state.info,
              ...info
            },
            pending: false
          })
        } else {
          this.setState({
            pending: false
          })
          this.showErr('请求失败')
        }
      })
    }
    if (setSubmitFunc) {
      setSubmitFunc(this.submit)
    }
  },

  render() {
    const { dashboardInfo } = this.props
    const { info, date, reportTreeList, pending } = this.state
    const hasDashboardInfo = !!dashboardInfo
    return (
      <div className="modules-page-container" id="feeds-add-page">
        <div className="data-view feeds-add-page">
          <div className="left">
            <Form className="form-horizontal" validationEvent="onBlur" onValidSubmit={this.handleValidSubmit} ref={(instance) => { this.form = instance }}>
              <div className="form-group">
                <label className="control-label"><span><i className="required">*</i>选择报告</span></label>
                <div className="input-wrapper">
                  {
                    hasDashboardInfo
                      ?
                      <input disabled className="form-control" type="text" value={dashboardInfo.name} />
                      :
                      <TreeSelect
                        search
                        style={{ width: '100%' }}
                        menuStyle={{ width: '100%', maxHeight: 250 }}
                      >
                        <Tree
                          data={reportTreeList || []}
                          selected={[info.dashboard_id]}
                          onSelect={(select, value, options) => options.type !== 'FOLDER'}
                          customerIcon={this.genrateIcon}
                          onChange={this.handleChangeDashboardId}
                        />
                      </TreeSelect>
                  }
                </div>
              </div>
              <ValidatedInput type="text"
                label={<span><i className="required">*</i>邮件主题</span>}
                autoComplete="off"
                name="subject_email"
                value={info.subject_email || ''}
                onChange={this.handleChangeInput.bind(this, 'subject_email')}
                wrapperClassName="input-wrapper"
                validate='required'
                errorHelp={{
                  required: '请输入邮件主题'
                }} />
              <div className="form-group">
                <label className="control-label"><span><i className="required">*</i>收件人</span></label>
                <div className="input-wrapper">
                  <UserSelect
                    users={info.recipients}
                    onChange={this.handleChangeRecipients}
                  />
                </div>
              </div>
              <ValidatedInput type="text"
                label={<span><i className="required">*</i>发件人</span>}
                autoComplete="off"
                name="addresser"
                value={info.addresser || ''}
                onChange={this.handleChangeInput.bind(this, 'addresser')}
                wrapperClassName="input-wrapper"
                validate='required'
                errorHelp={{
                  required: '请输入发件人'
                }} />
              <ValidatedInput type="textarea"
                label={<span><i className="required">*</i>消息正文</span>}
                autoComplete="off"
                name="message"
                rows="4"
                value={info.message || ''}
                validate='required'
                onChange={this.handleChangeInput.bind(this, 'message')}
                wrapperClassName="input-wrapper"
                errorHelp={{
                  required: '请输入消息正文'
                }} />
              <div className="form-group">
                <label className="control-label"><span><i className="required">*</i>报告形式</span></label>
                <div className="input-wrapper-group">
                  <div className="form-group" onClick={this.handleChangeCheck.bind(this, 'report_from', 2)}>
                    <div className="checkbox">
                      <Input type="checkbox" checked={info.report_from.indexOf(2) > -1} onChange={NOOP} />
                      正文图片
                    </div>
                  </div>
                  <div className="form-group" onClick={this.handleChangeCheck.bind(this, 'report_from', 1)}>
                    <div className="checkbox">
                      <Input type="checkbox" checked={info.report_from.indexOf(1) > -1} onChange={NOOP} />
                      附件
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="control-label"><span><i className="required">*</i>发送频率</span></label>
                <div className="input-wrapper-group">
                  <div className="form-group" onClick={this.handleChangeCheck.bind(this, 'send_frequency', 1)}>
                    <div className="radio">
                      <Input type="radio" checked={info.send_frequency == 1} onChange={NOOP} />
                      立即发送
                    </div>
                  </div>
                  <div className="form-group" onClick={this.handleChangeCheck.bind(this, 'send_frequency', 2)}>
                    <div className="radio">
                      <Input type="radio" checked={info.send_frequency == 2} onChange={NOOP} />
                      定时发送
                    </div>
                  </div>
                  <div className="form-group" onClick={this.handleChangeCheck.bind(this, 'send_frequency', 3)}>
                    <div className="radio">
                      <Input type="radio" checked={info.send_frequency == 3} onChange={NOOP} />
                      周期发送
                    </div>
                  </div>
                </div>
              </div>
              {
                info.send_frequency === 2 &&
                <div className="form-group">
                  <label className="control-label"><span><i className="required">&nbsp;</i>发送时间</span></label>
                  <div className="input-wrapper">
                    <DatePicker
                      value={date}
                      onSelected={this.handleChangePicker.bind(this, 'date')}
                      timePicker
                      drops="up"
                      minDate={moment().format('MM/DD/YYYY HH:mm:ss')}
                      clearable={false}
                    />
                  </div>
                </div>
              }
              {
                info.send_frequency === 3 && <SchedulePanel
                  onlyCycle
                  needPoint={false}
                  status="启用"
                  cycleTypes={['month', 'week', 'day']}
                  plan='cycle'
                  data={info.flow.schedule}
                  onGetInstance={(instance) => { this.schedule = instance }}
                />
              }
            </Form>
          </div>
        </div>
        <Loading show={pending} containerId="feeds-add-page" />
      </div>
    )
  },

  genrateIcon(item, expanded) {
    let className = expanded ? 'dmpicon-folder-open' : 'dmpicon-folder-close'
    if (item.type !== 'FOLDER') {
      className = 'dmpicon-chart'
    }
    return <i className={className} style={ICON_STYLE_SHEET} />
  },

  handleChangeDashboardId(ids, data) {
    if (data[0] && data[0].type === 'FILE') {
      const info = this.state.info
      this.setState({
        info: {
          ...info,
          dashboard_id: ids[0],
          subject_email: info.subject_email || data[0].name
        }
      })
    }
  },

  handleChangePicker(field, value) {
    this.setState({
      [field]: value
    })
  },

  handleChangeSelect(field, option) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: option.value
      }
    })
  },

  handleChangeInput(field, e) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: e.target.value
      }
    })
  },

  handleChangeCheck(field, value) {
    let values = value
    // 如果是多选的情况下
    if (field === 'report_from') {
      const report_from = this.state.info.report_from
      // 如果 附件和图片都有的情况下。
      if (report_from.length === 2 && report_from.indexOf(value) > -1) {
        values = report_from.filter(v => v !== value)
      } else if (report_from.indexOf(value) === -1) {
        report_from.push(value)
        values = report_from
      } else {
        values = [value]
      }
    }

    this.setState({
      info: {
        ...this.state.info,
        [field]: values
      }
    })
  },

  handleValidSubmit() {
    const { actions, params } = this.props
    const data = _.cloneDeep(this.state.info)
    if (data.dashboard_id === '') {
      this.showErr('请选择报告')
      return
    }
    if (data.recipients.length === 0) {
      this.showErr('请选择收件人')
      return
    }
    // 如果 是定时发送，则将 date 转成 flow 字段传递给后端
    if (this.state.info.send_frequency === 2) {
      data.flow.schedule = this.enCodeDate(this.state.date)
    } else if (this.state.info.send_frequency === 3) {
      data.flow.schedule = this.schedule.getData().schedule
    }

    data.recipients = JSON.stringify(data.recipients)
    const caller = params && params.id ? actions.updateFeed : actions.addFeed
    // start loading
    this.setState({ pending: true })
    // 禁用顶部的 添加按钮
    caller(data, (json) => {
      let adding = false
      if (json.result) {
        adding = true
        if (!(this.props.onSuccess && this.props.onSuccess())) {
          this.showScc('保存成功！')
          setTimeout(() => {
            this.context.router.push(`${baseAlias}/feeds`)
          }, 1500)
        }
      } else {
        this.showErr(json.msg || '新增邮件订阅失败')
      }
      // end loading
      this.setState({ pending: false, adding })
    })
  },

  submit() {
    if (!this.state.pending && !this.state.adding) {
      this.form.submit()
    }
  },

  handleView() {

  },

  enCodeDate(date) {
    const dateArr = date.split(' ')
    const ymdArr = dateArr[0].split('-')
    const hmsArr = dateArr[1].split(':')

    // ymdArr 插入问号
    ymdArr.splice(1, 0, '?')

    return `${hmsArr.reverse().join(' ')} ${ymdArr.reverse().join(' ')}`
  },

  deCodeDate(flow) {
    const dateArr = flow.split(' ')
    dateArr.splice(5, 1)
    // 年月日 + 时分秒
    const hms = dateArr.slice(0, 3).reverse().join(':')
    const ymd = dateArr.slice(3, 6).reverse().join('-')

    return `${ymd} ${hms}`
  },

  handleChangeRecipients(users) {
    this.setState({
      info: {
        ...this.state.info,
        recipients: users
      }
    })
  },

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  },

  showScc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  },

})

const stateToProps = state => ({
  ...state
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign(feedsActions, dataViewListActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(FeedsAddOrEdit);
