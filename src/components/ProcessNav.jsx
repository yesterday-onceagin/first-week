import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames';

class ProcessNav extends React.Component {
  static propTypes = {
    /**
     * data 数组
     */
    data: PropTypes.array,
    /**
     * active, 当前停留的步骤
     */
    active: PropTypes.number,
    /**
     * 事件 切换导航
     */
    onClick: PropTypes.func,
    className: PropTypes.string
  };

  static defaultProps = {
    active: 0
  };

  constructor(props) {
    super(props);
    this.state = {
      uuid: new Date().getTime(),
      active: props.active
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      active: nextProps.active
    })
  }

  render() {
    const { data, className, ...otherProps } = this.props
    const { active } = this.state

    return (
      <div className={classnames('process-nav', className)} {...otherProps}>
        <ul>
          {
            Array.isArray(data) && data.length > 0 && data.map((item, i) => (
              <li key={i} className={classnames({ active: i <= active, current: i === active })}>
                <div className='mark'>{i + 1}</div>
                <div className="text">{item}</div>
              </li>
            ))
          }
        </ul>
      </div>
    )
  }

  setStep = (active) => {
    this.setState({
      active
    })
  };
}

export default ProcessNav
