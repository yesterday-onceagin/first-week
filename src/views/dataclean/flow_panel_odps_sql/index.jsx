import PropTypes from 'prop-types';
import React from 'react';

import createReactClass from 'create-react-class';

import CodeMirror from '../components/CodeMirror';
import LogPanel from './LogPanel';
import ResultPanel from './ResultPanel';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataCleanFlowActionCreators } from '../../../redux/modules/dataclean/flow';
import { actions as dataCleanActionCreators } from '../../../redux/modules/dataclean/dataclean';

import TipMixin from '../../../helpers/TipMixin';
import XStorage from '../../../helpers/XStorage';
import querySqlTask from '../../../helpers/querySqlTask';


// sql的配置
require('rt-codemirror/mode/sql/sql.js');
// 加载sql提示插件
require('rt-codemirror/addon/hint/sql-hint.js');
// 拖拽相关
let isDragging = false;
let startPosY = 0;
let startLogHeight = 320;
// SQL输入延迟更新
let sqlEditTimer = 0;

// 设置code中需要的model对象
const _getModel = (str) => {
  if (!str) {
    return null;
  }
  const obj = {};
  const words = str.split(' ');

  if (words.length > 0) {
    words.forEach((word) => {
      obj[word] = true;
    });
  }

  return obj;
}

const FlowPanelOdpsSQL = createReactClass({
  mixins: [TipMixin],

  propTypes: {
    show: PropTypes.bool,
    onSqlRunable: PropTypes.func,
    style: PropTypes.object,
    nodeData: PropTypes.object,
    defaultTables: PropTypes.string
  },

  getDefaultProps() {
    return {
      show: false,
      onSqlRunable: () => { },
      style: {},
      nodeData: {},
      defaultTables: ''
    };
  },

  getInitialState() {
    return {
      isEdit: false,
      // 是否运行过
      hasRun: false,
      // 编辑器配置
      codeMirrorOpts: {
        theme: 'monokai',
        lineNumbers: true,
        mode: 'text/x-mssql', // 设置的model的类型  text/x-sql  text/x-mssql  等几种值 对应不同的sql标准
        completeSingle: true,
        styleActiveLine: true,
        lineWrapping: true,
        smartIndent: false,
        entryKeys: {
          // 快捷键
        }
      },
      // 默认的节点内容
      nodeContent: this.props.nodeData.content || { sql: '' },
      // 被选中的代码
      selectedCode: '',
      // SQL编辑器默认关键字、方法、表名HINTS
      keyModel: _getModel(this.DEFAULT_MODELS.keywords),
      funcModel: _getModel(this.DEFAULT_MODELS.functions),
      tableModel: _getModel(this.props.defaultTables),
      // 日志面板
      logHeight: 320,
      logTabs: [],
      activeLogTab: '',
      logCount: 0,
      logData: this._getInitialLogData()
    }
  },

  componentDidMount() {
    // 提取缓存代码数据
    const nodeContent = XStorage.getObjAsOne(`${this.props.nodeData.id}-CONTENT`) || { sql: '' };
    // 缓存中的数据非空，且和当前不一致时，替换
    if (!!nodeContent.sql && this.state.nodeContent.sql !== nodeContent.sql) {
      this.state.nodeContent = nodeContent;
      this.sql_code_mirror.getCodeMirror().setValue(nodeContent.sql);
    }
    // 根据代码内容设置运行按钮状态
    this.props.onSqlRunable(!!(this.state.nodeContent.sql.replace(/(^[\n\s\r]*)|([\n\s\r]*$)/g, '')));
  },

  componentWillReceiveProps(nextProps) {
    // 激活为当前TAB时
    if (!this.props.show && nextProps.show) {
      // 提取缓存代码数据
      const nodeContent = XStorage.getObjAsOne(`${this.props.nodeData.id}-CONTENT`) || { sql: '' };
      // 缓存中的数据非空，且和当前不一致时，替换
      if (!!nodeContent.sql && this.state.nodeContent.sql !== nodeContent.sql) {
        this.state.nodeContent = nodeContent;
        this.sql_code_mirror.getCodeMirror().setValue(nodeContent.sql);
      }
      // 根据代码内容设置运行按钮状态
      this.props.onSqlRunable(!!(this.state.nodeContent.sql.replace(/(^[\n\s\r]*)|([\n\s\r]*$)/g, '')));
    }
  },

  render() {
    const { style, width } = this.props;

    const {
      // 编辑器相关
      codeMirrorOpts,
      nodeContent,
      keyModel,
      tableModel,
      funcModel,
      // 日志面板相关
      logHeight,
      hasRun,
      logTabs,
      activeLogTab,
      logData
    } = this.state;

    return (
      <div className="flow-panel-odps-sql"
        style={Object.assign({}, style, this.STYLE_SHEET.container)}
        onMouseMove={this.handlePanelDragMove}
        onMouseUp={this.handlePanelDragEnd}
        onMouseLeave={this.handlePanelDragEnd}
      >
        <div className="code-edit-panel" style={{
          flex: 1,
          height: `${hasRun ? (style.height - logHeight) : style.height}px`
        }}>
          <CodeMirror
            ref={(instance) => { this.sql_code_mirror = instance }}
            onChange={this.handleCodeChange.bind(this)}
            onSelect={this.handleCodeSelect.bind(this)}
            initFun={this._codeMirrorInit.bind(this)}
            options={codeMirrorOpts}
            value={nodeContent.sql || ''}
            keyModel={keyModel}
            tableModel={tableModel}
            funcModel={funcModel}
          />
        </div>
        {
          hasRun ? (
            <div className="code-log-panel" style={{
              ...this.STYLE_SHEET.logContainer,
              height: `${logHeight}px`
            }}>
              <div className="log-panel-action-bar"
                style={this.STYLE_SHEET.panelActionBar}
                onMouseDown={this.handlePanelDragStart}
              />
              <ul className="log-panel-tabs panel-tabs-nav">
                <li className={`log-panel-tabs-item  ${activeLogTab === '' ? 'active' : ''}`}
                  onClick={this.handleSwitchResultPanel.bind(this, '')}
                >
                  <div className="tab-head" style={{ padding: '0 15px' }}>
                    <span className="tab-title">
                      日志
                    </span>
                  </div>
                </li>
                {
                  logTabs.length > 0 && logTabs.map(item => (
                    <li key={item.id}
                      className={`log-panel-tabs-item  ${item.id === activeLogTab ? 'active' : ''}`}
                      onClick={this.handleSwitchResultPanel.bind(this, item.id)}
                    >
                      <div className="tab-head" style={{ padding: '0 28px 0 12px' }}>
                        <span className="tab-title">
                          {item.name}
                        </span>
                        <i className="dmpicon-close"
                          onClick={this.handleCloseResultPanel.bind(this, item)}
                        />
                      </div>
                    </li>
                  ))
                }
              </ul>
              <div className="result-table-container" style={this.STYLE_SHEET.resultContainer}>
                <LogPanel show={activeLogTab === ''} logData={logData} />
                {
                  logTabs.length > 0 && logTabs.map(item => (
                    <ResultPanel
                      key={item.id}
                      size={{ height: logHeight - 1 - 34, width }}
                      show={activeLogTab === item.id}
                      resultType={item.type}
                      resultData={item.content}
                    />
                  ))
                }
              </div>
            </div>
          ) : null
        }
      </div>
    )
  },

  // -----------log面板的缩放相关-----------
  handlePanelDragStart(e) {
    isDragging = true;
    startPosY = e.pageY;
    startLogHeight = this.state.logHeight;
  },

  handlePanelDragMove(e) {
    e.preventDefault();
    if (!isDragging) {
      return;
    }

    let newHeight = startLogHeight + startPosY - e.pageY;
    const maxHeight = Math.floor(this.props.style.height * 0.8);

    newHeight = newHeight > maxHeight ? maxHeight : newHeight < 200 ? 200 : newHeight;

    this.setState({
      logHeight: newHeight
    });
  },

  handlePanelDragEnd() {
    isDragging = false;
  },

  // code编写
  handleCodeChange(str) {
    const { nodeData, onSqlRunable, canRunSql } = this.props;

    const codeStatus = str && str.replace(/(^[\n\s\r]*)|([\n\s\r]*$)/g, '') !== '';

    this.setState({
      isEdit: codeStatus,
      nodeContent: {
        sql: str || ''
      }
    });

    clearTimeout(sqlEditTimer);

    sqlEditTimer = setTimeout(() => {
      // 设置是否可点击测试运行
      if (codeStatus !== canRunSql) {
        // 仅当状态不同时改变
        onSqlRunable(codeStatus);
      }
      // 写入本地缓存
      XStorage.setObjAsOne(`${nodeData.id}-CONTENT`, { sql: str || '' });
      // 写入redux
      this.props.actions.updateLocalFlowNode({
        ...nodeData,
        content: { sql: str || '' }
      });
    }, 500);
  },

  // 选中的时候的值 当有这个值的时候 执行选择的 当用户取消选中的时候 这个会执行这个 返回 ''
  handleCodeSelect(str) {
    this.state.selectedCode = str || '';
  },

  // 切换结果表tab
  handleSwitchResultPanel(resultId) {
    if (this.state.activeLogTab === resultId) {
      return;
    }
    this.setState({
      activeLogTab: resultId
    });
  },

  // 关闭一个结果表
  handleCloseResultPanel(item, e) {
    e.stopPropagation();
    const logTabs = this.state.logTabs;
    let activeLogTab = this.state.activeLogTab;

    const newLogTabs = logTabs.filter(log => (log.id !== item.id));

    // 关闭的是当前TAB时
    if (item.id === activeLogTab) {
      if (newLogTabs.length > 0) {
        activeLogTab = newLogTabs[newLogTabs.length - 1].id;
      } else {
        activeLogTab = '';
      }
    }

    this.setState({
      activeLogTab,
      logTabs: newLogTabs || []
    });
  },

  // 打开一个新的结果表
  openNewResultPanel(instanceId, content, type) {
    const logTabs = this.state.logTabs;
    let logCount = this.state.logCount;

    logCount += 1;
    const resultId = `${instanceId}-${logCount}`;

    logTabs.push({
      id: resultId,
      name: `结果（${logCount}）`,
      content,
      type
    });

    this.setState({
      activeLogTab: resultId,
      logTabs,
      logCount
    });
  },

  // 执行SQL格式化
  formatSQL() {
    const currCode = this.state.nodeContent.sql || '';
    const nodeData = this.props.nodeData;

    if (!currCode.trim()) {
      this.showErr('没有可格式化的代码');
      return;
    }

    this.props.actions.fetchFormatSQL(currCode, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        const newCode = json.data
        // 写入编辑器
        this.sql_code_mirror.getCodeMirror().setValue(newCode);
        // 写入state
        this.setState({
          isEdit: true,
          nodeContent: {
            sql: newCode
          }
        });
        // 写入本地缓存
        XStorage.setObjAsOne(`${nodeData.id}-CONTENT`, { sql: newCode || '' });
        // 写入redux
        this.props.actions.updateLocalFlowNode({
          ...nodeData,
          content: { sql: newCode || '' }
        });
      }
    });
  },

  // 执行SQL测试
  runSQLExec() {
    // 第一次运行时设置
    if (!this.state.hasRun) {
      this.setState({
        hasRun: true
      });
    }

    const currCode = this.state.selectedCode || this.state.nodeContent.sql || '';

    // 执行的代码为空
    if (!currCode.trim()) {
      this.showErr('没有可执行的代码');
      return;
    }
    // 重置logData
    const logData = this._getInitialLogData();

    // 将代码转换为任务队列
    logData.task = querySqlTask(currCode);

    if (logData.task.length === 0) {
      logData.content.push({ type: 'error', content: '无法解析SQL语句' });
    } else {
      this.startSqlRunTask(logData);
    }
    this.updateLogData(logData);
  },

  // 开始SQL运行任务
  startSqlRunTask(logData) {
    const sqlCode = logData.task.shift();

    if (!sqlCode) {
      // 任务执行结束
      logData.content.push({ content: '运行结束' });
      this.updateLogData(logData);
      // 运行按钮恢复可用
      this.props.onSqlRunable(true);
    } else if (this.state.logTabs.length >= 10) {
      // 结果集超过10个
      logData.task = [];
      logData.content.push({
        type: 'error',
        content: 'FAILED：结果集已超过10个，中止运行'
      });
      this.updateLogData(logData);

      // 运行按钮恢复可用
      this.props.onSqlRunable(true);
      // 将TAB切换到日志
      this.handleSwitchResultPanel('');
    } else {
      // 将执行代码，禁用运行按钮
      this.props.onSqlRunable(false);

      logData.content.push({ content: '正在提交...' });
      this.updateLogData(logData, this.fetchRunSql.bind(this, sqlCode));
    }
  },

  // 提交运行SQL
  fetchRunSql(code) {
    const logData = this.state.logData;

    // 每次执行SQL时将TAB切换到日志
    this.handleSwitchResultPanel('');

    this.props.actions.fetchSQLEXEC(code, (json) => {
      if (!json.result) {
        // 清空任务队列并报告错误
        logData.task = [];
        logData.content.push({ type: 'error', content: `FAILED：${json.msg}` });
        this.updateLogData(logData);
        // 运行按钮恢复可用
        this.props.onSqlRunable(true);
      } else {
        // 将返回的状态推送到日志
        logData.content.push(
          { content: `SQL：${json.data.sql}` },
          { content: `CURRENT INSTANCE STATUS：${json.data.instance_status}` },
          { content: `INSTANCE ID：${json.data.instance_id}` },
          { type: 'link', content: `${json.data.log_view_address}` },
        );
        // 更新日志并同时进行获取结果
        this.updateLogData(logData, this.getSQLLogs.bind(this, json.data.instance_id));
      }
    });
  },

  // 获取日志
  getSQLLogs(instanceId) {
    const logData = this.state.logData;

    this.props.actions.fetchSQLLogs(instanceId, (json) => {
      if (json.result) {
        /*
        * 该接口成功的情况下只会返回两种状态
        * Terminated:   实例运行已结束，打印日志并提取结果
        * Running:      实例正在运行中，该状态下输出tasks日志即可
        */
        if (json.data.instance_status === 'Terminated') {
          // 运行结束的实例
          this._taskTerminated(json, instanceId)
        } else if (json.data.instance_status === 'Running') {
          // 运行中的实例
          this._taskRunning(json, instanceId)
        }
      } else {
        // 接口异常，清空任务队列并报告错误
        logData.task = [];
        logData.content.push({
          type: 'error',
          content: `FAILED：${json.msg}`
        });
        this.updateLogData(logData);
        // 运行按钮恢复可用
        this.props.onSqlRunable(true);
      }
    });
  },

  // 处理已结束状态的任务实例
  _taskTerminated(json, instanceId) {
    const logData = this.state.logData;
    // 日志打印instance状态
    logData.content.push({
      content: `CURRENT INSTANCE STATUS：${json.data.instance_status}`
    });
    // 遍历该instance下的tasks并输出到日志和提取结果
    json.data.tasks.forEach((task) => {
      if (task.status === 'SUCCESS') {
        // 任务成功
        logData.content.push({
          type: 'success',
          content: `CURRENT TASK STATUS：${task.status}`
        });
        // 如果存在summary则直接输出
        if (task.summary) {
          logData.content.push({
            content: `SUMMARY：<pre>${task.summary}</pre>`
          });
        }
        if (task.name !== 'Modify_SQL' && task.result) {
          // 非Modify类型的SQL结果展示 Query_SQL Desc_SQL 
          // 有结果时打开新窗口
          this.openNewResultPanel(instanceId, task.result, task.name);
        }
      } else if (task.status === 'FAILED') {
        // 任务失败
        logData.content.push({
          type: 'error',
          content: `CURRENT TASK FAILED：${task.error}`
        });
      }
    });
    // 更新日志并开始继续下一个任务
    this.updateLogData(logData, this.startSqlRunTask.bind(this, logData));
  },

  // 处理正在运行中的任务
  _taskRunning(json, instanceId) {
    const logData = this.state.logData;
    // 遍历该instance下的tasks并输出到日志(此处不提取结果)
    json.data.tasks.forEach((task) => {
      if (task.status === 'SUCCESS') {
        // 任务成功时跳过该日志，等到实例结束后一并打印
        // logData.content.push({type: 'success', content: `CURRENT TASK STATUS：${task.status}`});
      } else if (task.status === 'RUNNING') {
        // 任务运行中
        logData.content.push({
          type: 'running',
          content: `CURRENT TASK RUNNING PROGRESS：${task.progress}`
        });
      } else {
        // 任务失败
        logData.content.push({
          type: 'error',
          content: `CURRENT TASK FAILED：${task.error}`
        });
      }
    });
    // 更新日志并延迟500ms后继续查询instance状态
    setTimeout(() => {
      this.updateLogData(logData, this.getSQLLogs.bind(this, instanceId));
    }, 500);
  },

  // 更新日志
  updateLogData(logData, callback) {
    if (typeof callback === 'function') {
      this.setState({
        logData: {
          ...logData
        }
      }, () => callback());
    } else {
      this.setState({
        logData: {
          ...logData
        }
      });
    }
  },

  // 日志数据初始化
  _getInitialLogData() {
    return {
      task: [],
      content: []
    };
  },

  // 编辑器初始化
  _codeMirrorInit(codemirror) {
    const mac = codemirror.keyMap.default === codemirror.keyMap.macDefault;
    const cmKey = mac ? 'Cmd' : 'Ctrl';

    // 快捷按键
    const extraKeys = {}

    // 运行全部
    extraKeys[`${cmKey}-R`] = () => {
      this.runSQLExec();
    }

    // 运行已选部分
    extraKeys[`Shift-${cmKey}-R`] = () => {
      this.runSQLExec();
    }

    // 保存组合键（屏蔽系统功能）
    extraKeys[`${cmKey}-S`] = () => {
      // 保存整个流程
      this.props.onSaveFlow();
    }

    // 格式化组合键
    extraKeys[`Shift-${cmKey}-H`] = () => {
      this.formatSQL();
    }

    this.state.codeMirrorOpts.extraKeys = extraKeys;
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

  STYLE_SHEET: {
    // 主容器
    container: {
      flexDirection: 'column'
    },
    // 日志容器
    logContainer: {
      borderTopWidth: '1px',
      borderTopStyle: 'solid',
      position: 'relative'
    },
    panelActionBar: {
      width: '100%',
      position: 'absolute',
      left: 0,
      top: 0,
      height: '4px',
      cursor: 'n-resize',
      zIndex: 50
    },
    resultContainer: {
      position: 'absolute',
      left: 0,
      top: '34px',
      bottom: 0,
      right: 0
    }
  },

  DEFAULT_MODELS: {
    functions: 'abs round sign sort log avg count min max sum concat trim insert now year week if database encode data_add data_format dayofweek'
  },
})

const stateToProps = state => ({
  ...state.dataclean_flow
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataCleanFlowActionCreators, dataCleanActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps, null, { withRef: true })(FlowPanelOdpsSQL);
