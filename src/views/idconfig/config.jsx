import PropTypes from 'prop-types';
import React from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as indicatorActionCreators } from '../../redux/modules/indicator/indicator';

import MainConfig from './mainConfig';
import IndicatorConfig from './indicatorConfig';

import './idconfig.less';

class Config extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  state = {
    tabs: ['主表配置', '指标配置'],
    currTab: '主表配置',
    keyword: '',
  };

  componentWillMount() {
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar([{
      name: '指标配置管理',
      url: '/idconfig/list'
    }, {
      name: '编辑业务指标配置'
    }]);
  }

  componentDidMount() {

  }

  componentWillUnmount() {
    // 重置type Define的列表
    this.props.actions.resetTypeAndIndicatorList();
  }

  render() {
    const { tabs, currTab } = this.state;

    return (
      <div className="modules-page-container">
        <div className="data-view idconfig-config-page has-bg-color"
          id="idconfig-config-page"
          style={{ overflow: 'hidden' }}>
          <div className="dataview-tab indicator-template-tab"
            style={{ height: '80px', padding: '23px 0 23px 30px', borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>
            <div className="dataview-tab-btn-container">
              {
                tabs.map(tab => (
                  <button type="button"
                    className={`btn btn-dataview-tab ${currTab === tab ? 'active' : ''}`}
                    onClick={this.handleChangeTab.bind(this, tab)}>
                    {tab}
                  </button>
                ))
              }
            </div>
          </div>
          <div style={{ position: 'absolute', left: '0px', right: '0px', bottom: '0px', top: '80px' }}>
            {
              currTab === '主表配置' && <MainConfig templateId={this.props.params.tmpl_id}/>
            }
            {
              currTab === '指标配置' && <IndicatorConfig templateId={this.props.params.tmpl_id}/>
            }
          </div>
        </div>
      </div>
    );
  }

  // 切换TAB
  handleChangeTab = (currTab) => {
    this.setState({
      currTab
    });
  };
}

const stateToProps = state => ({
  ...state.indicator
});

const dispatchToProps = dispatch => ({ actions: bindActionCreators(indicatorActionCreators, dispatch) });


export default connect(stateToProps, dispatchToProps)(Config);
