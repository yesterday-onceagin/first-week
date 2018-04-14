import React from 'react'
import PropTypes from 'prop-types'

import classnames from 'classnames'

class NavTabBar extends React.PureComponent {
  static propTypes = {
    navs: PropTypes.array,
    currId: PropTypes.string.isRequired,
    onChangeNav: PropTypes.func.isRequired
  };

  render() {
    const { navs, currId, onChangeNav } = this.props
    return (
      <div className="dmp-mobile-bottom-nav-tab-bar" style={this.STYLE_SHEET.container}>
        {
          navs.map((nav) => {
            const navItemClass = classnames('dmp-mobile-bottom-nav-tab-item', {
              active: nav.id === currId
            })

            return (
              <div key={`dmp-mobile-bottom-nav-tab-item-${nav.id}`}
                className={navItemClass}
                style={this.STYLE_SHEET.navItem}
                onTouchEnd={() => { onChangeNav(nav.id) }}
              >
                <i className={nav.icon} style={this.STYLE_SHEET.navItemIcon}/>
                {nav.name}
              </div>
            )
          })
        }
      </div>
    )
  }

  STYLE_SHEET = {
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: '50px',
      width: '100%',
      fontSize: '16px',
      display: 'flex',
      flexDirection: 'row'
    },
    navItem: {
      flex: '1 1 0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '12px',
      lineHeight: 1,
      paddingBottom: '4px',
      position: 'relative'
    },
    navItemIcon: {
      fontSize: '20px',
      padding: '2px 0 6px'
    }
  };
}

export default NavTabBar;
