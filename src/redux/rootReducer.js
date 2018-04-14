import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
// 通用
import common from './modules/common';
// 数据看板
import dataViewList from './modules/dataview/list';
import dataViewItemDetail from './modules/dataview/itemDetail';
import dataViewAddOrEdit from './modules/dataview/addOrEdit';
import dataViewLabel from './modules/dataview/label';
import dataViewAddReport from './modules/dataview/addReport';
import dataViewMultiScreen from './modules/dataview/multiScreen';
// 数据源管理
import datasource from './modules/datasource/datasource';
// 数据清洗管理
import dataclean from './modules/dataclean/dataclean';
import dataclean_flow from './modules/dataclean/flow';
// 业务指标定义/配置
import indicator from './modules/indicator/indicator';
import indicator_template from './modules/indicator/template';
// 用户组管理
import user_group from './modules/organization/userGroup';
import userLog from './modules/organization/userLog';
// 用户管理
import user from './modules/organization/user';
// 应用门户
import app_menu from './modules/app_menu/app_menu';
// 标签
import labelList from './modules/label/list';
import labelDetailDownTask from './modules/label/downTask';
import labelAddOrEdit from './modules/label/addOrEdit';
// 流程运维
import flowOverview from './modules/flow/overview';
import flowOps from './modules/flow/ops';
// 数据集管理
import dataset from './modules/dataset/dataset';
// 权限管理
import authorityRole from './modules/authority/role';
import authorityUser from './modules/authority/user';
import authorityUserGroup from './modules/authority/userGroup';
// 邮件订阅
import feeds from './modules/feeds/feeds';

const rootReducer = combineReducers({
  // 通用
  common,
  // 看板
  dataViewList,
  dataViewItemDetail,
  dataViewAddOrEdit,
  dataViewLabel,
  dataViewAddReport,
  dataViewMultiScreen,
  // 数据源管理
  datasource,
  // 数据清洗管理
  dataclean,
  dataclean_flow,
  // 业务指标定义
  indicator,
  indicator_template,
  // 用户组管理
  user_group,
  // 用户管理
  user,
  // 应用门户
  app_menu,
  // 标签
  labelList,
  labelDetailDownTask,
  labelAddOrEdit,
  // 流程运维
  flowOverview,
  flowOps,

  // 数据集
  dataset,
  // 用户日志
  userLog,
  // 权限管理
  authorityRole,
  authorityUser,
  authorityUserGroup,
  //routing，这个Key值不能变，在redux-simple-router.syncHistory(history).listenForReplays(store)会用到
  routing,
  feeds,
});

export default rootReducer;
