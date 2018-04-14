import React from 'react'
import PropTypes from 'prop-types'

import classnames from 'classnames'
import _ from 'lodash'
import { FONT_ALIGNS, TEXT_FONT_ALIGNS } from '../../constants/fontOptions'

class TextAlign extends React.Component {
  static propTypes = {
    data: PropTypes.string,
    onChange: PropTypes.func,
    allow_justify: PropTypes.bool
  }

  constructor(props) {
    super(props)
    this.state = {
      textAlign: props.data || 'left'
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        textAlign: nextProps.data || 'left'
      })
    }
  }

  render() {
    const { textAlign } = this.state
    const aligns = this.props.allow_justify ? TEXT_FONT_ALIGNS : FONT_ALIGNS
    return (
      <div>
        {
          aligns.map((item) => {
            const _clsName = classnames('diagram-title-font-align-icon', {
              [item.icon]: true,
              active: item.key === textAlign
            })
            return (
              <i key={`diagram-title-font-align-${item.key}`}
                title={item.name}
                className={_clsName}
                onClick={this.handleChangeInput.bind(this, item.key)}
              />
            )
          })
        }
      </div>
    )
  }

  // 输入事件
  handleChangeInput(textAlign) {
    this.setState({
      textAlign
    }, () => {
      this.props.onChange(textAlign)
    })
  }
}

export default TextAlign
