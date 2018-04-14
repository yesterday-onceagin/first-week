import React from 'react'
import PropTypes from 'prop-types'
import reactMixin from 'react-mixin';

import { actions as commonActionCreators } from '../../redux/modules/common';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import TipMixin from '../../helpers/TipMixin';
import { baseAlias } from '../../config';
import AuthComponent from '@components/AuthComponent';

import './home.less'

class Home extends React.Component {
  static propTypes = {
    onChangeNavBar: PropTypes.func
  };

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  componentWillMount() {
    this.props.onChangeNavBar('')
  }

  render() {
    return (
      <div className="modules-page-container">
        <div className="home-page" style={{ width: '100%', height: '100%', position: 'relative' }}>
          <div className="wrapper">
            <div className="title">
              <h4>欢迎使用DMP数据分析平台</h4>
              <p>仅需四步，完成报告制作</p>
            </div>
            <div className="navs">
              <AuthComponent pagecode="添加数据源">
                <button onClick={this.handleGo.bind(this, 'datasource')}>
                  <span className="icon source"></span>
                  <span className="name">链接数据源</span>
                </button>
              </AuthComponent>
              <AuthComponent pagecode="创建数据集">
                <button onClick={this.handleGo.bind(this, 'dataset')}>
                  <span className="icon dataset"></span>
                  <span className="name">处理数据集</span>
                </button>
              </AuthComponent>
              <AuthComponent pagecode="数据报告">
                <button onClick={this.handleGo.bind(this, 'dataview/report/add')}>
                  <span className="icon report"></span><span className="name">制作报告</span>
                </button>
              </AuthComponent>
              <AuthComponent pagecode="数据报告">
                <button onClick={this.handleGo.bind(this, 'dataview')}>
                  <span className="icon view"></span>
                  <span className="name">发布报告</span>
                </button>
              </AuthComponent>
            </div>
          </div>
        </div>
      </div>
    )
  }

  handleGo(path) {
    this.context.router.push(`${baseAlias}/${path}`)
  }
}

reactMixin.onClass(Home, TipMixin)

const stateToProps = state => ({
  ...state.common
})

const dispatchToProps = dispatch => ({ actions: bindActionCreators(commonActionCreators, dispatch) })

export default connect(stateToProps, dispatchToProps)(Home);
