import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';
import isEqual from 'lodash/isEqual';

const FormImageUploader = createReactClass({
  displayName: 'FormImageUploader',

  propTypes: {
    // 唯一id
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    // 默认图片
    defaultURI: PropTypes.string,
    // 文件最大限制
    mbSize: PropTypes.number,
    // 预览框体大小
    width: PropTypes.number,
    height: PropTypes.number,
    // 是否显示还原为默认图按钮
    onCancel: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.bool
    ]),
    tipText: PropTypes.string,
    // 上传方法
    onUpload: PropTypes.func,
    // 上传成功和失败回调
    onSuccess: PropTypes.func,
    onFailure: PropTypes.func
  },

  getDefaultProps() {
    return {
      uuid: new Date().getTime(),
      mbSize: 2,
      onCancel: false,
      height: 100,
      width: 100
    }
  },

  getInitialState() {
    return {
      uuid: this.props.uuid,
      uploadPending: false,
      uploadUrl: ''
    }
  },

  componentWillReceiveProps(nextProps) {
    const { uuid } = this.props
    if (nextProps.uuid && uuid !== nextProps.uuid) {
      this.setState({
        uploadUrl: '',
        uuid: nextProps.uuid
      })
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    return !isEqual(this.state, nextState)
  },

  render() {
    const { width, height, defaultURI, onCancel, tipText, style } = this.props

    const { uuid, uploadUrl, uploadPending } = this.state

    // 定义图片预览区样式
    const wrapperStyle = {
      width: `${width + 2}px`,
      height: `${height + 2}px`,
      position: 'relative',
      lineHeight: `${height}px`,
      cursor: 'pointer',
      float: 'left'
    };

    const loadingContainerStyle = {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: '100%',
      height: '100%',
      zIndex: 999
    };

    const fSize = Math.floor(height / 6);

    const loadingStyle = {
      fontSize: `${fSize * 2}px`,
      position: 'absolute',
      left: '50%',
      top: '50%',
      marginLeft: `-${fSize}px`,
      marginTop: `-${fSize}px`
    };

    const tips = tipText.split('\n').map((item, index) => (
      <p key={`form-upload-tip-${uuid}-${index}`} style={{ padding: '0px', margin: '0px' }}>{item}</p>
    ));

    return (
      <div className="my-form-upload" style={{ ...style, ...this.STYLE_SHEET.container }} key={`my-form-upload-${uuid}`}>
        <div className="upload-btn-image-wrapper" style={wrapperStyle} id="upload-btn-image-wrapper">
          {
            uploadUrl ? (
              <img src={`${uploadUrl}?x-oss-process=image/resize,m_fixed,h_${height},w_${width}`} />
            ) : (
              defaultURI ? (
                <img src={`${defaultURI}?x-oss-process=image/resize,m_fixed,h_${height},w_${width}`} />
              ) : (
                !uploadPending ? (
                  <div className="upload-btn-add" style={this.STYLE_SHEET.btnBox} onClick={this.handleClick}>
                    <i className="dmpicon-add" style={this.STYLE_SHEET.btnAddIcon}></i>
                  </div>
                ) : null
              )
            )
          }
          {
            !uploadPending && (!!uploadUrl || !!defaultURI) ? (
              <div className="upload-btn-box" style={{ ...this.STYLE_SHEET.btnBox, ...this.STYLE_SHEET.btnEditBox }}>
                <button type="button" className="circle-btn upload-btn-edit" onClick={this.handleClick}>
                  <i className="dmpicon-edit"></i>
                </button>
                {
                  typeof onCancel === 'function' ? (
                    <button type="button" className="circle-btn upload-btn-cancel" onClick={this.handleReset}>
                      <i className="dmpicon-del"></i>
                    </button>
                  ) : null
                }
              </div>
            ) : null
          }
          {
            uploadPending && (
              <div style={loadingContainerStyle}>
                <span className="fontelloicon glyphicon-spinner" style={loadingStyle} />
              </div>
            )
          }
        </div>
        <div style={this.STYLE_SHEET.tipText}>
          {tips}
        </div>
        <input type="file"
          name="image_file"
          id="image_file"
          accept="image/png,image/gif,image/jpeg,image/x-ms-bmp,image/bmp"
          style={this.STYLE_SHEET.input}
          key={`my-form-upload-input-${uuid}`}
          ref={(node) => { this.myFormUploadInput = node }}
          onChange={this.beforeUpload}
        />
      </div>
    )
  },

  handleClick() {
    this.myFormUploadInput.click()
  },

  // 还原背景图
  handleReset() {
    this.setState({
      uploadPending: false,
      uploadUrl: '',
      uuid: new Date().getTime()
    });
    typeof this.props.onCancel === 'function' && this.props.onCancel();
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
    const { onUpload, onSuccess, onFailure } = this.props;

    if (file) {
      this.setState({
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
    btnBox: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      left: 0,
      top: 0,
      zIndex: 10
    },
    btnAddIcon: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '34px',
      transition: 'color .2s'
    },
    btnEditBox: {
      transition: 'opacity .2s',
      justifyContent: 'center',
      alignItems: 'center'
    },
    tipText: {
      padding: '10px 20px',
      fontSize: '14px',
      lineHeight: '30px',
      float: 'left',
      color: '#698EBB'
    }
  },
})

export default FormImageUploader;
