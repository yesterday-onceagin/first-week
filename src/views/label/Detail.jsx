import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';
import DataTable from 'react-bootstrap-myui/lib/DataTable';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Row from 'react-bootstrap-myui/lib/Row';
import Col from 'react-bootstrap-myui/lib/Col';
import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import Loading from 'react-bootstrap-myui/lib/Loading';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as commonActionCreators } from '../../redux/modules/common';
import { actions as labelListActionCreators } from '../../redux/modules/label/list';
import IndicatorDialog from '../../components/IndicatorDialog';
import indicatorTree from '../../helpers/indicatorTree';
import { baseAlias } from '../../config';
import ConfirmMixin from '../../helpers/ConfirmsMixin';
import TipMixin from '../../helpers/TipMixin';
import { DEFAULT_PAGINATION_OPTIONS } from '../../constants/paginationOptions';
import './detail.less';

const LabelDetail = createReactClass({
  displayName: 'LabelDetail',
  mixins: [TipMixin, ConfirmMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      total: 0,
      page: 1,
      pending: false,
      sortCol: { // 排序字段
        id: '', // 指标id
        method: '' // 1-升序. 0-降序
      },
      select_indicators: [],
      list: [], // 所得数据
      export_dialog: {  // 弹窗
        show: false,
        info: {
          format: 1,
          hit: 1,
          type: 0
        }
      },
      indicator_dialog: {
        show: false
      }
    }
  },

  componentDidMount() {
    // 初始化
    this.fetchList();
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar([{
      name: '标签定义',
      url: '/label/list'
    }, {
      name: `标签明细（${this.props.params.detail_name}）`
    }], [{
      text: '导出文件',
      icon: 'dmpicon',
      pagecode: '标签定义',
      visiblecode: 'edit',
      ref: 'full-btn',
      func: this.handleOpenExportDialog
    }, {
      text: '任务列表',
      icon: 'dmpicon',
      style: 'green',
      func: this.handleTaskList
    }]);
  },

  render() {
    const { page, list, total, indicator_dialog, pending, select_indicators } = this.state;
    const { allIndicators } = this.props;
    const pagination = {
      ...DEFAULT_PAGINATION_OPTIONS,
      activePage: page,
      onChangePage: this.handleChangePage,
      total
    };

    return (
      <div className="modules-page-container">
        <div className='label-detail-page'>
          <DataTable
            tableWrapperId='datatable-wrapper'
            pagination={pagination}
            hover
            serialNumber
            bordered={false}
            dataFields={this.DATAFIELDS}
            rowTemplate={this.ROWTEMPLATE}
            emptyText={this.EMPTYTEXT}
            data={list || []}
          />
          <Loading show={pending} containerId="datatable-wrapper" />
        </div>
        {this.renderExportDialog()}
        {indicator_dialog.show && <IndicatorDialog
          show={indicator_dialog.show}
          pending={this.props.pending}
          type="全部指标"
          maxSize={6}
          data={{ 全部指标: indicatorTree(allIndicators) }}
          info={select_indicators}
          onSure={this.handleSureDialog}
          onClose={this.handleCloseDialog}
        />}
      </div>
    )
  },

  renderExportDialog() {
    const { export_dialog, select_indicators } = this.state
    const info = export_dialog.info
    const btn_style = {
      minWidth: 'auto',
      minHeight: '32px',
      lineHeight: '32px',
      height: '32px',
      fontSize: '14px',
      padding: '0 20px'
    }
    return export_dialog.show && <Dialog
      show={export_dialog.show}
      backdrop="static"
      onHide={this.handleHideDialog}
      size={{ width: '600px', height: '365px' }}
      className="down-setting-dialog">
      <Dialog.Header closeButton>
        <Dialog.Title>导出设置</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <div className="form">
          <Row>
            <Col md={2}>导出指标</Col>
            <Col md={10}>
              <Button bsStyle="primary" style={btn_style} onClick={this.handleOpenIndicator}>选择指标</Button>
              <span style={{ marginLeft: '10px' }}>{`已选 ${select_indicators.length} 个指标`}</span>
            </Col>
          </Row>
          <Row>
            <Col md={2}>导出格式</Col>
            <Col md={5}>
              <Input
                type="radio"
                checked={+info.format === 1}
                onChange={this.handleChangeInfo.bind(this, 'format', 1)}
                label="txt"
              />
            </Col>
            <Col md={5}>
              <Input
                type="radio"
                checked={+info.format === 0}
                onChange={this.handleChangeInfo.bind(this, 'format', 0)}
                label="csv"
              />
            </Col>
          </Row>
          <Row>
            <Col md={2}>压缩</Col>
            <Col md={5}>
              <Input
                type="radio"
                checked={+info.hit === 1}
                onChange={this.handleChangeInfo.bind(this, 'hit', 1)}
                label="zip"
              />
            </Col>
          </Row>
          <Row>
            <Col md={2}>是否分文件</Col>
            <Col md={10}>
              <div className="item">
                <Input
                  type="radio"
                  checked={+info.type === 0}
                  onChange={this.handleChangeInfo.bind(this, 'type', 0)}
                  label="生成单表文件（可下载单表文件，但会影响速度）"
                />
              </div>
              <div className="item">
                <Input
                  type="radio"
                  checked={+info.type === 1}
                  onChange={this.handleChangeInfo.bind(this, 'type', 1)}
                  label="生成多文件，根据线程数自动划分"
                />
              </div>
            </Col>
          </Row>
          <div className="footer">
            <Button bsStyle="primary" style={btn_style} onClick={this.handleExport}>导出</Button>
          </div>
        </div>
      </Dialog.Body>
    </Dialog>;
  },

  handleSureDialog(info) {
    this.state.select_indicators = info
    this.handleCloseDialog()
  },

  handleCloseDialog() {
    this.state.indicator_dialog.show = false
    this.setState({ ...this.state })
  },

  handleOpenExportDialog() {
    this.state.export_dialog.show = true
    this.setState({
      ...this.state
    })
  },

  handleOpenIndicator() {
    this.state.indicator_dialog.show = true
    this.setState({
      ...this.state
    }, () => {
      this.props.actions.fetchAllIndicator({
        tmpl_id: this.props.params.tmpl_id
      })
    })
  },

  handleExport() {
    const { actions, params, total } = this.props
    const { select_indicators, export_dialog } = this.state
    const info = export_dialog.info
    // 导出文件开始
    actions.exportFile({
      id: params.detail_id,
      name: params.detail_name,
      indicators: select_indicators.map(item => item.id).join(','),
      total_amount: total,
      format: +info.format === 0 ? 'csv' : 'txt',
      is_compressed: info.hit,
      is_mutifile: info.type
    })

    this.state.export_dialog.show = false

    this.setState({
      ...this.state
    }, () => {
      this.showSuccess('导出文件需要一定时间，可进入任务列表查看导出结果', 3000)
    })
  },

  handleHideDialog() {
    this.state.export_dialog.show = false
    this.setState({
      ...this.state
    })
  },

  handleChangeInfo(field, value) {
    this.state.export_dialog.info[field] = value
    this.setState({ ...this.state })
  },

  handleTaskList() {
    const { params } = this.props
    this.context.router.push(`${baseAlias}/label/downtask/${params.detail_id}/${params.detail_name}/${params.tmpl_id}`)
  },

  handleChangePage(event, selectEvent) {
    this.setState({
      page: selectEvent.eventKey
    }, this.fetchList)
  },

  handleSortTable(item) {
    const { sortCol } = this.state

    // 默认是降序
    let _sortCol = {
      id: item.id,
      method: 'DESC'
    }

    // 如果是点击相同的列和排序方式。则为取消, 设置为初始值
    if (sortCol && sortCol.id === item.id) {
      // 如果上次是升序. 则清空当前排序
      if (sortCol.method === 'ASC') {
        _sortCol = {
          id: '',
          method: ''
        }
      } else if (sortCol.method === 'DESC') {
        _sortCol.method = 'ASC'
      }
    }

    this.setState({
      sortCol: _sortCol
    }, this.fetchList)
  },

  fetchList() {
    const { params, actions } = this.props
    this.setState({ pending: true })

    const fetchLabel = () => {
      actions.fetchLabelDetail({
        id: params.detail_id,
        page_size: DEFAULT_PAGINATION_OPTIONS.pageSize,
        page: this.state.page,
        sorts: this.state.sortCol.id ? JSON.stringify([this.state.sortCol]) : ''
      }, (json) => {
        this.setState({ pending: false })
        if (json.result) {
          this._convertData(this.COLS, json.data)
        }
      })
    }

    if (+this.state.page === 1) {
      actions.fetchLabelCol({ id: params.detail_id }, (cols) => {
        if (cols.result) {
          this.COLS = cols.data
          // 同时更新一份到导出文件的弹窗
          this.setState({
            select_indicators: cols.data.slice().map(item => Object.assign(item, { id: item.indicator_id, name: item.indicator_name }))
          })
          fetchLabel()
        } else {
          this.setState({ pending: false })
        }
      })
    } else {
      fetchLabel()
    }
  },

  _renderNode(name, rowData) {
    const tooltip = <Tooltip placement="bottom" className="in" id="tooltip-bottom">{rowData[name] || '-'}</Tooltip>

    let dom = <div style={{ textAlign: 'left' }}>
      <a href="javascript:;">360画像</a>&nbsp;&nbsp;
    </div>

    if (name !== 'opt') {
      dom = <OverlayTrigger placement="bottom" overlay={tooltip}><span>{rowData[name] || '-'}</span></OverlayTrigger>
    }

    return dom
  },

  _createTableOptions(fields) {
    const { sortCol } = this.state
    // 重置
    this.DATAFIELDS = [{
      idField: true,
      name: '序号'
    }]

    fields.forEach((item) => {
      this.DATAFIELDS.push({
        name: item.name,
        text: () => {
          let classes = ''
          if (sortCol.id === item.id && sortCol.method === 'ASC') {
            classes = 'asc'
          } else if (sortCol.id === item.id && sortCol.method === 'DESC') {
            classes = 'desc'
          }
          return (
            <div onClick={this.handleSortTable.bind(this, item)} style={{ cursor: 'pointer' }}>
              <span>{item.name}</span>
              <span className={`sort-opts ${classes}`}>
                <i className="dmpicon-triangle-up asc"></i>
                <i className="dmpicon-triangle desc"></i>
              </span>
            </div>
          )
        }
      })
    })

    const tds = []
    // 对应行数据
    this.DATAFIELDS.forEach((item) => {
      tds.push(<td
        childrenNode={this._renderNode.bind(this, item.name)}
        style={item.name === 'id' ? { display: 'none' } : null}
        width={item.name === 'opt' ? '120px' : 'auto'}>
        {null}
      </td>);
    })

    this.ROWTEMPLATE = <tr />;
    this.ROWTEMPLATE.props.children = tds;
  },

  _convertData(cols, data) {
    const fields = []
    let col_name = {}
    cols.forEach((item) => {
      fields.push({
        id: item.indicator_id,
        name: item.indicator_name,
        rank: item.rank
      })
      col_name = {
        ...col_name,
        [`${item.odps_table}_${item.odps_field}`]: item
      }
    })

    const _list = []
    data.items.forEach((item, i) => {
      let _item = {}
      // 每行的数据进行列解析
      Object.keys(item).forEach((col) => {
        if (col === 'master_id') {
          _item.id = item[col]
        } else {
          _item = {
            ..._item,
            [col_name[col].indicator_name]: item[col]
          }
        }
      })
      _list.push(_item)

      if (i === 0) {
        fields.sort((a, b) => a.rank - b.rank)
        this._createTableOptions(fields);
      }
    })
    //  localStorage
    localStorage.setItem('total_amount', data.total)

    this.setState({
      list: _list,
      total: +data.total
    })
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

  COLS: null,

  DATAFIELDS: [{
    idField: true,
    name: '序号'
  }],

  ROWTEMPLATE: null,
  EMPTYTEXT: '没有可显示的数据!',
});

const stateToProps = state => ({
  ...state.common,
  ...state.labelList
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign(labelListActionCreators, commonActionCreators), dispatch)
});

export default connect(stateToProps, dispatchToProps)(LabelDetail);
