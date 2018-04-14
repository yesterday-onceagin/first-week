import React from 'react'
import PropTypes from 'prop-types'

import EmptyStatus from '../../../../components/EmptyStatus'

class SimpleText extends React.Component {
  static propTypes = {
    layoutOptions: PropTypes.object
  };

  render() {
    const { style, content } = this._getStyle()

    return (
      <div className="graph-inner-box">
        {
          content ? (<div style={style} dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />)
            : (<EmptyStatus icon="dmpicon-text" text="请在右侧输入文本" iconSize="36px" textSize="12px" />)
        }
      </div>
    )
  }

  _getStyle() {
    const { layoutOptions } = this.props

    let style = {}
    let content = ''

    if (layoutOptions && layoutOptions.text) {
      const fontStyle = layoutOptions.text.fontStyle ? layoutOptions.text.fontStyle.split(',') : []
      style = {
        textDecoration: fontStyle.indexOf('underline') > -1 ? 'underline' : 'none',
        fontWeight: fontStyle.indexOf('bold') > -1 ? 'bold' : 'normal',
        fontStyle: fontStyle.indexOf('italic') > -1 ? 'italic' : 'normal',
        fontSize: `${layoutOptions.text.fontSize}px`,
        color: layoutOptions.text.color,
        lineHeight: `${layoutOptions.text.lineHeight}px`,
        textAlign: layoutOptions.text.textAlign,
        textAlignLast: layoutOptions.text.textAlign
      }
      content = layoutOptions.text.content || ''
    }
    return {
      style,
      content
    }
  }
}

export default SimpleText
