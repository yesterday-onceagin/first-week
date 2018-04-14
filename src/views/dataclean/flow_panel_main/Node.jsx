import React from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom';
import Overlay from 'react-bootstrap-myui/lib/Overlay';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';

import { getStringEnLength } from '../../../helpers/common';

import {
  NODE_ENDPOINTS,
  JSP_SOURCE_ENDPOINT_OPTIONS,
  JSP_TARGET_ENDPOINT_OPTIONS
} from '../constants';

class Node extends React.Component {
  static propTypes = {
    nodeData: PropTypes.object.isRequired,
    onOpenNode: PropTypes.func.isRequired,
    onDeleteNode: PropTypes.func.isRequired,
    onNodeMoved: PropTypes.func.isRequired
  };

  static defaultProps = {
    onDeleteNode: () => { },
    onOpenNode: () => { },
    onNodeMoved: () => { }
  };

  constructor(props) {
    super(props);
    this.state = {
      contextMenuShow: false
    };
  }

  componentDidMount() {
    if (window.jsp) {
      // 节点的拖拽 添加drag事件
      jsp.draggable(this.process_node, {
        stop: (params) => {
          this.props.onNodeMoved(this.props.nodeData, params.pos);
        }
      });
      // 节点的端点，用于添加连线
      this.addEndpoints();
    }
  }

  render() {
    const nodeData = this.props.nodeData;

    const style = {
      left: `${nodeData.position.x}px`,
      top: `${nodeData.position.y}px`
    };

    let iconClass = '';
    let typeClass = '';

    switch (nodeData.type) {
      case '采集':
        iconClass = 'dmpicon-tree-node';
        typeClass = 'process-node-collector';
        break;
      case 'ODPS_SQL':
        iconClass = 'dmpicon-odps-node';
        typeClass = 'process-node-odpssql';
        break;
      case '映射':
        iconClass = 'dmpicon-mapping';
        typeClass = 'process-node-mapping';
        break;
      case '同步':
        iconClass = 'dmpicon-rds-node';
        typeClass = 'process-node-rds';
        break;
      default:
        break;
    }

    const node = (
      <div
        ref={(node) => { this.process_node = node }}
        style={style}
        id={nodeData.id}
        className={`process-node ${typeClass}`}
        onContextMenu={this.handleContextMenu.bind(this)}
        onDoubleClick={this.handleDoubleClick.bind(this)}
      >
        <i className={`node-icon ${iconClass}`} />
        {nodeData.name}
        <Overlay show={this.state.contextMenuShow}
          onHide={() => this.setState({ contextMenuShow: false })}
          placement="right"
          container={this}
          rootClose={true}
          target={this.process_node}
        >
          <div className="overlay-contextmenu" onClick={this.handleDeleteNode.bind(this)}>
            <div className="overlay-contextmenu-item">
              删除节点
            </div>
          </div>
        </Overlay>
      </div>
    );

    const processNode = getStringEnLength(nodeData.name) > 13 ? (
      <OverlayTrigger trigger="hover" placement="right" overlay={<Tooltip>{nodeData.name}</Tooltip>}>
        {node}
      </OverlayTrigger>
    ) : node;

    return processNode;
  }

  /**
   * 添加连接端点(jsPlumb endpoint)
   * 这里使用固定端点，用uuid进行连接
   */
  addEndpoints() {
    const nodeData = this.props.nodeData;
    const endpoints = NODE_ENDPOINTS[nodeData.type] || {};
    // sourceEndpoints（相对于连接来说，它是输出端）
    if (endpoints.sourceEndpoints) {
      endpoints.sourceEndpoints.forEach((item) => {
        jsp.addEndpoint(nodeData.id, JSP_SOURCE_ENDPOINT_OPTIONS, {
          ...item,
          uuid: `${nodeData.id}_${item.uuid}`
        });
      })
    }

    // targetEndpoints（相对于连接来说，它是输入端）
    if (endpoints.targetEndpoints) {
      endpoints.targetEndpoints.forEach((item) => {
        jsp.addEndpoint(nodeData.id, JSP_TARGET_ENDPOINT_OPTIONS, {
          ...item,
          uuid: `${nodeData.id}_${item.uuid}`
        });
      })
    }
  }

  // 右键事件
  handleContextMenu(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    } else {
      window.event.returnValue = false;
    }
    e.stopPropagation();
    // 防止出现其他的右键菜单
    document.body.click();
    this.setState({
      contextMenuShow: true
    });
  }

  // 删除
  handleDeleteNode(e) {
    e.stopPropagation();
    this.props.onDeleteNode(this.props.nodeData);
  }

  handleDoubleClick(e) {
    e.stopPropagation();
    this.props.onOpenNode(this.props.nodeData);
  }
}


export default Node;
