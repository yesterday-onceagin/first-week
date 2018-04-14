import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames';
import uniqueId from 'lodash/uniqueId';
import Sortable from 'react-sortablejs';
import { DATA_FIELD, NOOP } from '../constants/sortable';
import './micro-tree.less';

class MicroTree extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    dataField: PropTypes.shape({ // name对应映射的字段
      title: PropTypes.string,  // title 
      children: PropTypes.string, // 
      text: PropTypes.string
    }),
    customerNode: PropTypes.func,
    events: PropTypes.shape({
      onSpread: PropTypes.func, // 展开
      onSelect: PropTypes.func,  //
      onDelete: PropTypes.func
    }),
    showLine: PropTypes.bool   // 出现关连线的时候. 不会出现折叠尖角 icon
  };

  static defaultProps = {
    data: null,
    showLine: false,
    sort: true,
    dataField: {
      title: 'title',
      children: 'children',
      text: 'text'
    }
  };

  render() {
    const { data, dataField, id, showLine, sort, customerNode } = this.props
    const _spread_ = data._spread_
    const _class = classnames('micro-tree-folder', { spread: _spread_ })
    const _tree_class = classnames('micro-tree', { show_line: showLine })

    const title = data[dataField.title]
    const children = data[dataField.children]
    DATA_FIELD.onClone = this.handleClone.bind(this)

    // folder class
    const folderClass = (_spread_ && Array.isArray(children) && children.length > 0) ? 'dmpicon-folder-open' : 'dmpicon-folder-close'

    return data.hidden ? null : <div className={_tree_class}>
      <div className={_class} onClick={this.handleFolderSpread.bind(this, title)}>
        {!showLine && <i className="dmpicon-triangle" />}
        <i className={folderClass}></i>
        {title}
      </div>
      <ul className="micro-tree-list" style={{ display: _spread_ ? 'block' : 'none' }} id={id}>
        {
          Array.isArray(children) && children.map((item) => {
            //hidden true隐藏
            if (!item.hidden) {
              return (
                <li key={`${item.id}_${item[dataField.text]}`} className="micro-tree-list-item" onClick={sort ? null : this.handleOpenFuncDetail.bind(this, item)}>
                  {
                    sort ? (
                      <Sortable options={DATA_FIELD} onChange={NOOP}>
                        <div data-id={item.id} className="micro-tree-list-item-inner">
                          {this.genarateIcon(item)}
                          <span title={item[dataField.text]}>{item[dataField.text]}</span>
                        </div>
                      </Sortable>
                    ) : (
                      <div className="micro-tree-list-item-inner">
                        {this.genarateIcon(item)}
                        <span title={item[dataField.text]}>{item[dataField.text]}</span>
                      </div>
                    )
                  }
                  {this.isHigherField(item) && <i className="dmpicon-del micro-tree-edit" onClick={this.handleDelete.bind(this, 'delete', item.id)} />}
                  {this.isHigherField(item) && <i className="dmpicon-edit micro-tree-edit" onClick={this.handleOpenFuncDetail.bind(this, 'edit', item)} />}
                  {customerNode && customerNode(item)}
                </li>
              )
            }
          })
        }
      </ul>
    </div>
  }

  genarateIcon(data) {
    let icon = <i className="dmpicon-function" />
    const isAdvanceField = ['普通高级', '计算高级'].indexOf(data.type) > -1
    if (data.data_type) {
      switch (data.data_type) {
        case '数值':
          icon = <i className="dmp-field-icon" style={isAdvanceField ? this.STYLE_SHEET.numIcon : this.STYLE_SHEET.otherIcon}>#</i>;
          break;
        case '日期':
          icon = <i className="dmp-field-icon dmpicon-calendar" style={this.STYLE_SHEET.wrapIcon} />;
          break;
        case '地址':
          icon = <i className="dmp-field-icon dmpicon-map-mark" style={this.STYLE_SHEET.wrapIcon} />;
          break;
        case '枚举':
          icon = <i className="dmp-field-icon dmpicon-enum" style={this.STYLE_SHEET.wrapIcon} />;
          break;
        default:
          icon = <i className="dmp-field-icon" style={isAdvanceField ? this.STYLE_SHEET.numIcon : this.STYLE_SHEET.otherIcon}>T</i>;
          break;
      }
    }
    return icon
  }

  handleFolderSpread(name) {
    !!this.props.events.onSpread && this.props.events.onSpread(name)
  }
  handleDelete(mode, id, e) {
    e.stopPropagation();
    !!this.props.events.onDelete && this.props.events.onDelete(mode, id)
  }

  handleOpenFuncDetail(mode, item) {
    !!this.props.events.onSelect && this.props.events.onSelect(mode, item)
  }

  // 避免拖拽无效， clone 到本身
  handleClone(evt) {
    const wrap = $(evt.target)
    const Node = wrap.find('.micro-tree-list-item:not(.sortable-drag)')
    // 如果存在多个的话.则清空
    if (Node.length > 1) {
      wrap.find('.micro-tree-list-item:not(.sortable-drag):lt(1)').remove();
    }
  }

  isHigherField(item) {
    return ['普通高级', '计算高级'].indexOf(item.type) > -1
  }

  STYLE_SHEET = {
    numIcon: {
      color: '#F6A623',
      fontStyle: 'italic',
      width: '20px',
      display: 'inline-block',
      verticalAlign: 'top',
      textAlign: 'left'
    },
    wrapIcon: {
      color: '#488DFB',
      fontStyle: 'italic',
      width: '20px',
      lineHeight: '26px',
      display: 'inline-block',
      verticalAlign: 'top',
      textAlign: 'left'
    },
    otherIcon: {
      color: '#488DFB',
      fontStyle: 'italic',
      width: '20px',
      display: 'inline-block',
      verticalAlign: 'top',
      textAlign: 'left'
    }
  }
}

export default MicroTree;
