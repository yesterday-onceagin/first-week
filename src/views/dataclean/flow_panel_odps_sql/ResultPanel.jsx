import React from 'react'
import PropTypes from 'prop-types'

import { Table, Column, Cell } from 'fixed-data-table';
// 加载插件样式
import 'fixed-data-table/dist/fixed-data-table.css';

const OrderCell = ({ rowIndex, data }) => (
  <span className="result-table-cell order-number">{data[rowIndex]}</span>
)

const TextCell = ({ rowIndex, data, columnKey }) => (
  <span className="result-table-cell">{data[rowIndex][columnKey]}</span>
)

class ResultPanel extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    size: PropTypes.object,
    resultData: PropTypes.object,
    resultType: PropTypes.string
  };

  static defaultProps = {
    show: false,
    resultData: {
      header: [],
      body: []
    }
  };

  constructor(props) {
    super(props);

    this.state = {
      columnWidths: {}
    };
  }

  render() {
    const { show, resultType } = this.props;

    const containerStyle = {
      width: '100%',
      height: '100%',
      display: show ? 'block' : 'none',
      overflow: 'hidden'
    };

    if (resultType === 'Query_SQL') {
      return this.renderQuerySql(containerStyle)
    } else if (resultType === 'Desc_SQL') {
      return this.renderDescSql(containerStyle)
    }

    return (<div style={containerStyle}/>)
  }

  renderQuerySql(containerStyle) {
    const { size, resultData } = this.props;
    const columnWidths = this.state.columnWidths;
    const tableHeader = resultData.header;
    const tableBody = resultData.body;
    const tableOrder = Array.isArray(tableBody) && tableBody.length > 0 ? tableBody.map((a, i) => (i + 1)) : [];

    return (
      <div style={containerStyle}>
        <Table rowHeight={25}
          headerHeight={30}
          rowsCount={tableBody.length}
          onColumnResizeEndCallback={this._onColumnResizeEndCallback.bind(this)}
          isColumnResizing={false}
          width={size.width}
          height={size.height}
        >
          <Column
            header={<Cell>序号</Cell>}
            cell={<OrderCell data={tableOrder}/>}
            width={50}
            isResizable={false}
          />
          {
            tableHeader.map((item, index) => (
              <Column
                key={`table-column-${index}`}
                header={<Cell>{item}</Cell>}
                cell={<TextCell data={tableBody}/>}
                columnKey={index}
                width={columnWidths[index] || 150}
                isResizable={true}
                maxWidth={1200}
                minWidth={100}
              />
            ))
          }
          <Column
            header={<Cell></Cell>}
            width={350}
            isResizable={false}
          />
        </Table>
        {
          tableBody.length === 0 ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              width: '100%'
            }}>
              没有可显示的数据
            </div>
          ) : null
        }
      </div>
    );
  }

  // 渲染desc-sql任务结果
  renderDescSql(containerStyle) {
    const { resultData } = this.props;

    const text = resultData.split('\n');

    const content = text.length <= 1 && !text[0] ? (
      <li style={{ width: '100%', height: '25px', lineHeight: '25px' }}>没有可显示的数据</li>
    ) : (
      text.map((t, i) => (
        <li key={i} style={{ width: '100%', height: '25px', lineHeight: '25px' }}>{t}</li>
      ))
    )

    return (
      <div style={containerStyle}>
        <ul style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
          {content}
        </ul>
      </div>
    )
  }

  // 改变当前表格大小的时候进行操作
  _onColumnResizeEndCallback(newColumnWidth, columnKey) {
    this.setState(({ columnWidths }) => ({
      columnWidths: {
        ...columnWidths,
        [columnKey]: newColumnWidth,
      }
    }));
  }
}

export default ResultPanel
