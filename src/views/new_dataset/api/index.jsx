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
import { actions as userActionCreators } from '../../../redux/modules/organization/user';

import { getFullPathByLevelCode } from '../../../helpers/groupTreeUtils'

import _ from 'lodash'
import TipMixin from '@helpers/TipMixin';
import ConfirmsMixin from '@helpers/ConfirmsMixin';
import { baseAlias } from '../../../config';

import './index.less';

// 剔除不需要的参数
const _getValidParams = (params = []) => _.filter(_.cloneDeep(params), ({ checked }) => checked).map((item) => {
  if (item.checked !== undefined) {
    Reflect.deleteProperty(item, 'checked')
  }
  return item
})

const DatasetDetailAPI = createReactClass({
  displayName: 'DatasetDetailAPI',

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
      name: params.id ? '编辑API数据集' : '添加API数据集'
    }]);

    // 获取数据源
    actions.fetchDataSources(1, {
      type: 'API',
      page_size: 10000,
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      }
    });

    // 获取系统内置参数
    actions.fetchApiDatasourceSysParams()

    // 获取 folderTree
    actions.fetchDatasetTree(true, null, (json) => {
      if (json.result && params.id) {
        actions.fetchDatasetData(params.id, (_json) => {
          if (_json.result) {
            // 获取数据集内的参数
            actions.fetchApiDatasourceParamsById(_json.data.content.data_source_id, 'dataset')
            this.initProcess(_json.data, json.data)
          } else {
            this.showErr(_json.msg || '服务出错')
          }
        })
      }
    });
  },

  componentWillUnmount() {
    const { actions } = this.props
    actions.clearDatasourceParams()
  },

  render() {
    const { processActive, firstProcess, secondProcess, thirdProcess, savePending } = this.state
    const {
      pending,
      folderTree,
      actions,
      userInfo,
      datasourceList,
      dataSourceTables,
      dataSourceTablesPage,
      dataSourceTablesTotal,
      dataSourcePending,
      datasetData,
      datasetTable,
      datasetTableTotal,
      apiDatasourceParams,
      apiDatasourceSysParams,
      apiDatasourceParamsPending
    } = this.props

    return <div className="modules-page-container">
      <div className="data-view dataset-detail-page-api">
        {
          processActive < 3 && (
            <div className="page-nav" style={{ paddingTop: '30px' }}>
              <ProcessNav
                data={this.PROCESS_NAV}
                active={processActive}
              />
            </div>
          )
        }
        {
          processActive === 0 && (
            <FirstProcess
              initState={firstProcess}
              secondProcess={secondProcess}
              datasourceList={datasourceList}
              onClearDataset={actions.clearDatasetData}
              onGetParamsData={actions.fetchApiDatasourceParamsById}
              onNext={this.handleNext}
            />
          )
        }
        <SecondProcess
          show={processActive === 1}
          dataSourceId={firstProcess ? firstProcess.data_source_id : ''}
          initState={secondProcess}
          dataSourceTables={dataSourceTables}
          dataSourceTablesPage={dataSourceTablesPage}
          dataSourceTablesTotal={dataSourceTablesTotal}
          dataSourcePending={dataSourcePending}
          pending={pending}
          apiDatasourceParams={apiDatasourceParams}
          apiDatasourceParamsPending={apiDatasourceParamsPending}
          apiDatasourceSysParams={apiDatasourceSysParams}
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
        {
          processActive === 2 && (
            <ThirdProcess
              folderTree={folderTree}
              userInfo={userInfo}
              initState={thirdProcess}
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
          )
        }
        {
          processActive === 3 && (
            <FinishPage
              onGoList={this.handleGoList}
              onDone={this.handleDone}
            />
          )
        }
      </div>
    </div>
  },

  handleGoList() {
    this.context.router.push(`${baseAlias}/dataset/list`)
  },

  // 上一步
  handlePrev(state) {
    this.setState(preState => ({
      ...state,
      secondProcess: {
        ...preState.secondProcess,
        loaded: false
      },
      processActive: preState.processActive - 1
    }))
  },

  // 下一步
  handleNext(state) {
    const  { actions, dataSourceTables } = this.props
    const { processActive, firstProcess } = this.state

    const currId = state.firstProcess ? state.firstProcess.data_source_id : ''
    const oldId = firstProcess ? firstProcess.data_source_id : ''

    if (processActive === 0 && (dataSourceTables.length === 0 || currId !== oldId)) {
      actions.fetchDataSourceTable(state.firstProcess.data_source_id, {
        page: 1,
        page_size: 20,
        keyword: ''
      })
    }

    this.setState({
      ...state,
      processActive: processActive + 1
    })
  },

  // 完成
  handleDone() {
    this.context.router.push(`${baseAlias}/dataview/report/add`);
  },

  async handleSave(state) {
    const { processActive, firstProcess, secondProcess } = this.state
    const { params, datasetTable, userInfo, datasetTableTotal } = this.props
    
    const data = {
      field: datasetTable.head,
      name: state.thirdProcess.name,
      parent_id: state.thirdProcess.parent_id,
      type: 'API',
      user_group_id: userInfo.group_id,
      content: {
        data_source_id: firstProcess.data_source_id,
        count: datasetTableTotal,
        table_name: secondProcess.tableName,
        params: _getValidParams(secondProcess.paramData)
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
      loaded: true,
      tableName: data.content.table_name,
      paramData: Array.isArray(data.content.params) ? data.content.params.map(p => ({ ...p, checked: true })) : []
    }

    const pathArray = [];
  
    getFullPathByLevelCode(folderTree, data.level_code, pathArray);

    const thirdProcess = {
      isEdit: true,
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

})

const stateToProps = state => ({
  ...state.dataset,
  userInfo: state.user.userInfo,
  datasourceList: state.datasource.list,
  dataSourceTables: state.datasource.dataSourceTables,
  dataSourceTablesPage: state.datasource.dataSourceTablesPage,
  dataSourceTablesTotal: state.datasource.dataSourceTablesTotal,
  dataSourcePending: state.datasource.pending,
  apiDatasourceParams: state.datasource.apiDatasourceParams,
  apiDatasourceSysParams: state.datasource.apiDatasourceSysParams,
  apiDatasourceParamsPending: state.datasource.apiDatasourceParamsPending
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, userActionCreators, dataSourceActionCreators, dataSetActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DatasetDetailAPI);
