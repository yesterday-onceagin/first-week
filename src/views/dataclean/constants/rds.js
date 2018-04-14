import { ODPS_SOURCE, RDS_SOURCE } from './index';

export const PROCESS_NAV = ['选择数据来源和目标', '映射字段', '配置项']

export const MAIN_KEYS = [{
  id: 'replace',
  name: '替换原有数据（replace into）'
}, {
  id: 'insert',
  name: '视为脏数据，保留原有数据（insert into）'
}]

export const PARTITION = '${datetime}'

export const FIELD_SOURCE = 'FIELD_SOURCE';

export const FIELD_TARGET = 'FIELD_TARGET';

const endpointHoverStyle = {
  fillStyle: 'transparent',
  strokeStyle: '#216477'
};

export const JSP_DEFAULT_OPTIONS = {
  Connector: ['Straight', { gap: 3 }],
  // 端端样式，圆点，半径4px
  Endpoint: ['Dot', { radius: 4 }],
  DragOptions: { cursor: 'pointer', zIndex: 999 },
};

// 端点配置（输出端）
export const JSP_SOURCE_ENDPOINT_OPTIONS = {
  // 标识为source端，不能拖放到该endpoint
  isSource: true,
  // endpoint 端点样式
  paintStyle: {
    strokeStyle: '#216477',
    fillStyle: 'transparent',
    radius: 3,
    lineWidth: 2
  },
  // 连线样式
  connectorStyle: { strokeStyle: '#5c96bc', lineWidth: 1, outlineColor: 'transparent', outlineWidth: 4 },
  connectorHoverStyle: {
    strokeStyle: '#24BCFA',
    lineWidth: 2,
    outlineColor: 'transparent',
    outlineWidth: 4
  },
  hoverPaintStyle: endpointHoverStyle,
  dragOptions: {}
};

// 端点配置（输入端）
export const JSP_TARGET_ENDPOINT_OPTIONS = {
  hoverPaintStyle: endpointHoverStyle,
  // 添加drop样式，用来高亮显示target endpoint
  dropOptions: { activeClass: 'active' },
  isTarget: true
};

//连线配置
export const JSP_CONNECTION_OPTIONS = {
  Connector: ['Straight', { gap: 3 }],
  endpoint: ['Dot', { radius: 4 }],
  endpointStyles: [
    {
      strokeStyle: '#216477',
      fillStyle: 'transparent',
      radius: 3,
      lineWidth: 2
    },
    null
  ],
  paintStyle: {
    strokeStyle: '#5c96bc',
    lineWidth: 1,
    outlineColor: 'transparent',
    outlineWidth: 4
  }
}

export const NODE_ENDPOINTS = {
  [FIELD_SOURCE]: {
    sourceEndpoints: [{ anchor: ['Right'], uuid: 'Right', maxConnections: 1 }]
  },
  [FIELD_TARGET]: {
    targetEndpoints: [{ anchor: ['Left'], uuid: 'Left', maxConnections: 1 }]
  }
};


export const DEFAULT_RDS_OPTIONS = {
  odps_source: ODPS_SOURCE,
  rds_source: RDS_SOURCE,
  processNav: PROCESS_NAV,
  main_keys: MAIN_KEYS,
  partition: PARTITION
}
