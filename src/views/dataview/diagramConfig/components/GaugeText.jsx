import React from 'react'

import NumberValue from './NumberValue'

class GaugeText extends NumberValue {
  render() {
    return <NumberValue {...this.props} field="gaugeText" noStyle={['underline']}/>
  }
}

export default GaugeText
