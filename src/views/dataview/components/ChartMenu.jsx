import React from 'react'
import PropTypes from 'prop-types'

import EchartsMap from '../echarts/map'
import loadCustomChart from '@helpers/loadCustomChart'

class ChartMenu extends React.Component {
  static propTypes = {
    chart: PropTypes.object,
    chart_code: PropTypes.string,
    element: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string,
    children: PropTypes.array
  }

  static defaultProps = {
    element: 'div'
  }

  constructor(props) {
    super(props)
    const { chart_code } = props
    this.state = {
      echart: chart_code && EchartsMap[chart_code] ? { component: EchartsMap[chart_code] } : null
    }
  }

  componentDidMount() {
    const { chart, chart_code } = this.props
    const { echart } = this.state
    if (chart_code && !echart) {
      loadCustomChart((chart || chart_code), (loadedEchart) => {
        this.setState({
          echart: loadedEchart
        })
      })
    }
  }

  render() {
    const { element, className, children } = this.props
    const Element = element
    return (
      <Element className={className} onClick={this.onClickMenu}>
        {children}
      </Element>
    )
  }

  onClickMenu = () => {
    const { onClick } = this.props
    const { echart } = this.state
    if (echart) {
      onClick && onClick(echart)
    }
  }
}

export default ChartMenu
