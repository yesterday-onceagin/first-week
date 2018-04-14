import React from 'react';
import PropTypes from 'prop-types'
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';

import { SIDE_MENU_ITEM_HEIGHT, TYPE_NAMES } from '../constants';

class DatasetComboItem extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    data: PropTypes.object,
    spread: PropTypes.bool,
    container: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.object
    ]),
    onSetMenuShow: PropTypes.func,
    onInsertTable: PropTypes.func,
    onInsertField: PropTypes.func
  };

  static defaultProps = {
    className: ''
  };

  constructor(props) {
    super(props);
    this.state = {
      menuOpt: {
        show: false,
        type: 'floder',
        top: 0
      }
    };
    this.timer = 0;
    this.stimer = 0;
  }


  componentWillReceiveProps(nextProps) {
    const currName = this.props.data ? (this.props.data.name || '') : '';
    const nextName = nextProps.data ? (nextProps.data.name || '') : '';

    if (currName !== nextName) {
      this.setState({
        nameInEdit: nextName
      });
    }


    if (this.file_tree_item) {
      $(this.file_tree_item).removeClass('hover-status');
      clearTimeout(this.stimer);
    }
  }

  render() {
    const { data, spread, className } = this.props;

    const containerClassName = `file-tree-item ${className}`
    // 是否为数据集
    const isDataset = data.type !== TYPE_NAMES.folder && !data.field
    // 是否为字段
    const isField = data.type !== TYPE_NAMES.folder && data.field
    // 字段
    const style = isField ? { paddingRight: '30px' } : {}
    // 图标
    const itemClass = spread ? 'dmpicon-folder-open' : 'dmpicon-folder-close'

    return (
      <div className={containerClassName}
        ref={(node) => { this.file_tree_item = node }}
        style={Object.assign({}, this.STYLE_SHEET.container, style)}
      >
        <div className="file-tree-item-icon" style={this.STYLE_SHEET.fileTreeItemIcon}>
          {
            data.type === TYPE_NAMES.folder ? (
              <i className={itemClass}/>
            ) : this.renderDatasetIcon()
          }
        </div>
        <div className="file-tree-item-name" style={this.STYLE_SHEET.name}>
          <OverlayTrigger trigger="hover"
            placement="top"
            overlay={isField ? <div/> : (<Tooltip className="dataset-file-node-tool-tip">{data.name}</Tooltip>)}
          >
            <div style={this.STYLE_SHEET.textLimit}>
              <span>{data.name}</span>
            </div>
          </OverlayTrigger>
        </div>
        {
          isDataset &&
            <OverlayTrigger trigger="hover"
              placement="top"
              overlay={(<Tooltip className="dataset-file-node-tool-tip">插入表</Tooltip>)}
            >
              <i className="dmpicon-insert combo-tree-btn"
                onClick={this.handleInsertTable.bind(this, data)}
                style={this.STYLE_SHEET.menuIcon}
              />
            </OverlayTrigger>
        }
        {
          isDataset &&
            <OverlayTrigger trigger="hover"
              placement="top"
              overlay={(<Tooltip className="dataset-file-node-tool-tip">插入所有字段</Tooltip>)}
            >
              <i className="dmpicon-outset combo-tree-btn"
                onClick={this.handleInsertField.bind(this, data)}
                style={this.STYLE_SHEET.exitIcon}
              />
            </OverlayTrigger>
        }
        {
          isField &&
            <OverlayTrigger trigger="hover"
              placement="top"
              overlay={(<Tooltip className="dataset-file-node-tool-tip">插入字段</Tooltip>)}
            >
              <i className="dmpicon-exit combo-tree-btn"
                style={this.STYLE_SHEET.exitIcon}
                title="插入字段"
                onClick={this.handleInsertField.bind(this, data)}
              />
            </OverlayTrigger>
        }
      </div>
    );
  }

  // 渲染数据集图标
  renderDatasetIcon() {
    const { data } = this.props
    const field = data && data.field ? data.field : '';
    const type = data && data.type ? data.type : '';
    let clsName;
    let icon = null

    if (field) {
      // 定义字段类型与图标的映射
      const fieldIcons = {
        数值: <i style={this.STYLE_SHEET.otherIcon}>#</i>,
        日期: <i className="dmpicon-calendar" style={this.STYLE_SHEET.wrapIcon} />,
        地址: <i className="dmpicon-map-mark" style={this.STYLE_SHEET.wrapIcon} />
      }
      icon = fieldIcons[type] || <i style={this.STYLE_SHEET.otherIcon}>T</i>
    } else {
      // 定义数据集类型与图标class的映射
      const datasetIcons = {
        [TYPE_NAMES.excel]: 'dmpicon-excel',
        [TYPE_NAMES.label]: 'dmpicon-label-dataset',
        [TYPE_NAMES.sql]: 'dmpicon-sql',
        [TYPE_NAMES.combo]: 'dmpicon-combo-dataset',
        [TYPE_NAMES.api]: 'dmpicon-api-dataset',
        
      }
      clsName = datasetIcons[type] || 'dmpicon-dataset'
      icon = <i className={clsName}/>
    }
     
    return icon
  }

  handleInsertTable(data, e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    this.props.onInsertTable(data, e)
  }

  handleInsertField(data, e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    this.props.onInsertField(data, e)
  }

  // 除 hover、theme以外的样式
  STYLE_SHEET = {
    container: {
      position: 'relative',
      paddingLeft: 24,
      height: 30,
      width: '100%'
    },
    name: {
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      paddingRight: '60px'
    },
    menuBtn: {
      position: 'absolute',
      right: 0,
      top: 0,
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
      width: 130,
      position: 'absolute',
      left: 240
    },
    menuItem: {
      height: SIDE_MENU_ITEM_HEIGHT,
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
    },
    numIcon: {
      color: '#F6A623',
      fontStyle: 'italic',
      width: '20px',
      display: 'inline-block',
      marginTop: '0px',
      textAlign: 'center'
    },
    wrapIcon: {
      color: '#488DFB',
      fontStyle: 'italic',
      width: '20px',
      lineHeight: '26px',
      display: 'inline-block',
      marginTop: '0px',
      textAlign: 'center'
    },
    otherIcon: {
      color: '#488DFB',
      fontStyle: 'italic',
      width: '20px',
      display: 'inline-block',
      marginTop: '0px',
      textAlign: 'center'
    },
    exitIcon: {
      position: 'absolute',
      right: '0px',
      top: '0px',
      zIndex: 10,
      cursor: 'pointer',
      padding: '8px 12px 8px 4px'
    },
    menuIcon: {
      position: 'absolute',
      right: '30px',
      top: '0px',
      zIndex: 10,
      cursor: 'pointer',
      padding: '8px 12px 8px 4px'
    },
    fileTreeItemIcon: {
      position: 'absolute',
      left: 0,
      top: 0,
      paddingRight: 10
    }
  };
}

export default DatasetComboItem;
