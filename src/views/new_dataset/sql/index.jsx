import React from 'react';
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class'

import ProcessNav from '../../../components/ProcessNav';
import FirstProcess from './components/FirstProcess';
import SecondProcess from './components/SecondProcess';
import ThirdProcess from './components/ThirdProcess';
import FinishPage from '../components/FinishPage';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataSetActionCreators } from '../../../redux/modules/dataset/dataset';
import { actions as dataSourceActionCreators } from '../../../redux/modules/datasource/datasource';
import { actions as dataCleanActionCreators } from '@store/modules/dataclean/dataclean';
import { actions as userActionCreators } from '../../../redux/modules/organization/user';

import { getFullPathByLevelCode } from '../../../helpers/groupTreeUtils'

import TipMixin from '@helpers/TipMixin';
import ConfirmsMixin from '@helpers/ConfirmsMixin';
import { baseAlias } from '../../../config';

import './index.less';

const DatasetDetailSQL = createReactClass({
  displayName: 'DatasetDetailSQL',

  mixins: [TipMixin, ConfirmsMixin],

  propTypes: {
    actions: PropTypes.object,
    params: PropTypes.object,
    onChangeNavBar: PropTypes.func,
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      savePending: false,     // 
      flowList: [],           // flow 流程调度
      processActive: 0,       // nav 的 active 
      firstProcess: null,     // 
      secondProcess: null,    //
      thirdProcess: null,     //
    }
  },

  componentDidMount() {
    const { actions, params, onChangeNavBar } = this.props

    onChangeNavBar([{
      name: '创建数据集',
      url: '/dataset/list'
    }, {
      name: params.id ? '编辑SQL数据集' : '添加SQL数据集'
    }]);

    // 获取flowList
    this.getFlowList()
    // 获取数据源
    actions.fetchDataSources(1, {
      type: 'MySQL,MysoftERP,DataHub',
      page_size: 10000,
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      }
    });

    // 获取 folderTree
    actions.fetchDatasetTree(true, null, (json) => {
      // 编辑的情况下
      if (json.result && params.id) {
        actions.fetchDatasetData(params.id, (_json) => {
          if (_json.result) {
            this.initProcess(_json.data, json.data)
          } else {
            this.showErr(_json.msg || '服务出错')
          }
        })
      }
    });
  },

  render() {
    const { processActive, firstProcess, secondProcess, thirdProcess, flowList, savePending } = this.state
    const { pending, folderTree, actions, userInfo, datasourceList, dataSourceTables, dataSourecePending, datasetData, datasetTable, datasetTableTotal, dataSourceTablesPage, dataSourceTablesTotal } = this.props

    return <div className="modules-page-container">
      <div className="data-view dataset-detail-page-sql">
        {
          processActive < 3 && <div className="page-nav" style={{ paddingTop: '30px' }}>
            <ProcessNav
              data={this.PROCESS_NAV}
              active={processActive}
            />
          </div>
        }
        {processActive === 0 &&
          <FirstProcess
            initState={firstProcess}
            secondProcess={secondProcess}
            datasourceList={datasourceList}
            onClearDataset={actions.clearDatasetData}
            onNext={this.handleNext}
            onFetchTableSilent={actions.fetchDataSourceTableSilent}
            onShowError={this.showErr}
          />
        }
        <SecondProcess
          show={processActive === 1}
          dataSourceId={firstProcess ? firstProcess.data_source_id : ''}
          dataSourceType={firstProcess ? firstProcess.data_source_type : ''}
          dataBaseType={firstProcess ? firstProcess.data_base_type : ''}
          initState={secondProcess}
          dataSourceTables={dataSourceTables}
          dataSourceTablesPage={dataSourceTablesPage}
          dataSourceTablesTotal={dataSourceTablesTotal}
          dataSourecePending={dataSourecePending}
          pending={pending}
          datasetData={datasetData}
          datasetTable={datasetTable}
          datasetTableTotal={datasetTableTotal}
          onClearDataset={actions.clearDatasetData}
          onFetchRunSQLDataset={actions.fetchRunSQLDataset}
          onUpdateDatasetField={actions.updateDatasetField}
          onFetchDatasetResultTotal={actions.fetchDatasetResultTotal}
          onFetchTables={actions.fetchDataSourceTable}
          onNext={this.handleNext}
          onPrev={this.handlePrev}
          onShowErr={this.showErr}
          onShowSucc={this.showSucc}
        />
        {processActive === 2 &&
          <ThirdProcess
            folderTree={folderTree}
            userInfo={userInfo}
            initState={thirdProcess}
            flowList={flowList}
            savePending={savePending}
            onRemoveTempFolders={actions.removeTempFolders}
            onTempAddFolder={actions.tempOnlyFolders}
            onSearch={actions.filterFloders}
            onAddFolder={actions.fetchAddFolder}
            onShowErr={this.showErr}
            onShowSucc={this.showSucc}
            onPrev={this.handlePrev}
            onSave={this.handleSave}
          />
        }
        {processActive === 3 &&
          <FinishPage
            onGoList={this.handleGoList}
            onDone={this.handleDone}
          />
        }
      </div>
    </div>
  },

  handleGoList() {
    this.context.router.push(`${baseAlias}/dataset/list`)
  },

  // 上一步
  handlePrev(state) {
    const { processActive, secondProcess } = this.state

    this.setState({
      ...state,
      secondProcess: {
        ...secondProcess,
        loaded: false
      },
      processActive: processActive - 1
    })
  },

  // 下一步
  handleNext(state) {
    const { actions, dataSourceTables } = this.props
    const { processActive, firstProcess } = this.state

    const currId = state.firstProcess ? state.firstProcess.data_source_id : ''
    const oldId = firstProcess ? firstProcess.data_source_id : ''

    if (processActive === 0 && (dataSourceTables.length === 0 || currId !== oldId)) {
      actions.fetchDataSourceTable(state.firstProcess.data_source_id, {
        page: 1,
        page_size: this.PAGE_SIZE,
        keyword: ''
      })
    }

    this.setState({
      ...state,
      processActive: +processActive + 1
    })
  },

  // 完成
  handleDone() {
    this.context.router.push(`${baseAlias}/dataview/report/add`);
  },

  async handleSave(state) {
    const { processActive, firstProcess, secondProcess } = this.state
    const { params, datasetTable, userInfo, datasetTableTotal } = this.props
    const { plan } = state.thirdProcess
    const schedule = plan === 'cycle' ? state.thirdProcess.schedule : ''
    const depend_flow_id = plan === 'flow' ? state.thirdProcess.depend_flow_id : ''

    const data = {
      field: datasetTable.head,
      name: state.thirdProcess.name,
      parent_id: state.thirdProcess.parent_id,
      type: 'SQL',
      user_group_id: userInfo.group_id,
      content: {
        data_source_id: firstProcess.data_source_id,
        count: datasetTableTotal,
        sql: secondProcess.sql
      },
      flow: {
        schedule,
        depend_flow_id,
        status: state.thirdProcess.status
      }
    }
    // 如果是编辑
    if (params.id) {
      data.id = params.id
      // 等待校验
      await this.checkBeforeSave(data)
    }

    this.setState({ savePending: true })

    // create promise
    this.saveDataset(data).then(() => {
      this.setState({
        savePending: false,
        processActive: processActive + 1
      })
    })
  },

  checkBeforeSave(data) {
    return new Promise((resolve) => {
      this.props.actions.checkBeforeSave(data, (json) => {
        if (json.result) {
          resolve()
        } else {
          this.showConfirm({
            content: <span style={{ width: '350px', display: 'inline-block' }}>{json.msg}</span>,
            checkbox: false,
            ok: () => {
              resolve()
            }
          });
        }
      })
    })
  },

  // 保存数据集
  saveDataset(data) {
    const { params, actions } = this.props
    return new Promise((resolve) => {
      if (params.id) {
        actions.fetchUpdateDataset(data, (json) => {
          if (json.result) {
            resolve();
          } else {
            this.setState({ savePending: false })
            this.showErr(json.msg);
          }
        });
      } else {
        actions.fetchAddDataset(data, (json) => {
          if (json.result) {
            resolve();
          } else {
            this.setState({ savePending: false })
            this.showErr(json.msg);
          }
        });
      }
    })
  },

  // 编辑初始化数据
  initProcess(data, folderTree) {
    const firstProcess = {
      isEdit: true,
      data_source_id: data.content.data_source_id
    }

    const secondProcess = {
      isEdit: true,
      loaded: true,                    // 没有运行过
      sql: data.content.sql             // SQL 语句内容
    }

    const pathArray = [];

    getFullPathByLevelCode(folderTree, data.level_code, pathArray);

    const thirdProcess = {
      isEdit: true,
      plan: data.flow.depend_flow_id ? 'flow' : 'cycle',
      status: data.flow.status,
      depend_flow_id: data.flow.depend_flow_id,
      schedule: data.flow.schedule || '0 0 0 ? * * *',
      name: data.name,
      parent_id: data.parent_id,
      path: `/ ${pathArray.join(' / ')}`
    }

    this.setState({
      firstProcess,
      secondProcess,
      thirdProcess
    })
  },

  getFlowList() {
    this.props.actions.getFlowList({
      page: 1,
      page_size: 1000000,
      type: '数据清洗'
    }, (json) => {
      if (json.result) {
        this.setState({ flowList: json.data.items });
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

  PROCESS_NAV: ['选择数据源', '预览数据', '保存设置'],

  PAGE_SIZE: 40

})

const stateToProps = state => ({
  ...state.dataset,
  userInfo: state.user.userInfo,
  datasourceList: state.datasource.list,
  dataSourceTables: state.datasource.dataSourceTables,
  dataSourceTablesPage: state.datasource.dataSourceTablesPage,
  dataSourceTablesTotal: state.datasource.dataSourceTablesTotal,
  dataSourecePending: state.datasource.pending
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataCleanActionCreators, userActionCreators, dataSourceActionCreators, dataSetActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DatasetDetailSQL);
