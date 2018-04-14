import React from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import Input from 'react-bootstrap-myui/lib/Input';
import Overlay from 'react-bootstrap-myui/lib/Overlay';

class SearchInput extends React.Component {
  static propTypes = {
    /**
     * data 数组
     */
    data: PropTypes.array,
    /**
     * col 列名
     */
    value: PropTypes.string,
    /**
     * 事件 切换导航
     */
    onChange: PropTypes.func,
    onSelectItem: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      uuid: new Date().getTime(),
      show: false,
      value: props.value
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps) {
      this.setState({
        value: nextProps.value
      })
    }
  }

  render() {
    const { data, ...otherProps } = this.props
    const { value, show } = this.state
    const _data = data.filter(item => item.name.indexOf(value) > -1)
    const popoverBottom = (
      <Overlay
        show={show}
        onHide={() => this.setState({ show: false })}
        rootClose
        container={otherProps.container}
        placement="bottom"
        target={() => ReactDOM.findDOMNode(this.inputTarget)}
      >
        <div className="search-item-wrap">
          {
            _data && Array.isArray(_data) && _data.map((item, i) => (
              <div key={`search-item-${i}`}
                className={classnames('item', { active: item.name === value })}
                onClick={this.handleSelect.bind(this, item)}
              >
                {item.name}
              </div>
            ))
          }
        </div>
      </Overlay>
    );

    return (
      <div className="search-input-wrap">
        <div ref={(node) => { this.inputCloseRoot = node }} />
        <div className="form">
          <Input
            ref={(instance) => { this.inputTarget = instance }}
            type="text"
            className="search-input"
            value={value}
            {...otherProps}
            onClick={this.handleShow.bind(this)}
            onKeyDown={this.handleShow.bind(this)}
          />
        </div>
        {_data && _data.length > 0 && popoverBottom}
      </div>
    )
  }

  handleSelect(item) {
    this.props.onSelectItem(item)
    $(this.inputCloseRoot).click()
  }

  // Overlaytrigger 的定位坐标是基于 光标所传回来的 pageX + pageY
  // 因此现在改为 customerOverlay 自定义弹窗. pageX + pageY 
  handleShow() {
    this.setState({
      show: true
    })
  }
}

export default SearchInput
