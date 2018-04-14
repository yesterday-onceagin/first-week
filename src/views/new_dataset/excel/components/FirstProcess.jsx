import React from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import Loading from 'react-bootstrap-myui/lib/Loading';
import _ from 'lodash';

require('@libs/aliyun-sdk.min');
require('@libs/oss-js-upload');

const NO_OP = () => { }

class FirstProcess extends React.Component {
  static PropTypes = {
    ossToken: PropTypes.object,
    workSheets: PropTypes.array,
    fileExtension: PropTypes.oneOfType([    // 文件支持后缀
      PropTypes.string,
      PropTypes.array
    ]),
    onBefore: PropTypes.func,               // 上传前
    onSuccess: PropTypes.func,              // 上传后 [包括 失败]
    onNext: PropTypes.func
  };

  static defaultProps = {
    fileExtension: ['.xlsx', '.xls', '.csv'],
  };

  state = {
    uuid: new Date().getTime(),
    isEdit: false,
    file_name: '',
    selectSheets: [],
    pending: false,
    oss_url: ''
  }

  constructor(props) {
    super(props);

    if (props.initState) {
      this.state = {
        ...this.state,
        ...props.initState,
      }
    }

    this.EXT = ''
    this.OSS_MB = 10
    this.MAX_SHEET = 10
  }

  componentWillReceiveProps(nextProps) {
    const { initState, pending } = this.props
    if (!_.isEqual(nextProps.initState, initState)) {
      this.setState({
        ...this.state,
        ...nextProps.initState
      })
    }

    if (pending !== nextProps.pending) {
      this.setState({
        pending: nextProps.pending
      })
    }
  }

  render() {
    const { workSheet, ossToken } = this.props
    const { uuid, file_name, selectSheets, isEdit, pending } = this.state
    const disabled = selectSheets.length === 0 || workSheet.length === 0

    return <div className="excel-main form">
      <div className="main-wrap">
        <div className="row">
          <div className="col-md-2 col-label">
            上传文件:
          </div>
          <div className="col-md-8">
            <div className="input-wrap">
              <Input
                type="text"
                disabled
                value={file_name}
                ref={(instance) => { this.input = instance }}
              />
            </div>
            <p>
              1、支持xls、xlsx、csv格式文件<br />
              2、xls、xlsx文件大小不超过10M, csv文件不能超过100M<br />
              3、xls、xlsx数据量不能超过1W行（取前1W行）, csv格式不能超过10w行（取前10W行）<br />
              4、日期字段格式如：2017年12月18日或2017-12-18或2017/12/18<br />
              5、支持工作表10个以内
            </p>
          </div>
          <div className="col-md-2" style={{ paddingLeft: 0 }}>
            {
              ossToken && !pending && <span className="upload-btn">
                上传
                <input key={uuid} type="file" ref={(instance) => { this.ossInput = instance }} onChange={this.handleUpload.bind(this)} />
              </span>
            }
          </div>
        </div>
        <div className="row">
          <div className="col-md-2 col-label">
            选择工作表:
          </div>
          <div className="col-md-8">
            <div className="select-wrap" id="select-wrap">
              {!isEdit &&
                <div onClick={this.handleSelectAll.bind(this)}>
                  <Input type="checkbox" checked={workSheet && workSheet.length > 0 ? selectSheets.length === workSheet.length : false} onChange={NO_OP} /> 全选
                </div>
              }
              {
                workSheet && workSheet.map((item, index) => (
                  <div key={index} onClick={this.handleSelect.bind(this, index)}><Input type="checkbox" checked={selectSheets.indexOf(index) > -1} onChange={NO_OP} />{item}</div>
                ))
              }
              <Loading show={pending} conatinerId="select-wrap" />
            </div>
          </div>
        </div>
      </div>
      <div className="footer">
        <Button bsStyle="primary" disabled={disabled} onClick={this.handleNext.bind(this)}>下一步</Button>
      </div>
    </div>
  }

  handleNext(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    this.props.onNext({
      firstProcess: this.state
    })
  }

  handleSelectAll() {
    const selectSheets = this.state.selectSheets
    const arrs = this.props.workSheet ? this.props.workSheet.slice(0, this.MAX_SHEET).map((item, key) => key) : []
    const isAll = selectSheets.length === arrs.length

    this.setState({
      selectSheets: isAll ? [] : arrs
    })
  }

  handleSelect(pos) {
    let { isEdit, selectSheets } = this.state
    const exist = selectSheets.indexOf(pos) > -1

    if (exist) {
      const index = selectSheets.findIndex(item => item == pos)
      selectSheets.splice(index, 1)
    } else {
      // selectSheets
      if (selectSheets.length < this.MAX_SHEET) {
        if (!isEdit) {
          selectSheets.push(pos)
        } else {
          selectSheets = [pos]
        }
      } else {
        this.props.onBefore(`最多只允许${this.MAX_SHEET}选择个sheet表！`)
      }
    }

    this.setState({
      selectSheets
    })
  }

  // 上传
  handleUpload(e) {
    const { onBefore, onSuccess, ossToken } = this.props

    const file = e.target

    const check_ossExt = this.checkOssExt(file.value);
    const check_ossFileSize = this.checkOssFileSize(file);
    const check_ossInit = this.checkOssInit();                // oss 对象初始化失败

    Promise.all([check_ossExt, check_ossFileSize, check_ossInit]).then(() => {
      // start pending
      this.setState({ pending: true })

      const lastIndex = file.value.lastIndexOf('\\');
      const fileName = file.value.substr(lastIndex + 1)
      const random = `${new Date().getTime()}${parseInt(Math.random() * 1000)}`
      const storeAs = `upload-file/${random}/${fileName}`;  //命名空间

      this.ossUpload.upload({
        // 必传参数, 需要上传的文件对象
        file: file.files[0],
        // 必传参数, 文件上传到 oss 后的名称, 包含路径
        key: storeAs,
        // 上传失败后重试次数
        maxRetry: 3,
        headers: {
          CacheControl: 'public',
          Expires: '',
          ContentEncoding: '',
          ContentDisposition: '',
          // oss 支持的 header, 目前仅支持 x-oss-server-side-encryption
          ServerSideEncryption: ''
        },
        // 文件上传中调用, 可选参数
        onprogress() {
          /*console.log(res);*/
        },
        // 文件上传失败后调用, 可选参数
        onerror: (err) => {
          const error = typeof err === 'object' ? err.code : err
          this.props.onBefore(error)
        },
        // 文件上传成功调用, 可选参数
        oncomplete: () => {
          const url = `${ossToken.endpoint}/${storeAs}`

          this.setState({
            selectSheets: [],
            file_name: fileName,
            oss_url: url,
            uuid: new Date().getTime()
          })

          onSuccess('上传成功！', {
            file_name: fileName,
            oss_url: url,
            sheet_name: fileName.substr(0, fileName.length - this.EXT.length)
          }, this.EXT === '.csv')
        }
      });
    }).catch((error) => {
      this.setState({
        uuid: new Date().getTime()
      })
      onBefore(error)
    })
  }

  // 实例化 oss
  initOss() {
    const { ossToken } = this.props
    return ossToken ? new OssUpload({
      bucket: ossToken.bucket,
      endpoint: ossToken.endpoint,
      chunkSize: this.OSS_MB * 1048576,               // 启动分块上传的文件大小为 OSS_MB*1mb
      concurrency: 2,                                 // 分块上传的并发数
      stsToken: {
        RequestId: ossToken.request_id,
        AssumedRoleUser: {
          AssumedRoleId: ossToken.AssumedRoleId,
          Arn: ossToken.Arn
        },
        Credentials: {
          AccessKeySecret: ossToken.access_key_secret,
          AccessKeyId: ossToken.access_key_id,
          Expiration: ossToken.expiration,
          SecurityToken: ossToken.security_token
        }
      }
    }) : null;
  }

  // 检测是否 初始化失败
  checkOssInit() {
    // 为了避免文件上传有阻塞，所以oss对象不做缓存
    this.ossUpload = this.initOss()

    return new Promise((resolve, reject) => {
      if (!this.ossUpload) {
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
        this.OSS_MB = _ext === '.csv' ? 100 : 10
        this.EXT = _ext
        resolve();
      } else {
        reject(`格式错误！支持格式（${this.props.fileExtension.toString()}）`)
      }
    })
  }

  // 检测文件大小
  checkOssFileSize(file) {
    return new Promise((resolve, reject) => {
      let isValidSize = false;
      if (this._isMSIE()) {
        const img = new Image();
        img.src = file.value;
        isValidSize = img.fileSize < this.OSS_MB * 1024 * 1024
      } else {
        isValidSize = file.files[0].size < this.OSS_MB * 1024 * 1024
      }

      if (!isValidSize) {
        let error = `文件应小于（ ${this.OSS_MB}MB ）！`
        if (this.OSS_MB < 1) {
          error = `文件应小于（ ${this.OSS_MB * 1000}KB ）！`
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

export default FirstProcess
