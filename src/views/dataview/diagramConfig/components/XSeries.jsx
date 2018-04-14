import React from 'react';
import YSeries from './YSeries';

class XSeries extends YSeries {
  render() {
    return <YSeries {...this.props} field="x"/>
  }
}

export default XSeries
