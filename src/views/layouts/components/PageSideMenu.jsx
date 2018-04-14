import React from 'react'
import PropTypes from 'prop-types'

import SideMenuGroup from './SideMenuGroup';

import isEqual from 'lodash/isEqual';

class PageSideMenu extends React.Component {
  static propTypes = {
    // [{name: string, url: string, icon: string, active: bool}]
    menus: PropTypes.array,
    // router中的location，用来判断页面路由是否已发生了变化
    location: PropTypes.object,
    // 通知nav菜单变化
    onChange: PropTypes.func,
    onToggleSideMenu: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      spread: false,
      forceSpread: false,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { menus, location } = this.props
    return menus !== nextProps.menus || location.pathname !== nextProps.location.pathname || !isEqual(this.state, nextState);
  }

  render() {
    const { menus, location } = this.props;
    const { spread, forceSpread } = this.state;

    return (
      <div style={{
        width: spread ? '200px' : '50px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <div style={this.STYLE_SHEETS.spreadBtn} onClick={this.handleToggleMenuSpread.bind(this)}>
          <i className="dmpicon-menu" style={{
            ...this.STYLE_SHEETS.spreadIcon,
            transform: !spread ? 'rotateZ(-90deg)' : 'none'
          }}/>
        </div>
        <div className="side-menu-body" style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ height: 'auto' }}>
            {
              menus && menus.length > 0 && menus.map((menu, index) => (
                <SideMenuGroup
                  key={`side-menu-group-${index}`}
                  menus={menu}
                  menuSpread={spread}
                  forceSpread={forceSpread}
                  onMenuSpread={this.handleOnMenuSpread.bind(this)}
                  location={location}
                  onChange={this.props.onChange}
                />
              ))
            }
          </div>
        </div>
      </div>
    )
  }

  // 展开菜单
  handleOnMenuSpread() {
    this.setState({
      spread: true,
      forceSpread: true
    });
    // 通知到相应的页面
    this.props.onToggleSideMenu(true);
  }

  // 切换菜单展开/收缩
  handleToggleMenuSpread() {
    const currentSpread = this.state.spread;

    this.setState({
      spread: !currentSpread,
      forceSpread: false
    });
    // 展开和收缩的动作需要下发到对应的页面
    this.props.onToggleSideMenu(!currentSpread)
  }

  STYLE_SHEETS = {
    spreadBtn: {
      width: '100%',
      height: 50,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    spreadIcon: {
      color: '#698EBB',
      fontSize: '20px',
      transformOrigin: '50% 50%',
      transition: 'transform .3s'
    }
  };
}

export default PageSideMenu
