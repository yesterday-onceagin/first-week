import React from 'react';

const TYPE_NAMES = {
  folder: 'FOLDER',
  excel: 'EXCEL',
  sql: 'SQL',
  label: 'LABEL',
  combo: 'UNION',
  template: 'TEMPLATE',
  api: 'API'
};

const DATASET_FIELD_TYPES = {
  字符串: {
    name: '字符串',
    type: '字符串',
    icon: <i className="dmp-field-icon" style={{ fontStyle: 'italic' }}>T</i>,
    format: [],
  },
  枚举: {
    name: '枚举',
    type: '枚举',
    icon: <i className="dmpicon-enum dmp-field-icon"></i>,
    format: [],
  },
  地址: {
    name: '地址',
    type: '地址',
    icon: <i className="dmpicon-map-mark dmp-field-icon"></i>,
    format: [],
  },
  日期: {
    name: '日期',
    type: '日期',
    icon: <i className="dmpicon-calendar dmp-field-icon"></i>,
    format: ['YYYY-MM-DD', 'DD/MM/YYYY', 'YYYY-MM-DD HH:MM:SS', 'HH:MM:SS'],
  },
  数值: {
    name: '数值',
    type: '数值',
    icon: <i className="dmp-field-icon" style={{ fontStyle: 'italic' }}>#</i>,
    format: ['#', '##.0', '##.00', '#,###.00'],
  }
};

const DATASET_TYPES = [
  {
    name: 'Excel',
    type: 'EXCEL',
    description: '可直接上传.xls、.xlsx、.csv文件，做为数据集使用',
    icon: require('../../../static/images/dataset-excel.png')
  },
  {
    name: 'SQL',
    type: 'SQL',
    description: '以SQL语句访问数据库，可从MySQL数据源或Data库创建数据集',
    icon: require('../../../static/images/dataset-sql.png')
  },
  {
    name: '标签数据集',
    type: 'LABEL',
    description: '可将在离线大数据管理中定义的标签作为数据集使用',
    icon: require('../../../static/images/dataset-label.png')
  },
  {
    name: '组合数据集',
    type: 'UNION',
    description: '通过sql创建组合数据集',
    icon: require('../../../static/images/dataset-combo.png')
  },
  {
    name: 'API 数据集',
    type: 'API',
    description: '通过业务数据库API调用生成数据集',
    icon: require('../../../static/images/dataset-api.png')
  }
];

const SIDE_MENU_ITEM_HEIGHT = 30;

const SIDE_MENU_ITEM_LENGTH = {
  [TYPE_NAMES.folder]: 3,
  [TYPE_NAMES.excel]: 2,
  [TYPE_NAMES.sql]: 2,
  [TYPE_NAMES.label]: 2,
  [TYPE_NAMES.combo]: 2,
  [TYPE_NAMES.api]: 2,
  [TYPE_NAMES.template]: 2
};

export {
  TYPE_NAMES,
  DATASET_FIELD_TYPES,
  DATASET_TYPES,
  SIDE_MENU_ITEM_HEIGHT,
  SIDE_MENU_ITEM_LENGTH
};
