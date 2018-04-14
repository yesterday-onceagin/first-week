import React from 'react'

import NumberValue from './NumberValue'

class NumberSuffix extends NumberValue {
  render() {
    return <NumberValue {...this.props} field="numberSuffix" noStyle />
  }
}

export default NumberSuffix
