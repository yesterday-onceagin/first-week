import PropTypes from 'prop-types';
import React from 'react';
import isEqual from 'lodash/isEqual';

import {
  FIELD_SOURCE,
  FIELD_TARGET,
  NODE_ENDPOINTS,
  JSP_DEFAULT_OPTIONS,
  JSP_CONNECTION_OPTIONS,
  JSP_SOURCE_ENDPOINT_OPTIONS,
  JSP_TARGET_ENDPOINT_OPTIONS
} from '../constants/rds';

class MapsPanel extends React.Component {
  static propTypes = {
    flowNode: PropTypes.object,
    /**
     * 源数据表
     */
    sourceTableColumns: PropTypes.array,

    /**
     * 目的数据表
     */
    targetTableColumns: PropTypes.array,

    /**
     * 目的数据表
     */
    connections: PropTypes.array,

    /**
     * 连接节点时的回调
     * @type {Function}
     * @param {Object}  [info]  {source, target, sourceEndpoint, targetEndpoint}
     */
    onNodeConnection: PropTypes.func,
    /**
     * 节点连线删除后的回调
     * @type {Function}
     * @param {Object} [info]  {source, target, sourceEndpoint, targetEndpoint}
     */
    onNodeConnectionDetached: PropTypes.func,
    /**
     * 节点移动回调
     */
    onNodeConnectionMoved: PropTypes.func,
    onDeleteLine: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      columns: {
        sources: [],
        targets: []
      }
    }
  }

  componentDidMount() {
    if (window.jsPlumb) {
      this.initJsPlumbInstance();
      this.addEndpoints();
      this.createConnection(this.props.connections)
    }
  }

  componentWillReceiveProps(nextProps) {
    const {
      flowNode,
      sourceTableColumns,
      targetTableColumns,
      connections
    } = this.props
    const CANVAS_ID = `${flowNode.id}_canvas`;
    const needChange = !isEqual(nextProps.sourceTableColumns, sourceTableColumns) || !isEqual(nextProps.targetTableColumns, targetTableColumns) || !isEqual(nextProps.connections, connections)

    if (needChange && window.jsPlumb && window[`jsp_${CANVAS_ID}`]) {
      window[`jsp_${CANVAS_ID}`].reset();
      this.initJsPlumbInstance(nextProps);
    }
  }

  shouldComponentUpdate(nextProps) {
    const { sourceTableColumns, targetTableColumns, connections } = this.props

    return !isEqual(nextProps.sourceTableColumns, sourceTableColumns) || !isEqual(nextProps.targetTableColumns, targetTableColumns) || !isEqual(nextProps.connections, connections)
  }

  componentDidUpdate() {
    this.addEndpoints();
    this.createConnection(this.props.connections)
  }

  render() {
    const {
      flowNode,
      sourceTableColumns,
      targetTableColumns,
      ...otherProps
    } = this.props
    const CANVAS_ID = `${flowNode.id}_canvas`;

    this.state.columns.sources = [];
    this.state.columns.targets = [];

    return (
      <div {...otherProps} className="canvas clearfix inner-wrap" id={CANVAS_ID}>
        <div className="item">
          <table>
            <thead>
              <tr>
                <th>源头表字段</th>
                <th>类型</th>
              </tr>
            </thead>
            <tbody>
              {
                sourceTableColumns ? sourceTableColumns.map((item) => {
                  const field = `${flowNode.id}_source_${item.name}`;
                  const key = `${field}_${Math.random()}`;
                  this.state.columns.sources.push(field)
                  return (
                    <tr key={key} ref={key} id={field}>
                      <td>{item.name}</td>
                      <td>{item.type}</td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan="2"><div className="nothing">暂无字段数据</div></td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>
        <div className="item">
          <table>
            <thead>
              <tr>
                <th>目标表字段</th>
                <th>类型</th>
              </tr>
            </thead>
            <tbody>
              {
                targetTableColumns ? targetTableColumns.map((item) => {
                  const field = `${flowNode.id}_target_${item.name}`;
                  const key = `${field}_${Math.random()}`;
                  this.state.columns.targets.push(field)
                  return (
                    <tr key={key} ref={key} id={field}>
                      <td>{item.name}</td>
                      <td>{item.type}</td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan="2"><div className="nothing">暂无字段数据</div></td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  //初始化jsPlumb实例
  initJsPlumbInstance(props) {
    props = props || this.props

    const CANVAS_ID = `${props.flowNode.id}_canvas`;
    window[`jsp_${CANVAS_ID}`] = jsPlumb.getInstance({
      ...JSP_DEFAULT_OPTIONS,
      Container: CANVAS_ID
    })

    // 节点连线后的回调
    window[`jsp_${CANVAS_ID}`].bind('connection', (info) => {
      this.props.onNodeConnection({
        source: info.sourceId,
        sourceEndpoint: info.sourceEndpoint.getUuid(),
        target: info.targetId,
        targetEndpoint: info.targetEndpoint.getUuid()
      })
    })

    // 节点连线删除后的回调
    window[`jsp_${CANVAS_ID}`].bind('connectionDetached', (info) => {
      this.props.onNodeConnectionDetached({
        source: info.sourceId,
        sourceEndpoint: info.sourceEndpoint.getUuid(),
        target: info.targetId,
        targetEndpoint: info.targetEndpoint.getUuid()
      })
    })

    // 连接右键事件
    window[`jsp_${CANVAS_ID}`].bind('contextmenu', (connection, e) => {
      if (connection.idPrefix === '_jsplumb_e_') {
        return;
      }
      if (e && e.preventDefault) {
        e.preventDefault();
      } else {
        window.event.returnValue = false;
      }

      const { onDeleteLine } = this.props;
      contextmenu.show(contextmenu([{
        label: '删除连线',
        onclick() {
          onDeleteLine({
            source: connection.sourceId,
            sourceEndpoint: `${connection.sourceId}_Right`,
            target: connection.targetId,
            targetEndpoint: `${connection.targetId}_Left`
          });
        }
      }]), e.pageX + 8, e.pageY - 8);
    });

    // 节点连线移动的
    window[`jsp_${CANVAS_ID}`].bind('connectionMoved', (info) => {
      this.props.onNodeConnectionMoved({
        source: info.originalSourceId,
        sourceEndpoint: info.originalSourceEndpoint.getUuid(),
        target: info.originalTargetId,
        targetEndpoint: info.originalTargetEndpoint.getUuid()
      })
    })
  }

  addEndpoints() {
    this.addPoints(FIELD_SOURCE, this.state.columns.sources)
    this.addPoints(FIELD_TARGET, this.state.columns.targets)
  }

  addPoints(type, columns) {
    const CANVAS_ID = `${this.props.flowNode.id}_canvas`;
    const endpoints = NODE_ENDPOINTS[type] || {}

    // sourceEndpoints（相对于连接来说，它是输出端）
    if (endpoints.sourceEndpoints) {
      endpoints.sourceEndpoints.forEach((item) => {
        columns.forEach((column) => {
          window[`jsp_${CANVAS_ID}`].addEndpoint(column, JSP_SOURCE_ENDPOINT_OPTIONS, {
            ...item,
            uuid: `${column}_${item.uuid}`
          })
        })
      })
    }

    // targetEndpoints（相对于连接来说，它是输入端）
    if (endpoints.targetEndpoints) {
      endpoints.targetEndpoints.forEach((item) => {
        columns.forEach((column) => {
          window[`jsp_${CANVAS_ID}`].addEndpoint(column, JSP_TARGET_ENDPOINT_OPTIONS, {
            ...item,
            uuid: `${column}_${item.uuid}`
          })
        })
      })
    }
  }

  createConnection(connections) {
    const CANVAS_ID = `${this.props.flowNode.id}_canvas`;
    if (window.jsPlumb && window[`jsp_${CANVAS_ID}`]) {
      connections && connections.forEach((connection) => {
        window[`jsp_${CANVAS_ID}`].connect({
          source: connection.source,
          target: connection.target,
          uuids: [connection.sourceEndpoint, connection.targetEndpoint],
          anchors: [connection.sourceEndpoint.replace(`${connection.source}_`, ''), connection.targetEndpoint.replace(`${connection.target}_`, '')],
          ...JSP_CONNECTION_OPTIONS
        });
      })
    }
  }
}

export default MapsPanel
