import PropTypes from 'prop-types'
import React from 'react'

import Tooltip from 'react-bootstrap-myui/lib/Tooltip'
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger'

import _ from 'lodash'

import defaultCover from '../../../static/images/cover-app-default.png'

class AppItem extends React.Component {
  static propTypes = {
    onDel: PropTypes.func,
    onEdit: PropTypes.func,
    onToggleEnable: PropTypes.func,
    onAdd: PropTypes.func,
    item: PropTypes.object,
    className: PropTypes.string
  };

  render() {
    const { className, item, onEdit, onDel, onToggleEnable, onAdd, style } = this.props
    const containerClass = `application-item  ${className || ''}`

    // 如果传入了onAdd方法 则该项为添加
    if (typeof onAdd === 'function') {
      return (
        <div className={containerClass} style={{ ...this.STYLE_SHEET.container, ...style }}>
          <div className="outer-box" style={this.STYLE_SHEET.outerBox} onClick={onAdd}>
            <div className="application-add-box application-item-box" style={this.STYLE_SHEET.addBox}>
              <i className="dmpicon-add" style={this.STYLE_SHEET.addIcon}/>
              添加应用门户
            </div>
          </div>
        </div>
      )
    }
    // 添加标识移动端应用的icon
    const mobileIcon = _.get(item, 'platform', 'pc') === 'mobile' ? (
      <div className="platform-icon" style={this.STYLE_SHEET.mobileIcon}>
        <i className="dmpicon-mobile"/>
      </div>
    ) : null
    // 应用封面
    const imgUrl = _.get(item, 'icon') ? `${item.icon}?x-oss-process=image/resize,m_fixed,h_38,w_38` : defaultCover
    // 封面样式
    const coverStyle = {
      width: '90px',
      height: '72px',
      backgroundSize: '38px 38px',
      backgroundPosition: 'center 24px',
      backgroundRepeat: 'no-repeat',
      backgroundImage: `url(${imgUrl})`
    }

    return (
      <div className={containerClass} style={{ ...this.STYLE_SHEET.container, ...style }}>
        <div className="outer-box" style={this.STYLE_SHEET.outerBox} onClick={onEdit}>

          <div style={coverStyle}></div>

          {mobileIcon}

          <div className="application-item-box" style={this.STYLE_SHEET.itemBox}>
            <div className="application-name" style={this.STYLE_SHEET.itemName}>
              {
                item && (
                  <div className="name-text" title={item.name} style={this.STYLE_SHEET.textLimit}>
                    {item.name}
                  </div>
                )
              }
              <div className="application-actions" style={this.STYLE_SHEET.itemActions}>
                <span className="application-btn-enable"
                  style={this.STYLE_SHEET.btnEnable}
                  onClick={onToggleEnable}
                >
                  <i className={`icon-checkbox ${!item.enable ? '' : 'checked'}`} style={this.STYLE_SHEET.checkIcon}/>
                  启用
                </span>
                <i className="dmpicon-del" style={this.STYLE_SHEET.btnDel} onClick={onDel} />
              </div>
            </div>
          </div>

          <div className="application-item-des" style={this.STYLE_SHEET.itemDes}>
            {
              item && (
                <OverlayTrigger
                  trigger={['hover']}
                  placement="right"
                  overlay={(<Tooltip style={{ maxWidth: '200px' }}>{item.description}</Tooltip>)}
                >
                  <div>{item.description}</div>
                </OverlayTrigger>
              )
            }
          </div>
        </div>
      </div>
    );
  }

  // 除 hover、theme以外的样式
  STYLE_SHEET = {
    // 最外层容器
    container: {
      width: `${100 / 4}%`,
      height: '106px',
      float: 'left',
      userSelect: 'none',
      paddingRight: '25px',
      marginBottom: '25px',
      position: 'relative',
      zIndex: 1
    },
    // 外层box
    outerBox: {
      width: '100%',
      height: '100%',
      transition: 'background .3s',
      position: 'relative',
    },
    addBox: {
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      transition: 'color .3s',
      flexDirection: 'row',
      fontSize: '14px'
    },
    addIcon: {
      fontSize: '28px',
      paddingRight: '14px'
    },
    mobileIcon: {
      position: 'absolute',
      right: 0,
      top: 0,
      fontSize: '16px',
      fontWeight: 'bold',
      width: '42px',
      height: '42px',
      overflow: 'hidden'
    },
    // item右侧box容器
    itemBox: {
      position: 'absolute',
      left: '90px',
      top: 0,
      right: 0,
      bottom: '34px',
      padding: '25px 20px 0 0'
    },
    // 名称
    itemName: {
      paddingTop: '6px',
      height: '22px',
      lineHeight: 1,
      fontSize: '16px',
      position: 'relative'
    },
    // 操作区容器
    itemActions: {
      position: 'absolute',
      right: 0,
      top: 0
    },
    // 启用/禁用按钮
    btnEnable: {
      fontSize: '12px',
      marginRight: '24px',
      float: 'left',
      lineHeight: '14px',
      padding: '2px 0 0',
      transition: 'color .3s'
    },
    // checkbox图标
    checkIcon: {
      margin: '0 8px 0 0',
      verticalAlign: 'top'
    },
    // 删除按钮
    btnDel: {
      fontSize: '16px',
      cursor: 'pointer',
      float: 'right'
    },
    // 描述区域
    itemDes: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: '72px',
      bottom: 0,
      padding: '0 15px 0 24px',
      fontSize: '12px',
      lineHeight: '16px',
    },
    // 单行溢出
    textLimit: {
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }
}

export default AppItem
