module.exports = {
  isAbsPath: (p) => {
    if (process.platform.indexOf('win') === 0) {
      return /^\w:/.test(p);
    } else {
      return /^\//.test(p);
    }
  },
  isNone: (v) => {
    return v === undefined;
  },
  randomWord: () => {
    return ("0000" + (Math.random() * Math.pow(36, 5) << 0).toString(36)).slice(-5)
  }
}