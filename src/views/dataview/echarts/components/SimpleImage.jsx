import React from 'react'
import PropTypes from 'prop-types'

import EmptyStatus from '@components/EmptyStatus'

class SimpleImage extends React.Component {
  static propTypes = {
    layoutOptions: PropTypes.object
  };

  render() {
    const { content, ratioLock } = this._getStyle()
    return (
      <div className="graph-inner-box">
        {content ? this.renderImage({ content, ratioLock }) : this.renderEmpty()}
      </div>
    )
  }

  // 渲染图片（使用backgroundImage的方式加载）
  renderImage({ content, ratioLock }) {
    // 图片样式
    const imageStyle = {
      width: '100%',
      height: '100%',
      backgroundImage: `url(${content})`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      // 锁定比例时使用contain的方式填充背景图
      backgroundSize: ratioLock ? 'contain' : '100% 100%'
    }
    return (
      <div className="dmp-chart-simple-image" style={{ width: '100%', height: '100%' }}>
        <div style={imageStyle} className="img"/>
      </div>
    )
  }

  // 渲染空状态
  renderEmpty() {
    return <EmptyStatus icon="dmpicon-picture" text="请在右侧上传图片" iconSize="36px" textSize="12px" />
  }

  _getStyle() {
    const { layoutOptions } = this.props

    let content = ''
    let ratioLock = true

    if (layoutOptions && layoutOptions.image) {
      content = layoutOptions.image.url || ''
      ratioLock = !!layoutOptions.image.ratioLock
    }
    return {
      content,
      ratioLock
    }
  }
}

export default SimpleImage
