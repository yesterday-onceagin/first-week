import { PropComponents } from 'dmp-chart-sdk'

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet', //dataSet(数据集), manual(手动输入) ,none(无),

  // 数据是否可排序
  sortable: false,

  // 默认数据请求条数
  defaultDataSize: 10,

  // 数据指标规则
  indicatorRules: [
    {
      // 维度
      dim: {
        min: 1,
        max: 1,
        field_type: ['字符串', '地址']
      },

      // 数值
      value: {
        min: 1,
        max: 2
      }
    }
  ],

  indicatorDescription: '1个维度, 1-2个数值',

  // 是否支持穿透
  penetrable: false,

  previewData: {
    data: [
      {
        city: '广州',
        value: 123
      },
      {
        city: '深圳',
        value: 123
      },
      {
        city: '北京',
        value: 123
      },
      {
        city: '上海',
        value: 123
      }
    ],
    indicators: {
      dims: [
        {
          col_name: 'city'
        }
      ],
      nums: [
        {
          col_name: 'value'
        }
      ]
    }
  },

  // 图表配置
  chartConfig: [
    {
      title: '标签',
      field: 'labelConfig',
      spread: true,
      items: [
        {
          field: 'nameColor',
          label: '维度颜色',
          component: PropComponents.ColorPicker,
          data: 'RGBA(79,236,255,1)'
        },
        {
          field: 'valueColor',
          label: '数值颜色',
          component: PropComponents.ColorPicker,
          data: '#C7E0FF'
        },
        {
          field: 'borderColor',
          label: '线框颜色',
          component: PropComponents.ColorPicker,
          data: '#20ADE2'
        },
        {
          field: 'hoverColor',
          label: '悬浮颜色',
          component: PropComponents.ColorPicker,
          data: 'RGBA(242,252,253,1)'
        }
      ]
    },
    {
      title: '地图',
      field: 'mapConfig',
      spread: true,
      items: [
        {
          field: 'mapColor',
          label: '区域颜色',
          component: PropComponents.ColorPicker,
          data: 'RGBA(16,41,78,1)'
        },
        {
          field: 'mapBorderColor',
          label: '轮廓颜色',
          component: PropComponents.ColorPicker,
          data: 'RGBA(0,219,255,1)'
        }
      ]
    },
    {
      title: '地图标记',
      field: 'markConfig',
      spread: true,
      items: [
        {
          field: 'markColor',
          label: '中心颜色',
          component: PropComponents.ColorPicker,
          data: '#FFFFFF'
        },
        {
          field: 'markShadowColor',
          label: '圆环颜色',
          component: PropComponents.ColorPicker,
          data: 'RGBA(43,211,255,0.6)'
        },
        {
          field: 'markHoverColor',
          label: '悬浮中心颜色',
          component: PropComponents.ColorPicker,
          data: 'RGBA(255,255,255,1)'
        },
        {
          field: 'markHoverShadowColor',
          label: '悬浮圆环颜色',
          component: PropComponents.ColorPicker,
          data: 'RGBA(255,224,67,1)'
        }
      ]
    }
  ]
}
