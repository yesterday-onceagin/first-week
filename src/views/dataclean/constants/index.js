// 画布ID
export const CANVAS_ID = 'flowbuilder-canvas'

// 节点常量
export const NODE_TYPE_COLLECTOR = '采集'; // 采集
export const NODE_TYPE_ODPSSQL = 'ODPS_SQL'; // ODPS_SQL
export const NODE_TYPE_MAPPING = '映射'; // 指标映射
export const NODE_TYPE_SYNCRDS = '同步'; // 同步RDS


export const NODE_MAP = {

  [NODE_TYPE_COLLECTOR]: {
    name: '数据采集',
    type: NODE_TYPE_COLLECTOR
  },

  [NODE_TYPE_ODPSSQL]: {
    name: 'ODPS_SQL',
    type: NODE_TYPE_ODPSSQL
  },

  [NODE_TYPE_MAPPING]: {
    name: '数据映射',
    type: NODE_TYPE_MAPPING
  },

  [NODE_TYPE_SYNCRDS]: {
    name: '同步RDS',
    type: NODE_TYPE_SYNCRDS
  },
}

//节点列表
export const NODE_LIST = [

  {
    name: '数据输入',
    type: 'DATA_INPUT',
    children: [
      NODE_MAP[NODE_TYPE_COLLECTOR],
    ]
  }, {
    name: '分析/加工',
    type: 'ANALYSIS_PROCESS',
    children: [
      NODE_MAP[NODE_TYPE_ODPSSQL],
      NODE_MAP[NODE_TYPE_MAPPING],
    ]
  }, {
    name: '数据输出',
    type: 'DATA_OUTPUT',
    children: [NODE_MAP[NODE_TYPE_SYNCRDS]]
  }
];


// ---------------------------------------------------------
// jsPlumb 配置
// ---------------------------------------------------------
const endpointHoverStyle = {
  fillStyle: 'transparent',
  strokeStyle: '#216477'
};

export const JSP_DEFAULT_OPTIONS = {
  // 连接器定义
  Connector: ['Bezier', {
    // stub: [10, 10], // 数组分别为source端的最小直线长度、target端的最小直线长度
    // gap: 3, // 线和端的间隔
    // cornerRadius: 9999, // 折角处的圆角大小
    // alwaysRespectStubs: true
    curviness: 100
  }],
  // 端端样式，圆点，半径3.5px
  Endpoint: ['Dot', {
    radius: 3.5
  }],
  DragOptions: {
    cursor: 'pointer',
    zIndex: 999
  },
  // 连线的覆盖物（箭头、连线间的Label）配置
  ConnectionOverlays: [
    ['Arrow', {
      id: 'arrow',
      location: 0.5, // 偏移量，取值0~1
      visible: true,
      width: 10,
      length: 10,
      foldback: 0.5 // 折返，取值0~1
    }]
  ],
  Container: CANVAS_ID
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
  connectorStyle: {
    strokeStyle: '#698EBB',
    lineWidth: 1,
    outlineColor: 'transparent',
    outlineWidth: 5
  },
  connectorHoverStyle: {
    strokeStyle: '#24BCFA',
    lineWidth: 1,
    outlineColor: 'transparent',
    outlineWidth: 5
  },
  hoverPaintStyle: endpointHoverStyle,
  dragOptions: {}
};

// 端点配置（输入端）
export const JSP_TARGET_ENDPOINT_OPTIONS = {
  hoverPaintStyle: endpointHoverStyle,
  // 添加drop样式，用来高亮显示target endpoint
  dropOptions: {
    activeClass: 'active'
  },
  isTarget: true
};

//连线配置
export const JSP_CONNECTION_OPTIONS = {
  connector: ['Bezier', {
    // stub: [10, 10], // 数组分别为source端的最小直线长度、target端的最小直线长度
    // gap: 3, // 线和端的间隔
    // cornerRadius: 9999, // 折角处的圆角大小
    // alwaysRespectStubs: true
    curviness: 100
  }],
  endpoint: ['Dot', {
    radius: 3.5
  }],
  endpointStyles: [{
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
    outlineWidth: 5
  }
}

// ---------------------------------------------------------
// endpoint 配置
// ---------------------------------------------------------
export const NODE_ENDPOINTS = {

  [NODE_TYPE_COLLECTOR]: {
    sourceEndpoints: [{
      anchor: ['BottomCenter'],
      uuid: 'BottomCenter',
      maxConnections: 20
    }],
    targetEndpoints: [{
      anchor: ['TopCenter'],
      uuid: 'TopCenter',
      maxConnections: 20
    }]
  },

  [NODE_TYPE_ODPSSQL]: {
    sourceEndpoints: [{
      anchor: ['BottomCenter'],
      uuid: 'BottomCenter',
      maxConnections: 20
    }],
    targetEndpoints: [{
      anchor: ['TopCenter'],
      uuid: 'TopCenter',
      maxConnections: 20
    }]
  },

  [NODE_TYPE_MAPPING]: {
    sourceEndpoints: [{
      anchor: ['BottomCenter'],
      uuid: 'BottomCenter',
      maxConnections: 20
    }],
    targetEndpoints: [{
      anchor: ['TopCenter'],
      uuid: 'TopCenter',
      maxConnections: 20
    }]
  },

  [NODE_TYPE_SYNCRDS]: {
    sourceEndpoints: [{
      anchor: ['BottomCenter'],
      uuid: 'BottomCenter',
      maxConnections: 20
    }],
    targetEndpoints: [{
      anchor: ['TopCenter'],
      uuid: 'TopCenter',
      maxConnections: 20
    }]
  }
};

export const ODPS_SOURCE = {
  id: '00000000-1111-1111-1111-000000000000',
  name: 'proj_odps'
}

export const RDS_SOURCE = {
  id: '00000000-1111-1111-2222-000000000000',
  name: 'proj_data'
}
