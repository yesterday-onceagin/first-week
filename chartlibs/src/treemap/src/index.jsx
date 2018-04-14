import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import echarts from "echarts";

import { Connect, Utils } from 'dmp-chart-sdk'
import './style.less'

const { DataUtils } = Utils ;

const _attachColorStyle = (sery, colorTheme, seryIndex) => {
  const color = Utils.Theme.getEchartColorFromTheme(echarts, colorTheme, seryIndex, 0)
  const originColor = Utils.Theme.getColorFromTheme(colorTheme, seryIndex, 0)
  _.set(sery, 'series[0].itemStyle.normal.color', color)
  // 如果是渐变色, 那么label 需要设置一个颜色, 否则默认为黑色了
  if (Array.isArray(originColor)) {
    _.set(sery, 'label.normal.color', originColor[0])
  }
}

// 转换Table数据
const _dataProcess = (data, indicators) => {
  const dimsData = DataUtils.pluckDimsData(data, indicators, (hookData) => {
    hookData.key = `_${hookData.key}`
    return hookData
  })

  const numsData = DataUtils.pluckNumsData(data, indicators, (hookData, num) => {
    hookData.key = `_${hookData.key}`
    const suffix = dimsData.dims[hookData.key] ? (Utils.OPERATE_OPTION_RESERVE_MAPS[num.formula_mode] ? `(${Utils.OPERATE_OPTION_RESERVE_MAPS[num.formula_mode]})` : '') : ''
    hookData.key += suffix
    return hookData
  })

  return { ...dimsData, ...numsData }
}

const _transformTableData = (data, indicators) => {
  const { dims, nums } = _dataProcess(data, indicators);
  const _data = []

  for (let i = 0; i < data.length; i++) {
    let item = {};
    Object.keys(dims).forEach((dim) => {
      item = {
        ...item,
        name: dims[dim][i]
      }
    });

    Object.keys(nums).forEach((num) => {
      item = {
        ...item,
        value: nums[num][i]
      }
    });
    _data.push(item)
  }

  return {
    data: _data
  }
}

const _parseFontStyle = function (fontStyle) {
  return {
    fontStyle: fontStyle.fontStyle || 'normal',
    fontWeight: fontStyle.fontWeight || 'normal',
    textDecoration: fontStyle.textDecoration || 'none'
  }
}

class Table extends React.Component {
  static propTypes = {
    designTime: PropTypes.bool,    // 设计时(编辑区)
    data: PropTypes.object,        // 数据集返回的数据
    config: PropTypes.object,      // 样式配置数据
    events: PropTypes.object,      // 可触发的事件
    layer: PropTypes.object,       // 组件在编辑区的图层信息
    scale: PropTypes.number,       // 组件在编辑区的缩放比例
  }

  constructor(props) {
    super(props)
    const { data, indicators } = props.data || {}
    this.state = {
      data: _transformTableData(_.cloneDeep(data) , _.cloneDeep(indicators) )
    }
  }

  componentDidMount(){
    this.runDrawChart(this.props);

  }

  shouldComponentUpdate(nextProps) {
    const { scale, layer } = this.props
    // if (nextProps.scale !== scale || !_.isEqual(nextProps.layer, layer)) {
    //   return false
    // }
    return true
  }

  componentDidUpdate(preProps){
    // this.runDrawChart(this.props);

    const { data, scale } = this.props
    // if (Array.isArray(data.dataArr)) {
    // }
    this.runDrawChart(null,scale !== preProps.scale);
  }

  componentWillReceiveProps(nextProps) {

    
    //判断样式是否改变
    if ( !_.isEqual(this.props.config, nextProps.config)) {
      // this.setState({
      //   data: _transformTableData(nextProps.data.data, nextProps.data.indicators)
      // })
      console.log('next');
      this.runDrawChart(nextProps);
    }
  }

  //初始化echarts
  runDrawChart(props,reInit){
    var props=props ?props :this.props;
    console.log(props,'props');
    
    //全局
    // const {scale ,config ,data} = props;
    const {config ,data} = props;
    console.log(props.data,'data');

    //迁移
    const { scale/* , platform */ } = this.props
    console.log(scale,'scaleRate')
    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom/* , null, getEchartRenderer(platform) */)
      
      Utils.scaleChart(this.graph, scale)
    }

    
    // //获取echarts实例
    // this.graph=echarts.init(this.node);
    // console.log(this.graph,'graph');
    // Utils.scaleChart(this.graph, scale)

    //配置样式
    const oStyle =this.getStyle(config) ;

    //获取全部配置
    const option =this.getOptions(oStyle,props);
    console.log(option,'option');

    //画图 加上noMerge = true参数即可防止使用到上一次的配置
    this.graph.setOption(option,true);
  }

  //获取样式
  getStyle(config){

    const {global ,containerBackground ,containerBorder ,containerTitle ,valueSeries} =config;

    //全局
    const {color,fontSize} =global.valueLabel;
    //每个矩形的文本标签样式
    const label={
      color,
      fontSize
    }

    //数据系列 纬度条目(数据操作) 定时刷新 (数据操作)
    // const {dimCount, refresh , theme} = valueSeries;
    //颜色主题
    // const {themeKey, v ,customColors} =theme.colorTheme; 
    // const originColor = Utils.Theme.getEchartColorFromTheme(echarts, theme.colorTheme, 0, 0)
    // const originColor = Utils.Theme.getColorFromTheme(theme.colorTheme, 0, 0)
    
    //背景颜色
    // const {backgroundColor} = containerBackground;


    return{
      label,
      // originColor,
      // backgroundColor,
    }
  }


  //获取echarts-options
  getOptions(oStyle ,props){

    const {data } =props;
    // const { colorTheme } =props.config.valueSeries.theme ;
    const {label ,originColor  } = oStyle;

    const {colorTheme} =  props.config.theme;

    console.log(this.state.data,'state data');
    console.log(  window.DEFAULT_ECHARTS_OPTIONS.color ,' window.DEFAULT_ECHARTS_OPTIONS.color')

    let option={
      color: window.DEFAULT_ECHARTS_OPTIONS.color,
      tooltip: {
        trigger: 'item',
        confine: window.DEFAULT_ECHARTS_OPTIONS.confine
      },
      grid: window.DEFAULT_ECHARTS_OPTIONS.grid,
      legend: {
        ...window.DEFAULT_ECHARTS_OPTIONS.lengend,
        show: false,
        // data: chartData.legend,
        textStyle: window.DEFAULT_ECHARTS_OPTIONS.textStyle,
      },
    };

    let series= [{
        type: 'treemap',
        breadcrumb:false,//不显示面包屑
        data: this.state.data.data,
        roam:false,
        nodeClick:false
    }]

    this.state.data.data.map((item, i) => {
      // const dataItem = {
      //   ...item,
      //   value: +item.value ? Number(+item.value).toFixed(2) : 0
      // }

      // 下面两个 调用顺序不能改变, 否则会bug
      colorTheme && _attachColorStyle(option,colorTheme, i) ;
      // _attachPieLabelStyle(dataItem, config.global, data);

      // return dataItem
    })
    
  // _.set(series[0] ,'levels[0].itemStyle.normal.color' ,originColor);      
  _.set(series[0] ,'label.normal.formatter' ,['{a| {b}: {c}} '].join('\n'));   //{a| {b}:{c}}  
  _.set(series[0] ,'label.normal.rich.a' ,{color:label.color,fontSize:label.fontSize});    
  _.set(option ,'tooltip.formatter' ,'{b}: {c}');      
  _.set(option ,'series' ,series);    

  return option;
  
  }



  

  render() {
    const { data } = this.state
    return (
      <div className="graph-inner-box">
        {/* <div className="table-view-wrap">
          <table className="data-view-table">
            {data && data.data && data.data.length > 0 && this.renderTableHeader()}
            {data && data.data && data.data.length > 0 && this.renderTableBodys()}
          </table>
        </div> */}
        <div className="graph-inner-box-wrap" ref={(node)=>this.graphNode=node}></div>
      </div>
    );
  }

  renderTableHeader() {
    const { config } = this.props
    const { data } = this.state

    const thead = []
    Object.keys(data.data[0]).forEach((item, i) => {
      const style = this._getHeaderStyle(config, i)
      thead.push(<th style={style} key={`${item}_${i}`}>{item.substr(1)}</th>)
    })

    return <thead><tr>{thead}</tr></thead>
  }

  renderTableBodys() {
    const { data } = this.state
    const dataList = data.data
    const rows = []
    const dataKeys = Object.keys(dataList[0])
    for (let i = 0; i < dataList.length; i++) {
      const dataObj = dataList[i]
      const tds = []
      for (let j = 0; j < dataKeys.length; j++) {
        const col = dataKeys[j]
        const text = dataObj[col]
        tds.push(<td key={`td_${i}_${j}`}>{text}</td>)
      }
      rows[i] = <tr key={`tr_${i}`}>{tds}</tr>
    }

    return (
      <tbody>{rows}</tbody>
    )
  }

  _getHeaderStyle(config) {
    let style = {}
    if (config && config.tableHeader && config.tableHeader.show) {
      style = {
        color: config.tableHeader.color,
        fontSize: `${config.tableHeader.fontSize}px`,
        textAlign: config.tableHeader.textAlign,
        background: config.tableHeader.background,
        lineHeight: `${config.tableHeader.lineHeight}px`,
        ..._parseFontStyle(config.tableHeader.fontStyle)
      }
    } else if (config.tableHeader && !config.tableHeader.show) {
      style = {
        display: 'none'
      }
    }
    return style
  }
}

export default Connect()(Table)
