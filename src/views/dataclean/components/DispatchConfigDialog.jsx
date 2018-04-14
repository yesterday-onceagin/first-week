import React from 'react'
import PropTypes from 'prop-types'

import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Loading from 'react-bootstrap-myui/lib/Loading';
import Button from 'react-bootstrap-myui/lib/Button';
import Select from 'react-bootstrap-myui/lib/Select';
import Input from 'react-bootstrap-myui/lib/Input';
import Row from 'react-bootstrap-myui/lib/Row';
import Col from 'react-bootstrap-myui/lib/Col';
import GroupsForm from '../../../components/GroupsForm';

import { encodeCron, decodeCron } from '../../../helpers/cron';

import { CYCLE_TYPES } from '../../../constants/dmp';

class DispatchConfigDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    onHide: PropTypes.func,
    getFlowList: PropTypes.func,
    fetchUpdateFlow: PropTypes.func,
    getFlowData: PropTypes.func,
    showTip: PropTypes.func,
    flow: PropTypes.object
  };

  static defaultProps = {
    show: false
  };

  state = {
    uuid: new Date().getTime(),
    plan: 'cycle',                  // 当前调度方案:  cycle -> 周期; flow -> 流程
    cycleType: 'day',               // 当前调度周期类型
    cycleData: null,                // 当前调度周期详细
    flowData: null,                 // 当前正在配置的流程
    flowList: [],                   // 当前可配置的依赖流程列表
    submitPending: false,           // 提交loading
  };

  componentDidMount() {
    // 获得流程详情
    this.props.getFlowData(this.props.flow.id, (json) => {
      if (json.result) {
        // 取得调度方案
        const cron = decodeCron(json.data.schedule);

        const newFlowData = json.data;
        let newNodes = Array.isArray(json.data.nodes) ? json.data.nodes : [];

        // 对360画像清洗的节点数据content进行初始化(content=''的场合)
        const hasNodes = Array.isArray(newFlowData.nodes) && newFlowData.nodes.length > 0;
        if (newFlowData.id === '00000000-1111-2222-1111-000000000000' && hasNodes) {
          newNodes = newFlowData.nodes.map((node) => {
            if (node.id === '00000000-1111-2222-1111-000000000001' && !node.content) {
              node.content = {
                sync_table: false
              };
            }
            return node;
          });
        }

        // 设置初始化状态
        this.setState({
          ...this.state,
          flowData: {
            ...newFlowData,
            nodes: newNodes
          },
          uuid: new Date().getTime(),
          cycleData: cron.data,
          cycleType: cron.type || 'day',
          plan: newFlowData.depend_flow_id ? 'flow' : 'cycle',
        });
      }
    });
    // 获取流程列表
    this.getFlows();
  }

  render() {
    const {
      show,
      onHide
    } = this.props;

    const {
      uuid,
      plan,
      flowData,
      cycleType,
      cycleData,
      flowList,
      submitPending
    } = this.state;

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '650px' }}
        className="data-view-dispatch-config-dialog"
        id="data-view-dispatch-config-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>配置清洗调度</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body style={{ minHeight: '180px' }}>
          {
            flowData && (
              <form className="dispatch-form form-horizontal">
                <Row style={{ marginLeft: '0px', marginRight: '0px', paddingLeft: '50px' }}>
                  <Col xs={2} className="control-label">调度方案</Col>
                  <Col xs={10}>
                    <Select
                      value={plan}
                      maxHeight={250}
                      width={300}
                      openSearch={false}
                      onSelected={this.handlePlanChange.bind(this)}
                    >
                      <option value={'cycle'}>依赖周期，定时调度</option>
                      <option value={'flow'}>依赖流程，等待上游调度结束继续运行</option>
                    </Select>
                  </Col>
                </Row>
                {
                  plan === 'cycle' && (
                    <div style={{ marginTop: '15px' }}>
                      <Row style={{ marginLeft: '0px', marginRight: '0px', paddingLeft: '50px' }}>
                        <Col xs={2} className="control-label">调度周期</Col>
                        <Col xs={10}>
                          <Select
                            value={cycleType}
                            maxHeight={250}
                            width={207}
                            openSearch={false}
                            onSelected={this.handleCycleTypeChange.bind(this)}
                          >
                            {
                              Object.keys(CYCLE_TYPES).map((item, key) => (
                                <option value={item} key={key}>{CYCLE_TYPES[item]}</option>
                              ))
                            }
                          </Select>
                        </Col>
                      </Row>
                      <Row style={{ margin: '15px 0', paddingLeft: '50px' }}>
                        <GroupsForm
                          uuid={uuid}
                          type={cycleType}
                          defaultDatas={cycleData}
                          onChange={this.handleCycleDataChange.bind(this)}
                          ref={(instance) => { this.groupsForm = instance }}
                        />
                      </Row>
                    </div>
                  )
                }
                {
                  plan === 'flow' && (
                    <div style={{ marginTop: '15px' }}>
                      <Row style={{ margin: '15px 0', paddingLeft: '50px' }}>
                        <Col xs={2} className="control-label">所属流程</Col>
                        <Col xs={10}>
                          <Select value={flowData.depend_flow_id || ''}
                            maxHeight={250}
                            openSearch={true}
                            onSelected={this.handleDependFlowChange}
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
                {this.renderImageOption()}
              </form>
            )
          }
        </Dialog.Body>
        <Dialog.Footer>
          <Button
            bsStyle="primary"
            loading={submitPending}
            onClick={this.handleSubmitDispatch.bind(this)}
          >
            确定
          </Button>
          <Button bsStyle="default" onClick={onHide}>取消</Button>
        </Dialog.Footer>
        <Loading show={!flowData} containerId='data-view-dispatch-config-dialog' />
      </Dialog>
    );
  }

  // 360画像清洗流程设置额外项目
  renderImageOption = () => {
    const { flowData } = this.state;

    if (flowData.id === '00000000-1111-2222-1111-000000000000') {
      let syncTable = false;

      const { nodes } = flowData;

      if (Array.isArray(nodes) && nodes.length > 0) {
        const imageNode = nodes.filter(node => (
          node.id === '00000000-1111-2222-1111-000000000001'
        ))[0];

        if (imageNode && imageNode.content) {
          syncTable = imageNode.content.sync_table;
        }
      }

      const labelStyle = {
        paddingLeft: '0px',
        paddingRight: '0px',
        marginLeft: '-15px',
        marginRight: '15px',
        whiteSpace: 'nowrap',
        display: 'flex',
        justifyContent: 'flex-end'
      };

      return (
        <Row style={{ marginLeft: '0px', marginRight: '0px', paddingLeft: '50px' }}>
          <Col xs={2} className="control-label" style={labelStyle}>画像表同步RDS</Col>
          <Col xs={8} style={{ paddingLeft: '15px' }}>
            <div style={{ width: '30%', float: 'left' }}>
              <Input
                type="radio"
                label="是"
                checked={syncTable}
                onClick={this.handleChangeImageTableSync.bind(this, true)}
              />
            </div>
            <div style={{ width: '30%', float: 'left' }}>
              <Input
                type="radio"
                label="否"
                checked={!syncTable}
                onClick={this.handleChangeImageTableSync.bind(this, false)}
              />
            </div>
          </Col>
        </Row>
      );
    }
    return null;
  };

  // 更改画像清洗内容
  handleChangeImageTableSync = (isSync) => {
    let nodes = this.state.flowData.nodes.concat();

    nodes = nodes.map((node) => {
      if (node.id === '00000000-1111-2222-1111-000000000001') {
        node.content = {
          sync_table: isSync
        };
      }
      return node;
    });

    this.setState({
      flowData: {
        ...this.state.flowData,
        nodes
      }
    });
  };

  // 依赖流程变更
  handleDependFlowChange = (opts) => {
    this.setState({
      flowData: {
        ...this.state.flowData,
        depend_flow_id: opts.value,
        depend_flow_name: opts.text
      }
    });
  };

  // 依赖方案变更
  handlePlanChange = (opts) => {
    if (opts.value === this.state.plan) {
      return;
    }

    this.setState({
      plan: opts.value
    });
  };

  // 周期类型调整变更
  handleCycleTypeChange = (opts) => {
    const type = opts.value;
    this.setState({
      cycleType: type,
      cycleData: null,
      uuid: new Date().getTime()
    }, () => {
      const data = this.groupsForm.getDatas();
      this.setState({
        flowData: {
          ...this.state.flowData,
          schedule: encodeCron(type, data)
        }
      });
    });
  };

  // 周期明细调整变更
  handleCycleDataChange = () => {
    const { cycleType, flowData } = this.state;

    const datas = this.groupsForm.getDatas();
    const schedule = encodeCron(cycleType, datas);
    this.setState({
      flowData: {
        ...flowData,
        schedule
      }
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

  // 提交变更后的调度
  handleSubmitDispatch = () => {
    // 提交loading状态
    this.setState({
      submitPending: true
    });

    const { flowData } = this.state;

    // 调度方式为周期时清空依赖流程ID和NAME
    if (this.state.plan === 'cycle') {
      flowData.depend_flow_id = '';
      flowData.depend_flow_name = '';
    }

    // 调度方式为流程时如未选择依赖流程则提醒
    if (this.state.plan === 'flow' && !flowData.depend_flow_id) {
      this.showTip({
        status: 'error',
        content: '未选择调度依赖的流程'
      });
      return;
    }

    this.props.fetchUpdateFlow(flowData, (json) => {
      this.setState({
        submitPending: false
      });
      if (!json.result) {
        this.props.showTip({
          status: 'error',
          content: json.msg
        });
      } else {
        this.props.showTip({
          status: 'success',
          content: json.msg
        });
        this.props.onHide();
      }
    });
  };
}

export default DispatchConfigDialog;
