import React from 'react'
import PropTypes from 'prop-types'
import SearchInput from './SearchInput';
import Loading from 'react-bootstrap-myui/lib/Loading';
import classnames from 'classnames';

class MapColumnTable extends React.Component {
  static propTypes = {
    /**
     * data 数组
     */
    data: PropTypes.array,
    /**
     * col 列名
     */
    cols: PropTypes.array,
    /**
     * 事件 切换导航
     */
    onChange: PropTypes.func,
    /**
     * loading 
     */
    pending: PropTypes.bool,
    className: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.state = {
      uuid: new Date().getTime(),
      data: [],
      // 排序方式 默认按照总数
      sortOpts: {
        key: '总数',
        func: 'desc'
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps && nextProps.data) {
      this.setState({
        data: nextProps.data.slice()
      });
    }
  }

  componentDidMount() {
    const { data } = this.props;
    this.setState({
      data: data ? data.slice() : []
    })
  }

  render() {
    const { className, cols, pending, ...otherProps } = this.props;
    const { uuid, sortOpts, data } = this.state;


    return (
      <div className={classnames('map-column-table data-table-wrapper', className)}
        {...otherProps}
        ref={`map-column-table_${uuid}`}
        id={`map-column-table_${uuid}`}
      >
        <table className="data-table">
          <thead>
            <tr>
              {
                cols.map(item => (
                  item === '指标值' || item === '总数' ? (
                    <th onClick={this.handleSortTable.bind(this, item)} style={{
                      position: 'relative',
                      cursor: 'pointer',
                      borderRightWidth: '1px',
                      borderRightStyle: 'solid'
                    }}>
                      {item}
                      <span className={`sort-opts ${sortOpts.key === item ? sortOpts.func : ''}`} style={{
                        display: 'block',
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}>
                        <i className="dmpicon-triangle-up" style={{
                          transformOrigin: 'center',
                          transform: 'translateY(3px) scale(.75)',
                          fontSize: '12px',
                          lineHeight: 1,
                          display: 'block'
                        }} />
                        <i className="dmpicon-triangle" style={{
                          transformOrigin: 'center',
                          transform: 'translateY(-3px) scale(.75)',
                          fontSize: '12px',
                          lineHeight: 1,
                          display: 'block'
                        }} />
                      </span>
                    </th>
                  ) : (
                    <th>{item}</th>
                  )
                ))
              }
            </tr>
          </thead>
          <tbody>
            {
              Array.isArray(data) && data.length > 0 ? data.map((item, i) => (
                <tr key={`map-column-table-tbody-tr-${i}`}>
                  <td>
                    <span title={item.value || ''} className="overflow">
                      {item.value || ''}
                    </span>
                  </td>
                  <td>
                    <span title={item.total_record || ''} className="overflow">
                      {item.total_record || ''}
                    </span>
                  </td>
                  <td width="100" >
                    <SearchInput
                      value={item.map || ''}
                      container={otherProps.container}
                      data={item.maps}
                      onChange={this.handleChange.bind(this, i)}
                      onSelectItem={this.handleSelect.bind(this, i)}
                    />
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3">
                    <div className="nothing">{!pending ? '暂无指标值！' : ''}</div>
                  </td>
                </tr>
              )
            }
            <Loading show={pending} containerId={`map-column-table_${uuid}`} />
          </tbody>
        </table>
      </div>
    );
  }

  // 列表排序方式切换
  handleSortTable(key) {
    const { sortOpts } = this.state;

    // 如果点击的是当前正在排序的列
    if (key === sortOpts.key) {
      sortOpts.func = sortOpts.func === 'desc' ? 'asc' : 'desc';
    } else {
      sortOpts.key = key;
      sortOpts.func = 'desc';
    }

    this.setState({
      sortOpts,
      data: this._getSortData(sortOpts, this.state.data)
    }, () => {
      this.props.onChange(this.state.data);
    });
  }

  handleChange(index, e) {
    e.stopPropagation();

    const newData = this.state.data.concat();
    newData[index].map = e.target.value;

    this.setState({
      data: newData
    }, () => {
      // 复位 maps 数据
      this.props.onChange(this.state.data)
    })
  }

  handleSelect(index, item) {
    this.state.data[index].map = item.name;
    this.setState({
      ...this.state
    }, () => {
      this.props.onChange(this.state.data)
    })
  }

  // 获取排序后的数据
  _getSortData(sortOpts, data) {
    // 无数据返回空数组
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const { key, func } = sortOpts;

    let _key = 'total_record';

    switch (key) {
      case '指标值':
        _key = 'value';
        break;
      case '总数':
        _key = 'total_record';
        break;
      default:
        break;
    }

    data.sort((a, b) => {
      let value_1 = a[_key];
      let value_2 = b[_key];

      if (!Number.isNaN(Number.parseInt(value_1, 10))) {
        value_1 = Number.parseInt(value_1, 10);
        value_2 = Number.parseInt(value_2, 10);
      }

      if (value_1 > value_2) {
        return func === 'desc' ? -1 : 1;
      } else if (value_1 < value_2) {
        return func === 'desc' ? 1 : -1;
      }
      return 0;
    });

    return data;
  }
}

export default MapColumnTable
