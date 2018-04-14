import React from 'react'
import PropTypes from 'prop-types'

import TabConfigDialog from './TabConfigDialog'

import { DEFAULT_TABS_ARRAY } from '../src/constant'
import './tab-config.less'

class TabConfig extends React.PureComponent {
  static propTypes = {
    data: PropTypes.object,
    onChange: PropTypes.func,
    chart: PropTypes.object,
    diagramList: PropTypes.array,
    dashboardTabData: PropTypes.object
  };

  constructor(props) {
    super(props)
    this.state = {
      showDialog: false
    }
  }

  render() {
    const { data, chart, diagramList, onChange, dashboardTabData } = this.props
    const { showDialog } = this.state
    const chartId = chart.id;
    const tabArray = Array.isArray(data.tabs) ? data.tabs : DEFAULT_TABS_ARRAY

    return (
      <div className="simple-tab-diagram-config">
        <div className="layout-config-column">
          <span className="layout-config-column-title">标签配置</span>
          <span className="dmpicon-edit" onClick={this.handleOpenTabConfigDialog.bind(this)}/>
        </div>
        <ul className="simple-tabs-preview-container">
          {tabArray.map((item, index) => (
            <li key={`simple-tab-diagram-config-${chartId}-${index}`}>{item.name}</li>
          ))}
        </ul>
        {
          showDialog && (
            <TabConfigDialog
              key={`tab-config-dialog-${chartId}`}
              chartId={chartId}
              data={data}
              diagramList={diagramList}
              dashboardTabData={dashboardTabData}
              onClose={this.handleCloseTabConfigDialog.bind(this)}
              onSure={onChange}
            />
          )
        }
      </div>
    )
  }

  // 打开tab标签配置对话框
  handleOpenTabConfigDialog() {
    this.setState({
      showDialog: true
    })
  }

  // 关闭tab标签配置对话框
  handleCloseTabConfigDialog() {
    this.setState({
      showDialog: false
    })
  }
}

export default TabConfig;
