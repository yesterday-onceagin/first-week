import { PropComponents } from 'dmp-chart-sdk'
import MyComponent from './components/MyComponent'

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',      //dataSet(数据集), manual(手动输入), none(无)

  // 数据是否可排序
  sortable: false,

  // 数值项是否可以设置报告跳转
  hasNumsUrlsetting: true,

  // 是否支持穿透
  penetrable: false,

  // 是否支持触发联动
  linkage: false,

  // 是否属于被联动图表
  canLinked: true,

  // 是否有次轴
  hasZaxis: false,

  // 是否有目标数值
  hasDesiredvalue: false,

  //不显示维度条目
  hiddenDisplayItem: true,

  // 数据指标规则
  indicatorRules: [
    {
      dim: {
        min: 0,
        max: 0
      },
      value: {
        min: 1,
        max: 1
      }
    }
  ],
  indicatorDescription: '0个维度 1个数值',

  // 默认数据
  previewData: {},

  // 图表配置
  chartConfig: [{
    title: '全局样式',
    field: 'global',
    spread: false,
    items: [{
      label: '排列方式',
      field: 'position',
      component: {
        component: PropComponents.Select,
        props: {
          options: [
            { value: 'top', text: '标题在上' },
            { value: 'left', text: '标题在左' },
            { value: 'bottom', text: '标题在下' }
          ]
        }
      },
      data: 'top'
    }, {
      label: '对齐方式',
      field: 'align',
      component: {
        component: PropComponents.Select,
        props: {
          options: [
            { value: 'center', text: '居中对齐' },
            { value: 'left', text: '居左对齐' },
            { value: 'right', text: '居右对齐' }
          ]
        }
      },
      data: 'center'
    }, {
      label: '翻牌加载',
      field: 'scroll',
      component: PropComponents.Checkbox,
      data: false
    }]
  }, {
    title: '名称设置',
    field: 'title',
    spread: false,
    show: true,
    items: [{
      label: '字号',
      field: 'fontSize',
      component: {
        component: PropComponents.Spinner,
        props: {
          min: 12
        }
      },
      data: 16
    }, {
      label: '颜色',
      field: 'color',
      component: PropComponents.ColorPicker,
      data: '#C8C9C9',
    }, {
      label: '行高',
      field: 'lineHeight',
      component: {
        component: PropComponents.Spinner,
        props: {
          min: 12
        }
      },
      data: 35
    }, {
      field: 'fontStyle',
      label: '样式',
      component: PropComponents.FontStyle,
      data: {
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none'
      }
    }, {
      field: 'textAlign',
      label: '对齐',
      component: PropComponents.TextAlign,
      data: 'center'
    }]
  }, {
    title: '数值设置',
    field: 'numberValue',
    spread: false,
    items: [{
      label: '字号',
      field: 'fontSize',
      component: {
        component: PropComponents.Spinner,
        props: {
          min: 12
        }
      },
      data: 32
    }, {
      label: '颜色',
      field: 'color',
      component: PropComponents.ColorPicker,
      data: '#00FFFF',
    }, {
      label: '行高',
      field: 'lineHeight',
      component: {
        component: PropComponents.Spinner,
        props: {
          min: 12
        }
      },
      data: 40
    }, {
      field: 'fontStyle',
      label: '样式',
      component: PropComponents.FontStyle,
      data: {
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none'
      }
    }, {
      field: 'textAlign',
      label: '文本对齐',
      component: PropComponents.TextAlign,
      data: 'center'
    }, {
      label: '背景颜色',
      field: 'background',
      component: PropComponents.ColorPicker,
      data: 'transparent',
    }, {
      label: '数字间距',
      field: 'margin',
      component: {
        component: PropComponents.Spinner,
        props: {
          min: 0
        }
      },
      data: 5
    }, {
      label: '圆角',
      field: 'borderRadius',
      component: {
        component: PropComponents.Spinner,
        props: {
          min: 0
        }
      },
      data: 2
    }]
  }, {
    title: '前缀设置',
    field: 'numberPrefix',
    spread: false,
    items: [{
      field: 'content',
      label: '前缀',
      component: MyComponent,
      data: ''
    }, {
      label: '字号',
      field: 'fontSize',
      component: {
        component: PropComponents.Spinner,
        props: {
          min: 12
        }
      },
      data: 32
    }, {
      label: '颜色',
      field: 'color',
      component: PropComponents.ColorPicker,
      data: '#C7E0FF',
    }, {
      label: '行高',
      field: 'lineHeight',
      component: {
        component: PropComponents.Spinner,
        props: {
          min: 12
        }
      },
      data: 40
    }]
  }, {
    title: '后缀设置',
    field: 'numberSuffix',
    spread: false,
    show: true,
    items: [{
      label: '字号',
      field: 'fontSize',
      component: {
        component: PropComponents.Spinner,
        props: {
          min: 12
        }
      },
      data: 32
    }, {
      label: '颜色',
      field: 'color',
      component: PropComponents.ColorPicker,
      data: '#C7E0FF',
    }, {
      label: '行高',
      field: 'lineHeight',
      component: {
        component: PropComponents.Spinner,
        props: {
          min: 12
        }
      },
      data: 40
    }]
  }, {
    field: 'containerTitle',
    disabled: true
  }]
}
