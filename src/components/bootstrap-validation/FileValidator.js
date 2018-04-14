function iterate(files, cb) {
  Array.prototype.forEach.call(files, cb);
}

function getTotalFileSize(files) {
  let result = 0;

  iterate(files, file => result += file.size);

  return result;
}

function getFileExtension(filename) {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) {
    return null;
  }
  return filename.substr(idx + 1).toLowerCase();

  //保留备份.substr((~-filename.lastIndexOf('.') >>> 0) + 2)
}

const FileValidator = {
  extend(name, fn) {
    this[name] = fn;
  },

  /**
     * Returns `true` if there are no files in file list
     *
     * @param {FileList} files File list
     * @returns {Boolean}
     */
  isEmpty(files) {
    return files.length === 0;
  },

  /**
     * Returns `true` if files count equals to 1
     *
     * @param {FileList} files File list
     * @returns {Boolean}
     */
  isSingle(files) {
    return files.length === 1;
  },

  /**
     * Returns `true` if files count is more than 1
     *
     * @param {FileList} files File list
     * @returns {Boolean}
     */
  isMultiple(files) {
    return files.length > 1;
  },

  /**
     * Returns `true` if files count is within allowed range.
     * If `max` is not supplied, checks if files count equals `min`.
     *
     * @param {FileList} files File list
     * @param {Number} min Minimum files count
     * @param {Number} [max] Maximum files count
     * @returns {Boolean}
     */
  isFilesCount(files, min, max) {
    if (!max) {
      return files.length === min;
    }
    return files.length >= min && files.length <= max;
  },

  /**
     * Returns `true` if total size of all files is within allowed range.
     *
     * @param {FileList} files File list
     * @param {Number} min Minimum size
     * @param {Number} [max] Maximum size
     * @returns {Boolean}
     */
  isTotalSize(files, min, max) {
    const totalSize = getTotalFileSize(files);

    return totalSize >= min && (!max || totalSize <= max);
  },

  /**
     * Returns `true` if each file's size is within allowed range
     *
     * @param {FileList} files File list
     * @param {Number} min Minimum size
     * @param {Number} [max] Maximum size
     * @returns {Boolean}
     */
  isEachFileSize(files, min, max) {
    let allValid = true;

    iterate(files, (file) => {
      const fileValid = file.size >= min && (!max || file.size <= max);

      if (!fileValid) {
        allValid = false;
      }
    });

    return allValid;
  },

  /**
     * Returns `true` if each file's extension is in the `extensions` array
     *
     * @param {FileList} files File list
     * @param {Array} extensions Array of allowed file extensions. All extensions must be lower-case.
     * @returns {Boolean}
     */
  isExtension(files, extensions) {
    let allValid = true;

    iterate(files, (file) => {
      const ext = getFileExtension(file.name);

      if (extensions.indexOf(ext) === -1) {
        allValid = false;
      }
    });

    return allValid;
  },

  /**
     * Returns `true` if each file's mime type is in the `types` array
     *
     * @param {FileList} files File list
     * @param {Array} types Array of allowed mime types
     * @returns {Boolean}
     */
  isType(files, types) {
    let allValid = true;

    iterate(files, (file) => {
      if (types.indexOf(file.type) === -1) {
        allValid = false;
      }
    });

    return allValid;
  }
};

export default FileValidator;
