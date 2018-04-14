import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';

import isEqual from 'lodash/isEqual';

import './background-uploader.less';

const BackgroundUploader = createReactClass({
  displayName: 'BackgroundUploader',

  propTypes: {
    // 唯一id
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    imgText: PropTypes.string,
    btnText: PropTypes.string,
    // 高度
    height: PropTypes.number,
    // 默认图片
    defaultURI: PropTypes.string,
    // 文件最大限制
    mbSize: PropTypes.number,
    // 上传方法
    onUpload: PropTypes.func,
    // 上传成功和失败回调
    onSuccess: PropTypes.func,
    onFailure: PropTypes.func,
    // 取消背景图
    onCancel: PropTypes.func
  },

  getDefaultProps() {
    return {
      uuid: new Date().getTime(),
      mbSize: 2,
      btnText: '添加背景图片'
    }
  },

  getInitialState() {
    return {
      uuid: this.props.uuid,
      uploadPending: false,
      uploadUrl: '',
    }
  },

  componentWillReceiveProps(nextProps) {
    const { uuid } = this.props
    if (nextProps.uuid && uuid !== nextProps.uuid) {
      this.setState({
        uuid: nextProps.uuid,
        uploadUrl: ''
      })
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    return !isEqual(this.state, nextState)
  },

  render() {
    const { defaultURI, height, imgText, onCancel, btnText } = this.props;

    const { uuid, uploadUrl, uploadPending } = this.state

    const cancelable = typeof onCancel === 'function'
    const width = Math.ceil(height * 1.5)

    return (
      <div className="dataview-background-uploader"
        style={{
          ...this.STYLE_SHEET.container,
          height: `${height}px`
        }}
        key={`dataview-background-uploader-${uuid}`}
      >
        <div className="upload-btn-image-wrapper"
          style={this.STYLE_SHEET.wrapperStyle}
          id="upload-btn-image-wrapper"
        >
          {
            uploadPending ? (
              <div style={this.STYLE_SHEET.loadingContainerStyle} className="loading-container">
                <span className="fontelloicon glyphicon-spinner" style={this.STYLE_SHEET.loadingStyle} />
              </div>
            ) : (
              uploadUrl ? (
                <div className="upload-image-container" style={this.STYLE_SHEET.imgC}>
                  <img src={`${uploadUrl}?x-oss-process=image/resize,m_fixed,h_${height},w_${width}`}
                    title={`更换${imgText}`}
                    onClick={this.handleClick}
                    style={{
                      ...this.STYLE_SHEET.showImg,
                      right: `${cancelable ? 28 : 0}px`,
                      width: `${width}px`,
                      height: `${height}px`
                    }}
                  />
                  {
                    cancelable && (
                      <i className="dmpicon-close"
                        style={this.STYLE_SHEET.colseBtn}
                        onClick={this.handleRemove}
                      />
                    )
                  }
                </div>
              ) : (
                defaultURI ? (
                  <div className="upload-image-container" style={this.STYLE_SHEET.imgC}>
                    <img src={`${defaultURI}?x-oss-process=image/resize,m_fixed,h_${height},w_${width}`} onClick={this.handleClick} style={{
                      ...this.STYLE_SHEET.showImg,
                      right: `${cancelable ? 28 : 0}px`,
                      width: `${width}px`,
                      height: `${height}px`
                    }} />
                    {
                      cancelable && (
                        <i className="dmpicon-close"
                          style={this.STYLE_SHEET.colseBtn}
                          onClick={this.handleRemove}
                        />
                      )
                    }
                  </div>
                ) : (
                  <div className="upload-btn-add"
                    style={{
                      ...this.STYLE_SHEET.btnBox,
                      lineHeight: `${height - 2}px`
                    }}
                    onClick={this.handleClick}
                  >
                    <i className="dmpicon-add" style={this.STYLE_SHEET.btnAddIcon} />
                    {btnText}
                  </div>
                )
              )
            )
          }
        </div>
        <input type="file"
          name="image_file"
          id="image_file"
          accept="image/png,image/gif,image/jpeg,image/x-ms-bmp,image/bmp"
          style={this.STYLE_SHEET.input}
          key={`dataview-background-uploader-input-${uuid}`}
          ref={(node) => { this.dataview_background_uploader_input = node }}
          onChange={this.beforeUpload}
        />
      </div>
    )
  },

  handleRemove(e) {
    e.stopPropagation();
    this.setState({
      uploadPending: false,
      uploadUrl: '',
      uuid: new Date().getTime()
    });
    this.props.onCancel();
  },

  handleClick() {
    this.dataview_background_uploader_input.click();
  },

  handleError(errText) {
    this.props.onFailure(errText);
  },

  // 上传前的处理 
  beforeUpload(e) {
    // 1、验证文件是否符合大小
    // 2、后缀是否是支持类型
    const file = e.target
    if (!!file.value && this._validateFileSize(file) && this._validateFileExt(file.value)) {
      // 进行文件上传
      this.onUploadImage(file);
    }
  },

  onUploadImage(file) {
    const _this = this;
    const { onUpload, onSuccess, onFailure } = this.props;

    if (file) {
      _this.setState({
        uploadPending: true
      });

      const fData = new FormData();
      fData.append('image_file', file.files[0]);

      onUpload(fData, (json) => {
        if (json.result) {
          this.setState({
            uploadPending: false,
            uploadUrl: json.data
          });
          onSuccess(json);
        } else {
          this.setState({
            uploadPending: false,
            uploadUrl: ''
          });
          onFailure(json.msg);
        }
      })
    }
  },

  // 校验文件大小
  _validateFileSize(file) {
    const { mbSize } = this.props;

    if (mbSize <= 0) {
      return true;
    }

    let isValidSize = false;

    if (this._isMSIE()) {
      const img = new Image();
      img.src = file.value;
      isValidSize = img.fileSize < mbSize * 1024 * 1024
    } else {
      isValidSize = file.files[0].size < mbSize * 1024 * 1024
    }

    if (!isValidSize) {
      if (mbSize < 1) {
        this.handleError(`文件应小于（ ${mbSize * 1000}KB ）！`);
      } else {
        this.handleError(`文件应小于（ ${mbSize}MB ）！`);
      }
    }

    return isValidSize;
  },

  // 检验文件 后缀
  _validateFileExt(fileName) {
    const ext = ['.jpeg', '.jpg', '.png', '.bmp', '.gif'];

    // 截取后缀
    const _ext = fileName.substring(fileName.lastIndexOf('.'), fileName.length).toLowerCase();
    // 是否为有效后缀
    const isValidExt = ext.indexOf(_ext) > -1

    const ext_msg = ext && Array.isArray(ext) ? ext.map(item => item.substr(1)).join('、') : ext

    if (!isValidExt) {
      this.handleError(`格式错误！支持格式（${ext_msg}）`)
    }

    return isValidExt
  },

  _isMSIE() {
    return navigator.userAgent.indexOf('MSIE') >= 0
  },

  STYLE_SHEET: {
    container: {
      position: 'relative',
      overflow: 'hidden'
    },
    wrapperStyle: {
      height: '100%',
      width: '100%',
      position: 'relative',
      cursor: 'pointer',
    },
    imgC: {
      position: 'relative',
      height: '100%',
      width: '100%'
    },
    input: {
      position: 'absolute',
      top: 0,
      right: 0,
      zIndex: 999,
      width: '9999px',
      height: '9999px',
      opacity: 0,
      cursor: 'pointer',
      display: 'none',
      outline: 'none'
    },
    showImg: {
      display: 'block',
      position: 'absolute',
      top: 0,
      borderWidth: '1px',
      borderStyle: 'solid'
    },
    colseBtn: {
      fontSize: '14px',
      position: 'absolute',
      right: 0,
      top: '7px',
      transition: 'color 0.3s'
    },
    btnBox: {
      width: '100%',
      height: '100%',
      borderWidth: '1px',
      borderStyle: 'dashed',
      textAlign: 'center',
      fontSize: '14px',
      transition: 'color 0.3s'
    },
    btnAddIcon: {
      paddingRight: '6px',
      fontSize: '15px',
      position: 'relative',
      top: '1px'
    },
    loadingContainerStyle: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      zIndex: 999,
      borderWidth: '1px',
      borderStyle: 'dashed'
    },
    loadingStyle: {
      fontSize: '12px',
      position: 'absolute',
      left: '50%',
      top: '50%',
      marginLeft: '-6px',
      marginTop: '-6px'
    }
  },
})


export default BackgroundUploader;
