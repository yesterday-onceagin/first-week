
(function () {
  const _extend = function (dst, src) {
    for (const i in src) {
      if (Object.prototype.hasOwnProperty.call(src, i) && src[i]) {
        dst[i] = src[i];
      }
    }
  };

  function OssUpload(config) {
    if (!config) {
      // console.log('需要 config');
      return;
    }
    this._config = {
      chunkSize: 1048576    // 1MB
    };

    if (this._config.chunkSize && this._config.chunkSize < 102400) {
      // console.log('chunkSize 不能小于 100KB');
      return;
    }

    _extend(this._config, config);

    if (!this._config.aliyunCredential && !this._config.stsToken) {
      // console.log('需要 stsToken');
      return;
    }

    if (!this._config.endpoint) {
      // console.log('需要 endpoint');
      return;
    }

    const ALY = window.ALY;
    if (this._config.stsToken) {
      this.oss = new ALY.OSS({
        accessKeyId: this._config.stsToken.Credentials.AccessKeyId,
        secretAccessKey: this._config.stsToken.Credentials.AccessKeySecret,
        securityToken: this._config.stsToken.Credentials.SecurityToken,
        endpoint: this._config.endpoint,
        apiVersion: '2013-10-15'
      });
    } else {
      this.oss = new ALY.OSS({
        accessKeyId: this._config.aliyunCredential.accessKeyId,
        secretAccessKey: this._config.aliyunCredential.secretAccessKey,
        endpoint: this._config.endpoint,
        apiVersion: '2013-10-15'
      });
    }

    const arr = this._config.endpoint.split('://');
    if (arr.length < 2) {
      // console.log('endpoint 格式错误');
      return;
    }
    this._config.endpoint = {
      protocol: arr[0],
      host: arr[1]
    }
  }

  OssUpload.prototype.upload = function (options) {
    if (!options) {
      if (typeof options.onerror === 'function') {
        options.onerror('需要 options');
      }
      return;
    }

    if (!options.file) {
      if (typeof options.onerror === 'function') {
        options.onerror('需要 file');
      }
      return;
    }
    const file = options.file;

    if (!options.key) {
      if (typeof options.onerror === 'function') {
        options.onerror('需要 key');
      }
      return;
    }
    // 去掉 key 开头的 /
    options.key.replace(new RegExp('^\/'), '');

    const self = this;

    const readFile = function (callback) {
      const result = {
        chunksHash: {},
        chunks: []
      };
      const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
      const chunkSize = self._config.chunkSize;
      const chunksNum = Math.ceil(file.size / chunkSize);
      let currentChunk = 0;

      const frOnload = function (e) {
        result.chunks[currentChunk] = e.target.result;
        currentChunk++;
        if (currentChunk < chunksNum) {
          loadNext();
        } else {
          result.file_size = file.size;
          callback(null, result);
        }
      };
      const frOnerror = function () {
        console.error('读取文件失败');
        if (typeof options.onerror === 'function') {
          options.onerror('读取文件失败');
        }
      };

      function loadNext() {
        const fileReader = new FileReader();
        fileReader.onload = frOnload;
        fileReader.onerror = frOnerror;

        let start = currentChunk * chunkSize,
          end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
        const blobPacket = blobSlice.call(file, start, end);
        fileReader.readAsArrayBuffer(blobPacket);
      }

      loadNext();
    };

    const uploadSingle = function (result, callback) {
      const params = {
        Bucket: self._config.bucket,
        Key: options.key,
        Body: result.chunks[0],
        ContentType: file.type || ''
      };
      _extend(params, options.headers);

      const req = self.oss.putObject(params, callback);

      req.on('httpUploadProgress', (p) => {
        if (typeof options.onprogress === 'function') {
          options.onprogress({
            loaded: p.loaded,
            total: file.size
          });
        }
      });
    };

    const uploadMultipart = function (result, callback) {
      const maxUploadTries = options.maxRetry || 3;
      let uploadId;
      let loadedNum = 0;
      let latestUploadNum = -1;
      let concurrency = 0;

      const multipartMap = {
        Parts: []
      };

      const init = function () {
        const params = {
          Bucket: self._config.bucket,
          Key: options.key,
          ContentType: file.type || ''
        };
        _extend(params, options.headers);

        self.oss.createMultipartUpload(
          params,
          (mpErr, res) => {
            if (mpErr) {
              // console.log('Error!', mpErr);
              callback(mpErr);
              return;
            }

            // console.log("Got upload ID", res.UploadId);
            uploadId = res.UploadId;

            uploadPart(0);
          }
        );
      };

      var uploadPart = function (partNum) {
        if (partNum >= result.chunks.length) {
          return;
        }

        concurrency++;
        if (latestUploadNum < partNum) {
          latestUploadNum = partNum;
        }
        if (concurrency < self._config.concurrency && (partNum < (result.chunks.length - 1))) {
          uploadPart(partNum + 1);
        }
        const partParams = {
          Body: result.chunks[partNum],
          Bucket: self._config.bucket,
          Key: options.key,
          PartNumber: String(partNum + 1),
          UploadId: uploadId
        };

        let tryNum = 1;

        var doUpload = function () {
          multipartMap.Parts[partNum] = {
            PartNumber: partNum + 1,
            loaded: 0
          };

          const req = self.oss.uploadPart(partParams, (multiErr, mData) => {
            if (multiErr) {
              // console.log('multiErr, upload part error:', multiErr);
              if (tryNum > maxUploadTries) {
                console.log('上传分片失败: #', partParams.PartNumber);
                callback(multiErr);
              } else {
                console.log('重新上传分片: #', partParams.PartNumber);
                multipartMap.Parts[partNum].loaded = 0;
                tryNum++;
                doUpload();
              }
              return;
            }

            multipartMap.Parts[partNum].ETag = mData.ETag;
            multipartMap.Parts[partNum].loaded = partParams.Body.byteLength;

            // console.log(mData);
            concurrency--;

            console.log('Completed part', partNum + 1);
            //console.log('mData', mData);

            loadedNum++;
            if (loadedNum == result.chunks.length) {
              complete();
            } else {
              uploadPart(latestUploadNum + 1);
            }
          });

          req.on('httpUploadProgress', (p) => {
            multipartMap.Parts[partNum].loaded = p.loaded;

            let loaded = 0;
            for (const i in multipartMap.Parts) {
              if (multipartMap.Parts.hasOwnProperty(i)) {
                loaded += multipartMap.Parts[i].loaded;
              }
            }

            if (typeof options.onprogress === 'function') {
              options.onprogress({
                loaded,
                total: file.size
              });
            }
          });
        };

        doUpload();
      };

      var complete = function () {
        // console.log("Completing upload...");

        for (const i in multipartMap.Parts) {
          if (multipartMap.Parts.hasOwnProperty(i)) {
            delete multipartMap.Parts[i].loaded;
          }
        }

        const doneParams = {
          Bucket: self._config.bucket,
          Key: options.key,
          CompleteMultipartUpload: multipartMap,
          UploadId: uploadId
        };

        self.oss.completeMultipartUpload(doneParams, callback);
      };

      init();
    };

    readFile((err, result) => {
      const callback = function (err, res) {
        if (err) {
          if (typeof options.onerror === 'function') {
            options.onerror(err);
          }
          return;
        }

        if (typeof options.oncomplete === 'function') {
          options.oncomplete(res);
        }
      };

      if (result.chunks.length == 1) {
        uploadSingle(result, callback)
      } else {
        uploadMultipart(result, callback);
      }
    });
  };

  window.OssUpload = OssUpload;
}());
