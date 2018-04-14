import React from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom';
import echarts from 'echarts';
import isEqual from 'lodash/isEqual';

class Area extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      uuid: new Date().getTime(), // 更新的凭据
      suffixClass: 'area' // class 前缀
    }
    this.getChart = () => this.graph
  }

  componentDidMount() {
    const { data } = this.props
    data && this.runDrawGraph();
  }

  componentWillReceiveProps(nextProps) {
    const { data } = this.props
    if (nextProps.data && !isEqual(data, nextProps.data)) {
      this.setState({
        uuid: new Date().getTime()
      })
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { uuid } = this.state
    return !isEqual(uuid, nextState.uuid)
  }

  componentDidUpdate() {
    const { data } = this.props
    data && this.runDrawGraph();
  }

  render() {
    const { uuid, suffixClass } = this.state
    return <div className="graph-inner-box" style={{ width: '100%', height: '100%' }} id={`${suffixClass}-${uuid}`}>
      <div className="graph-inner-box-wrap" style={{ width: '100%', height: '100%' }} ref={(node) => { this[`${suffixClass}_${uuid}`] = node }}></div>
    </div>
  }


  runDrawGraph() {
    const { uuid, suffixClass } = this.state
    const graphDom = this.graphDom = this[`${suffixClass}_${uuid}`];
    const graph = this.graph = echarts.init(graphDom)

    graph.setOption(this.getOptions())
  }

  getOptions() {
    const charts_data = this.converDate()
    const series = []

    if (charts_data.series.length > 0) {
      const colors = [
        new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
          offset: 0,
          color: 'rgba(72, 141, 251, .5)'
        }, {
          offset: 0.8,
          color: 'rgba(137, 189, 27, 0)'
        }], false),
        new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
          offset: 0,
          color: 'rgba(72, 141, 251, .5)'
        }, {
          offset: 0.8,
          color: 'rgba(137, 189, 27, 0)'
        }], false)
      ]

      for (let i = 0; i < charts_data.series.length; i++) {
        series.push({
          name: charts_data.series[i].name,
          type: 'line',
          smooth: true,
          lineStyle: {
            normal: {
              width: 1
            }
          },
          areaStyle: {
            normal: {
              color: colors[i],
              shadowColor: 'rgba(0, 0, 0, 0.1)',
              shadowBlur: 10
            }
          },
          data: charts_data.series[i].data.map(item => item.times)
        })
      }
    }
    return {
      color: ['#488DFB', '#1EBDA4', '#FA6C47'],
      tooltip: {
        trigger: 'axis',
        confine: window.DEFAULT_ECHARTS_OPTIONS.confine
      },
      legend: {
        ...window.DEFAULT_ECHARTS_OPTIONS.lengend,
        right: '3%',
        data: charts_data.lengend,
        textStyle: window.DEFAULT_ECHARTS_OPTIONS.textStyle
      },
      grid: window.DEFAULT_ECHARTS_OPTIONS.grid,
      xAxis: [{
        boundaryGap: false,
        axisLine: window.DEFAULT_ECHARTS_OPTIONS.axisLine,
        axisLabel: {
          ...window.DEFAULT_ECHARTS_OPTIONS.axisLabel,
          rotate: 0
        },
        data: charts_data.xAxis
      }],
      yAxis: [{
        type: 'value',
        axisLine: window.DEFAULT_ECHARTS_OPTIONS.axisLine,
        splitLine: {
          ...window.DEFAULT_ECHARTS_OPTIONS.splitLine,
          lineStyle: {
            width: '1',
            color: '#3D5D84',
            opacity: '0.35',
            type: 'solid'
          }
        },
        axisLabel: {
          ...window.DEFAULT_ECHARTS_OPTIONS.axisLabel,
          rotate: 0
        }
      }],
      series
    };
  }

  converDate() {
    const { data } = this.props
    const lengend = []
    let xAxis = []
    data.forEach((item, i) => {
      lengend.push({
        icon: 'rect',
        name: item.name
      })

      if (i === 0) {
        xAxis = item.data.map(data => data.hour)
      }
    })

    return {
      lengend,
      xAxis,
      series: data
    }
  }
}


Area.PropTypes = {
  data: PropTypes.object
}

Area.defaultProps = {

}

export default Area;

