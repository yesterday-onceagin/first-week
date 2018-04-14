import React from 'react'
import PropTypes from 'prop-types'

import NumberInput from '../../../../components/NumberInput'

export default class PaddingConfig extends React.Component {
  static propTypes = {
    padding: PropTypes.object,
    onChange: PropTypes.func,
  }

  render() {
    const { padding, onChange } = this.props
    return (<div>
      <div className="title">边距</div>
      <div className="content">
        <div className="layout-config-column double-col sub">
          <div className="layout-config-double-col-sub">
            <span className="layout-config-column-title">上</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={0}
              step={1}
              name="top"
              value={padding.top}
              onChange={onChange.bind(this, 'top')}
            />
          </div>
          <div className="layout-config-double-col-sub">
            <span className="layout-config-column-title">下</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={0}
              step={1}
              name="bottom"
              value={padding.bottom}
              onChange={onChange.bind(this, 'bottom')}
            />
          </div>
        </div>
        <div className="layout-config-column double-col sub">
          <div className="layout-config-double-col-sub">
            <span className="layout-config-column-title">左</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={0}
              step={1}
              name="left"
              value={padding.left}
              onChange={onChange.bind(this, 'left')}
            />
          </div>
          <div className="layout-config-double-col-sub">
            <span className="layout-config-column-title">右</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={0}
              step={1}
              name="right"
              value={padding.right}
              onChange={onChange.bind(this, 'right')}
            />
          </div>
        </div>
      </div>
    </div>)
  }
}
