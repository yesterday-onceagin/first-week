import PropTypes from 'prop-types';
import React from 'react';
import Popover from 'react-bootstrap-myui/lib/Popover';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import Loading from 'react-bootstrap-myui/lib/Loading';
import classnames from 'classnames';
import { DATASET_FIELD_TYPES } from '../constants';
import './dataset-result-table.less';

class DatasetResultTable extends React.Component {
  static propTypes = {
    data: PropTypes.array,
    head: PropTypes.array,
    pending: PropTypes.bool,
    editable: PropTypes.bool,     // 头部是否可编辑
    hasIcon: PropTypes.bool,      // 是否携带 icon 
    className: PropTypes.string,
    style: PropTypes.object,
    onUpdate: PropTypes.func
  };

  static defaultProps = {
    pending: false,
    hasIcon: true,                //  默认携带icon
    editable: false,              // 默认可编辑    
    data: [],
    head: [],
    className: '',
    style: {}
  };

  constructor(props) {
    super(props);
    const { head, data } = props;
    this.state = {
      hasHead: Array.isArray(head) && head.length > 0,
      hasValidHead: Array.isArray(head) && head.length > 0 && head.some(item => item.visible === 1),
      hasValidData: Array.isArray(data) && data.length > 0,
      activeArrs: [],                // 正在活动的 th
      head: props.head.map(item => Object.assign({}, item, { thName: item.alias_name || item.col_name }))               // 处理可编辑情况下 head
    }
  }

  componentWillReceiveProps(nextProps) {
    const { head, data } = nextProps;
    this.setState({
      head: head.map(item => Object.assign({}, item, { thName: item.alias_name || item.col_name })),
      hasHead: Array.isArray(head) && head.length > 0,
      hasValidHead: Array.isArray(head) && head.length > 0 && head.some(item => item.visible === 1),
      hasValidData: Array.isArray(data) && data.length > 0,
    })
  }

  render() {
    const {
      data,
      head,
      pending,
      className,
      style
    } = this.props;

    const {
      hasValidHead,
      hasValidData
    } = this.state;

    return (
      <div
        className={`data-table-wrapper dataset-result-table ${className}`}
        id="dataset-result-data-table"
        style={style}
        onScroll={hasValidData ? this.handleScrollTable.bind(this) : null}
      >
        {
          (
            hasValidHead && hasValidData ? (
              <table className="data-table" style={{ minWidth: '100%' }}>
                <thead id="dataset-result-table-thead">
                  <tr>
                    {head.map((item, idx) => this.renderTh(item, idx))}
                  </tr>
                </thead>
                <tbody>
                  {
                    data.map((_data, index) => {
                      const columnData = head.map(item => (
                        <td key={`${item.col_name}-${index}`} style={{ minWidth: '100px' }}>
                          {this.getColValue(_data, item.col_name)}
                        </td>
                      ));
                      return (
                        <tr key={`dataset-result-table-column-${index}`}>
                          {columnData}
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            ) : (
              <div className="empty-text-cell hint-color" style={{
                width: '100%',
                lineHeight: '100px',
                textAlign: 'center',
                fontSize: '16px'
              }}>
                暂无数据
              </div>
            )
          )
        }
        <Loading show={pending} containerId="dataset-result-data-table"/>
      </div>
    );
  }

  // 编辑
  renderTh(item, idx) {
    const { editable, hasIcon } = this.props
    const { activeArrs, head } = this.state
    // col name
    let colName = item.alias_name || item.col_name
    // default element
    let element = colName

    if (editable) {
      // item 
      item = head[idx]
      // 重新赋值
      colName = item.thName

      element = activeArrs.indexOf(idx) > -1 ? [
        <span className="input" key={0} style={{ visibility: 'hidden' }}>{colName}</span>,
        <input
          type="text"
          key={1}
          value={colName}
          onChange={this.handleInputChange.bind(this, idx)}
        />,
        <span className="btn-wrap ok" key={2} onClick={this.handleOk.bind(this, idx)}>
          <i className="dmpicon-tick" />
        </span>,
        <span className="btn-wrap iclose" key={3} onClick={this.handleClear.bind(this, idx)}>
          <i className="dmpicon-close" />
        </span>
      ] : [
        <OverlayTrigger placement="top" trigger="hover" overlay={<Tooltip>{colName}</Tooltip>} key={0}>
          <span className="input">{colName}</span>
        </OverlayTrigger>,
        <span className="btn-wrap ok" key={1} style={{ visibility: 'hidden' }}>
          <i className="dmpicon-tick" />
        </span>,
        <span className="btn-wrap edit" key={2} onClick={editable ? this.handleEditor.bind(this, idx) : null}>
          <i className="dmpicon-edit" />
        </span>
      ]
    }

    // icon_type 
    const { data_type } = this.state.head[idx]

    return <th key={item.col_name} className={classnames({
      editable,
      active: activeArrs.indexOf(idx) > -1
    })}>
      {hasIcon && (
        editable ? <OverlayTrigger trigger="click" rootClose placement="bottom" overlay={this.renderOverlay(idx, data_type)}>
          {DATASET_FIELD_TYPES[data_type].icon}
        </OverlayTrigger> : DATASET_FIELD_TYPES[data_type].icon
      )}
      {element}
    </th>
  }

  renderOverlay(idx, data_type) {
    const items = Object.values(DATASET_FIELD_TYPES)
    return <Popover id="popover-result-table-bottom">
      <ul>
        {items.map((item, key) => (
          <li
            key={key}
            className={data_type == item.name ? 'active' : ''}
            onClick={this.handleSelectType.bind(this, idx, item.name)}>
            {item.icon}<span>{item.name}</span>
          </li>
        ))}
      </ul>
    </Popover>
  }

  // 设置可编辑
  handleEditor(idx) {
    const activeArrs = this.state.activeArrs.slice()
    // 如果不存在 
    if (activeArrs.indexOf(idx) === -1) {
      activeArrs.push(idx)
    }
    this.setState({
      activeArrs
    })
  }

  // 单项编辑ok
  handleOk(idx) {
    this.props.head[idx].alias_name = this.state.head[idx].thName
    // 找到 idx 在 activeArrs 的位置. 并且移除
    const { activeArrs } = this.state
    const index = activeArrs.findIndex(i => i === idx)
    // 移除
    activeArrs.splice(index, 1)

    this.setState({
      activeArrs
    })

    const { onUpdate, head } = this.props

    if (typeof onUpdate === 'function') {
      // 更新通知
      onUpdate({
        ...head[idx]
      })
    }
  }

  // 单项编辑放弃修改
  handleClear(idx) {
    this.state.head[idx].thName = this.props.head[idx].alias_name || this.props.head[idx].col_name
    // 找到 idx 在 activeArrs 的位置. 并且移除
    const { activeArrs } = this.state
    const index = activeArrs.findIndex(i => i === idx)
    // 移除
    activeArrs.splice(index, 1)
    this.setState({
      head: this.state.head,
      activeArrs
    })

    // this.props
  }

  // 单项输入
  handleInputChange(idx, e) {
    this.state.head[idx].thName = e.target.value
    this.setState({
      head: this.state.head
    })
  }

  // 选择类型
  handleSelectType(idx, type) {
    this.props.head[idx].data_type = type
    this.state.head[idx].data_type = type
    this.setState({
      head: this.state.head
    }, () => {
      // 关闭选择弹窗
      document.body.click()
    })
    

    if (typeof this.props.onUpdate === 'function') {
      // 更新通知
      this.props.onUpdate({
        ...this.props.head[idx],
        data_type: type
      })
    }
  }

  // 取得值
  getColValue(data, col) {
    if (!data || !col || !data[col]) {
      return '';
    } else if (/\d{4}(\-\d{2}){2}T(\d{2}\:){2}\d{2}/.test(data[col])) {
      // 处理时间的格式(T替换为空格)
      return data[col].replace('T', ' ');
    }
    return data[col];
  }

  // 滚动用于固定表头
  handleScrollTable(e) {
    const sTop = $(e.currentTarget).scrollTop();
    if (sTop > 0) {
      $('#dataset-result-table-thead').addClass('scrolling-thead').css({ transform: `translateY(${sTop - 1}px)` });
    } else {
      $('#dataset-result-table-thead').removeClass('scrolling-thead').css({ transform: 'none' });
    }
  }
}

export default DatasetResultTable;
