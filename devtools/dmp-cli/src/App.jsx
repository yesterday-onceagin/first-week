import React from 'react'

import DMPSimulator from './components/dmpsimulator/dmpsimulator'
import './components/dmpsimulator/css/dmpsimulator.min.css'

// 当前预览的组件
const echart = require('../chartlibs/chartlink/index').default
const { info } = echart || {}
const chartlibs = [
  {
    code: info && info.code,
    name: info && info.name,
    echart
  }
]

class App extends React.Component {
  render() {
    return (
      <DMPSimulator
        chartlibs={chartlibs}
      />
    )
  }
}

export default App