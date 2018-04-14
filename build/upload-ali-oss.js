const path = require('path');
const co = require('co');
const OSS = require('ali-oss');
const archiver = require('archiver');
const fs = require('fs-extra');
const { argv } = require('yargs')

const client = new OSS({
  region: 'oss-cn-hangzhou',
  accessKeyId: 'LTAIFQ9GUt8iCoLD',
  accessKeySecret: 'K9eMfyuttS9lzdwV70HqBejKShdtVu',
  bucket: 'mic-open',
  timeout: 3000000
})

const distDir = path.resolve(__dirname, '../dist')
const distZip = path.resolve(__dirname, 'dmp-static.zip')

// 压缩dist目录
console.log('开始打包dist目录...');
const output = fs.createWriteStream(distZip);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', () => {
  console.log('打包dist目录成功\n');

  // 上传dist目录
  console.log('开始上传dist压缩包...');
  co(function* () {
    const result = yield client.put(`dmp-static/dmp-static-${argv.tag}.zip`, distZip);
    if (result.res.status === 200) {
      console.log(`上传dist压缩包成功: ${result.url}`)

      // 清除压缩包临时文件
      fs.removeSync(distZip)
    } else {
      console.log('上传dist压缩包失败')
    }
  }).catch((err) => {
    console.log(err);
  })
});

archive.on('error', (err) => {
  console.log(err)
});

archive.pipe(output);
archive.directory(`${distDir}/`, false);
archive.finalize();
