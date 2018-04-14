import React from 'react'
import PropTypes from 'prop-types'

import ListGroup from 'react-bootstrap-myui/lib/ListGroup';
import ListGroupItem from 'react-bootstrap-myui/lib/ListGroupItem';
import LinkContainer from 'react-router-bootstrap/lib/LinkContainer';

import { baseAlias } from '../../../config';

import classnames from 'classnames';

class SideMenuGroup extends React.Component {
  static propTypes = {
    // [{name: string, url: string, icon: string, active: bool}]
    menus: PropTypes.object,
    // router的location，用来判断页面路由是否已发生了变化
    location: PropTypes.object,
    // 通知nav菜单变化
    onChange: PropTypes.func,
    // 菜单组件是否展开/折叠
    menuSpread: PropTypes.bool,
    onMenuSpread: PropTypes.func,
    onCloseSideMenu: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      spread: props.menus.active
    }
  }

  componentWillUpdate(nextProps, nextState) {
    // 当菜单由收缩变为展开时，更新自身展开状态
    if (!this.props.menuSpread && nextProps.menuSpread) {
      // 自身状态由收起变为展开时，进行展开，否则以menu active为准
      if (!this.state.spread && nextState.spread) {
        nextState.spread = true;
      } else {
        nextState.spread = nextProps.forceSpread ? nextState.spread : nextProps.menus.active;
      }
    }

    // 当菜单收缩状态保持在展开的情况时
    const keepSpread = this.props.menuSpread && nextProps.menuSpread;
    if (keepSpread && !this.props.menus.active && nextProps.menus.active) {
      // 根据menu active的变化更新自身状态
      nextState.spread = nextProps.menus.active;
    }
  }

  render() {
    const { menus, menuSpread } = this.props;
    const { spread } = this.state;

    const hasSub = menus.sub && menus.sub.length > 0;
    const menuSpreadAndHasSub = menuSpread && hasSub;

    const panelClass = classnames('panel', { 'spread-off': !menuSpread })

    const groupTitleClass = classnames('group-title', {
      'spread-list': menuSpreadAndHasSub && spread,
      active: menus.active
    })

    let menuUrl = menus.link || '';

    if (menuUrl) {
      menuUrl = `${baseAlias}${menuUrl}`;
    } else {
      menuUrl = 'javascript:;';
    }

    return (
      <div className={panelClass}>
        <ListGroup fill="true" key={`list${menus.code}`}>
          {
            !hasSub && menus.link ? (
              <LinkContainer
                to={menuUrl}
                target={menus.target || null}
                key={`group-title-${menus.id}`}
                onClick={this.handleChangeNavPath.bind(this, menus.application_id, menus.id)}
              >
                <ListGroupItem
                  className={groupTitleClass}
                  onClick={this.handleSpreadGroup.bind(this)}
                >
                  <i className={`group-title-icon  ${menus.icon}`} />
                  {menuSpread ? menus.name : null}
                  {menuSpreadAndHasSub ? <i className="spread-icon dmpicon-arrow-down" /> : null}
                </ListGroupItem>
              </LinkContainer>
            ) : (
              <ListGroupItem
                className={groupTitleClass}
                onClick={this.handleSpreadGroup.bind(this)}
              >
                <i className={`group-title-icon  ${menus.icon}`} />
                {menuSpread ? menus.name : null}
                {menuSpreadAndHasSub ? <i className="spread-icon dmpicon-arrow-down" /> : null}
              </ListGroupItem>
            )
          }
          {this.renderMenuItems()}
        </ListGroup>
      </div>
    )
  }

  renderMenuItems() {
    const { menus, menuSpread } = this.props;
    const { spread } = this.state;
    const hasSub = menus.sub && menus.sub.length > 0;
    const isSpread = menuSpread && spread;
    // 获得展开项高度
    const maxBoxHeight = hasSub ? menus.sub.length * 40 : 0;
    return (
      <div style={{
        overflow: 'hidden',
        width: '100%',
        height: `${isSpread ? maxBoxHeight : 0}px`,
        transition: 'height .2s ease-out'
      }}>
        {
          isSpread ? (
            hasSub && menus.sub.map((item, index) => {
              let link = item.link || '';

              if (link) {
                link = `${baseAlias}${link}`;
              } else {
                link = 'javascript:;'
              }

              const activeClasses = item.active ? ' active' : '';

              return (
                <LinkContainer
                  to={link}
                  target={item.target || null}
                  key={`link-container-${index}`}
                  onClick={this.handleChangeNavPath.bind(this, item.application_id, item.parent_id)}
                >
                  <ListGroupItem
                    key={`list-item-${index}`}
                    className={`list-group-item-sub ${activeClasses}`}
                  >
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      {
                        menuSpread ? (
                          <span style={this.STYLE_SHEET.textLimit}>
                            {item.name}
                          </span>
                        ) : null
                      }
                    </div>
                  </ListGroupItem>
                </LinkContainer>
              );
            })
          ) : null
        }
      </div>
    )
  }

  // 展开菜单
  handleSpreadGroup() {
    const { menus, menuSpread, onMenuSpread } = this.props;
    const hasSub = menus.sub && menus.sub.length > 0;

    if (!hasSub && menuSpread) {
      return;
    }

    if (!menuSpread) {
      onMenuSpread();
    }

    this.setState({
      spread: menuSpread ? !this.state.spread : true
    });
  }

  // 切换菜单
  handleChangeNavPath(moduleId) {
    const { onCloseSideMenu, onChange } = this.props
    if (typeof onChange === 'function') {
      onChange(moduleId);
      if (typeof onCloseSideMenu === 'function') {
        onCloseSideMenu()
      }
    }
  }

  STYLE_SHEET = {
    textLimit: {
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      width: '100%',
      display: 'block',
      height: '100%',
      paddingRight: '10px'
    }
  }
}

export default SideMenuGroup
