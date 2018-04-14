import React from 'react'
import PropTypes from 'prop-types'

import Input from 'react-bootstrap-myui/lib/Input'

import _ from 'lodash'

import BackgroundUploader from '../../components/BackgroundUploader'

/*
  简单单图-图片配置项
*/
class SimpleImageConfig extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func,
    onUpload: PropTypes.func,
    showErr: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      uploaderUuid: new Date().getTime(),
      data: {
        url: props.configInfo && props.configInfo.url,
        ratioLock: props.configInfo && props.configInfo.ratioLock
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.configInfo, nextProps.configInfo)) {
      this.setState({
        uploaderUuid: new Date().getTime(),
        data: _.cloneDeep(nextProps.configInfo)
      })
    }
  }

  render() {
    const { uploaderUuid } = this.state
    const { url, ratioLock } = this.state.data

    return (
      <div className="content">
        <div className="layout-config-column">
          <span className="layout-config-column-title">图片</span>
          <BackgroundUploader
            uuid={uploaderUuid}
            height={30}
            defaultURI={url}
            mbSize={2}
            imgText="图片"
            btnText="上传图片"
            onUpload={this.props.onUpload}
            onSuccess={this.handleUploadSimpleImageSuccess.bind(this)}
            onFailure={this.handleUploadImgFailure.bind(this)}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title">锁定比例</span>
          <div style={{ textAlign: 'right' }} className="checkbox-container">
            <Input
              type="checkbox"
              label=" "
              checked={ratioLock}
              onChange={this.handleChangeRatioLock.bind(this)}
            />
          </div>
        </div>
      </div>
    )
  }

  // 变更比例锁定
  handleChangeRatioLock() {
    this.setState(preState => ({
      data: {
        ...preState.data,
        ratioLock: !preState.data.ratioLock
      }
    }), () => {
      this.props.onChange('image', 'ratioLock', this.state.data.ratioLock)
    })
  }

  // 上传图片成功
  handleUploadSimpleImageSuccess(data) {
    this.setState(preState => ({
      data: {
        ...preState.data,
        url: data.data
      }
    }))
    this.props.onChange('image', 'url', data.data)
  }

  // 上传图片失败
  handleUploadImgFailure(errMsg) {
    this.props.showErr(errMsg)
    this.setState({
      uploaderUuid: new Date().getTime()
    })
  }
}

export default SimpleImageConfig
