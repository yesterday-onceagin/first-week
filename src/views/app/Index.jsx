import React from 'react'
import PropTypes from 'prop-types'

import EmptyStatus from '@components/EmptyStatus'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as userActionCreators } from '../../redux/modules/organization/user'

import _ from 'lodash'
import { getModuleById, getFirstUrlModule } from '@helpers/appUtils'
import { baseAlias } from '../../config'

class AppIndex extends React.PureComponent {
  static propTypes = {
    params: PropTypes.object
  };

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      loaded: false
    };
  }
  
  componentWillReceiveProps(nextProps) {
    this.setState({ loaded: false }, () => {
      this._goLink(nextProps)
    })
  }

  componentWillMount() {
    this._goLink(this.props)
  }

  render() {
    return this.state.loaded && (
      <EmptyStatus
        icon="dmpicon-empty-report"
        textSize="16px"
        text="没有为此页面配置需要展示的数据报告或链接"
      />
    )
  }

  // 跳转到对应的链接
  _goLink(props) {
    const { functionIds, params, topMenus } = props
    // 得到当前APP
    const currApp = _.find(topMenus, app => app.id === params.id)
    // 判断当前app是否为链接
    if (!currApp) {
      this.context.router.replace(`${baseAlias}/app/error/notfound`);
    } else if (currApp.link) {
      this.context.router.replace(`${baseAlias}${currApp.link}`);
    } else {
      let func
      // 检查是否是已访问过的app
      if (functionIds[currApp.id]) {
        ([func] = getModuleById(functionIds[currApp.id], currApp.function));
      } else {
        func = getFirstUrlModule(currApp.function);
      }

      if (func && func.link) {
        this.context.router.replace(`${baseAlias}${func.link}`)
      }
      this.setState({ loaded: true })
    }
  }
}

const stateToProps = state => ({
  ...state.user
})

const dispatchToProps = dispatch => ({ actions: bindActionCreators(userActionCreators, dispatch) })

export default connect(stateToProps, dispatchToProps)(AppIndex);
