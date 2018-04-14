import PropTypes from 'prop-types';
import React from 'react';
import Popover from 'react-bootstrap-myui/lib/Popover';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';

class IconButton extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.any,
    onClick: PropTypes.func,
    iconClass: PropTypes.string,
    disabled: PropTypes.bool,
    isNavBar: PropTypes.bool,
    hasSubIcon: PropTypes.bool,
    subs: PropTypes.array,
    subStyle: PropTypes.string
  };

  static defaultProps = {
    onClick: () => { },
    iconClass: 'dmpicon-',
    disabled: false,
    isNavBar: false,
    hasSubIcon: false
  };

  constructor(props) {
    super(props);
    this.state = {
      iconClass: props.iconClass,
      className: props.className,
      disabled: props.disabled
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps) {
      this.setState({
        iconClass: nextProps.iconClass,
        className: nextProps.className,
        disabled: nextProps.disabled
      })
    }
  }

  render() {
    // popover 菜单
    const {
      children,
      subs,
      isNavBar,
      hasSubIcon,
      style
    } = this.props;

    const {
      iconClass,
      className,
      disabled
    } = this.state;

    return subs ? (
      <OverlayTrigger trigger="click" rootClose placement="bottom" overlay={this.renderMenu()}>
        <button type="button"
          ref={(node) => { this.subDmpIconButton = node }}
          className={`${isNavBar ? 'nav-bar-icon-btn-dmp' : 'icon-btn-dmp'}  ${className || ''}`}
          disabled={disabled}
          style={style}
        >
          <div className="icon-btn-box"
            style={{
              ...this.STYLE_SHEET.box,
              paddingRight: `${hasSubIcon ? 16 : 0}px`,
              position: 'relative'
            }}
          >
            <i className={`btn-icon ${iconClass}`} style={this.STYLE_SHEET.icon} />
            {
              children ? (
                <span className="btn-text" style={this.STYLE_SHEET.text}>
                  {children}
                </span>
              ) : null
            }
            {hasSubIcon && <i className="spread-icon dmpicon-arrow-down" style={{ right: '0px' }} />}
          </div>
        </button>
      </OverlayTrigger>
    ) : (
      <button type="button"
        ref={(node) => { this.dmpIconButton = node }}
        className={`${isNavBar ? 'nav-bar-icon-btn-dmp' : 'icon-btn-dmp'}  ${className || ''}`}
        disabled={disabled}
        style={style}
        onClick={this.handleClickEvent.bind(this)}
      >
        <div className="icon-btn-box" style={this.STYLE_SHEET.box}>
          <i className={`btn-icon ${iconClass}`} style={this.STYLE_SHEET.icon} />
          {
            children ? (
              <span className="btn-text" style={this.STYLE_SHEET.text}>
                {children}
              </span>
            ) : null
          }
        </div>
      </button>
    );
  }

  renderMenu() {
    const {
      subs,
      subStyle
    } = this.props;

    return (
      <Popover className={subStyle}>
        {
          subs.map((sub, index) => (
            <div className="sub-btn"
              onClick={this.handleSubClickEvent.bind(this, sub.func)}
              key={`icon-button-sub-${sub.text}-${index}`}
            >
              {sub.text}
            </div>
          ))
        }
      </Popover>
    )
  }

  handleSubClickEvent(func, e) {
    this.subDmpIconButton.blur();
    if (typeof func === 'function') {
      func(e);
    }
  }

  handleClickEvent(e) {
    this.dmpIconButton.blur();
    if (typeof this.props.onClick === 'function') {
      this.props.onClick(e);
    }
  }

  STYLE_SHEET = {
    box: {
      height: '24px',
      lineHeight: '24px',
      verticalAlign: 'middle',
      transition: 'all .15s cubic-bezier(0.07, 1.01, 0.7, 0.95)',
      borderRadius: '24px'
    },
    icon: {
      fontSize: '17px',
      lineHeight: '22px',
      verticalAlign: 'middle',
    },
    text: {
      lineHeight: '22px',
      fontSize: '14px',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      display: 'inline-block',
      height: '22px',
      transition: 'all .15s cubic-bezier(0.07, 1.01, 0.7, 0.95)'
    }
  }
}

export default IconButton
