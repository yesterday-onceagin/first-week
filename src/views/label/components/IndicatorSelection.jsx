import React from 'react'
import PropTypes from 'prop-types'

import Tabs from 'react-bootstrap-myui/lib/Tabs';
import Tab from 'react-bootstrap-myui/lib/Tab';
import SelectionButton from '../../../components/SelectionButton';

class IndicatorSelection extends React.Component {
  static propTypes = {
    /**
     * 指标数据
     */
    indicators: PropTypes.array,
    /**
     * 选中的指标数据，其为IndicatorValue.indicator_value_id数组
     */
    selectedIndicators: PropTypes.array,
    /**
     * 选取指标项的回调函数，回传参数 indicator（选中的指标值所属的指标对象）, indicatorValue（选中的指标值对象）
     */
    handleSelectIndicator: PropTypes.func
  };

  static defaultProps = {
    indicators: [],
    selectedIndicators: [],
    handleSelectIndicator: () => {}
  };

  state = {
    key: new Date().getTime(),
    tabsActiveKey: 0,
  };

  render() {
    const { indicators, selectedIndicators } = this.props
    let _indicators = []

    if (indicators) {
      _indicators = indicators.filter(item => (
        Array.isArray(item.indicator) && item.indicator.length > 0 && !this.isAllDimensionsNull(item.indicator)
      ))
    }

    return (
      <div className="indicator-selection" id="indicator-selection">
        <div className="slider-btn left" onClick={this.handlePrev}><i className="dmpicon-return"/></div>
        <div className="slider-btn right" onClick={this.handleNext}><i className="dmpicon-return"/></div>
        <Tabs activeKey={this.state.tabsActiveKey} className="page-tab" id="top-tab" onSelect={this.handleSelectTab}>
          {
            _indicators && _indicators.map((category, categoryIndex) =>
              <Tab key={`tab-${categoryIndex}`} eventKey={categoryIndex} title={category.name} />)
          }
        </Tabs>
        <div className="main-container" >
          <div className="right">
            {this.props.children}
          </div>
          <div className="left">
            <div className="tab-content" key={this.state.key}>
              {
                _indicators && _indicators.length > 0 ? _indicators.map((category, categoryIndex) => (
                  <div role="tabpanel"
                    key={`indicator-wapper-${categoryIndex}`}
                    className="indicator-wapper"
                    style={{ display: this.state.tabsActiveKey === categoryIndex ? '' : 'none' }}
                  >
                    {
                      !this.isAllDimensionsNull(category.indicator) && Array.isArray(category.indicator) ? category.indicator.map((indicator, indicatorIndex) => {
                        if (!Array.isArray(indicator.dimension) || indicator.dimension.length <= 0) {
                          return null
                        }
                        const disabled = !!indicator.odps_field && !!indicator.odps_table
                        return (
                          <div key={`indicator-${indicatorIndex}`} className="indicators">
                            <label key={`label-${indicatorIndex}`} aria-name={indicator.name}>{indicator.name}：</label>
                            {
                              Array.isArray(indicator.dimension) && indicator.dimension.length > 0 && indicator.dimension.map((indicatorValue, i) => {
                                const selected = selectedIndicators.indexOf(indicatorValue.id) !== -1
                                return (
                                  <SelectionButton
                                    selected={selected}
                                    disabled={!disabled}
                                    key={`button${i}`}
                                    onClick={this.handleSelectIndicator.bind(this, indicator, indicatorValue)}
                                  >
                                    {indicatorValue.name}
                                  </SelectionButton>
                                )
                              })
                            }
                          </div>
                        )
                      }) : '暂无数据'
                    }
                  </div>
                )) : '暂无数据'
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  componentDidMount() {
    this._initSilderBtn()
  }

  componentDidUpdate() {
    this._initSilderBtn()
  }

  componentWillReceiveProps(nextProps) {
    const { spread } = this.props
    if (spread !== nextProps.spread) {
      // 折叠过程
      this._initSilderBtn()
    }
  }

  handleSelectTab = (key) => {
    this.setState({
      tabsActiveKey: key
    })
  };

  handlePrev = () => {
    // <- 为 0 停止
    if (this.TAB_ACTIVE > 0) {
      --this.TAB_ACTIVE
      this._slider()
    }
  };

  handleNext = () => {
    // ->  当所有的后面内容都显示的情形下。则停止
    //  marginLeft + 有效width < page-top 的宽度
    const max = $('#top-tab').find('li').length - 1
    let content_width = 0
    const marginLeft = +$('#top-tab').find('.nav-tabs').css('marginLeft').replace('px', '')

    $('#top-tab').find('li').each(function () {
      content_width += $(this).width();
    })
    // 如果当前的 有效宽度 + marginLeft > top-tab 的宽度
    if (marginLeft + content_width > $('#top-tab').width()) {
      this.TAB_ACTIVE > max ? max : ++this.TAB_ACTIVE
      this._slider();
    }
  };

  handleSelectIndicator = (indicator, indicatorValue) => {
    const _indicator = {
      ...indicator,
      indicator_id: indicator.id,
      indicator_name: indicator.name,
      dimensions: indicator.dimension.map(dimension => ({
        dimension_id: dimension.id,
        dimension_name: dimension.name
      }))
    }
    const _indicatorValue = {
      dimension_id: indicatorValue.id,
      dimension_name: indicatorValue.name
    }

    this.props.handleSelectIndicator(_indicator, _indicatorValue)
  };

  _initSilderBtn = () => {
    const page_tab_width = $('#top-tab').width();
    let content_width = 0
    $('#top-tab').find('li').each(function () {
      content_width += $(this).width();
    })

    if (content_width <= page_tab_width) {
      $('#indicator-selection').find('.slider-btn').hide();
    } else {
      $('#indicator-selection').find('.slider-btn.right').show();
      const marginLeft = +$('#top-tab').find('.nav-tabs').css('marginLeft').replace('px', '')
      if (marginLeft < 0) {
        $('#indicator-selection').find('.slider-btn.left').show();
      }
    }
  };

  _slider = () => {
    let marginLeft = 0
    $('#top-tab').find(`li:lt(${this.TAB_ACTIVE})`).each(function () {
      marginLeft += $(this).width();
    })
    $('#top-tab').find('.nav-tabs').css('marginLeft', -marginLeft)

    this._initSilderBtn();
  };

  // 所有的indicators 都为空
  isAllDimensionsNull = (indicators) => {
    // 默认全为空
    let bool = true
    if (Array.isArray(indicators)) {
      for (let i = indicators.length - 1; i >= 0; i--) {
        if (Array.isArray(indicators[i].dimension) && indicators[i].dimension.length > 0) {
          bool = false
          break
        }
      }
    }
    return bool
  };

  isAllIndicatorDisabled = indicators => Array.isArray(indicators) && indicators.some(indicator => (
    Array.isArray(indicator.dimension) && indicator.odps_field && indicator.odps_table
  ));

  TAB_ACTIVE = 0;  // TAB 
}

export default IndicatorSelection;
