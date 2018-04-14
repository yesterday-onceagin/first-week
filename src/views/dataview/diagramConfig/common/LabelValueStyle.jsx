import React from 'react'
import PropTypes from 'prop-types'

import SliderInput from '../../../../components/SliderInput'
import Input from 'react-bootstrap-myui/lib/Input'
import NumberInput from '../../../../components/NumberInput'

export default class LabelValueStyle extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    labelStyle: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  }
  render() {
    const { labelStyle, onChange, title } = this.props
    return (<div>
      <div className="title">
        {title || '值标签'}
        <span onClick={onChange.bind(this, 'show', !labelStyle.show)}>
          <Input
            type="checkbox"
            checked={labelStyle.show}
            onChange={() => { }}
          />
        </span>
      </div>
      {labelStyle.show && <div className="content">
        <div className="layout-config-column has-suffix">
          <span className="layout-config-column-title sub">字号</span>
          <span className="layout-config-column-suffix">px</span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={12}
            step={1}
            name="lineLabelSize"
            value={labelStyle.size}
            onChange={onChange.bind(this, 'size')}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title sub">间距</span>
          <SliderInput
            minValue={0}
            maxValue={20}
            className="config"
            tipFormatter={v => `${v}px`}
            step={1}
            value={labelStyle.distance}
            onChange={onChange.bind(this, 'distance')}
          />
        </div>
      </div>}
    </div>)
  }
}
