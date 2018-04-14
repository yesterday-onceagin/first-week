import React from 'react'
import PropTypes from 'prop-types'
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Popover from 'react-bootstrap-myui/lib/Popover';
import classnames from 'classnames';
import checkChartType from '../../../helpers/checkChartType';
import { THROUGH_CHART_TYPE } from '../constants/incOption'

import './chart-type-view.less';

class ChartTypeView extends React.Component {
  static propTypes = {
    select_code: PropTypes.string,
    data: PropTypes.array,
    select_data: PropTypes.array,
    onSelectType: PropTypes.func,
    ruleData: PropTypes.object
  };

  constructor(props) {
    super(props)
    this.state = {
      select_code: props.select_code
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      select_code: nextProps.select_code
    })
  }

  render() {
    const { select_code } = this.state
    const { data, select_data, through, switchingDataSet } = this.props
    return (
      <div>
        <ul className="chart-diagramChooser">
          {Array.isArray(data) && data.map((item, key) => {
            let _disabled = this._isValidRule(item.rule)
            if (through && _disabled) {
              _disabled = THROUGH_CHART_TYPE.indexOf(item.code) > -1
            }
            const styleClass = classnames('diagram-chooser-elem', {
              disabled: !_disabled,
              active: select_code && item.code === select_code,
              switching: select_code && item.code === select_code && switchingDataSet
            })

            const iconClass = classnames(`chart-type-icon ${item.icon}`, {
              disabled: item.code === select_code && switchingDataSet ? false : !_disabled
            })

            const popoverHoverFocus = item => (
              <Popover className="popover-chart-type" id="popover-chart-type">
                <p>{item.name}</p>
                <p>{item.description}</p>
              </Popover>
            );

            return <OverlayTrigger key={key} trigger={['hover']} placement="left" overlay={popoverHoverFocus(item)}>
              <li onClick={this.handleSelect.bind(this, item, !_disabled)}>
                <a href="javascript:;" className={styleClass}>
                  <i className={iconClass} />
                </a>
              </li>
            </OverlayTrigger>
          })
          }
        </ul>
        <ul className="chart-diagramChooser selector">
          {Array.isArray(select_data) && select_data.map((item, key) => {
            const _disabled = through ? false : this._isValidRule(item.rule)
            const styleClass = classnames('diagram-chooser-elem', {
              disabled: !_disabled,
              active: select_code && item.code === select_code,
              switching: select_code && item.code === select_code && switchingDataSet
            })
            const iconClass = classnames(`chart-type-icon ${item.icon}`, {
              disabled: item.code === select_code && switchingDataSet ? false : !_disabled
            })

            const popoverHoverFocus = _item => (
              <Popover className="popover-chart-type" id="popover-chart-type">
                <p>{_item.name}</p>
                <p>{_item.description}</p>
              </Popover>
            );

            return <OverlayTrigger key={key} trigger={['hover']} placement="left" overlay={popoverHoverFocus(item)}>
              <li onClick={this.handleSelect.bind(this, item, !_disabled)}>
                <a href="javascript:;" className={styleClass}>
                  <i className={iconClass} />
                </a>
              </li>
            </OverlayTrigger>
          })
          }
        </ul>
      </div>)
  }

  handleSelect(item, _disabled) {
    const { onSelectType, switchingDataSet } = this.props

    // 当禁用状态 或者 是处于 更改数据集的状态
    if (_disabled || switchingDataSet) {
      return false;
    }

    this.setState({
      select_code: item.code
    }, () => {
      onSelectType && onSelectType(item, true)
    })
  }

  _isValidRule(rules) {
    /*dim: {max: "0", min: "0"}
    value: {max: "1", min: "1"}*/
    const { ruleData, switchingDataSet } = this.props
    return !ruleData || switchingDataSet ? false : checkChartType(rules, ruleData)
  }
}

export default ChartTypeView;
