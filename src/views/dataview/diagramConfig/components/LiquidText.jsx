import React from 'react'

import NumberValue from './NumberValue'

class LiquidText extends NumberValue {
  render() {
    return <NumberValue {...this.props} field="liquidText" noStyle={['underline']}/>
  }
}

export default LiquidText
