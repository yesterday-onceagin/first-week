import React from 'react'
import createReactClass from 'create-react-class';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import Button from 'react-bootstrap-myui/lib/Button'
import Input from 'react-bootstrap-myui/lib/Input'
import Select from 'react-bootstrap-myui/lib/Select'
import ProcessNav from '@components/ProcessNav'
import CreateTableDialog from '../components/CreateTableDialog'
import MapsPanel from '../components/MapsPanel'

import { actions as dataCleanFlowActionCreators } from '@store/modules/dataclean/flow';
import { actions as dataCleanActionCreators } from '@store/modules/dataclean/dataclean';

import TipMixin from '@helpers/TipMixin';
import { encodeSql, creatSql } from '@helpers/createTableSql';

import { DEFAULT_RDS_OPTIONS } from '../constants/rds';
import './index.less';

const FlowPanelRds = createReactClass({
  mixins: [TipMixin],

  getInitialState() {
    return {
      isEdit: false,
      isRun: false,
      uuid: new Date().getTime(),
      processActive: 0,
      sameNameBtn: false, // 同名映射
      autoMap: true, // 自动映射
      source: {
        source_id: DEFAULT_RDS_OPTIONS.odps_source.id,
        source_name: DEFAULT_RDS_OPTIONS.odps_source.name,
        table: '',
        column: [],
        partition: null
      },
      target: {
        source_id: '',
        source_name: '',
        table: '',
        column: [],
        pre_sql: '',
        post_sql: '',
        write_mode: 'replace',
        sql: '' // 需要同步到弹窗
      },
      error_limit: 0,
      tables: {
        odps: [],
        rds: []
      },
      columns: {
        odps: [],
        rds: []
      },
      createTableDialog: {
        show: false,
        pending: false
      },
      datasourceList: []
    }
  },

  componentDidMount() {
    const { nodeData } = this.props
    this.loaded = {}
    // 获取数据源
    this._getDatasource()
    // content 内容存在
    if (nodeData.content) {
      const content = (typeof nodeData.content === 'string') ? JSON.parse(nodeData.content) : nodeData.content
      // 如果 target.cloumn = [] || source.column = []，依然调整为自动映射
      const { source, target, error_limit } = content
      this.setState({
        source: {
          ...source,
          column: source.column.slice(),
          partition: {
            ...source.partition
          }
        },
        target: {
          ...target,
          column: target.column.slice()
        },
        autoMap: content.target.column.length === 0 || content.source.column.length === 0,
        error_limit
      }, this._getAllTableColumns)
    } else {
      this._getTables(['odps'])
    }
  },

  componentWillReceiveProps(nextProps) {
    // 如果从不显示切换到显示 则重新获取数据表(避免从SQL节点执行完回来表有变化)
    if (!this.props.show && nextProps.show) {
      this._getTables(['odps', 'rds'])
    }
  },

  render() {
    const { style } = this.props;
    const { uuid, processActive, createTableDialog, target } = this.state

    return (
      <div className="flow-panel-rds" style={style} id={`flow-panel-rds-${uuid}`}>
        <div className='page-nav'>
          <ProcessNav
            data={DEFAULT_RDS_OPTIONS.processNav}
            active={processActive}
          />
        </div>
        <div className="rds-page">
          <div className="page-wrap">
            <div style={{ marginTop: '30px' }}>
              {+processActive === 0 && this.renderFirstProcess()}
              {+processActive === 1 && this.renderSecondProcess()}
              {+processActive === 2 && this.renderThirdProcess()}
            </div>
          </div>
        </div>
        <div className="footer">
          {
            +processActive !== 0 && (
              <Button bsStyle="secondary" bsSize="small" onClick={this.handlePrev}>上一步</Button>
            )
          }
          {
            +processActive === 2 ? (
              <Button bsStyle="primary" bsSize="small" onClick={this.handleSave}>保存</Button>
            ) : (
              <Button bsStyle="primary" bsSize="small" onClick={this.handleNext}>下一步</Button>
            )
          }
        </div>
        {
          createTableDialog.show && (
            <CreateTableDialog
              {...createTableDialog}
              sql={target.sql || ''}
              onHide={this.handleHideDialog}
              onExecSql={this.handleExecSql}
            />
          )
        }
      </div>
    );
  },

  renderFirstProcess() {
    const { source, target, tables, datasourceList } = this.state;
    const itemStyle = {
      margin: '30px',
      width: '350px',
      float: 'left'
    };

    return (
      <div className="first-process" style={{ textAlign: 'center' }}>
        <div className="inner-wrap" style={{ display: 'inline-block' }}>
          <div className="item" style={itemStyle}>
            <div className="title">选择数据来源</div>
            <div className="item-body">
              <div className="form">
                <div className="row">
                  <div md={12} className="col-md-12"><i className="required">*</i>数据源</div>
                  <div md={12} className="col-md-12">
                    <Input
                      type="text"
                      value={DEFAULT_RDS_OPTIONS.odps_source.name}
                      name="source-source_id"
                      disabled
                    />
                  </div>
                </div>
                <div className="row">
                  <div md={12} className="col-md-12"><i className="required">*</i>表</div>
                  <div md={12} className="col-md-12">
                    <Select value={source.table || ''}
                      openSearch
                      width="100%"
                      maxHeight={180}
                      onSelected={this.handleSelect.bind(this, 'source', 'table')}
                    >
                      {
                        tables.odps.map((item, i) => (
                          <option key={`source-tb-${i}`} value={item.name}>{item.name}</option>
                        ))
                      }
                    </Select>
                  </div>
                  <div md={12} className="col-md-12" style={{ visibility: 'hidden', marginBottom: '20px' }}>
                    <a href="javascript:;" >自动建表</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="item" style={itemStyle}>
            <div className="title">选择数据流向</div>
            <div className="item-body">
              <div className="form">
                <div className="row">
                  <div md={12} className="col-md-12"><i className="required">*</i>数据源</div>
                  <div md={12} className="col-md-12">
                    <Select value={target.source_id || ''}
                      openSearch
                      width="100%"
                      maxHeight={180}
                      onSelected={this.handleSelect.bind(this, 'target', 'source_id')}
                    >
                      {
                        datasourceList.map((item, i) => (
                          <option key={`target-${i}`} value={item.id}>{item.name}</option>
                        ))
                      }
                    </Select>
                  </div>
                </div>
                <div className="row">
                  <div md={12} className="col-md-12"><i className="required">*</i>表</div>
                  <div md={12} className="col-md-12">
                    <Select
                      value={target.table || ''}
                      openSearch
                      width="100%"
                      maxHeight={180}
                      onSelected={this.handleSelect.bind(this, 'target', 'table')}
                      disabled={!target.source_id}
                    >
                      {
                        tables.rds.map((item, i) => (
                          <option key={`target-tb-${i}`} value={item.name}>{item.name}</option>
                        ))
                      }
                    </Select>
                  </div>
                  <div md={12} className="col-md-12" style={{ marginBottom: '20px' }}>
                    <a href="javascript:;"
                      style={{ color: this.loaded && this.loaded.odps ? '' : '#999' }}
                      onClick={this.loaded && this.loaded.odps ? this.handleAutoCreate : null}
                    >
                      自动建表
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },

  renderSecondProcess() {
    const { nodeData } = this.props
    const { columns, processActive, sameNameBtn } = this.state
    const connections = this._convertConnections()

    return (
      <div className="second-process">
        <Button bsStyle={this._hasSameCloumn() ? 'primary' : 'default'}
          className="map"
          disabled={!this._hasSameCloumn()}
          onClick={this.handleSameNameMap}
        >
          {sameNameBtn ? '取消同名映射' : '同名映射'}
        </Button>
        {
          +processActive === 1 && <MapsPanel
            flowNode={nodeData}
            sourceTableColumns={columns.odps}
            targetTableColumns={columns.rds}
            connections={connections}
            onDeleteLine={this.handleConnertorsEvents.bind(this, 'delete')}
            onNodeConnection={this.handleConnertorsEvents.bind(this, 'add')}
            onNodeConnectionDetached={this.handleConnertorsEvents.bind(this, 'delete')}
            onNodeConnectionMoved={this.handleConnertorsEvents.bind(this, 'delete')}
          />
        }
      </div>
    )
  },

  renderThirdProcess() {
    const { source, target, error_limit } = this.state
    const partition = source.partition ? Object.keys(source.partition) : []
    return (
      <div className="third-process">
        <div className="inner-wrap">
          <div className="form">
            <div className="clearfix" >
              <div className="item">
                <div className="title">数据来源</div>
                <div className="item-body">
                  {
                    partition && partition.length > 0 ? (
                      <div className="partition-wrap">
                        <label>分区信息</label>
                        <div className="inner-wrap">
                          {
                            partition.map((item, i) => (
                              <div className="row" key={`partition-row-${i}`}>
                                <div md={4} className="col-md-4"><Input type="text" value={item} disabled /></div>
                                <div md={2} className="col-md-2">{'='}</div>
                                <div md={6} className="col-md-6">
                                  <Input type="text"
                                    value={source.partition[item]}
                                    onChange={this.handleInput_partition.bind(this, item)}
                                  />
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    ) : (<div className="nothing">暂无分区信息</div>)
                  }
                </div>
              </div>
              <div className="item">
                <div className="title">数据去向</div>
                <div className="item-body">
                  <div className="row">
                    <div md={12} className="col-md-12">准备语句</div>
                    <div md={12} className="col-md-12">
                      <Input
                        type="text"
                        value={target.pre_sql}
                        placeholder="请输入导入前的sql脚本"
                        onChange={this.handleInput.bind(this, 'target', 'pre_sql')}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div md={12} className="col-md-12">完成语句</div>
                    <div md={12} className="col-md-12">
                      <Input
                        type="text"
                        value={target.post_sql}
                        placeholder="请输入导入后的sql脚本"
                        onChange={this.handleInput.bind(this, 'target', 'post_sql')}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div md={12} className="col-md-12">主键冲突</div>
                    <div md={12} className="col-md-12">
                      <Select
                        value={target.write_mode}
                        openSearch
                        width="100%"
                        maxHeight={180}
                        onSelected={this.handleSelect.bind(this, 'target', 'write_mode')}
                      >
                        {
                          DEFAULT_RDS_OPTIONS.main_keys.map((item, i) => (
                            <option key={`main-key-${i}`} value={item.id}>{item.name}</option>
                          ))
                        }
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="clearfix" style={{ marginTop: '20px' }}>
              <div className="item row">
                <div className="title">出错控制</div>
                <div className="item-body">
                  · 错误数超过
                  <Input type="text"
                    value={error_limit}
                    onChange={this.handleInput.bind(this, '', 'error_limit')}
                  />
                  条，任务自动结束。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },

  handleHideDialog() {
    this.state.createTableDialog.show = false
    this.setState({
      ...this.state
    })
  },

  handleExecSql(sql) {
    this.state.target.sql = sql
    this.state.createTableDialog.pending = true
    this.setState({
      ...this.state
    }, () => {
      // 执行sql
      this.props.actions.createTable({
        id: this.state.target.source_id,
        create_sql: encodeSql(sql)
      }, (json) => {
        if (json.result) {
          this.state.createTableDialog.show = false
          this.showSuccess('创建成功！')
          // 重新进行赋值, 并且重新拉取数据
          this.state.target.table = this.state.source.table
          this.props.actions.fetchTables(this.state.target.source_id, {
            page_size: 100000,
            page: 1
          }, (_json) => {
            if (_json.result) {
              this.state.tables.rds = _json.data.items
              this.setState({ ...this.state })
              this.handleSelect('target', 'table', {
                value: this.state.source.table,
                text: this.state.source.table
              })
            }
          })
        } else {
          this.showErr(json.msg)
        }
        this.state.createTableDialog.pending = false
        this.setState({ ...this.state })
      })
    })
  },

  handleAutoCreate() {
    this.state.createTableDialog.show = true
    this.setState({
      ...this.state
    })
  },

  handleSelect(property, field, option) {
    this.state[property][field] = option.value
    // 表
    if (field === 'table') {
      const _property = property === 'target' ? 'rds' : 'odps'
      const id = property === 'target' ? this.state.target.source_id : this.state.source.source_id
      // 获取表字段
      this.props.actions.fetchRDSTableCloumns({
        id,
        table_name: option.text,
        page_size: 10000
      }, this._updateTableSelect.bind(this, property, _property))
    } else if (field === 'source_id') {
      this.state[property].source_name = option.text
      // 修改了数据源 清空table
      this.state[property].table = ''
      // 修改了数据源 重新获取表
      const type = property === 'target' ? ['rds'] : ['odps']
      this._getTables(type)
      this.setState({ ...this.state })
    } else {
      this.setState({ ...this.state })
    }
  },

  handleInput(property, field, e) {
    if (property) {
      this.state[property][field] = e.target.value
    } else {
      this.state[field] = e.target.value
    }
    this.setState({
      ...this.state
    })
  },

  handleInput_partition(field, e) {
    this.state.source.partition[field] = e.target.value
    this.setState({
      ...this.state
    })
  },

  handleNext() {
    const { target, source, processActive } = this.state
    const newProcess = processActive + 1
    // 从第一步到第二步的情况
    if (processActive === 0 && newProcess === 1) {
      // 数据源来源的数据源已写死 不判断 只判断是否选择表
      if (!source.table) {
        this.showErr('请为数据来源选择表')
        return
      }
      // 数据流向是否选择数据源
      if (!target.source_id) {
        this.showErr('请为数据流向选择数据源')
        return
      }
      // 数据流向是否选择表
      if (!target.table) {
        this.showErr('请为数据流向选择表')
        return
      }
    }
    this.setState({
      processActive: newProcess
    })
  },

  handlePrev() {
    const newProcess = this.state.processActive - 1
    this.setState({
      processActive: newProcess
    })
  },

  // 表字段映射，源 可以 一对多。
  // target 肯定是不同的列名
  handleConnertorsEvents(type, info) {
    const { nodeData } = this.props
    const source_column = info.source.substr(`${nodeData.id}_source_`.length)
    const target_column = info.target.substr(`${nodeData.id}_target_`.length)

    switch (type) {
      case 'add': {
        const index = this.state.target.column.indexOf(target_column)
        if (index === -1) {
          // 加入, 但不更新
          this.state.source.column.push(source_column)
          this.state.target.column.push(target_column)
        }
        break;
      }
      case 'delete': {
        const index = this.state.target.column.indexOf(target_column)
        if (index > -1) {
          this.state.source.column.splice(index, 1)
          this.state.target.column.splice(index, 1)
        }
        break;
      }
      default:
        break;
    }

    this.setState({
      ...this.state
    })
  },

  handleSave() {
    const { actions, nodeData, events } = this.props
    const { source, target, error_limit } = this.state
    const node = {
      ...nodeData,
      content: {
        source,
        target,
        error_limit
      }
    }
    actions.updateFlowNode(node, (json) => {
      if (json.result) {
        this.showSuccess(json.msg);
        setTimeout(() => {
          events.onCloseTab(nodeData, null);
          events.onReturnToMain();
        }, 1800);
      } else {
        this.showErr(json.msg)
      }
    })
  },

  handleSameNameMap() {
    const { sameNameBtn, source, target } = this.state
    const info = this._sameNameConnections()
    let source_column = source.column
    let target_column = target.column
    // 只取消同名的. 
    if (sameNameBtn) {
      const temp = []
      source_column.forEach((item) => {
        // 如果存在
        if (target_column.indexOf(item) > -1) {
          temp.push(item)
        }
      })
      source_column = source_column.filter(item => temp.indexOf(item) === -1)
      target_column = target_column.filter(item => temp.indexOf(item) === -1)
    } else {
      info._target_column.forEach((item) => {
        // 不存在sourece 和target
        if (target_column.indexOf(item) === -1 && source_column.indexOf(item) === -1) {
          target_column.push(item)
          source_column.push(item)
        }
      })
    }
    this.state.source.column = source_column
    this.state.target.column = target_column
    this.state.sameNameBtn = !sameNameBtn
    this.setState({
      ...this.state
    })
  },

  // 选择表请求后的回调
  _updateTableSelect(property, _property, json) {
    if (json.result) {
      this.state.columns[_property] = json.data.items
      this.loaded[_property] = true
      // 如果是重新选择了. 则又回到自动映射
      this.state.autoMap = true
      if (property === 'source') {
        // 清空 以前的映射字段
        this.state.source.partition = {}
        json.data.items.forEach((item) => {
          if (item.is_partition) {
            this.state.source.partition = {
              ...this.state.source.partition,
              [item.name]: DEFAULT_RDS_OPTIONS.partition
            }
          }
        })
        // 更新 sql 语句
        this.state.target.sql = creatSql(this.state.source.table, this.state.columns.odps)
      }
      // 如果是新增的情形。则自动映射
      if (this.loaded.odps && this.loaded.rds && this.state.autoMap) {
        const info = this._sameNameConnections()
        this.state.source.column = info._source_column
        this.state.target.column = info._target_column
        this.state.sameNameBtn = this._hasSameCloumn()
      }
    }
    this.setState({ ...this.state })
  },

  _convertConnections() {
    const { nodeData } = this.props
    const { source, target } = this.state
    const connections = []

    // 如果是同样长度
    if (source.column.length > 0 && source.column.length === target.column.length) {
      source.column.forEach((item, i) => {
        connections.push({
          source: `${nodeData.id}_source_${item}`,
          sourceEndpoint: `${nodeData.id}_source_${item}_Right`,
          target: `${nodeData.id}_target_${target.column[i]}`,
          targetEndpoint: `${nodeData.id}_target_${target.column[i]}_Left`
        })
      })
    }
    return connections
  },

  // 同名
  _sameNameConnections() {
    const { nodeData } = this.props
    const { columns } = this.state
    const connections = []
    const _source_column = []
    const _target_column = []

    if (columns.odps && columns.rds) {
      columns.odps.forEach((source) => {
        columns.rds.forEach((target) => {
          // 如果两者相等
          if (source.name.toLowerCase() === target.name.toLowerCase()) {
            connections.push({
              source: `${nodeData.id}_source_${source.name}`,
              sourceEndpoint: `${nodeData.id}_source_${source.name}_Right`,
              target: `${nodeData.id}_target_${target.name}`,
              targetEndpoint: `${nodeData.id}_target_${target.name}_Left`
            })
            // 得到同名的cloumn
            _source_column.push(source.name)
            _target_column.push(target.name)
          }
        })
      })
    }

    return {
      connections,
      _source_column,
      _target_column
    }
  },

  // 对于cloums中的数据进行检索看是否有存在相同的cloumn能同名映射
  _hasSameCloumn() {
    let isexsit = false
    const { columns } = this.state
    if (columns.odps && columns.rds) {
      columns.odps.every((col) => {
        const sourceName = col.name.toLowerCase()
        if (columns.rds.some(target => target.name.toLowerCase() === sourceName)) {
          isexsit = true;
          return false;
        }
        return true;
      })
    }
    return isexsit
  },

  _isSamedMap() {
    let isexsit = false
    const { target, source } = this.state

    if (source.column && target.column) {
      source.column.every((s) => {
        const _source = s.toLowerCase();
        if (target.column.some(_target => _target.toLowerCase() === _source)) {
          isexsit = true;
          return false;
        }
        return true;
      })
    }
    return isexsit
  },

  // 拉取 tables ['odps', 'rds']
  _getTables(arr) {
    arr.forEach((item) => {
      const id = item === 'rds' ? this.state.target.source_id : this.state.source.source_id
      this.props.actions.fetchTables(id, {
        page_size: 100000,
        page: 1
      }, (json) => {
        if (json.result) {
          this.setState({
            tables: {
              ...this.state.tables,
              [item]: json.data.items
            }
          })
        }
      })
    })
  },

  // 获取数据源列表
  _getDatasource() {
    this.props.actions.fetchDataSources({
      type: 'MySQL'
    }, (json) => {
      if (json.result && json.data && json.data.total > 0) {
        this.setState({ datasourceList: json.data.items })
      } else {
        this.setState({ datasourceList: [] })
      }
    })
  },

  _getAllTableColumns() {
    this._getTables(['odps', 'rds'])
    this.setState({
      sameNameBtn: this._isSamedMap()
    });
    ['odps', 'rds'].forEach((item) => {
      const id = item === 'rds' ? this.state.target.source_id : this.state.source.source_id
      const tableName = item === 'rds' ? this.state.target.table : this.state.source.table
      if (tableName) {
        this.props.actions.fetchRDSTableCloumns({
          id,
          table_name: tableName,
          page_size: 10000
        }, (json) => {
          this.loaded[item] = true
          if (json.result) {
            this.state.columns[item] = json.data.items || [];
            if (this.state.columns.odps) {
              this.state.target.sql = creatSql(this.state.source.table, this.state.columns.odps)
            }
            this.setState({
              ...this.state
            })
          }
        })
      }
    })
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

export default connect(stateToProps, dispatchToProps)(FlowPanelRds);
