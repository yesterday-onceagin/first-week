import React from 'react';

import createReactClass from 'create-react-class';

import Button from 'react-bootstrap-myui/lib/Button';

import { Form, ValidatedInput } from '../../components/bootstrap-validation';
import TypeDefine from './components/TypeDefine';

import AuthComponent from '@components/AuthComponent';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actions as indicatorTemplateActionCreators } from '../../redux/modules/indicator/template';
import { actions as indicatorActionCreators } from '../../redux/modules/indicator/indicator';

import TipMixin from '../../helpers/TipMixin';

import './indicator.less';

const Indicator = createReactClass({
  displayName: 'Indicator',
  mixins: [TipMixin],

  getInitialState() {
    return {
      templateBaseData: this.props.templateData || {},            // 指标定义模版基本信息
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar([{
      name: '业务指标定义',
      url: '/indicator/list'
    }, {
      name: '编辑业务指标定义'
    }]);
  },

  componentWillUnmount() {
    // 重置type Define的列表
    this.props.actions.resetTypeAndIndicatorList();
  },

  render() {
    return (
      <div className="modules-page-container">
        <div className="data-view has-bg-color indicator-template-page">
          <div className="indicator-template-view" style={this.STYLE_SHEET.tmplView}>
            <AuthComponent  pagecode='指标定义' editProp="editable" enablePointer={false}>
              <TypeDefine style={{ width: '100%', height: '100%' }} templateId={this.props.params.tmpl_id} editable/>
            </AuthComponent>
          </div>
        </div>
      </div>
    );
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
    tmplView: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  },
});

const stateToProps = state => ({
  ...state.indicator_template
});

const dispatchToProps = dispatch => ({ actions: bindActionCreators(Object.assign({}, indicatorActionCreators, indicatorTemplateActionCreators), dispatch) });

export default connect(stateToProps, dispatchToProps)(Indicator);
