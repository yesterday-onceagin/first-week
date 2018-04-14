import PropTypes from 'prop-types';
import React from 'react';
import createReactClass from 'create-react-class';
import ReactDOM from 'react-dom';

import NodeView from './NodeView';
import FlowCanvas from './FlowCanvas';
import AddFlowNodeDialog from '../components/AddFlowNodeDialog';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataCleanFlowActionCreators } from '../../../redux/modules/dataclean/flow';
import { actions as dataCleanActionCreators } from '../../../redux/modules/dataclean/dataclean';

import getOffset from '../../../helpers/getOffset';
import TipMixin from '../../../helpers/TipMixin';

import { NODE_LIST } from '../constants';

const FlowPanelMain = createReactClass({
  displayName: 'FlowPanelMain',
  mixins: [TipMixin],

  propTypes: {
    style: PropTypes.object,
    onOpenNode: PropTypes.func,
    onCloseNode: PropTypes.func
  },

  getDefaultProps() {
    return {
      style: {},
      onOpenNode: () => { },
      onCloseNode: () => { }
    };
  },

  getInitialState() {
    return {
      addDialog: {
        show: false,
        info: {
          name: '',
          description: '',
          position: {},
          type: ''
        }
      }
    }
  },

  componentDidMount() {

  },

  render() {
    const { style, flowData, onOpenNode } = this.props;
    const { addDialog } = this.state;

    return (
      <div className="flow-panel-main" style={style}>
        <NodeView data={NODE_LIST} />
        <FlowCanvas
          canvasRef={(node) => { this.canvas = node }}
          nodes={flowData.nodes}
          lines={flowData.lines}
          onOpenNode={onOpenNode}
          onDeleteNode={this.handleDeleteNode.bind(this)}
          onNodeMoved={this.handleSetNodePos.bind(this)}
          onCreateNode={this.handleOpenAddDialog.bind(this)}
          onCreateLine={this.handleCreateLine.bind(this)}
          onDeleteLine={this.handleDeleteLine.bind(this)}
        />
        {
          addDialog.show && (
            <AddFlowNodeDialog
              show={addDialog.show}
              data={addDialog.info}
              onSure={this.handleSubmitAddDialog}
              onHide={this.handleCloseAddDialog}
            />
          )
        }
      </div>
    )
  },

  // 增加连线
  handleCreateLine(line) {
    const newFlowData = this.props.flowData;
    newFlowData.lines.push(line);
    const nodes = newFlowData.nodes.map((node) => {
      if (node.id === line.ahead_node_id) {
        // 该节点的下端点有连线
        node.is_end = 0;
      }
      if (node.id === line.behind_node_id) {
        // 该节点的上端点有连线
        node.is_start = 0;
      }
      return node;
    })
    this.props.actions.updateLocalFlowData({ ...newFlowData, nodes });
  },

  // 删除连线
  handleDeleteLine(line) {
    const newFlowData = this.props.flowData;

    const lines = newFlowData.lines.filter(oldline => (
      oldline.behind_node_id !== line.behind_node_id || oldline.ahead_node_id !== line.ahead_node_id
    ));

    const nodes = newFlowData.nodes.map((node) => {
      // 若目前的线当中仍然有以该节点为终点的
      if (lines.some(l => (l.ahead_node_id === node.id))) {
        node.is_end = 0;
      } else {
        node.is_end = 1;
      }

      if (lines.some(l => (l.behind_node_id === node.id))) {
        node.is_start = 0;
      } else {
        node.is_start = 1;
      }

      return node;
    });
    this.props.actions.updateLocalFlowData({ ...newFlowData, nodes, lines });
  },

  // 更新节点位置
  handleSetNodePos(node, pos) {
    node.position = {
      x: pos[0],
      y: pos[1]
    }
    this.props.actions.updateLocalFlowNode(node);
  },

  // 删除节点
  handleDeleteNode(node) {
    // 删除仅执行本地删除
    this.props.actions.deleteLocalFlowNode(node.id);
    // 删除时同时调用关闭节点
    this.props.onCloseNode(node);
  },

  // 打开新增数据清洗节点对话框
  handleOpenAddDialog(params) {
    const canvas = this.canvas
    const posX = params.e.pageX - getOffset(canvas)[0];
    const posY = params.e.pageY - getOffset(canvas)[1];

    this.setState({
      addDialog: {
        info: {
          ...this.state.addDialog.info,
          position: {
            x: posX,
            y: posY
          },
          type: params.drag.el.getAttribute('data-type')
        },
        show: true
      }
    });
  },

  // 新增数据清洗节点提交
  handleSubmitAddDialog(data) {
    data.flow_id = this.props.flowData.id;

    this.props.actions.addFlowNode(data, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSuccess(json.msg);
      }
      this.handleCloseAddDialog();
    });
  },

  // 关闭新增数据清洗节点对话框
  handleCloseAddDialog() {
    this.setState({
      addDialog: {
        show: false,
        info: {
          name: '',
          description: '',
          position: {},
          type: ''
        }
      }
    });
  },

  // 错误提示框
  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    })
  },

  // 成功提示框
  showSuccess(str) {
    this.showTip({
      status: 'success',
      content: str
    })
  },
})

const stateToProps = state => ({
  ...state.dataclean_flow
})
const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataCleanFlowActionCreators, dataCleanActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(FlowPanelMain);
