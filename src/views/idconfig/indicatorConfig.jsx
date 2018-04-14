import PropTypes from 'prop-types';
import React from 'react';

import createReactClass from 'create-react-class';

import DataTable from 'react-bootstrap-myui/lib/DataTable';
import Input from 'react-bootstrap-myui/lib/Input';
import ConfigDialog from './components/ConfigDialog'
import Loading from 'react-bootstrap-myui/lib/Loading';
import IconButton from '../../components/IconButton';

import AuthComponent from '@components/AuthComponent';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as indicatorActionCreators } from '../../redux/modules/indicator/indicator';
import { actions as datasourceActionCreators } from '../../redux/modules/datasource/datasource';

import TipMixin from '../../helpers/TipMixin';
import ConfirmMixin from '../../helpers/ConfirmsMixin';

import './idconfig.less';

class AuthDataTable extends React.Component {
  static PropTypes = {
    editable: PropTypes.bool
  };

  static defaultProps = {
    editable: true
  };

  render() {
    let { dataFields, rowTemplate, editable } = this.props
    // 如果是允许编辑的情况
    if (!editable) {
      dataFields.splice(5, 1)
      rowTemplate = <tr>
        <td>%id%</td>
        <td>%name%</td>
        <td>%odps_table%</td>
        <td>%odps_field%</td>
        <td>%type%</td>
      </tr>
    }

    return <DataTable
      {...this.props}
      dataFields={dataFields}
      rowTemplate={rowTemplate} />
  }
}

const IndicatorConfig = createReactClass({
  displayName: 'IndicatorConfig',
  mixins: [TipMixin, ConfirmMixin],

  getInitialState() {
    return {
      currTypeId: '',
      tabs: ['全部', '未配置'],
      currTab: '全部',
      keyword: '',
      configDialog: {
        show: false,
        info: {}
      },
      tableList: [],
      tablesLoaded: false
    }
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  componentDidMount() {
    // 获取指标类型列表
    this.getTypeList();
    // 获取数据表
    if (!this.props.tableList[this.ODPS_DATASOURCE_ID]) {
      this.getDataTables();
    } else {
      this.setState({
        tablesLoaded: true,
        tableList: this.props.tableList[this.ODPS_DATASOURCE_ID].tables
      });
    }
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.typeList.length > 0 && nextProps.typeList.length === 0 && this.state.currTypeId) {
      this.setState({
        currTypeId: ''
      });
    }
  },

  render() {
    const { typeList, indicatorList, pending, pending_indicator } = this.props;

    const { currTypeId, currTab, tabs, keyword, configDialog, tableList, tablesLoaded } = this.state;

    // 最终显示的指标列表
    let indiList = indicatorList;

    const dataFields = [{
      idField: true,
      name: 'id'
    }, {
      name: 'name',
      text: '指标'
    }, {
      name: 'odps_table',
      text: 'ODPS表名'
    }, {
      name: 'odps_field',
      text: '字段名'
    }, {
      name: 'type',
      text: '类型'
    }, {
      name: 'column',
      text: '操作'
    }];

    const rowTemplate = (
      <tr>
        <td>%id%</td>
        <td>%name%</td>
        <td>%odps_table%</td>
        <td>%odps_field%</td>
        <td>%type%</td>
        <td width="150" childrenNode={rowData => (
          <AuthComponent pagecode="指标配置" visiblecode="edit">
            <div className="data-table-action-bar" style={{ paddingTop: '8px' }}>
              <IconButton onClick={this.handleOpenConfigDialog.bind(this, rowData)}
                className="datatable-action"
                iconClass="dmpicon-set">设置</IconButton>
              <IconButton onClick={this.handleClearConfig.bind(this, rowData)}
                className="datatable-action"
                iconClass="dmpicon-refresh">还原</IconButton>
            </div>
          </AuthComponent>
        )}></td>
      </tr>
    );

    const emptyText = (<div>暂无指标</div>);

    if (currTab === tabs[1]) {
      indiList = indiList.filter(item => !item.odps_table);
    }

    if (keyword) {
      indiList = indiList.filter(item => new RegExp(keyword, 'gi').test(item.name) || new RegExp(keyword, 'gi').test(item.type));
    }

    return (
      <div className="idconfig-indicator-config-page"
        id="idconfig-indicator-config-page"
        style={{ width: '100%', height: '100%', overflow: 'hidden' }}>

        <div className="type-list-container"
          style={this.STYLE_SHEET.typeListContainer}>
          {
            Array.isArray(typeList) && typeList.length > 0 ? (
              <ul style={this.STYLE_SHEET.listBox}>
                {
                  typeList.map((type) => {
                    const clsName = `type-list-item  ${currTypeId && currTypeId === type.id ? 'active' : ''}`;

                    return (
                      <li className={clsName}
                        style={this.STYLE_SHEET.typeListItem}
                        onClick={this.handleSelectType.bind(this, type.id)}>
                        {type.name}
                      </li>
                    );
                  })
                }
              </ul>
            ) : (
              <div style={{ paddingTop: '30px', textAlign: 'center' }}>
                  还未配置指标类型
              </div>
            )
          }
          <div className="type-list-split-line" style={this.STYLE_SHEET.splitLine}></div>
        </div>

        <div className="indicator-list-container"
          style={this.STYLE_SHEET.indicatorListContainer}>
          <div className="indicator-list-title"
            style={{ width: '100%', height: '50px' }}>
            <div className="indicator-list-tab-container" style={{ height: '50px', float: 'left' }}>
              {
                tabs.map(tab => (
                  <div className={`indicator-list-tab ${tab === currTab ? 'active' : ''}`}
                    style={{ height: '50px', padding: '0 15px', float: 'left', cursor: 'pointer' }}
                    onClick={this.handleChangeTab.bind(this, tab)}>
                    <div className="indicator-list-tab-inner"
                      style={{ height: '50px', lineHeight: '50px', padding: '0 4px', position: 'relative' }}>
                      {tab}
                    </div>
                  </div>
                ))
              }
            </div>

            <div className="form single-search-form"
              style={{ float: 'right', width: '330px', margin: '10px 20px 0 0' }}>
              <Input type="text"
                placeholder="模糊搜索"
                value={keyword}
                onChange={this.handleChangeKeyword}
                addonAfter={<i className="dmpicon-search" />}
                className="search-input-box" />
              {
                keyword && <i className="dmpicon-close" onClick={this.handleClearKeyword}></i>
              }
            </div>
          </div>
          <div className="indicator-list-box"
            style={this.STYLE_SHEET.listScrollBox}
            onScroll={this.handleFixTableHead}>
            <AuthComponent pagecode="指标配置" enablePointer={false} editProp="editable">
              <AuthDataTable
                tableWrapperId='indicator-datatable-wrapper'
                hover
                serialNumber={false}
                bordered={false}
                emptyText={emptyText}
                dataFields={dataFields}
                data={indiList}
                rowTemplate={rowTemplate} />
            </AuthComponent>
          </div>
        </div>

        {
          configDialog.show && (
            <ConfigDialog
              show={configDialog.show}
              data={configDialog.info}
              tableList={tableList}
              datasourceId={this.ODPS_DATASOURCE_ID}
              getTableColumns={this.props.actions.fetchTableColumns}
              onSure={this.handleSubmitConfig.bind(this)}
              onHide={this.handleCloseConfigDialog.bind(this)} />
          )
        }
        <Loading show={pending || pending_indicator || !tablesLoaded}
          containerId='idconfig-indicator-config-page' />
      </div>
    );
  },

  // 打开指标配置窗口
  handleOpenConfigDialog(data) {
    this.setState({
      configDialog: {
        show: true,
        info: data || {}
      }
    });
  },

  // 提交配置
  handleSubmitConfig(data) {
    this.props.actions.fetchConfigIndicator(data, (json) => {
      if (json.result) {
        this.showSucc(json.msg);
        this.handleCloseConfigDialog();
      } else {
        this.showErr(json.msg);
      }
    });
  },

  // 关闭指标配置窗口
  handleCloseConfigDialog() {
    this.setState({
      configDialog: {
        show: false,
        info: {}
      }
    });
  },

  // 清空配置
  handleClearConfig(data) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要清空该指标配置吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.fetchConfigIndicator({
          id: data.id,
          odps_field: '',
          odps_table: ''
        }, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg || '清空失败');
          } else {
            this.showSucc('清空成功');
          }
        })
      }
    });
  },

  // 关键字输入
  handleChangeKeyword(e) {
    this.setState({
      keyword: e.target.value
    });
  },

  // 清除搜索关键字
  handleClearKeyword(e) {
    e.stopPropagation();

    this.setState({
      keyword: ''
    });
  },

  // 切换TAB
  handleChangeTab(currTab) {
    this.setState({
      currTab
    });
  },

  // 选择指标类型
  handleSelectType(id) {
    this.setState({ currTypeId: id });
    this.getIndicatorList(id);
  },

  // 滚动固定表头
  handleFixTableHead(e) {
    const s_top = $(e.currentTarget).scrollTop();
    if (s_top > 0) {
      $('#indicator-datatable-wrapper thead')
        .addClass('scrolling-thead')
        .css({ transform: `translateY(${s_top}px)` });
    } else {
      $('#indicator-datatable-wrapper thead')
        .removeClass('scrolling-thead')
        .css({ transform: 'none' });
    }
  },

  // 获取指标类型列表
  getTypeList() {
    this.props.actions.fetchTypeList({
      tmpl_id: this.props.templateId
    }, (json) => {
      if (json.result) {
        if (json.data.length > 0) {
          const currTypeId = json.data[0].id;
          this.setState({ currTypeId });
          this.getIndicatorList(currTypeId);
        }
      } else {
        this.showErr(json.msg);
      }
    });
  },

  // 获取指标列表
  getIndicatorList(typeId) {
    this.props.actions.fetchIndicatorList({
      tmpl_id: this.props.templateId,
      type_id: typeId
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      }
    });
  },

  getDataTables() {
    this.props.actions.fetchTables(this.ODPS_DATASOURCE_ID, {
      page_size: 100000,
      page: 1
    }, (json) => {
      if (json.result) {
        this.setState({
          tablesLoaded: true,
          tableList: json.data.items
        });
      } else {
        this.setState({
          tablesLoaded: true
        });
        this.showErr(json.msg);
      }
    });
  },

  showSucc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  },

  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    })
  },

  STYLE_SHEET: {
    listBox: {
      width: '100%',
      height: '100%',
      overflow: 'auto'
    },
    listScrollBox: {
      position: 'absolute',
      left: '222px',
      top: '50px',
      right: 0,
      bottom: 0,
      overflow: 'auto'
    },
    typeListContainer: {
      width: '222px',
      height: '100%',
      float: 'left',
      paddingRight: '1px',
      position: 'relative',
      zIndex: 2
    },
    typeListItem: {
      width: '100%',
      height: '50px',
      lineHeight: '49px',
      padding: '0 65px 0 26px',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      cursor: 'default',
      position: 'relative',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    splitLine: {
      width: '1px',
      height: '100%',
      position: 'absolute',
      right: 0,
      top: 0
    },
    indicatorListContainer: {
      width: '100%',
      paddingLeft: '222px',
      height: '100%',
      position: 'relative'
    },
  },

  // ODPS表数据源ID
  ODPS_DATASOURCE_ID: '00000000-1111-1111-1111-000000000000',
});

const stateToProps = state => ({
  ...state.indicator,
  tableList: state.datasource.tableList
});

const dispatchToProps = dispatch => ({ actions: bindActionCreators(Object.assign({}, indicatorActionCreators, datasourceActionCreators), dispatch) });

export default connect(stateToProps, dispatchToProps)(IndicatorConfig);
