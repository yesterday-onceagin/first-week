

import { PropComponents } from 'dmp-chart-sdk'
import MyComponent from './components/mycomponent'

export default {
  // 数据来源
  dataSourceOrigin: 'dataSet',      //dataSet(数据集), manual(手动输入), none(无)

  // 数据是否可排序
  sortable: true,

  // 默认数据请求条数
  defaultDataSize: 100,

  // 数据指标规则, 维度和数值字段数量限制
  indicatorRules: [
    {
      //vim 维度
      dim: {
        min: 0
      },
      //value 数值字段
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
  // 数据指标说明
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
  chartConfig: [{
    title: '表头',          // 模块名称
    field: 'tableHeader',  // 模块字段，必填
    show: true,            // 设置模块开关按钮的状态(开启或关闭)，不设置该属性则不显示开关按钮
    spread: false,         // 设置模块的展开状态(下拉展开或收缩隐藏)
    items: [               // 配置模块包含配置组或配置项
      //这是一个配置组
      {
        field: 'fontSize',  // 配置组字段，必填
        label: '字号',      // 配置组名称
        show:{              // 配置组开关按钮，不设置则不显示
          field: 'checked',  // 开关字段名，必填
          data: true         // 开关按钮状态(开启或关闭)
        },
        items:[             // // 配置组包含配置项，不支持嵌套配置组
          //这是一个配置项
          {
            field: 'item1',      // 配置项字段，必填
            label: '配置项1',     // 配置项名称，不设置该属性则不显示label

            //这是一个内置配置组件
            component: PropComponents.ColorPicker, 
            data: ''             // 配置项默认值，传入配置组件
          }
        ],           
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
        component: MyComponent,
        data: 'test'
      }
    ]
  }]
}
