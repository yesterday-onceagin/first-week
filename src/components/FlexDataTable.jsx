import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

// 取得单元格class名称
const _getCellClsName = (isId, key, sortable) => {
  const baseCls = isId ? 'order-id-cell' : key ? `${key}-cell` : '';
  return `${baseCls} ${sortable ? 'has-sort' : ''}`
}

class FlexDataTable extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    flexDataTableId: PropTypes.string,
    pending: PropTypes.bool,
    hasNext: PropTypes.bool,
    headerHeight: PropTypes.number,
    headerBorder: PropTypes.bool,
    headerCellBorder: PropTypes.bool,
    lineHeight: PropTypes.number,
    tableMinWidth: PropTypes.number,
    dataFields: PropTypes.array,
    rowTemplate: PropTypes.element,
    data: PropTypes.array,
    dataRefresh: PropTypes.bool,
    emptyText: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.element
    ]),
    onChangeSorts: PropTypes.func,
    onFetchData: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.func
    ]),
    fetchAction: PropTypes.oneOf(['scroll', 'click']),
    defaultSorts: PropTypes.object
  };

  static defaultProps = {
    flexDataTableId: '',
    pending: false,
    hasNext: false,
    headerHeight: 30,
    dataRefresh: false,
    headerBorder: false,
    headerCellBorder: false,
    lineHeight: 30,
    tableMinWidth: 1000,
    dataFields: [],
    rowTemplate: <div></div>,
    data: [],
    emptyText: '没有可显示的内容',
    fetchAction: 'click',
    defaultSorts: {}
  };

  constructor(props) {
    super(props);

    this.state = {
      uuid: new Date().getTime(),
      sorts: props.defaultSorts
    };
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.dataRefresh) {
      return !_.isEqual(nextProps.data, this.props.data)
    }
    return true
  }

  render() {
    const {
      className,
      pending,
      headerHeight,
      headerBorder,
      data,
      fetchAction,
      flexDataTableId,
      tableMinWidth
    } = this.props;

    const { uuid } = this.state;

    const headerClsName = `flex-data-table-header  ${headerBorder ? 'has-border' : ''}`;
    const headerStyle = {
      height: `${headerHeight}px`,
      lineHeight: `${headerHeight}px`,
      display: 'flex',
      flexDirection: 'row',
      minWidth: `${tableMinWidth || 1000}px`,
      justifyContent: 'space-between',
      // paddingRight: `${this.checkScrollBarExist() ? 12 : 0}px`
    };

    const bodyStyle = {
      width: '100%',
      flex: 1,
      overflowX: 'auto',
      overflowY: 'scroll',
      minWidth: `${tableMinWidth || 1000}px`
    };

    return (
      <div className={`flex-data-table  ${className || ''}`}
        id={flexDataTableId || `flex-datatable-${uuid}`}
        style={this.STYLE_SHEET.container}
      >
        <div className={headerClsName} style={headerStyle}>
          {this.renderHeader()}
        </div>

        <ul
          ref={(node) => { this.flexDataTableBody = node }}
          className="flex-data-table-body"
          style={bodyStyle}
          onScroll={fetchAction === 'scroll' && !pending ? this.handleScrollBody.bind(this) : null}
        >
          {this.renderBody()}
          {data.length > 0 ? this.renderBottom() : null}
        </ul>
      </div>
    );
  }

  // 滚动事件响应
  handleScrollBody() {
    // 如果没有更多数据了或未传递加载数据的方法，直接返回
    const { onFetchData, pending } = this.props;

    if (!this.props.hasNext || typeof onFetchData !== 'function') {
      return;
    }

    const {
      clientHeight,
      scrollHeight,
      scrollTop
    } = this.flexDataTableBody;

    if (scrollHeight - clientHeight - scrollTop < 100 && !pending) {
      onFetchData();
    }
  }

  // 切换排序响应 DESC->ASC->NONE
  handleChangeSort(key) {
    let { sorts } = this.state;
    let sortsArray = [];

    if (!sorts[key]) {
      // 取消联合条件排序
      // 所以当 key 值不相同的情况下。则为清空，保留当前
      sorts = {
        ...sorts,
        [key]: {
          id: key,
          method: 'DESC'
        }
      };
    } else if (sorts[key].method === 'DESC') {
      sorts = {
        ...sorts,
        [key]: {
          id: key,
          method: 'ASC'
        }
      };
    } else {
      Reflect.deleteProperty(sorts, key);
    }

    sortsArray = Object.keys(sorts).map(id => sorts[id]);
    // 改变当前状态
    this.setState({ sorts });

    // 调用排序方法
    if (typeof this.props.onChangeSorts === 'function') {
      this.props.onChangeSorts(sortsArray);
    }
  }

  // 表头渲染
  renderHeader() {
    const { dataFields, headerCellBorder } = this.props;
    const { sorts } = this.state;

    return dataFields.length > 0 && dataFields.map((item, index) => {
      const cellClsName = _getCellClsName(item.idField, item.key, item.sortable);
      const cellContentStyle = {
        width: '100%',
        height: '100%',
        paddingRight: `${item.sortable ? 24 : 0}px`,
        position: 'relative'
      };

      let sortFunc = null;
      let sortBtnCls = 'sort-btn  ';

      if (item.sortable) {
        const currSort = sorts[item.key];
        const sortMethod = currSort ? currSort.method : '';
        sortBtnCls += sortMethod.toLowerCase();
        sortFunc = this.handleChangeSort.bind(this, item.key);
      }

      const brWidth = (headerCellBorder && index !== dataFields.length - 1) ? 1 : 0;

      const headerCellStyle = item.idField ? {
        ...this.STYLE_SHEET.idField,
        borderRightWidth: `${brWidth}px`,
        borderRightStyle: 'solid'
      } : {
        ...this.getFlexStyle(item.flex, item.width),
        minWidth: item.minWidth ? item.minWidth : 'initial',
        borderRightWidth: `${brWidth}px`,
        borderRightStyle: 'solid'
      };

      return (
        <div key={`flex-data-table-header-cell-${index}`}
          className={`flex-data-table-cell ${cellClsName}`}
          onClick={sortFunc}
          style={headerCellStyle}
        >
          <div style={cellContentStyle}>
            {item.name}
            {
              item.sortable && (
                <div className={sortBtnCls} style={this.STYLE_SHEET.sortBtn}>
                  <i className="dmpicon-triangle-up asc" style={this.STYLE_SHEET.sortTriangleUp} />
                  <i className="dmpicon-triangle desc" style={this.STYLE_SHEET.sortTriangleDown} />
                </div>
              )
            }
          </div>
        </div>
      );
    });
  }

  // 表格主体
  renderBody() {
    const {
      data,
      emptyText,
      lineHeight,
      rowTemplate,
      dataFields
    } = this.props;

    const hasData = data.length > 0;
    // 检查数据表模版与表头长度是否一致
    const templateError = rowTemplate.props.children.length !== dataFields.length;

    return hasData && !templateError ? data.map((rowData, index) => this.renderRow(rowData, index)) : (
      <li className="flex-data-table-item empty-data-table-item hint-color" style={{
        width: '100%',
        height: `${lineHeight}px`,
        lineHeight: `${lineHeight}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {templateError ? '数据模版与表头长度不一致' : emptyText}
      </li>
    );
  }

  // 渲染表格数据行
  renderRow(rowData, index) {
    const { rowTemplate, dataFields, lineHeight } = this.props;

    return (
      <li key={rowData.id ? `${rowData.id}_${index}` : index} className="flex-data-table-item" style={{
        width: '100%',
        height: `${lineHeight}px`,
        lineHeight: `${lineHeight}px`
      }}>
        {
          rowTemplate.props.children.map((cell, idx) => {
            if (dataFields[0].idField && idx === 0) {
              // 如果需要展示id项，则无视第一项的元素，默认展示固定格式的id
              return (
                <div style={this.STYLE_SHEET.idField}
                  key={idx}
                  className="flex-data-table-cell order-id-cell"
                >
                  {index + 1}
                </div>
              );
            }
            // 非序号项的处理, style & classname
            const cellStyle = this.getFlexStyle(dataFields[idx].flex, dataFields[idx].width);
            const cellClsName = dataFields[idx].key ? `${dataFields[idx].key}-cell` : '';

            if (cell.props.childNodes) {
              // 对于传递了childNodes属性的单元格，直接调用该方法获取内容
              return (
                <div key={idx} style={Object.assign({}, { minWidth: dataFields[idx].minWidth ? dataFields[idx].minWidth : 'initial' }, cellStyle)} className={`flex-data-table-cell ${cellClsName}`}>
                  {cell.props.childNodes(rowData || {})}
                </div>
              );
            } else if (typeof cell.props.children === 'string') {
              // 对于传递了字符串的元素，则对其中的占位符进行替换

              const text = cell.props.children.replace(/%\w+%/g, (str) => {
                str = str.replace(/%/g, '');
                return rowData[str] || '';
              });
              return (
                <div key={idx} style={cellStyle} className={`flex-data-table-cell ${cellClsName}`}>
                  <div style={{ width: '100%', height: '100%' }}>
                    {text}
                  </div>
                </div>
              );
            }
            return null
          })
        }
      </li>
    );
  }

  // 渲染表格底部
  renderBottom() {
    const {
      hasNext,
      lineHeight,
      onFetchData,
      fetchAction,
      pending
    } = this.props;

    return hasNext ? (
      fetchAction === 'click' ? (
        <li className="flex-data-table-bottom-item click-for-more" style={{
          width: '100%',
          height: `${lineHeight}px`,
          lineHeight: `${lineHeight}px`
        }}>
          <div style={{
            paddingRight: '25px',
            position: 'relative'
          }} onClick={typeof onFetchData === 'function' && !pending ? onFetchData : null}>
            点击加载更多
            <i className="dmpicon-arrow-down" style={Object.assign({}, { transform: 'translateY(-65%)' }, this.STYLE_SHEET.loadMoreIcon)}></i>
            <i className="dmpicon-arrow-down" style={Object.assign({}, { transform: 'translateY(-35%)' }, this.STYLE_SHEET.loadMoreIcon)}></i>
          </div>
        </li>
      ) : null
    ) : (
      // 当不需要显示没有更多内容时，不传onFetchData属性或传非type为function的属性即可
      typeof onFetchData === 'function' && <li className="flex-data-table-bottom-item no-more-data" style={{ width: '100%', height: `${lineHeight}px`, lineHeight: `${lineHeight}px` }}>
          没有更多内容了...
      </li>
    );
  }

  // 获取flex样式
  getFlexStyle(flex, width) {
    if (width !== undefined && flex !== undefined) {
      return {
        flex: `${flex} ${flex} ${width}`,
        maxWidth: width
      };
    }

    if (width === undefined && flex !== undefined) {
      return {
        flex: `${flex} ${flex} auto`
      };
    }

    if (width !== undefined && flex === undefined) {
      return {
        flex: `0 0 ${width}`,
        maxWidth: width
      };
    }

    if (width === undefined && flex === undefined) {
      return {
        flex: '1 1 auto'
      };
    }
  }

  // 检测是否有滚动条
  checkScrollBarExist() {
    if (!this.flexDataTableBody) {
      return false;
    }

    const { clientHeight, scrollHeight } = this.flexDataTableBody;

    return scrollHeight > clientHeight;
  }

  STYLE_SHEET = {
    container: {
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    },
    sortBtn: {
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)'
    },
    sortTriangleUp: {
      display: 'block',
      fontSize: '12px',
      lineHeight: 1,
      transformOrigin: '50% 50%',
      transform: 'translateY(3px) scale(.75)'
    },
    sortTriangleDown: {
      display: 'block',
      fontSize: '12px',
      lineHeight: 1,
      transformOrigin: '50% 50%',
      transform: 'translateY(-3px) scale(.75)'
    },
    idField: {
      flex: '0 0 50px',
      width: '50px'
    },
    loadMoreIcon: {
      fontSize: '12px',
      position: 'absolute',
      right: '1px',
      top: '50%'
    }
  }
}

export default FlexDataTable;
