/* 数值区间筛选*/
import React from 'react';
import PropTypes from 'prop-types'
import Slider from 'rc-slider';
import './timeline.less';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

class Timeline extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    layoutOptions: PropTypes.object,
    scaleRate: PropTypes.number,
    through: PropTypes.bool,
    events: PropTypes.shape({
      onSort: PropTypes.func,
      onChartChange: PropTypes.func,
      onThrough: PropTypes.func
    }),
    id: PropTypes.string,
    dataGrid: PropTypes.object,
    editable: PropTypes.bool
  };
  constructor(props) {
    super(props)
    //获取key
    const { dim } = props.data
    const layoutOption = props.layoutOptions
    let selectKey = ''
    if (dim) {
      selectKey = dim.formula_mode ? `${dim.formula_mode}_${dim.col_name}` : dim.col_name
    }
    this.state = {
      suffix: 'timeline',
      dim: props.data.dim ? props.data.dim : {}, //别名列表用作placeholder
      dataList: props.data.dataList ? props.data.dataList : [], //数据列表
      isCarousel: layoutOption.global.isCarousel, //是否轮播
      interval: layoutOption.global.interval * 1000,
      default_bg_color: layoutOption.global.default_bg_color,
      default_selected_color: layoutOption.global.default_selected_color,
      layout: layoutOption.global.layout,
      distance: layoutOption.global.distance,
      size: layoutOption.global.size,
      node_size: layoutOption.eventNode.node_size,
      node_color: layoutOption.eventNode.node_color,
      selected_node_color: layoutOption.eventNode.selected_node_color,
      value: -1,
      selectKey
    }
  }
  componentWillReceiveProps(nextProps) {
    const { layoutOptions, data } = nextProps
    const { dataList } = this.state
    const max = dataList.length - 1
    const layoutOption = layoutOptions || null
    if (layoutOption && layoutOptions !== this.props.layoutOptions) {
      //如果变为开启轮播
      if (layoutOption.global.isCarousel) {
        this.timeout && clearInterval(this.timeout)
        this.timeout = setInterval(() => {
          let { value } = this.state
          if (value < max) {
            ++value
            this.setState({
              value
            }, this.triggerChange(value))
          } else {
            value = -1
            this.setState({
              value
            }, this.triggerChange(value))
          }
        }, layoutOption.global.interval * 1000)
      } else if (!layoutOption.global.isCarousel && (!this.props.layoutOptions || this.props.layoutOptions.global.isCarousel !== layoutOptions.global.isCarousel)) {
        //清除当前时间轴状态
        this.clearChange()
        this.timeout && clearInterval(this.timeout)
      }
      this.setState({
        layout: layoutOption.global.layout,
        distance: layoutOption.global.distance,
        interval: layoutOption.global.interval * 1000,
        isCarousel: layoutOption.global.isCarousel,
        default_bg_color: layoutOption.global.default_bg_color,
        default_selected_color: layoutOption.global.default_selected_color,
        node_size: layoutOption.eventNode.node_size,
        node_color: layoutOption.eventNode.node_color,
        selected_node_color: layoutOption.eventNode.selected_node_color,
        size: layoutOption.global.size
      })
    }

    if (data.dataList !== this.props.data.dataList) {
      const { dim } = data
      let selectKey = ''
      if (dim) {
        selectKey = dim.formula_mode ? `${dim.formula_mode}_${dim.col_name}` : dim.col_name
      }
      this.setState({
        dataList: data.dataList,
        selectKey
      })
    }
  }

  componentWillMount() {
    const { dataList, interval, isCarousel } = this.state
    const max = dataList.length - 1
    if (isCarousel) {
      this.timeout = setInterval(() => {
        let { value } = this.state
        if (value < max) {
          ++value
          this.setState({
            value
          }, this.triggerChange(value))
        } else {
          value = -1
          this.setState({
            value
          }, this.triggerChange(value))
        }
      }, interval)
    }
  }

  componentWillUnmount() {
    if (this.timeout) {
      clearInterval(this.timeout)
    }
  }

  render() {
    const { dataList, layout, default_bg_color, selected_node_color, default_selected_color, size, distance } = this.state
    const min = -1
    const max = dataList.length - 1
    const sliderStyle = {
      height: layout === 'horizon' ? 'auto' : '100%',
      width: layout === 'horizon' ? '100%' : 'auto'
    }
    const wrapperStyle = {
      height: layout === 'horizon' ? 'auto' : `${100 - (2 * distance)}%`,
      margin: layout === 'horizon' ? '0 auto' : 'auto 0',
      width: layout === 'horizon' ? `${100 - (2 * distance)}%` : 'auto'
    }

    const marks = this.generateMarks()
    return <div className="graph-inner-box">
      <div className="timeline-wrap">
        <div className="timeline-inner-wrap" style={wrapperStyle}>
          <div className="fl" style={sliderStyle} ref={this.state.suffix}>
            <Slider
              vertical={layout === 'vertical'}
              dots
              marks={marks}
              value={this.state.value}
              railStyle={{
                backgroundColor: default_bg_color,
                width: layout === 'vertical' ? `${parseInt(size, 10)}px` : '',
                height: layout === 'horizon' ? `${parseInt(size, 10)}px` : '',
                left: layout === 'vertical' ? `${5 + ((4 - parseInt(size, 10)) / 2)}px` : null,
                top: layout === 'horizon' ? `${5 + ((4 - parseInt(size, 10)) / 2)}px` : null
              }}
              trackStyle={{
                backgroundColor: default_selected_color,
                transition: layout === 'vertical' ? 'height 2s' : 'width 2s',
                width: layout === 'vertical' ? `${parseInt(size, 10)}px` : '',
                height: layout === 'horizon' ? `${parseInt(size, 10)}px` : '',
                left: layout === 'vertical' ? `${5 + ((4 - parseInt(size, 10)) / 2)}px` : null,
                top: layout === 'horizon' ? `${5 + ((4 - parseInt(size, 10)) / 2)}px` : null
              }}
              dotStyle={this.generateDotStyle('normal')}
              activeDotStyle={this.generateDotStyle('active')}
              handleStyle={{ backgroundColor: selected_node_color }}
              min={min}
              max={max}
              onChange={this.handleChange.bind(this)}
            />
          </div>
        </div>
      </div>
    </div>
  }

  convertLayout(layout) {
    let layoutOption = {}
    if (layout) {
      try {
        layoutOption = JSON.parse(layout)
      } catch (e) {
        layoutOption = {}
      }
    }
    return layoutOption.data
  }

  generateDotStyle(type) {
    const { node_size, node_color, layout, selected_node_color, value } = this.state
    const dotStyle = {
      width: `${parseInt(node_size, 10)}px`,
      height: `${parseInt(node_size, 10)}px`,
      backgroundColor: (type === 'active') ? selected_node_color : node_color
    }
    if (layout === 'horizon') {
      dotStyle.bottom = `${-2 + ((8 - parseInt(node_size, 10)) / 2)}px`
    } else if (layout === 'vertical') {
      dotStyle.left = `${2 + ((8 - parseInt(node_size, 10)) / 2)}px`
    }
    //如果value是-1则重置
    if (value === -1) {
      dotStyle.backgroundColor = node_color
    }
    return dotStyle
  }
  generateMarks() {
    const { dataList, selectKey } = this.state
    //默认值 -1为全部
    let marks = { [-1]: {
      label: '全部',
      style: this.generateMarkStyle(-1)
    }
    }

    Array.isArray(dataList) && dataList.forEach((item, index) => {
      const label = item[selectKey] && item[selectKey].toString()
      marks = { ...marks,
        [index]: {
          label,
          style: this.generateMarkStyle(index)
        }
      }
    })
    return marks
  }
  //生成节点标签样式
  generateMarkStyle(index) {
    const { layoutOptions } = this.props
    //用作设置节点标签
    const { eventTitle } = layoutOptions
    const { layout, value } = this.state
    const style = {
      color: value === index ? eventTitle.selected_color : eventTitle.color,
      whiteSpace: layout === 'vertical' ? 'nowrap' : '',
      paddingTop: layout === 'horizon' ? eventTitle.distance : 0,
      paddingLeft: layout === 'vertical' ? eventTitle.distance : 0,
      fontSize: value === index ? `${eventTitle.selected_size}px` : `${eventTitle.size}px`
    }
    return style
  }

  handleChange(value) {
    this.setState({
      value
    })
    this.triggerChange(value)
  }
  clearChange() {
    const { id, events } = this.props
    this.setState({
      value: -1
    })
    if (events.onNumberChange) {
      events.onNumberChange([], id, 'timeline')
    }
  }
  //触发联动
  triggerChange(value) {
    const { dim, dataList, selectKey } = this.state
    const { id, events, editable } = this.props
    const conditions = []
    if (value > -1) {
      conditions.push({
        col_name: dim.col_name,
        field_name: dim.col_name,
        field_id: dim.id || dim.dim,
        col_value: dataList[value][selectKey],
        operator: '='
      })
    }
    if (events.onNumberChange && !editable) {
      events.onNumberChange(conditions, id, 'timeline')
    }
  }
}

export default Timeline;
