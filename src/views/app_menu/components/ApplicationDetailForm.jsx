import React from 'react'
import PropTypes from 'prop-types'

import { Select as TreeSelect, Tree } from 'rt-tree';
import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import { Form, ValidatedInput } from '../../../components/bootstrap-validation';
import FormImageUploader from '../../../components/FormImageUploader';

import _ from 'lodash';
import { isUrl } from '../../../helpers/common';
import { baseAlias } from '../../../config'
import '../../../libs/jquery.qrcode.min'

import 'rt-tree/dist/css/rt-select.css';

class ApplicationDetailForm extends React.PureComponent {
  static propTypes = {
    showErr: PropTypes.func,
    showSucc: PropTypes.func,
    onSave: PropTypes.func,
    onUpload: PropTypes.func,
    appData: PropTypes.object,
    appMenus: PropTypes.array,
    dashboardTree: PropTypes.array,
    // 是否为移动端
    isMobile: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = {
      info: props.appData,
      urlMode: 'report',                        // 链接方式 报告 report   外链 url
      url: '',
      reportId: '',
      inputKey: new Date().getTime(),
      nameError: '',
      savePending: false
    };
  }

  componentDidMount() {

  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.appData && !_.isEqual(this.props.appData, nextProps.appData)) {
      const isUrlMode = isUrl(nextProps.appData.url);

      this.setState({
        info: nextProps.appData,
        urlMode: isUrlMode ? 'url' : 'report',
        reportId: isUrlMode ? '' : (nextProps.appData.url || ''),
        url: isUrlMode ? (nextProps.appData.url || '') : '',
        inputKey: new Date().getTime(),
      })
    }
  }

  render() {
    const { appMenus, onUpload, isMobile } = this.props;
    const { info, inputKey, nameError, savePending } = this.state;
    const hasMenu = Array.isArray(appMenus) && appMenus.length > 0;

    return (
      <Form className="form-horizontal application-edit-form"
        validationEvent="onBlur"
        onValidSubmit={this.handleValidSubmitAppDetail.bind(this, hasMenu)}
        ref={(instance) => { this.appEditForm = instance }}
      >
        <div className="form-group">
          <label className="control-label">
            <span>应用图标</span>
          </label>
          <FormImageUploader
            defaultURI={info.icon || ''}
            uuid={inputKey}
            mbSize={0.1}
            tipText={'上传自定义图标，不上传将使用默认图标\n建议尺寸80*80，文件大小100kb以内'}
            onUpload={onUpload}
            onSuccess={this.onUploadSuccess.bind(this)}
            onFailure={this.onUploadFailure.bind(this)}
            onCancel={this.onUploadCancel.bind(this)}
            width={80}
            height={80}
          />
        </div>

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

        <ValidatedInput
          type="textarea"
          label={<span>描述</span>}
          autoComplete="off"
          name="description"
          rows="3"
          value={info.description || ''}
          maxLength="80"
          onChange={this.handleChangeInfo.bind(this, 'description')}
          wrapperClassName="input-wrapper"
        />

        {this.renderAppLink()}
        {!hasMenu ? this.renderLinkOptions() : null}
        {(!isMobile && !hasMenu) ? this.renderTargetChoice() : null}
        <div style={{ padding: '50px 0px 30px 0' }}>
          <Button type="button"
            bsStyle="primary"
            style={this.STYLE_SHEET.saveBtn}
            onClick={() => { this.appEditForm.submit() }}
            loading={savePending}
          >
            保存
          </Button>
        </div>
      </Form>
    );
  }

  // 渲染app固定链接
  renderAppLink() {
    const { isMobile } = this.props
    const { info } = this.state
    const { host, protocol } = window.location
    // 添加移动端标识参数
    const platform = isMobile ? '/mobile' : ''
    const url = `${protocol}//${host}${baseAlias || '/'}app/index/${info.id}${platform}`

    return (
      <div className="form-group">
        <label className="control-label"><span>应用链接</span></label>
        <span className="copy-btn"
          style={{ right: isMobile ? '55px' : '5px' }}
          onClick={this.handleCopyAppLink.bind(this)}
        >
          复制
        </span>
        {
          isMobile && (
            <span className="copy-btn qrcode-btn"
              onMouseEnter={this.handleQrcodeShow.bind(this, url)}
              onMouseLeave={this.handleQrcodeHide.bind(this, url)}
            >
              二维码
            </span>
          )
        }
        <div id="application-qrcode-container"></div>
        <div className="input-wrapper">
          <input type="text"
            autoComplete="off"
            readOnly
            className="form-control"
            ref={(ref) => { this._appLinkInput = ref }}
            value={url}
          />
        </div>
      </div>
    )
  }

  // 渲染链接方式配置
  renderLinkOptions() {
    const { dashboardTree } = this.props
    const { urlMode, url, reportId } = this.state

    return (
      <div className="form-group link-mode">
        <label className="control-label">
          <span>链接方式</span>
        </label>
        <div className="radio-box">
          <div style={{ width: '80px', float: 'left' }}>
            <Input type="radio"
              label="报告"
              checked={urlMode === 'report'}
              onChange={() => {}}
              onClick={this.handleChangeUrlMode.bind(this, 'report')}
            />
          </div>
          <div style={{ width: '80px', float: 'left' }}>
            <Input type="radio"
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
            <ValidatedInput
              type="text"
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
                  menuStyle={{ width: '100%', maxHeight: 250 }}
                >
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

  // 打开目标选择(单选框)
  renderTargetChoice() {
    const { info } = this.state

    return (
      <div className="form-group">
        <label className="control-label">
          <span>打开方式</span>
        </label>
        <div className="radio-box">
          <div style={{ width: '108px', float: 'left' }}>
            <Input type="radio"
              label="当前窗口"
              checked={!info.target}
              onChange={() => {}}
              onClick={this.handleChangeTarget.bind(this, '')}
            />
          </div>
          <div style={{ width: '80px', float: 'left' }}>
            <Input type="radio"
              label="新窗口"
              checked={info.target === '_blank'}
              onChange={() => {}}
              onClick={this.handleChangeTarget.bind(this, '_blank')}
            />
          </div>
          <div style={{ clear: 'both' }}></div>
        </div>
      </div>
    )
  }

  // 二维码显示
  handleQrcodeShow(url) {
    $('#application-qrcode-container')
      // 清空上一次qrcode产生的多余的canvas
      .html('')
      .qrcode({ width: 160, height: 160, text: url })
      .stop()
      .fadeIn()
  }
  
  // 二维码隐藏
  handleQrcodeHide() {
    $('#application-qrcode-container').stop().fadeOut()
  }

  // 复制链接
  handleCopyAppLink() {
    this._appLinkInput.select()
    document.execCommand('Copy')
  }

  // 输入URL
  handleChangeUrl(e) {
    this.setState({
      url: e.target.value
    });
  }

  // 报告选择变更
  handleChangeTree(value) {
    const {
      reportId
    } = this.state;

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

  // 提交应用详情
  handleValidSubmitAppDetail(hasMenu) {
    const { info, urlMode, url, reportId } = this.state;
    // 已创建菜单的情况下确保target和url为空
    if (hasMenu) {
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

  // 上传成功回调
  onUploadSuccess(data) {
    this.props.showSucc(data.msg);
    this.setState({
      info: {
        ...this.state.info,
        icon: data.data
      },
      inputKey: new Date().getTime()
    });
  }

  // 上传失败回调
  onUploadFailure(errMsg) {
    this.props.showErr(errMsg);
    this.setState({
      inputKey: new Date().getTime()
    });
  }

  // 撤销上传图片回调
  onUploadCancel() {
    this.setState({
      info: {
        ...this.state.info,
        icon: ''
      },
      inputKey: new Date().getTime()
    });
  }

  // 获取树形组件图标
  _getIcon(item, expanded) {
    const className = item.type === 'FILE' ? 'dmpicon-empty-report' : (expanded ? 'dmpicon-folder-open' : 'dmpicon-folder-close')

    return <i className={className} style={this.STYLE_SHEET.treeIcon} />
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
    if (!val.trim()) {
      this.setState({
        nameError: '请输入应用名称'
      });
      return false;
    } else if (val.replace(/[^\x00-\xff]/g, 'aa').length > 16) {
      // 将双字节字符转为两个英文字符后统计长度 >= 16
      this.setState({
        nameError: '名称长度不允许超过8个中文'
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

export default ApplicationDetailForm;
