import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import { PropComponents } from 'dmp-chart-sdk'

const defaultColData = {
  cellTextStyle: {
    checked: false,
    fontSize: 14,
    color: '#FFFFFF',
    fontStyle: {
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'normal'
    },
    textAlign: 'center',
    background: ''
  },
  cellOther: {
    cellWidth: 100,
    contentType: '文字',
    imageWidth: 100
  }
}

class Cols extends React.Component {
  static propTypes = {
    chart: PropTypes.object,
    data: PropTypes.object,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props)
    const dims = (props.chart && props.chart.dims) || []
    const nums = (props.chart && props.chart.nums) || []
    const cols = dims.concat(nums)

    let list = props.data || []
    list = cols.map((col, index) => (list[index] || _.cloneDeep(defaultColData)))
    this.state = {
      cols,
      list
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.chart, this.props.chart)) {
      const dims = (nextProps.chart && nextProps.chart.dims) || []
      const nums = (nextProps.chart && nextProps.chart.nums) || []
      const cols = dims.concat(nums)

      let list = nextProps.data || []
      list = cols.map((col, index) => (list[index] || _.cloneDeep(defaultColData)))
      this.setState({
        cols,
        list
      })
    }
  }

  render() {
    const { cols, list } = this.state
    return (
      <div className="diagram-design-config-content">
        {cols && cols.map((col, index) => {
          const coldata = list[index] || defaultColData
          return (
            <div key={index}>
              <div className="title">列{index + 1}</div>
              <div style={{ paddingLeft: '10px' }}>
                <div className="config-group">
                  <div className="title">
                    文本样式
                    <PropComponents.Checkbox
                      data={coldata.cellTextStyle.checked}
                      onChange={(data) => { this.handleChangeCols(index, 'cellTextStyle', 'checked', data) }} />
                  </div>
                  {coldata.cellTextStyle.checked ? <div className="content">
                    <div className="layout-config-column">
                      <span className="layout-config-column-title sub">字号</span>
                      <PropComponents.Spinner
                        min={12}
                        data={coldata.cellTextStyle.fontSize}
                        onChange={(data) => { this.handleChangeCols(index, 'cellTextStyle', 'fontSize', data) }}
                      />
                    </div>

                    <div className="layout-config-column">
                      <span className="layout-config-column-title sub">颜色</span>
                      <PropComponents.ColorPicker
                        data={coldata.cellTextStyle.color}
                        onChange={(data) => { this.handleChangeCols(index, 'cellTextStyle', 'color', data) }}
                      />
                    </div>

                    <div className="layout-config-column">
                      <span className="layout-config-column-title sub">样式</span>
                      <PropComponents.FontStyle
                        data={coldata.cellTextStyle.fontStyle}
                        onChange={(data) => { this.handleChangeCols(index, 'cellTextStyle', 'fontStyle', data) }}
                      />
                    </div>

                    <div className="layout-config-column">
                      <span className="layout-config-column-title sub">对齐</span>
                      <PropComponents.TextAlign
                        data={coldata.cellTextStyle.textAlign}
                        onChange={(data) => { this.handleChangeCols(index, 'cellTextStyle', 'textAlign', data) }}
                      />
                    </div>

                    <div className="layout-config-column">
                      <span className="layout-config-column-title sub">背景颜色</span>
                      <PropComponents.ColorPicker
                        data={coldata.cellTextStyle.background}
                        onChange={(data) => { this.handleChangeCols(index, 'cellTextStyle', 'background', data) }}
                      />
                    </div>
                  </div> : null}
                </div>

                <div className="config-group">
                  <div className="title">其他</div>
                  <div className="content">
                    <div className="layout-config-column">
                      <span className="layout-config-column-title sub">列宽占比</span>
                      <PropComponents.Slider
                        min={0}
                        max={100}
                        step={1}
                        data={coldata.cellOther.cellWidth}
                        onChange={(data) => { this.handleChangeCols(index, 'cellOther', 'cellWidth', data) }}
                      />
                    </div>

                    <div className="layout-config-column">
                      <span className="layout-config-column-title sub">内容类型</span>
                      <PropComponents.Select
                        options={[{ value: '文字', text: '文字' }, { value: '图片', text: '图片' }]}
                        data={coldata.cellOther.contentType}
                        onChange={(data) => { this.handleChangeCols(index, 'cellOther', 'contentType', data) }}
                      />
                    </div>

                    {coldata.cellOther.contentType === '图片' ? <div className="layout-config-column">
                      <span className="layout-config-column-title sub">图片占比</span>
                      <PropComponents.Slider
                        min={0}
                        max={100}
                        step={1}
                        data={coldata.cellOther.imageWidth}
                        onChange={(data) => { this.handleChangeCols(index, 'cellOther', 'imageWidth', data) }}
                      />
                    </div> : null}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  handleChangeCols(index, group, item, data) {
    const list = this.state.list.concat()
    list[index] = list[index] || _.cloneDeep(defaultColData)
    list[index][group][item] = data
    this.setState({
      list
    }, () => {
      this.props.onChange(this.state.list)
    })
  }
}

export default Cols
