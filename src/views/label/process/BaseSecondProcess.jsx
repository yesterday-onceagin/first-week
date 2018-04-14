import React from 'react';

import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';
import IndicatorSelection from '../components/IndicatorSelection';
import SelectionButton from '../../../components/SelectionButton';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as labelAddOrEditActionCreators } from '../../../redux/modules/label/addOrEdit';

import TipMixin from '../../../helpers/TipMixin';

import './base-second-process.less';

const BaseSecondProcess = createReactClass({
  displayName: 'BaseSecondProcess',
  mixins: [TipMixin],

  getInitialState() {
    return {
      info: {
        /**
         * 当前选取的指标项数据
         */
        indicator_data: [],
        /**
         * 当前选取的指标项，以指标项的ID存储，方便后面使用
         */
        selectedIndicators: []
      },
    }
  },

  componentDidMount() {
    const data = this.props.data

    if (data.indicator_data) {
      const _indicator_data = this.covertLastIndicatorData(data.indicator_data)
      // 同步到info
      this.state.info.indicator_data = _indicator_data
      // 更新选中的指标值id 
      _indicator_data && _indicator_data.forEach((indicator) => {
        indicator.dimension && indicator.dimension.forEach((dimension) => {
          this.state.info.selectedIndicators.push(dimension.dimension_id)
        })
      })
      this.setState({ info: this.state.info })
    }
    // 返回当前组件信息
    this.props.getComponent(this)
  },

  render() {
    const { allIndicator, pending, spread } = this.props
    const info = this.state.info

    return (
      <div className="base-second-process" id="indicator_section">
        <IndicatorSelection
          indicators={allIndicator}
          spread={spread}
          selectedIndicators={info.selectedIndicators}
          handleSelectIndicator={this.handleSelectIndicator}>
          {this.renderFormPanel()}
        </IndicatorSelection>
        <Loading show={pending} containerId='indicator_section'/>
      </div>
    )
  },

  renderFormPanel() {
    const { info } = this.state
    const hasIndicatorData = Array.isArray(info.indicator_data) && info.indicator_data.length > 0;
    return (
      <div className="selected-wapper">
        <div className="title">已选指标</div>
        <div className="indicator-wapper">
          {
            hasIndicatorData ? info.indicator_data.map((indicator, indicatorIndex) => {
              if (!indicator.dimension || indicator.dimension.length <= 0) {
                return null
              }
              return (
                <div key={indicatorIndex} className="indicators">
                  <label>{indicator.indicator_name}：</label>
                  {
                    indicator.dimension.map((indicatorValue, i) => (
                      <SelectionButton
                        key={i}
                        selected={true}
                        onClick={this.handleSelectIndicator.bind(this, indicator, indicatorValue)}>
                        {indicatorValue.dimension_name}
                      </SelectionButton>
                    ))
                  }
                </div>
              )
            }) : '注意：未选中任何指标表示查询全部'
          }
        </div>
      </div>
    )
  },

  handleSelectIndicator(indicator, indicatorValue) {
    const __info = this.state.info
    const selected = __info.selectedIndicators.indexOf(indicatorValue.dimension_id) === -1
    let indicators = __info.indicator_data ? __info.indicator_data.slice() : []

    if (selected) {
      //判断当前选取的指标所在的组是否已存在
      const has = indicators.some(item => item.indicator_id === indicator.indicator_id)
      //如果当前选取的指标所在的组已存在，则更新该指标组数据，否则则新增一个指标组到indicators中
      if (has) {
        indicators = indicators.map((item) => {
          item.dimension = item.dimension || []
          if (item.indicator_id === indicator.indicator_id) {
            item.dimension.unshift({
              dimension_id: indicatorValue.dimension_id,
              dimension_name: indicatorValue.dimension_name
            })
            return {
              ...item,
              dimension: item.dimension
            }
          }
          return item
        })
      } else {
        indicators = indicators || []
        indicators.unshift({
          indicator_id: indicator.indicator_id,
          indicator_name: indicator.indicator_name,
          dimension: [indicatorValue]
        })
      }
    } else {
      //当前选取的指标项已存在时，把indicators中的相应数据清除
      const _indicators = []
      // 当 dimensions 完全被清除的时候，对应的指标应该也要过滤
      indicators.forEach((item) => {
        //判断选取的指标项是哪个指标组下的
        let _item = item
        if (item.indicator_id === indicator.indicator_id) {
          const dimension = item.dimension || []
          _item = {
            ...item,
            dimension: dimension.filter(v => v.dimension_id !== indicatorValue.dimension_id)
          }
        }
        if (_item && _item.dimension.length > 0) {
          _indicators.push(_item)
        }
      })
      indicators = _indicators
    }
    //更新selectedIndicators
    const selectedIndicators = selected ? [...__info.selectedIndicators, indicatorValue.dimension_id]
      : __info.selectedIndicators.filter(selectedItem => selectedItem !== indicatorValue.dimension_id)
    // 更新info.indicators、info.selectedIndicators
    const info = {
      ...__info,
      indicator_data: indicators,
      selectedIndicators
    };
    this.setState({ info });
  },

  covertLastIndicatorData(indicator_data) {
    const _indicator_data = []
    indicator_data.forEach((indicator) => {
      const _indicator_name = this.findCurrentData(indicator.indicator_id, 'indicator')
      if (_indicator_name && indicator.dimension && indicator.dimension.length > 0) {
        const _indicator = {
          indicator_id: indicator.indicator_id,
          indicator_name: _indicator_name,
          dimension: []
        }
        if (Array.isArray(indicator.dimension)) {
          indicator.dimension.forEach((indicatorValue) => {
            const _dimension_name = this.findCurrentData(indicatorValue.dimension_id, 'dimension')
            //实始化选中的指标项
            if (_dimension_name) {
              _indicator.dimension.push({
                dimension_id: indicatorValue.dimension_id,
                dimension_name: _dimension_name
              })
            }
          })
        }
        _indicator_data.push(_indicator)
      }
    })
    return _indicator_data
  },

  // 找出指标id对应在新的指标名称和指标值名称，以避免名称被修改后，依然显示原数据
  findCurrentData(id, type) {
    const allIndicator = this.props.allIndicator
    let name = ''

    if (!Array.isArray(allIndicator)) {
      return name
    }

    if (type === 'indicator') {
      allIndicator.forEach((category) => {
        category.indicator && category.indicator.forEach((indicator) => {
          // 如果
          if (indicator.id === id) {
            name = indicator.name
          }
        })
      })
    } else if (type === 'dimension') {
      allIndicator.forEach((category) => {
        category.indicator && category.indicator.forEach((indicator) => {
          indicator.dimension && indicator.dimension.forEach((dimension) => {
            if (dimension.id === id) {
              name = dimension.name
            }
          })
        })
      })
    }

    return name
  },
})

const stateToProps = state => ({
  ...state.labelAddOrEdit
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(labelAddOrEditActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(BaseSecondProcess);
