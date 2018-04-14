import { PropComponents } from 'dmp-chart-sdk'

import MovingAverageConfig from './components/MovingAverageConfig'
import LineConfig from './components/LineConfig'

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',      //dataSet(数据集), manual(手动输入), none(无)

  // 数据是否可排序
  sortable: false,

  // 报告是否可以设置报告跳转
  hasUrlSetting: false,
  
  // 默认数据请求条数
  defaultDataSize: 100,

  // 数据指标规则
  indicatorRules: [
    {
      dim: {
        min: 1,
        max: 1,
        field_type: '日期',
        datefield_formula_mode: ['day']
      },
      value: {
        min: 4,
        max: 5
      }
    }
  ],

  indicatorDescription: '1个维度（日期），4-5个数值（前4个数值顺序为：初始值、终止值、最大值、最小值，第5个数值为额外用折线展示的数值字段）',

  // 是否支持穿透
  penetrable: false,

  // 是否支持触发联动
  linkage: false,

  // 是否有次轴
  hasZaxis: false,

  // 是否有目标数值
  hasDesiredvalue: false,

  // 是否属于被联动图表
  canLinked: true,

  // 默认数据
  previewData: {
    data: [
      { date: '2018-02-10', open: 256, end: 233, high: 256, low: 222 },
      { date: '2018-02-11', open: 234, end: 211, high: 234, low: 201 },
      { date: '2018-02-12', open: 211, end: 200, high: 223, low: 198 },
      { date: '2018-02-13', open: 200, end: 170, high: 205, low: 165 },
      { date: '2018-02-14', open: 178, end: 140, high: 178, low: 135 },
      { date: '2018-02-15', open: 140, end: 111, high: 150, low: 110 },
      { date: '2018-02-16', open: 113, end: 120, high: 130, low: 100 },
      { date: '2018-02-17', open: 125, end: 118, high: 130, low: 105 },
      { date: '2018-02-18', open: 120, end: 121, high: 130, low: 110 },
      { date: '2018-02-19', open: 123, end: 124, high: 133, low: 110 },
      { date: '2018-02-20', open: 125, end: 114, high: 138, low: 104 },
      { date: '2018-02-21', open: 113, end: 100, high: 115, low: 99 },
      { date: '2018-02-22', open: 98, end: 90, high: 105, low: 80 },
      { date: '2018-02-23', open: 90, end: 80, high: 100, low: 75 },
      { date: '2018-02-24', open: 80, end: 85, high: 92, low: 70 },
      { date: '2018-02-25', open: 88, end: 90, high: 100, low: 74 },
      { date: '2018-02-26', open: 92, end: 100, high: 110, low: 88 },
      { date: '2018-02-27', open: 100, end: 90, high: 104, low: 84 },
      { date: '2018-02-28', open: 90, end: 100, high: 110, low: 90 },
      { date: '2018-03-01', open: 100, end: 120, high: 150, low: 100 },
      { date: '2018-03-02', open: 120, end: 150, high: 190, low: 110 },
      { date: '2018-03-03', open: 150, end: 120, high: 170, low: 100 },
      { date: '2018-03-04', open: 120, end: 90, high: 150, low: 70 },
      { date: '2018-03-05', open: 100, end: 90, high: 150, low: 65 },
      { date: '2018-03-06', open: 90, end: 120, high: 150, low: 86 },
      { date: '2018-03-07', open: 120, end: 160, high: 180, low: 114 },
      { date: '2018-03-08', open: 170, end: 200, high: 211, low: 166 },
      { date: '2018-03-09', open: 198, end: 230, high: 240, low: 180 },
      { date: '2018-03-10', open: 225, end: 220, high: 240, low: 200 },
      { date: '2018-03-11', open: 220, end: 211, high: 234, low: 200 },
      { date: '2018-03-12', open: 216, end: 233, high: 250, low: 210 },
      { date: '2018-03-14', open: 243, end: 256, high: 259, low: 240 },
      { date: '2018-03-15', open: 256, end: 233, high: 256, low: 222 },
      { date: '2018-03-16', open: 234, end: 211, high: 234, low: 201 },
      { date: '2018-03-17', open: 211, end: 200, high: 223, low: 198 },
      { date: '2018-03-18', open: 200, end: 170, high: 205, low: 165 },
      { date: '2018-03-19', open: 178, end: 140, high: 178, low: 135 },
      { date: '2018-03-20', open: 140, end: 111, high: 150, low: 110 },
      { date: '2018-03-21', open: 113, end: 120, high: 130, low: 100 },
      { date: '2018-03-22', open: 125, end: 118, high: 130, low: 105 },
      { date: '2018-03-23', open: 120, end: 121, high: 130, low: 110 },
      { date: '2018-03-24', open: 123, end: 124, high: 133, low: 110 },
      { date: '2018-03-25', open: 125, end: 114, high: 138, low: 104 },
      { date: '2018-03-26', open: 113, end: 100, high: 115, low: 99 },
      { date: '2018-03-27', open: 98, end: 90, high: 105, low: 80 },
      { date: '2018-03-28', open: 90, end: 80, high: 100, low: 75 },
      { date: '2018-03-29', open: 80, end: 85, high: 92, low: 70 },
      { date: '2018-03-30', open: 88, end: 90, high: 100, low: 74 },
      { date: '2018-03-31', open: 92, end: 100, high: 110, low: 88 }
    ],
    indicators: {
      dims: [
        {
          col_name: 'date'
        }
      ],
      nums: [
        {
          col_name: 'open'
        }, {
          col_name: 'end'
        }, {
          col_name: 'high'
        }, {
          col_name: 'low'
        }
      ]
    }
  },

  // 图表配置
  chartConfig: [
    {
      title: '全局样式',
      field: 'global',
      spread: false,
      items: [
        {
          label: '边距',
          field: 'padding',
          items: [{
            field: 'grid',
            label: '',
            component: {
              component: PropComponents.GridSpinner,
              props: {
                indent: false,
                options: [
                  {
                    name: 'top',
                    label: '上',
                    max: +Infinity,
                    min: -Infinity,
                    step: 1
                  },
                  {
                    name: 'bottom',
                    label: '下',
                    max: +Infinity,
                    min: -Infinity,
                    step: 1
                  },
                  {
                    name: 'left',
                    label: '左',
                    max: +Infinity,
                    min: -Infinity,
                    step: 1
                  },
                  {
                    name: 'right',
                    label: '右',
                    max: +Infinity,
                    min: -Infinity,
                    step: 1
                  }
                ]
              }
            },
            data: {
              top: 40,
              right: 20,
              bottom: 60,
              left: 20
            }
          }]
        }, {
          label: '',
          field: 'lineConfig',
          component: LineConfig,
          data: {
            lineStyle: 'solid',
            lineWidth: 1,
            circleWidth: 4,
            lineSmooth: true,
            color: '#FFFFFF'
          }
        }, {
          label: '',
          field: 'movingAverage',
          component: MovingAverageConfig,
          data: {
            show: false,
            lineStyle: 'solid',
            lineWidth: 1,
            circleWidth: 4,
            lines: [
              // 均值曲线默认4条
              {
                name: '5日均线',
                dayCount: 5,
                color: '#DBDADF'
              }, {
                name: '10日均线',
                dayCount: 10,
                color: '#E03A82'
              }, {
                name: '20日均线',
                dayCount: 20,
                color: '#EDC458'
              }, {
                name: '30日均线',
                dayCount: 30,
                color: '#41A7FC'
              }
            ]
          }
        }
      ]
    }, {
      title: 'K线颜色',
      spread: true,
      field: 'theme',
      items: [{
        label: '上涨颜色',
        field: 'upColor',
        component: PropComponents.ColorPicker,
        data: '#F14A37'
      }, {
        label: '上涨边框颜色',
        field: 'upBorderColor',
        component: PropComponents.ColorPicker,
        data: '#F14A37'
      }, {
        label: '下跌颜色',
        field: 'downColor',
        component: PropComponents.ColorPicker,
        data: '#52A53B'
      }, {
        label: '下跌边框颜色',
        field: 'downBorderColor',
        component: PropComponents.ColorPicker,
        data: '#52A53B'
      }],
    }, {
      title: '图例',
      field: 'legend',
      show: false,
      spread: false,
      items: [
        {
          label: '字号',
          field: 'fontSize',
          component: {
            component: PropComponents.Spinner,
            props: {
              min: 12
            }
          },
          data: 12
        }, {
          label: '颜色',
          field: 'color',
          component: PropComponents.ColorPicker,
          data: '#C7E0FF',
        }, {
          label: '位置',
          field: 'position',
          component: {
            component: PropComponents.Select,
            props: {
              options: [
                { value: 'top-center', text: '顶部居中' },
                { value: 'top-left', text: '顶部居左' },
                { value: 'top-right', text: '顶部居右' },
                { value: 'bottom-center', text: '底部居中' },
                { value: 'bottom-left', text: '底部居左' },
                { value: 'bottom-right', text: '底部居右' },
              ]
            }
          },
          data: 'top-center'
        }, {
          label: '间距',
          field: 'gap',
          component: {
            component: PropComponents.Spinner,
            props: {
              min: 0
            }
          },
          data: 5
        }
      ]
    }, {
      title: 'x轴',
      field: 'x',
      spread: false,
      items: [
        {
          label: '轴标签',
          field: 'label',
          show: {
            field: 'show',
            data: true
          },
          items: [
            {
              label: '字号',
              field: 'fontSize',
              data: 12,
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 12
                }
              }
            }, {
              label: '颜色',
              field: 'color',
              data: '#C7E0FF',
              component: PropComponents.ColorPicker
            }, {
              label: '全部标签',
              field: 'showAll',
              data: false,
              component: PropComponents.Checkbox
            }, {
              label: '角度',
              field: 'angle',
              data: 'horizon',
              component: {
                component: PropComponents.Select,
                props: {
                  options: [
                    { value: 'horizon', text: '水平' },
                    { value: 'italic', text: '斜角' },
                    { value: 'vertical', text: '垂直' },
                  ]
                }
              }
            }
          ]
        }, {
          label: '轴线',
          field: 'axis',
          show: {
            field: 'show',
            data: true
          },
          items: [
            {
              label: '颜色',
              field: 'color',
              data: '#C7E0FF',
              component: PropComponents.ColorPicker
            }
          ]
        }
      ]
    }, {
      title: 'y轴',
      field: 'y',
      spread: false,
      items: [
        {
          label: '轴标签',
          field: 'label',
          show: {
            field: 'show',
            data: true
          },
          items: [
            {
              label: '字号',
              field: 'fontSize',
              data: 12,
              component: {
                component: PropComponents.Spinner,
                props: {
                  min: 12
                }
              }
            }, {
              label: '颜色',
              field: 'color',
              data: '#C7E0FF',
              component: PropComponents.ColorPicker
            }, {
              label: '角度',
              field: 'angle',
              data: 'horizon',
              component: {
                component: PropComponents.Select,
                props: {
                  options: [
                    { value: 'horizon', text: '水平' },
                    { value: 'italic', text: '斜角' },
                    { value: 'vertical', text: '垂直' },
                  ]
                }
              }
            }
          ]
        }, {
          label: '轴线',
          field: 'axis',
          show: {
            field: 'show',
            data: true
          },
          items: [
            {
              label: '颜色',
              field: 'color',
              data: '#C7E0FF',
              component: PropComponents.ColorPicker
            }
          ]
        }, {
          field: 'markline',
          scope: 'yMarkline',
          label: '',
          component: {
            component: PropComponents.MarklineConfig,
            props: {
              axis: 'y',
              dynamic: true, // 支持计算值
            }
          },
          data: {
            show: true,
            color: '#41dfe3',
            width: 1,
            style: 'dashed',
            data: []
          }
        }
      ]
    }
  ]
}
