import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

class OssUpload extends React.Component {
  static propTypes = {
    uuid: PropTypes.number,                 // key
    token: PropTypes.shape({                // oss Clinet token
      accessKeyId: PropTypes.string,
      accessKeySecret: PropTypes.string,
      stsToken: PropTypes.string
    }),
    fileExtension: PropTypes.oneOfType([    // 文件支持后缀
      PropTypes.string,
      PropTypes.array
    ]),
    mbSize: PropTypes.number,          // 文件大小 单位[mb]
    ossFolderName: PropTypes.string,        // 文件存储 文件夹名字
    onBefore: PropTypes.func,               // 上传前
    onSuccess: PropTypes.func,              // 上传后 [包括 失败]
  };

  static defaultProps = {
    fileExtension: ['.xlsx', '.xls'],
    mbSize: 10
  };

  constructor(props) {
    super(props);
    this.state = {
      uuid: new Date().getTime()
    }

    this.OSS_REGION = 'oss-cn-shenzhen'   // OSS
    this.OSS_BUCKET = 'dmp-test'          // OSS
  }

  componentWillReceiveProps(nextProps) {
    const { uuid, token } = this.props
    if (nextProps.uuid && uuid !== nextProps.uuid || !token && nextProps.token) {
      this.setState({
        uuid: new Date().getTime()
      })
    }
  }

  render() {
    const { uuid } = this.state
    return <div className="oss-upload-wrap" key={uuid}>

      <input type="file" ref={(instance) => { this.ossInput = instance }} onChange={this.handleUpload.bind(this)}/>
    </div>
  }

  // 实例化 oss
  initOss() {
    const { token } = this.props
    return token ? new OSS.Wrapper({
      region: this.OSS_REGION,
      accessKeyId: token.accessKeyId,
      accessKeySecret: token.accessKeySecret,
      stsToken: token.stsToken,
      bucket: this.OSS_BUCKET
    }) : null;
  }

  // 上传
  handleUpload(e) {
    const { onBefore, onSuccess } = this.props

    const file = e.target
    // oss 对象初始化失败
    const check_ossInit = this.checkOssInit();
    const check_ossExt = this.checkOssExt(file.value);
    const check_ossFileSize = this.checkOssFileSize(file);

    Promise.all([check_ossInit, check_ossExt, check_ossFileSize]).then(() => {
      onSuccess('上传成功！')
    }).catch((error) => {
      onBefore(error)
    })
  }

  // 检测是否 初始化失败
  checkOssInit() {
    // 为了避免文件上传有阻塞，所以oss对象不做缓存
    this.ossClient = this.initOss()

    return new Promise((resolve, reject) => {
      if (!this.ossClient) {
        reject('oss 初始化失败！')
      } else {
        resolve()
      }
    })
  }

  // 检测文件后缀
  checkOssExt(fileName) {
    // 文件后缀 不符合要求
    const _ext = fileName.substring(fileName.lastIndexOf('.'), fileName.length).toLowerCase();
    return new Promise((resolve, reject) => {
      // 是否为有效后缀
      const isValidExt = this.props.fileExtension.indexOf(_ext) > -1
      if (isValidExt) {
        resolve();
      } else {
        reject(`格式错误！支持格式（${this.props.fileExtension.toString()}）`)
      }
    })
  }

  // 检测文件大小
  checkOssFileSize(file) {
    const { mbSize } = this.props

    return new Promise((resolve, reject) => {
      let isValidSize = false;
      if (this._isMSIE()) {
        const img = new Image();
        img.src = file.value;
        isValidSize = img.fileSize < mbSize * 1024 * 1024
      } else {
        isValidSize = file.files[0].size < mbSize * 1024 * 1024
      }

      if (!isValidSize) {
        let error = `文件应小于（ ${mbSize}MB ）！`
        if (mbSize < 1) {
          error = `文件应小于（ ${mbSize * 1000}KB ）！`
        }
        reject(error)
      } else {
        resolve()
      }
    })
  }

  _isMSIE() {
    return navigator.userAgent.indexOf('MSIE') >= 0
  }
}

export default OssUpload
