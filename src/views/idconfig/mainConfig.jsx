import PropTypes from 'prop-types';
import React from 'react';

import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';
import Button from 'react-bootstrap-myui/lib/Button';
import Select from 'react-bootstrap-myui/lib/Select';
import { Form, ValidatedInput } from '../../components/bootstrap-validation';
import AuthComponent from '@components/AuthComponent';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as indicatorTemplateActionCreators } from '../../redux/modules/indicator/template';
import { actions as datasourceActionCreators } from '../../redux/modules/datasource/datasource';

import TipMixin from '../../helpers/TipMixin';

import './idconfig.less';

const MainConfig = createReactClass({
  displayName: 'MainConfig',
  mixins: [TipMixin],

  getInitialState() {
    return {
      info: null,
      tableList: [],
      tablesLoaded: false
    }
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  componentDidMount() {
    // 获取模版关键表
    this.props.actions.fetchTemplateKeyTable(this.props.templateId, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.setState({
          info: this._convertData(json.data)
        });
      }
    });
    // 获取数据表
    if (!this.props.tableList[this.ODPS_DATASOURCE_ID]) {
      this.getDataTables();
    } else {
      this.setState({
        tablesLoaded: true,
        tableList: this.props.tableList[this.ODPS_DATASOURCE_ID].tables
      });
    }
  },

  render() {
    const { pending } = this.props;

    const { info, tableList, tablesLoaded } = this.state;

    return (
      <div className="idconfig-main-config-page"
        id="idconfig-main-config-page"
        style={{ width: '100%', minHeight: '350px', overflow: 'hidden', padding: '20px 0 50px 32px' }}>
        {
          info && (
            <Form className="form-horizontal"
              validationEvent="onBlur"
              onValidSubmit={this.handleSaveInfo}
              ref={(instance) => { this.main_table_config_form = instance }}>
              <div style={{ maxWidth: '600px' }}>
                <div className="form-group">
                  <label className="control-label">
                    <span><i className="required">*</i>业务主表</span>
                  </label>
                  <div className="input-wrapper">
                    <Select value={info.fact_master}
                      maxHeight={250}
                      width={'100%'}
                      openSearch={true}
                      onSelected={this.handleSelectTable.bind(this, 'fact_master')}>
                      {
                        tableList.map((table, key) => <option value={table.name} key={key}>{table.name}</option>)
                      }
                    </Select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="control-label">
                    <span><i className="required">*</i>业务主表与组织机构关系表</span>
                  </label>
                  <div className="input-wrapper">
                    <Select value={info.fact_master_organization}
                      maxHeight={250}
                      width={'100%'}
                      openSearch={true}
                      onSelected={this.handleSelectTable.bind(this, 'fact_master_organization')}>
                      {
                        tableList.map((table, key) => <option value={table.name} key={key}>{table.name}</option>)
                      }
                    </Select>
                  </div>
                </div>
                <ValidatedInput type="text"
                  label={<span><i className="required">*</i>360表</span>}
                  autoComplete="off"
                  name="fact_360"
                  value={info.fact_360 || ''}
                  onChange={this.handleChangeInfo.bind(this, 'fact_360')}
                  maxLength="40"
                  wrapperClassName="input-wrapper"
                  validate='required'
                  errorHelp={{
                    required: '请输入360表'
                  }} />
                <ValidatedInput type="text"
                  label={<span><i className="required">*</i>标签360表</span>}
                  autoComplete="off"
                  name="label_360"
                  value={info.label_360 || ''}
                  onChange={this.handleChangeInfo.bind(this, 'label_360')}
                  maxLength="40"
                  wrapperClassName="input-wrapper"
                  validate='required'
                  errorHelp={{
                    required: '请输入标签360表'
                  }} />
              </div>
            </Form>
          )
        }
        {
          info && (
            <div style={{ padding: '50px 0 0 12px' }}>
              <AuthComponent pagecode="指标配置" visiblecode="edit">
                <Button bsStyle="primary" style={{ width: '150px' }}
                  onClick={() => { this.main_table_config_form.submit() }}>
                  保存配置
                </Button>
              </AuthComponent>
            </div>
          )
        }
        <Loading show={pending || !tablesLoaded} containerId='idconfig-main-config-page' />
      </div>
    );
  },

  // 选择事件
  handleSelectTable(field, opts) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: opts.value
      }
    });
  },

  // 输入事件
  handleChangeInfo(field, e) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: e.target.value
      }
    });
  },

  // 提交主表配置
  handleSaveInfo() {
    const info = this.state.info;

    if (!info.fact_master) {
      this.showErr('未设置业务主表');
      return;
    }

    if (!info.fact_master_organization) {
      this.showErr('业务主表与组织机构关系表');
      return;
    }

    const tables = Object.keys(info).map(key => ({ name: key, table_name: info[key] }));

    this.props.actions.updateTemplateKeyTable({
      id: this.props.templateId,
      tables
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else {
        this.showSucc(json.msg);
        setTimeout(() => {
          this.context.router.push('/idconfig/list');
        }, 1000);
      }
    });
  },

  // 转换关键表数据
  _convertData(data) {
    const info = {
      fact_master: '',
      fact_master_organization: '',
      fact_360: '',
      label_360: ''
    };

    Array.isArray(data) && data.length > 0 && data.map((table) => {
      info[table.name] = table.table_name;
    });

    return info;
  },

  // 获取数据表
  getDataTables() {
    this.props.actions.fetchTables(this.ODPS_DATASOURCE_ID, {
      page_size: 100000,
      page: 1
    }, (json) => {
      if (json.result) {
        this.setState({
          tablesLoaded: true,
          tableList: json.data.items
        });
      } else {
        this.setState({
          tablesLoaded: true
        });
        this.showErr(json.msg);
      }
    });
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

  // ODPS表数据源ID
  ODPS_DATASOURCE_ID: '00000000-1111-1111-1111-000000000000',
});

const stateToProps = state => ({
  ...state.indicator_template,
  tableList: state.datasource.tableList
});

const dispatchToProps = dispatch => ({ actions: bindActionCreators(Object.assign({}, indicatorTemplateActionCreators, datasourceActionCreators), dispatch) });

export default connect(stateToProps, dispatchToProps)(MainConfig);
