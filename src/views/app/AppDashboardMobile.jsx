import React from 'react'
import PropTypes from 'prop-types'

import AppDashboardContent from './components/AppDashboardContent'

// 应用门户数据报告
class AppDashboardMobile extends React.PureComponent {
  static propTypes = {
    onChangeNavBar: PropTypes.func,
    params: PropTypes.object
  };

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  render() {
    const { params, onChangeNavBar } = this.props
    return (
      <div className="modules-page-container">
        <AppDashboardContent dashboardId={params.dataview_id} onChangeNavBar={onChangeNavBar}/>
      </div>
    );
  }
}

export default AppDashboardMobile;
