import React from 'react'
import PropTypes from 'prop-types'
import DatasetFieldEditor from './DatasetFieldEditor';
import DatasetResultTable from './DatasetResultTable';
import Button from 'react-bootstrap-myui/lib/Button';
import AuthComponent from '@components/AuthComponent';
import AdvancedDataFieldDialog from '@components/AdvancedDataFieldDialog';

import _ from 'lodash'

import './dataset-view-panel.less';

let fetchDownload = 0;

class DatasetViewPanel extends React.Component {
  static propTypes = {
    tabActive: PropTypes.number,            // tab 默认
    node: PropTypes.object,                 // 选中的节点
    datasetData: PropTypes.object,          //
    datasetTable: PropTypes.object,         //
    datasetRelate: PropTypes.object,        //
    datasetLog: PropTypes.object,           //
    datasetTableTotal: PropTypes.number,    //
    pending: PropTypes.bool,                // pending
    onSelectedTab: PropTypes.func,          // 切换 tab
    onEditDataset: PropTypes.func,          // 编辑数据集
    onUpdateDatasetField: PropTypes.func,
    onDownload: PropTypes.func,             // 下载数据集
    onFetchSheetData: PropTypes.func,       // 获取 sheet
    onShowErr: PropTypes.func,              // 错误提醒
    activeIndex: PropTypes.number
  }

  constructor(props) {
    super(props);
    this.state = {
      tabActive: 0,   // tab active 活动
      keyword: '',    // 操作日志 keyword
      advanceFieldDialog: {
        show: false
      }
    }

    this.TAB_OPTIONS = ['数据预览', '字段设置', '关联报告', '操作日志']     // tab data
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.activeIndex !== this.props.activeIndex) {
      this.setState({
        tabActive: nextProps.activeIndex
      })
    }
    // 如果切换 node, 如果存在上次的异步请求，则终止
    if (!_.isEqual(nextProps.node, this.props.node)) {
      this.abortPromiseDowload()
    }
  }

  render() {
    const { node, onEditDataset } = this.props
    const { tabActive } = this.state

    return node ? [
      <div className="title" key={0}>{node.name}</div>,
      <div className="main-content" key={1}>
        <div className="header">
          <div className="tablist">
            {this.TAB_OPTIONS.map((item, key) => <span key={key} className={key === tabActive ? 'active' : ''} onClick={this.handleSwitchTab.bind(this, key)}>{item}</span>)}
          </div>
          {node.type !== 'TEMPLATE' &&
            <AuthComponent pagecode="创建数据集" visiblecode="edit">
              <Button bsStyle="primary" onClick={onEditDataset}>编辑数据集</Button>
            </AuthComponent>
          }
        </div>
        <div className="content-wrap" key={tabActive}>
          {+tabActive === 0 && this.renderDataView()}
          {+tabActive === 1 && this.renderFiledSeting()}
          {+tabActive === 2 && this.renderRelateReport()}
          {+tabActive === 3 && this.renderOperationLog()}
        </div>
      </div>
    ] : <AuthComponent pagecode="创建数据集" visiblecode="edit">
        <div className="empty-panel">
          <div className="arrow-up"></div>
          <p>请在上方选择类型添加数据集</p>
        </div>
      </AuthComponent>
  }

  // 数据预览
  renderDataView() {
    const { datasetTable, datasetData, pending, datasetTableTotal, datasetTableUserTotal, onUpdateDatasetField, node } = this.props
    const { advanceFieldDialog } = this.state
    return <div className="tab-view data-view-tab">
      <p>
        <span>一共 {`${datasetTableTotal}`} 条数据,  </span>
        <span>当前用户拥有 {`${datasetTableUserTotal}`} 条</span>
        {
          datasetTable && datasetTable.last_time && (
            <span style={{ marginLeft: '20px' }}>
              最近更新时间：{`${datasetTable.last_time.replace('T', ' ')}`}
            </span>
          )
        }
        {
          node.type !== 'API' && <AuthComponent pagecode="创建数据集" visiblecode="edit">
            {<span className="download" onClick={this.handleDownload.bind(this)}>下载数据集</span>}
          </AuthComponent>
        }
        {/*<AuthComponent pagecode="创建数据集" visiblecode="edit">
          <span className="download" onClick={this.handleAddAdvancedField.bind(this)}>添加高级字段</span>
        </AuthComponent>*/}
      </p>
      <AuthComponent pagecode="创建数据集" enablePointer={false} editProp="editable">
        <DatasetResultTable
          data={pending ? null : datasetTable.data}
          head={datasetTable.head}
          onUpdate={onUpdateDatasetField}
          pending={pending}
          editable
        />
      </AuthComponent>
      {
        advanceFieldDialog.show && <AdvancedDataFieldDialog
          onSure={this.handleChangeAdvancedField.bind(this)}
          onClose={this.handleHideAdvanceDialog.bind(this)}
          dataField={datasetData.field}
          data={[]}
        />
      }
    </div>
  }

  // 字段设置
  renderFiledSeting() {
    const { datasetData, pending, onUpdateDatasetField } = this.props

    return <div className="tab-view field-set-tab">
      <AuthComponent pagecode="创建数据集" enablePointer={false} editProp="editable">
        <DatasetFieldEditor
          data={pending ? null : datasetData.field}
          pending={pending}
          onUpdate={onUpdateDatasetField}
        />
      </AuthComponent>
    </div>
  }

  // 关联报告
  renderRelateReport() {
    const { datasetRelate, pending } = this.props
    return <div className="tab-view relate-report-tab">
      <p>使用此工作表创建的报告：</p>
      <DatasetResultTable
        data={pending ? null : datasetRelate.data}
        head={datasetRelate.head}
        pending={pending}
        hasIcon={false}
      />
    </div>
  }

  // 操作日志
  renderOperationLog() {
    const { datasetLog, pending } = this.props
    return <div className="tab-view operation-log-tab">
      <DatasetResultTable
        data={pending ? null : datasetLog.data}
        head={datasetLog.head}
        hasIcon={false}
        pending={pending}
      />
    </div>
  }

  handleDownload() {
    const { node, onDownload, onShowErr } = this.props
    // 
    fetchDownload = 0

    onDownload({ id: node.id }, (json) => {
      if (json.result) {
        // task_id
        this.task_id = json.data.task_id
        this.promiseDownLoad(this.task_id, (data) => {
          const down_url = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
          down_url.href = data.oss_url;
          down_url.download = data.name;

          const event = document.createEvent('MouseEvents');
          event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
          down_url.dispatchEvent(event);
        })
      } else {
        onShowErr(json.msg || '服务异常')
      }
    })
  }

  handleChangeAdvancedField() {
    // 1.update data
    // 2.hide dialog
    
  }

  handleAddAdvancedField() {
    this.setState({
      advanceFieldDialog: {
        ...this.state.advanceFieldDialog,
        show: true
      }
    })
  }

  handleHideAdvanceDialog() {
    this.setState({
      advanceFieldDialog: {
        ...this.state.advanceFieldDialog,
        show: false
      }
    })
  }

  handleSwitchTab(index, e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();

    this.props.onSelectedTab && this.props.onSelectedTab(index)

    this.setState({ tabActive: index })
  }

  promiseDownLoad(taskId, callback) {
    fetchDownload++;
    const { onShowErr, onFetchSheetData } = this.props

    return new Promise(() => {
      onFetchSheetData(taskId, (json) => {
        if (json.result && json.data.status === 1) {
          // 如果有错误信息则表示无法下载
          if (json.data.error_msg) {
            onShowErr(json.data.error_msg)
          } else {
            callback(json.data)
          }
        } else if (fetchDownload > 200) {
          // 250 作为 手动 abort 终止请求的次数限定
          if (fetchDownload >= 250) {
            //
          } else {
            onShowErr('获取下载地址失败')
          }
        } else {
          setTimeout(() => {
            this.promiseDownLoad(taskId, callback)
          }, 500)
        }
      })
    })
  }

  abortPromiseDowload() {
    fetchDownload = 250
    this.task_id && this.promiseDownLoad(this.task_id)
  }
}

export default DatasetViewPanel;
