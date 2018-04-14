import React from 'react'
import PropTypes from 'prop-types'
import './group-tree.less';

// 用户组树节点
class GroupLeafNode extends React.Component {
  static propTypes = {
    data: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object
    ]).isRequired,
    sub: PropTypes.array.isRequired,
    nodeTemplate: PropTypes.func.isRequired,
    nodeHeight: PropTypes.number,
    paddingUnit: PropTypes.number,
    initSpread: PropTypes.bool,
    needSpreadCallback: PropTypes.bool,
    renderSub: PropTypes.func.isRequired,
    active: PropTypes.bool,
    canActive: PropTypes.bool,
    hasSpreadIcon: PropTypes.bool,
    useTreeLine: PropTypes.bool,
    isLastSub: PropTypes.bool,
    spreadCallback: PropTypes.func,
    draggable: PropTypes.bool,
    onDragStart: PropTypes.func,
    onDragOver: PropTypes.func,
    onDragEnd: PropTypes.func,
    onClickLeaf: PropTypes.func,   // 点击叶子事件
  };

  static defaultProps = {
    data: [],
    sub: [],
    nodeHeight: 40,
    paddingUnit: 22,
    active: false,
    canActive: true,
    initSpread: false,
    hasSpreadIcon: true,
    useTreeLine: false,
    needSpreadCallback: false,
    isLastSub: false,
    spreadCallback: undefined
  };

  constructor(props) {
    super(props);
    this.state = {
      spread: props.initSpread,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.initSpread && nextProps.initSpread) {
      this.setState({ spread: true });
    }
    /*
    if (!_.isEqual(this.props.data, nextProps.data) && nextProps.initSpread) {
      this.setState({ spread: true })
    }
    */

    if (this.props.data && nextProps.data && !this.props.data.init_spread && nextProps.data.init_spread) {
      this.setState({ spread: true });
    }
  }

  render() {
    const {
      data,
      sub,
      nodeTemplate,
      active,
      hasSpreadIcon,
      useTreeLine,
      draggable,
      onDragStart,
      onDragOver,
      onDragEnd,
      needSpreadCallback
    } = this.props;

    // 是否显示sub
    const showSub = sub.length > 0 && this.state.spread && !data.all_sub_hidden;

    const styles = this._getStyles(showSub);

    return data.hidden ? null : (
      <div className="dmp-tree-node-container" style={{ position: 'relative' }}>
        <div style={styles.nodeBox}
          className={`dmp-tree-node-box  ${active ? 'active' : ''}`}
          draggable={`${draggable}`}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          data-node={draggable ? JSON.stringify(data) : null}
          onClick={sub.length > 0 || needSpreadCallback ? () => {
            this.handleClickLeaf(data);
            this.handleSpreadSubs()
          } : this.handleClickLeaf.bind(this, data)}>
          {useTreeLine && <i className="dmp-tree-node-sub-line-x" style={styles.xLine} />}
          {
            hasSpreadIcon && sub.length > 0 && !data.all_sub_hidden && (
              <div style={styles.iconBox}
                className="dmp-tree-node-icon-box"
                onClick={this.handleToggleSpread.bind(this)}>
                <i className="dmpicon-triangle" style={styles.icon}></i>
              </div>
            )
          }
          <div style={styles.content} className="dmp-tree-node-content">
            {nodeTemplate(data, this.state.spread)}
          </div>
        </div>
        {this.renderNodeSub(showSub)}
      </div>
    )
  }

  renderNodeSub(showSub) {
    const {
      data,
      sub,
      renderSub,
      useTreeLine,
      isLastSub,
      paddingUnit,
      nodeHeight
    } = this.props;

    // 是否需要遮挡yLine
    const showYLineHider = data.level > 0 && isLastSub;

    const styles = {
      yLine: {
        position: 'absolute',
        left: `${paddingUnit * (data.level + 1)}px`,
        top: `${Math.ceil(nodeHeight / 2)}px`,
        bottom: `${Math.floor(nodeHeight / 2)}px`,
        width: 0,
        height: 'auto',
        borderLeftStyle: 'dotted',
        borderLeftWidth: '1px',
        zIndex: 0,
      },
      yLineHider: {
        position: 'absolute',
        left: `${paddingUnit * data.level}px`,
        top: `${Math.ceil(nodeHeight / 2) + 1}px`,
        bottom: `${Math.floor(nodeHeight / 2)}px`,
        width: '1px',
        height: 'auto',
        zIndex: 0
      }
    }

    return (
      <div className="dmp-tree-node-sub">
        {
          useTreeLine && showSub && (
            <i className="dmp-tree-node-sub-line-y" style={styles.yLine} />
          )
        }
        {
          useTreeLine && showYLineHider && (
            <i className="dmp-tree-node-sub-line-y-hider" style={styles.yLineHider} />
          )
        }
        {showSub && renderSub(sub)}
      </div>
    )
  }

  handleClickLeaf(data) {
    this.props.onClickLeaf && this.props.onClickLeaf(data)
  }

  // 展开 (非异步loading)
  handleSpreadSubs() {
    if (this.state.spread && this.props.canActive) {
      return;
    }
    this.setState({ spread: this.props.canActive ? true : !this.state.spread }, () => {
      if (typeof this.props.spreadCallback === 'function') {
        this.props.spreadCallback(this.props.data, this.state.spread);
      }
    });
  }

  // 切换展开收起
  handleToggleSpread(e) {
    e.stopPropagation();
    this.setState({ spread: !this.state.spread }, () => {
      if (typeof this.props.spreadCallback === 'function') {
        this.props.spreadCallback(this.props.data, this.state.spread);
      }
    });
  }

  _getStyles(showSub) {
    const {
      data,
      nodeHeight,
      paddingUnit
    } = this.props;

    return {
      nodeBox: {
        height: `${nodeHeight}px`,
        lineHeight: `${nodeHeight}px`,
        paddingLeft: `${paddingUnit * (data.level + 1)}px`,
        position: 'relative'
      },
      iconBox: {
        position: 'absolute',
        left: `${paddingUnit * (data.level)}px`,
        height: `${nodeHeight}px`,
        padding: `${(nodeHeight - 12) / 2}px 5px 0 5px`,
        cursor: 'pointer',
        lineHeight: 1
      },
      icon: {
        transformOrigin: '50% 50%',
        transform: showSub ? 'scale(.667)' : 'scale(.667) rotateZ(-90deg)',
        display: 'block',
        fontSize: '12px'
      },
      content: {
        height: `${nodeHeight}px`,
        cursor: 'default',
      },
      xLine: {
        position: 'absolute',
        left: `${paddingUnit * (data.level)}px`,
        top: '50%',
        width: `${paddingUnit}px`,
        height: 0,
        borderTopStyle: 'dotted',
        borderTopWidth: '1px',
        display: data.level === 0 ? 'none' : 'block'
      }
    };
  }
}

// 树
class GroupTree extends React.Component {
  static propTypes = {
    containerStyle: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.array.isRequired,
    nodeTemplate: PropTypes.func.isRequired,
    nodeHeight: PropTypes.number,
    paddingUnit: PropTypes.number,
    initSpreadLevel: PropTypes.number,
    activeId: PropTypes.string,
    canActive: PropTypes.bool,
    needSpreadCallback: PropTypes.bool,
    hasSpreadIcon: PropTypes.bool,
    useTreeLine: PropTypes.bool,
    spreadCallback: PropTypes.func,
    root: PropTypes.bool,
    draggable: PropTypes.bool,
    onDragStart: PropTypes.func,
    onDragOver: PropTypes.func,
    onDragEnd: PropTypes.func,
  };

  static defaultProps = {
    data: [],
    nodeHeight: 40,
    paddingUnit: 22,
    initSpreadLevel: 0,
    canActive: true,
    hasSpreadIcon: true,
    useTreeLine: false,
    needSpreadCallback: false,
    spreadCallback: undefined,
    containerStyle: {},
    root: false,
    initSpread: true,            // 默认展开
  };

  render() {
    const {
      data,
      nodeTemplate,
      nodeHeight,
      paddingUnit,
      activeId,
      className,
      canActive,
      hasSpreadIcon,
      useTreeLine,
      spreadCallback,
      containerStyle,
      draggable,
      onDragStart,
      onDragOver,
      onDragEnd,
      needSpreadCallback,
      onClickLeaf,
      root,
    } = this.props;

    return (
      <div className={`dmp-tree-container ${className || ''}`} style={containerStyle}>
        {root && <div className="dmp-tree-node-container">
          <div
            className={`dmp-tree-node-box ${!activeId && 'active'}`}
            style={{ paddingLeft: `${paddingUnit}px`, lineHeight: `${nodeHeight}px` }}
          >
            {nodeTemplate('root')}
          </div>
        </div>}
        {
          data.map((node, index) => (
            <GroupLeafNode data={node}
              active={activeId === node.id}
              canActive={canActive}
              hasSpreadIcon={hasSpreadIcon}
              spreadCallback={spreadCallback}
              useTreeLine={useTreeLine}
              isLastSub={index === data.length - 1}
              initSpread={node.init_spread}
              key={node.id}
              needSpreadCallback={needSpreadCallback}
              draggable={draggable}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              nodeHeight={nodeHeight}
              paddingUnit={paddingUnit}
              sub={Array.isArray(node.sub) ? node.sub : []}
              nodeTemplate={nodeTemplate}
              renderSub={this.renderSub.bind(this)}
              onClickLeaf={onClickLeaf}
            />
          ))
        }
      </div>
    )
  }

  // 渲染子级节点
  renderSub(sub) {
    const {
      nodeTemplate,
      nodeHeight,
      paddingUnit,
      activeId,
      canActive,
      initSpreadLevel,
      hasSpreadIcon,
      useTreeLine,
      draggable,
      onDragStart,
      onDragOver,
      onDragEnd,
      spreadCallback,
      onClickLeaf,
    } = this.props;

    return sub.map((node, index) => (
      <GroupLeafNode data={node}
        active={activeId === node.id}
        canActive={canActive}
        hasSpreadIcon={hasSpreadIcon}
        spreadCallback={spreadCallback}
        useTreeLine={useTreeLine}
        isLastSub={index === sub.length - 1}
        initSpread={!!node.init_spread || (node.level && initSpreadLevel >= node.level)}
        key={node.id}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        nodeHeight={nodeHeight}
        paddingUnit={paddingUnit}
        sub={Array.isArray(node.sub) ? node.sub : []}
        nodeTemplate={nodeTemplate}
        renderSub={this.renderSub.bind(this)}
        onClickLeaf={onClickLeaf}
      />
    ));
  }
}

export default GroupTree;
