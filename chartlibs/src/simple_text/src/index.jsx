import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import { Connect, BaseComponents } from 'dmp-chart-sdk'

const _parseFontStyle = function (fontStyle) {
  return {
    fontStyle: fontStyle.fontStyle || 'normal',
    fontWeight: fontStyle.fontWeight || 'normal',
    textDecoration: fontStyle.textDecoration || 'none'
  }
}

class SimpleText extends React.Component {
  static propTypes = {
    config: PropTypes.object,      // 样式配置数据
    layer: PropTypes.object,       // 组件在编辑区的图层信息
    scale: PropTypes.number,       // 组件在编辑区的缩放比例
  }

  shouldComponentUpdate(nextProps) {
    const { scale, layer } = this.props
    if (nextProps.scale !== scale || !_.isEqual(nextProps.layer, layer)) {
      return false
    }
    return true
  }

  render() {
    const { style, content } = this.getStyle()
    return (
      <div className="graph-inner-box">
        {
          content ? (<div style={style} dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />)
            : (<BaseComponents.EmptyTip icon="dmpicon-text" text="请在右侧输入文本" iconSize="36px" textSize="12px" />)
        }
      </div>
    )
  }

  getStyle() {
    const { config } = this.props

    let style = {}
    let content = ''

    if (config && config.text) {
      const fontStyle = _parseFontStyle(config.text.fontStyle)
      style = {
        textDecoration: fontStyle.textDecoration,
        fontWeight: fontStyle.fontWeight,
        fontStyle: fontStyle.fontStyle,
        fontSize: `${config.text.fontSize}px`,
        color: config.text.color,
        lineHeight: `${config.text.lineHeight}px`,
        textAlign: config.text.textAlign,
        textAlignLast: config.text.textAlign
      }
      content = config.text.content || ''
    }
    return {
      style,
      content
    }
  }
}

export default Connect()(SimpleText)
