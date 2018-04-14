import PropTypes from 'prop-types';
import React from 'react';

import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';

import IndicatorItem from './components/IndicatorItem';
import TemplateDialog from './components/TemplateDialog';

import AuthComponent from '@components/AuthComponent';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as indicatorTemplateActionCreators } from '../../redux/modules/indicator/template';

import TipMixin from '../../helpers/TipMixin';
import ConfirmMixin from '../../helpers/ConfirmsMixin';

import './indicator.less';

const IndicatorList = createReactClass({
  displayName: 'IndicatorList',
  mixins: [TipMixin, ConfirmMixin],

  getInitialState() {
    return {
      templateDialog: {
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
    this.props.onChangeNavBar('业务指标定义');
  },

  componentDidMount() {
    // 获取列表
    this._getTemplateList();
  },

  render() {
    const { templateList, pending } = this.props;

    const { templateDialog } = this.state;

    const list = templateList.map(item => (
      <AuthComponent pagecode='指标定义' key={item.id} allowevents={['onEdit']} editProp="editable">
        <IndicatorItem
          key={item.id}
          item={item}
          onDel={this.handleDeleteTemplate.bind(this, item.id)}
          onEdit={this.handleEditTemplate.bind(this, item.id)}
          onEditBase={this.handleOpenTemplateDialog.bind(this, item)} />
      </AuthComponent>
    ));

    list.unshift(<AuthComponent pagecode='指标定义' visiblecode="edit" key="-1">
      <IndicatorItem isAdd={true} onAdd={this.handleOpenTemplateDialog.bind(this, null)} />
    </AuthComponent>);

    return (
      <div className="modules-page-container">
        <div className="data-view indicator-list-page"
          id="indicator-list-page"
          style={{ overflow: 'hidden' }}>
          <div id="indicator-list-wrapper"
            style={this.STYLE_SHEET.scrollStyle}>
            <div style={this.STYLE_SHEET.wrapStyle}>
              {list}
            </div>

            <div className="form-tip" style={{ paddingLeft: '0px' }}>
              <i className="dmpicon-help"></i>
              说明：业务人员在此处定义业务需要的数据指标
            </div>

          </div>

          <Loading show={pending} containerId='indicator-list-page' />

          {
            templateDialog.show && (
              <TemplateDialog
                show={templateDialog.show}
                data={templateDialog.info}
                onSure={this.handleSubmitAddDialog.bind(this)}
                onHide={this.handleCloseAddDialog.bind(this)} />
            )
          }
        </div>
      </div>
    );
  },

  // 编辑模版
  handleEditTemplate(templateId, e) {
    e.stopPropagation();
    this.context.router.push(`/indicator/template/${templateId}`);
  },

  // 打开模版对话框
  handleOpenTemplateDialog(data, e) {
    e.stopPropagation();
    this.setState({
      templateDialog: {
        ...this.state.templateDialog,
        info: data || {},
        show: true
      }
    });
  },

  // 提交新增模版
  handleSubmitAddDialog(data) {
    if (!data.id) {
      this.props.actions.fetchAddTemplate(data, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.handleCloseAddDialog();
          this.showSucc(json.msg);
        }
      });
    } else {
      this.props.actions.fetchUpdateTemplate(data, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.handleCloseAddDialog();
          this.showSucc(json.msg);
        }
      });
    }
  },

  // 关闭新增模版对话框
  handleCloseAddDialog() {
    this.setState({
      templateDialog: {
        show: false,
        info: {}
      }
    });
  },

  // 删除操作
  handleDeleteTemplate(templateId, e) {
    e.stopPropagation();

    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该业务指标模板吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.fetchDeleteTemplate(templateId, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg || '删除失败');
          }
        })
      }
    });
  },

  // 获取模版列表
  _getTemplateList(page = 1) {
    this.props.actions.fetchTemplateList({
      page_size: 20000,
      page
    }, (json) => {
      if (!json.result) {
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

  STYLE_SHEET: {
    scrollStyle: {
      width: '100%',
      height: '100%',
      overflowX: 'hidden',
      overflowY: 'auto',
    },
    wrapStyle: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginRight: '-25px'
    },
  },
});

const stateToProps = state => ({
  ...state.indicator_template
});

const dispatchToProps = dispatch => ({ actions: bindActionCreators(indicatorTemplateActionCreators, dispatch) });

export default connect(stateToProps, dispatchToProps)(IndicatorList);
