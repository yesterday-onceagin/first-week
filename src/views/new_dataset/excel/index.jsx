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
import { actions as commonActionCreators } from '../../../redux/modules/common';
import { actions as userActionCreators } from '../../../redux/modules/organization/user';

import { getFullPathByLevelCode } from '../../../helpers/groupTreeUtils'

import TipMixin from '@helpers/TipMixin';
import ConfirmsMixin from '@helpers/ConfirmsMixin';

import { baseAlias } from '../../../config';

import './index.less';

let timer = 0;
let name_timer = 0;

const DatasetDetailEXCEL = createReactClass({
  displayName: 'DatasetDetailEXCEL',

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
      taskId: '',           // sheetData taskid
      name_taskId: '',      // name taskid
      savePending: false,
      firstPending: false,
      workSheet: [],
      processActive: 0,   // nav 的 active 
      firstProcess: null,   // first process
      secondProcess: null,  // second process
      secondPending: false, // second 轮询状态
      thirdProcess: null    // third process
    }
  },

  componentDidMount() {
    const { actions, params, onChangeNavBar } = this.props

    onChangeNavBar([{
      name: '创建数据集',
      url: '/dataset/list'
    }, {
      name: params.id ? '替换EXCEL数据集' : '添加EXCEL数据集'
    }]);

    // 获取 Oss token
    actions.fetchOssToken();

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

    // 避免 按回退或者进行
    window.addEventListener('popstate', () => {
      this.abortAsyncPromise()
      // 清除 worksheet
      this.state.firstPending = false
      this.state.workSheet = []
      // 清除 sheets data
      this.props.actions.clearSheetsData()
    });
  },

  componentWillMount() {
    // 避免页面 注销的时候，再请求
    this.abortAsyncPromise()
    // 清除 worksheet
    this.state.workSheet = []
    // 清除 sheets data
    this.props.actions.clearSheetsData()
  },

  render() {
    const { processActive, firstProcess, secondProcess, thirdProcess, secondPending, savePending, firstPending, workSheet } = this.state
    const { ossToken, folderTree, actions, userInfo, sheetsData } = this.props
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
            ossToken={ossToken}
            workSheet={workSheet}
            initState={firstProcess}
            pending={firstPending}
            onFetchOssSign={actions.fetchOssSign}
            onBefore={this.handleUploadBefore}
            onSuccess={this.handleUploadSuccess}
            onNext={this.handleNext}
          />
        }
        {processActive === 1 &&
          <SecondProcess
            initState={secondProcess}
            workSheet={workSheet}
            selectSheet={firstProcess ? firstProcess.selectSheets : []}
            sheetsData={sheetsData}
            pending={secondPending}
            onUpdateDatasetField={this.handleUpdateField}
            onNext={this.handleNext}
            onPrev={this.handlePrev}
          />
        }
        {processActive === 2 &&
          <ThirdProcess
            folderTree={folderTree}
            userInfo={userInfo}
            initState={thirdProcess}
            sheetsData={sheetsData}
            savePending={savePending}
            onRemoveTempFolders={actions.removeTempFolders}
            onTempAddFolder={actions.tempOnlyFolders}
            onSearch={actions.filterFloders}
            onAddFolder={actions.fetchAddFolder}
            onCheckName={actions.checkDatasetName}
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

  handleUpdateField(active, data) {
    this.props.actions.updateDatasetField({
      ...data,
      type: 'EXCEL',
      active
    })
  },

  // 添加完成 返回数据集列表
  handleGoList() {
    this.context.router.push(`${baseAlias}/dataset/list`)
  },

  // 上一步
  handlePrev(state) {
    const { processActive, taskId } = this.state

    if (processActive === 1 && taskId) {
      this.abortAsyncPromise('sheetdata')
    }

    this.setState({
      ...state,
      processActive: processActive - 1
    })
  },

  // 下一步
  handleNext(state) {
    const { actions, sheetsData } = this.props
    const { processActive, secondPending, workSheet } = this.state
    // 获取已选的sheets数据
    if (processActive === 0 && !secondPending) {
      const select_sheets = workSheet.filter((item, key) => state.firstProcess.selectSheets.indexOf(key) > -1)
      // loading
      this.setState({
        secondPending: true
      })
      // 重置 timer = 0
      timer = 0;
      actions.fetchSheetId({
        type: 'EXCEL',
        content: JSON.stringify({
          select_sheets,
          file_name: state.firstProcess.file_name,
          oss_url: state.firstProcess.oss_url,
        })
      }, (json) => {
        if (json.result) {
          // promise 堆栈
          this.state.taskId = json.data.task_id
          this.promiseFetchSheet(json.data.task_id)
        }
      })
    }
    // 应该要提醒是否存在有效数据
    if (processActive === 1) {
      const validSheetsData = sheetsData.filter(item => !item.error_msg && item.data.length > 0)
      if (validSheetsData.length === 0) {
        this.showErr('没有数据！')
        return;
      }
    }
    // 存储数据
    this.setState({
      ...state,
      processActive: +processActive + 1
    })
  },

  // 完成返回报告制作页
  handleDone() {
    this.context.router.push(`${baseAlias}/dataview/report/add`);
  },

  handleSave(state) {
    const { processActive, firstProcess } = this.state

    const { params, sheetsData, userInfo } = this.props
    // 去掉 错误的 sheets 表
    const validSheetsData = sheetsData.filter(item => !item.error_msg && item.data.length > 0)
    const savePromises = []
    const datas = []

    validSheetsData.forEach((item) => {
      const data = {
        field: item.head,
        name: item.name || item.sheet_name,
        parent_id: state.thirdProcess.parent_id,
        type: 'EXCEL',
        user_group_id: userInfo.group_id,
        content: {
          file_name: firstProcess.file_name,
          sheet_name: item.sheet_name,
          oss_url: firstProcess.oss_url
        }
      }
      // 如果是编辑
      if (params.id) {
        data.id = params.id

        // create promise
        const promise = this.saveDataset(data)
        savePromises.push(promise)
      } else {
        datas.push(data)
      }
    })

    // 如果是保存
    if (!params.id) {
      savePromises.push(this.saveDataset({ dataset_list: datas }))
    }

    this.setState({ savePending: true })

    // 全部保存完毕
    Promise.all(savePromises).then(() => {
      this.setState({
        ...state,
        savePending: false,
        processActive: +processActive + 1
      })
    }).catch((err) => {
      this.showErr(err);
      this.setState({ savePending: false })
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
            },
            close: () => {
              this.setState({
                savePending: false
              })
            }
          });
        }
      })
    })
  },

  handleUploadBefore(error) {
    this.showErr(error)
  },

  handleUploadSuccess(msg, object, isCSV) {
    const { actions } = this.props
    // timer，令其过期, 中断轮询
    this.abortAsyncPromise()
    // 清除 worksheet
    this.state.workSheet = []
    // 清除 sheets data
    actions.clearSheetsData().then(() => {
      this.promiseInit(isCSV, object).then((data) => {
        this.setState({
          firstPending: false,
          workSheet: data
        })
      })
    })
  },

  // 编辑初始化数据
  initProcess(data, folderTree) {
    /*const firstProcess = {
      isEdit: true,
      file_name: data.content.file_name,
      selectSheets: [],
      oss_url: data.content.oss_url,
      sheet_name: data.content.sheet_name
    }*/

    const firstProcess = {
      isEdit: true
    }

    const pathArray = [];

    getFullPathByLevelCode(folderTree, data.level_code, pathArray);

    const thirdProcess = {
      parent_id: data.parent_id,
      path: `/ ${pathArray.join(' / ')}`,
      editName: data.name,
      isEdit: true, // 是编辑
    }

    this.setState({
      firstProcess,
      thirdProcess
    })

    // ext csv
    /*const isCSV = firstProcess.oss_url.endsWith('.csv')
    const sheet_name = data.content.sheet_name

    this.promiseInit(isCSV, firstProcess).then(data => {
      this.state.workSheet = data
      // 选择的sheet表
      let sheetIndex = data.findIndex(item => item == sheet_name)
      firstProcess.selectSheets = [sheetIndex]
      this.setState({
        workSheet: this.state.workSheet,
        firstPending: false,
        firstProcess,
        thirdProcess
      })
    })*/
  },

  promiseInit(isCSV, firstProcess) {
    const { actions } = this.props
    // loading 
    this.setState({ firstPending: true })

    return new Promise((resolve) => {
      if (isCSV) {
        resolve([firstProcess.sheet_name])
      } else {
        // 获取 workSheet taskid。然后轮询获取 sheetName
        actions.fetchNameTask({
          type: 'EXCEL',
          content: JSON.stringify({
            file_name: firstProcess.file_name,
            oss_url: firstProcess.oss_url
          })
        }, (json) => {
          if (json.result) {
            // 重置
            name_timer = 0;
            this.state.name_taskId = json.data.task_id
            this.promiseFetchName(json.data.task_id, (data) => {
              // 避免出现问题
              name_timer = 250;
              // 返回sheet name
              resolve(data)
            })
          } else {
            this.setState({ firstPending: false })
            this.showErr(json.msg)
          }
        })
      }
    })
  },


  // 保存数据集
  async saveDataset(data) {
    const { params, actions } = this.props
    // 编辑
    if (data.id) {
      // 等待校验
      await this.checkBeforeSave(data)
    }

    return new Promise((resolve, reject) => {
      if (params.id) {
        actions.fetchUpdateDataset(data, (json) => {
          if (json.result) {
            resolve();
          } else {
            reject(json.msg);
          }
        });
      } else {
        actions.saveMutiExcelDataset(data, (json) => {
          if (json.result) {
            resolve();
          } else {
            reject(json.msg);
          }
        });
      }
    })
  },

  // promise fetch work sheet nameList 
  promiseFetchName(id, callback) {
    name_timer++;
    const actions = this.props.actions

    return new Promise(() => {
      actions.fetchWorkSheetNames(id, (json) => {
        // 表示成功
        if ((json.result && json.data.status === 1) || name_timer >= 240) {
          // 结束状态
          if (name_timer === 240) {
            this.showErr('服务出现异常！')
            this.setState({ firstPending: false })
          } else if (name_timer < 240) {
            // 存在错误信息的时候
            if (json.data.error_msg) {
              this.showErr(json.data.error_msg)
            }
            callback && callback(json.data.info);
          }
        } else {
          setTimeout(() => {
            this.promiseFetchName(id, callback)
          }, 500)
        }
      })
    })
  },

  // promise
  promiseFetchSheet(id) {
    timer++;
    const { actions } = this.props

    return new Promise((resolve) => {
      actions.fetchSheetData(id, (json) => {
        // 表示成功
        if (json.result && json.data.status === 1 || timer >= 240) {
          // 结束状态
          this.setState({
            secondPending: false
          })
          if (timer === 240) {
            this.showErr('服务出现异常！')
          }
          resolve();
        } else {
          setTimeout(() => {
            this.promiseFetchSheet(id)
          }, 500)
        }
      })
    })
  },

  // 终止 异步轮询
  abortAsyncPromise(type) {
    //默认都终止
    if (!type) {
      // 终止获取sheet表名
      timer = 250
      this.state.taskId && this.promiseFetchSheet(this.state.taskId)
      // 终止获取sheet表
      name_timer = 250;
      this.state.name_taskId && this.promiseFetchName(this.state.name_taskId)
    } else {
      timer = 250;
      this.state.taskId && this.promiseFetchSheet(this.state.taskId)
    }
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
      content: error,
      timeout: 4000
    })
  },

  PROCESS_NAV: ['上传文件', '预览数据', '保存设置'],

})

const stateToProps = state => ({
  ...state.dataset,
  userInfo: state.user.userInfo,
  ossToken: state.common.ossToken
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, commonActionCreators, userActionCreators, dataSetActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DatasetDetailEXCEL);
