import React from 'react';
import PropTypes from 'prop-types'
import { Provider } from 'react-redux'

import configureStore from './redux/configureStore'
import DmpSimulatorPreview from './preview'

import { setTheme } from '../../../constants/echart'

import 'react-bootstrap-myui/dist/css/react-bootstrap-myui.min.css'
import '../../../static/css/reset.less'
import '../../../static/css/main.less'

const store = configureStore()

class DmpSimulator extends React.Component {
  static propTypes = {
    chartlibs: PropTypes.array
  }

  componentWillMount() {
    setTheme()
  }

  render() {
    const { chartlibs } = this.props
    return (
      <Provider store={store}>
        <div role="page">
          <div className="container page-container" id="pageContainer">
            <div className="page-main" id="pageMain" style={this.STYLES.pageMain}>
              <DmpSimulatorPreview
                chartlibs={chartlibs}
                params={{
                  kanban_id: '39e424ef-ea47-639a-7b6f-2e2a09c720ab',
                  kanban_name: '开发工具示例报告'
                }}
              />
            </div>
          </div>
        </div>
      </Provider >
    )
  }

  STYLES = {
    pageMain: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 0%',
      overflow: 'hidden',
      width: '100%',
      height: '100%',
      minWidth: 'initial',
      maxWidth: 'initial',
      padding: ' 0px'
    }
  }
}

export default DmpSimulator
