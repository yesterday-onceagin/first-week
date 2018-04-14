import React from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button'
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger'
import Tooltip from 'react-bootstrap-myui/lib/Tooltip'
import Input from 'react-bootstrap-myui/lib/Input'
import Loading from 'react-bootstrap-myui/lib/Loading'
import FlexDataTable from '@components/FlexDataTable'
import KeyValueInput from '@components/KeyValueInput'
import DatasetResultTable from '../../components/DatasetResultTable'
import DatasetFieldEditor from '../../components/DatasetFieldEditor'

import _ from 'lodash'
import classnames from 'classnames'

import { TYPE_NAMES } from '../../constants'

let tableSearchTimer = null;

// 剔除不需要的参数
const _getValidParams = (params = []) => _.filter(_.cloneDeep(params), ({ checked }) => checked).map((item) => {
  if (item.checked !== undefined) {
    Reflect.deleteProperty(item, 'checked')
  }
  return item
})

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
    show: PropTypes.bool,
    dataSourceTables: PropTypes.array,
    dataSourceTablesPage: PropTypes.number,
    dataSourceTablesTotal: PropTypes.number,
    dataSourcePending: PropTypes.bool,
    pending: PropTypes.bool,
    datasetData: PropTypes.object,
    datasetTable: PropTypes.object,
    datasetTableTotal: PropTypes.number,
    apiDatasourceParams: PropTypes.array,
    apiDatasourceSysParams: PropTypes.array,
    apiDatasourceParamsPending: PropTypes.bool
  }

  static defaultProps = {
    apiDatasourceParams: [],
    apiDatasourceSysParams: []
  };

  constructor(props) {
    super(props)
    this.state = {
      navActive: 0,
      previewLength: 100,
      
      tableName: '',
      paramData: [],                    // 参数配置
  
      tableKeyword: '',
      sql: '',                          // SQL 语句内容
      defaultSql: '',                   // 原SQL语句
    }
    if (props.initState) {
      this.state = {
        ...this.state,
        ...props.initState
      }
    }
    // 记录最后一次运行的数据
    this.lastTableName = ''
    this.lastParamData = []
  }

  componentWillReceiveProps(nextProps) {
    const { initState, show, dataSourceId } = this.props
    // 数据源发生变更时，重置运行记录
    if (dataSourceId !== nextProps.dataSourceId) {
      this.lastTableName = ''
      this.lastParamData = []
    }

    if (!_.isEqual(nextProps.initState, initState)) {
      this.setState({
        ...this.state,
        ...nextProps.initState
      })
    }

    // 当显示的时候
    if (!_.isEqual(show, nextProps.show) && nextProps.show && _.get(nextProps, 'initState.loaded')) {
      this.setState({
        tableName: nextProps.initState.tableName,
      })
      if (nextProps.initState.tableName) {
        this._runDataset(nextProps.initState)
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
          {this.renderParams()}
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
    const { tableKeyword, tableName } = this.state;
    const { dataSourcePending, dataSourceTables, dataSourceTablesTotal } = this.props

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
        <div childNodes={(rowData) => {
          const isSelected = tableName === rowData.name
          const iconClassName = classnames('datatable-action-icon', {
            'dmpicon-view': !isSelected,
            'dmpicon-tick': isSelected,
            selected: isSelected
          })
          return (
            <div className="select-btn"
              title={`查询${rowData.name || ''}表`}
              style={viewIconStyle}
              onClick={this.handleSelectTable.bind(this, rowData)}
            >
              <i className={iconClassName} />
            </div>
          )
        }} />
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
        <div className="table-content" id="table-content">
          <FlexDataTable
            className="datasource-table-list"
            headerHeight={24}
            lineHeight={24}
            tableMinWidth={300}
            emptyText='没有可显示的内容'
            pending={dataSourcePending}
            dataFields={dataFields}
            onFetchData={dataSourceTablesTotal > 20 ? this._getNextPageTableList.bind(this) : false}
            hasNext={dataSourceTables.length < dataSourceTablesTotal}
            fetchAction="scroll"
            rowTemplate={rowTemplate}
            data={dataSourceTables}
          />
          <Loading show={dataSourcePending} containerId="table-content" />
        </div>
      </div>
    );
  }

  // 渲染参数配置
  renderParams() {
    const { dataSourcePending, pending, apiDatasourceParams, apiDatasourceParamsPending, apiDatasourceSysParams } = this.props
    const { paramData, tableName } = this.state
    // 执行数据集按钮的className
    const runDisabled = !tableName || pending || dataSourcePending || apiDatasourceParamsPending
    const runBtnClass = classnames('add-btn', {
      disabled: runDisabled
    })
    return (
      <div className="table-container" style={{ width: '100%', height: '50%', paddingTop: '9px' }}>
        <div className="table-title" style={this.STYLE_SHEET.tableGroupTitle}>
          <span>参数配置</span>
          <span className="hint-color" style={{ fontSize: '12px' }}>（修改后需要刷新数据）</span>
          <div className={runBtnClass} title="刷新数据" style={{
            ...this.STYLE_SHEET.addBtn,
            marginLeft: '10px'
          }} onClick={runDisabled ? null : this._runDataset.bind(this, null)}>
            <i className="dmpicon-refresh2" style={this.STYLE_SHEET.addBtnIcon}/>
            刷新数据
          </div>
        </div>
        <div className="table-content" style={{ overflowY: 'auto', padding: '6px' }}>
          <KeyValueInput
            data={paramData}
            pending={apiDatasourceParamsPending}
            baseData={apiDatasourceParams}
            sysParams={apiDatasourceSysParams}
            onChange={this.handleChangeParamData.bind(this)}
          />
        </div>
      </div>
    )
  }

  // 更新参数配置 
  handleChangeParamData(data) {
    this.setState({ paramData: data })
  }

  // 搜索关键字更新
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

  // 上一步
  handlePrev(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();

    this.props.onPrev({
      secondProcess: this.state
    })
  }

  // 下一步
  handleNext(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();
    const { datasetTable, onNext, onShowErr } = this.props
    const { tableName, paramData } = this.state
    const validParams = _getValidParams(paramData)
    // 必须选择一个表
    if (!tableName) {
      onShowErr('请先选择一个表')
      return
    }
    // 对参数进行校验
    let errorMsg = ''

    _.every(validParams, (item) => {
      // 如果是固定参数 则检查是否填写了默认值
      if (item.type === 'fixed') {
        errorMsg = !item.value ? `参数${item.name}的默认值未填写` : ''
        return !errorMsg
      }
      // 检查key是否填写
      errorMsg = !item.key ? `参数${item.name}的关键字未填写` : ''
      return !errorMsg
    })
    // 如果有错误信息 则抛出并中断
    if (errorMsg) {
      onShowErr(errorMsg)
      return
    }
    // 检查是否需要刷新数据
    if (tableName !== this.lastTableName || !_.isEqual(_getValidParams(paramData), this.lastParamData)) {
      onShowErr('表或参数发生了变更，请刷新数据')
      return
    }

    if (datasetTable && datasetTable.data && datasetTable.data.length > 0) {
      onNext({
        secondProcess: this.state
      })
    } else {
      onShowErr('没有数据')
    }
  }

  // 选择数据预览/字段设置
  handleSelect(active) {
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
    const newTableName = rowData.name
    // 如果与以写的数据不相同则进行动作
    if (this.state.tableName !== newTableName) {
      onClearDataset();
      this.setState({
        tableName: newTableName
      }, () => {
        this._runDataset();
      })
    }
  }

  // 获取table列表
  _getTableList(keyword) {
    const { onFetchTables, dataSourceId, onShowErr } = this.props
    // 请求 table 表
    return new Promise((resolve) => {
      onFetchTables(dataSourceId, {
        page: 1,
        page_size: 20,
        keyword: keyword || ''
      }, (json) => {
        if (json.result) {
          resolve()
          // 再次从第一页请求表时 将scrollTop重设为0
          $('#table-content .flex-data-table-body').scrollTop(0)
        } else {
          onShowErr(json.msg)
        }
      })
    })
  }

  // 获取下一页（tableList分页）
  _getNextPageTableList() {
    const { onFetchTables, dataSourceId, onShowErr, dataSourceTablesPage } = this.props
    const { tableKeyword } = this.state
    return new Promise((resolve) => {
      onFetchTables(dataSourceId, {
        page: +dataSourceTablesPage + 1,
        page_size: 20,
        keyword: tableKeyword || ''
      }, (json) => {
        if (json.result) {
          resolve()
        } else {
          onShowErr(json.msg)
        }
      })
    })
  }

  // 执行数据集
  _runDataset(state) {
    const { onShowErr, onFetchRunSQLDataset, dataSourceId } = this.props
    const { tableName } = (state || this.state)
    const paramData = Array.isArray(this.state.paramData) ? this.state.paramData : _.get((state || this.state), 'paramData', [])
    const validParams = _getValidParams(paramData)
    onFetchRunSQLDataset({
      type: TYPE_NAMES.api,
      content: JSON.stringify({
        data_source_id: dataSourceId,
        table_name: tableName,
        params: validParams
      })
    }, (json) => {
      this.lastParamData = validParams
      this.lastTableName = tableName
      if (!json.result) {
        onShowErr(json.msg || '执行失败');
      } else if (Array.isArray(json.data.data) && json.data.data.length >= this.state.previewLength) {
        this._getTableTotal();
      }
    })
  }

  // 获取数据总数
  _getTableTotal() {
    const { dataSourceId, onFetchDatasetResultTotal } = this.props
    const { tableName, paramData } = this.state

    if (!tableName) {
      return;
    }

    onFetchDatasetResultTotal({
      type: TYPE_NAMES.api,
      content: JSON.stringify({
        data_source_id: dataSourceId,
        table_name: tableName,
        params: _getValidParams(paramData)
      })
    });
  }

  // 参数模板数据
  PARAM_TEMPLATE = {
    name: '',
    type: 'query',
    key: '',
    value: ''
  };

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
    addBtn: {
      float: 'right',
      fontSize: '12px',
      padding: '1px 0',
      transition: 'color .3s'
    },
    addBtnIcon: {
      padding: '9px 5px 0 0',
      fontWeight: 'normal',
      fontSize: '14px',
      float: 'left'
    }
  }
}

export default SecondProcess
