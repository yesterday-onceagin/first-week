import React from 'react'
import PropTypes from 'prop-types'

export default class PosConfig extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    // if (window.__saveMapOption__) {
    //   console.warn('window.__saveMapOption__ 已经存在!')
    // } else {
    //   this._savePosValue = this.savePosValue.bind(this)
    //   window.__saveMapOption__ = this._savePosValue
    // }
  }

  componentWillUnmount() {
    // if (window.__saveMapOption__ === this._savePosValue) {
    //   window.__saveMapOption__ = null
    // }
  }

  render() {
    return <div></div>
  }

  savePosValue(center, zoom) {
    const { data } = this.props
    this.props.onChange({
      ...data,
      center,
      zoom
    })
  }
}
