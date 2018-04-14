import React from 'react'
import PropTypes from 'prop-types'
import { Form, ValidatedInput } from '../../../components/bootstrap-validation';
import { NODE_MAP } from '../constants';
import isEqual from 'lodash/isEqual';

let nodeConfigTimer = 0

class NodeConfig extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    node: PropTypes.object,
    actions: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {
      nodeData: props.node
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    let shouldUpdate = false;

    // 切换显示状态
    if (this.props.show !== nextProps.show) {
      shouldUpdate = true;
    }

    // 切换了node || 当前需要显示的属性发生了变化(name, description)
    if (this.props.node.id !== nextProps.node.id || this.props.node.name !== nextProps.node.name || this.props.node.description !== nextProps.node.description) {
      shouldUpdate = true;
      nextState.nodeData = nextProps.node;
    }

    // state变化
    if (!isEqual(this.state, nextState)) {
      shouldUpdate = true;
    }

    return shouldUpdate;
  }

  render() {
    const { node } = this.props;
    const { nodeData } = this.state;

    const type = NODE_MAP[node.type] ? NODE_MAP[node.type].name : '未知类型';

    return (
      <Form className={`form-horizontal node-data-config ${this.props.show ? '' : ' hidden'}`}
        validationEvent="onBlur">
        <div className="form-group-set" style={{ padding: '20px', borderBottom: '0 none' }}>
          <div className="form-group-set-title">
            基本属性
          </div>
          <ValidatedInput type="text"
            label={<span><i className="required">*</i>节点名称</span>}
            autoComplete="off"
            name="name"
            value={nodeData.name || ''}
            maxLength="20"
            onChange={this.handleChangeNodeInfo.bind(this, 'name')}
            wrapperClassName="input-wrapper"
            validate='required'
            errorHelp={{ required: '请输入节点名称' }}
          />
          <ValidatedInput type="text"
            label={<span><i className="required">&nbsp;</i>类型</span>}
            disabled={true}
            readonly={true}
            autoComplete="off"
            name="type"
            value={type}
            wrapperClassName="input-wrapper"
          />
          <ValidatedInput type="textarea"
            label={<span><i className="required">&nbsp;</i>描述</span>}
            autoComplete="off"
            name="description"
            rows="2"
            value={nodeData.description || ''}
            maxLength="80"
            onChange={this.handleChangeNodeInfo.bind(this, 'description')}
            wrapperClassName="input-wrapper"
          />
        </div>
      </Form>
    );
  }

  // 基础信息变更
  handleChangeNodeInfo = (field, e) => {
    clearTimeout(nodeConfigTimer)
    this.setState({
      nodeData: {
        ...this.state.nodeData,
        [field]: e.target.value
      }
    }, () => {
      // 更新到本地流程数据
      nodeConfigTimer = setTimeout(() => {
        this.props.actions.updateLocalFlowNode(this.state.nodeData);
      }, 500)
    });
  };
}

export default NodeConfig;
