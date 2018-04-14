import React from 'react'
import PropTypes from 'prop-types'
import Select from 'react-bootstrap-myui/lib/Select';
import { Form, ValidatedInput } from '../../../components/bootstrap-validation';
import GroupsForm from '../../../components/GroupsForm';

import { encodeCron, decodeCron } from '../../../helpers/cron';
import isEqual from 'lodash/isEqual';

import { CYCLE_TYPES } from '../../../constants/dmp';

let flowConfigTimer = 0

class FlowConfig extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    flow: PropTypes.object,
    onUpdateFlow: PropTypes.func,
    getFlowList: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      uuid: new Date().getTime(),
      plan: props.flow.depend_flow_id ? 'flow' : 'cycle',   // 当前调度方案:  cycle -> 周期; flow -> 流程
      cycleType: 'day',                                     // 当前调度周期类型
      cycleData: null,                                      // 当前调度周期详细
      flowData: props.flow,                                 // 当前正在配置的流程
      flowList: [],                                         // 当前可配置的依赖流程列表
    };
  }

  componentDidMount() {
    // 取得调度方案
    const cron = decodeCron(this.props.flow.schedule);

    // 获取流程列表
    this.getFlows();

    // 设置初始化状态
    this.setState({
      ...this.state,
      uuid: new Date().getTime(),
      cycleData: cron.data,
      cycleType: cron.type || 'day'
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    let shouldUpdate = false;

    if (!isEqual(this.props.flow, nextProps.flow)) {
      nextState.flowData = nextProps.flow;
      nextState.plan = nextProps.flow.depend_flow_id ? 'flow' : 'cycle';
      shouldUpdate = true;
    }

    if (this.props.flow.schedule !== nextProps.flow.schedule) {
      const cron = decodeCron(nextProps.flow.schedule);
      nextState.cycleData = cron.data;
      nextState.cycleType = cron.type || 'day';
      shouldUpdate = true;
    }

    if (!isEqual(this.state, nextState)) {
      shouldUpdate = true;
    }

    if (this.props.show !== nextProps.show) {
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      nextState.uuid = new Date().getTime();
    }

    return shouldUpdate;
  }

  render() {
    const {
      uuid,
      plan,
      cycleType,
      cycleData,
      flowList,
      flowData
    } = this.state;

    return (
      <Form className={`form-horizontal flow-dispatch-config ${this.props.show ? '' : ' hidden'}`} validationEvent="onBlur">
        <div className="form-group-set" style={{ padding: '20px', borderBottom: '0 none' }}>
          <div className="form-group-set-title">
            基本属性
          </div>
          <ValidatedInput
            type="text"
            label={<span><i className="required">*</i>清洗名称</span>}
            autoComplete="off"
            name="name"
            maxLength="20"
            value={flowData.name || ''}
            onChange={this.handleChangeBasicInfo.bind(this, 'name')}
            wrapperClassName="input-wrapper"
            validate='required'
            errorHelp={{
              required: '请输入清洗名称'
            }}
          />
          <ValidatedInput
            type="textarea"
            label={<span><i className="required">&nbsp;</i>清洗描述</span>}
            autoComplete="off"
            name="description"
            rows="2"
            value={flowData.description || ''}
            maxLength="80"
            onChange={this.handleChangeBasicInfo.bind(this, 'description')}
            wrapperClassName="input-wrapper"
          />
        </div>
        <div className="form-group-set" style={{ padding: '20px', borderBottom: '0 none' }}>
          <div className="form-group-set-title">
            调度属性
          </div>
          <div className="form-group">
            <label className="control-label">
              <span><i className="required">&nbsp;</i>调度方案</span>
            </label>
            <div className="input-wrapper">
              <Select value={plan}
                maxHeight={250}
                width={'100%'}
                openSearch={false}
                onSelected={this.handlePlanChange.bind(this)}
              >
                <option value={'cycle'}>依赖周期，定时调度</option>
                <option value={'flow'}>依赖流程，等待上游调度结束继续运行</option>
              </Select>
            </div>
          </div>
          {
            plan === 'cycle' && (
              <div>
                <div className="form-group">
                  <label className="control-label">
                    <span><i className="required">&nbsp;</i>调度周期</span>
                  </label>
                  <div className="input-wrapper">
                    <Select
                      value={cycleType}
                      maxHeight={250}
                      width={'100%'}
                      openSearch={false}
                      onSelected={this.handleCycleTypeChange.bind(this)}
                    >
                      {
                        Object.getOwnPropertyNames(CYCLE_TYPES).map((item, key) => (
                          <option value={item} key={key}>{CYCLE_TYPES[item]}</option>
                        ))
                      }
                    </Select>
                  </div>
                </div>
                <div className="form-group">
                  <GroupsForm
                    uuid={uuid}
                    type={cycleType}
                    defaultDatas={cycleData}
                    onChange={this.handleCycleDataChange.bind(this)}
                    ref={(instance) => { this.groupsForm = instance }}
                  />
                </div>
                <div style={{ height: '190px', width: '100%' }} />
              </div>
            )
          }
          {
            plan === 'flow' && (
              <div>
                <div className="form-group">
                  <label className="control-label">
                    <span><i className="required">&nbsp;</i>所属流程</span>
                  </label>
                  <div className="input-wrapper">
                    <Select value={flowData.depend_flow_id || ''}
                      maxHeight={200}
                      width={'100%'}
                      openSearch={true}
                      onSelected={this.handleflowIdChange}
                    >
                      {
                        Array.isArray(flowList) && flowList.map(item => (
                          <option value={item.id} key={item.id}>{item.name}</option>
                        ))
                      }
                    </Select>
                  </div>
                </div>
              </div>
            )
          }
        </div>
      </Form>
    );
  }

  // 基础信息变更
  handleChangeBasicInfo = (field, e) => {
    clearTimeout(flowConfigTimer)
    this.setState({
      flowData: {
        ...this.state.flowData,
        [field]: e.target.value
      }
    }, () => {
      // 更新到本地流程数据
      flowConfigTimer = setTimeout(() => {
        this.props.onUpdateFlow(this.state.flowData);
      }, 500)
    });
  };

  // 依赖流程id变更
  handleflowIdChange = (opts) => {
    this.setState({
      flowData: {
        ...this.state.flowData,
        depend_flow_id: opts.value,
        depend_flow_name: opts.text
      }
    }, () => {
      // 更新到本地流程数据
      this.props.onUpdateFlow(this.state.flowData);
    });
  };

  // 依赖方案变更
  handlePlanChange = (opts) => {
    // 没有做改动的情况
    if (opts.value === this.state.plan) {
      return;
    }
    const { flow } = this.props;
    const { flowList, flowData } = this.state;

    if (opts.value === 'flow') {
      // 调度方案为流程时，如未选择流程，则给定一个初始值
      let dependFlowId = flow.depend_flow_id;
      let dependFlowName = flow.depend_flow_name;

      if (!dependFlowId) {
        dependFlowId = Array.isArray(flowList) ? (flowList[0].id || '') : '';
        dependFlowName = Array.isArray(flowList) ? (flowList[0].name || '') : '';
      }

      this.setState({
        plan: opts.value
      });

      this.props.onUpdateFlow({
        ...flowData,
        depend_flow_id: dependFlowId,
        depend_flow_name: dependFlowName
      });
    } else if (opts.value === 'cycle') {
      this.setState({
        plan: opts.value
      }, () => {
        const datas = this.groupsForm.getDatas();
        const type = this.state.cycleType;
        const schedule = encodeCron(type, datas);

        this.props.onUpdateFlow({
          ...this.state.flowData,
          depend_flow_id: '',
          depend_flow_name: '',
          schedule
        });
      });
    }
  };

  // 周期类型调整变更
  handleCycleTypeChange = (opts) => {
    // 未作改动的情况
    if (this.state.cycleType === opts.value) {
      return;
    }
    this.setState({
      cycleType: opts.value,
      cycleData: null
    }, () => {
      const datas = this.groupsForm.getDatas();
      const type = this.state.cycleType;
      const schedule = encodeCron(type, datas);
      this.props.onUpdateFlow({
        ...this.state.flowData,
        schedule
      });
    });
  };

  // 周期明细调整变更
  handleCycleDataChange = () => {
    const { cycleType } = this.state;
    const datas = this.groupsForm.getDatas();
    const schedule = encodeCron(cycleType, datas);
    this.setState({
      flowData: {
        ...this.state.flowData,
        schedule
      }
    }, () => {
      // 更新到本地流程数据
      this.props.onUpdateFlow(this.state.flowData);
    });
  };

  // 获取流程列表
  getFlows = () => {
    this.props.getFlowList({
      page: 1,
      page_size: 1000000,
      // 此处固定获取数据清洗流程
      type: '数据清洗'
    }, (json) => {
      if (json.result) {
        this.setState({
          flowList: json.data.items
        });
      }
    });
  };
}

export default FlowConfig;

