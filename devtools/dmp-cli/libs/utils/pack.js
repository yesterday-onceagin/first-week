var fs = require('fs-extra');
var archiver = require('archiver');
var path = require('path');

module.exports = function (tarPath, root, chartCode, callback) {
  if (!fs.existsSync(tarPath)) {
    fs.mkdirpSync(tarPath)
  }

  tarPath = path.join(tarPath, '/dmp-chart-' + chartCode + '.zip');

  var output = fs.createWriteStream(tarPath);
  var archive = archiver('zip', {
    zlib: { level: 9 }
  });

  output.on('close', function () {
    callback(null, tarPath);
  });

  archive.on('error', function (err) {
    callback(err)
  });

  archive.pipe(output);
  archive.directory(root + '/', false);
  archive.finalize();
}
