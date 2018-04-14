import React from 'react';
import PropTypes from 'prop-types'
import classnames from 'classnames';
import _ from 'lodash';

import NumberValue from './NumberValue'

import { FONT_ALIGNS } from '../../constants/fontOptions'

class Title extends NumberValue {
  static propTypes = {
    chart: PropTypes.object,
    configInfo: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      field: props.field || 'title',
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
      this.state.field = nextProps.field
    }
  }

  render() {
    const { chart } = this.props
    const { field, data } = this.state
    const isGauge = chart.chart_code === 'gauge' || chart.chart_code === 'split_gauge'
    return (
      <div>
        <NumberValue {...this.props} field={field} noStyle={isGauge ? ['underline'] : false}/>
        {
          !isGauge ? (
            <div className="layout-config-column">
              <span className="layout-config-column-title">对齐</span>
              {
                FONT_ALIGNS.map((item) => {
                  const _clsName = classnames('diagram-title-font-align-icon', {
                    [item.icon]: true,
                    active: item.key === data.textAlign
                  })
                  return (
                    <i key={`diagram-title-font-align-${item.key}`}
                      title={item.name}
                      className={_clsName}
                      onClick={this.handleChangeAlign.bind(this, item.key)}
                    />
                  )
                })
              }
            </div>
          ) : null
        }
      </div>
    )
  }

  handleChangeAlign(value) {
    this.setState(preState => ({
      data: {
        ...preState.data,
        textAlign: value
      }
    }), () => {
      this.props.onChange(this.state.field, 'textAlign', value)
    })
  }
}

export default Title
