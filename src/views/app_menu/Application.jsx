import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import Loading from 'react-bootstrap-myui/lib/Loading';
import ApplicationDetailForm from './components/ApplicationDetailForm';
import MenuDetailForm from './components/MenuDetailForm';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as appMenuActionCreators } from '../../redux/modules/app_menu/app_menu';
import { actions as userActionCreators } from '../../redux/modules/organization/user';
import { actions as commonActionCreators } from '../../redux/modules/common';

import TipMixin from '../../helpers/TipMixin';
import ConfirmMixin from '../../helpers/ConfirmsMixin';
import classnames from 'classnames'

import { APPLICATION_MENU_ICONS } from './constants';

import './app_menu.less';

const ApplicationDetailPage = createReactClass({
  displayName: 'ApplicationDetailPage',

  mixins: [TipMixin, ConfirmMixin],

  propTypes: {
    onChangeNavBar: PropTypes.func,
    params: PropTypes.object,
    actions: PropTypes.object
  },

  getInitialState() {
    return {
      activeMenu: null,                           // 当前激活的配置项(null为APP设置)
      menuSpreads: {},                            // 菜单展开项({[id]: true/false})
      isMobile: false
    }
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar([{
      name: '应用门户',
      url: '/app_menu/list'
    }, {
      name: '编辑应用'
    }]);
  },

  componentDidMount() {
    const { params, actions } = this.props
    const application_id = params.id;
    // 获取应用详情
    actions.fetchApplicationDetail(application_id, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.setState({
          isMobile: json.data.platform === 'mobile'
        })
        // 获取报告树（仅获取对应平台类型的）
        actions.fetchDashboardTree({ include_platforms: json.data.platform })
      }
    });
    // 获取菜单树
    actions.fetchMenuTree(application_id)
  },

  componentWillUnmount() {
    // 页面销毁时同时清除APP数据
    this.props.actions.clearApplicationData();
  },

  render() {
    const { pending, applicationData, applicationMenus, dashboardTree, actions } = this.props;
    const { activeMenu, isMobile } = this.state;
    const appNameClass = classnames('application-item', { active: activeMenu === null })
    return (
      <div className="modules-page-container">
        <div className="data-view application-detail-page"
          id="application-detail-page"
          style={{ overflow: 'hidden', display: 'block' }}>
          <div className="left application-config" style={this.STYLE_SHEET.left}>
            <div className="application-config-title" style={this.STYLE_SHEET.title}>
              <b style={this.STYLE_SHEET.titleLine} />
              应用设置
            </div>
            <div className="application-config-app" style={this.STYLE_SHEET.appConfig}>
              <div className={appNameClass}
                onClick={this.handleChangeActiveMenu.bind(this, null)}
                style={this.STYLE_SHEET.appItem}
              >
                {applicationData.name || ''}
              </div>
            </div>
            <div className="application-config-title" style={this.STYLE_SHEET.title}>
              <b style={this.STYLE_SHEET.titleLine} />
              菜单设置
              <i className="dmpicon-add add-menu-btn"
                title="添加一级菜单"
                onClick={this.handleAddRootMenu}
                style={this.STYLE_SHEET.addBtn}
              />
            </div>
            <div className="application-menu-tree-container"
              style={this.STYLE_SHEET.menuTree}>
              {
                Array.isArray(applicationMenus) && applicationMenus.length > 0 ? (
                  this.renderMenu()
                ) : (
                  <div className="hint-color" style={{ padding: '30px 0 0 0', textAlign: 'center' }}>
                    请先添加一级菜单
                  </div>
                )
              }
            </div>
          </div>

          <div className="right" style={this.STYLE_SHEET.right}>
            {
              activeMenu === null ? (
                <ApplicationDetailForm
                  showErr={this.showErr}
                  showSucc={this.showSucc}
                  onUpload={actions.fetchUploadImage}
                  onSave={this.handleSaveApplication}
                  appData={applicationData}
                  appMenus={applicationMenus}
                  dashboardTree={dashboardTree}
                  isMobile={isMobile}
                />
              ) : (
                <MenuDetailForm
                  showErr={this.showErr}
                  showSucc={this.showSucc}
                  onSave={this.handleSaveAppMenu}
                  menuId={activeMenu}
                  appMenus={applicationMenus}
                  dashboardTree={dashboardTree}
                  fetchMenuDetail={actions.fetchMenuDetail}
                  isMobile={isMobile}
                />
              )
            }
          </div>

          <Loading show={pending} containerId='application-detail-page' />
        </div>
      </div>
    )
  },

  // 渲染菜单
  renderMenu() {
    const { applicationMenus } = this.props;

    const { menuSpreads, activeMenu, isMobile } = this.state;

    // 二级菜单项
    const SortableSubMenuItem = SortableElement(({ item }) => {
      const isActive = activeMenu === null ? false : (item.id === activeMenu);

      return (
        <div className={`application-menu-item application-sub-menu-item ${isActive ? 'active' : ''}`}
          style={this.STYLE_SHEET.subMenuItem}
          onClick={this.handleChangeActiveMenu.bind(this, item)}
        >
          {item.name}
          <div className="application-menu-action-bar" style={this.STYLE_SHEET.menuAction}>
            <i className="dmpicon-del"
              onClick={this.handleDeleteMenu.bind(this, item)}
              style={{ transition: 'color .3s', fontSize: '16px' }} />
          </div>
        </div>
      )
    });

    // 二级菜单容器
    const SortableSubMenuList = SortableContainer(({ items, groupIndex }) => (
      <div className="sortable-sub-menu-container">
        {
          items.map((item, index) => (
            <SortableSubMenuItem key={item.id} index={index} item={item} collection={groupIndex} />
          ))
        }
      </div>
    ));

    // 一级菜单拖拽项
    const RootMenuDragHandle = SortableHandle(({ item }) => {
      const isSpread = menuSpreads[item.id];
      const isActive = activeMenu === null ? false : (item.id === activeMenu);

      return (
        <div className={`application-menu-item application-root-menu-item ${isActive ? 'active' : ''}`}
          onClick={this.handleChangeActiveMenu.bind(this, item)}
          style={this.STYLE_SHEET.menuItem}
        >
          {
            Array.isArray(item.sub) && item.sub.length > 0 && (
              <div className="spread-btn"
                onClick={this.handleToggleMenuSpread.bind(this, item)}
                style={this.STYLE_SHEET.spreadBtn}>
                <i className="dmpicon-triangle spread-btn hint-color"
                  style={isSpread ? this.STYLE_SHEET.spreadIconOn : this.STYLE_SHEET.spreadIconOff}
                />
              </div>
            )
          }
          {item.name}
          <div className="application-menu-action-bar" style={this.STYLE_SHEET.menuAction}>
            {
              !isMobile && (
                <i className="dmpicon-add"
                  onClick={this.handleAddSubMenu.bind(this, item)}
                  style={{ transition: 'color .3s', fontSize: '16px', marginRight: '16px' }}
                />
              )
            }
            <i className="dmpicon-del"
              onClick={this.handleDeleteMenu.bind(this, item)}
              style={{ transition: 'color .3s', fontSize: '16px' }}
            />
          </div>
        </div>
      );
    });

    // 一级菜单项
    const SortableRootMenuItem = SortableElement(({ item, groupIndex }) => {
      const isSpread = menuSpreads[item.id];

      return (
        <div className="application-root-menu-item-box">
          <RootMenuDragHandle item={item} />
          {
            Array.isArray(item.sub) && item.sub.length > 0 && isSpread && (
              <SortableSubMenuList items={item.sub}
                key={item.id}
                groupIndex={groupIndex}
                helperClass="sortable-menu-item"
                axis="y"
                lockAxis="y"
                distance={10}
                lockToContainerEdges={true}
                onSortEnd={this.handleMoveSubMenu.bind(this, item.sub, groupIndex)}
              />
            )
          }
        </div>
      );
    });

    // 一级菜单容器
    const SortableRootMenuList = SortableContainer(({ items }) => (
      <div className="sortable-root-menu-container">
        {
          items.map((item, index) => (
            <SortableRootMenuItem key={item.id} index={index} groupIndex={index} item={item} />
          ))
        }
      </div>
    ));

    return (
      <SortableRootMenuList items={applicationMenus}
        helperClass="sortable-menu-item"
        axis="y"
        lockAxis="y"
        distance={10}
        useDragHandle={true}
        lockToContainerEdges={true}
        onSortEnd={this.handleMoveRootMenu} />
    );
  },

  // 切换菜单展开状态
  handleToggleMenuSpread(menu, e) {
    e.stopPropagation();

    this.setState({
      menuSpreads: {
        ...this.state.menuSpreads,
        [menu.id]: !this.state.menuSpreads[menu.id]
      }
    })
  },

  // 一级菜单排序
  handleMoveRootMenu({ oldIndex, newIndex }) {
    const { applicationMenus, actions } = this.props;
    const source_id = applicationMenus[oldIndex].id;

    let target_id;

    if (oldIndex === newIndex) {
      return;
    } else if (oldIndex > newIndex) {
      target_id = applicationMenus[newIndex].id;
    } else {
      target_id = applicationMenus[newIndex + 1] ? applicationMenus[newIndex + 1].id : '';
    }

    actions.fetchChangeMenuRank({
      source_id,
      target_id,
      oldIndex,
      newIndex,
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSucc(json.msg);
        this._checkNeedUpdateUserProfile()
      }
    });
  },

  // 二级菜单排序
  handleMoveSubMenu(subMenus, index, { oldIndex, newIndex }) {
    const source_id = subMenus[oldIndex].id;

    let target_id;

    if (oldIndex === newIndex) {
      return;
    } else if (oldIndex > newIndex) {
      target_id = subMenus[newIndex].id;
    } else {
      target_id = subMenus[newIndex + 1] ? subMenus[newIndex + 1].id : '';
    }

    this.props.actions.fetchChangeMenuRank({
      source_id,
      target_id,
      oldIndex,
      newIndex,
      subIndex: index
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSucc(json.msg);
        this._checkNeedUpdateUserProfile()
      }
    });
  },

  // 新增一级应用菜单
  handleAddRootMenu(e) {
    e.stopPropagation(e);
    const { applicationMenus, applicationData, actions, params } = this.props;
    const { isMobile } = this.state
    // 是否没有一级菜单
    const noRootMenu = !Array.isArray(applicationMenus) || applicationMenus.length === 0
    // 下一个菜单的编号
    const nextMenuNo = noRootMenu ? 1 : (applicationMenus.length + 1)
    // 新菜单Object
    const newMenu = {
      application_id: params.id,
      name: isMobile ? `菜单项-${nextMenuNo}` : `一级菜单${nextMenuNo}`,
      icon: APPLICATION_MENU_ICONS[0]
    };
    // 如果是该应用下创建的第一个一级菜单
    if (noRootMenu) {
      // 继承应用的target和url
      newMenu.url = applicationData.url;
      newMenu.target = applicationData.target;

      // 清除应用的url和target
      applicationData.url = '';
      applicationData.target = '';

      // 先提交应用的变更
      actions.fetchUpdateApplication(applicationData, (json) => {
        if (json.result) {
          // 成功变更后进行一级菜单的添加
          actions.fetchAddMenu(newMenu, (_json) => {
            if (!_json.result) {
              this.showErr(_json.msg);
            } else {
              this.showSucc(_json.msg);
              this._checkNeedUpdateUserProfile()
            }
          });
        } else {
          this.showErr('添加失败');
        }
      });
    } else if (isMobile && applicationMenus.length >= 4) {
      this.showErr('移动应用门户菜单数量不允许超过4个')
    } else {
      actions.fetchAddMenu(newMenu, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.showSucc(json.msg);
          this._checkNeedUpdateUserProfile()
        }
      })
    }
  },

  // 新增二级应用菜单
  handleAddSubMenu(parentMenu, e) {
    e.stopPropagation(e);
    const { params, actions } = this.props
    // 是否没有二级菜单
    const noSubMenu = !Array.isArray(parentMenu.sub) || parentMenu.sub.length === 0
    // 下一个菜单的编号
    const nextMenuNo = noSubMenu ? 1 : (parentMenu.sub.length + 1)
    // 新菜单Object
    const newMenu = {
      application_id: params.id,
      parent_id: parentMenu.id,
      name: `二级菜单${nextMenuNo}`
    };

    // 如果是该一级菜单下第一个创建的二级菜单
    if (noSubMenu) {
      // 继承一级菜单的target和url
      newMenu.target = parentMenu.target;
      newMenu.url = parentMenu.url;

      // 清除一级菜单的url和target
      parentMenu.url = '';
      parentMenu.target = '';

      // 先提交一级菜单的变更 后添加二级菜单(否则会因为一级菜单设置了url无法添加)
      actions.fetchUpdateMenu(parentMenu, (json) => {
        if (json.result) {
          // 成功变更后进行二级菜单的添加
          actions.fetchAddMenu(newMenu, (_json) => {
            if (!_json.result) {
              this.showErr(_json.msg);
            } else {
              this.showSucc(_json.msg);
              this._checkNeedUpdateUserProfile()
            }
          });
        } else {
          this.showErr('添加失败');
        }
      })
    } else {
      actions.fetchAddMenu(newMenu, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.showSucc(json.msg);
          this._checkNeedUpdateUserProfile()
        }
      });
    }
  },

  // 删除应用菜单
  handleDeleteMenu(menu, e) {
    e.stopPropagation();

    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该应用菜单吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.fetchDeleteMenu(menu, (json) => {
          if (!json.result) {
            this.showErr(json.msg);
          } else {
            this.showSucc(json.msg);
            this._checkNeedUpdateUserProfile()
            if (menu.id === this.state.activeMenu) {
              // 如果删除了当前选中的菜单项 则跳转到应用设置
              this.setState({
                activeMenu: null
              });
            }
          }
        });
      }
    });
  },

  // 切换激活的应用
  handleChangeActiveMenu(menu) {
    const { applicationData } = this.props
    const { activeMenu } = this.state
    // 没有变化时不处理
    if ((menu === null && activeMenu === null) || (menu !== null && menu.id === activeMenu)) {
      return;
    }

    if (menu === null) {
      this.setState({
        activeMenu: null
      });
    } else {
      // 如果选中的是菜单项目 则需要对其进行强制展开
      this.setState({
        activeMenu: menu.id,
        menuSpreads: {
          ...this.state.menuSpreads,
          [menu.parent_id ? menu.parent_id : menu.id]: true
        }
      });
    }

    // 切换时获取报告树 确保最新
    this.props.actions.fetchDashboardTree({
      include_platforms: applicationData ? applicationData.platform : 'pc'
    });
  },

  // 保存应用基础设置
  handleSaveApplication(data, callback) {
    this.props.actions.fetchUpdateApplication(data, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSucc(json.msg);
        this._checkNeedUpdateUserProfile()
      }
      typeof callback === 'function' && callback()
    })
  },

  // 保存应用菜单设置
  handleSaveAppMenu(data, callback) {
    this.props.actions.fetchUpdateMenu(data, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSucc(json.msg);
        this._checkNeedUpdateUserProfile()
      }
      typeof callback === 'function' && callback()
    });
  },

  // 检查是否需要更新userProfile
  _checkNeedUpdateUserProfile() {
    const { applicationData, actions } = this.props

    // 如果是激活的pc端应用门户 则请求更新userProfile
    if (applicationData.platform === 'pc' && applicationData.enable === 1) {
      actions.fetchUserProfileSilent()
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
      content: error
    })
  },

  STYLE_SHEET: {
    // 左侧容器
    left: {
      width: '280px',
      height: '100%',
      position: 'relative'
    },
    // 左侧标题容器
    title: {
      height: '50px',
      paddingLeft: '30px',
      lineHeight: '50px',
      position: 'relative'
    },
    // 左侧标题装饰
    titleLine: {
      backgroundImage: 'linear-gradient(0deg, #488DFB 0%, #0DCDDB 100%)',
      width: '2px',
      height: '22px',
      position: 'absolute',
      left: '14px',
      top: '14px'
    },
    // 左侧APP设置
    appConfig: {
      paddingBottom: '20px',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid'
    },
    // 添加菜单按钮
    addBtn: {
      position: 'absolute',
      right: 0,
      top: '7px',
      padding: '9px',
      fontSize: '18px',
      transition: 'color .3s',
      cursor: 'pointer'
    },
    // 应用设置项
    appItem: {
      height: '40px',
      padding: '0 10px 0 30px',
      lineHeight: '40px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      transition: 'all .3s',
      cursor: 'pointer'
    },
    // 菜单树容器
    menuTree: {
      position: 'absolute',
      left: 0,
      top: '162px',
      bottom: 0,
      width: '100%',
      overflowX: 'hidden',
      overflowY: 'auto'
    },
    // 菜单项目
    menuItem: {
      padding: '0 10px 0 30px',
      height: '40px',
      lineHeight: '40px',
      position: 'relative',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    subMenuItem: {
      padding: '0 10px 0 44px',
      height: '40px',
      lineHeight: '40px',
      position: 'relative',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    spreadBtn: {
      position: 'absolute',
      left: '8px',
      padding: '14px 5px'
    },
    spreadIconOn: {
      display: 'block',
      fontSize: '12px',
      transition: 'transform .3s',
      transform: 'scale(.66)'
    },
    spreadIconOff: {
      display: 'block',
      fontSize: '12px',
      transition: 'transform .3s',
      transform: 'scale(.66) rotateZ(-90deg)'
    },
    // 菜单项操作按钮
    menuAction: { position: 'absolute', right: 0, top: 0, lineHeight: 1, padding: '12px 10px' },
    // 右侧容器
    right: {
      position: 'absolute',
      left: '292px',
      top: 0,
      right: 0,
      bottom: 0,
      overflowX: 'hidden',
      overflowY: 'auto'
    },
  },
});

const stateToProps = state => ({
  ...state.app_menu,
  userProfile: state.user.userProfile
});

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, userActionCreators, appMenuActionCreators, commonActionCreators), dispatch)
});

export default connect(stateToProps, dispatchToProps)(ApplicationDetailPage);
