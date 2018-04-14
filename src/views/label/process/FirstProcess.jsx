import React from 'react'
import PropTypes from 'prop-types'

import createReactClass from 'create-react-class';

import { Form, ValidatedInput } from '../../../components/bootstrap-validation';
import Row from 'react-bootstrap-myui/lib/Row';
import Col from 'react-bootstrap-myui/lib/Col';
import Select from 'react-bootstrap-myui/lib/Select';
import GroupsForm from '../../../components/GroupsForm';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as labelAddOrEditActionCreators } from '../../../redux/modules/label/addOrEdit';

import isEqual from 'lodash/isEqual';
import TipMixin from '../../../helpers/TipMixin';
import { encodeCron, decodeCron } from '../../../helpers/cron';

import './first-process.less';

const FirstProcess = createReactClass({
  displayName: 'FirstProcess',
  mixins: [TipMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      plan: 'cycle',
      cycleType: 'day',
      cycleData: null,
      uuid: new Date().getTime(),
      info: {
        name: '',
        org_name: '',
        org_id: '',
        mode: '',
        sync_detail: 1, // 默认不同步数据明细
        tmpl_id: '',
        label_id: '',
        description: '',
        depend_flow_id: '',
        depend_flow_type: '数据清洗',
        schedule: ''
      }
    }
  },

  componentDidMount() {
    const cron = decodeCron(this.props.data.schedule);
    this.setState({
      uuid: new Date().getTime(),
      plan: this.props.data && !!this.props.data.depend_flow_id ? 'flow' : 'cycle',
      cycleData: cron.data,
      cycleType: cron.type || 'day',
      info: {
        ...this.props.data
      }
    }, this.fetchFlow)
    this.props.getComponent(this)
  },

  componentWillReceiveProps(nextProps) {
    if (!isEqual(nextProps.data, this.props.data)) {
      const cron = decodeCron(nextProps.data.schedule);
      this.setState({
        uuid: new Date().getTime(),
        plan: nextProps.data && !!nextProps.data.depend_flow_id ? 'flow' : 'cycle',
        cycleData: cron.data,
        cycleType: cron.type || 'day',
        info: {
          ...nextProps.data
        }
      }, this.fetchFlow)
    }
  },

  render() {
    const { flowList, editable } = this.props
    const { info, plan, cycleType, cycleData, uuid } = this.state

    return (
      <div className="first-process">
        <Form
          ref="database_form"
          className="form-horizontal"
          validationEvent="onBlur"
          onValidSubmit={this.handleValidSubmit}>
          <div className="item base">
            <div className="title">基本属性</div>
            <ValidatedInput
              type="text"
              label={<span style={{ marginLeft: '-12px' }}><i className="required">*</i>标签名称</span>}
              autoComplete="off"
              name="name"
              value={info.name || ''}
              onChange={this.handleChangeInfo.bind(this, 'name')}
              maxLength="20"
              wrapperClassName="input-wrapper"
              validate={this.validateName}
              errorHelp={{ required: '请输入标签名称（数字、_、中英文）' }}
            />
            <ValidatedInput
              type="text"
              label={<span>归属机构</span>}
              autoComplete="off"
              disabled
              name="org_name"
              value={info.org_name || ''}
              wrapperClassName="input-wrapper"
            />
            <Row>
              <Col md={12}>模式</Col>
              <Col md={12}>
                <Select
                  value={info.mode}
                  disabled={editable}
                  onSelected={this.handleSelect.bind(this, 'mode', 'info')}
                  width="100%"
                  maxHeight={180}
                  openSearch
                >
                  {
                    this.MODE.map((item, i) => (
                      <option key={`mode-option-${i}`} value={item.name}>{item.value}</option>
                    ))
                  }
                </Select>
              </Col>
            </Row>
            <div>
              <ValidatedInput
                type="textarea"
                label={<span>描述</span>}
                autoComplete="off"
                name="description"
                value={info.description || ''}
                style={{ height: '80px' }}
                onChange={this.handleChangeInfo.bind(this, 'description')}
                wrapperClassName="input-wrapper"
              />
            </div>
            <ValidatedInput type="checkbox"
              label="同步数据明细（编辑状态下，不可修改）"
              autoComplete="off"
              name="sync_detail"
              rows="3"
              disabled={editable}
              checked={!!info.sync_detail}
              onChange={this.handleChangeInfo.bind(this, 'sync_detail')}
              labelClassName="checkbox-in-form"
            />
          </div>
          <div className="item schuled">
            <div className="title">调度属性</div>
            <Row>
              <Col md={12}>调度方案</Col>
              <Col md={12}>
                <Select
                  value={plan}
                  width="100%"
                  onSelected={this.handleSelect.bind(this, 'plan', '')}
                  maxHeight={180}
                  openSearch
                >
                  {
                    this.SCHULEDTYPE.map((item, i) => (
                      <option key={`schuled-type-${i}`} value={item.name}>{item.value}</option>
                    ))
                  }
                </Select>
              </Col>
            </Row>
            {
              plan === 'cycle' && (
                <div>
                  <Row>
                    <Col md={12}>调度周期</Col>
                    <Col md={12}>
                      <Select
                        value={cycleType}
                        maxHeight={250}
                        width="100%"
                        openSearch={false}
                        onSelected={this.handleSelect.bind(this, 'cycleType', '')}
                      >
                        {
                          Object.keys(this.CYCLEDATAS).map((item, key) => (
                            <option value={item} key={key}>{this.CYCLEDATAS[item]}</option>
                          ))
                        }
                      </Select>
                    </Col>
                  </Row>
                  <div>
                    <GroupsForm
                      uuid={uuid}
                      type={cycleType}
                      defaultDatas={cycleData}
                      onChange={this.handleCycleDataChange}
                      ref={(instance) => { this.groupsForm = instance }}
                    />
                  </div>
                </div>
              )
            }
            {
              plan === 'flow' && (
                <div style={{ marginTop: '10px' }}>
                  <ValidatedInput
                    type="text"
                    label={<span>流程类型</span>}
                    autoComplete="off"
                    disabled
                    name="depend_flow_type"
                    value={info.depend_flow_type || '数据清洗'}
                    wrapperClassName="input-wrapper"
                  />
                  <Row>
                    <Col md={12} className="control-label">所属流程</Col>
                    <Col md={12}>
                      <Select
                        value={info.depend_flow_id || ''}
                        maxHeight={180}
                        openSearch
                        width="100%"
                        onSelected={this.handleSelect.bind(this, 'depend_flow_id', 'info')}
                      >
                        {
                          Array.isArray(flowList) && flowList.map(item => (
                            <option value={item.id} key={item.id}>{item.name}</option>
                          ))
                        }
                      </Select>
                    </Col>
                  </Row>
                </div>
              )
            }
          </div>
        </Form>
      </div>
    );
  },

  handleValidSubmit() {
    let data = ''
    if (this.groupsForm) {
      data = this.groupsForm.getDatas();
    }
    this.setState({
      info: {
        ...this.state.info,
        schedule: this.state.plan === 'flow' ? '' : encodeCron(this.state.cycleType, data)
      }
    }, this.props.onValidSubmit)
  },

  handleChangeInfo(field, e) {
    // 如果是同步数据明细
    if (field === 'sync_detail') {
      const syncDetail = this.state.info.sync_detail
      this.state.info.sync_detail = +!syncDetail
    } else {
      this.state.info[field] = e.target.value
    }
    this.setState({
      ...this.state
    })
  },

  handleSelect(field, module, option) {
    const { flowList, onSwitchMode } = this.props
    if (module) {
      this.state[module][field] = option.value
      this.setState({
        ...this.state
      })
      //  如果是切换模式。则回传到 父组件
      if (field === 'mode') {
        onSwitchMode && onSwitchMode(option.value)
      }
    } else if (field === 'cycleType') {
      this.setState({
        cycleType: option.value,
        cycleData: null,
        uuid: new Date().getTime()
      }, () => {
        let data = ''
        if (this.groupsForm) {
          data = this.groupsForm.getDatas();
        }
        this.setState({
          info: {
            ...this.state.info,
            schedule: encodeCron(option.value, data)
          }
        });
      });
    } else {
      this.state[field] = option.value
      if (field === 'plan' && option.value === 'flow') {
        this.state.info.schedule = ''
      } else if (field === 'plan' && option.value === 'cycle') {
        this.state.info.depend_flow_id = ''
      }
      this.setState({
        ...this.state
      }, () => {
        // 如果是 plan
        if (field === 'plan' && option.value === 'flow' && (flowList.length === 0 || !flowList)) {
          this.fetchFlow(true)
        }
      })
    }
  },

  // 周期明细调整变更
  handleCycleDataChange() {
    const { cycleType, info } = this.state;
    const datas = this.groupsForm.getDatas();
    const schedule = encodeCron(cycleType, datas);
    this.setState({
      info: {
        ...info,
        schedule
      }
    });
  },

  fetchFlow(load) {
    if (load || this.state.info.depend_flow_id) {
      this.props.actions.getFlowList({
        page: 1,
        page_size: 1000000,
        // 此处固定获取数据清洗流程
        type: this.state.info.depend_flow_type
      }, (json) => {
        if (!json.result) {
          this.showErr(json.msg)
        }
      });
    }
  },

  validateName(value) {
    // 查找是否有非单元词的字符
    //let invalidReg = ^[a-zA-Z0-9_\u4e00-\u9fa5]+$;
    // 长度是否为1-20
    return /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)
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

  CYCLEDATAS: {
    month: '月',
    week: '周',
    day: '天',
    hour: '小时'
  },

  MODE: [{
    name: '基础',
    value: '基础模式'
  }, {
    name: '高级',
    value: '高级模式'
  }],

  SCHULEDTYPE: [{
    name: 'cycle',
    value: '依赖周期，定时调度'
  }, {
    name: 'flow',
    value: '依赖流程，等待上游调度结束继续运行'
  }],
})

const stateToProps = state => ({
  ...state.labelAddOrEdit
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(labelAddOrEditActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(FirstProcess);
