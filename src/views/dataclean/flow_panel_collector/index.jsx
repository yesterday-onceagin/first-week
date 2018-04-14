import PropTypes from 'prop-types';
import React from 'react';

import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';
import Button from 'react-bootstrap-myui/lib/Button';
import Select from 'react-bootstrap-myui/lib/Select';
import Input from 'react-bootstrap-myui/lib/Input';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import IconButton from '../../../components/IconButton';
import FlexDataTable from '../../../components/FlexDataTable';
import TableConfigDialog from './TableConfigDialog';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataCleanFlowActionCreators } from '../../../redux/modules/dataclean/flow';
import { actions as dataSourceActionCreators } from '../../../redux/modules/datasource/datasource';

import TipMixin from '../../../helpers/TipMixin';

const FlowPanelCollector = createReactClass({
  displayName: 'FlowPanelCollector',
  mixins: [TipMixin],

  propTypes: {
    show: PropTypes.bool,
    style: PropTypes.object,
    nodeData: PropTypes.object,
    onUpdateFlowNode: PropTypes.func
  },

  getDefaultProps() {
    return {
      show: false,
      style: {},
      nodeData: {},
      onUpdateFlowNode: () => { }
    };
  },

  getInitialState() {
    const _nodeDefaultContent = this.props.nodeData.content || {};

    return {
      nodeSaving: false,
      nodeDefaultContent: _nodeDefaultContent,    // 原始节点内容数据
      tableDialog: {
        show: false,
        data: {}
      },
      collectorTables: _nodeDefaultContent.tables || [],
      datasourceId: _nodeDefaultContent.data_source_id || '',
      datasource: {},
      searchKeyWord: '',
      tableList: [],
      tablePage: 1,
      tableTotal: 0,
      tablePending: false
    }
  },

  componentDidMount() {
    // 如果存在数据源id则获取数据表
    if (this.state.datasourceId) {
      this._getTableList(1);
    }

    this._getDatasourceList();
  },

  componentWillReceiveProps(nextProps) {
    // 如果从不显示切换到显示 并且有数据源ID 则重新获取数据表(避免从SQL节点执行完回来表有变化)
    if (!this.props.show && nextProps.show && this.state.datasourceId) {
      this._getTableList(1);
    }
  },

  render() {
    const {
      style,
      nodeData,
      datasourceList
    } = this.props;
    // 排除datahub 中的 oracle 类型
    const datasourceFiltered = datasourceList.filter((item) => {
      if (item.type && item.type.toLowerCase() === 'datahub') {
        if (item.conn_str && JSON.parse(item.conn_str).data_base_type.toLowerCase() === 'oracle') {
          return false
        }
      }
      return true
    })

    const {
      tablePending,
      nodeSaving,
      tableDialog,
      datasourceId,
      datasource,
      nodeDefaultContent
    } = this.state;

    // 原始数据中如果有数据源则不允许修改
    const switchDatasourceDisabled = !!nodeDefaultContent.data_source_id;

    return (
      <div className="flow-panel-collector" style={style} id={`flow-panel-collector-${nodeData.id}`}>
        <div style={this.STYLE_SHEET.selectContainer}>
          <div className="form-group" style={this.STYLE_SHEET.formGroup}>
            <label className="control-label">
              <span><i className="required">*</i>选择数据源</span>
            </label>
            <div className="input-wrapper">
              <Select value={datasourceId}
                maxHeight={300}
                width="100%"
                openSearch={true}
                disabled={switchDatasourceDisabled}
                onSelected={this.handleSelectDatasource.bind(this)}
              >
                {
                  datasourceFiltered.map(item => (
                    <option value={item.id} key={item.id}>{item.name}</option>
                  ))
                }
              </Select>
            </div>
          </div>
          <div style={this.STYLE_SHEET.tableContainer}>
            {this.renderTableList()}
            {this.renderCollectorList()}
          </div>
          <Button bsStyle="primary"
            className="flow-node-foot-save-btn"
            style={this.STYLE_SHEET.saveBtn}
            onClick={this.handleSaveFlowNode}
          >
            保存
          </Button>
        </div>
        {
          tableDialog.show && (
            <TableConfigDialog show={tableDialog.show}
              data={tableDialog.data}
              datasourceId={datasourceId}
              datasource={datasource}
              getTableColumns={this.props.actions.fetchRDSTableCloumns}
              onHide={this.handleCloseTableConfig}
              onSure={this.handleSaveEditedTable}
            />
          )
        }
        <Loading show={tablePending || nodeSaving} containerId={`flow-panel-collector-${nodeData.id}`} />
      </div>
    )
  },

  // 渲染table列表
  renderTableList() {
    const {
      searchKeyWord,
      tableList,
      tablePending,
      tableTotal,
      tablePage,
      datasourceId
    } = this.state;

    const dataFields = [{
      name: '名称',
      key: 'name',
      width: '30%',
      minWidth: '100px'
    }, {
      name: '备注',
      key: 'comment',
      width: '20%',
      minWidth: '100px'
    }, {
      name: '采集方式',
      key: 'collector_model',
      minWidth: '100px',
      width: '100px'
    }, {
      name: '操作',
      key: 'actions',
      minWidth: '100px',
      width: '100px'
    }];

    const rowTemplate = (
      <div>
        <div childNodes={rowData => (
          <OverlayTrigger trigger="hover" placement="top" overlay={(<Tooltip>{rowData.name}</Tooltip>)}>
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
          const selectedTable = this._isTableSelected(rowData.name);

          let mode = ' ';

          if (selectedTable) {
            mode = selectedTable.mode;
          }

          return (
            <div style={{ width: '100%', height: '100%' }}>
              {mode}
            </div>
          );
        }} />
        <div childNodes={(rowData) => {
          const selectedTable = this._isTableSelected(rowData.name);

          rowData.isNew = true;

          let tdElement = (
            <button className="btn btn-primary btn-table-selection"
              style={this.STYLE_SHEET.btnSel}
              onClick={this.handleOpenTableConfig.bind(this, rowData)}
            >
              选择
            </button>
          );

          // 如果已选择
          if (selectedTable) {
            tdElement = (
              <div style={this.STYLE_SHEET.btnSel} className="btn-table-selection selected">
                已选择
              </div>
            );
          }

          return (
            <div style={{
              width: '100%',
              height: '100%',
              padding: '8px 0'
            }} className="select-data-table-action">
              {tdElement}
            </div>
          );
        }} />
      </div>
    );

    const emptyText = datasourceId ? '没有可显示的内容' : (
      <span>
        <i className="dmpicon-help" style={{ paddingRight: '8px' }} />
        请先在上方选择数据源
      </span>
    );

    const _fetchNextPage = tableTotal > this.PAGE_SIZE ? this._getTableList.bind(this, tablePage + 1) : false;

    return (
      <div style={{
        ...this.STYLE_SHEET.dataTableContainer,
        flex: '4 4 55%',
        maxWidth: '55%'
      }}>
        <div style={this.STYLE_SHEET.dataTableTitle}>
          <div className="form single-search-form small" style={this.STYLE_SHEET.dataTableSearchBox}>
            <Input type="text"
              placeholder="请输入关键字"
              autocomplete="off"
              value={searchKeyWord}
              onChange={this.handleChangeSearchKeyWord}
              addonAfter={<i className="dmpicon-search" />}
              className="search-input-box"
            />
            {
              searchKeyWord && <i className="dmpicon-close" onClick={this.handleClearSearchKeyWord} />
            }
          </div>
          <div style={this.STYLE_SHEET.dataTableTitleText}>
            全部
          </div>
        </div>
        <div style={{
          flex: 1,
          width: '100%',
          overflowX: 'auto'
        }}>
          <FlexDataTable
            className="datasource-table-list"
            headerHeight={40}
            headerBorder={true}
            lineHeight={40}
            tableMinWidth={500}
            pending={tablePending}
            hasNext={tableList.length < tableTotal}
            emptyText={emptyText}
            dataFields={dataFields}
            rowTemplate={rowTemplate}
            onFetchData={_fetchNextPage}
            fetchAction="click"
            data={tableList}
          />
        </div>
      </div>
    );
  },

  // 渲染已选择的采集表
  renderCollectorList() {
    const { collectorTables } = this.state;

    const dataFields = [{
      name: '名称',
      key: 'name',
      width: '40%'
    }, {
      name: '采集方式',
      key: 'collector_model',
      minWidth: '100px',
      width: '100px'
    }, {
      name: '操作',
      key: 'actions',
      minWidth: '140px',
      width: '140px'
    }];

    const rowTemplate = (
      <div>
        <div childNodes={rowData => (
          <OverlayTrigger trigger="hover" placement="top" overlay={(<Tooltip>{rowData.name}</Tooltip>)}>
            <div style={this.STYLE_SHEET.textLimit}>{rowData.name}</div>
          </OverlayTrigger>
        )} />
        <div childNodes={rowData => (
          <div style={{ width: '100%', height: '100%' }}>
            {rowData.mode || ' '}
          </div>
        )} />
        <div childNodes={(rowData) => {
          rowData.isNew = false;
          return (
            <div style={{ width: '100%', height: '100%', padding: '7px 0' }}>
              <IconButton onClick={this.handleOpenTableConfig.bind(this, rowData)}
                className="datatable-action"
                iconClass="dmpicon-edit">
                编辑
              </IconButton>
              <IconButton onClick={this.handleDeleteTable.bind(this, rowData)}
                className="datatable-action"
                iconClass="dmpicon-del"
              >
                删除
              </IconButton>
            </div>
          );
        }} />
      </div>
    );


    return (
      <div style={{
        ...this.STYLE_SHEET.dataTableContainer,
        flex: '3 3 40%',
        maxWidth: '40%'
      }}>
        <div style={this.STYLE_SHEET.dataTableTitle}>
          <div style={this.STYLE_SHEET.dataTableTitleText}>已选择</div>
        </div>
        <div style={{
          flex: 1,
          width: '100%',
          overflowX: 'auto'
        }}>
          <FlexDataTable
            className="datasource-selected-table-list"
            headerHeight={40}
            headerBorder={true}
            lineHeight={40}
            tableMinWidth={300}
            emptyText={
              <span>
                <i className="dmpicon-help" style={{ paddingRight: '8px' }} />
                您还未选择数据
              </span>
            }
            dataFields={dataFields}
            rowTemplate={rowTemplate}
            data={collectorTables}
          />
        </div>
      </div>
    );
  },

  // 打开采集表编辑窗口
  handleOpenTableConfig(data) {
    this.setState({
      tableDialog: {
        show: true,
        data
      }
    });
  },

  // 关闭采集表编辑窗口
  handleCloseTableConfig() {
    this.setState({
      tableDialog: {
        ...this.state.tableDialog,
        show: false,
      }
    });
  },

  // 保存编辑过/新增的数据表
  handleSaveEditedTable(data) {
    const collectorTables = Array.isArray(this.state.collectorTables) ? this.state.collectorTables : [];

    let isNew = true;

    const newCollectorTables = collectorTables.map((table) => {
      if (table.name === data.name) {
        table = data;
        isNew = false;
      }
      return table;
    });

    if (isNew) {
      newCollectorTables.push(data);
    }

    this.setState({
      collectorTables: newCollectorTables
    });
  },

  // 保存当前节点(提交到服务器)
  handleSaveFlowNode() {
    const { datasourceId, collectorTables } = this.state;

    // 验证合法性---必须选择数据源
    if (!datasourceId) {
      this.showErr('请选择采集的数据源');
      return;
    }

    // 验证合法性---是否有选择至少一个采集数据表
    if (collectorTables.length < 1) {
      this.showErr('请选择采集的数据表');
      return;
    }

    const nodeContent = {
      data_source_id: datasourceId,
      tables: collectorTables
    }

    this.setState({
      nodeSaving: true
    });

    this.props.actions.updateFlowNode({
      ...this.props.nodeData,
      content: nodeContent
    }, (json) => {
      if (json.result) {
        this.showSucc(json.msg);
        this.setState({
          nodeSaving: false
        });
        // 1800毫秒后关闭当前节点面板并切换到主面板
        setTimeout(() => {
          this.hideTip();
          this.props.onCloseTab(this.props.nodeData, null);
          this.props.onReturnToMain();
        }, 1800);
      } else {
        this.showErr(json.msg);
        this.setState({
          nodeSaving: false
        });
      }
    });
  },

  // 选择数据源
  handleSelectDatasource(opts) {
    // 当数据源ID未做变更时不处理
    if (this.state.datasourceId === opts.value) {
      return;
    }

    const selectedDatasource = this.props.datasourceList.filter(datasource => (
      datasource.id === opts.value
    ))[0];

    // 记录变更的数据源ID
    this.setState({
      datasourceId: opts.value,
      datasource: selectedDatasource,
      // 数据源变化时进行必要的初始化
      collectorTables: [],
      searchKeyWord: ''
    }, () => {
      this._getTableList(1);
    });
  },

  // 输入搜索关键字
  handleChangeSearchKeyWord(e) {
    this.setState({
      searchKeyWord: e.target.value
    }, () => {
      this._getTableList(1);
    });
  },

  // 清空搜索关键字
  handleClearSearchKeyWord(e) {
    e.stopPropagation();

    this.setState({
      searchKeyWord: ''
    }, () => {
      this._getTableList(1)
    });
  },

  // 删除已选择的数据表
  handleDeleteTable(rowData) {
    const newCollectorTables = this.state.collectorTables.filter(table => (
      rowData.name !== table.name
    ));

    this.setState({
      collectorTables: newCollectorTables
    });
  },

  // 获取数据源列表
  _getDatasourceList() {
    this.props.actions.fetchDataSources(1, {
      page_size: 10000,
      is_buildin: 0
    }, (json) => {
      if (json.result && this.state.datasourceId) {
        const newDatasource = json.data.items.filter(item => (
          item.id === this.state.datasourceId
        ))[0];
        this.setState({
          datasource: newDatasource
        });
      }
    });
  },

  // 判断表是否已选择
  _isTableSelected(name) {
    const collectorTables = Array.isArray(this.state.collectorTables) ? this.state.collectorTables : [];

    const result = collectorTables.filter(table => (table.name === name));

    return result.length > 0 ? result[0] : null;
  },

  // 对表格进行重排序
  _fixTableList(list, colList, kwd) {
    // 对list进行筛选，过滤已有
    const newList = list.filter(table => !this._isTableSelected(table.name));

    // 对已选择的数据表进行搜索关键字的过滤
    const newColList = colList.filter(col => (new RegExp(kwd || '.', 'g').test(col.name)))

    // 返回拼接后的数据
    return newColList.concat(newList);
  },

  // 获取数据表
  _getTableList(page) {
    const { datasourceId, searchKeyWord, collectorTables } = this.state;

    this.setState({
      tablePending: true
    });

    this.props.actions.fetchTables(datasourceId, {
      page,
      keyword: searchKeyWord || '',
      page_size: this.PAGE_SIZE,
    }, (json) => {
      if (json.result) {
        const newTableList = page > 1 ? this.state.tableList.concat(json.data.items) : json.data.items;

        this.setState({
          tableList: this._fixTableList(newTableList, collectorTables, searchKeyWord),
          tablePage: page,
          tableTotal: json.data.total,
          tablePending: false
        });
      } else {
        this.showErr(json.msg)
        this.setState({
          tableList: [],
          tablePage: 1,
          tableTotal: 0,
          tablePending: false
        });
      }
    });
  },

  // 错误提示框
  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    });
  },

  // 成功提示框
  showSucc(str) {
    this.showTip({
      status: 'success',
      content: str
    });
  },

  // 分页大小
  PAGE_SIZE: 40,

  STYLE_SHEET: {
    selectContainer: {
      padding: '30px 30px 0',
      height: '100%',
      width: '100%',
      position: 'relative'
    },
    formGroup: {
      width: '450px',
      paddingBottom: '30px',
      marginBottom: 0
    },
    saasCheck: {
      position: 'absolute',
      left: '520px',
      top: '58px'
    },
    tableContainer: {
      position: 'absolute',
      left: '30px',
      top: '127px',
      right: '30px',
      bottom: '140px',
      height: 'auto',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    // 步骤二中的表格容器
    dataTableContainer: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    },
    // 步骤二中的标题容器
    dataTableTitle: {
      width: '100%',
      height: '44px',
      padding: '10px 0'
    },
    // 步骤二中的标题文字
    dataTableTitleText: {
      fontSize: '16px',
      lineHeight: '24px',
      paddingLeft: '10px'
    },
    dataTableSearchBox: {
      float: 'right',
      width: '170px',
      position: 'relative'
    },
    // text-overflow(一个字空间)
    textLimit: {
      paddingRight: '14px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
      height: '100%'
    },
    // 选择按钮样式
    btnSel: {
      display: 'block',
      width: '66px',
      height: '22px',
      lineHeight: '20px',
      minHeight: 'initial',
      minWidth: 'initial',
      borderRadius: '22px',
      fontSize: '12px'
    },
    saveBtn: {
      position: 'absolute',
      bottom: '50px',
      left: '30px',
      width: '100px',
      minWidth: '100px',
      height: '34px',
      lineHeight: '34px'
    }
  },
})

const stateToProps = state => ({
  ...state.dataclean_flow,
  datasourceList: state.datasource.list
})
const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataCleanFlowActionCreators, dataSourceActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(FlowPanelCollector);
