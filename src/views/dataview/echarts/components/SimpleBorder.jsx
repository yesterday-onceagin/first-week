import React from 'react'
import PropTypes from 'prop-types'

import defaultBorderSource from '@static/images/test-border.png'

class SimpleBorder extends React.Component {
  static propTypes = {
    layoutOptions: PropTypes.object
  };

  render() {
    return (
      <div className="graph-inner-box">
        <div className="simple-border-box" style={{
          width: '100%',
          height: '100%',
          borderStyle: 'solid',
          borderWidth: '30px 80px 5px 70px',
          borderImageSource: `url(${defaultBorderSource})`,
          borderImageSlice: '30 80 5 70'
        }}/>
      </div>
    )
  }
}

export default SimpleBorder
