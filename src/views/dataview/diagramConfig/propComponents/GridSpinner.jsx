import React from 'react'
import PropTypes from 'prop-types'

import NumberInput from '../../../../components/NumberInput'

import _ from 'lodash'
import classnames from 'classnames'

class GridSpinner extends React.Component {
  static propTypes = {
    data: PropTypes.bool,
    indent: PropTypes.bool,                  // 需要缩进(是否为二级)
    onChange: PropTypes.func,
    options: PropTypes.arrayOf(PropTypes.shape({
      max: PropTypes.number,
      min: PropTypes.number,
      step: PropTypes.number,
      name: PropTypes.string.isRequired,
      label: PropTypes.string
    })).isRequired
  };

  static defaultProps = {
    indent: false,
    options: []
  };

  constructor(props) {
    super(props)
    const [key1, key2, key3, key4] = props.options
    if (key1 && key2 && key3 && key4) {
      this.state = {
        [key1.name]: (props.data && props.data[key1.name]) || '',
        [key2.name]: (props.data && props.data[key2.name]) || '',
        [key3.name]: (props.data && props.data[key3.name]) || '',
        [key4.name]: (props.data && props.data[key4.name]) || ''
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const { data } = nextProps
    if (!_.isEqual(this.props.data, data)) {
      const [key1, key2, key3, key4] = nextProps.options
      if (key1 && key2 && key3 && key4) {
        this.setState({
          [key1.name]: (data && data[key1.name]) || '',
          [key2.name]: (data && data[key2.name]) || '',
          [key3.name]: (data && data[key3.name]) || '',
          [key4.name]: (data && data[key4.name]) || ''
        })
      }
    }
  }

  render() {
    const { options, indent } = this.props
    const data = this.state
    const [key1, key2, key3, key4] = options
    const columnClass = classnames('layout-config-column double-col', {
      sub: indent
    })

    if (!(key1 && key2 && key3 && key4)) {
      return null
    }

    return (
      <div className="content">
        <div className={columnClass}>
          <div className="layout-config-double-col-sub">
            <span className="layout-config-column-title">{key1.label}</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={key1.min}
              maxValue={key1.max}
              step={key1.step}
              value={data[key1.name]}
              onChange={this.handleChange.bind(this, key1.name)}
            />
          </div>
          <div className="layout-config-double-col-sub">
            <span className="layout-config-column-title">{key2.label}</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={key2.min}
              maxValue={key2.max}
              step={key2.step}
              value={data[key2.name]}
              onChange={this.handleChange.bind(this, key2.name)}
            />
          </div>
        </div>
        <div className={columnClass}>
          <div className="layout-config-double-col-sub">
            <span className="layout-config-column-title">{key3.label}</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={key3.min}
              maxValue={key3.max}
              step={key3.step}
              value={data[key3.name]}
              onChange={this.handleChange.bind(this, key3.name)}
            />
          </div>
          <div className="layout-config-double-col-sub">
            <span className="layout-config-column-title">{key4.label}</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={key4.min}
              maxValue={key4.max}
              step={key4.step}
              value={data[key4.name]}
              onChange={this.handleChange.bind(this, key4.name)}
            />
          </div>
        </div>
      </div>
    )
  }

  // 输入
  handleChange(field, value) {
    this.setState(preState => ({
      ...preState,
      [field]: value
    }), () => {
      this.props.onChange(this.state)
    })
  }
}

export default GridSpinner
