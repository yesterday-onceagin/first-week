import React from 'react'
import PropTypes from 'prop-types'

import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';

import getOverFlowText from '../../../helpers/getOverFlowText';

class IndicatorItem extends React.Component {
  static propTypes = {
    onDel: PropTypes.func,
    onEdit: PropTypes.func,
    onEditBase: PropTypes.func,
    onAdd: PropTypes.func,
    item: PropTypes.object,
    isAdd: PropTypes.bool,
    editable: PropTypes.bool,
    className: PropTypes.string
  };

  static defaultProps = {
    editable: true
  };

  render() {
    const { className, item, isAdd, onEditBase, onEdit, onAdd, onDel, style, editable } = this.props;

    return (
      <div className={`indicator-item  ${className || ''}`} style={{
        ...style,
        ...this.STYLE_SHEET.container,
        paddingRight: '25px',
        marginBottom: '25px'
      }}>
        <div className="outer-box" style={this.STYLE_SHEET.outerBox}>
          {
            isAdd ? (
              <div className="indicator-add-box" style={this.STYLE_SHEET.add} onClick={onAdd}>
                <i className="dmpicon-add" style={this.STYLE_SHEET.addIcon} />
                <div className="indicator-add-text" style={this.STYLE_SHEET.addText}>新增指标模版</div>
              </div>
            ) : (
              <div className="indicator-item-box" style={this.STYLE_SHEET.itemBox} onClick={onEdit}>
                <div className="indicator-item-main" style={this.STYLE_SHEET.itemMain}>
                  <div className="template-name" style={this.STYLE_SHEET.itemName}>
                    {item && this.renderName()}
                    {
                      editable && <div className="indicator-actions" style={this.STYLE_SHEET.itemActions}>
                        <i className="dmpicon-edit"
                          style={this.STYLE_SHEET.itemBtn}
                          onClick={onEditBase}
                        />
                        <i className="dmpicon-del"
                          style={this.STYLE_SHEET.itemBtn}
                          onClick={onDel}
                        />
                      </div>
                    }
                  </div>
                  <div className="indicator-num" style={this.STYLE_SHEET.itemNum}>
                      指标总数：{item && item.indicator_total}
                  </div>
                </div>
                <div className="indicator-item-des" style={this.STYLE_SHEET.itemDes}>
                  {item && this.renderDes()}
                </div>
                <div className="item-left-border" style={this.STYLE_SHEET.leftBorder} />
              </div>
            )
          }
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
        <OverlayTrigger
          trigger="hover"
          placement="top"
          overlay={(<Tooltip>{item.name}</Tooltip>)}
        >
          <div style={this.STYLE_SHEET.textLimit}>{showText.text}</div>
        </OverlayTrigger>
      );
    }
    return (<div style={this.STYLE_SHEET.textLimit}>{item.name}</div>)
  }

  // 渲染描述
  renderDes() {
    const item = this.props.item;

    const showText = getOverFlowText(item.description, 30);

    if (showText.isOverflow) {
      return (
        <OverlayTrigger
          trigger="hover"
          placement="top"
          overlay={(<Tooltip>{item.description}</Tooltip>)}
        >
          <div style={this.STYLE_SHEET.textLimitMulti}>{showText.text}</div>
        </OverlayTrigger>
      );
    }
    return (<div style={this.STYLE_SHEET.textLimitMulti}>{item.description}</div>);
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
    add: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      transition: 'color .3s',
      cursor: 'pointer'
    },
    addIcon: {
      fontSize: '28px',
      display: 'block'
    },
    addText: {
      fontSize: '14px',
      lineHeight: '22px',
      paddingLeft: '14px'
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
      borderBottomStyle: 'solid'
    },
    itemName: {
      padding: '0 82px 8px 0',
      height: '30px',
      lineHeight: '22px',
      fontSize: '16px',
      position: 'relative'
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
      right: 0,
      top: 0
    },
    itemBtn: {
      fontSize: '16px',
      margin: '0 8px',
      cursor: 'pointer'
    },
    itemDes: {
      width: '100%',
      height: '40px',
      padding: '8px 15px 0 0',
      fontSize: '12px',
      lineHeight: '16px',
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

export default IndicatorItem;
