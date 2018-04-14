import PropTypes from 'prop-types';
import React from 'react';

import createReactClass from 'create-react-class';

import Button from 'react-bootstrap-myui/lib/Button';
import Loading from 'react-bootstrap-myui/lib/Loading';

import { Form, ValidatedInput } from '@components/bootstrap-validation';
import FormImageUploader from '@components/FormImageUploader';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataSourceActionCreators } from '../../redux/modules/datasource/datasource';
import { actions as commonActionCreators } from '../../redux/modules/common';
import AuthComponent from '@components/AuthComponent';

import TipMixin from '../../helpers/TipMixin';
import ConfirmsMixin from '@helpers/ConfirmsMixin'
import { baseAlias } from '../../config';

import { DATA_SOURCE_TYPES } from './constants';

const MySQL = createReactClass({
  mixins: [TipMixin, ConfirmsMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      info: {
        type: DATA_SOURCE_TYPES.mysql.type,
        uncheck_connection: false,
        conn_str: {
          port: '3306',
          password: '',
          ssh_password: '',
          use_ssh: 0
        }
      },
      isTest: false,
      testPending: false,
      savePending: false,
      inputKey: new Date().getTime()
    }
  },

  componentWillMount() {
    const { onChangeNavBar, params } = this.props
    // 向MAIN通知navbar显示内容
    onChangeNavBar([{
      name: '数据源管理',
      url: '/datasource/list'
    }, {
      name: `${params.datasource_id ? '修改' : '添加'}${DATA_SOURCE_TYPES.mysql.name}数据源`
    }]);
  },

  componentDidMount() {
    const { datasource_id } = this.props.params;
    if (datasource_id) {
      this._fetchDataSourceDetail(datasource_id);
    }
  },

  componentWillReceiveProps(nextProps) {
    const { info } = nextProps
    this.setState({
      info: {
        ...info,
        type: DATA_SOURCE_TYPES.mysql.type,
        conn_str: {
          ...info.conn_str,
          port: (info.conn_str && info.conn_str.port) || '3306',
          password: '',
          ssh_password: ''
        }
      },
      inputKey: new Date().getTime()
    })
  },

  componentWillUnmount() {
    const { params, actions } = this.props
    if (params.datasource_id) {
      actions.clearDatasourceInfo()
    }
  },

  render() {
    const { info } = this.state;
    const { pending } = this.props;

    return (
      <div className="modules-page-container">
        <div className="data-view add-datasource-page has-bg-color">
          <div className="database-wrap" style={this.STYLE_SHEET.formWrap} id="database-wrap">
            <Form
              className="form-horizontal"
              validationEvent="onBlur"
              onValidSubmit={this.handleValidSubmit}
              ref={(instance) => { this.database_form = instance }}
            >
              {this.renderBaseInfo()}

              <div className="form-group-set no-border">
                <div className="form-group-set-title">
                  数据源连接信息
                </div>

                <div className="form-group-row form-group-row-2">
                  <ValidatedInput type="text"
                    label={<span><i className="required">*</i>数据库地址</span>}
                    autoComplete="off"
                    name="host"
                    value={info.conn_str.host || ''}
                    onChange={this.handleChangeInfo.bind(this, 'conn_str', 'host')}
                    wrapperClassName="input-wrapper"
                    validate='required'
                    errorHelp={{
                      required: '请输入数据库地址'
                    }} />
                  <ValidatedInput type="text"
                    label={<span><i className="required">*</i>端口</span>}
                    autoComplete="off"
                    name="port"
                    value={info.conn_str.port || ''}
                    onChange={this.handleChangeInfo.bind(this, 'conn_str', 'port')}
                    wrapperClassName="input-wrapper"
                    validate='required,isNumeric'
                    errorHelp={{
                      required: '请输入端口',
                      isNumeric: '端口必须为数字'
                    }} />
                  <ValidatedInput type="text"
                    label={<span><i className="required">*</i>数据库名称</span>}
                    autoComplete="off"
                    name="database"
                    value={info.conn_str.database || ''}
                    onChange={this.handleChangeInfo.bind(this, 'conn_str', 'database')}
                    wrapperClassName="input-wrapper"
                    validate='required'
                    errorHelp={{
                      required: '请输入数据库名称'
                    }} />
                  {/*此处增加一个空的from-group用于占位*/}
                  <div className="form-group"></div>
                  <ValidatedInput
                    type="text"
                    label={<span><i className="required">*</i>用户名</span>}
                    autoComplete="off"
                    name="user"
                    value={info.conn_str.user || ''}
                    onChange={this.handleChangeInfo.bind(this, 'conn_str', 'user')}
                    wrapperClassName="input-wrapper"
                    validate='required'
                    errorHelp={{
                      required: '请输入用户名'
                    }} />
                  <ValidatedInput type="password"
                    label={<span><i className="required">*</i>密码</span>}
                    autoComplete="new-password"
                    name="password"
                    value={info.conn_str.password || ''}
                    onChange={this.handleChangeInfo.bind(this, 'conn_str', 'password')}
                    wrapperClassName="input-wrapper"
                    validate='required'
                    errorHelp={{
                      required: '请输入密码'
                    }} />
                </div>

                <ValidatedInput type="checkbox"
                  label="使用SSH通道"
                  autoComplete="off"
                  name="ssh"
                  rows="3"
                  checked={info.conn_str && !!info.conn_str.use_ssh}
                  onChange={this.handleChangeSSH}
                  labelClassName="checkbox-in-form" />
                {this.renderSSHForm()}
                <ValidatedInput type="text"
                  label={<span><i className="required">&nbsp;</i>表名过滤（前缀）</span>}
                  autoComplete="off"
                  name="table_name_prefix"
                  value={info.conn_str.table_name_prefix || ''}
                  onChange={this.handleChangeInfo.bind(this, 'conn_str', 'table_name_prefix')}
                  wrapperClassName="input-wrapper" />
              </div>
              {this.renderFormBottom()}
            </Form>

            <Loading show={pending} containerId='database-wrap' />
          </div>
        </div>
      </div>
    );
  },

  renderBaseInfo() {
    const { info, inputKey } = this.state;
    const { actions } = this.props
    return (
      <div className="form-group-set">
        <div className="form-group-set-title">
          基本信息
        </div>

        <div className="form-group">
          <label className="control-label">
            <i className="required">&nbsp;</i>
            <span>数据源封面</span>
          </label>
          <AuthComponent pagecode='添加数据源'>
            <FormImageUploader
              defaultURI={info.icon}
              uuid={inputKey}
              mbSize={1}
              tipText={'上传自定义封面，不上传将使用默认封面\n请按170*120px的尺寸进行上传'}
              onUpload={actions.fetchUploadImage}
              onSuccess={this.onUploadSuccess}
              onFailure={this.onUploadFailure}
              onCancel={this.onUploadCancel}
              width={129}
              height={90} />
          </AuthComponent>
        </div>

        <div className="form-group-row form-group-row-2">
          <ValidatedInput type="text"
            label={<span><i className="required">*</i>数据源名称</span>}
            autoComplete="off"
            name="name"
            value={info.name || ''}
            onChange={this.handleChangeInfo.bind(this, 'name')}
            maxLength="20"
            wrapperClassName="input-wrapper"
            validate='required'
            errorHelp={{
              required: '请输入数据源名称'
            }} />
          <ValidatedInput type="text"
            label={<span><i className="required">*</i>数据源编码</span>}
            autoComplete="off"
            name="code"
            value={info.code || ''}
            onChange={this.handleChangeInfo.bind(this, 'code')}
            placeholder="数据源唯一标识"
            maxLength="20"
            wrapperClassName="input-wrapper"
            validate={this.validateSourceCode}
            errorHelp={{
              required: '请输入数据源编码（字母、数字、下划线）'
            }} />
        </div>

        <ValidatedInput type="textarea"
          label={<span><i className="required">&nbsp;</i>数据源描述</span>}
          autoComplete="off"
          name="description"
          rows="2"
          value={info.description || ''}
          maxLength="80"
          onChange={this.handleChangeInfo.bind(this, 'description')}
          wrapperClassName="input-wrapper" />
      </div>
    )
  },

  renderSSHForm() {
    const { info } = this.state;

    return info.conn_str && !!info.conn_str.use_ssh ? (
      <div className="form-group-row form-group-row-2">
        <ValidatedInput type="text"
          label={<span><i className="required">*</i>SSH主机地址</span>}
          autoComplete="off"
          name="ssh_host"
          value={info.conn_str.ssh_host || ''}
          onChange={this.handleChangeInfo.bind(this, 'conn_str', 'ssh_host')}
          wrapperClassName="input-wrapper"
          validate='required'
          errorHelp={{
            required: '请输入SSH主机地址'
          }} />
        <ValidatedInput type="text"
          label={<span><i className="required">*</i>端口</span>}
          autoComplete="off"
          name="ssh_port"
          value={info.conn_str.ssh_port || ''}
          onChange={this.handleChangeInfo.bind(this, 'conn_str', 'ssh_port')}
          wrapperClassName="input-wrapper"
          validate='required,isNumeric'
          errorHelp={{
            required: '请输入端口',
            isNumeric: '端口必须为数字'
          }} />
        <ValidatedInput type="text"
          label={<span><i className="required">*</i>用户名</span>}
          autoComplete="off"
          name="ssh_user"
          value={info.conn_str.ssh_user || ''}
          onChange={this.handleChangeInfo.bind(this, 'conn_str', 'ssh_user')}
          wrapperClassName="input-wrapper"
          validate='required'
          errorHelp={{
            required: '请输入用户名'
          }} />
        <ValidatedInput type="password"
          label={<span><i className="required">*</i>密码</span>}
          autoComplete="off"
          name="ssh_password"
          value={info.conn_str.ssh_password || ''}
          onChange={this.handleChangeInfo.bind(this, 'conn_str', 'ssh_password')}
          wrapperClassName="input-wrapper"
          validate='required'
          errorHelp={{
            required: '请输入密码'
          }} />
      </div>
    ) : null
  },

  // 渲染表单底部
  renderFormBottom() {
    const { info, testPending, savePending } = this.state
    return (
      <div style={{ padding: '20px 45px 30px' }}>
        {
          info.is_buildin !== 1 && (
            <AuthComponent pagecode='添加数据源' visiblecode="edit">
              <Button type="button"
                bsStyle="primary"
                disabled={testPending}
                loading={savePending}
                style={{ marginRight: '30px' }}
                onClick={this.handleSubmitDataSource}
              >
                {this.props.params.datasource_id ? '修改' : '添加'}
              </Button>
            </AuthComponent>
          )
        }
        <Button type="button"
          bsStyle="secondary"
          disabled={savePending}
          loading={testPending}
          onClick={this.handleTestLink}
        >
          {testPending ? '测试连接中' : '测试连接'}
        </Button>
      </div>
    )
  },

  // 上传成功回调
  onUploadSuccess(data) {
    this.showSucc(data.msg);
    this.setState({
      info: {
        ...this.state.info,
        icon: data.data
      },
      inputKey: new Date().getTime()
    });
  },

  // 上传失败回调
  onUploadFailure(errMsg) {
    this.showErr(errMsg);
    this.setState({ inputKey: new Date().getTime() });
  },

  // 撤销上传图片回调
  onUploadCancel() {
    this.setState({
      info: {
        ...this.state.info,
        icon: ''
      },
      inputKey: new Date().getTime()
    });
  },

  // 校验数据源编码格式
  validateSourceCode(value) {
    // 查找是否有非单元词的字符
    const invalidReg = new RegExp('\\W+');
    // 长度是否为1-20
    const validReg = new RegExp('\\w+');

    return validReg.test(value) ? !invalidReg.test(value) : false;
  },

  // checkbox事件
  handleChangeSSH() {
    this.setState({
      info: {
        ...this.state.info,
        conn_str: {
          ...this.state.info.conn_str,
          use_ssh: +this.state.info.conn_str.use_ssh === 1 ? 0 : 1
        }
      }
    })
  },

  // 输入事件
  handleChangeInfo(field, sub, e) {
    if (e === undefined) {
      e = sub;
      sub = '';
    }
    if (sub) {
      this.setState({
        info: {
          ...this.state.info,
          [field]: {
            ...this.state.info[field],
            [sub]: e.target.value
          }
        }
      })
    } else {
      this.setState({
        info: {
          ...this.state.info,
          [field]: e.target.value
        }
      })
    }
  },

  // 提交数据源信息（按钮事件）
  handleSubmitDataSource() {
    this.setState(() => ({
      isTest: false
    }), () => {
      this.database_form.submit()
    })
  },

  // 带验证的提交
  handleValidSubmit() {
    const { isTest, info } = this.state;

    if (isTest) {
      this._testDataSourceLink(info);
      return;
    }

    this.setState(() => ({
      savePending: true
    }))

    const { datasource_id } = this.props.params;
    const method = datasource_id ? 'editDataSource' : 'addDataSource';

    this.props.actions[method](info, (json) => {
      if (!json.result) {
        this.confirmAndSubmit(json.msg)
        // this.showErr(json.msg)
        this.setState(() => ({
          savePending: false
        }))
      } else {
        this.showSucc(json.msg)
        setTimeout(() => {
          this.setState(() => ({
            savePending: false
          }))
          this.context.router.push(`${baseAlias}/datasource/list`)
        }, 1500)
      }
    })
  },
  // 强制保存数据源
  confirmAndSubmit(msg) {
    this.showConfirm({
      size: { height: '260px' },
      info: <span>数据源连接失败了, 是否强制保存?</span>,
      content: <div style={{ overflowY: 'scroll', maxWidth: '350px', maxHeight: '65px' }}>{msg}</div>,
      ok: () => {
        this.setState({
          info: {
            ...this.state.info,
            uncheck_connection: true
          }
        }, () => {
          this.database_form.submit()
        })
      }
    })
  },

  // 测试链接（按钮事件）
  handleTestLink() {
    this.setState(() => ({
      isTest: true
    }), () => {
      this.database_form.submit()
    })
  },

  // 测试链接（接口调用）
  _testDataSourceLink(values) {
    this.setState({
      testPending: true
    });

    this.props.actions.testDataSourceLink(values, (json) => {
      this.setState({
        testPending: false
      })
      if (!json.result) {
        this.showErr(json.msg)
      } else {
        this.showSucc('连接测试通过')
      }
    })
  },

  // 获取数据源详情
  _fetchDataSourceDetail(id) {
    this.props.actions.fetchDataSourceDetail(id, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      }
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
    formWrap: {
      width: '100%',
      padding: '0',
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden'
    }
  },
})

const stateToProps = state => ({
  ...state.datasource
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataSourceActionCreators, commonActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(MySQL);