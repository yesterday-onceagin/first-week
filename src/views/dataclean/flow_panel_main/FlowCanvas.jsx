import PropTypes from 'prop-types';
import React from 'react';

import Node from './Node';

import isEqual from 'lodash/isEqual';

import { CANVAS_ID, JSP_DEFAULT_OPTIONS, JSP_CONNECTION_OPTIONS } from '../constants';

class FlowCanvas extends React.Component {
  static propTypes = {
    nodes: PropTypes.array.isRequired,
    lines: PropTypes.array.isRequired,
    onCreateNode: PropTypes.func.isRequired,
    onOpenNode: PropTypes.func.isRequired,
    onDeleteNode: PropTypes.func.isRequired,
    onNodeMoved: PropTypes.func.isRequired,
    onCreateLine: PropTypes.func.isRequired,
    onDeleteLine: PropTypes.func.isRequired,
    canvasRef: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.drawedLines = [];
  }

  componentWillMount() {
    this.drawedLines = [];
    this.initJsPlumbInstance();
  }

  componentDidMount() {
    if (window.jsPlumb && window.jsp) {
      this.drawedLines = [];
      this.initJsPlumbInstance();
      // 初始化drop事件，让画布接受drop的流程节点
      // 注意，这里使用的是window.jsPlumb，需要和NodeView中使用的一致
      jsPlumb.droppable(jsPlumb.getSelector(`#${CANVAS_ID}`), {
        scope: CANVAS_ID,
        drop: (params) => {
          // 防止取消后会出现点击即打开窗口的情况(未拖动)
          if (+(params.drag.el.getAttribute('can-drop')) === 1) {
            this.props.onCreateNode(params);
            params.drag.el.setAttribute('can-drop', 0);
          }
        }
      });

      // 如果存在连线数据, 则绘制连线
      const lines = this.props.lines;
      if (Array.isArray(lines) && lines.length > 0) {
        this.createConnection(lines);
      }
    }
  }

  componentDidUpdate() {
    if (window.jsPlumb && window.jsp) {
      // 如果存在连线数据, 则绘制连线
      const lines = this.props.lines;
      if (Array.isArray(lines) && lines.length > 0) {
        this.createConnection(lines);
      }
    }
  }

  shouldComponentUpdate(nextProps) {
    return !isEqual(nextProps.nodes, this.props.nodes) || !isEqual(nextProps.lines, this.props.lines);
  }

  componentWillReceiveProps(nextProps) {
    const { nodes, lines } = this.props;
    const nodeOrLineChanged = !isEqual(nextProps.nodes, nodes) || !isEqual(nextProps.lines, lines);
    if (nodeOrLineChanged && window.jsPlumb && window.jsp) {
      window.jsp.reset();
      this.drawedLines = [];
      this.initJsPlumbInstance();
    }
  }

  render() {
    const {
      nodes,
      onOpenNode,
      onNodeMoved,
      onDeleteNode,
      canvasRef
    } = this.props;

    const hasValidNodes = Array.isArray(nodes) && nodes.length > 0;
    return (
      <div id={CANVAS_ID} className="canvas" ref={canvasRef} style={this.STYLE_SHEET.canvas}>
        {
          // 这里需要提供一个key值，确保每次都生成新的Node组件
          hasValidNodes && nodes.map(node => (
            <Node key={node.id + new Date().getTime()}
              nodeData={node}
              onDeleteNode={onDeleteNode}
              onOpenNode={onOpenNode}
              onNodeMoved={onNodeMoved}
            />
          ))
        }
      </div>
    );
  }

  // 初始化jsPlumb实例
  initJsPlumbInstance() {
    window.jsp = jsPlumb.getInstance(JSP_DEFAULT_OPTIONS);

    // 整个画布拖拽
    window.jsp.draggable(jsPlumb.getSelector(`#${CANVAS_ID}`), {
      grid: [3, 3]
    });

    // 节点连线后的回调
    window.jsp.bind('connection', (info) => {
      const {
        lines,
        onCreateLine
      } = this.props;

      // 新连线
      const newLine = {
        ahead_node_id: info.sourceId, // 源节点(底部)
        behind_node_id: info.targetId // 目标节点(顶部)
      };

      // 不接受连接自身
      if (info.connection.sourceId === info.connection.targetId) {
        jsPlumb.detach(info);
        return;
      }

      // 避免重复绘制连线
      if (this.drawedLines.filter(line => (
        line.ahead_node_id === newLine.ahead_node_id && line.behind_node_id === newLine.behind_node_id
      )).length > 0) {
        jsPlumb.detach(info);
        return;
      }

      this.drawedLines.push(newLine);

      // 避免重复创建新连线（添加到flowData）
      if (lines.filter(line => (
        // 此处不可使用isEqul方法判断，因为newLine不包含flow_id和id两个属性
        line.ahead_node_id === newLine.ahead_node_id && line.behind_node_id === newLine.behind_node_id
      )).length === 0) {
        // 将连线数据添加到flowData中
        onCreateLine(newLine);
      }
    });

    // 节点连线删除后的回调
    window.jsp.bind('connectionDetached', (info) => {
      this.drawedLines = this.drawedLines.filter(line => (
        line.ahead_node_id !== info.sourceId && line.behind_node_id !== info.targetId
      ));

      this.props.onDeleteLine({
        ahead_node_id: info.sourceId,
        behind_node_id: info.targetId
      });
    });

    // 连接右键事件
    window.jsp.bind('contextmenu', (connection, e) => {
      if (connection.idPrefix === '_jsplumb_e_') {
        return;
      }
      if (e && e.preventDefault) {
        e.preventDefault();
      } else {
        window.event.returnValue = false;
      }
      // 关闭可能存在的popover(例如删除节点右键菜单)
      document.body.click();

      const onDeleteLine = this.props.onDeleteLine;

      contextmenu.show(contextmenu([{
        label: '删除连线',
        onclick() {
          onDeleteLine({
            ahead_node_id: connection.sourceId,
            behind_node_id: connection.targetId
          });
        }
      }]), e.pageX + 8, e.pageY - 8);
    });

    // 节点连线移动（从一个端点移到了别的端点）后的回调
    window.jsp.bind('connectionMoved', (info) => {
      this.props.onDeleteLine({
        ahead_node_id: info.originalSourceId,
        behind_node_id: info.originalTargetId
      });
    });
  }

  // 创建连线
  createConnection(lines) {
    if (window.jsPlumb && window.jsp) {
      lines.forEach((line) => {
        jsp.connect({
          source: line.ahead_node_id,
          target: line.behind_node_id,
          uuids: [`${line.ahead_node_id}_BottomCenter`, `${line.behind_node_id}_TopCenter`],
          anchors: ['BottomCenter', 'TopCenter'],
          ...JSP_CONNECTION_OPTIONS
        });
      })
    }
  }

  // 除 hover、theme以外的样式
  STYLE_SHEET = {
    canvas: {
      height: '100%',
      width: '100%',
      position: 'absolute'
    }
  }
}

export default FlowCanvas
