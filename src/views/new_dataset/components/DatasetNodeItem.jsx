import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types'

import Overlay from 'react-bootstrap-myui/lib/Overlay';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';

import AuthComponent from '@components/AuthComponent';

import _ from 'lodash'
import classnames from 'classnames';
import { SIDE_MENU_ITEM_HEIGHT, TYPE_NAMES, SIDE_MENU_ITEM_LENGTH } from '../constants';

class DatasetNodeItem extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    data: PropTypes.object,
    treeData: PropTypes.array,
    spread: PropTypes.bool,
    initEdit: PropTypes.bool,
    hasItemMoving: PropTypes.bool,
    container: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.object
    ]),
    onRename: PropTypes.func,
    onAddFolder: PropTypes.func,
    onFileMoveStart: PropTypes.func,
    onFileMoveEnd: PropTypes.func,
    onSetMenuShow: PropTypes.func,
    onSelectNode: PropTypes.func,
    onShowErr: PropTypes.func,
    onTempAddFolder: PropTypes.func,
    onDel: PropTypes.func
  };

  static defaultProps = {
    initEdit: false,
    hasItemMoving: false
  };

  constructor(props) {
    super(props);
    this.state = {
      menuOpt: {
        show: false,
        type: 'floder',
        top: 0
      },
      isEdit: props.initEdit,
      nameInEdit: props.data ? (props.data.name || '') : '',
      node: null
    };
    this.timer = 0;
    this.stimer = 0;
  }

  componentDidMount() {
    // 处理input Edit
    this.doHandlerEdit()
  }

  componentDidUpdate() {
    // 处理input Edit
    this.doHandlerEdit()
  }

  componentWillReceiveProps(nextProps) {
    const { data, hasItemMoving, initEdit } = this.props
    const currName = data ? (data.name || '') : '';
    const nextName = nextProps.data ? (nextProps.data.name || '') : '';

    if (currName !== nextName) {
      this.setState({
        nameInEdit: nextName
      });
    }

    if (!hasItemMoving && nextProps.hasItemMoving) {
      this.handleHideMenu();
    }

    if (!nextProps.hasItemMoving && this.file_tree_items) {
      $(this.file_tree_item).removeClass('hover-status');
      clearTimeout(this.stimer);
    }

    // 如果初始化 initEdit 
    if (initEdit !== nextProps.initEdit && nextProps.initEdit) {
      this.setState({
        isEdit: nextProps.initEdit
      })
    }
  }

  render() {
    const { data, spread, hasItemMoving, style, className } = this.props;
    const { isEdit, nameInEdit } = this.state;

    const containerClassName = classnames('file-tree-item', className, {
      'in-edit': isEdit,
      'no-indent': data.type === TYPE_NAMES.template
    })

    return (
      <div className={containerClassName}
        ref={(node) => { this.file_tree_item = node }}
        style={Object.assign({}, this.STYLE_SHEET.container, style)}
        onMouseEnter={(e) => {
          this.handleCancelHideMenu(e);
          if (hasItemMoving) {
            $(this.file_tree_item).addClass('hover-status');
            if (!spread) {
              this.stimer = setTimeout(() => {
                $(this.file_tree_item).click();
              }, 1500);
            }
          }
        }}
        onMouseLeave={(e) => {
          this.handleDelayHideMenu(e);
          if (hasItemMoving) {
            clearTimeout(this.stimer);
            $(this.file_tree_item).removeClass('hover-status');
          }
        }}
        onDoubleClick={data.type === TYPE_NAMES.folder ? null : this.handleSelectNode.bind(this, data)}
      >
        <div className="file-tree-item-icon" style={{
          position: 'absolute',
          left: '0px',
          top: '0px',
          paddingRight: '10px'
        }}>
          {
            data.type === TYPE_NAMES.folder ? (
              <i className={spread ? 'dmpicon-folder-open' : 'dmpicon-folder-close'}></i>
            ) : this.renderDatasetIcon()
          }
        </div>
        <div className="file-tree-item-name" style={this.STYLE_SHEET.name}>
          {
            isEdit ? (
              <div className="form">
                <input type="text"
                  ref={(node) => { this.file_tree_name_edit_input = node }}
                  placeholder="请输入名称"
                  className="file-tree-name-edit-input"
                  style={this.STYLE_SHEET.nameInput}
                  value={nameInEdit}
                  onChange={this.handleChangeName.bind(this)}
                  onClick={(e) => { /*此处防止点击事件触发文件夹展开*/ e.nativeEvent && e.nativeEvent.stopPropagation(); }}
                  onBlur={this.handleStopNameEdit.bind(this)}
                />
                <i className="dmpicon-tick"
                  style={this.STYLE_SHEET.tickIcon}
                  onClick={this.handleStopNameEdit.bind(this)}
                />
              </div>
            ) : (
                <OverlayTrigger trigger="hover"
                  placement="top"
                  overlay={(<Tooltip className="dataset-file-node-tool-tip">{data.name}</Tooltip>)}
                >
                  <div style={this.STYLE_SHEET.textLimit}>{data.name}</div>
                </OverlayTrigger>
              )
          }
        </div>
        {
          !isEdit && data.type !== TYPE_NAMES.template && (
            <AuthComponent pagecode="创建数据集" visiblecode="edit">
              <div className="file-item-menu-btn"
                style={this.STYLE_SHEET.menuBtn}
                onMouseDown={(e) => { e.nativeEvent && e.nativeEvent.stopPropagation();/*此处放置点击btn时开始移动文件*/ }}
                onClick={this.handleOpenMenu.bind(this, data)}
              >
                <i className="dmpicon-menu" style={this.STYLE_SHEET.menuBtnIcon} />
              </div>
            </AuthComponent>
          )
        }
        {data.type !== TYPE_NAMES.template && this.renderSideMenu()}
      </div>
    );
  }

  // 渲染数据集图标
  renderDatasetIcon() {
    const type = this.props.data && this.props.data.type ? this.props.data.type : '';
    let clsName;

    switch (type) {
      case TYPE_NAMES.excel:
        clsName = 'dmpicon-excel';
        break;
      case TYPE_NAMES.label:
        clsName = 'dmpicon-label-dataset';
        break;
      case TYPE_NAMES.sql:
        clsName = 'dmpicon-sql';
        break;
      case TYPE_NAMES.combo:
        clsName = 'dmpicon-combo-dataset';
        break;
      case TYPE_NAMES.api:
        clsName = 'dmpicon-api-dataset';
        break;
      default:
        clsName = 'dmpicon-dataset';
        break;
    }

    return <i className={clsName} />
  }

  // 渲染侧边菜单
  renderSideMenu() {
    const { container, data } = this.props;
    const { menuOpt } = this.state;
    const type = data ? data.type : '';
    const level = data ? data.level : 0;

    return (
      <Overlay
        show={menuOpt.show}
        onHide={this.handleHideMenu.bind(this)}
        rootClose
        ref={(instance) => { this.target = instance }}
        container={container}
        placement="right"
        target={this.file_tree_item}
      >
        <div>
          <div className="dataset-side-menu"
            style={Object.assign({}, { top: `${menuOpt.top}px` }, this.STYLE_SHEET.menuContainer)}
            onMouseLeave={this.handleCloseSideMenu.bind(this)}
            onMouseEnter={this.handleCancelHideMenu.bind(this)}
          >
            {
              [TYPE_NAMES.api, TYPE_NAMES.folder].indexOf(type) === -1 && <div className="dataset-side-menu-item"
                style={this.STYLE_SHEET.menuItem}
                onClick={this.handleAuthority.bind(this)}
              >
                权限管理
              </div>
            }
            <div className="dataset-side-menu-item"
              style={this.STYLE_SHEET.menuItem}
              onClick={this.handleStartNameEdit.bind(this)}
            >
              重命名
            </div>
            {
              type === TYPE_NAMES.folder && level < 4 && (
                <div className="dataset-side-menu-item"
                  style={this.STYLE_SHEET.menuItem}
                  onClick={this.hanldeTempAddFolder.bind(this)}
                >
                  新建文件夹
                </div>
              )
            }
            <div className="dataset-side-menu-item"
              style={this.STYLE_SHEET.menuItem}
              onClick={this.handleDel.bind(this)}
            >
              删除
            </div>
          </div>
        </div>
      </Overlay>
    )
  }

  handleAuthority(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();

    this.props.onAuthority()
  }

  hanldeTempAddFolder(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();

    this.props.onTempAddFolder()
  }

  handleDel(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();

    this.props.onDel()
  }

  handleSelectNode(node, e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();

    this.setState({
      node
    })
    this.props.onSelectNode(node)
  }

  // 进入编辑名称模式
  handleStartNameEdit(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation()
    e.preventDefault();

    this.setState({
      isEdit: true,
      nameInEdit: this.props.data.name
    }, () => {
      // 自动聚焦并将光标定位到最后一个字符后
      const inputDom = this.file_tree_name_edit_input
      const v = inputDom.value;
      inputDom.value = '';
      inputDom.focus();
      inputDom.value = v;
    });
  }

  // 名称输入事件
  handleChangeName(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation()

    this.setState({
      nameInEdit: e.target.value
    });
  }

  // 退出编辑名称模式
  handleStopNameEdit(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation()

    const { onShowErr, data } = this.props;

    const _data = _.cloneDeep(data)
    // 退出名称编辑 取消新建的文件夹ID
    if (this.state.nameInEdit) {
      // 如果 id 为 tempFiles_id, 则为新增
      if (data.id === 'tempFolders_id') {
        // 名字是否重复
        if (!this._isDuplicateName(_data, this.state.nameInEdit)) {
          // 清空id
          data.id = ''
          data.name = this.state.nameInEdit
          this.setState({
            isEdit: false
          });
          // 如果异步函数执行完毕 （后台出错的情况下）
          this._asyncAddFolder()
        } else {
          onShowErr('同级中该名字已经被使用！')
          this.file_tree_name_edit_input.focus()
          return false
        }
      } else if (!this._isDuplicateName(_data, this.state.nameInEdit)) {
        data.name = this.state.nameInEdit
        this.setState({
          isEdit: false
        });
        // 如果异步函数执行完毕 （后台出错的情况下）
        this._asyncRename();
      } else {
        onShowErr('同级中该名字已经被使用！')
        this.file_tree_name_edit_input.focus()
        return false
      }
    }
  }

  // 打开管理菜单
  handleOpenMenu(node, e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();

    const mLen = node.type === TYPE_NAMES.folder && node.level < 4 ? SIDE_MENU_ITEM_LENGTH[node.type] : (SIDE_MENU_ITEM_LENGTH[node.type] - 1);

    const $c = $(this.props.container),
      menuHeight = mLen * SIDE_MENU_ITEM_HEIGHT,
      cHeight = $c.height(),
      tTop = $(e.currentTarget).offset().top - $c.offset().top;

    // 计算菜单应该弹出的位置
    let _top;

    if (tTop > cHeight - SIDE_MENU_ITEM_HEIGHT) {
      _top = cHeight - menuHeight;
    } else if (tTop > cHeight - menuHeight) {
      _top = tTop - menuHeight + SIDE_MENU_ITEM_HEIGHT
    } else {
      _top = tTop;
    }

    // 文件夹
    if (node.type === 'FOLDER') {
      if (_top + 90 > cHeight) {
        _top = cHeight - 90
      }
    } else if (_top + 60 > cHeight) {
      _top = node.type === TYPE_NAMES.api ? (cHeight - 60) : (cHeight - 90)
    }

    this.setState({
      menuOpt: {
        show: true,
        top: _top
      }
    });

    this.props.onSetMenuShow(node.id);
  }

  // 延迟隐藏菜单
  handleDelayHideMenu(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation()

    if (!this.state.menuOpt.show) {
      //
    }
    //this.timer = setTimeout(this.handleCloseSideMenu.bind(this,e), 300);
  }

  // 取消延迟隐藏菜单
  handleCancelHideMenu(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation()
    if (!this.state.menuOpt.show) {
      return;
    }
    clearTimeout(this.timer);
  }

  // 关闭管理菜单
  handleHideMenu() {
    this.setState({
      menuOpt: {
        ...this.state.menuOpt,
        show: false
      }
    });
    this.props.onSetMenuShow('');
  }

  // 关闭含有rootClose的overlay菜单
  handleCloseSideMenu(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation()

    document.body.click();
    this.props.onSetMenuShow('');
  }

  // 是否重复定义名字
  _isDuplicateName(node, name) {
    const { treeData } = this.props
    const parent_path = _.dropRight(node.path)
    let target = treeData

    if (Array.isArray(parent_path)) {
      parent_path.forEach((item, index) => {
        if (index === 0) {
          target = treeData[item]
        } else {
          target = target.sub[item]
        }
      })
    }

    const bortherNode = parent_path.length > 0 ? (target ? target.sub : []) : treeData
    return !!bortherNode.find(item => item.name === name && item.id !== node.id)
  }

  doHandlerEdit() {
    const nodeDom = this.file_tree_item
    const $node = $(ReactDOM.findDOMNode(nodeDom))

    if (this.state.isEdit) {
      const inputDom = this.file_tree_name_edit_input
      const $inputDom = $(ReactDOM.findDOMNode(inputDom))

      //console.log($inputDom.is(':focus'))
      if (!$inputDom.is(':focus')) {
        inputDom.focus();
      }

      $node.closest('.dmp-tree-node-box').attr('draggable', 'false')
    } else {
      $node.closest('.dmp-tree-node-box').attr('draggable', 'true')
    }
  }

  async _asyncAddFolder() {
    await this.props.onAddFolder(this.state.nameInEdit)
    const input = this.file_tree_name_edit_input
    input && input.focus()
  }

  async _asyncRename() {
    await this.props.onRename(this.state.nameInEdit)
    const input = this.file_tree_name_edit_input
    input && input.focus()
  }

  // 除 hover、theme以外的样式
  STYLE_SHEET = {
    container: {
      position: 'relative',
      paddingLeft: '24px',
      height: '30px',
      width: '100%'
    },
    name: {
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden'
    },
    nameInput: {
      position: 'absolute',
      left: '0px',
      top: '1px',
      bottom: '1px',
      right: '0px',
      lineHeight: '24px',
      fontSize: '14px',
      width: '100%',
      padding: '1px 26px 1px 10px'
    },
    tickIcon: {
      fontSize: '14px',
      position: 'absolute',
      display: 'block',
      padding: '6px',
      right: '1px',
      top: '2px',
      cursor: 'pointer',
      transition: 'color .3s'
    },
    menuBtn: {
      position: 'absolute',
      right: '0px',
      top: '0px',
      padding: '9px 14px 9px 4px',
      cursor: 'pointer',
      zIndex: 9
    },
    menuBtnIcon: {
      display: 'block',
      fontSize: '12px',
      lineHeight: 1,
      transform: 'rotateZ(90deg)',
      transition: 'color .3s'
    },
    menuContainer: {
      width: '130px',
      position: 'absolute',
      left: '240px',
      background: ''
    },
    menuItem: {
      height: `${SIDE_MENU_ITEM_HEIGHT}px`,
      lineHeight: `${SIDE_MENU_ITEM_HEIGHT}px`,
      padding: '0 16px',
      fontSize: '12px',
      cursor: 'pointer'
    },
    textLimit: {
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }
  };
}

export default DatasetNodeItem;
