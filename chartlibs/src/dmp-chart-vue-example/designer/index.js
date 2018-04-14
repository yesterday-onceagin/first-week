import { PropComponents, getVueComponent } from 'dmp-chart-sdk'
import ExampleConfigComponent from './components/ExampleConfigComponent'

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',      //dataSet(数据集), manual(手动输入), none(无)

  // 数据是否可排序
  sortable: true,

  // 默认数据请求条数
  defaultDataSize: 100,

  // 数据指标规则
  indicatorRules: [
    {
      dim: {
        min: 0
      },
      value: {
        min: 1
      }
    }, {
      value: {
        min: 0
      },
      dim: {
        min: 1
      }
    }
  ],
  indicatorDescription: '0个或多个维度，0个或多个数值',

  // 是否支持穿透
  penetrable: false,

  // 是否支持触发联动
  linkage: false,

  // 是否属于被联动图表
  canLinked: false,

  // 默认数据
  previewData: {},

  // 图表配置
  chartConfig: [
    {
      title: '表头',
      field: 'tableHeader',
      show: true,
      spread: false,
      items: [
        {
          field: 'fontSize',
          label: '字号',
          component: {
            component: PropComponents.Spinner,
            props: {
              min: 12
            }
          },
          data: 14
        },
        {
          field: 'color',
          label: '颜色',
          component: PropComponents.ColorPicker,
          data: '#FFFFFF'
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
          data: 30
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
          component: PropComponents.TextAlign,
          data: 'center'
        },
        {
          field: 'background',
          label: '背景颜色',
          component: PropComponents.ColorPicker,
          data: '#092e49'
        },
        {
          field: 'customItem',
          label: '自定义配置项',
          component: getVueComponent(ExampleConfigComponent),
          data: '#ff0000'
        }
      ]
    }
  ]
}
