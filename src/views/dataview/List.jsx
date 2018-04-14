import React from 'react';
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class'

import Loading from 'react-bootstrap-myui/lib/Loading';
import FolderItem from './components/FolderItem';
import MultiScreenPublish from './components/MultiScreenPublish'
import ReportFolderSelect from './components/ReportFolderSelect'
import EmptyStatus from '../../components/EmptyStatus';
import MailFeedConfig from '../feeds/AddOrEdit'

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataViewListActionCreators } from '../../redux/modules/dataview/list';

import _ from 'lodash'
import TipMixin from '../../helpers/TipMixin';
import ConfirmsMixin from '../../helpers/ConfirmsMixin';

import { baseAlias } from '../../config';

import './list.less';

const WINDOW_OBJECT = window
/*
* 报告文件夹管理
*/
const DashboardList = createReactClass({
  mixins: [TipMixin, ConfirmsMixin],

  propTypes: {
    location: PropTypes.object,
    params: PropTypes.object,
    actions: PropTypes.object,
    onChangeNavBar: PropTypes.func,
    onChangeNavBarSearch: PropTypes.func,
    pwd: PropTypes.array,
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    const tabs = ['我的报告', '多屏管理']
    const tabType = this.props.location.query.type
    const currNavTab = tabs.indexOf(tabType) > -1 ? tabType : tabs[0]

    return {
      currNavTab,
      activeId: null,
      newItemId: '',           // 新建文件(夹)后记录id
      isSearching: false,
      showScreenPublish: false,
      copyItem: null,
      initpage: false,        // 是否初始化完成
      mailState: {
        dashboardData: null
      }
    }
  },

  componentWillMount() {

  },

  componentDidMount() {
    this._updateNavBar()
    // fetch current fold's list
    // initpage 避免初始化页面2次 loading效果。
    this.setState({ initpage: true })
    this._fetchList(this.props.params.folderId).then(() => {
      this.setState({ initpage: false })
    })
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.params.folderId !== this.props.params.folderId) {
      this._fetchList(nextProps.params.folderId);
      this.props.onChangeNavBarSearch({
        keyword: '',
        searchFunc: this._fetchList.bind(this, nextProps.params.folderId)
      });
      this.setState({
        /* 
        2018.03.29
        这里不需要更新isSearching状态
        而是在fetchList完成后更新
        避免列表提前切换到搜索前的状态 
        */
        // isSearching: false,
        activeId: null,
        mailState: {
          ...this.state.mailState,
          dashboardData: null
        }
      });
    }
  },

  componentDidUpdate(preProps, preState) {
    if (preProps.pwd !== this.props.pwd || preState.mailState.dashboardData !== this.state.mailState.dashboardData) {
      this._updateNavBar()
    }
  },

  componentWillUnmount() {
    // 组件将销毁时通知main隐藏navBar的搜索框
    this.props.onChangeNavBarSearch({
      show: false,
      keyword: '',
      searchFunc: null
    });
  },

  render() {
    const { list, pending, savePending } = this.props;
    const { activeId, showScreenPublish, mailState, initpage } = this.state;
    const showMailConfig = !!mailState.dashboardData
    
    return (
      <div className="modules-page-container data-view-list-page" id="data-view-list-page">
        {
          showMailConfig ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <MailFeedConfig
                dashboardInfo={mailState.dashboardData}
                reportTreeList={list}
                setSubmitFunc={this.handleSetAddMailFunc}
                onSuccess={this.handleAddMailSuccess}
              />
            </div>
          ) : (
            <div className="data-view-list-container" id="data-view-list-container" style={{ width: '100%', height: '100%' }}>
              {this.renderList()}
              <Loading show={pending || savePending || initpage} containerId="data-view-list-container" />
            </div>
          )
        }

        <MultiScreenPublish
          show={showScreenPublish}
          screenId={activeId}
          onClose={this.onCloseScreenPublish}
          onPublish={this.onScreenPublish}>
        </MultiScreenPublish>

        {this.renderReportCopy()}
      </div>
    )
  },

  renderList() {
    const { list, searchList, screenList, pending } = this.props;
    const { activeId, newItemId, isSearching, currNavTab, initpage } = this.state;
    let showList = !isSearching ? list : searchList;
    let emptyText = !isSearching ? '还没有创建报告或文件夹' : '没有匹配的结果'
    if (currNavTab === '多屏管理') {
      showList = screenList
      emptyText = '暂无多屏报告，请点击右上角“创建多屏”'
    }

    if (Array.isArray(showList) && showList.length > 0) {
      return showList.map((item, index) => (
        <FolderItem
          disableMoveToParent={isSearching}
          key={item.id}
          active={activeId === item.id}
          data={item}
          triggerEvent={this._triggerEvent}
          index={index}
          isEditName={item.id === newItemId}
          isPublished={item.status === 1}
          fileType={this.state.currNavTab === '多屏管理' ? 'multi-screen' : 'file'}
        />
      ))
    } else if (!pending && !initpage) {
      return (
        <EmptyStatus
          icon="dmpicon-empty-report"
          text={emptyText}
        />
      )
    }

    return null
  },

  // 渲染报告复制窗口
  renderReportCopy() {
    const { actions } = this.props
    const { copyItem } = this.state

    return copyItem && (
      <ReportFolderSelect
        show
        onSelect={this._copyItem}
        onClose={this.onCloseFolderSelect}
        fetchDataList={actions.fetchDataviewListSilent}
      />
    )
  },

  // 创建报告/文件夹
  handleAddItem(type, isPopoverBtn, e) {
    e.stopPropagation()
    // fix 创建报告的时候按钮 自动 重新focus 的bug
    e.currentTarget.blur && e.currentTarget.blur()

    if (isPopoverBtn) {
      document.body.click();
    }

    // create new report
    if (type === 'FILE') {
      const suffix = this.props.params.folderId ? `/${this.props.params.folderId}` : ''
      this.context.router.push(`${baseAlias}/dataview/report/add${suffix}`)
    } else {
      const newItem = {
        type,
        name: this.DEFAULT_FOLDER_NEW,
        parent_id: this.props.params.folderId || ''
      }
      this.props.actions.fetchAddDataviewItem(newItem, (json) => {
        if (json.result) {
          this.setState({
            newItemId: json.data,
            activeId: json.data
          })
        } else {
          this.showErr(json.msg || '新建失败')
        }
      })
    }
  },

  //创建多屏
  handleAddMultiScreen() {
    this.context.router.push(`${baseAlias}/dataview/multi-screen/add`)
  },

  handleNavTabClick(tabname) {
    this.context.router.push(`${baseAlias}/dataview/index?type=${tabname}`)
    this.setState({
      currNavTab: tabname
    }, () => {
      this._updateNavBar();
      this.props.onChangeNavBarSearch({
        show: this.state.currNavTab === '我的报告'
      })
      this._fetchList(this.props.params.folderId)
    })
  },

  handleAddMail() {
    this._handleAddMail && this._handleAddMail()
  },

  handleSetAddMailFunc(func) {
    this._handleAddMail = func
  },

  handleAddMailSuccess() {
    this.setState({
      mailState: {
        dashboardData: null
      }
    })
    this.showSucc('添加成功')
    return true
  },

  handleCancelAddMail() {
    this.setState({
      mailState: {
        dashboardData: null
      }
    })
  },

  // update nav
  _updateNavBar() {
    const { pwd, onChangeNavBar } = this.props
    const { isSearching, mailState } = this.state

    const isMailConfig = !!mailState.dashboardData

    const path = '/dataview';

    let navTabs = [{
      name: '我的报告',
      url: `${path}/index?type=我的报告`,
      func: this.handleNavTabClick.bind(this, '我的报告')
    }, {
      name: '多屏管理',
      url: `${path}/index?type=多屏管理`,
      func: this.handleNavTabClick.bind(this, '多屏管理')
    }]

    const navs = navTabs.filter(nav => nav.name === this.state.currNavTab)
    const mailNavs = [
      {
        name: '返回',
        func: this.handleCancelAddMail
      }, {
        name: '新增邮件订阅',
      }
    ]

    if (isSearching) {
      navs[0] = {
        name: '搜索结果',
        url: `${path}/index`
      };
      navTabs = []
    } else if (pwd) {
      navs.push(...pwd.map(fold => ({
        name: fold.name,
        url: `${path}/${fold.id}`,
      })));
    }

    let tools = []
    // 检查是否有编辑权限
    /*const authArray = _.get(window, ['dmp::funcs_map', PAGE_CODE['数据报告']])
    const hasEditAuth = _.find(authArray, item => item === EDITABLE_CODE)
    // 收到权限控制的影响
    if (!hasEditAuth) {
      onChangeNavBar(navs, tools, navTabs)
      return
    }*/

    if (this.state.currNavTab === '我的报告') {
      // 如果大于最大层级数目那么不让创建文件夹
      tools = pwd.length >= this.MAX_CHILDREN ? [
        {
          text: '创建报告',
          icon: 'dmpicon-add',
          pagecode: '数据报告',
          visiblecode: 'edit',
          disabled: isSearching,
          func: this.handleAddItem.bind(this, 'FILE', false)
        }
      ] : [{
        text: '创建',
        icon: 'dmpicon-add',
        disabled: isSearching,
        pagecode: '数据报告',
        visiblecode: 'edit',
        subStyle: 'dashboard-popover',
        subs: [{
          text: '创建报告',
          func: this.handleAddItem.bind(this, 'FILE', true)
        }, {
          text: '创建文件夹',
          func: this.handleAddItem.bind(this, 'FOLDER', true)
        }]
      }]
    } else {
      tools = [
        {
          text: '创建多屏',
          icon: 'dmpicon-add',
          pagecode: '数据报告',
          visiblecode: 'edit',
          func: this.handleAddMultiScreen
        }
      ]
    }

    if (isMailConfig) {
      tools = [{
        text: '保存',
        icon: 'dmpicon-save',
        func: this.handleAddMail
      }]
    }

    onChangeNavBar(isMailConfig ? mailNavs : navs, tools, navTabs)

    // 组件将挂载时 通知main显示navBar的搜索框
    this.props.onChangeNavBarSearch({
      show: !isMailConfig && this.state.currNavTab === '我的报告',
      keyword: this.keyword,
      searchFunc: this._fetchList.bind(this, this.props.params.folderId)
    })
  },

  // rename movetoparent delete
  // const {eventName, index, data} = param
  _triggerEvent(param) {
    // hide popover
    document.body.click();

    switch (param.eventName) {
      //active
      case 'active':
        this._setActiveItem(param)
        break
      // 重命名
      case 'rename':
        this._renameItem(param)
        break
      // 移动到上一层
      case 'movetoparent':
        this._moveItemToParent(param)
        break
      // 删除
      case 'delete':
        this._deleteItem(param)
        break
      // 打开
      case 'open':
        this._open(param)
        break
      // 预览
      case 'preview':
        this._preview(param)
        break
      case 'publish':
        this._publish(param)
        break
      case 'copy':
        this._startCopyItem(param)
        break
      // 邮件订阅
      case 'mail':
        this._startMailConfig(param)
        break
      default:
        break
    }
  },

  _setActiveItem(param) {
    const { data } = param;
    this.setState({
      activeId: data.id
    })
  },

  // 重命名
  _renameItem(param) {
    if (param.data.name === '') {
      this.showErr('名称不能为空');
      // 清空新建id
      this.setState({
        newItemId: ''
      });
      return;
    }

    const updateMethod = this.state.currNavTab === '多屏管理' ? 'updateMultiScreenItem' : 'fetchUpdateDataviewItem'
    this.props.actions[updateMethod](param.data, (json) => {
      if (!json.result) {
        this.showErr(json.msg || '修改失败')
      } else {
        this.showSucc(json.msg || '修改成功')
      }
      // 清空新建id
      this.setState({
        newItemId: ''
      });
    })
  },

  _startCopyItem(param) {
    this.setState({
      copyItem: param.data
    })
  },

  _copyItem(FolderId) {
    const { copyItem } = this.state
    const dashboardId = copyItem.id
    const currentId = this.props.params.folderId || ''
    this.props.actions.fetchCopyDataviewItem({
      tragetId: FolderId,
      newName: `${copyItem.name}_副本`,
      isCurrent: currentId === FolderId,           // 是否拷贝到当前目录
      dashboardId
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg || '复制失败')
      } else {
        this.showSucc(json.msg || '复制成功')
      }
    })
    this.setState({
      copyItem: null
    })
  },

  // 移动到文件夹
  _moveItemToParent(param) {
    // targetId 为移动的目标文件夹
    const { id, type } = param.data;
    let { targetId } = param.data
    const { pwd } = this.props

    if (targetId) {
      if (pwd.length >= 2 && type === 'FOLDER') {
        this.showErr('文件夹最多只能有三层')
        return
      }
    } else if (pwd.length < 1) { // 没有那么移动到上一层目录
      this.showErr('上级目录不存在')
      return
    } else if (pwd.length === 1) {
      // 根目录的targetId 为root就行
      targetId = 'root';
    } else {
      targetId = pwd[pwd.length - 2].id;
    }

    this.props.actions.fetchMoveDataviewItem({
      dash_id: id,
      target_dash_id: targetId
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg || '移动失败');
      } else {
        this.showSucc(json.msg || '移动成功');
      }
    })
  },

  _startMailConfig(param) {
    if (param.data.status !== 1) {
      this.showErr('该报告未发布，无法订阅')
      return
    }
    this.setState({
      mailState: {
        ...this.state.mailState,
        dashboardData: param.data
      }
    })
  },

  _resetMailState() {
    this.setState({
      mailState: {
        ...this.state.mailState,
        reportId: ''
      }
    })
  },

  // 删除
  _deleteItem(param) {
    const itemType = param && param.data && param.data.type
    const isMultiScreen = param && param.data && param.data.is_multiple_screen
    const itemName = itemType === 'FILE' ? (isMultiScreen ? '多屏' : '报告') : (itemType === 'FOLDER' ? '文件夹' : '项')
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该{itemName}吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checked: true,
      ok: () => {
        const deleteMethod = this.state.currNavTab === '多屏管理' ? 'deleteMutilScreenItem' : 'fetchDeleteDataviewItem'
        this.props.actions[deleteMethod]({ id: param.data.id }, (json) => {
          if (!json.result) {
            this.showErr(json.msg || '删除失败');
          } else {
            this.showSucc(json.msg || '删除成功');
          }
        })
      }
    })
  },

  // 打开
  _open(param) {
    // 文件夹: 替换最后的id
    if (param.data.type.toUpperCase() === 'FILE') {
      if (this.state.currNavTab === '多屏管理') {
        this.context.router.push(`${baseAlias}/dataview/multi-screen/edit/${param.data.id}`)
        return;
      }
      const parentFolder = param.data.parent_id || 'index'
      const name = encodeURIComponent(param.data.name)
      this.context.router.push(`${baseAlias}/dataview/report/${parentFolder}/${param.data.id}/${name}`)
    } else {
      this.context.router.push(`${baseAlias}/dataview/${param.data.id}`)
    }
  },

  // 预览
  _preview(param) {
    const path = `${baseAlias}/dataview/preview/${param.data.id}`
    WINDOW_OBJECT.open(path, '_blank')
  },

  // 发布
  _publish() {
    this.setState({
      showScreenPublish: true
    })
  },

  onCloseScreenPublish() {
    this.setState({
      showScreenPublish: false
    })
  },

  onScreenPublish() {
    this.setState({
      showScreenPublish: false
    }, () => {
      this._fetchList(this.props.params.folderId, this.keyword)
    })
  },

  onCloseFolderSelect() {
    this.setState({
      copyItem: null
    })
  },

  // 获取列表/搜索列表
  _fetchList(folderId = '', keyword = '') {
    this.keyword = keyword
    const { actions } = this.props
    const searchFunc = (resolve) => {
      if (!_.trim(keyword)) {
        const { currNavTab } = this.state
        if (currNavTab === '我的报告') {
          // 没有搜索关键字 根据当前文件夹获取列表
          actions.fetchDataviewList({
            parent_id: folderId || ''
          }, () => {
            resolve()
            this._changeSearchStatus(false)
          });
        } else if (currNavTab === '多屏管理') {
          actions.fetchMultiScreenList(null, () => {
            resolve()
            this._changeSearchStatus(false)
          });
        }
      } else {
        // 获取搜索列表
        actions.fetchSearchList(keyword, () => {
          this._changeSearchStatus(true)
        });
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => { searchFunc(resolve) }, 300)
    })
  },

  // 更新搜索状态
  _changeSearchStatus(newStatus) {
    this.setState({
      isSearching: newStatus
    }, () => {
      this._updateNavBar();
    });
  },

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  },

  showSucc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  },

  // 新建的报告/文件夹的初始名称
  DEFAULT_FILE_NEW: '新建报告',
  DEFAULT_FOLDER_NEW: '新建文件夹',
  // 最多三级目录
  MAX_CHILDREN: 3
})

const stateToProps = state => ({
  ...state.dataViewList
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(dataViewListActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(DashboardList);
