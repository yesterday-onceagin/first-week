import React from 'react'
import PropTypes from 'prop-types'
import Loading from 'react-bootstrap-myui/lib/Loading';
import DataTable from 'react-bootstrap-myui/lib/DataTable';
import Dialog from 'react-bootstrap-myui/lib/Dialog';

import AuthComponent from '@components/AuthComponent';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as labelDetailDownTaskActions } from '../../redux/modules/label/downTask';
import { DEFAULT_PAGINATION_OPTIONS } from '../../constants/paginationOptions';
import { baseAlias } from '../../config';

import './down-task.less';

class LabelDetailDownTask extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  state = {
    pageSize: 10,
    historyDialog: {
      show: false,
      job_id: ''
    }
  };

  componentWillMount() {
    const { params } = this.props
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar([{
      name: '标签定义',
      url: '/label/list'
    }, {
      name: `标签明细（${params.detail_name}）`,
      url: `/label/detail/${params.detail_id}/${params.detail_name}/${params.tmpl_id}`
    }, {
      name: '导出任务列表'
    }]);
  }

  componentDidMount() {
    const { actions, params } = this.props
    // 拉取文件列表
    actions.fetchList({
      page: 1,
      page_size: this.state.pageSize,
      flow_name: params.detail_name,
      total_amount: +localStorage.getItem('total_amount')
    })
  }

  render() {
    const { task } = this.props
    const { list, pending, total, currentPage } = task
    const { pageSize } = this.state

    const dataFields = [{
      idField: true,
      name: 'id'
    }, {
      name: 'name',
      text: '标签名'
    }, {
      name: 'description',
      text: '任务名'
    }, {
      name: 'status',
      text: '状态'
    }, {
      name: 'format',
      text: '导出格式'
    }, {
      name: 'is_compressed',
      text: '压缩'
    }, {
      name: 'created_on',
      text: '执行时间'
    }, {
      text: '操作'
    }];

    const rowTemplate = (
      <tr>
        <td>%id%</td>
        <td className="cell-name">%name%</td>
        <td className="cell-cust-name">%description%</td>
        <td className="cell-name" childrenNode={rowData => this.renderStatusColumn(rowData)}></td>
        <td className="cell-code">%format%</td>
        <td className="cell-description" childrenNode={rowData => this.renderCompressedColumn(rowData)}></td>
        <td className="cell-created_on" childrenNode={rowData => this.renderCreatOnColumn(rowData)}></td>
        <td className="cell-operation" style={{ width: '180px', textAlign: 'left' }} childrenNode={rowData => this.renderCustomColumn(rowData)}></td>
      </tr>
    );

    let emptyText = (
      <p>暂时没有下载任务</p>
    );

    if (pending && (!list || list.length <= 0)) {
      emptyText = (<p>数据加载中...</p>)
    }

    const pagination = {
      ...DEFAULT_PAGINATION_OPTIONS,
      activePage: currentPage,
      onChangePage: this.handleChangePage.bind(this, 'task'),
      pageSize,
      total
    };

    return (
      <div className="modules-page-container">
        <div className="label-detail-downtask-page data-view ">
          {/*<div className="table-tips">友情提示：导出任务的文件只保留24小时，在任务执行后请确保尽快下载</div>*/}
          <DataTable
            tableWrapperId='datatable-wrapper'
            hover
            serialNumber
            bordered={false}
            dataFields={dataFields}
            data={list}
            rowTemplate={rowTemplate}
            emptyText={emptyText}
            pagination={pagination} />

          <Loading show={pending} containerId='datatable-wrapper' />
        </div>
        {this.renderHistoryDialog()}
      </div>

    )
  }

  renderStatusColumn = (rowData) => {
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
        {rowData.run_status}
      </div>
    );
  };

  renderCompressedColumn = rowData => (+rowData.is_compressed === 0 ? '无' : 'zip');

  renderCreatOnColumn = rowData => (
    <span>{rowData.created_on ? rowData.created_on.replace('T', '  ') : ''}</span>
  );

  renderCustomColumn = rowData => (
    <span>
      {
        rowData.run_status === '已成功' && (
          <AuthComponent pagecode="标签定义" visiblecode="edit">
            <a className="link-button"
              href="javascript:;"
              onClick={this.handleDownLoad.bind(this, rowData)}>下载</a>
          </AuthComponent>
        )
      }
      <a className="link-button"
        href="javascript:;"
        onClick={this.handleGolog.bind(this, rowData)}>日志</a>
      <a className="link-button"
        href="javascript:;"
        onClick={this.handleHistoryDown.bind(this, rowData)}>下载记录</a>
    </span>
  );

  renderHistoryDialog = () => {
    const { history } = this.props
    const { list, total, pending, currentPage } = history

    const { historyDialog } = this.state

    const dataFields = [{
      idField: true,
      name: 'id'
    }, {
      name: 'name',
      text: '标签名'
    }, {
      name: 'created_on',
      text: '下载时间'
    }, {
      name: 'created_by',
      text: '下载人'
    }];

    const rowTemplate = (
      <tr>
        <td>%id%</td>
        <td className="cell-name">%name%</td>
        <td className="cell-created_on" childrenNode={rowData => this.renderCreatOnColumn(rowData)}></td>
        <td className="cell-created_by">%created_by%</td>
      </tr>
    );

    let emptyText = (
      <p>暂时没有历史记录</p>
    );

    if (pending && (!list || list.length <= 0)) {
      emptyText = (<p>数据加载中...</p>)
    }

    const pagination = {
      ...DEFAULT_PAGINATION_OPTIONS,
      activePage: currentPage,
      onChangePage: this.handleChangePage.bind(this, 'history'),
      total
    };

    return historyDialog.show ? (
      <Dialog
        show={historyDialog.show}
        backdrop="static"
        onHide={this.handleCloseDialog}
        size={{ width: '700px', height: '600px' }}
        className="downTask-history-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>下载历史记录</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <DataTable
            tableWrapperId='datatable-downtask-wrapper'
            pagination={pagination}
            hover
            serialNumber
            bordered={false}
            dataFields={dataFields}
            data={list}
            rowTemplate={rowTemplate}
            emptyText={emptyText}
          />
          <Loading show={pending} containerId='datatable-downtask-wrapper' />
        </Dialog.Body>
      </Dialog>
    ) : null
  };

  handleGolog = (rowData) => {
    this.context.router.push(`${baseAlias}/flow/ops/${rowData.id}/${rowData.name}/数据下载`)
  };

  handleCloseDialog = () => {
    this.setState({
      historyDialog: {
        ...this.state.historyDialog,
        show: false,
        job_id: ''
      }
    })
  };

  handleDownLoad = (rowData) => {
    this.props.actions.download({ download_job_id: rowData.id }, (json) => {
      if (json) {
        // 避免拦截
        if ($('#_downloadWin').length > 0) {
          $('#_downloadWin').attr('action', json);
        } else {
          // 传参 则在 form 里面 添加 隐藏域(<input type="hidden"/>)
          $('body').append($(`<form id="_downloadWin" action="${json}" method="get"></form>`));
        }
        $('#_downloadWin').submit();
      }
    })
  };

  handleHistoryDown = (rowData) => {
    const { actions } = this.props;
    this.setState({
      historyDialog: {
        show: true,
        job_id: rowData.id
      }
    }, () => {
      actions.fetchHistory({
        page: 1,
        page_size: 10,
        download_job_id: rowData.id
      })
    })
  };

  handleChangePage = (type, event, selectEvent) => {
    event.stopPropagation();

    const { actions, params } = this.props
    const { pageSize, historyDialog } = this.state

    if (type === 'task') {
      actions.fetchList({
        page: selectEvent.eventKey,
        page_size: pageSize,
        flow_name: params.detail_name,
        total_amount: +localStorage.getItem('total_amount')
      })
    } else if (type === 'history') {
      actions.fetchHistory({
        page: selectEvent.eventKey,
        page_size: pageSize,
        download_job_id: historyDialog.job_id
      })
    }
  };
}

const stateToProps = state => ({
  ...state.labelDetailDownTask
});

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(labelDetailDownTaskActions, dispatch)
});

export default connect(stateToProps, dispatchToProps)(LabelDetailDownTask);
