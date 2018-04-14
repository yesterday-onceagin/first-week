import React from 'react';
import YSeries from './YSeries';

class ZSeries extends YSeries {
  render() {
    return <YSeries {...this.props} field="z" />
  }
}

export default ZSeries
