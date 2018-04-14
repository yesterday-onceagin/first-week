import React from 'react'
import PropTypes from 'prop-types'

import classnames from 'classnames'
import _ from 'lodash'
import { FONT_STYLES } from '../../constants/fontOptions'

class FontStyle extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    onChange: PropTypes.func
  };

  static defaultProps = {
    data: {
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none'
    }
  };

  constructor(props) {
    super(props)

    const { data } = props
    this.state = {
      fontWeight: (data && data.fontWeight) || 'normal',
      fontStyle: (data && data.fontStyle) || 'normal',
      textDecoration: (data && data.textDecoration) || 'none'
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      const { data } = nextProps
      this.setState({
        fontWeight: (data && data.fontWeight) || 'normal',
        fontStyle: (data && data.fontStyle) || 'normal',
        textDecoration: (data && data.textDecoration) || 'none'
      })
    }
  }

  render() {
    const { fontWeight, fontStyle, textDecoration } = this.state

    return (
      <div>
        {
          FONT_STYLES.map((item) => {
            const active = (item.key === 'bold' && fontWeight === item.key) || (item.key === 'italic' && fontStyle === item.key) || (item.key === 'underline' && textDecoration === item.key)
            const _clsName = classnames('diagram-title-font-style-icon', {
              [item.key]: true,
              active
            })

            return (
              <i key={`diagram-title-font-style-${item.key}`}
                title={item.name}
                className={_clsName}
                onClick={this.handleChangeStyle.bind(this, item.key, !active)}
              >
                {item.icon}
              </i>
            )
          })
        }
      </div>
    )
  }

  handleChangeStyle(key, active) {
    this.setState((prevState) => {
      if (key === 'bold') {
        return {
          ...prevState,
          fontWeight: active ? key : 'normal'
        }
      }

      if (key === 'italic') {
        return {
          ...prevState,
          fontStyle: active ? key : 'normal'
        }
      }

      if (key === 'underline') {
        return {
          ...prevState,
          textDecoration: active ? key : 'none'
        }
      }
    }, () => {
      this.props.onChange(this.state)
    })
  }
}

export default FontStyle
