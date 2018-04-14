import React from 'react';
import PropTypes from 'prop-types';

const NO_OP = () => { }

export const PAGE_CODE = {
  用户管理: 'user',
  数据报告: 'data-report',
  概览: 'flow-dashboard',
  指标定义: 'indicator-definition',
  标签定义: 'label-definition',
  首页: 'Home',
  流程运维: 'flow-ops',
  离线大数据: 'offline-bigdata',
  日志监控: 'log',
  数据清洗: 'data-clean',
  添加数据源: 'add-datasource',
  角色管理: 'user-role',
  指标配置: 'indicator-configuration',
  用户组管理: 'user-group',
  访问控制: 'system-control',
  移动报表: 'mobile-report',
  创建数据集: 'add-dataset',
  组织权限: 'permission',
  应用门户: 'app-site',
  订阅管理: 'feeds',
  流程监测: 'flow-monitor'
}

// 可查看权限的识别码
export const VISIBLE_CODE = 'view'

// 可编辑权限的识别码
export const EDITABLE_CODE = 'edit'

export default class AuthComponent extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    pagecode: PropTypes.oneOf(Object.keys(PAGE_CODE)),    // 页面对应的 code
    visiblecode: PropTypes.string,                        // 对应后端的可查看 action_code
    editablecode: PropTypes.string,                       // 对应后端的可编辑 action_code
    allowevents: PropTypes.array,                         // 允许往下传递的事件
    enablePointer: PropTypes.bool,                        // 开启 pointerEvents
    editProp: PropTypes.string,                           // 配合pointerEvents:false 对某些需要设置滚动的组件进行 一个是否可编辑的设置。如 editable
  };

  static defaultProps = {
    visiblecode: VISIBLE_CODE,
    editablecode: EDITABLE_CODE,
    enablePointer: true
  }

  constructor(props) {
    super(props)

    this.actionsList = window['dmp::funcs_map']
    this.currPageFuncs = this.actionsList ? this.actionsList[PAGE_CODE[props.pagecode]] : null
  }

  render() {
    const { pagecode, children, allowevents } = this.props
    // 是否 可编辑
    const editable = pagecode ? this.isEditable() : true
    // 是否可见
    const visible = pagecode ? this.isVisible() : true
    // 得到 newprops
    const newChildProps = this.mergeProps(editable, children.props, allowevents)
    // 合并到 children
    return visible ? React.createElement(children.type, newChildProps, children.props.children) : null
  }

  mergeProps(editable, props, allowevents) {
    const { style } = props
    const { enablePointer, editProp } = this.props

    // 是否存在事件
    let unEvents = editable

    // 如果允许的事件存在并且不为空
    if (!editable) {
      // 默认pointer-events: none
      unEvents = false
      if (allowevents && allowevents.length > 0) {
        unEvents = false
        // 如果 绑定了 事件。则不禁用
        for (let i = 0; i < allowevents.length; i++) {
          if (props[allowevents[i]] && typeof props[allowevents[i]] === 'function') {
            unEvents = true
            break;
          }
        }
      }
    }

    // 合并 新 props
    props = {
      ...props,
      style: {
        ...(style || {}),
        pointerEvents: !unEvents && enablePointer ? 'none' : 'unset'
      }
    }

    // editProp有传入时加上（避免出现undefined=XXX的属性）
    if (editProp !== undefined) {
      props[editProp] = editable
    }

    // 如果存在拖拽
    if (props.draggable) {
      props.draggable = editable
    }

    if (!editable) {
      // 不存在可以传递的事件
      if (!allowevents || (allowevents && allowevents.length === 0)) {
        props.style.cursor = 'unset'
      }
      // 监听 props 对象的修改
      // new Proxy(newProps, addListenerProps)
      Object.getOwnPropertyNames(props).forEach((key) => {
        // 如果 allowevents 存在
        if (new RegExp('^on*').test(key) && typeof props[key] === 'function' && (!allowevents || (allowevents && allowevents.indexOf(key) === -1))) {
          props[key] = NO_OP
        }
      })
    }

    return props
  }

  // 是否可见
  isVisible() {
    const { visiblecode } = this.props
    return this.currPageFuncs ? this.currPageFuncs.indexOf(visiblecode) > -1 : true
  }

  // 是否可编辑
  isEditable() {
    const { editablecode } = this.props
    return this.currPageFuncs ? this.currPageFuncs.indexOf(editablecode) > -1 : false
  }
}
