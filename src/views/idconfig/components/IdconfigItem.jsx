import React from 'react'
import PropTypes from 'prop-types'

import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';

import getOverFlowText from '../../../helpers/getOverFlowText';

class IdconfigItem extends React.Component {
  static propTypes = {
    item: PropTypes.object,
    onGoEditMainTable: PropTypes.func,
    onGoEditIndicator: PropTypes.func
  };

  render() {
    const {
      className,
      item,
      onGoEdit
    } = this.props;

    return (
      <div className={`idconfig-item  ${className || ''}`} style={{ ...this.STYLE_SHEET.container, paddingRight: '25px', marginBottom: '25px' }}>
        <div className="outer-box" style={this.STYLE_SHEET.outerBox} onClick={onGoEdit}>
          <div className="idconfig-item-box" style={this.STYLE_SHEET.itemBox}>
            <div className="idconfig-item-main" style={this.STYLE_SHEET.itemMain}>
              <div className="template-name" style={this.STYLE_SHEET.itemName}>
                {item && this.renderName()}
              </div>
              <div className="idconfig-num" style={this.STYLE_SHEET.itemNum}>
                <span>
                  已配置：{item && item.indicator_configured}
                </span>
                <span style={{ paddingLeft: '20px' }}>
                  未配置：{item && (item.indicator_total - item.indicator_configured)}
                </span>
              </div>
            </div>
            <div className="idconfig-item-des" style={this.STYLE_SHEET.itemDes}>
              {item && this.renderDes()}
            </div>
            <div className="item-left-border" style={this.STYLE_SHEET.leftBorder}></div>
          </div>
        </div>
      </div>
    );
  }

  // 渲染名称
  renderName() {
    const item = this.props.item;

    const showText = getOverFlowText(item.name, 8);

    if (showText.isOverflow) {
      return (
        <OverlayTrigger trigger="hover"
          placement="top"
          overlay={(<Tooltip>{item.name}</Tooltip>)}>
          <div style={this.STYLE_SHEET.textLimit}>{showText.text}</div>
        </OverlayTrigger>
      );
    }
    return (
      <div style={this.STYLE_SHEET.textLimit}>{item.name}</div>
    );
  }

  // 渲染描述
  renderDes() {
    const item = this.props.item;

    const showText = getOverFlowText(item.description, 30);

    if (showText.isOverflow) {
      return (
        <OverlayTrigger trigger="hover"
          placement="top"
          overlay={(<Tooltip>{item.description}</Tooltip>)}>
          <div style={this.STYLE_SHEET.textLimitMulti}>{showText.text}</div>
        </OverlayTrigger>
      );
    }
    return (
      <div style={this.STYLE_SHEET.textLimitMulti}>{item.description}</div>
    );
  }

  // 除 hover、theme以外的样式
  STYLE_SHEET = {
    container: {
      width: '20%',
      height: '120px',
    },
    outerBox: {
      width: '100%',
      height: '100%',
      transition: 'background .3s',
      position: 'relative',
      borderWidth: '1px',
      borderStyle: 'solid'
    },
    itemBox: {
      width: '100%',
      height: '100%',
      position: 'relative',
      paddingLeft: '15px'
    },
    itemMain: {
      width: '100%',
      height: '70px',
      padding: '15px 12px 0 0',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      position: 'relative'
    },
    itemName: {
      paddingBottom: '8px',
      height: '30px',
      lineHeight: '22px',
      fontSize: '16px'
    },
    textLimit: {
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    itemNum: {
      height: '16px',
      lineHeight: '16px',
      fontSize: '12px'
    },
    itemActions: {
      position: 'absolute',
      right: '13px',
      top: '11px'
    },
    itemActBtn: {
      display: 'block',
      width: '70px',
      height: '22px',
      lineHeight: '22px',
      fontSize: '12px',
      borderRadius: '22px',
      border: '0 none',
      outline: 'none'
    },
    itemDes: {
      width: '100%',
      height: '40px',
      padding: '8px 15px 0 0',
      fontSize: '12px',
      lineHeight: '16px'
    },
    textLimitMulti: {
      width: '100%',
      height: '100%',
      wordWrap: 'break-word',
      wordBreak: 'break-all',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical'
    },
    leftBorder: {
      width: '2px',
      height: '120px',
      position: 'absolute',
      left: '-1px',
      top: '-1px',
      zIndex: 2
    }
  };
}

export default IdconfigItem;
