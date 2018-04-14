import React from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button';
import CodeMirror from '@views/dataclean/components/CodeMirror';
import querySqlTask from '@helpers/querySqlTask';
import GroupTree from '@components/GroupTree';
import ErrorAlert from '@components/ErrorAlert';
import DatasetComboItem from '../../components/DatasetComboItem';
import DatasetResultTable from '../../components/DatasetResultTable';
import DatasetFieldEditor from '../../components/DatasetFieldEditor';
import { TYPE_NAMES } from '../../constants';
import _ from 'lodash';

//sql 的配置
require('rt-codemirror/mode/sql/sql.js');
//加载sql提示插件
require('rt-codemirror/addon/hint/sql-hint.js');

// 设置code中需要的model对象
function _setModel(str) {
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

class SecondProcess extends React.Component {
  static propTypes = {
    onNext: PropTypes.func,
    onPrev: PropTypes.func,
    onClearDataset: PropTypes.func,
    onFetchRunSQLDataset: PropTypes.func,
    onUpdateDatasetField: PropTypes.func,
    onUpdateTableList: PropTypes.func,
    initState: PropTypes.object
  }

  state = {
    isEdit: false,
    treeUuid: new Date().getTime(),
    mirrorUuid: new Date().getTime(),
    errorAlertShow: true,              // 错误提示
    menuShowId: '',
    replace_sql: '',
    treeSpread: false,                // 树形是否展开
    navActive: 0,
    sql: '',                          // SQL 语句内容
    defaultSql: '',                   // 原SQL语句
    selectedCode: '',                 // 选中的SQL语句
    codeMirrorOpts: {
      theme: 'monokai',
      lineNumbers: true,
      mode: 'text/x-mssql',
      completeSingle: true,
      styleActiveLine: true,
      lineWrapping: true,
      smartIndent: false,
      entryKeys: {}
    },
    previewLength: 100,
    keyModel: {},
    funcModel: _setModel('abs round sign sort log avg count min max sum concat trim insert now year week if database encode data_add data_format dayofweek'),
    tableModel: {},
  }

  constructor(props) {
    super(props);
    if (props.initState) {
      this.state = {
        ...this.state,
        ...props.initState
      }
    }
    if (props.tableList) {
      this.state.tableModel = _setModel(props.tableList.map(item => item.name).join(' '))
    }
  }

  componentDidMount() {
    const { sql, isEdit } = this.state

    if (!!sql && isEdit) {
      this._runSQLExec()
    }
  }

  componentWillReceiveProps(nextProps) {
    const initState = this.props.initState

    if (nextProps.tableList) {
      this.setState({
        tableModel: _setModel(nextProps.tableList.map(item => item.name).join(' ')),
      })
    }

    if (!_.isEqual(nextProps.initState, initState)) {
      this.setState({
        ...this.state,
        ...nextProps.initState
      })
    }
  }

  render() {
    const { datasetData, datasetTable, onUpdateDatasetField, datasetTableTotal, pending } = this.props
    const { navActive, errorAlertShow } = this.state

    return <div className="combo-main fixed">
      <div className="main-wrap">
        <div className="left" ref={(instance) => { this.dataset_explorer = instance }}>
          {this.renderTables()}
          {this.renderSqlIde()}
        </div>
        <div className="right">
          <div className="bottom-wrap">
            <div className="navlist">
              <div className={navActive === 0 ? 'item active' : 'item'} onClick={this.handleSelect.bind(this, 0)}>数据预览</div>
              <div className={navActive === 1 ? 'item active' : 'item'} onClick={this.handleSelect.bind(this, 1)}>字段设置</div>
              {datasetTableTotal > 0 && <div className="tip">显示前100条，一共 <span style={{ color: '#24bbf9' }}>{`${datasetTableTotal}`}</span> 条数据</div>}
            </div>
            <div className="dataview-wrap">
              {
                navActive === 0 && <DatasetResultTable
                  data={datasetTable.data}
                  head={datasetTable.head}
                  pending={pending}
                  editable={false}
                />
              }
              {
                navActive === 1 && <DatasetFieldEditor
                  data={datasetData.field}
                  pending={pending}
                  onUpdate={onUpdateDatasetField}
                />
              }
            </div>
          </div>
          <ErrorAlert ref={(instance) => { this.errorAlert = instance }} show={errorAlertShow} />
        </div>
      </div>
      <div className="footer">
        <Button onClick={this.handlePrev.bind(this)}>上一步</Button>
        <Button bsStyle="primary" onClick={this.handleNext.bind(this)}>下一步</Button>
      </div>
    </div>
  }

  // 渲染TABLE列表
  renderTables() {
    const { treeUuid, menuShowId, treeSpread } = this.state
    const { tableList } = this.props
    const _tableList = []

    // level 滞为 0
    tableList.forEach((item) => {
      _tableList.push({
        ...item,
        hidden: false,  // 去除这个属性
        level: 0
      })
    })

    // 节点模版
    const nodeTemplate = (node, spread) => (
      <DatasetComboItem
        data={node}
        spread={spread}
        container={this.dataset_explorer}
        onSetMenuShow={this.handleSetMenuShowNodeId.bind(this)}
        onInsertTable={this.handleInsertTable.bind(this)}
        onInsertField={this.handleInsertField.bind(this)}
      />
    );

    return (
      <div className="table-container" style={{ width: '100%', height: '50%' }}>
        <div className="table-title" style={this.STYLE_SHEET.tableGroupTitle}>
          <span>表</span>
        </div>
        <div className="table-content">
          <GroupTree
            key={`file-tree-${treeUuid}`}
            activeId={menuShowId}
            canActive={false}
            data={_tableList}
            spread={treeSpread}
            needSpreadCallback={true}
            spreadCallback={this._setDatasetSpreads.bind(this)}
            nodeTemplate={nodeTemplate}
            hasSpreadIcon={false}
            useTreeLine={true}
            paddingUnit={16}
            nodeHeight={30}
          />
        </div>
      </div>
    );
  }

  // 渲染SQL编辑器
  renderSqlIde() {
    const {
      keyModel,
      tableModel,
      funcModel,
      codeMirrorOpts,
      sql,
      mirrorUuid
    } = this.state;

    return (
      <div className="sql-ide-container" style={{ width: '100%', height: '50%' }}>
        <div className="sql-ide-title" style={this.STYLE_SHEET.groupTitle}>
          <span style={{ float: 'left' }}>
            SQL语句
          </span>
          <span className={`sql-ide-run-btn  ${sql ? '' : 'disabled'}`}
            style={this.STYLE_SHEET.sqlRunBtn}
            onClick={sql ? this._runSQLExec.bind(this) : null}
          >
            <i className="dmpicon-run" style={this.STYLE_SHEET.sqlRunBtnIcon} />
            运行
          </span>
        </div>
        <div className="sql-ide-content">
          <CodeMirror
            key={mirrorUuid}
            getCodeMirror={(codemirror) => { this.CodeMirror = codemirror }}
            onChange={this.handleCodeChange.bind(this)}
            onFocusChange={this.handleMirrorFocus.bind(this)}
            onSelect={this.handleCodeSelect.bind(this)}
            initFun={this._codeMirrorInit.bind(this)}
            options={codeMirrorOpts}
            value={sql || ''}
            keyModel={keyModel}
            tableModel={tableModel}
            funcModel={funcModel}
          />
        </div>
      </div>
    );
  }

  // mirror focus
  handleMirrorFocus() {
    // 获取位置
    const pos = this.CodeMirror.getCursor()
    //保存光标位置
    this.mirrorPos = pos
  }

  // 插入表, 获取
  handleInsertTable(node, e) {
    const tableName = node.name

    const currValue = this.CodeMirror.getValue()
    const isLastEmpty = currValue.length > 0 ? currValue[currValue.length - 1] == ' ' : false
    const replaceValue = isLastEmpty ? `{${tableName}}` : ` {${tableName}}`
    // 聚焦
    this.CodeMirror.focus()
    this.CodeMirror.replaceRange(replaceValue, this.mirrorPos, this.mirrorPos)
    // 同步到state
    this.state.sql = this.CodeMirror.getValue()

    // 存在数据则停止冒泡
    if (!(!node.field && node.sub.length === 0)) {
      e.stopPropagation();
    }
  }

  // 插入字段
  handleInsertField(node, e) {
    // 如果没有则先请求
    if (!node.field && node.sub.length === 0) {
      this.props.onFetchDatasetField({
        node,
        dataset_id: node.id,
        is_not_category: true
      }, (json) => {
        if (json.result) {
          this.props.onUpdateTableList(node, json.data)
          this._mergeFieldsSql(json.data)
          this.setState({
            treeSpread: false
          })
        }
      })
    } else {
      // 存在数据则停止冒泡
      e.stopPropagation();

      const data = !node.field ? node.sub : [node]
      this._mergeFieldsSql(data)
    }
  }

  // 设置显示菜单的节点
  handleSetMenuShowNodeId(nodeId) {
    this.setState({ menuShowId: nodeId });
  }

  handlePrev() {
    this.props.onPrev({
      secondProcess: this.state
    })
  }

  handleNext(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    const { datasetTable, onNext, onShowErr } = this.props
    const sql = this.state.sql
    if (datasetTable && datasetTable.data && datasetTable.data.length > 0) {
      onNext({
        secondProcess: this.state
      })
    } else if (!sql) {
      onShowErr('请先运行sql语句!')
    } else {
      onShowErr('没有数据!')
    }
  }

  // code编写
  handleCodeChange(str) {
    this.setState({
      sql: str || ''
    });
  }

  // 选中的时候的值 当有这个值的时候 执行选择的 当用户取消选中的时候 这个会执行这个 返回 ''
  handleCodeSelect(str) {
    this.state.selectedCode = str || '';
  }

  handleSelect = (active) => {
    this.setState({
      navActive: active
    })
  }

  // 传入
  _mergeFieldsSql(fields) {
    const fieldsArr = fields.filter(item => item.visible === 1).map(item => `[${item.alias_name || item.col_name}]`)
    const fieldsStr = fieldsArr.join(',')
    const currValue = this.CodeMirror.getValue()
    const isLastEmpty = currValue.length > 0 ? currValue[currValue.length - 1] == ' ' : false
    const replaceValue = isLastEmpty ? `${fieldsStr}` : ` ${fieldsStr}`
    // 聚焦
    this.CodeMirror.focus()
    this.CodeMirror.replaceRange(replaceValue, this.mirrorPos, this.mirrorPos)
    // 同步到state
    this.state.sql = this.CodeMirror.getValue()
  }

  // 执行SQL数据集
  _runSQLExec() {
    const { onShowErr, onFetchRunSQLDataset } = this.props
    const currCode = this.state.sql || '';
    // 不支持多条SQL语句
    if (querySqlTask(currCode).length > 1) {
      onShowErr('仅可执行一条SQL语句');
      return;
    }
    // 执行的代码为空
    if (!currCode.trim()) {
      onShowErr('没有可执行的代码');
      return;
    }

    onFetchRunSQLDataset({
      type: TYPE_NAMES.combo,
      content: JSON.stringify({
        sql: currCode.replace(/;/g, '')
      })
    }, (json) => {
      if (!json.result) {
        this.setState({
          errorAlertShow: true,
          replace_sql: ''
        }, () => {
          this.errorAlert.appendError(json.msg)
        })
      } else {
        this.setState({
          // 执行成功时记录下sql
          defaultSql: this.state.sql,
          replace_sql: json.data.replace_sql || ''
        });

        if (Array.isArray(json.data.data) && json.data.data.length >= this.state.previewLength) {
          this._getTableTotal();
        }
      }
    })
  }

  // 编辑器初始化
  _codeMirrorInit(codemirror) {
    const mac = codemirror.keyMap.default === codemirror.keyMap.macDefault;
    const cmKey = (mac ? 'Cmd' : 'Ctrl');
    // 快捷按键
    const extraKeys = {}
    // 运行全部
    extraKeys[`${cmKey}-R`] = () => {
      this._runSQLExec();
    }
    this.state.codeMirrorOpts.extraKeys = extraKeys;
  }

  // 更新数据集展开状态缓存
  _setDatasetSpreads(node) {
    const { onUpdateDatasetSpreads, onFetchDatasetField } = this.props
    // 加载当前表的字段
    onUpdateDatasetSpreads({ [node.id]: true })
      .then(() => {
        // 如果是展开的，并且没有当前数据集没有加载过字段
        const isDataset = node.tyep !== TYPE_NAMES.folder && !node.field
        if (isDataset && node.sub.length === 0) {
          onFetchDatasetField({
            node,
            dataset_id: node.id,
            is_not_category: true
          }, (json) => {
            if (json.result) {
              this.props.onUpdateTableList(node, json.data)
              this.setState({
                treeSpread: true
              })
            }
          })
        }
      });
  }

  // 获取数据总数
  _getTableTotal() {
    const { onFetchDatasetResultTotal } = this.props

    if (!this.state.sql) {
      return;
    }

    onFetchDatasetResultTotal({
      type: TYPE_NAMES.combo,
      content: JSON.stringify({
        sql: this.state.sql.replace(/;/g, '')
      })
    });
  }

  STYLE_SHEET = {
    textLimit: {
      paddingRight: '14px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
      height: '100%'
    },
    tableGroupTitle: {
      padding: '0px 0 2px',
      height: '33px',
      fontSize: '14px',
      lineHeight: '28px'
    },
    groupTitle: {
      padding: '16px 0 8px',
      height: '38px',
      fontSize: '14px',
      lineHeight: 1
    },
    sqlRunBtn: {
      float: 'right',
      fontSize: '12px',
      padding: '1px 0',
      transition: 'color .3s'
    },
    sqlRunBtnIcon: {
      paddingRight: '5px',
      fontWeight: 'normal',
      float: 'left'
    },
    emptyBox: {
      width: '100%',
      lineHeight: '118px',
      textAlign: 'center'
    }
  }
}

export default SecondProcess
