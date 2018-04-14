import React from 'react'
import PropTypes from 'prop-types'
import EchartsMap from '../echarts/map'
import loadCustomChart from '@helpers/loadCustomChart'

const EchartConnect = function (EcharPanelComponent, options) {
  return class extends React.Component {
    displayName = 'EchartConnect'

    static propTypes = {
      chart_code: PropTypes.string,
      chartRef: PropTypes.func
    }

    constructor(props) {
      super(props)
      const { chart_code } = props
      this.state = {
        chart_code,
        echart: chart_code && EchartsMap[chart_code] ? { component: EchartsMap[chart_code] } : null
      }
    }

    componentDidMount() {
      const { chart_code } = this.props
      const { echart } = this.state
      if (chart_code && !echart) {
        loadCustomChart(chart_code, (loadedEchart) => {
          this.setState({
            chart_code,
            echart: loadedEchart
          })
        })
      }
    }

    componentWillReceiveProps(nextProps) {
      const { chart_code } = nextProps
      if (chart_code) {
        this.loaded = false
        this.setState(prevState => ({
          chart_code,
          echart: ((chart_code === this.props.chart_code) && prevState.echart) ? prevState.echart : (EchartsMap[chart_code] ? { component: EchartsMap[chart_code] } : null)
        }))
      }
    }

    componentDidUpdate() {
      const { chart_code } = this.props
      const { echart } = this.state
      if (chart_code && !echart && !this.loaded) {
        loadCustomChart(chart_code, (loadedEchart) => {
          this.loaded = true
          this.setState({
            chart_code,
            echart: loadedEchart
          })
        })
      }
    }

    render() {
      const { echart } = this.state
      const { chartRef, ...props } = this.props
      Reflect.deleteProperty(props, 'chart_code')
      if (!echart) return null
      return (
        <EcharPanelComponent ref={chartRef} echart={echart} designTime={(options && options.designTime) || false} {...props} />
      )
    }
  }
}

export default EchartConnect

