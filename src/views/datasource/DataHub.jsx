import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class'

import Select from 'react-bootstrap-myui/lib/Select'
import Button from 'react-bootstrap-myui/lib/Button'
import Loading from 'react-bootstrap-myui/lib/Loading'
import { Form, ValidatedInput } from '../../components/bootstrap-validation'
import FormImageUploader from '../../components/FormImageUploader'
import KeyValueInput from '../../components/KeyValueInput'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as dataSourceActionCreators } from '../../redux/modules/datasource/datasource'
import { actions as commonActionCreators } from '../../redux/modules/common'
import AuthComponent from '@components/AuthComponent';

import _ from 'lodash'
import ConfirmsMixin from '@helpers/ConfirmsMixin'
import TipMixin from '../../helpers/TipMixin'
import { baseAlias } from '../../config'

import { DATA_SOURCE_TYPES } from './constants'

let paramFetchTimer = 0

const DataHub = createReactClass({
  mixins: [TipMixin, ConfirmsMixin],

  propTypes: {
    onChangeNavBar: PropTypes.func,
    params: PropTypes.object,
    actions: PropTypes.object,
    pending: PropTypes.bool,
    apiDatasourceParamsPending: PropTypes.bool,
    info: PropTypes.object,
    apiDatasourceParams: PropTypes.array,
    apiDatasourceSysParams: PropTypes.array,
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      info: {
        type: DATA_SOURCE_TYPES.datahub.type,
        uncheck_connection: false,
        code: '',
        conn_str: {
          // 测试使用的API
          // host: 'https://dmp-ds-api-test.mypaas.com.cn/api/data-source',
          // access_secret: '6a786cf41e3a84ac',
          data_base_type: 'Oracle',
        }
      },
      isTest: false,
      testPending: false,
      savePending: false,
      inputKey: new Date().getTime(),
      secretError: ''
    }
  },

  componentWillMount() {
    const { onChangeNavBar, params } = this.props
    // 向MAIN通知navbar显示内容
    onChangeNavBar([{
      name: '数据源管理',
      url: '/datasource/list'
    }, {
      name: `${params.datasource_id ? '修改' : '添加'}${DATA_SOURCE_TYPES.datahub.name}数据源`
    }]);
  },

  componentDidMount() {
    const { datasource_id } = this.props.params;
    if (datasource_id) {
      this._fetchDataSourceDetail(datasource_id);
    }
    // 获取系统内置参数
    this.props.actions.fetchApiDatasourceSysParams()
  },

  componentWillReceiveProps(nextProps) {
    const { info } = nextProps
    if (!_.isEqual(info, this.props.info)) {
      this.setState({
        info: {
          ...info,
          type: DATA_SOURCE_TYPES.datahub.type,
          conn_str: {
            ...info.conn_str,
          }
        },
        inputKey: new Date().getTime()
      })
    }
  },

  componentWillUnmount() {
    const { params, actions } = this.props
    if (params.datasource_id) {
      actions.clearDatasourceInfo()
    }
    actions.clearDatasourceParams()
  },

  render() {
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
              {this.renderApiOptions()}
              {this.renderFormBottom()}
            </Form>
            <Loading show={pending} containerId='database-wrap' />
          </div>
        </div>
      </div>
    )
  },

  // 渲染基本信息部分
  renderBaseInfo() {
    const { info, inputKey } = this.state;
    const { actions } = this.props;
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

  // 渲染API配置部分
  renderApiOptions() {
    const { info, secretError } = this.state;
    return (
      <div className="form-group-set no-border">
        <div className="form-group-set-title">
          接口配置
        </div>

        <div className="form-group-row form-group-row-2">
          <ValidatedInput type="text"
            label={<span><i className="required">*</i>接口地址(Endpoint)</span>}
            autoComplete="off"
            name="host"
            placeholder="http://dmp-datasource-api.mypaas.com.cn/"
            value={info.conn_str.host || ''}
            onChange={this.handleChangeApiOpts.bind(this, 'host')}
            wrapperClassName="input-wrapper"
            validate='required'
            errorHelp={{
              required: '请输入接口地址'
            }} />
          <ValidatedInput type="text"
            label={<span><i className="required">*</i>密钥(Secret Key)</span>}
            autoComplete="off"
            name="access_secret"
            value={info.conn_str.access_secret || ''}
            onChange={this.handleChangeApiOpts.bind(this, 'access_secret')}
            wrapperClassName="input-wrapper"
            validate={this.validateAccessSecret}
            errorHelp={secretError} />
          <div className="form-group">
            <label className="control-label">
              <i className="required">&nbsp;</i>
              <span>类型</span>
            </label>
            <div className="input-wrapper">
              <Select value={info.conn_str.data_base_type}>
                <option value="Oracle">Oracle</option>
              </Select>
            </div>
          </div>
        </div>
      </div>
    )
  },

  // 渲染表单底部
  renderFormBottom() {
    const { testPending, savePending, info } = this.state;

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
    );
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
    return value && !/\W/.test(value)
  },

  // 校验接口密钥
  validateAccessSecret(value) {
    let errMsg = ''
    if (!value || !value.trim()) {
      errMsg = '请输入密钥'
    } else if (/[^\x00-\xff]/g.test(value)) {
      errMsg = '含有非法字符'
    }
    this.setState({ secretError: errMsg })
    return !errMsg
  },

  // 接口配置信息更新 
  handleChangeApiOpts(field, e) {
    const newValue = e.target.value
    this.setState(preState => ({
      info: {
        ...preState.info,
        conn_str: {
          ...preState.info.conn_str,
          [field]: newValue
        }
      }
    }))
  },

  // 输入事件
  handleChangeInfo(field, sub, e) {
    if (e === undefined) {
      e = sub;
      sub = '';
    }
    const newValue = e.target.value
    if (sub) {
      this.setState(preState => ({
        info: {
          ...preState.info,
          [field]: {
            ...preState.info[field],
            [sub]: newValue
          }
        }
      }))
    } else {
      this.setState(preState => ({
        info: {
          ...preState.info,
          [field]: newValue
        }
      }))
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
    // copy原info作为待提交参数
    const sendParams = _.cloneDeep(info)

    if (isTest) {
      this._testDataSourceLink(sendParams);
      return;
    }

    this.setState({ savePending: true })

    const { datasource_id } = this.props.params;
    // 根据是否有id判断是添加还是修改
    const method = datasource_id ? 'editDataSource' : 'addDataSource';

    this.props.actions[method](sendParams, (json) => {
      if (!json.result) {
        // this.showErr(json.msg)
        this.confirmAndSubmit(json.msg)
        this.setState({ savePending: false })
      } else {
        this.showSucc(json.msg)
        setTimeout(() => {
          this.setState({ savePending: false })
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

  // 获取API数据源需要的参数
  _fetchApiParams(fetchParams, range = 'datasource') {
    this.props.actions.fetchApiDatasourceParams(fetchParams, range, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
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

  // 参数模板数据
  PARAM_TEMPLATE: {
    name: '',
    type: 'query',
    key: '',
    value: ''
  },

  STYLE_SHEET: {
    formWrap: { width: '100%', padding: '0', flex: 1, overflowY: 'auto', overflowX: 'hidden' }
  },
})

const stateToProps = state => ({
  ...state.datasource
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataSourceActionCreators, commonActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(DataHub)
