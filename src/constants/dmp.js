// DMP主题列表
const DMP_THEMES = [{
  key: 'theme-black',
  name: '星空蓝'
}, {
  key: 'theme-white',
  name: '致雅白'
}, {
  key: 'theme-gold',
  name: '香槟金'
}];

// 流程类型
const FLOW_TYPES = ['数据采集', '数据清洗', '数据看板', '标签定义'];

// 周期类型
const CYCLE_TYPES = {
  month: '月',
  week: '周',
  day: '天',
  hour: '小时'
};

// TIP 提醒时间
const TIP_SHOW_TIME = 3000

// 项目相关
const PROJECT_TYPES = {
  dataview: '可视化',
  platform: '平台'
}

const APPLICATION_PLATFORMS = {
  pc: {
    name: 'PC端'
  },
  mobile: {
    name: '移动端'
  }
}

export {
  DMP_THEMES,
  FLOW_TYPES,
  CYCLE_TYPES,
  TIP_SHOW_TIME,
  PROJECT_TYPES,
  APPLICATION_PLATFORMS
}
