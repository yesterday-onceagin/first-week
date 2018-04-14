import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import Select from 'react-bootstrap-myui/lib/Select';
import Loading from 'react-bootstrap-myui/lib/Loading';

import TipMixin from '../../../helpers/TipMixin';

const TableConfigDialog = createReactClass({
  displayName: 'TableConfigDialog',
  mixins: [TipMixin],

  propTypes: {
    show: PropTypes.bool,
    data: PropTypes.object,
    datasourceId: PropTypes.string,
    datasource: PropTypes.string,
    onSure: PropTypes.func,
    onHide: PropTypes.func
  },

  getInitialState() {
    const { isNew, ...info } = this.props.data;

    const initCollectType = this.props.data.mode ? (this.props.data.mode === '增量' ? 'incremental' : 'full') : 'full';

    const initFullMode = this.props.data.mode ? (this.props.data.mode === '一次全量' ? 'one' : 'cycle') : 'cycle';

    return {
      isNew,
      info: {
        columns: [],
        // Incremental '增量' CycleFull '周期全量' OneFull '一次全量'
        mode: '增量',
        timestamp_col_name: '',
        ...info
      },
      editable: true,
      // 增量采集 incremental  全量采集 full
      collectType: initCollectType,
      // 全量采集方式 cycle 周期全量 one 一次全量
      fullCollectMode: initFullMode,
      tableColumnsLoading: false,
      tableColumns: [],
      timestampCol: this.props.data.timestamp_col_name || '',
      tableError: ''
    }
  },

  componentDidMount() {
    this.getTableColumns();
  },

  render() {
    const { show, onHide, datasource } = this.props
    const { editable, collectType, fullCollectMode, tableColumns, timestampCol } = this.state

    const timeStampColumns = Array.isArray(tableColumns) ? tableColumns.filter(col => (
      col.type === 'timestamp'
    )) : []

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '650px', height: datasource.type === 'SaaS' ? '580px' : '502px' }}
        className="data-collector-table-config"
        id="data-collector-table-config-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>采集设置</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <form>
            <div className="form-group-row form-group-row-2">
              <div className="form-group" style={{ paddingBottom: '10px' }}>
                <label className="control-label">
                  <span><i className="required">&nbsp;</i>采集类型</span>
                </label>
                <div className="input-wrapper">
                  <div style={this.STYLE_SHEET.checkboxContainer}>
                    <Input type="radio"
                      label="增量采集"
                      checked={collectType === 'incremental'}
                      disabled={datasource.type === 'ODPS' || !editable}
                      onClick={this.handleChangeCollectType.bind(this, 'incremental')}
                    />
                  </div>
                  <div style={this.STYLE_SHEET.checkboxContainer}>
                    <Input type="radio"
                      label="全量采集"
                      checked={collectType === 'full'}
                      disabled={datasource.type === 'ODPS' || !editable}
                      onClick={this.handleChangeCollectType.bind(this, 'full')}
                    />
                  </div>
                </div>
              </div>
              {
                collectType === 'incremental' ? (
                  <div className="form-group">
                    <label className="control-label">
                      <span><i className="required">&nbsp;</i>时间戳字段</span>
                    </label>
                    <div className="input-wrapper">
                      <Select value={timestampCol} maxHeight={200} width={'100%'} disabled={!editable} openSearch={false} onSelected={this.handleChangeTimestampCol}>
                        {
                          timeStampColumns.map((col, i) => (
                            <option key={i} value={col.name}>{col.name}</option>
                          ))
                        }
                      </Select>
                    </div>
                  </div>
                ) : collectType === 'full' ? (
                  <div className="form-group">
                    <label className="control-label">
                      <span><i className="required">&nbsp;</i>采集方式</span>
                    </label>
                    <div className="input-wrapper">
                      <Select value={fullCollectMode} maxHeight={200} width={'100%'} disabled={!editable} openSearch={false} onSelected={this.handleChangeFullCollectMode}>
                        <option value="cycle">按调度周期全量采集</option>
                        <option value="one">全量仅采集一次</option>
                      </Select>
                    </div>
                  </div>
                ) : null
              }
            </div>
            {this.renderSaasTaskMode()}
            {this.renderCollectTable()}
          </form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSaveData}>确定</Button>
          <Button bsStyle="default" onClick={onHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  },

  // SAAS数据源采集 任务模式配置
  renderSaasTaskMode() {
    const { datasource } = this.props
    const { info } = this.state

    return datasource.type === 'SaaS' ? (
      <div className="form-group-row form-group-row-2">
        <div className="form-group" style={{ paddingBottom: '10px' }}>
          <label className="control-label">
            <span><i className="required">&nbsp;</i>任务模式</span>
          </label>
          <div className="input-wrapper">
            <div style={this.STYLE_SHEET.checkboxContainer}>
              <Input type="radio"
                label="出错中断"
                checked={!!+info.task_mode}
                onClick={this.handleChangeSaasTaskMode.bind(this, 1)}
              />
            </div>
            <div style={this.STYLE_SHEET.checkboxContainer}>
              <Input type="radio"
                label="出错继续"
                checked={!+info.task_mode}
                onClick={this.handleChangeSaasTaskMode.bind(this, 0)}
              />
            </div>
          </div>
        </div>
      </div>
    ) : null;
  },

  // 采集表字段选择
  renderCollectTable() {
    const {
      info,
      tableColumns,
      editable,
      tableError,
      tableColumnsLoading
    } = this.state;

    let isSelectAll = false;
    if (info.columns.length === tableColumns.length && info.columns.length !== 0) {
      isSelectAll = true;
    }

    return (
      <div className="form-group">
        <label className="control-label">
          <span>
            <i className="required">&nbsp;</i>
            {`采集字段(已选择${info.columns.length}个字段)`}
          </span>
        </label>
        <div className="data-table-wrapper">
          <table className="data-table table">
            <thead>
              <tr className="table-header">
                <th width="44" onClick={this.handleSelectAll}>
                  {
                    tableColumns && tableColumns.length > 0 && (
                      <Input type="checkbox" checked={isSelectAll} disabled={!editable} />
                    )
                  }
                </th>
                <th>名称</th>
              </tr>
            </thead>
          </table>
          <div className="scroll-wrap" style={{ height: '200px', overflowY: 'auto' }}>
            {
              tableColumns && tableColumns.length > 0 ? (
                <table className="data-table table">
                  <tbody>
                    {
                      tableColumns.map((item, i) => {
                        const checked = info.columns.indexOf(item.name) !== -1;
                        return (
                          <tr key={i}>
                            <td width="44" onClick={this.handleSelectColumn.bind(this, item.name)}>
                              <Input type="checkbox" checked={checked} disabled={!editable} />
                            </td>
                            <td>{item.name}</td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              ) : (
                <div style={this.STYLE_SHEET.loadingContainer}
                  id="data-collector-table-config-dialog-loading-container"
                >
                  {
                    tableColumnsLoading ? (
                      <Loading show={tableColumnsLoading}
                        containerId='data-collector-table-config-dialog-loading-container'
                      />
                    ) : (tableError || '没有可显示的数据')
                  }
                  <div style={{ height: '100px', width: '100%' }}></div>
                </div>
              )
            }
          </div>
        </div>
      </div>
    );
  },

  // 选择SAAS采集模式
  handleChangeSaasTaskMode(mode) {
    this.setState({
      info: {
        ...this.state.info,
        task_mode: mode
      }
    })
  },

  // 字段全选
  handleSelectAll() {
    const info = this.state.info;
    const tableColumns = this.state.tableColumns;

    if (tableColumns.length <= 0 || !this.state.editable) {
      return;
    }

    if (info.columns.length < tableColumns.length) {
      this.setState({
        info: {
          ...info,
          columns: tableColumns.map(col => col.name)
        }
      });
    } else {
      this.setState({
        info: {
          ...info,
          columns: []
        }
      });
    }
  },

  // 单选字段
  handleSelectColumn(name) {
    if (!this.state.editable) {
      return;
    }
    const cols = this.state.info.columns.concat();

    if (cols.indexOf(name) !== -1) {
      cols.splice(cols.indexOf(name), 1);
    } else {
      cols.push(name);
    }

    this.setState({
      info: {
        ...this.state.info,
        columns: cols
      }
    });
  },

  // 选择时间戳字段
  handleChangeTimestampCol(opt) {
    this.setState({
      timestampCol: opt.value,
      info: {
        ...this.state.info,
        timestamp_col_name: opt.value
      }
    });
  },

  // 切换全量采集方式
  handleChangeFullCollectMode(opt) {
    this.setState({
      fullCollectMode: opt.value,
      info: {
        ...this.state.info,
        mode: this.getCollectMode(this.state.collectType, opt.value)
      }
    });
  },

  // 切换采集类型
  handleChangeCollectType(type) {
    this.setState({
      collectType: type,
      info: {
        ...this.state.info,
        mode: this.getCollectMode(type, this.state.fullCollectMode)
      }
    });
  },

  // 保存数据
  handleSaveData() {
    const { collectType, timestampCol, tableColumns } = this.state;

    const info = this.state.info;

    // 检查是否有不存在于tableColumns中的字段
    info.columns = info.columns.filter(item => (tableColumns.some(col => item === col.name)));

    // 增量采集未选择时间戳字段时不允许保存
    if (collectType === 'incremental' && !timestampCol) {
      this.showTip({
        status: 'error',
        content: '增量采集必须选择时间戳字段'
      });
      return;
    }

    // 不允许不选择采集字段
    if (!info.columns || (Array.isArray(info.columns) && info.columns.length < 1)) {
      this.showTip({
        status: 'error',
        content: '请选择至少一个采集字段'
      });
      return;
    }

    this.props.onSure(info);
    this.props.onHide();
  },

  // 取得采集方式
  getCollectMode(collectType, fullType) {
    if (collectType === 'incremental') {
      return '增量';
    } else if (collectType === 'full') {
      if (fullType === 'cycle') {
        return '周期全量';
      }
      return '一次全量';
    }
  },

  // 获取数据表字段
  getTableColumns() {
    const { datasourceId, getTableColumns, data, datasource } = this.props
    this.setState({
      tableColumnsLoading: true,
      tableError: ''
    });

    getTableColumns({
      id: datasourceId,
      page: 1,
      page_size: 100000,
      table_name: data.name
    }, (json) => {
      if (json.result) {
        const newTableColumns = json.data.items
        // 如果是新数据，给一套默认配置
        if (this.state.isNew) {
          let collectType = 'full'
          let timestampCol = ''
          const fullCollectMode = 'cycle'
          // 检查是否存在时间戳字段(非ODPS数据源)
          if (newTableColumns.length > 0 && datasource.type !== 'ODPS') {
            const _timestampCols = newTableColumns.filter(col => (col.type === 'timestamp'));
            // 存在可用的时间戳字段，设置默认为增量采集
            timestampCol = _timestampCols.length > 0 && _timestampCols[0].name ? _timestampCols[0].name : '';
            collectType = _timestampCols.length > 0 ? 'incremental' : 'full';
          }

          this.setState({
            collectType,
            fullCollectMode,
            timestampCol,
            tableColumnsLoading: false,
            tableColumns: newTableColumns,
            info: {
              ...this.state.info,
              columns: newTableColumns.map(c => c.name),
              mode: this.getCollectMode(collectType, fullCollectMode),
              timestamp_col_name: timestampCol
            }
          });
        } else {
          // 读取最新表内字段并与已选择的字段进行比对 过滤不存在的部分
          const newColumns = this._getFilteredColumns(newTableColumns.map(c => c.name))
          this.setState({
            info: {
              ...this.state.info,
              columns: newColumns
            },
            tableColumnsLoading: false,
            tableColumns: newTableColumns
          });
        }
      } else {
        this.setState({
          tableColumnsLoading: false,
          tableError: json.msg
        });
      }
    });
  },

  _getFilteredColumns(tableNames) {
    return this.state.info && Array.isArray(this.state.info.columns) && this.state.info.columns.length > 0 ? this.state.info.columns.filter(item => tableNames.indexOf(item) !== -1) : []
  },

  STYLE_SHEET: {
    checkboxContainer: {
      width: '48%',
      float: 'left',
      height: '32px',
      lineHeight: '32px'
    },
    loadingContainer: {
      textAlign: 'center',
      width: '100%',
      height: '200px',
      lineHeight: '100px'
    }
  },
});

export default TableConfigDialog;
