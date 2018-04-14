import React from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import Input from 'react-bootstrap-myui/lib/Input';
import Loading from 'react-bootstrap-myui/lib/Loading';
import FlexDataTable from '@components/FlexDataTable';
import CodeMirror from '@views/dataclean/components/CodeMirror';
import querySqlTask from '@helpers/querySqlTask';
import DatasetResultTable from '../../components/DatasetResultTable';
import DatasetFieldEditor from '../../components/DatasetFieldEditor';
import { TYPE_NAMES } from '../../constants';
import _ from 'lodash';
//sql 的配置
require('rt-codemirror/mode/sql/sql.js');
//加载sql提示插件
require('rt-codemirror/addon/hint/sql-hint.js');

// 设置code中需要的model对象
const _setModel = (str) => {
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

let tableSearchTimer = null;

const _getMessageByType = function (dataSourceType = '', dataBaseType = '') {
  dataSourceType = dataSourceType.toLowerCase()
  dataBaseType = dataBaseType.toLowerCase()
  let code = 'mysql'
  switch (dataSourceType) {
    case 'mysofterp':
      code = 'sql server'
      break
    case 'mysql':
      code = 'mysql'
      break
    case 'datahub':
      if (dataBaseType === 'oracle') {
        code = 'oracle'
      }
      break
    default:
      break
  }
  return `（请使用 ${code} 语句）`
}

const _getCodeMirrorMode = function(dataSourceType = '', dataBaseType = '') {
  dataSourceType = dataSourceType.toLowerCase()
  dataBaseType = dataBaseType.toLowerCase()
  let mode = 'text/x-mssql'
  if (dataSourceType === 'datahub' && dataBaseType === 'oracle') {
    mode = 'text/x-plsql'
  }
  return mode
}

class SecondProcess extends React.Component {
  static propTypes = {
    onNext: PropTypes.func,
    onPrev: PropTypes.func,
    onClearDataset: PropTypes.func,
    onFetchRunSQLDataset: PropTypes.func,
    onUpdateDatasetField: PropTypes.func,
    onFetchDatasetResultTotal: PropTypes.func,
    onFetchTables: PropTypes.func,
    onShowErr: PropTypes.func,
    onShowSucc: PropTypes.func,
    initState: PropTypes.object,
    dataSourceId: PropTypes.string,
    dataSourceType: PropTypes.string,
    show: PropTypes.bool,
    dataSourceTables: PropTypes.array,
    dataSourecePending: PropTypes.bool,
    dataSourceTablesPage: PropTypes.number,
    dataSourceTablesTotal: PropTypes.number,
    pending: PropTypes.bool,
    datasetData: PropTypes.object,
    datasetTable: PropTypes.object,
    datasetTableTotal: PropTypes.number
  }

  state = {
    navActive: 0,
    codeUuid: new Date().getTime(),
    tableKeyword: '',
    sql: '',                          // SQL 语句内容
    defaultSql: '',                   // 原SQL语句
    selectedCode: '',                 // 选中的SQL语句
    codeMirrorOpts: {
      theme: 'monokai',
      lineNumbers: true,
      mode: 'text/x-mssql',           // text/x-plsql: Oracle sql, 
      completeSingle: true,
      styleActiveLine: true,
      lineWrapping: true,
      smartIndent: false,
      entryKeys: {}
    },
    dataSourceTablesTotal: this.props.dataSourceTablesTotal,
    previewLength: 100,
    keyModel: {},
    funcModel: _setModel('abs round sign sort log avg count min max sum concat trim insert now year week if database encode data_add data_format dayofweek'),
    tableModel: {},
  }

  constructor(props) {
    super(props)
    this._sqlHasRunResult = ''
  }

  componentWillReceiveProps(nextProps) {
    const { dataSourceTables, initState, show } = this.props

    if (!_.isEqual(nextProps.initState, initState)) {
      this.setState({
        ...this.state,
        ...nextProps.initState,
        codeUuid: new Date().getTime()
      })
    }

    if (!_.isEqual(nextProps.dataSourceTables, dataSourceTables)) {
      this.setState({
        funcModel: _setModel((nextProps.dataSourceTables || []).map(item => item.name).join(' '))
      })
    }

    // 当显示的时候
    if (!_.isEqual(show, nextProps.show) && nextProps.show) {
      this.setState({
        codeUuid: new Date().getTime()
      })

      // 如果 sql 不相同，则去重新请求。否则保留记录, 上一步和下一步sql 未改变。
      // 但是编辑的情况 sql 在初始化的已经存在。
      if (nextProps.initState && nextProps.initState.loaded) {
        this.setState({
          sql: nextProps.initState.sql,
          codeUuid: new Date().getTime()
        })
        if (nextProps.initState.sql) {
          this._runSQLExec(nextProps.initState.sql)
        }
      }
    }
  }

  render() {
    const { datasetData, datasetTable, onUpdateDatasetField, datasetTableTotal, pending, show } = this.props
    const { navActive } = this.state
    return <div className="sql-main fixed" style={{ display: show ? 'flex' : 'none' }}>
      <div className="main-wrap">

        <div className="left">
          {this.renderTables()}
          {this.renderSqlIde()}
        </div>
        <div className="right">
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

      </div>
      <div className="footer">
        <Button onClick={this.handlePrev.bind(this)}>上一步</Button>
        <Button bsStyle="primary" onClick={this.handleNext.bind(this)}>下一步</Button>
      </div>
    </div>
  }

  // 渲染TABLE列表
  renderTables() {
    const { tableKeyword } = this.state;
    const { dataSourecePending, dataSourceTables, dataSourceTablesPage, dataSourceTablesTotal } = this.props

    const viewIconStyle = {
      width: '100%',
      height: '100%',
      paddingLeft: '5px',
      cursor: 'pointer',
      textAlign: 'center'
    };

    const dataFields = [{
      name: '名称',
      key: 'name',
      width: '45%',
      minWidth: '100px'
    }, {
      name: '备注',
      key: 'comment',
      width: '35%',
      minWidth: '100px'
    }, {
      name: '查询',
      key: 'select',
      width: '60px',
      minWidth: '60px'
    }];

    const rowTemplate = (
      <div>
        <div childNodes={rowData => (
          <OverlayTrigger
            trigger="hover"
            placement="top"
            overlay={(<Tooltip>{rowData.name}</Tooltip>)}
          >
            <div style={this.STYLE_SHEET.textLimit}>{rowData.name}</div>
          </OverlayTrigger>
        )} />
        <div childNodes={rowData => (
          rowData.comment ? (
            <OverlayTrigger
              trigger="hover"
              placement="top"
              overlay={(<Tooltip>{rowData.comment}</Tooltip>)}
            >
              <div style={this.STYLE_SHEET.textLimit}>{rowData.comment}</div>
            </OverlayTrigger>
          ) : null
        )} />
        <div childNodes={rowData => (
          <div className="select-btn"
            title={`查询${rowData.name || ''}表`}
            style={viewIconStyle}
            onClick={this.handleSelectTable.bind(this, rowData)}
          >
            <i className="dmpicon-view datatable-action-icon" />
          </div>
        )} />
      </div>
    );

    return (
      <div className="table-container" style={{ width: '100%', height: '50%' }}>
        <div className="table-title" style={this.STYLE_SHEET.tableGroupTitle}>
          <span>表</span>
          <div className="form single-search-form small" style={{ width: '180px', float: 'right' }}>
            <Input type="text"
              placeholder="请输入表名/备注"
              value={tableKeyword}
              onChange={this.handleChangeTableKeyword.bind(this)}
              addonAfter={<i className="dmpicon-search" />}
              className="search-input-box"
            />
            {
              tableKeyword && <i className="dmpicon-close" onClick={this.handleClearTableKeyword.bind(this)} />
            }
          </div>
        </div>

        <div className="table-content">
          <FlexDataTable
            className="datasource-table-list"
            flexDataTableId="datatable-wrapper"
            pending={dataSourecePending}
            headerHeight={24}
            lineHeight={24}
            tableMinWidth={300}
            emptyText='没有可显示的内容'
            dataFields={dataFields}
            rowTemplate={rowTemplate}
            dataRefresh
            hasNext={dataSourceTables && dataSourceTables.length < dataSourceTablesTotal}
            onFetchData={dataSourceTablesTotal > 50 ? this.handleScrollFetchTables.bind(this, dataSourceTablesPage + 1) : false}
            fetchAction="scroll"
            data={dataSourceTables || []}
          />
          <Loading show={dataSourecePending} containerId='datatable-wrapper' />
        </div>
      </div>
    );
  }

  // 渲染SQL编辑器
  renderSqlIde() {
    const { keyModel, tableModel, funcModel, codeMirrorOpts, sql, codeUuid } = this.state;
    const { dataSourceType, dataBaseType } = this.props;
    const message = _getMessageByType(dataSourceType, dataBaseType)
    const codeMirrorMode = _getCodeMirrorMode(dataSourceType, dataBaseType)

    return (
      <div className="sql-ide-container" style={{ width: '100%', height: '50%' }}>
        <div className="sql-ide-title" style={this.STYLE_SHEET.groupTitle}>
          <span style={{ float: 'left' }}>
            SQL语句 {message}
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
          {
            <CodeMirror
              key={codeUuid}
              ref={(instance) => { this.sql_code_mirror = instance }}
              onChange={this.handleCodeChange.bind(this)}
              onSelect={this.handleCodeSelect.bind(this)}
              initFun={this._codeMirrorInit.bind(this)}
              options={{ ...codeMirrorOpts, mode: codeMirrorMode }}
              value={sql || ''}
              keyModel={keyModel}
              tableModel={tableModel}
              funcModel={funcModel}
            />
          }
        </div>
      </div>
    );
  }

  handleScrollFetchTables(page) {
    const { onFetchTables, dataSourceId } = this.props
    onFetchTables(dataSourceId, {
      page,
      page_size: this.PAGE_SIZE,
      keyword: this.state.tableKeyword || ''
    })
  }

  handleChangeTableKeyword(e) {
    clearTimeout(tableSearchTimer);
    const v = e.target.value;
    this.setState({
      tableKeyword: v
    })
    tableSearchTimer = setTimeout(() => {
      this._getTableList(v);
    }, 300);
  }

  // 清除表搜索关键字
  handleClearTableKeyword(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    clearTimeout(tableSearchTimer);
    this.setState({
      tableKeyword: ''
    });
    tableSearchTimer = setTimeout(() => {
      this._getTableList();
    }, 300);
  }

  handlePrev(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();

    this.props.onPrev({
      secondProcess: this.state
    })
  }

  handleNext(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();

    const { datasetTable, onNext, onShowErr } = this.props
    const { sql } = this.state
    // 修改了sql 必须先运行语句
    if (sql !== this._sqlHasRunResult) {
      onShowErr('sql语句被修改了，请先运行下结果')
      return
    }
    // 保证没有重复字段名
    if (datasetTable && datasetTable.head) {
      const colNames = datasetTable.head.map(head => head.col_name.toLowerCase())
      const colNamesUniq = _.uniq(colNames)
      if (colNames.length !== colNamesUniq.length) {
        onShowErr('字段名称不能重复，请检查sql语句')
        return
      }
    }
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

  // 查询表
  handleSelectTable(rowData) {
    const { onShowErr, onClearDataset } = this.props
    if (!rowData.name) {
      onShowErr('没有表名');
      return;
    }
    const sqlCode = `select * from ${rowData.name};`;
    // 如果与以写的数据不相同则进行动作
    if (this.state.sql.replace(/(^[\r\n\s]*)|([\r\n\s]*$)/g, '') !== sqlCode) {
      onClearDataset();
      // 将SQL CODE 写入
      this.sql_code_mirror.getCodeMirror().setValue(sqlCode);
      this.setState({
        sql: sqlCode
      }, () => {
        this._runSQLExec();
      })
    }
  }

  _getTableList(keyword) {
    const { onFetchTables, dataSourceId, onShowErr } = this.props
    this.setState({ tablePending: true })
    // 请求 table 表
    return new Promise((resolve) => {
      onFetchTables(dataSourceId, {
        page: 1,
        page_size: this.PAGE_SIZE,
        keyword: keyword || ''
      }, (json) => {
        if (json.result) {
          this.setState({
            tableModel: _setModel((json.data.items || []).map(item => item.name).join(' '))
          })
          resolve()
        } else {
          onShowErr(json.msg)
        }
      })
    })
  }

  // 执行SQL数据集
  _runSQLExec(sql) {
    const { onShowErr, onFetchRunSQLDataset, onClearDataset, dataSourceId } = this.props
    const currCode = this.state.sql || sql || '';
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
    // 记录已经运行过的sql语句
    this._sqlHasRunResult = currCode
    
    onClearDataset()

    onFetchRunSQLDataset({
      type: TYPE_NAMES.sql,
      content: JSON.stringify({
        data_source_id: dataSourceId,
        sql: currCode.replace(/;/g, '')
      })
    }, (json) => {
      if (!json.result) {
        onShowErr(json.msg || '执行失败');
      } else {
        this.setState({
          // 执行成功时记录下sql
          defaultSql: this.state.sql
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

  // 获取数据总数
  _getTableTotal() {
    const { dataSourceId, onFetchDatasetResultTotal } = this.props

    if (!this.state.sql) {
      return;
    }

    onFetchDatasetResultTotal({
      type: 'SQL',
      content: JSON.stringify({
        data_source_id: dataSourceId,
        sql: this.state.sql
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

  PAGE_SIZE = 40
}

export default SecondProcess
