import React from 'react';

import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';

import FlowPanelMain from './flow_panel_main';
import FlowPanelCollector from './flow_panel_collector';
import FlowPanelOdpsSQL from './flow_panel_odps_sql';
import FlowPanelMapping from './flow_panel_mapping';
import FlowPanelRds from './flow_panel_rds';
import FlowConfig from './components/FlowConfig';
import NodeConfig from './components/NodeConfig';
import SysFuncsMenu from './components/SysFuncsMenu';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataCleanFlowActionCreators } from '../../redux/modules/dataclean/flow';
import { actions as dataCleanActionCreators } from '../../redux/modules/dataclean/dataclean';

import TipMixin from '../../helpers/TipMixin';
import { ODPS_SOURCE } from './constants';

import './flow.less';

const DataCleanFlow = createReactClass({
  displayName: 'DataCleanFlow',
  mixins: [TipMixin],

  getInitialState() {
    return {
      //主流程
      width: 500,
      height: 700,
      isRun: false,           // 是否在测试流程运行
      canRunSql: false,       // 是否可执行SQL测试运行
      rightMenu: {
        show: false,
        currTab: ''
      },
      activeNode: {           // 当前正在查看的节点(默认为主面板)
        id: '',
        type: 'MAIN',
        name: ''
      },
      openedNodes: [],        // 已打开的节点id
      defaultODPSTables: '',  // 默认ODPS数据表(用于节点)
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar([{
      name: '数据清洗管理',
      url: '/dataclean/list'
    }, {
      name: '编辑清洗流程'
    }]);
    // 获取ODPS默认数据表
    this.getTables();
  },

  componentDidMount() {
    // 获取清洗流程数据
    this.getFlowData();
    // 获取系统函数列表
    if (this.props.sysFunctions.data.length === 0) {
      this.props.actions.fetchSysFunctions();
    }

    this.fitFlowPanelSize(this.props.spread);
    window.onresize = () => this.fitFlowPanelSize(this.props.spread);
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.spread !== nextProps.spread) {
      this.fitFlowPanelSize(nextProps.spread);
    }
  },

  componentWillUnmount() {
    this.props.actions.resetLocalFlowData();
    window.onresize = '';
  },

  render() {
    const { pending, flowData } = this.props;
    const { activeNode, openedNodes, isRun } = this.state;

    // 流程主面板的样式
    const mainPanelStyles = {
      height: this.state.height - 74,
      width: '100%',
      paddingRight: '40px',
      // 说明：为了避免连线、节点显示异常，此处用visibility来控制显示(使面板始终保持在页面中)
      visibility: activeNode.type === 'MAIN' ? 'visible' : 'hidden',
      pointerEvents: activeNode.type === 'MAIN' ? 'auto' : 'none',
      zIndex: activeNode.type === 'MAIN' ? 'auto' : '-111'
    };

    let editNodes = [];

    if (Array.isArray(flowData.nodes) && flowData.nodes.length > 0) {
      editNodes = flowData.nodes.filter(node => openedNodes.indexOf(node.id) !== -1);
    }

    return (
      <div className="modules-page-container">
        <div className="data-view" id="dataclean-flow-edit-page" style={{ overflow: 'hidden' }}>
          <div id="page_builder"
            style={{ height: `${this.state.height}px`, overflow: 'hidden', position: 'absolute', left: '0px', bottom: '0px', right: '0px', top: '0px' }}>

            {this.renderNavActionBar()}

            {this.renderNavTabBar()}

            {this.renderRightMenus()}

            {
              editNodes.map(node => this.renderNodePanel(node, node.id === activeNode.id))
            }

            <FlowPanelMain style={mainPanelStyles}
              onOpenNode={this.handleOpenNode}
              onCloseNode={this.handleCloseTab}
            />

            <Loading show={pending || isRun} containerId='page_builder' />
          </div>
        </div>
      </div>
    );
  },

  // 打开节点编辑 
  handleOpenNode(node) {
    const { openedNodes } = this.state;
    // 未打开的面板才新增tab
    if (openedNodes.indexOf(node.id) === -1) {
      openedNodes.push(node.id);
    }

    this.setState({
      openedNodes,
      activeNode: node
    });
  },

  // 切换激活的TAB
  handleActiveCurrTab(node) {
    if (this.state.activeNode.id === node.id) {
      return;
    }
    this.setState({
      activeNode: node,
      // tab操作同时关闭右侧菜单
      rightMenu: {
        ...this.state.rightMenu,
        show: false
      }
    });
  },

  // 返回主面板
  handleReturnToMainTab() {
    this.setState({
      activeNode: {
        id: '',
        type: 'MAIN',
        name: this.props.flowData.name
      },
      // tab操作同时关闭右侧菜单
      rightMenu: {
        ...this.state.rightMenu,
        show: false
      }
    });
  },

  // 切换SQL运行的按钮状态(可用/禁用)
  handleSqlRunable(canRun) {
    this.setState({
      canRunSql: canRun
    });
  },

  // 关闭一个tab
  handleCloseTab(node, e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    // 关闭可能存在的Tips
    this.hideTip()
    let newActiveNode = this.state.activeNode;
    const newOpenedNodes = this.state.openedNodes;

    // 如果关闭的是正在浏览的节点，则转到主面板
    if (node.id === newActiveNode.id) {
      newActiveNode = {
        id: '',
        type: 'MAIN',
        name: ''
      };
    }

    // 清除缓存(该操作主要针对SQL节点的内容)
    localStorage.removeItem(`${node.id}-CONTENT`)

    // 从当前打开的tab列中删除
    const indexToDelete = newOpenedNodes.indexOf(node.id);

    if (indexToDelete !== -1) {
      newOpenedNodes.splice(indexToDelete, 1);
    }

    this.setState({
      activeNode: newActiveNode,
      openedNodes: newOpenedNodes,
      // tab操作同时关闭右侧菜单
      rightMenu: {
        ...this.state.rightMenu,
        show: false
      }
    });
  },

  // 右侧菜单展开/收起
  handleRightMenuToggle(tab, e) {
    e.stopPropagation();
    const { show, currTab } = this.state.rightMenu;
    if (!tab) {
      tab = currTab;
    }
    this.setState({
      rightMenu: {
        show: tab === currTab && show ? !show : true,
        currTab: tab
      }
    });
  },

  // 右侧菜单收起
  handleRightMenuHide() {
    this.setState({
      rightMenu: {
        ...this.state.rightMenu,
        show: false
      }
    });
  },

  // 渲染节点面板
  renderNodePanel(activeNode, show) {
    // 面板的样式
    const panStyle = {
      height: `${this.state.height - 74}px`,
      width: '100%',
      paddingRight: '40px',
      display: show ? (activeNode.type === 'ODPS_SQL' ? 'flex' : 'block') : 'none'
    };

    const { canRunSql } = this.state;

    switch (activeNode.type) {
      case '采集':
        return (
          <FlowPanelCollector key={activeNode.id}
            show={show}
            style={panStyle}
            onUpdateFlowNode={this.props.actions.updateLocalFlowNode}
            nodeData={activeNode}
            onCloseTab={this.handleCloseTab.bind(this)}
            onReturnToMain={this.handleReturnToMainTab.bind(this)} />
        );
      case 'ODPS_SQL':
        return (
          <FlowPanelOdpsSQL key={activeNode.id}
            ref={(instance) => { this[activeNode.id] = instance }}
            onSqlRunable={this.handleSqlRunable}
            onSaveFlow={this.saveFlowData}
            canRunSql={canRunSql}
            defaultTables={this.state.defaultODPSTables}
            show={show}
            style={panStyle}
            width={this.state.width}
            nodeData={activeNode} />
        );
      case '映射':
        return (
          <FlowPanelMapping
            key={activeNode.id}
            show={show}
            style={panStyle}
            nodeData={activeNode}
            events={{
              onReturnToMain: this.handleReturnToMainTab,
              onCloseTab: this.handleCloseTab
            }} />
        );
      case '同步':
        return (
          <FlowPanelRds
            key={activeNode.id}
            show={show}
            style={panStyle}
            nodeData={activeNode}
            events={{
              onReturnToMain: this.handleReturnToMainTab,
              onCloseTab: this.handleCloseTab
            }} />
        );
      case 'MAIN':
        return null;
      default:
        return <div>暂不支持{activeNode.type}类型的节点</div>
    }
  },

  // 渲染右侧菜单栏
  renderRightMenus() {
    const { show, currTab } = this.state.rightMenu;
    const { activeNode } = this.state;

    return (
      <div className="right-menu" style={{ height: `${(this.state.height - 74)}px`, top: '74px', zIndex: 101 }}>
        <ul className="right-menu-bar">
          {
            activeNode.type === 'MAIN' ? (
              <li className={show && currTab === 'flow-config' ? 'active' : ''}
                onClick={this.handleRightMenuToggle.bind(this, 'flow-config')}>
                流程配置
              </li>
            ) : null
          }
          {
            activeNode.type !== 'MAIN' ? (
              <li className={show && currTab === 'node-config' ? 'active' : ''}
                onClick={this.handleRightMenuToggle.bind(this, 'node-config')}>
                节点配置
              </li>
            ) : null
          }
          {
            activeNode.type === 'ODPS_SQL' ? (
              <li className={show && currTab === 'sys-funcs' ? 'active' : ''}
                onClick={this.handleRightMenuToggle.bind(this, 'sys-funcs')}>
                系统函数
              </li>
            ) : null
          }
        </ul>
        {this.renderRightMenuContent()}
      </div>
    );
  },

  // 渲染右侧菜单弹出内容部分
  renderRightMenuContent() {
    const { show, currTab } = this.state.rightMenu;
    const { activeNode } = this.state;

    return (
      <div className="right-menu-content">
        {
          // 点击其他地方关闭菜单的蒙层
          show ? (
            <div>
              <div onClick={this.handleRightMenuHide.bind(this)}
                style={{ position: 'absolute', zIndex: 1025, right: '350px', top: '0px', left: '-10000px', height: '100%' }}>
              </div>
            </div>
          ) : null
        }
        <div className={`tab-panel ${show ? 'active' : ''}`}>
          <FlowConfig show={currTab === 'flow-config'}
            flow={this.props.flowData}
            onUpdateFlow={this.props.actions.updateLocalFlowData}
            getFlowList={this.props.actions.getFlowList} />

          <NodeConfig show={currTab === 'node-config'}
            key={activeNode.id}
            node={activeNode}
            actions={this.props.actions} />

          <SysFuncsMenu show={currTab === 'sys-funcs'}
            pending={this.props.sysFunctions.pending}
            funcs={this.props.sysFunctions.data} />
        </div>
      </div>
    );
  },

  // 渲染导航tab栏
  renderNavTabBar() {
    const { flowData } = this.props;

    let flowNodes = [];

    const { activeNode, openedNodes } = this.state;

    // 过滤出已打开的节点
    if (flowData.nodes && Array.isArray(flowData.nodes) && flowData.nodes.length > 0) {
      // 打开的节点永远在已有节点范围内，无需先过滤
      flowNodes = openedNodes.map(id => flowData.nodes.filter(node => node.id === id)[0]);
    }

    // 主面板永远插入在第一个
    flowNodes.unshift({
      // 将主面板ID设置为空字符串以便于匹配active
      id: '',
      type: 'MAIN',
      name: flowData.name
    });

    return (
      <ul className="panel-tabs-nav">
        {
          flowNodes.map((node) => {
            const active = node.id === activeNode.id;
            let iconClass = '';

            switch (node.type) {
              case '采集':
                iconClass = 'head-icon dmpicon-tree-node';
                break;
              case 'ODPS_SQL':
                iconClass = 'head-icon dmpicon-odps-node';
                break;
              case '映射':
                iconClass = 'head-icon dmpicon-mapping';
                break;
              case '同步':
                iconClass = 'head-icon dmpicon-rds-node';
                break;
              default:
                break;
            }

            return (
              <li key={`dataclean-node-tab-${node.id}`}
                className={active ? 'active' : ''}
                onClick={this.handleActiveCurrTab.bind(this, node)}
              >
                <div className="tab-head">
                  <i className={iconClass} />
                  <span className="tab-title">
                    {node.name}
                  </span>
                  {
                    // 主面板不显示关闭按钮
                    node.type === 'MAIN' ? null : (
                      <i className="dmpicon-close" onClick={this.handleCloseTab.bind(this, node)} />
                    )
                  }
                </div>
              </li>
            );
          })
        }
      </ul>
    );
  },

  // 渲染主操作菜单
  renderNavActionBar() {
    const { isRun, activeNode, canRunSql } = this.state
    const { isEdit } = this.props

    return (
      <ul className="panel-menu">
        {
          // 非主面板中显示返回按钮
          activeNode.type !== 'MAIN' && (
            <li className="active" onClick={this.handleReturnToMainTab}>
              <i className="dmpicon-return" style={{ fontWeight: 'bold' }} />
              返回
            </li>
          )
        }
        <li className={isEdit ? 'active' : ''} onClick={this.saveFlowData}>
          <i className="dmpicon-save" />
          保存
        </li>
        {
          // 主面板中显示测试整个流程的按钮
          activeNode.type === 'MAIN' && (
            <li className={isRun ? '' : 'active'} onClick={this.testRunFlow}>
              <i className="dmpicon-run" />
              测试运行
            </li>
          )
        }
        {
          // 仅SQL节点显示格式化当前面板中的SQL语句按钮
          activeNode.type === 'ODPS_SQL' && (
            <li className="active" onClick={this._formatSQL}>
              <i className="dmpicon-format" />
              格式化
            </li>
          )
        }
        {
          // 仅SQL节点显示测试当前面板中的SQL语句按钮
          activeNode.type === 'ODPS_SQL' && (
            <li className={canRunSql ? 'active' : ''} onClick={this._testRunCurrentSQL}>
              <i className="dmpicon-run" />
              SQL运行
            </li>
          )
        }
      </ul>
    );
  },

  // 格式化当前面板的SQL语句
  _formatSQL() {
    const { activeNode, rightMenu } = this.state;

    if (rightMenu.show) {
      this.handleRightMenuHide();
    }

    // 执行当前激活的SQL面板中的SQL语句
    if (activeNode.type === 'ODPS_SQL' && this[activeNode.id]) {
      this[activeNode.id].wrappedInstance.formatSQL()
    }
  },

  // 执行当前激活的面板中的SQL语句
  _testRunCurrentSQL() {
    const { activeNode, canRunSql } = this.state;

    if (!canRunSql) {
      return;
    }

    if (this.state.rightMenu.show) {
      this.handleRightMenuHide();
    }

    // 执行当前激活的SQL面板中的SQL语句
    if (activeNode.type === 'ODPS_SQL' && this[activeNode.id]) {
      this[activeNode.id].wrappedInstance.runSQLExec()
    }
  },

  // 测试运行清洗流程
  testRunFlow() {
    if (this.state.rightMenu.show) {
      this.handleRightMenuHide();
    }
    this.setState({ isRun: true });
    this.props.actions.fetchRunFlow(this.props.flowData.id, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSuccess(json.msg);
      }
      this.setState({ isRun: false });
    });
  },

  // 获取流程主数据
  getFlowData() {
    this.props.actions.fetchFlowData(this.props.params.id, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      }
    });
  },

  // 保存当前清洗流程
  saveFlowData() {
    if (!this.props.isEdit) {
      return;
    }
    if (this.state.rightMenu.show) {
      this.handleRightMenuHide();
    }
    const { flowData } = this.props;

    if (!flowData.name) {
      this.showErr('未填写清洗名称');
      return;
    }

    if (flowData.nodes.some(node => !node.name)) {
      this.showErr('存在名称为空的节点');
      return;
    }

    this.props.actions.updateFlowData(flowData, (json) => {
      if (json.result) {
        // 保存成功后清除全部节点内容缓存
        flowData.nodes.forEach((node) => {
          localStorage.removeItem(`${node.id}-CONTENT`)
        })
        this.showSuccess(json.msg);
      } else {
        this.showErr(json.msg);
      }
    });
  },

  // 获取数据表
  getTables() {
    this.props.actions.fetchTables(ODPS_SOURCE.id, {
      page_size: 100000,
      page: 1
    }, (json) => {
      if (json.result) {
        const tablesStr = json.data.items.map(item => item.name).join(' ');
        // 添加到默认数据表
        this.setState({
          defaultODPSTables: tablesStr
        });
      }
    });
  },

  // 高度计算
  fitFlowPanelSize(sideMenuSpread) {
    const wpEl = document.getElementById('dataclean-flow-edit-page');

    this.setState({
      height: wpEl.clientHeight,
      width: window.innerWidth - 40 - 40 - (sideMenuSpread ? 200 : 50)
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

export default connect(stateToProps, dispatchToProps)(DataCleanFlow);
