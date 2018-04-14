import React from 'react'
import PropTypes from 'prop-types'
import Select from 'react-bootstrap-myui/lib/Select';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';

import './dim-selection.less';

const DIM_OPERATORS = ['=', '!=', 'in', 'not in']

export default class DimSelection extends React.Component {
  static propTypes = {
    info: PropTypes.array,
    onChange: PropTypes.func,
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

    return <div className="dim-selection">
      {
        info && info.map((item, key) => {
          // 如果同一组,operator为 【in, not in】则为 复选 
          const mode = item.operator && ['in', 'not in'].indexOf(item.operator) > -1 ? 'multiple' : 'single'

          return (
            <div className="row" key={`operator-item-${key}`}>
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
                  onSelected={this.handleSelect.bind(this, key, 'operator', false)}
                >
                  {
                    DIM_OPERATORS.map((operator, i) => (
                      <option key={`operator-${i}`} value={operator}>{operator}</option>
                    ))
                  }
                </Select>
              </div>
              <div className="cell dimension">
                <Select
                  value={item.value || ''}
                  openSearch
                  maxHeight={180}
                  width={140}
                  type={mode}
                  showMultipleBar={false}
                  hasIcon={mode === 'multiple'}
                  onSelected={this.handleSelect.bind(this, key, 'value', mode === 'multiple')}
                >
                  {
                    Array.isArray(item.dimension) && item.dimension.map((dimension, i) => (
                      <option key={`dimension-${i}`} value={dimension.id}>{dimension.name}</option>
                    ))
                  }
                </Select>
              </div>
              <i className="circle-del" onClick={this.handleDelete.bind(this, key)}/>
            </div>
          )
        })
      }
    </div>
  }

  handleSelect(index, mode, IsMultiple, option) {
    // operator, 如果 operate 更换的时候
    if (mode === 'operator' && this.state.info[index].operator !== option.value) {
      this.state.info[index].value = ''
    }
    this.state.info[index][mode] = IsMultiple ? option.map(item => item.value) : option.value
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
