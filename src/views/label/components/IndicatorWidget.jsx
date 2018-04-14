import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames';

import './indicator-widget.less';
/**
 * IndicatorWidget -> 指标小组件 (命名？) 
 * 对高级标签的的相关指标的页面及操作 组件
 */

const TargetWidget = (props) => {
  const { data, onDelete } = props

  return (
    <div className='widget-wrap'>
      {
        data.type === 'indicator' ? <div className='content'>
          <p className="title">{data.title}</p>
          <p className="text">{data.text}</p>
        </div> : <div className='content'>
          {data.text}
        </div>
      }
      <div className="operator-group">
        <i className="circle-del" onClick={onDelete} />
      </div>
    </div>
  )
}

const SourceWidget = (props) => {
  const { data, onDelete, onEdit } = props

  return (
    <div className="widget-wrap">
      <div className="operator-group">
        <i className="circle-del" onClick={onDelete} />
      </div>
      <div className="content">
        <p className="title">{data.title} <i className="dmpicon-edit" onClick={onEdit} /></p>
        <p className="text">{data.text}</p>
      </div>
    </div>
  )
}

export default class IndicatorWidget extends React.Component {
  static propTypes = {
    type: PropTypes.oneOf(['target', 'source']).isRequired, // target-[编辑+删除]，source-[删除+拖拽]
    serial: PropTypes.number.isRequired, // 序列号
    data: PropTypes.shape({
      type: PropTypes.oneOf(['indicator', 'operator']), // indicator, operator                                  
      title: PropTypes.string,
      text: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.element,
        PropTypes.node
      ])
    }).isRequired,
    events: PropTypes.shape({
      onDelete: PropTypes.func,
      onEdit: PropTypes.func,
      onSelect: PropTypes.func
    })
  };

  static defaultProps = {
    type: 'target'
  };

  constructor(props) {
    super(props);
    this.state = {
      prefixCls: 'indicator-widget'
    }
  }

  render() {
    const { prefixCls } = this.state
    const { type, data, serial } = this.props
    const componentCls = classnames(prefixCls, type, type === 'target' ? data.type : 'indicator')
    const Element = type === 'target' ? TargetWidget : SourceWidget

    return (
      <div className={componentCls}
        data-serial={serial}
        onClick={type === 'target' ? null : this.handleAction.bind(this, 'Select')}
      >
        {
          data && (
            <Element
              data={data}
              onEdit={this.handleAction.bind(this, 'Edit')}
              onDelete={this.handleAction.bind(this, 'Delete')}
            />
          )
        }
      </div>
    )
  }

  handleAction(action, e) {
    e.stopPropagation();

    const { serial, type, data, events } = this.props
    events[`on${action}`](type, action.toLowerCase(), serial, data)
  }
}
