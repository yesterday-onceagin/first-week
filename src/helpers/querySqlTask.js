export default function querySqlTask(str) {
  if (!str) {
    return [str];
  }

  (str.charAt(str.length - 1) !== ';') ? (str += ';') : void (0);

  // 过滤注释
  str = str.replace(/--.*/g, '').replace(/[\r\n]$/gm, '');

  const quotaReg = /((.|\n|\r)*?;)/g;
  const task = [];
  let result;

  while ((result = quotaReg.exec(str)) != null) {
    if (result[0].slice(0, result[0].length - 1).replace(/\n|\r|\s/g, '').length > 0) {
      task.push(result[0]);
    }
  }

  if (task.length == 0) {
    task.push(str);
  }

  return task;
}
