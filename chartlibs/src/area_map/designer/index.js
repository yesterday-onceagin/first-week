import { PropComponents } from 'dmp-chart-sdk'
import { Utils } from 'dmp-chart-sdk'
import AreaConfig from './AreaConfig'
import PosConfig from './PosConfig'

const { Theme } = Utils
const { generateDefaultColorTheme } = Theme

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',

  // 数据是否可排序
  sortable: true,

  // 报告是否可以设置报告跳转
  hasUrlSetting: true,
  
  // 数据指标规则
  indicatorRules: [
    {
      // 维度
      dim: {
        min: 1,
        max: 3,
        field_type: ['字符串', '地址']
      },

      // 数值
      value: {
        min: 0
      }
    }
  ],

  indicatorDescription: '2个维度(一个地址, 一个字符串), 多个数值',

  /* 预览数据(设计时初始化时显示)
   *
   * 1.当数据来源为dataSet时，示例数据:
   * {
   *   data:[
   *     {
   *       '维度字段名1':'维度值1',
   *       '维度字段名2':'维度值2',
   *       '度量字段1':'度量值1'
   *     }
   *   ],
   *   indicators:{
   *     //维度配置
   *     dims:[
   *       {
   *         col_name:'维度字段名1',
   *         ...其他属性
   *       },
   *       {
   *         col_name:'维度字段名2',
   *         ...其他属性
   *       }
   *     ],
   *     //度量配置
   *     nums:[
   *       {
   *         col_name:'度量字段1',
   *         ...其他属性
   *       }
   *     ]
   *   }
   * }
   *
  */
  previewData: {
    data: [
      {}
    ],
    indicators: {
      dims: [],
      nums: []
    }
  },

  // 图表配置
  chartConfig: [
    {
      title: '地图设置',
      field: 'mapCustomSetting',
      spread: true,
      items: [
        {
          label: '标签显示',
          field: 'labelShow',
          component: {
            component: PropComponents.Select,
            props: {
              options: [
                { value: 'auto', text: '自动适配' },
                { value: 'show', text: '一直显示' },
                { value: 'hide', text: '一直隐藏' },
              ]
            }
          },
          data: 'auto', //show hide auto
        }, {
          label: '合并同名标签',
          field: 'unionLabel',
          component: PropComponents.Checkbox,
          data: false
        }, {
          label: '标签颜色',
          field: 'label',
          items: [
            {
              label: '文字颜色',
              field: 'color',
              component: PropComponents.ColorPicker,
              data: 'rgba(255,255,255,1)'
            },
            {
              label: '背景颜色',
              field: 'background',
              component: PropComponents.ColorPicker,
              data: 'rgba(21,51,103,1)'
            }
          ]
        }, {
          field: 'areaSetting',
          // label: '区域设置',
          component: AreaConfig,
          data: {
            list: []
          }
        }, {
          field: 'pos',
          component: PosConfig,
          data: {
            center: [105, 35],
            zoom: 3
          }
        }, {
          field: 'customMarkers',
          component: null,
          data: {
            list: []
          }
        }
      ]
    }, {
      title: '配色方案',
      spread: true,
      field: 'theme',
      items: [{
        label: '',
        field: 'colorTheme',
        component: {
          component: PropComponents.ColorThemeConfig,
          props: {
            gradient: false,
            dimensionSwitch: false,
            legends: (chart, chartData) => {
              chartData = chartData || []
              const { dims } = chart
              if (dims.length < 2) {
                return ['地图需要两个维度哦']
              }
              let addressDim = dims[0]
              if (dims[1].data_type === '地址') {
                addressDim = dims[1]
              }
              const { col_name } = addressDim
              const legendList = []
              chartData.forEach((item) => {
                const name = item[col_name]
                if (legendList.indexOf(name) === -1) {
                  legendList.push(name)
                }
              })
              return legendList
            }
          }
        },
        data: generateDefaultColorTheme(),
      }],
    }
  ]
}
