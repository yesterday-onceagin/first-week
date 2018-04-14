import PropTypes from 'prop-types'
import React from 'react'

import createReactClass from 'create-react-class'

import Loading from 'react-bootstrap-myui/lib/Loading'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import AppItem from './components/AppItem'
import AppDialog from './components/AppDialog'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as appMenuActionCreators } from '../../redux/modules/app_menu/app_menu'
import { actions as userActionCreators } from '../../redux/modules/organization/user'

import AuthComponent from '@components/AuthComponent'

import _ from 'lodash'
import TipMixin from '../../helpers/TipMixin'
import ConfirmMixin from '../../helpers/ConfirmsMixin'
import { baseAlias } from '../../config'

import './app_menu.less'

const ApplicationListPage = createReactClass({
  displayName: 'ApplicationListPage',
  
  mixins: [TipMixin, ConfirmMixin],

  propTypes: {
    userProfile: PropTypes.object,
    actions: PropTypes.object,
    onChangeNavBar: PropTypes.func
  },

  getInitialState() {
    return {
      appDialog: {
        show: false,
        info: {}
      }
    }
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('应用门户');
  },

  componentDidMount() {
    // 获取列表
    this.props.actions.fetchApplicationList({
      page: 1,
      page_size: 10000
    });
  },

  render() {
    const { applicationList, pending, listPending } = this.props;
    const { appDialog } = this.state;

    const SortableItem = SortableElement(({ item }) => (
      <AuthComponent pagecode="应用门户">
        <AppItem
          item={item}
          onDel={this.handleDeleteApplication.bind(this, item)}
          onEdit={this.handleEditApplication.bind(this, item.id)}
          onToggleEnable={this.handleToggleApplicationEnable.bind(this, item)}
        />
      </AuthComponent>
    ));

    const SortableList = SortableContainer(({ items }) => (
      <div style={this.STYLE_SHEET.wrapStyle} className="sortable-app-grid">
        <AuthComponent pagecode="应用门户" visiblecode="edit">
          <AppItem onAdd={this.handleOpenAddDialog}/>
        </AuthComponent>
        {
          items.map((item, index) => (
            <SortableItem key={item.id} index={index} sortIndex={index} item={item} />
          ))
        }
      </div>
    ));

    const appList = Array.isArray(applicationList) ? applicationList : []

    return (
      <div className="modules-page-container">
        <div
          className="data-view application-list-page"
          style={this.STYLE_SHEET.scrollStyle}
        >
          {
            !listPending && (
              <SortableList
                items={appList}
                helperClass="sortable-application-item"
                axis="xy"
                distance={10}
                lockToContainerEdges={true}
                onSortEnd={this.handleMoveApplication}
              />
            )
          }
          {
            appDialog.show && (
              <AppDialog
                show={appDialog.show}
                data={appDialog.info}
                pending={pending}
                onSure={this.handleSubmitAddDialog}
                onHide={this.handleCloseAddDialog}
              />
            )
          }
          <Loading show={pending || listPending} containerId='addon-list-page' />
        </div>
      </div>
    )
  },

  // 应用排序
  handleMoveApplication({ oldIndex, newIndex }) {
    const { applicationList } = this.props;

    const source_id = applicationList[oldIndex].id;

    let target_id;
    let appArray;

    if (oldIndex === newIndex) {
      return;
    } else if (oldIndex > newIndex) {
      target_id = applicationList[newIndex].id;
      appArray = applicationList.slice(newIndex, oldIndex)
    } else {
      target_id = applicationList[newIndex + 1] ? applicationList[newIndex + 1].id : '';
      appArray = applicationList.slice(oldIndex, newIndex)
    }

    this.props.actions.fetchChangeApplicationRank({
      source_id,
      target_id,
      oldIndex,
      newIndex
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        // 如果排序涉及到pc端应用门户 重新请求userProfile已实时同步
        if (appArray.map(item => item.platform).indexOf('pc') > -1) {
          this.props.actions.fetchUserProfileSilent()
        }
        this.showSucc(json.msg);
      }
    })
  },

  // 打开创建应用对话框
  handleOpenAddDialog() {
    this.setState({
      appDialog: {
        show: true,
        info: {}
      }
    });
  },

  // 提交创建应用
  handleSubmitAddDialog(data) {
    this.props.actions.fetchAddApplication(data, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.handleCloseAddDialog();
        this.showSucc(json.msg);
      }
    });
  },

  // 关闭创建应用对话框
  handleCloseAddDialog() {
    this.setState({
      appDialog: {
        show: false,
        info: {}
      }
    });
  },

  // 编辑应用
  handleEditApplication(id, e) {
    e.stopPropagation();
    this.context.router.push(`${baseAlias}/app_menu/detail/${id}`);
  },

  // 切换应用的启用禁用状态
  handleToggleApplicationEnable(app, e) {
    // 新的状态
    const newEnableStatus = !app.enable
    e.stopPropagation();
    this.props.actions.fetchChangeApplicationEnable(app.id, newEnableStatus, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else if (app.platform === 'pc') {
        // pc平台的需要额外处理顶部菜单
        this.showSucc(json.msg);
        if (newEnableStatus) {
          // 如果启用 重新请求userProfile
          this.props.actions.fetchUserProfileSilent()
        } else {
          // 如果是禁用 直接从profile中删除该应用
          this._deleteAppFromUserProfile(app.id)
        }
      } else {
        this.showSucc(json.msg);
      }
    });
  },

  // 删除应用
  handleDeleteApplication(app, e) {
    e.stopPropagation();
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该应用门户吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.fetchDeleteApplication(app.id, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg || '删除失败');
          } else {
            this.showSucc(json.msg);
            // 如果是启用的pc平台应用，还需要从userProfile中同步删除
            if (app.enable === 1 && app.platform === 'pc') {
              this._deleteAppFromUserProfile(app.id)
            }
          }
        })
      }
    });
  },

  // 同步删除userProfile中的对应app
  _deleteAppFromUserProfile(appId) {
    this.props.actions.updateAppData({
      action: 'delete',
      appId
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

  STYLE_SHEET: {
    scrollStyle: {
      overflowX: 'hidden',
      overflowY: 'auto',
      width: '100%',
      height: '100%',
      display: 'block',
    },
    wrapStyle: {
      height: '100%',
      display: 'block',
      position: 'relative',
      zIndex: 0,
      marginRight: '-25px'
    },
    emptyWrap: {
      width: '100%',
      height: '100%',
      position: 'relative'
    },
    emptyBox: {
      fontSize: '18px',
      textAlign: 'center',
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)'
    },
    emptyIcon: {
      display: 'block',
      fontSize: '100px',
      paddingBottom: '10px'
    }
  }
});

const stateToProps = state => ({
  ...state.app_menu,
  userProfile: state.user.userProfile
});

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, userActionCreators, appMenuActionCreators), dispatch)
});

export default connect(stateToProps, dispatchToProps)(ApplicationListPage);
