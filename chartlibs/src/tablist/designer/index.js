import { PropComponents } from '@views/dataview/components/DmpChartDev'

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet', //dataSet(数据集), manual(手动输入) ,none(无),

  // 数据是否可排序
  sortable: true,

  // 是否支持触发联动
  linkage: true,

  // 是否属于被联动图标
  canLinked: false,

  // 数据指标规则
  indicatorRules: [
    {
      // 维度
      dim: {
        min: 1,
        max: 1,
        // field_type: '日期', //字段类型限制
        // datefield_formula_mode: ['year', 'month', 'day'] //仅限日期类型的模式限制
      },

      // 数值
      value: {
        max: 0,
        min: 0
      }
    }
  ],

  indicatorDescription: '1个维度, 0个数值',

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
      {
        name: 'TAB1'
      },
      {
        name: 'TAB2'
      }
    ],
    indicators: {
      dims: [
        {
          col_name: 'name'
        }
      ]
    }
  },

  // 图表配置
  chartConfig: [
    {
      title: '全局样式',
      field: 'globalStyle',
      spread: true,
      items: [
        {
          field: 'isShowAll',
          label: '全部按钮',
          component: PropComponents.Checkbox,
          data: true
        },
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
