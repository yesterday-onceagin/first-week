import React from 'react'
import PropTypes from 'prop-types'

import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import Input from 'react-bootstrap-myui/lib/Input';
import Select from 'react-bootstrap-myui/lib/Select';
import Col from 'react-bootstrap-myui/lib/Col';
import { Select as TreeSelect, Tree } from 'rt-tree';
import FlexDataTable from '../../components/FlexDataTable';
import IconButton from '../../components/IconButton';
import SwitchButton from '../../components/SwitchButton';

import AuthComponent from '@components/AuthComponent';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as commonActionCreators } from '../../redux/modules/common';
import { actions as labelListActionCreators } from '../../redux/modules/label/list';

import TipMixin from '../../helpers/TipMixin';
import ConfirmMixin from '../../helpers/ConfirmsMixin';
import { getCronDesc, decodeCron } from '../../helpers/cron';
import XStorage from '../../helpers/XStorage';
import { getArrayFromTree, getFirstValidNode } from '../../helpers/groupTreeUtils';

import { baseAlias } from '../../config';
import 'rt-tree/dist/css/rt-select.css';
import './list.less';

let searchTimer = null; // 查询延时器。避免输入频繁请求

const DataCleanList = createReactClass({
  displayName: 'DataCleanList',

  //mixin提示框 和确定框 弹窗
  mixins: [TipMixin, ConfirmMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      uuid: new Date().getTime(),
      org_id: '',
      org_name: '',
      tmpl_id: '',
      keyword: ''
    }
  },

  componentDidMount() {
    const { actions, searchParams } = this.props
    // 默认组织机构为第1个有权限的
    actions.fetchOrgTrees((json) => {
      if (json.result && json.data.length > 0) {
        const orgArray = getArrayFromTree(json.data)
        const firstValidOrg = getFirstValidNode(json.data)
        const savedOrgId = XStorage.getValue(`ORG_ID-${XStorage.getValue('tenant_code')}-${XStorage.getValue('account')}`)

        const savedOrg = orgArray.filter(item => item.id === savedOrgId && !item.disable);

        if (savedOrgId && savedOrg.length > 0) {
          this.setState({
            org_id: savedOrg[0].id,
            org_name: savedOrg[0].name
          }, () => {
            this.fetchLabelList();
          });
        } else {
          this.setState({
            org_id: firstValidOrg.id,
            org_name: firstValidOrg.name
          }, () => {
            this.fetchLabelList();
          });
        }
      }
    });

    actions.fetchTemplates(null, (json) => {
      if ((!searchParams || !searchParams.tmpl_id) && json.data.items.length > 0) {
        this.setState({
          tmpl_id: json.data.items[0].id
        }, () => {
          this.fetchLabelList()
        })
      }
    })

    if (searchParams) {
      this.setState({
        ...searchParams
      }, this.fetchLabelList)
    }

    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('标签定义', [{
      text: '新增标签',
      icon: 'dmpicon-add',
      pagecode: '标签定义',
      visiblecode: 'edit',
      ref: `add-btn-${this.state.uuid}`,
      style: '',
      func: this.handleAdd
    }]);
  },

  render() {
    //是否加载 和对应的list列表字段
    const { list, pending, page, total } = this.props;

    const scheduleTypes = {
      month: '月',
      week: '周',
      day: '天',
      hour: '小时'
    };

    // 数据表格表头字段
    const dataFields = [{
      idField: true,
      name: '序号'
    }, {
      name: '标签名称',
      key: 'name',
      sortable: true,
      width: '12%'
    }, {
      key: 'cover_count',
      name: '标签覆盖',
      width: '110px',
      sortable: true
    }, {
      key: 'schedule_type',
      name: '调度依赖',
      width: '110px'
    }, {
      key: 'schedule_desc',
      name: '调度时间/依赖流程',
      width: '15%',
      minWidth: '140px'
    }, {
      key: 'status',
      name: '状态',
      width: '120px',
      flex: 1,
      minWidth: '60px'
    }, {
      key: 'schedule_option',
      name: '调度配置',
      width: '120px'
    }, {
      key: 'actions',
      name: '操作',
      width: '300px'
    }];

    // 数据表格行模版
    const rowTemplate = (
      <div>
        <div>%id%</div>
        <div childNodes={rowData => (
          <OverlayTrigger trigger="hover" placement="top" overlay={ (<Tooltip>{rowData.name}</Tooltip>) }>
            <div style={this.STYLE_SHEET.textLimit}>{rowData.name}</div>
          </OverlayTrigger>
        )}/>
        <div>%cover_count%</div>
        <div childNodes={(rowData) => {
          let text = '周期（天）';
          if (rowData.depend_flow_id) {
            text = '流程';
          } else if (rowData.schedule) {
            text = `周期（${scheduleTypes[decodeCron(rowData.schedule).type]}）`;
          }
          return (
            <div style={{ width: '100%', height: '100%' }}>{text}</div>
          );
        }}/>
        <div childNodes={(rowData) => {
          let text = '每天的00:00';
          if (rowData.depend_flow_id) {
            text = rowData.depend_flow_name;
          } else if (rowData.schedule) {
            text = getCronDesc(rowData.schedule);
          }
          return (
            <OverlayTrigger trigger="hover" placement="top" overlay={ (<Tooltip>{text}</Tooltip>) }>
              <div style={this.STYLE_SHEET.textLimit}>{text}</div>
            </OverlayTrigger>
          );
        }}/>
        <div childNodes={(rowData) => {
          const runStatusClsMap = {
            已创建: 'run-status-created',
            运行中: 'run-status-runing',
            已成功: 'run-status-success',
            已失败: 'run-status-failed',
            已终止: 'run-status-aborted'
          };

          return (
            <div style={{ fontSize: '12px', width: '100%', height: '100%', minWidth: '60px' }}
              className={runStatusClsMap[rowData.run_status] || 'run-status-default'}>
              {rowData.run_status || '未开始'}
            </div>
          );
        }}/>
        <div childNodes={rowData => (
          <div style={{ padding: '8px 0', width: '100%', height: '100%' }}>
            <AuthComponent pagecode="标签定义" editProp="editable">
              <SwitchButton active={rowData.status === '启用'}
                texts={{ on: '启用', off: '停用' }}
                turnOn={this.handleStartFlow.bind(this, rowData.id)}
                turnOff={this.handleStopFlow.bind(this, rowData.id)}/>
            </AuthComponent>
          </div>
        )}/>
        <div childNodes={rowData => (
          <div style={{ padding: '8px 0', width: '100%', height: '100%' }}>
            <AuthComponent pagecode="标签定义" visiblecode="edit">
              <IconButton onClick={this.handleRunFlow.bind(this, rowData.id)}
                className="datatable-action"
                iconClass="dmpicon-run">运行</IconButton>
            </AuthComponent>

            <IconButton onClick={this.handleDetail.bind(this, rowData)}
              className="datatable-action"
              iconClass="dmpicon-view">明细</IconButton>

            <AuthComponent pagecode="标签定义" visiblecode="edit">
              <IconButton onClick={this.handleEdit.bind(this, rowData)}
                className="datatable-action"
                iconClass="dmpicon-edit">编辑</IconButton>
            </AuthComponent>
               
            <AuthComponent pagecode="标签定义" visiblecode="edit">
              <IconButton onClick={this.handleDelete.bind(this, rowData.id)}
                className="datatable-action"
                iconClass="dmpicon-del">删除</IconButton>
            </AuthComponent>

            <IconButton onClick={this.handleViewFlow.bind(this, rowData)}
              className="datatable-action"
              iconClass="dmpicon-monitor">运维</IconButton>
          </div>
        )}/>
      </div>
    );

    return (
      <div className="modules-page-container">
        <div className="data-view label-list-page">
          {this.renderTabbar()}
          <div className="table-view">
            <FlexDataTable
              flexDataTableId="datatable-wrapper"
              headerHeight={40}
              headerCellBorder={true}
              lineHeight={40}
              pending={pending}
              hasNext={list.length < total}
              dataFields={dataFields}
              rowTemplate={rowTemplate}
              onChangeSorts={this.handleChangeSorts}
              onFetchData={total > this.PAGE_SIZE ? this.fetchLabelList.bind(this, page + 1) : false}
              fetchAction="scroll"
              data={list}
            />
            <Loading show={pending} containerId='datatable-wrapper'/>
          </div>
        </div>
      </div>
    )
  },

  // 渲染tab栏
  renderTabbar() {
    const { keyword, org_id, tmpl_id } = this.state;
    const { orgTrees, templatesList } = this.props
    return (
      <div className="dataview-tab" style={{ padding: '20px 12px' }}>
        <div className="form">
          <Col md={2}>组织机构</Col>
          <Col md={10}>
            <TreeSelect search style={{ width: '100%' }} menuStyle={{ width: '100%', maxHeight: 300 }}>
              <Tree
                defaultExpanded={orgTrees.length > 0 ? [orgTrees[0].id] : []}
                data={orgTrees || []}
                selected={[org_id]}
                disabled={node => node.disable}
                onSelect={this.handleSelectTree}
                onChange={this.handleChangeTree}
              />
            </TreeSelect>
          </Col>
        </div>
        <div className="form">
          <Col md={2}>指标模板</Col>
          <Col md={10}>
            <Select
              value={tmpl_id}
              maxHeight={180}
              width={240}
              openSearch
              onSelected={this.handleSelect}
            >
              {
                templatesList.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))
              }
            </Select>
          </Col>
        </div>
        <div className="form single-search-form" style={{ float: 'right', width: '310px' }}>
          <Input type="text"
            placeholder="请输入关键字"
            value={keyword}
            onChange={this.handleChangeKeyword}
            addonAfter={<i className="dmpicon-search"/>}
            className="search-input-box"
          />
          {
            keyword && <i className="dmpicon-close" onClick={this.handleClearKeyword}/>
          }
        </div>
      </div>
    );
  },

  handleClearKeyword() {
    this.setState({
      keyword: ''
    }, this.fetchLabelList.bind(this, 1));
  },

  handleSelect(option) {
    this.setState({
      tmpl_id: option.value
    }, this.fetchLabelList)
  },

  handleSelectTree(select, value, options) {
    if (options.disable) {
      return false
    }
    return true
  },

  handleChangeTree(value, options) {
    const { org_id } = this.state;
    if (org_id !== value[0]) {
      // 缓存组织机构id
      XStorage.setValue(`ORG_ID-${XStorage.getValue('tenant_code')}-${XStorage.getValue('account')}`, value[0]);
      this.setState({
        org_id: value[0],
        org_name: options[0].name
      }, this.fetchLabelList)
    }
  },

  // 切换排序数组(sorts) 
  handleChangeSorts(sorts) {
    this.fetchLabelList(1, sorts);
  },

  // 运行一个流程
  handleRunFlow(id) {
    this.props.actions.fetchRunFlow(id, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSuccess(json.msg);
      }
    });
  },

  handleDetail(item) {
    this.context.router.push(`${baseAlias}/label/detail/${item.id}/${item.name}/${this.state.tmpl_id}`);
  },

  // 编辑一个流程
  handleEdit(item) {
    const { org_id, tmpl_id, org_name } = this.state
    this.context.router.push(`${baseAlias}/label/add/${org_id}/${org_name}/${tmpl_id}/${item.id}/${item.name}`);
  },

  // 删除一个流程
  handleDelete(id) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该标签吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.deleteLabel({ id }, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg);
          } else {
            this.showSuccess(json.msg || '删除成功！');
            this.fetchLabelList()
          }
        })
      }
    });
  },

  // 查看一个流程的运维状态
  handleViewFlow(item) {
    this.context.router.push(`${baseAlias}/flow/ops/${item.id}/${item.name}`);
  },

  // 配置内置流程调度(打开弹窗)
  handleDispatchFlow(item) {
    this.setState({
      dispatchDialog: {
        show: true,
        flow: item
      }
    });
  },

  // 关闭内置流程调度配置窗口
  handleCloseDispatchDialog() {
    this.setState({
      dispatchDialog: {
        show: false
      }
    });
  },

  // 启用一个清洗流程
  handleStartFlow(id) {
    this.props.actions.fetchEnableFlow(id, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSuccess(json.msg);
      }
    });
  },

  // 禁用一个清洗流程
  handleStopFlow(id) {
    this.props.actions.fetchDisableFlow(id, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSuccess(json.msg);
      }
    });
  },

  // 打开新增数据清洗对话框
  handleAdd() {
    const { tmpl_id, org_id, org_name } = this.state
    this.context.router.push(`${baseAlias}/label/add/${org_id}/${org_name}/${tmpl_id}`);
  },

  // 输入搜索关键字
  handleChangeKeyword(e) {
    // 清空现有的延时器
    clearTimeout(searchTimer)
    this.setState({
      keyword: e.target.value
    }, () => {
      searchTimer = setTimeout(this.fetchLabelList.bind(this, 1), 300)
    });
  },

  // 拉取清洗的列表
  fetchLabelList(page = 1, sorts = undefined) {
    const { keyword, tmpl_id, org_id, org_name } = this.state;

    if (!!org_id && !!tmpl_id) {
      let _sorts = '';

      if (Array.isArray(sorts) && sorts.length > 0) {
        _sorts = JSON.stringify(sorts)
      } else if (sorts === undefined) {
        _sorts = this.props.sorts || '';
      }

      this.props.onChangeIconButton(`add-btn-${this.state.uuid}`, { style: '' })
      this.props.actions.fetchLabelList({
        page,
        org_id,
        org_name,
        tmpl_id,
        keyword,
        page_size: this.PAGE_SIZE,
        sorts: _sorts
      });
    } else {
      this.props.onChangeIconButton(`add-btn-${this.state.uuid}`, { style: 'hidden' })
    }
  },

  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    });
  },

  showSuccess(str) {
    this.showTip({
      status: 'success',
      content: str
    });
  },

  PAGE_SIZE: 40,

  // 样式表
  STYLE_SHEET: {

    // text-overflow(一个字空间)
    textLimit: {
      paddingRight: '14px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
      height: '100%'
    }
  },
})

const stateToProps = state => ({
  ...state.common,
  ...state.labelList
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign(labelListActionCreators, commonActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DataCleanList);
