import { PropComponents } from 'dmp-chart-sdk'

export default {
  // 数据来源
  dataSourceOrigin: 'manual',      //dataSet(数据集), manual(手动输入), none(无)

  // 默认数据
  previewData: {},

  // 图表配置
  chartConfig: [
    {
      field: 'containerTitle',
      disabled: true
    },
    {
      title: '文本',
      field: 'text',
      spread: true,
      items: [
        {
          field: 'content',
          component: {
            component: PropComponents.Input,
            props: {
              type: 'textarea',
              placeholder: '请输入文本内容'
            }
          },
          data: ''
        },
        {
          field: 'fontSize',
          label: '字号',
          component: {
            component: PropComponents.Spinner,
            props: {
              min: 12
            }
          },
          data: 24
        },
        {
          field: 'color',
          label: '颜色',
          component: PropComponents.ColorPicker,
          data: '#24BCFA'
        },
        {
          field: 'lineHeight',
          label: '行高',
          component: {
            component: PropComponents.Spinner,
            props: {
              min: 12
            }
          },
          data: 24
        },
        {
          field: 'fontStyle',
          label: '样式',
          component: PropComponents.FontStyle,
          data: {
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none'
          }
        },
        {
          field: 'textAlign',
          label: '对齐',
          component: {
            component: PropComponents.TextAlign,
            props: {
              allow_justify: true
            }
          },
          data: 'left'
        }
      ]
    }
  ]
}
