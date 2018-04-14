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

import { getFullPathByLevelCode, getDatasetNodeByName } from '../../../helpers/groupTreeUtils'

import TipMixin from '@helpers/TipMixin';
import ConfirmsMixin from '@helpers/ConfirmsMixin';

import { baseAlias } from '../../../config';

import './index.less';

const DatasetDetailCOMBO = createReactClass({
  displayName: 'DatasetDetailCOMBO',

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
      name: params.id ? '编辑组合数据集' : '添加组合数据集'
    }]);

    // 获取flowList
    this.getFlowList()

    actions.fetchDatasetTree(true)

    Promise.all(this.promiseInit()).then((data) => {
      if (params.id) {
        actions.fetchDatasetData(params.id, (json) => {
          if (json.result) {
            this.initProcess(json.data, data[0])
          } else {
            this.showErr(json.msg || '服务出错')
          }
        })
      }
    }).catch((error) => {
      this.showErr(error || '服务出错')
    })
  },

  render() {
    const { processActive, firstProcess, secondProcess, thirdProcess, flowList, savePending } = this.state
    const { folderTree, datasetTree, actions, userInfo, datasetData, datasetTable, datasetTableTotal, pending } = this.props
    const tableList = firstProcess ? firstProcess.activeNode : []

    return <div className="modules-page-container">
      <div className="data-view dataset-detail-page-excel">
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
            datasetTree={datasetTree}
            onFlterDatasets={actions.filterDatasets}
            onNext={this.handleNext}
          />
        }
        {processActive === 1 &&
          <SecondProcess
            tableList={tableList}
            initState={secondProcess}
            datasetData={datasetData}
            datasetTable={datasetTable}
            pending={pending}
            datasetTableTotal={datasetTableTotal}
            onClearDataset={actions.clearDatasetData}
            onFetchRunSQLDataset={actions.fetchRunSQLDataset}
            onUpdateDatasetField={actions.updateDatasetField}
            onUpdateDatasetSpreads={actions.updateDatasetSpreads}
            onFetchDatasetResultTotal={actions.fetchDatasetResultTotal}
            onFetchDatasetField={actions.fetchDatasetField}
            onUpdateTableList={this.updateTableList}
            onNext={this.handleNext}
            onPrev={this.handlePrev}
            onShowErr={this.showErr}
            onShowSucc={this.showSucc}
          />
        }
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
    let { processActive } = this.state

    this.setState({
      ...state,
      processActive: --processActive
    })
  },

  // 下一步
  handleNext(state) {
    let { processActive } = this.state
    this.setState({
      ...state,
      processActive: ++processActive
    })
  },

  // 完成
  handleDone() {
    this.context.router.push(`${baseAlias}/dataview/report/add`);
  },

  async handleSave(state) {
    const { processActive, secondProcess } = this.state
    const { params, datasetTable, userInfo, datasetTableTotal } = this.props
    const { plan } = state.thirdProcess
    const schedule = plan === 'cycle' ? state.thirdProcess.schedule : ''
    const depend_flow_id = plan === 'flow' ? state.thirdProcess.depend_flow_id : ''

    const data = {
      field: datasetTable.head,
      name: state.thirdProcess.name,
      parent_id: state.thirdProcess.parent_id,
      type: 'UNION',
      user_group_id: userInfo.group_id,
      content: {
        count: datasetTableTotal,
        sql: secondProcess.sql,
        replace_sql: secondProcess.replace_sql
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
        ...state,
        savePending: false,
        processActive: +processActive + 1
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

  promiseInit() {
    const { actions } = this.props
    // fetch datasetTree
    const datasetTreePromise = new Promise((resolve, reject) => {
      actions.fetchDatasetTreeParams({ exclude_types: ['API'] }, (json) => {
        if (json.result) {
          resolve(json.data)
        } else {
          reject(json.msg);
        }
      })
    })

    return [datasetTreePromise]
  },

  // 编辑初始化数据
  initProcess(data, folderTree) {
    const { sql } = data.content
    const activeNode = []

    sql.replace(/\s+\{(.*?)\}/g, ($1, name) => {
      getDatasetNodeByName(folderTree, name, activeNode)
    })

    // 
    const firstProcess = {
      isEdit: true,
      activeNode
    }

    const secondProcess = {
      isEdit: true,
      sql
    }

    const pathArray = [];
  
    getFullPathByLevelCode(folderTree, data.level_code, pathArray);

    const thirdProcess = {
      isEdit: true, // 是编辑
      plan: data.flow.depend_flow_id ? 'flow' : 'cycle',
      status: data.flow.status,
      depend_flow_id: data.flow.depend_flow_id,
      schedule: data.flow.schedule || '0 0 0 ? * * *',
      parent_id: data.parent_id,
      path: `/ ${pathArray.join(' / ')}`,
      name: data.name
    }

    this.setState({
      firstProcess,
      secondProcess,
      thirdProcess
    })
  },

  // 更新tablelist
  updateTableList(node, fields) {
    const { firstProcess } = this.state
    const { activeNode } = firstProcess
    const index = activeNode.findIndex(item => item.id === node.id)
    const targetNode = activeNode[index]
    const pathArr = node.path.slice()

    const sub = []
    // 过滤不显示的数据
    fields.filter(item => (item.type === '普通' && item.visible === 1)).forEach((item, _index) => {
      const _path = pathArr.concat([_index])
      const _level = 1

      sub.push({
        ...item,
        path: _path,
        level: _level,
        parent_id: targetNode.id,
        name: item.alias_name || item.col_name,
        field: true,    // 字段识别标志
        type: item.data_type
      })
    })
    
    targetNode.sub = sub.sort((a, b) => {
      const a_ascii = a.type.charCodeAt(0).toString(10)
      const b_ascii = b.type.charCodeAt(0).toString(10)
      return a_ascii - b_ascii
    })

    firstProcess.activeNode[index] = targetNode

    this.setState({
      firstProcess
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

  PROCESS_NAV: ['选择数据源', '配置数据', '保存设置'],

})

const stateToProps = state => ({
  ...state.dataset,
  userInfo: state.user.userInfo
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataCleanActionCreators, userActionCreators, dataSourceActionCreators, dataSetActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DatasetDetailCOMBO);
