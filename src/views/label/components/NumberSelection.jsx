import React from 'react'
import PropTypes from 'prop-types'
import Input from 'react-bootstrap-myui/lib/Input';
import './number-selection.less';

const NUMBER_OPERATORS = ['+', '-', '*', '/', '(', ')', '>', '=', '<', '>=', '<=', '输入框']

export default class NumberSelection extends React.Component {
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
    const { info } = this.state
    return (
      <div className="number-selection">
        <div className="operate-bar">
          {
            NUMBER_OPERATORS.map((item, key) => (
              <div key={`number-operator-${key}`} className="item" onClick={this.handleClick.bind(this, item)}>
                {item}
              </div>
            ))
          }
        </div>
        <div className="main-body">
          {
            info && info.map((item, key) => {
              const value = (item.type && item.type === '数值') ? item.name : item.value
              return item.type && item.type === 'input' ? (
                <div className="cell form">
                  <Input
                    type="text"
                    value={value}
                    style={{ width: '80px' }}
                    onChange={this.handleChange.bind(this, key)}
                  />
                  <i className="circle-del" onClick={this.handleDelete.bind(this, key)}/>
                </div>
              ) : (
                <div className="cell">
                  <span>{value}</span>
                  <i className="circle-del" onClick={this.handleDelete.bind(this, key)}/>
                </div>
              );
            })
          }
        </div>
      </div>
    );
  }

  handleChange(index, e) {
    this.state.info[index].value = e.target.value
    this.setState({ ...this.state }, () => {
      // 通过回调。同步父组件
      this.props.onChange && this.props.onChange(this.state.info)
    })
  }

  handleDelete(index) {
    this.state.info.splice(index, 1)
    this.setState({ ...this.state }, () => {
      // 通过回调。同步父组件
      this.props.onChange && this.props.onChange(this.state.info)
    })
  }

  handleClick(value) {
    const item = value === '输入框' ? {
      type: 'input',
      value: ''
    } : {
      type: 'operator',
      value
    }

    this.state.info.push(item)
    this.setState({ ...this.state }, () => {
      // 通过回调。同步父组件
      this.props.onChange && this.props.onChange(this.state.info)
    })
  }
}
