import React from 'react'
import PropTypes from 'prop-types'

import EmptyStatus from '@components/EmptyStatus'

class AppError extends React.PureComponent {
  static propTypes = {
    onChangeLayoutVisibility: PropTypes.func,
    params: PropTypes.object
  };

  componentWillMount() {
    const { onChangeLayoutVisibility } = this.props
    // 隐藏主框架布局
    onChangeLayoutVisibility({
      hidePageHeader: true,
      hideSideMenu: true
    })
  }

  render() {
    return (
      <EmptyStatus
        icon="dmpicon-empty-report"
        textSize="20px"
        text={this._getErrorText()}
      />
    )
  }

  // 根据错误类型取得对应的提示文字
  _getErrorText() {
    if (this.props.params.type === 'notfound') {
      return '该应用未启用或已被删除'
    }
    return '该应用未启用或已被删除'
  }
}

export default AppError;
