import React from 'react'
import PropTypes from 'prop-types'
import { Select as TreeSelect, Tree } from 'rt-tree';
import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import Select from 'react-bootstrap-myui/lib/Select';
import { Form, ValidatedInput } from '@components/bootstrap-validation';

import _ from 'lodash'
import { isUrl } from '@helpers/common';

import { APPLICATION_MENU_ICONS } from '../constants';

import 'rt-tree/dist/css/rt-select.css';

class MenuDetailForm extends React.PureComponent {
  static propTypes = {
    showErr: PropTypes.func,
    showSucc: PropTypes.func,
    onSave: PropTypes.func,
    fetchMenuDetail: PropTypes.func,
    menuId: PropTypes.string,
    appMenus: PropTypes.array,
    dashboardTree: PropTypes.array,
    isMobile: PropTypes.bool
  };

  constructor(props) {
    super(props);

    this.state = {
      info: {},
      urlMode: 'report',                            // 链接方式 报告 report   外链 url
      url: '',
      reportId: '',
      nameError: ''
    }
  }

  componentDidMount() {
    this.props.menuId && this._getMenuData(this.props.menuId);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.menuId && nextProps.menuId !== this.props.menuId) {
      this._getMenuData(nextProps.menuId);
    }
  }

  render() {
    const { appMenus, isMobile } = this.props
    const { info, nameError, savePending } = this.state
    const currMenu = _.find(appMenus, item => item.id === info.id)
    const hasSub = info.parent_id ? false : (currMenu && Array.isArray(currMenu.sub) && currMenu.sub.length > 0);

    return (
      <Form className="form-horizontal menu-edit-form application-edit-form"
        validationEvent="onBlur"
        onValidSubmit={this.handleValidSubmitMenu.bind(this, hasSub)}
        ref={(instance) => { this.menu_detail_edit_form = instance }}
      >
        <ValidatedInput
          type="text"
          label={<span><i className="required">*</i>名称</span>}
          autoComplete="off"
          name="name"
          value={info.name || ''}
          onChange={this.handleChangeInfo.bind(this, 'name')}
          maxLength="20"
          wrapperClassName="input-wrapper"
          validate={this._checkName.bind(this)}
          errorHelp={nameError}
        />
        {
          /* 仅当一级菜单可设置icon */
          info && !info.parent_id && (
            <div className="form-group">
              <label className="control-label">
                <span>图标</span>
              </label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <div style={this.STYLE_SHEET.iconShow} className="menu-icon-box">
                  <i className={info.icon} style={{ fontSize: '16px' }} />
                </div>
                <Select
                  className="menu-icon-select"
                  value={info.icon}
                  maxHeight={200}
                  width={'100%'}
                  openSearch={false}
                  onSelected={this.handleChangeIcon.bind(this)}
                >
                  {
                    APPLICATION_MENU_ICONS.map((icon, index) => (
                      <option value={icon} key={`menu-icon-option-${index}`}>
                        <i className={icon} style={{ fontSize: '16px' }} />
                      </option>
                    ))
                  }
                </Select>
              </div>
            </div>
          )
        }
        {!hasSub && this.renderLinkModeOptions()}
        {(!isMobile && !hasSub) && this.renderOpenModeOptions()}
        <div style={{ padding: '50px 0px 30px 0' }}>
          <Button type="button"
            bsStyle="primary"
            style={this.STYLE_SHEET.saveBtn}
            onClick={() => { this.menu_detail_edit_form.submit() }}
            loading={savePending}
          >
            保存
          </Button>
        </div>
      </Form>
    );
  }

  // 渲染链接方式
  renderLinkModeOptions() {
    const { dashboardTree } = this.props
    const { urlMode, url, reportId } = this.state

    return (
      <div className="form-group link-mode">
        <label className="control-label">
          <span>链接方式</span>
        </label>
        <div className="radio-box">
          <div style={{ width: '80px', float: 'left' }}>
            <Input
              type="radio"
              label="报告"
              checked={urlMode === 'report'}
              onChange={() => {}}
              onClick={this.handleChangeUrlMode.bind(this, 'report')}
            />
          </div>
          <div style={{ width: '80px', float: 'left' }}>
            <Input
              type="radio"
              label="外链"
              checked={urlMode === 'url'}
              onChange={() => {}}
              onClick={this.handleChangeUrlMode.bind(this, 'url')}
            />
          </div>
          <div style={{ clear: 'both' }} />
        </div>
        {
          urlMode === 'url' ? (
            <ValidatedInput type="text"
              label={<span><i className="required">*</i>外链地址</span>}
              autoComplete="off"
              name="url"
              value={url || ''}
              onChange={this.handleChangeUrl.bind(this)}
              maxLength="100"
              wrapperClassName="input-wrapper"
              validate={this._checkUrl.bind(this)}
              errorHelp="外链地址不合法"
            />
          ) : (
            <div className="form-group">
              <label className="control-label"><i className="required">*</i>数据报告</label>
              <div className="input-wrapper">
                <TreeSelect
                  search
                  style={{ width: '100%' }}
                  menuStyle={{ width: '100%', maxHeight: 250 }}>
                  <Tree
                    defaultExpanded={Array.isArray(dashboardTree) && dashboardTree.length > 0 ? [dashboardTree[0].id] : []}
                    data={Array.isArray(dashboardTree) && dashboardTree.length > 0 ? dashboardTree : []}
                    disabled={node => (node.type === 'FOLDER')}
                    selected={[reportId || '']}
                    onSelect={this.handleSelectTree.bind(this)}
                    customerIcon={this._getIcon.bind(this)}
                    onChange={this.handleChangeTree.bind(this)}
                  />
                </TreeSelect>
              </div>
            </div>
          )
        }
      </div>
    )
  }

  // 渲染打开方式
  renderOpenModeOptions() {
    const { info } = this.state
    return (
      <div className="form-group">
        <label className="control-label">
          <span>打开方式</span>
        </label>
        <div className="radio-box">
          <div style={{ width: '108px', float: 'left' }}>
            <Input
              type="radio"
              label="当前窗口"
              checked={!info.target}
              onChange={() => {}}
              onClick={this.handleChangeTarget.bind(this, '')}
            />
          </div>
          <div style={{ width: '80px', float: 'left' }}>
            <Input
              type="radio"
              label="新窗口"
              checked={info.target === '_blank'}
              onChange={() => {}}
              onClick={this.handleChangeTarget.bind(this, '_blank')}
            />
          </div>
          <div style={{ clear: 'both' }} />
        </div>
      </div>
    )
  }

  // 输入URL
  handleChangeUrl(e) {
    this.setState({
      url: e.target.value
    });
  }

  // 报告选择变更
  handleChangeTree(value) {
    const { reportId } = this.state;

    if (value[0] === reportId) {
      return;
    }

    this.setState({
      reportId: value[0]
    });
  }

  // 禁用点击
  handleSelectTree(select, value, options) {
    if (options.type === 'FOLDER') {
      return false
    }
  }

  // 提交菜单设置保存
  handleValidSubmitMenu(hasSub) {
    const { info, urlMode, url, reportId } = this.state;
    // 非一级菜单自动清空icon
    if (info.parent_id) {
      info.icon = '';
    }
    // 一级菜单已创建菜单的情况下确保target和url为空
    if (!info.parent_id && hasSub) {
      info.target = '';
      info.url = '';
    } else {
      info.url = urlMode === 'url' ? url : reportId;

      if (!info.url) {
        this.props.showErr(`尚未配置${urlMode === 'url' ? '外链地址' : '数据报告'}`);
        return;
      }
    }
    // 提交时按钮进入loading状态
    this.setState({ savePending: true })
    this.props.onSave(info, () => {
      this.setState({ savePending: false })
    });
  }

  // 切换icon
  handleChangeIcon(opts) {
    if (opts.value === this.state.info.icon) {
      return;
    }
    this.setState({
      info: {
        ...this.state.info,
        icon: opts.value
      }
    })
  }

  // 切换链接方式
  handleChangeUrlMode(mode) {
    if (mode === this.state.urlMode) {
      return;
    }
    this.setState({
      urlMode: mode
    });
  }

  // 切换打开方式
  handleChangeTarget(mode) {
    if (mode === this.state.info.target) {
      return;
    }
    this.setState({
      info: {
        ...this.state.info,
        target: mode
      }
    });
  }

  // 输入事件
  handleChangeInfo(field, e) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: e.target.value
      }
    });
  }

  // 获取树形组件图标
  _getIcon(item, expanded) {
    const className = item.type === 'FILE' ? 'dmpicon-empty-report' : (expanded ? 'dmpicon-folder-open' : 'dmpicon-folder-close')

    return <i className={className} style={this.STYLE_SHEET.treeIcon} />
  }

  // 获取菜单数据
  _getMenuData(id) {
    this.props.fetchMenuDetail(id, (json) => {
      if (json.result) {
        const isUrlMode = isUrl(json.data.url);

        this.setState({
          info: {
            ...json.data,
            icon: json.data.icon || APPLICATION_MENU_ICONS[0]
          },
          urlMode: isUrlMode ? 'url' : 'report',
          reportId: isUrlMode ? '' : (json.data.url || ''),
          url: isUrlMode ? (json.data.url || '') : '',
        });
      } else {
        this.props.showErr(json.msg);
      }
    })
  }

  // 检查URL输入合法性
  _checkUrl(val) {
    if (val.trim() && !isUrl(val)) {
      return false;
    }
    return true;
  }

  // 检查名称
  _checkName(val) {
    const { isMobile } = this.props
    const maxChLen = isMobile ? 4 : 8
    if (!val.trim()) {
      this.setState({
        nameError: '请输入应用名称'
      });
      return false;
    } else if (val.replace(/[^\x00-\xff]/g, 'aa').length > maxChLen * 2) {
      // 将双字节字符转为两个英文字符后统计长度 >= 16
      this.setState({
        nameError: `名称长度不允许超过${maxChLen}个中文`
      });
      return false;
    }
    return true;
  }

  // 除 hover、theme以外的样式
  STYLE_SHEET = {
    saveBtn: {
      width: '80px',
      height: '30px',
      minWidth: '80px',
      minHeight: '30px',
      lineHeight: '30px',
      fontSize: '14px'
    },
    iconShow: {
      position: 'absolute',
      left: '1px',
      top: '1px',
      right: '27px',
      bottom: '1px',
      padding: '7px 0 7px 10px',
      zIndex: 1,
      pointerEvents: 'none'
    },
    treeIcon: {
      fontFamily: "'dmpicon' !important",
      speak: 'none',
      fontStyle: 'normal',
      fontWeight: 'normal',
      fontVariant: 'normal',
      textTransform: 'none',
      lineHeight: 1,
      color: '#24BBF9',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
    }
  }
}

export default MenuDetailForm;
