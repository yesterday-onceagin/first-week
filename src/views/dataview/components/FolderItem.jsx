import React from 'react';
import PropTypes from 'prop-types'

import Popover from 'react-bootstrap-myui/lib/Popover';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import SwitchButton from '../../../components/SwitchButton';
import Button from 'react-bootstrap-myui/lib/Button';

import AuthComponent from '@components/AuthComponent';

import classnames from 'classnames';

// 单例, 防止drag事件中的this 是不同的FolderItem实例带来的bug
let _dragTargetDom = null;
// 不能包含\/:?"<>| 字符
// const _specialChartReq = /[\\\/\:\*\?\"\<\>\|;\#\&]/;

export default class FolderItem extends React.Component {
  static propTypes = {
    active: PropTypes.bool,
    data: PropTypes.object,
    triggerEvent: PropTypes.func,
    index: PropTypes.number,
    isEditName: PropTypes.bool,
    disableMoveToParent: PropTypes.bool,
    fileType: PropTypes.string,
    isPublished: PropTypes.bool
  };

  constructor(props) {
    super(props)
    this.state = {
      isEdit: false,
      inputMessage: '',
      name: props.data.name   //copy name
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.isEdit) {
      this.setState({
        name: nextProps.data.name
      })
    }
  }

  componentDidMount() {
    // 如果是新建后的重命名
    this._focusNameInput()
  }

  componentDidUpdate(prevProps) {
    // 如果是新建文件(夹) 后更新后的编辑
    if (prevProps.isEditName !== this.props.isEditName && this.name_edit_input) {
      this._focusNameInput()
    }
  }

  render() {
    const {
      type,
      selected,
      id,
      cover
    } = this.props.data;

    const {
      active,
      isEditName,
      disableMoveToParent,
      fileType,
      // isPublished,
    } = this.props;

    const {
      isEdit,
      name,
      inputMessage
    } = this.state;

    const itemClass = classnames('folder-item', {
      selected,
      active
    });

    const isFile = type === 'FILE'
    const isMutiScreen = fileType === 'multi-screen'

    const iconClass = isFile ? isMutiScreen ? 'file multi-screen' : 'file' : 'folder';

    const iconCoverStyle = {
      ...this.STYLE_SHEET.iconBlockCover,
    }

    // 如果有封面
    if (isFile && cover) {
      iconCoverStyle.backgroundImage = `url(${cover}?x-oss-process=image/resize,m_mfit,h_108,w_172/crop,h_108,w_172`
    }

    return (
      <AuthComponent pagecode="数据报告" allowevents={['onClick']}>
        <div tabIndex="true"
          draggable={!isEdit && !isEditName}
          className={itemClass}
          ref={(node) => { this.item_root = node }}
          style={this.STYLE_SHEET.itemRoot}
          data-item-id={id}
          data-drag-target={true}
          data-item-type={type}
          onClick={this.handleEvent.bind(this, 'active')}
          onDragStart={this.handleDragStart.bind(this)}
          onDragEnter={this.handleDragEnter.bind(this)}
          onDragOver={this.handleDragOver.bind(this)}
          onDragLeave={this.handleDragLeave.bind(this)}
          onDragEnd={this.handleDragEnd.bind(this)}
          //onDragDrop={this.handleDragDrop.bind(this)}
        >
          {/*icon div*/}
          <AuthComponent pagecode="数据报告" allowevents={['onDoubleClick']}>
            <div
              className={`icon-block ${iconClass}`}
              style={this.STYLE_SHEET.iconBlock}
              onDoubleClick={isFile ? null : this.handleEvent.bind(this, 'open')}
            >
              <div className="cover-container" style={iconCoverStyle} />
              {isFile &&
                <AuthComponent pagecode="数据报告" visiblecode="edit">
                  <div className="hover-mask">
                    <Button bsStyle="primary" onClick={this.handleEvent.bind(this, 'open')}>编辑</Button>
                  </div>
                </AuthComponent>
              }
            </div>
          </AuthComponent>
          <AuthComponent pagecode="数据报告">
            <div className='name-wrapper clearfix' onClick={this.handleRenameClick.bind(this)}>
              <AuthComponent pagecode="数据报告" visiblecode="edit">
                <i className="dmpicon-edit float-l" />
              </AuthComponent>
              {
                isEdit || isEditName ? (
                  <p className="form input-with-check" ref={(node) => { this.rename_container = node }}>
                    <input type="text"
                      ref={(node) => { this.name_edit_input = node }}
                      style={{ textIndent: '4px' }}
                      placeholder="请输入名称"
                      value={name}
                      onChange={this.handleChangeName.bind(this)}
                      onClick={e => e.stopPropagation()}
                      onBlur={this.handleStopEditName.bind(this)}
                      onKeyDown={this.handleEditKeyDown.bind(this)}
                    />
                  </p>
                ) : (
                  <p title={name} className="overflow-ellipsis">
                    {name}
                  </p>
                )
              }
              {
                inputMessage && (
                  <Tooltip className="fade in input-message" placement="bottom">
                    {inputMessage}
                  </Tooltip>
                )
              }
            </div>
          </AuthComponent>
          
          <AuthComponent pagecode="数据报告" visiblecode="edit">
            <OverlayTrigger
              rootClose
              target={this.menu_btn}
              trigger="click"
              placement="bottom"
              overlay={(
                <Popover className="dashboard-popover">
                  <div style={{ whiteSpace: 'nowrap' }}>
                    {
                      !disableMoveToParent && this.props.fileType !== 'multi-screen' && (
                        <div className="sub-btn menu-item"
                          style={this.STYLE_SHEET.menuItem}
                          onClick={this.handleEvent.bind(this, 'movetoparent')}
                        >
                          上移一层
                        </div>
                      )
                    }
                    {
                      isFile && !isMutiScreen && <div className="sub-btn menu-item"
                        style={this.STYLE_SHEET.menuItem}
                        onClick={this.handleEvent.bind(this, 'mail')}
                      >
                        邮件订阅
                      </div>
                    }
                    <div className="sub-btn menu-item"
                      style={this.STYLE_SHEET.menuItem}
                      onClick={this.handleEvent.bind(this, 'delete')}
                    >
                      删除
                    </div>
                  </div>
                </Popover>
              )}
            >
              <span className="menu-btn dmpicon-arrow-down"
                ref={(node) => { this.menu_btn = node }}
                style={this.STYLE_SHEET.menuBtn} />
            </OverlayTrigger>
          </AuthComponent>
          {isFile && <hr />}
          {isFile && this.renderFileTools()}
        </div>
      </AuthComponent>
    )
  }

  renderFileTools() {
    return (
      <div className="file-tools-wrapper">
        <ul className="clearfix">
          {
            this.props.fileType !== 'multi-screen' ? (
              <AuthComponent pagecode="数据报告" visiblecode="edit">
                <li onClick={this.handleCopy.bind(this)}><i className="dmpicon-copy" />复制</li>
              </AuthComponent>
            ) : null
          }
          <li style={{ marginRight: 0 }} onClick={this.handleGoMultiScreen.bind(this)}>
            <i className="dmpicon-full" />
            预览
          </li>
          <AuthComponent pagecode="数据报告" visiblecode="edit">
            <li style={{ float: 'right' }} onClick={this.handlePublishMultiScreen.bind(this)}>
              <span className="switch-button-wrapper">
                <SwitchButton
                  active={this.props.isPublished}
                  style={{ width: '24px', height: '12px' }}
                  activeStyle={{ width: '24px', height: '12px' }}
                  circleStyle={{ width: '12px', height: '12px', top: 0, left: 0 }}
                  circleActiveStyle={{ width: '12px', height: '12px', top: 0, left: '12px' }}
                  texts={{ on: '', off: '' }}
                  turnOn={() => { }}
                  turnOff={() => { }}
                />
              </span>
              发布
            </li>
          </AuthComponent>
        </ul>
      </div>
    );
  }
  // 复制
  handleCopy() {
    const { triggerEvent, data } = this.props
    triggerEvent({
      eventName: 'copy',
      data: {
        ...data
      }
    })
  }
  // 去多屏页面
  handleGoMultiScreen() {
    const { triggerEvent, data } = this.props

    triggerEvent({
      eventName: 'preview',
      data: {
        ...data
      }
    })
  }

  handlePublishMultiScreen() {
    const { triggerEvent, data } = this.props

    triggerEvent({
      eventName: 'publish',
      data: {
        ...data
      }
    })
  }

  // 开始重命名
  handleRenameClick() {
    document.body.click()
    this.setState({
      isEdit: true
    }, () => {
      const dom = this.name_edit_input
      if (dom) {
        const v = dom.value
        dom.value = ''
        dom.focus()
        dom.value = v
      }
    })
  }

  // input change
  handleChangeName(e) {
    const name = e && e.target ? e.target.value : ''
    // if (_specialChartReq.test(name)) {
    //   this.setState({
    //     inputMessage: '不能包含以下字符 \\ / : ? " <> | ; # &'
    //   }, () => {
    //     // trigger overlay
    //     // this.rename_container && this.rename_container.click()
    //   })
    // } else {
    this.setState({
      name,
      inputMessage: ''
    })
    // }
  }

  // blur event
  handleStopEditName() {
    this._rename()
  }

  // key event
  handleEditKeyDown(e) {
    // esc
    if (e.keyCode === 27) {
      this._resetName()
    }

    //enter
    if (e.keyCode === 13) {
      this._rename()
    }
  }

  // drag evnets
  handleDragStart(e) {
    e.target.style.opacity = 0.3
    this.dragDom = e.target
  }

  handleDragEnter(e) {
    // 只对文件夹图标div有效, 并且自身不触发
    if (this._isDragDom(e.target)) {
      _dragTargetDom = e.target
      _dragTargetDom.classList.add('drag-over')
    }
  }

  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault()  // Necessary. Allows us to drop.
    }
    e.dataTransfer.dropEffect = 'move' // 应该是鼠标样式
    return false
  }

  handleDragLeave(e) {
    // 同时需要判断移动到的是外部的list-container还是内部的图标等等元素
    if (this._isDragDom(e.target) && e.relatedTarget === document.getElementById('data-view-list-container')) {
      e.target.classList.remove('drag-over')
      _dragTargetDom = null
    }
  }

  handleDragEnd(e) {
    e.target.style.opacity = '';
    // 触发移动的action
    if (_dragTargetDom) {
      const targetId = _dragTargetDom.getAttribute('data-item-id');
      const {
        triggerEvent,
        index,
        data
      } = this.props;

      triggerEvent({
        index,
        eventName: 'movetoparent',
        data: {
          ...data,
          targetId
        }
      })
    }
    _dragTargetDom && _dragTargetDom.classList.remove('drag-over');
    _dragTargetDom = null;
    this.dragDom = null;
  }

  handleDragDrop(e) {
    // 您需要阻止浏览器的默认行为（通常是某种令人困扰的重定向）以便进行拖放。
    e.stopPropagation()
    return false
  }

  handleEvent(eventName) {
    const {
      triggerEvent,
      index,
      data
    } = this.props;

    triggerEvent({
      index,
      eventName,
      data
    });
  }

  _focusNameInput() {
    if (this.name_edit_input) {
      if (this.item_root) this.item_root.scrollIntoView();
      const dom = this.name_edit_input
      if (dom) {
        const v = dom.value;
        dom.value = '';
        dom.value = v;
        dom.focus();
        dom.select();
      }
    }
  }

  _isDragDom(dom) {
    return dom.getAttribute('data-drag-target')
      && dom.getAttribute('data-item-type') === 'FOLDER'
      && dom !== this.dragDom
  }

  _rename() {
    this.setState({
      isEdit: false,
      inputMessage: ''
    });

    const {
      triggerEvent,
      index,
      data
    } = this.props;

    triggerEvent({
      index,
      eventName: 'rename',
      data: {
        ...data,
        name: this.state.name
      }
    })
  }

  _resetName() {
    this.setState({
      isEdit: false,
      name: this.props.data.name
    })
  }

  STYLE_SHEET = {
    // 容器
    itemRoot: {
      display: 'inline-block',
      // textAlign: 'center',
      width: '200px',
      height: '206px',
      position: 'relative',
      margin: '0 24px 24px 0',
      verticalAlign: 'top'
    },
    iconBlock: {
      width: '172px',
      height: '108px',
      overflow: 'hidden'
    },
    iconBlockCover: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '172px',
      height: '108px',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    },
    // 下拉菜单按钮
    menuBtn: {
      cursor: 'pointer',
      width: '18px',
      height: '18px',
      position: 'absolute',
      right: '5px',
      top: '5px',
      borderRadius: '4px',
      fontSize: '12px',
      paddingTop: '2px',
      paddingLeft: '2px',
      transition: 'all 0.3s',
      borderStyle: 'solid',
      borderWidth: '1px',
      zIndex: 2
    },
    // 下拉菜单项
    menuItem: {
      cursor: 'pointer',
      lineHeight: '30px',
      padding: '0 15px',
      fontSize: '12px'
    }
  };
}
