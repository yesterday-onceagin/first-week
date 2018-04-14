export const INDICATOR_CHART_TYPE = [{
  rule: [{
    value: {
      max: '0',
      min: '0'
    },
    dim: {
      max: '3',
      min: '1',
      formula_mode: ['year', 'month', 'hour', 'minute', 'second']
    }
  }],
  description: '1-3个维度, 0个数值',
  code: 'select_filter',
  icon: 'indicator_select',
  name: '下拉筛选'
}, {
  rule: [{
    value: {
      max: '0',
      min: '0'
    },
    dim: {
      max: '1',
      min: '1',
      formula_mode: ['year', 'month', 'hour', 'minute', 'second']
    }
  }],
  description: '1个维度, 0个数值',
  code: 'checkbox_filter',
  icon: 'checkbox_select',
  name: '列表筛选'
}, {
  rule: [{
    value: {
      max: '0',
      min: '0'
    },
    dim: {
      max: '1',
      min: '1',
      formula_mode: ['year', 'month', 'hour', 'minute', 'second']
    }
  }],
  display_item: {
    top_head: 30
  },
  rank: 13,
  description: '1个维度, 0个数值',
  type: '基础',
  code: 'timeline',
  icon: 'timeline',
  name: '时间轴'
}, {
  rule: [{
    value: {
      max: '0',
      min: '0'
    },
    dim: {
      max: '1',
      min: '1',
      type: '日期',
      formula_mode: ['day']
    }
  }],
  description: '1个维度(日期), 0个数值',
  code: 'time_interval_filter',
  icon: 'indicator_date',
  name: '时间区间筛选'
}, {
  rule: [{
    value: {
      max: '0',
      min: '0'
    },
    dim: {
      max: '1',
      min: '1',
      type: '数值'
    }
  }],
  description: '1个维度(数值), 0个数值',
  code: 'number_filter',
  icon: 'indicator_number',
  name: '数值区间筛选'
}, {
  rule: [{
    value: {
      max: '0',
      min: '0'
    },
    dim: {
      max: '1',
      min: '1'
    }
  }],
  description: '1个维度, 0个数值',
  code: 'tablist',
  icon: 'tablist',
  name: 'Tab列表'
}]

export const BASE_CHART_TYPE = [{
  rule: [{
    value: {
      min: '1'
    },
    dim: {
      min: '0'
    }
  }, {
    value: {
      min: '0'
    },
    dim: {
      min: '1'
    }
  }],
  display_item: {
    top_head: 100
  },
  description: '0个或多个维度，0个或多个数值',
  type: '基础',
  code: 'table',
  icon: 'C200',
  name: '表格（支持穿透）'
}, {
  rule: [{
    value: {
      max: '1',
      min: '1'
    },
    dim: {
      max: '0',
      min: '0'
    }
  }],
  display_item: {
    top_head: 1
  },
  description: '0个维度 1个数值',
  type: '基础',
  code: 'numerical_value',
  icon: 'C310',
  name: '数值图'
},
{
  rule: [{
    value: {
      max: '2',
      min: '1'
    },
    dim: {
      max: '0',
      min: '0'
    }
  }],
  display_item: {
    top_head: 1
  },
  description: '0个维度 2个数值',
  code: 'split_gauge',
  icon: 'split_gauge',
  name: '仪表盘'
},
{
  rule: [{
    value: {
      max: '1',
      min: '1'
    },
    dim: {
      max: '1',
      min: '1'
    }
  }],
  description: '1个维度 1个数值',
  display_item: {
    top_head: 20
  },
  code: 'treemap',
  icon: 'treemap',
  name: '树图（支持穿透）'
}, {
  rule: [{
    value: {
      min: '1'
    },
    dim: {
      max: '2',
      min: '1'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '1个或2个维度，1个或多个数值',
  code: 'line',
  icon: 'C220',
  name: '折线图（支持穿透）'
}, {
  rule: [{
    value: {
      min: '2'
    },
    dim: {
      max: '2',
      min: '1'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '1个或2个维度，2个或多个数值',
  code: 'stack_line',
  icon: 'stack-line',
  name: '堆叠折线图（支持穿透）'
}, {
  rule: [{
    value: {
      min: '1'
    },
    dim: {
      max: '1',
      min: '1'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '1个维度，1个或多个数值',
  code: 'area',
  icon: 'C350',
  name: '面积图（支持穿透）'
}, {
  rule: [{
    value: {
      min: '2'
    },
    dim: {
      max: '1',
      min: '1'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '1个维度，2个或多个数值',
  code: 'stack_area',
  icon: 'stack-area',
  name: '堆叠面积图（支持穿透）'
},
// {
//   rule: [{
//     value: {
//       min: '1'
//     },
//     dim: {
//       max: '2',
//       min: '0'
//     }
//   }],
//   display_item: {
//     top_head: 20
//   },
//   description: '2个以内维度，1个或多个数值',
//   code: 'cluster_column',
//   icon: 'C210',
//   name: '簇状柱形图（支持穿透）'
// }, {
//   rule: [{
//     value: {
//       min: '2'
//     },
//     dim: {
//       max: '2',
//       min: '0'
//     }
//   }],
//   display_item: {
//     top_head: 20
//   },
//   description: '2个以内维度，2个或者多个数值',
//   code: 'stack_bar',
//   icon: 'stack-bar',
//   name: '堆叠柱形图（支持穿透）'
// },
// {
//   rule: [{
//     value: {
//       min: '1'
//     },
//     dim: {
//       max: '2',
//       min: '0'
//     }
//   }],
//   display_item: {
//     top_head: 20
//   },
//   description: '2个以内维度，1个或多个数值',
//   code: 'horizon_bar',
//   icon: 'horizon-bar',
//   name: '条形图（支持穿透）'
// },
// {
//   rule: [{
//     value: {
//       min: '2'
//     },
//     dim: {
//       max: '2',
//       min: '0'
//     }
//   }],
//   display_item: {
//     top_head: 20
//   },
//   description: '2个以内维度，2个或多个数值',
//   code: 'horizon_stack_bar',
//   icon: 'horizon-stack-bar',
//   name: '堆叠条形图（支持穿透）'
// },
{
  rule: [{
    value: {
      max: '1',
      min: '1'
    },
    dim: {
      max: '2',
      min: '1'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '1个维度或2维度, 1个数值',
  code: 'flow_bar',
  icon: 'C320',
  name: '阶梯瀑布图（支持穿透）'
},
{
  rule: [{
    value: {
      min: '2',
      max: '2'
    },
    dim: {
      max: '2',
      min: '1'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '1个或2个维度，2个数值',
  code: 'double_axis',
  icon: 'double-axis',
  name: '双轴图（支持穿透）'
},
// {
//   rule: [{
//     value: {
//       max: '1',
//       min: '1'
//     },
//     dim: {
//       max: '1',
//       min: '1'
//     }
//   }, {
//     value: {
//       min: '1',
//       max: '10'
//     },
//     dim: {
//       max: '0',
//       min: '0'
//     }
//   }],
//   display_item: {
//     top_head: 20
//   },
//   description: '1个维度 1个数值，0个维度10个或10个以内数值',
//   code: 'pie',
//   icon: 'C230',
//   name: '普通饼图（支持穿透）'
// },
{
  rule: [{
    value: {
      max: '2',
      min: '1'
    },
    dim: {
      max: '0',
      min: '0'
    }
  }],
  display_item: {
    top_head: 1
  },
  description: '0个维度 2个数值',
  code: 'gauge',
  icon: 'gauge',
  name: '占比饼图'
},
{
  rule: [{
    value: {
      max: '2',
      min: '1'
    },
    dim: {
      max: '0',
      min: '0'
    }
  }],
  display_item: {
    top_head: 1
  },
  description: '0个维度 1-2个数值',
  code: 'liquid_fill',
  icon: 'liquid_fill',
  name: '水位图'
},
{
  rule: [{
    value: {
      max: '1',
      min: '1'
    },
    dim: {
      max: '1',
      min: '1'
    }
  }, {
    value: {
      min: '1',
      max: '10'
    },
    dim: {
      max: '0',
      min: '0'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '1个维度 1个数值，0个维度10个或10个以内数值',
  code: 'circle_pie',
  icon: 'circle-pie',
  name: '环形饼图（支持穿透）'
}, {
  rule: [{
    value: {
      max: '1',
      min: '1'
    },
    dim: {
      max: '1',
      min: '1'
    }
  }, {
    value: {
      min: '1',
      max: '10'
    },
    dim: {
      max: '0',
      min: '0'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '1个维度 1个数值，0个维度10个或10个以内数值',
  code: 'rose_pie',
  icon: 'rose-pie',
  name: '玫瑰图（支持穿透）'
}, {
  rule: [{
    value: {
      max: '1',
      min: '1'
    },
    dim: {
      max: '1',
      min: '1'
    }
  }, {
    value: {
      min: '1',
      max: '10'
    },
    dim: {
      max: '0',
      min: '0'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '1个维度 1个数值，0个维度10个或10个以内数值',
  code: 'circle_rose_pie',
  icon: 'circle-rose-pie',
  name: '环形玫瑰图（支持穿透）'
}, {
  rule: [{
    value: {
      max: '1',
      min: '1'
    },
    dim: {
      max: '1',
      min: '1'
    }
  }, {
    value: {
      min: '1'
    },
    dim: {
      max: '0',
      min: '0'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '1个维度 1个数值，0个维度2个以上数值',
  code: 'funnel',
  icon: 'funnel',
  name: '漏斗图（支持穿透）'
}, {
  rule: [{
    value: {
      max: '3',
      min: '2'
    },
    dim: {
      min: '0'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '0个或多个维度，2个或3个数值',
  code: 'scatter',
  icon: 'C280',
  name: '散点图'
}, {
  rule: [{
    value: {
      min: '1'
    },
    dim: {
      max: '1',
      min: '1'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '1个维度，2个或多个数值',
  code: 'radar',
  icon: 'C290',
  name: '雷达图'
}, {
  rule: [{
    value: {
      max: '1',
      min: '1'
    },
    dim: {
      max: '1',
      min: '1'
    }
  }],
  display_item: {
    top_head: 20
  },
  description: '1个维度，1个数值',
  code: 'scatter_map',
  icon: 'C272',
  name: '散点地图（支持穿透）'
}
]

// 简单单图类型(单独定义 不在default里导出 避免addoredit渲染)
export const SIMPLE_CHART_TYPE = [{
  code: 'simple_text',
  name: '文本框'
}, {
  code: 'simple_image',
  name: '图片'
}, {
  code: 'simple_clock',
  name: '时间器'
}, {
  code: 'simple_border',
  name: '边框'
}, {
  code: 'simple_tab',
  name: 'Tab组件'
}]

export default {
  基础: BASE_CHART_TYPE,
  筛选: INDICATOR_CHART_TYPE
}
