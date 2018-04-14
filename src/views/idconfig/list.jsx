import PropTypes from 'prop-types';
import React from 'react';

import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';

import IdconfigItem from './components/IdconfigItem';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as indicatorTemplateActionCreators } from '../../redux/modules/indicator/template';

import TipMixin from '../../helpers/TipMixin';

import './idconfig.less';

const IndicatorList = createReactClass({
  displayName: 'IndicatorList',
  mixins: [TipMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar('指标配置管理');
  },

  componentDidMount() {
    // 获取列表
    this._getTemplateList();
  },

  render() {
    const { templateList, pending } = this.props;

    return (
      <div className="modules-page-container">
        <div className="data-view idconfig-list-page"
          id="idconfig-list-page"
          style={{ overflow: 'hidden' }}>
          <div style={this.STYLE_SHEET.scrollStyle}
            id="idconfig-list-wrapper">

            <div style={this.STYLE_SHEET.wrapStyle}>
              {
                Array.isArray(templateList) && templateList.map(item => (
                  <IdconfigItem
                    key={item.id}
                    item={item}
                    onGoEdit={this.handleEdit.bind(this, item.id)} />
                ))
              }
            </div>

            <div className="form-tip" style={{ paddingLeft: '0px' }}>
              <i className="dmpicon-help"></i>
              说明：数据工程师在此处配置业务数据指标的事实及维度
            </div>
          </div>

          <Loading show={pending} containerId='idconfig-list-page' />
        </div>
      </div>
    );
  },

  // 指标配置
  handleEdit(templateId) {
    this.context.router.push(`/idconfig/config/${templateId}`);
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
