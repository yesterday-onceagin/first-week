import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import BackgroundUploader from '../../components/BackgroundUploader'

class ImageUploader extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    onChange: PropTypes.func,
    onUpload: PropTypes.func,
    showErr: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      uploaderUuid: new Date().getTime(),
      url: props.data || ''
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        uploaderUuid: new Date().getTime(),
        url: nextProps.data || ''
      })
    }
  }

  render() {
    const { uploaderUuid, url } = this.state
    const { onUpload } = this.props

    return (
      <BackgroundUploader
        uuid={uploaderUuid}
        height={30}
        defaultURI={url}
        mbSize={2}
        imgText="图片"
        btnText="上传图片"
        onUpload={onUpload}
        onSuccess={this.handleUploadSimpleImageSuccess.bind(this)}
        onFailure={this.handleUploadImgFailure.bind(this)}
      />
    )
  }

  // 上传图片成功
  handleUploadSimpleImageSuccess(data) {
    this.setState({
      url: data.data
    }, () => {
      this.props.onChange(this.state.url)
    })
  }

  // 上传图片失败
  handleUploadImgFailure(errMsg) {
    this.props.showErr(errMsg)
    this.setState({
      uploaderUuid: new Date().getTime()
    })
  }
}

export default ImageUploader
