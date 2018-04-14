function encodeCron(type, data) {
  const cron = [];
  switch (type) {
    case 'month': {
      cron.push('0');
      cron.push(data.minute);
      cron.push(data.hour);
      cron.push(data.day.join(','));
      cron.push('*');
      cron.push('?');
      cron.push('*');
    } break;
    case 'week': {
      cron.push('0');
      cron.push(data.minute);
      cron.push(data.hour);
      cron.push('?');
      cron.push('*');
      cron.push(data.week.join(','));
      cron.push('*');
    } break;
    case 'day': {
      cron.push('0');
      cron.push(data.minute);
      cron.push(data.hour);
      cron.push('?');
      cron.push('*');
      cron.push('*');
      cron.push('*');
    } break;
    case 'hour': {
      cron.push('0');
      cron.push('0');
      cron.push(`${data.start_hour}-${data.end_hour}/${data.step_hour}`);
      cron.push('?');
      cron.push('*');
      cron.push('*');
      cron.push('*');
    } break;
    case 'minute': {
      cron.push('0');
      cron.push(`0/${data.minute}`);
      cron.push('*');
      cron.push('*');
      cron.push('*');
      cron.push('?');
      cron.push('*');
    } break;
    case 'second': {
      cron.push(`0/${data.second}`);
      cron.push('*');
      cron.push('*');
      cron.push('*');
      cron.push('*');
      cron.push('?');
      cron.push('*');
    } break;
    default: {
      cron.push('0');
      cron.push('0');
      cron.push('0');
      cron.push('?');
      cron.push('*');
      cron.push('*');
      cron.push('*');
    } break;
  }
  return cron.join(' ');
}

function decodeCron(cron) {
  if (typeof cron === 'string' && !!cron) {
    return _getDataAndType(cron)
  }
  return {
    type: '',
    data: null
  };
}

// 获取corn表达式的描述
function getCronDesc(cron) {
  let desc = '',
    cronData = null;
  const weekName = {
    2: '一',
    3: '二',
    4: '三',
    5: '四',
    6: '五',
    7: '六',
    1: '日'
  };

  if (typeof cron === 'string' && !!cron) {
    cronData = decodeCron(cron);
  }

  if (cronData) {
    const { type, data } = cronData;

    switch (type) {
      case 'month':
        desc = `${data.day.length < 31 ? (`每月${data.day.sort(_sortFunc).join(',')}号`) : '每天'}的${_formatTime(data.hour)}:${_formatTime(data.minute)}`;
        break;
      case 'week':
        desc = `${data.week.length < 7 ? (`每周${data.week.sort(_sortFunc).map(w => weekName[w]).join('、')}`) : '每天'}的${_formatTime(data.hour)}:${_formatTime(data.minute)}`;
        break;
      case 'day':
        desc = `每天的${_formatTime(data.hour)}:${_formatTime(data.minute)}`;
        break;
      case 'hour':
        desc = `从${_formatTime(data.start_hour)}:00到${_formatTime(data.end_hour)}:00，每隔${data.step_hour}小时`;
        break;
      default:
        break;
    }
  }

  return desc;
}


function _getDataAndType(cron) {
  let data = {};
  let type = '';

  const datas = cron.split(' ');

  data.minute = +datas[1] || 0;

  if (datas[5] === '?') {
    // 如果 datas[0]  0/n ?  则为秒
    // 如果 datas[1] 0/n ?  则为分
    if (datas[0].startsWith('0/')) {
      type = 'second'
      data.second = datas[0].split('/')[1]
    } else if (datas[1].startsWith('0/')) {
      type = 'minute'
      data.minute = datas[1].split('/')[1]
    } else {
      type = 'month';
      data.hour = datas[2];
      data.day = datas[3].split(',');
    }
  } else if (datas[5] !== '*') {
    type = 'week';
    data.hour = datas[2];
    data.week = datas[5].split(',');
  } else if (datas[5] === '*' && datas[3] === '?') {
    if (datas[2].indexOf('/') > -1 && datas[2].indexOf('-') > -1) {
      type = 'hour';
      const _a_index = datas[2].indexOf('/'),
        _b_index = datas[2].indexOf('-');

      data.start_hour = datas[2].substring(0, _b_index);
      data.end_hour = datas[2].substring(_b_index + 1, _a_index);
      data.step_hour = datas[2].substr(_a_index + 1);
    } else {
      type = 'day';
      data.hour = datas[2];
    }
  } else {
    data = null;
  }

  return {
    data,
    type
  }
}

// 排序
function _sortFunc(a, b) {
  if (a - b < 0) {
    return -1;
  }
  if (a - b > 0) {
    return 1;
  }
  return 0;
}

// 小时、分钟、秒数，不足两位补0
function _formatTime(t) {
  return (t < 10 ? '0' : '') + t;
}

export {
  encodeCron,
  decodeCron,
  getCronDesc
};
