import React from 'react'
import PropTypes from 'prop-types'
import Select from 'react-bootstrap-myui/lib/Select';
import Input from 'react-bootstrap-myui/lib/Input';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import './dim-selection.less';

const DESCRIBE_OPERATORS = ['like', '!=', '=']

export default class DescribeSelection extends React.Component {
  /*
    {
      id: '',
      name: '',
      operator: '!=', // 操作
      value: '',          // 选择的维度值      
    }
   */
  static propTypes = {
    info: PropTypes.array,
    getComponent: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      info: []
    }
  }

  componentDidMount() {
    const { getComponent, info } = this.props
    if (info) {
      const data = []
      info.forEach((item) => {
        data.push({ ...item })
      })
      this.setState({
        ...this.state,
        info: data
      })
    }
    // 通过回调。将子组件完全暴露给父组件，便于同步信息到父组件存储
    getComponent && getComponent(this)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps && nextProps.info) {
      const data = []
      nextProps.info.forEach((item) => {
        data.push({ ...item })
      })
      this.setState({
        ...this.state,
        info: data
      })
    }
  }

  render() {
    const info = this.state.info

    return (
      <div className="dim-selection">
        {
          info && info.map((item, key) => (
            <div className="row" key={`describ-item-${key}`}>
              <div className="cell indicator">
                <OverlayTrigger placement="bottom" overlay={<Tooltip>{item.name}</Tooltip>}>
                  <span>{item.name}</span>
                </OverlayTrigger>
              </div>
              <div className="cell operator">
                <Select
                  value={item.operator || ''}
                  openSearch
                  maxHeight={180}
                  width={80}
                  onSelected={this.handleSelect.bind(this, key)}
                >
                  {
                    DESCRIBE_OPERATORS.map((operator, i) => (
                      <option key={`operator-${i}`} value={operator}>{operator}</option>
                    ))
                  }
                </Select>
              </div>
              <div className="cell value form">
                <Input
                  type="text"
                  style={{ width: '140px' }}
                  value={item.value}
                  onChange={this.handleChangeValue.bind(this, key)}
                />
              </div>
              <i className="circle-del" onClick={this.handleDelete.bind(this, key)} />
            </div>
          ))
        }
      </div>
    );
  }

  handleSelect(index, option) {
    // operator, 如果 operate 更换的时候
    this.state.info[index].operator = option.value
    this.setState({
      ...this.state
    }, () => {
      // 通过回调。同步父组件
      this.props.onChange && this.props.onChange(this.state.info)
    })
  }

  handleChangeValue(index, e) {
    this.state.info[index].value = e.target.value
    this.setState({
      ...this.state
    }, () => {
      // 通过回调。同步父组件
      this.props.onChange && this.props.onChange(this.state.info)
    })
  }

  // 删除
  handleDelete(index) {
    this.state.info.splice(index, 1)
    this.setState({
      ...this.state
    }, () => {
      // 通过回调。同步父组件
      this.props.onChange && this.props.onChange(this.state.info)
    })
  }
}
