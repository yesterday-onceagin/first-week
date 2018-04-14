import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Input from 'react-bootstrap-myui/lib/Input';
import Select from 'react-bootstrap-myui/lib/Select';
import NumberInput from '../../../../components/NumberInput';
import MarkLineDialog from '../../components/MarkLineDialog';
import ColorOptionColumn from '../../components/ColorOptionColumn';

import _ from 'lodash';
//有轴的图：折线、面积、散点、瀑布、双轴图、柱状
class YSeries extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    chartData: PropTypes.array,
    indicators: PropTypes.object,
    configInfo: PropTypes.object,
    chart: PropTypes.object,
    onChange: PropTypes.func,
    showErr: PropTypes.func,
    field: PropTypes.string
  };

  constructor(props) {
    super(props)
    this.state = {
      field: props.field || 'y',
      show: false,
      data: _.cloneDeep(props.configInfo)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.configInfo, nextProps.configInfo)) {
      this.setState({
        data: _.cloneDeep(nextProps.configInfo)
      })
    }
    if (nextProps.field) {
      this.setState({
        filed: nextProps.field
      })
    }
  }

  render() {
    const { show, data, field } = this.state
    const { chart_code } = this.props.chart
    const indicators = this.props.chart.nums
    let markline = []

    if (data.markline) {
      markline = _.cloneDeep(data.markline.data)
    }
    return (
      <div>
        <div className="title">
          轴标签
          <span onClick={this.handleLabelChange.bind(this, 'show', !data.label.show)}>
            <Input
              type="checkbox"
              checked={data.label.show}
              onChange={() => { }}
            />
          </span>
        </div>
        {
          data.label.show && (
            <div className="content">
              <div className="layout-config-column has-suffix">
                <span className="layout-config-column-title sub">字号</span>
                <span className="layout-config-column-suffix">px</span>
                <NumberInput
                  changeOnBlur={true}
                  debounce={true}
                  minValue={1}
                  step={1}
                  name="barLabelSize"
                  value={data.label.size}
                  onChange={this.handleLabelChange.bind(this, 'size')}
                />
              </div>
              <div className="layout-config-column">
                <span className="layout-config-column-title sub">颜色</span>
                <ColorOptionColumn
                  field="color"
                  color={data.label.color}
                  onChange={this.handleLabelChange.bind(this)}
                />
              </div>
              { chart_code !== 'scatter' && this.renderShowAllLabel() }
              {
                data.label.angle && (
                  <div className="layout-config-column">
                    <span className="layout-config-column-title sub">角度</span>
                    <Select
                      value={data.label.angle}
                      maxHeight={160}
                      width="100%"
                      openSearch={false}
                      onSelected={this.handleSelectChange.bind(this, 'angle')}
                    >
                      <option value="horizon">水平</option>
                      <option value="italic">斜角</option>
                      <option value="vertical">垂直</option>
                    </Select>
                  </div>
                )
              }
            </div>
          )
        }

        <hr/>

        <div className="title">
            轴线
          <span onClick={this.handleAxisChange.bind(this, 'show', !data.axis.show)}>
            <Input
              type="checkbox"
              checked={data.axis.show}
              onChange={() => { }}
            />
          </span>
        </div>
        {
          data.axis.show && (
            <div className="content">
              <div className="layout-config-column">
                <span className="layout-config-column-title sub">颜色</span>
                <ColorOptionColumn
                  field="color"
                  color={data.axis.color}
                  onChange={this.handleAxisChange.bind(this)}
                />
              </div>
            </div>
          )
        }

        {data.markline && <hr/>}
        {
          data.markline &&
            <div className="title">
              辅助线
              <i className="dmpicon-edit edit-icon" onClick={this.handleOpenDialog.bind(this)}/>
            </div>
        }
        {
          data.markline && <div className="layout-config-column">
            <span className="layout-config-column-title sub">显示名称</span>
            <span onClick={this.handleMarklineShow.bind(this, 'show', !data.markline.show)} style={{ paddingLeft: '20px', display: 'inline-block', marginTop: '-11px', verticalAlign: 'top' }}>
              <Input
                type="checkbox"
                checked={data.markline.show}
                onChange={() => { }}
              />
            </span>
          </div>
        }
        {
          data.markline && <div className="content">
            <div className="layout-config-column form has-suffix">
              <span className="layout-config-column-title sub">线型</span>
              <span className="layout-config-column-suffix">px</span>
              <Select
                value={data.markline.style}
                maxHeight={160}
                width={85}
                openSearch={false}
                onSelected={this.handleChangeSelect.bind(this)}
              >
                <option value="solid">实线</option>
                <option value="dashed">虚线</option>
                <option value="dotted">点线</option>
              </Select>
              <input className="border-input"
                type="text"
                value={data.markline.width}
                onChange={this.handleChangeText.bind(this)}
                onBlur={this.handleConfirmChangeText.bind(this)}
              />
            </div>
            <div className="layout-config-column">
              <span className="layout-config-column-title sub">颜色</span>
              <ColorOptionColumn
                onChange={this.handleConfirmColorChange.bind(this)}
                field="color"
                color={data.markline.color}
              />
            </div>
          </div>
        }
        {
          show && <MarkLineDialog
            show={show}
            chartCode={this.props.chart.chart_code}
            field={field}
            select_list={indicators || []}
            data={markline}
            showErr={this.props.showErr}
            onSure={this.handleSureDialog.bind(this)}
            onClose={this.handleCloseDialog.bind(this)}
          />
        }
      </div>
    )
  }

  // 渲染是否显示全部标签
  renderShowAllLabel() {
    const { field, data } = this.state
    const cn = classnames('icon-checkbox', { checked: data.label.showAll })
    const canSet = (field === 'x' && !this._getChartType().horizon) || (field === 'y' && this._getChartType().horizon)

    return canSet ? (
      <div className="layout-config-column">
        <span className="layout-config-column-title sub">全部标签</span>
        <div className="checkbox-container">
          <i className={cn} onClick={this.handleLabelChange.bind(this, 'showAll', !data.label.showAll)} />
        </div>
      </div>
    ) : null
  }

  handleOpenDialog() {
    this.setState({
      show: true
    })
  }

  handleSureDialog(data) {
    _.set(this.state.data.markline, 'data', data)

    this.setState({
      ...this.state,
      show: false
    })

    this.props.onChange(this.state.field, 'markline.data', data)
  }

  handleCloseDialog() {
    this.setState({
      show: false
    })
  }

  handleMarklineShow(property, value) {
    const { field } = this.state
    _.set(this.state.data.markline, property, value)
    this.props.onChange(field, `markline.${property}`, value)
  }

  handleSelectChange(property, option) {
    const { field } = this.state
    _.set(this.state.data.label, property, option.value)
    this.props.onChange(field, `label.${property}`, option.value)
  }
  handleLabelChange(property, value) {
    const { field } = this.state
    _.set(this.state.data.label, property, value)
    this.props.onChange(field, `label.${property}`, value)
  }

  handleAxisChange(property, value) {
    const { field } = this.state
    _.set(this.state.data.axis, property, value)
    this.props.onChange(field, `axis.${property}`, value)
  }

  handleSplitChange(property, value) {
    const { field } = this.state
    _.set(this.state.data.split, property, value)
    this.props.onChange(field, `split.${property}`, value)
  }

  //暂时只处理柱状图
  _getChartType() {
    const { chart_code } = this.props.chart
    return {
      horizon: chart_code === 'horizon_bar' || chart_code === 'horizon_stack_bar'
    }
  }


  // 输入事件
  handleChangeText(e) {
    const width = e.target.value
    _.set(this.state.data.markline, 'width', width)
    this.setState({
      ...this.state
    })
  }

  // 确认输入
  handleConfirmChangeText(e) {
    const width = e.target.value
    this.props.onChange(this.state.field, 'markline.width', width)
  }

  // 选择线形
  handleChangeSelect(option) {
    const newStyle = option.value
    _.set(this.state.data.markline, 'style', newStyle)
    this.setState({
      ...this.state
    })
    this.props.onChange(this.state.field, 'markline.style', newStyle)
  }

  // 确定颜色选择
  handleConfirmColorChange(fieldName, color) {
    this.props.onChange(this.state.field, 'markline.color', color)
  }
}

export default YSeries
