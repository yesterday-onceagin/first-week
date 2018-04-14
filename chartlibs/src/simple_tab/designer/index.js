import { PropComponents } from 'dmp-chart-sdk'
import TabConfig from './TabConfig'

import { DEFAULT_TABS_ARRAY } from '../src/constant'

export default {
  // 数据来源
  dataSourceOrigin: 'none', //dataSet(数据集), manual(手动输入) ,none(无),

  // 数据是否可排序
  sortable: false,

  previewData: {
    data: []
  },

  // 图表配置
  chartConfig: [
    {
      field: 'containerTitle',
      disabled: true
    },
    {
      title: '全局样式',
      field: 'globalStyle',
      spread: true,
      items: [
        {
          field: 'layout',
          label: '布局',
          component: {
            component: PropComponents.Select,
            props: {
              options: [
                { value: 'horizontal', text: '水平排列' },
                { value: 'vertical', text: '垂直排列' }
              ]
            }
          },
          data: 'horizontal'
        },
        {
          field: 'play',
          label: '轮播',
          // 是否显示该配置组
          show: {
            field: 'isLoop',
            data: false
          },
          items: [
            {
              field: 'duration',
              label: '间隔时间',
              component: {
                component: PropComponents.Spinner,
                props: {
                  unit: '秒'
                }
              },
              data: 10
            }
          ]
        }
      ]
    },
    {
      title: '标签配置',
      field: 'labelConfig',
      spread: true,
      items: [
        {
          field: 'tabConfig',
          component: TabConfig,
          data: {
            tabs: DEFAULT_TABS_ARRAY
          }
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
          data: 14
        },
        {
          field: 'color',
          label: '颜色',
          component: PropComponents.ColorPicker,
          data: '#C7E0FF'
        },
        {
          field: 'fontStyle',
          label: '样式',
          component: PropComponents.FontStyle,
          data: {
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'normal'
          }
        },
        {
          field: 'textAlign',
          label: '对齐',
          component: PropComponents.TextAlign,
          data: 'center'
        },
        {
          field: 'backgroundColor',
          label: '背景颜色',
          component: PropComponents.ColorPicker,
          data: '#3267A7'
        },
        {
          field: 'borderRadius',
          label: '圆角',
          component: PropComponents.Spinner,
          data: 6
        },
        {
          field: 'space',
          label: '标签间距',
          component: PropComponents.Spinner,
          data: 6
        },
        {
          field: 'activeColor',
          label: '选中文字色',
          component: PropComponents.ColorPicker,
          data: '#3267A7'
        },
        {
          field: 'activeBackgroundColor',
          label: '选中背景色',
          component: PropComponents.ColorPicker,
          data: '#458EE7'
        },
        {
          field: 'hoverBackgroundColor',
          label: '悬浮背景色',
          component: PropComponents.ColorPicker,
          data: '#458EE7'
        }
      ]
    }
  ]
}
