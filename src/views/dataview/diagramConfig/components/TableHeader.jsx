import React from 'react'
import PropTypes from 'prop-types'

import Title from './Title';
import Background from './Background';

import _ from 'lodash';

class TableHeader extends Title {
  render() {
    return <div>
      <Title field="tableHeader" {...this.props}/>
      <Background field="tableHeader" {...this.props}/>
    </div>
  }
}

export default TableHeader
