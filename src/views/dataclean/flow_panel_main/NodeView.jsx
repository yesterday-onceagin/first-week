import React from 'react'
import PropTypes from 'prop-types'

import { CANVAS_ID } from '../constants';

class NodeView extends React.Component {
  static propTypes = {
    data: PropTypes.array.isRequired
  };

  componentDidMount() {
    if (window.jsPlumb) {
      jsPlumb.draggable(jsPlumb.getSelector('.node-list .drag-node'), {
        scope: CANVAS_ID,
        clone: true,
        // 这里重置drag样式，避免和节点连线时的drag样式重叠
        dragClass: 'process-node-drag',
        start: (params) => {
          params.el.setAttribute('can-drop', 1);
        },
        drag: () => { },
        stop: (params) => {
          params.el.setAttribute('can-drop', 0);
        }
      })
    }
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.data !== this.props.data;
  }

  render() {
    const { data } = this.props;

    return (
      <div className="view-nodes">
        <div className="nodes-wrap">
          <h3>流程节点</h3>
          {
            data.map((item, index) => (
              <ul key={index} className="node-list">
                <li>
                  {item.name}
                  {
                    item.children && item.children.length > 0 ? (
                      <ul>
                        {
                          item.children.map((node, nodeIndex) => {
                            let iconClass = '';

                            switch (node.type) {
                              case '采集':
                                iconClass = 'dmpicon-tree-node';
                                break;
                              case 'ODPS_SQL':
                                iconClass = 'dmpicon-odps-node';
                                break;
                              case '映射':
                                iconClass = 'dmpicon-mapping';
                                break;
                              case '同步':
                                iconClass = 'dmpicon-rds-node';
                                break;
                              default:
                                break;
                            }

                            return (
                              <li key={nodeIndex}
                                data-type={node.type}
                                className={node.disabled ? 'node' : 'node drag-node'}
                              >
                                <i className={`node-icon ${iconClass}`} />
                                {node.name}
                              </li>
                            );
                          })
                        }
                      </ul>
                    ) : null
                  }
                </li>
              </ul>
            ))
          }
        </div>
      </div>
    )
  }
}

export default NodeView
