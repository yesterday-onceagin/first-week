import React from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button';

import './finish-page.less';

class FinishPage extends React.Component {
  static propTypes = {
    onGoList: PropTypes.func, //  返回
    onDone: PropTypes.func, //  完成
  }

  render() {
    const { onGoList, onDone } = this.props
    return <div style={this.STYLE_SHEET.page} className="finish-page-detail">
      <div className="main-wrap" style={this.STYLE_SHEET.main}>
        <i className="dmpicon-done" style={this.STYLE_SHEET.icon}/>
        <p style={this.STYLE_SHEET.text} className="title">保存成功</p>
        <p className="subtitle">数据集已创建，可以去做报告了</p>

        <div className="footer" style={this.STYLE_SHEET.footer}>
          <Button bsStyle="default" onClick={onDone}>去做报告</Button>
          <Button bsStyle="default" onClick={onGoList}>返回列表</Button>
        </div>
      </div>
     
    </div>
  }

  STYLE_SHEET = {
    page: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      flex: '1'
    },
    main: {
      textAlign: 'center',
      fontSize: '14px',
    },
    icon: {
      fontSize: '80px',
      color: '#1FC659'
    },
    text: {
      fontSize: '20px',
      marginTop: '30px'
    },
    footer: {
      position: 'static',
      marginTop: '80px'
    }
  };
}

export default FinishPage
