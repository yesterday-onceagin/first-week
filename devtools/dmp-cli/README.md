# DMP大数据平台-组件开发指南

<span id="dmp-cli"></span>
## 一、开发工具

### 安装

```bash
npm install dmp-cli -g
```
> windows下若出现fsevents安装失败，尝试在命令后面添加--no-optional参数

运行dmp，输出以下画面，说明安装成功。

![dmp help](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-help.jpg)

### 初始化组件

```bash
dmp init 
```
> windows下需使用管理员权限执行

然后输入组件基本信息，指定使用的前端框架类型(react,vue)后, 拉取对应框架的示例组件模板，组件就创建好了。

![dmp init](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-init-selectjs.jpg)


### 运行组件

```bash
cd 你组件的文件夹名
dmp run 
```

> windows下需使用管理员权限执行 

此时,浏览器打开了预览组件页.

#### 数据页

开发工具提供了内置示例数据集，供组件测试数据用。

![dmp run](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-run.jpg)


#### 样式配置页

开发者自行开发组件的样式配置选项，会显示在样式配置页中，见样式配置开发指南

![dmp run style](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-run-style.jpg)

### 打包组件

```bash
dmp package
```

> windows下需使用管理员权限执行

执行该命令，进行组件构建及打包操作，生成一个zip包，然后就可以上传到组件中心了。

<span id="dmp-package-direc"></span>
## 二、组件包目录结构
- react示例

![dmp directory](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-react-directory.jpg)

- vue示例

![dmp directory](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-vue-directory.jpg)

- 结构说明

```javascript
coms-name              //组件名
   |--designer/        //组件设计时配置代码
   |--src/             //组件运行时代码
   |--index.js         //组件主入口
   |--platform/        //上传到组件中心用到的素材(如icon图标）
   |--package.json     //组件包配置文件，上传到组件中心时，会读取该配置
```
<span id="dmp-dev-guide"></span>
## 三、组件开发入门

### 1、主入口，index.js填写组件基本信息

- react示例

```javascript
import component from './src/index'
import designer from './designer'

export default {
  info: {
    name: '测试组件',         // 组件的中文名称
    code: 'chart-example',  // 组件的英文名称，与包名一致
    type: 'chart'           // 图表类型: chart(图表)，filter(过滤器)，auxiliary(辅助图形)
  },
  component,
  designer
}

```

- vue示例

```javascript
//引入dmp组件开发sdk
import { Connect, getVueComponent } from 'dmp-chart-sdk'

import component from './src/index'
import designer from './designer'

export default {
  info: {
    name: '测试组件',              // 组件的中文名称
    code: 'vue-chart-example',   // 组件的英文名称，与包名一致
    type: 'chart'                // 图表类型: chart(图表)，filter(过滤器)，auxiliary(辅助图形)
  },
  component: Connect()(getVueComponent(component)),  // 引入vue组件，并connect到平台
  designer
}

```

### 2、组件设计时配置，designer/index.js填写组件配置信息

```javascript

// 引入组件开发SDK，调用样式配置基础组件
import { PropComponents } from 'dmp-chart-sdk'

export default {

  // 数据来源，可选范围：dataSet(数据集), manual(手动输入), none(无)
  dataSourceOrigin: 'dataSet',
  
  // 数据是否可排序
  sortable: true,

  // 默认数据请求条数
  defaultDataSize: 100,

  // 数据指标规则, 维度和数值字段数量限制
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

  // 图表样式配置项，详情见《五、样式配置chartConfig说明》
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
          {...},
          {...},
          {...}
        ]
      },
      {...},
      {...},
      {...}
  ]
}
```

### 3、组件运行时，src/index.jsx(.vue)代码开发

组件内部会接收到config(样式配置对象数据)、data(数据集返回的数据)、events(触发的事件)等props属性

- react示例

```javascript
import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

// 引入组件开发SDK，本地不需要安装此包
import { Connect } from 'dmp-chart-sdk'

class ChartExample extends React.Component {
  static propTypes = {
    designTime: PropTypes.bool,    // 是否处于设计时状态
    data: PropTypes.object,        // 从数据集选择维度和数值字段后返回的数据
    config: PropTypes.object,      // 全部样式配置的对象数据
    events: PropTypes.object,      // 组件内部可调用平台的内置事件
    layer: PropTypes.object,       // 组件在编辑区的图层信息
    scale: PropTypes.number,       // 组件在编辑区的缩放比例
  }

  constructor(props) {
    super(props)
    const { data, indicators } = props.data || {}
    this.state = {
      data
    }
  }

  shouldComponentUpdate(nextProps) {
    const { scale, layer } = this.props
    if (nextProps.scale !== scale || !_.isEqual(nextProps.layer, layer)) {
      return false
    }
    return true
  }

  componentWillReceiveProps(nextProps) {
    const { data, indicators } = nextProps.data || {}
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        data
      })
    }
  }

  render() {
    const { config } = this.props
    const { data } = this.state
    
    return (
      <div className="graph-inner-box">
        我的自定义图表组件
      </div>
    );
  }
}

// 需要使用Connet
export default Connect()(ChartExample)
```

- vue示例

```javascript
<template>
  <div class="graph-inner-box">
    我的自定义图表组件
  </div>
</template>

<script>
import _ from "lodash"
import { Utils } from "dmp-chart-sdk"

export default {
  props: {
    designTime: Boolean,  // 是否处于设计时状态
    data: Object,         // 从数据集选择维度和数值字段后返回的数据
    config: Object,       // 全部样式配置的对象数据
    events: Object,       // 组件内部可调用平台的内置事件
    layer: Object,        // 组件在编辑区的图层信息
    scale: Number         // 组件在编辑区的缩放比例
  },
  watch: {
    data: {
      immediate: true,
      handler: function(val, oldVal) {
        if (!_.isEqual(val, oldVal)) {
          //更新组件
        }
      }
    },
    config: {
      immediate: true,
      handler: function(val, oldVal) {
        if (!_.isEqual(val, oldVal)) {
          //更新组件
        }
      }
    }
  }
};
</script>
```

### 4、配置package.json

```javascript
{
  "name": "chart-example",
  "version": "0.0.1",
  "description": "这是一个测试组件",
  
  //上传到组件中心的相关配置
  "platform": {
  
    //组件中文名称
    "name": "测试组件",
    
    //组件的素材(组件icon图标、组件封面图片)
    "icon": "/platform/icon/table_light.png",
    "previewImg": "/platform/preview/table_sample.jpg",
    
    //组件说明，可填写指标规则、支持的配置等信息
    "description": "指标支持(0个或多个维度，0个或多个数值),不支持穿透、联动"
  }
}
```

### 5、打包组件，上传到组件中心
```bash
dmp package  //zip压缩文件输出到pack目录
```
<span id="dmp-devsdk"></span>
## 四、组件开发SDK

平台提供了图表组件开发SDK: dmp-chart-sdk

```javascript
import {
  Connect,
  PropComponents,
  Utils,
  
  getVueComponent,
  convertToVueComponent
} from 'dmp-chart-sdk'
```

### Connect 

连接器，为图表组件与DMP大数据可视化平台提供了连接，提供了开发相关的props属性

```javascript
export default Connect()(MyChart)
```

| 属性(prop) | 含义 | 备注|
|:-----:|:-----:|:-----:|
| designTime | 组件是否处于设计时(可编辑状态) | -
| data | 组件请求返回的数据 | { data, indicators, ... }
| config | 组件的样式配置数据 | {module1:{...},module2:{...}}
| configInList | 组件的样式配置原始数据(chartConfig) | [{field:'module1',...},{field:'module2',...}]
| through | 组件是否为可穿透状态  | -
| throughList | 当前图表组件所在的穿透链 | [mainChart, throughChart1, throughChart2,...]
| layer | 组件在大屏中的图层信息 | {x:100,y:200,z:1000,w:200,h:200}
| scale | 组件在大屏中的缩放比例| -
| events | 组件可触发的事件 | -

| 事件(events) | 含义 |
|:-----:|:-----:|
| onPenetrateQuery(chartCode, fieldValue) | 穿透查询事件 
| onRelateFilter(conditions, chartId) | 全局联动事件 
| onRelateChart(conditions, chartId) | 单图联动事件 
| onFilterChange(conditions, chartId) | 全局筛选事件 

### PropComponents
内置样式配置基础组件，详情见《六、内置样式配置组件PropComponents列表》

### Utils

实用方法

| 方法 | 调用说明 | 备注|
|:-----:|:-----:|:-----:|
| Utils.DataUtils.pluckDimsData| 从data获取维度字段数据 | const dimsData = DataUtils.pluckDimsData(data, indicators)
| Utils.DataUtils.pluckNumsData| 从data获取数值字段数据 | const numsData = DataUtils.pluckNumsData(data, indicators)
| Utils.formatDisplay | 格式化维度或数值字段的数据 | Utils.formatDisplay(fieldValue, fieldDisplayFormat)

### getVueComponent

getVueComponent('path/to.vue')

引入vue文件，使vue组件能够在dmp平台运行

### convertToVueComponent

使dmp组件sdk提供的基础属性组件PropComponents，能够在vue文件内使用

vue文件示例：

```javascript
<template>
  <color-picker :data="color" :onChange="onChangeColor"/>
</template>

<script>
import { PropComponents, convertToVueComponent } from "dmp-chart-sdk"

export default {
  components: {
    ColorPicker: convertToVueComponent(PropComponents.ColorPicker)
  }
};
</script>
```
<span id="dmp-chartConfig"></span>
## 五、样式配置chartConfig说明

chartConfig配置用以说明组件有哪些配置,既用于传给组件,也用于说明编辑器的选项.

四种概念：

- 配置模块
- 配置组
- 配置项
- 配置组件

###示例：

```javascript
//使用组件SDK的基础配置组件PropComponents
import { PropComponents } from 'dmp-chart-sdk'

export default {

  chartConfig:[
    //这是一个配置模块
    {
      field: 'module1',        // 模块字段，必填
      title: '模块1',           // 模块名称
      show: true,              // 设置模块开关按钮的状态(开启或关闭)，不设置该属性则不显示开关按钮
      spread: true,            // 设置模块的展开状态(下拉展开或收缩隐藏)
      items: [                 // 配置模块包含配置组或配置项
        
        //这是一个配置组
        {
          field: 'group1',     // 配置组字段，必填
          label: '配置组1',     // 配置组名称
          show: {              // 配置组开关按钮，不设置则不显示
            field: 'checked',  // 开关字段名，必填
            data: true         // 开关按钮状态(开启或关闭)
          },
          items:[              // 配置组包含配置项，不支持嵌套配置组
            
            //这是一个配置项
            {
              field: 'item1',      // 配置项字段，必填
              label: '配置项1',     // 配置项名称，不设置该属性则不显示label
              
              //这是一个内置配置组件
              component: PropComponents.ColorPicker, 
              data: ''             // 配置项默认值，传入配置组件
            }
          ]
        },
        
        //这是一个配置项
        {
          field: 'item2',      // 配置项字段，必填
          label: '配置项2',     // 配置项名称，不设置该属性则不显示label
          
          //这是一个内置配置组件，可传递prop属性
          component: {
           component: PropComponents.Spinner,
           props: {
             min: 12
           }
          },
          data: 14          // 配置项默认值，传入配置组件
        }
      ]
    }
  ]
}
```

### 传递给组件的配置数据

```javascript

//react
const { config } = this.props

//vue 
const config = this.config

//配置JSON数据如下
config={
  module1:{
    show: true,
    spread: true
    group1:{
      checked: true,
      item1: ''
    }
    item2: 14
  }
}
```

### 效果
![dmp chartconfig](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-chartconfig-example.jpg)

平台内置通用配置(标题、背景、边框)，可选择禁用(不建议)。

```javascript
chartConfig=[

  //禁用标题模块
  {
    field: 'containerTitle',
    disabled: true
  },
  
  //禁用背景模块
  {
    field: 'containerBackground',
    disabled: true
  },
  
  //禁用边框模块
  {
    field: 'containerBorder',
    disabled: true
  }
]
```

<span id="dmp-propcoms"></span>
## 六、内置样式配置组件PropComponents列表

### PropComponents.ColorPicker

![dmp colorpicker](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-com-colorpicker.jpg)

####示例

```javascript
{
  component: PropComponents.ColorPicker,
  data: '#24BCFA'
}
```

### PropComponents.DatePicker

![dmp datepicker](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-com-datepicker-range.jpg)

| 配置属性(prop) | 含义 | 默认值|
|:-----:|:-----:|:-----:|
| single | 日期格式为单日期，还是区间 |  true
| parentEl | 日期控件挂载父节点 | body

####示例

```javascript
{
  component: {
    component: PropComponents.DatePicker,
    props:{
      single: false,
      parentEl: 'body'
    }
  },
  data: ['2017-08-16', '2017-10-25'] // single:true时，data:'2017-08-16'
}
```

### PropComponents.Spinner

![dmp spinner](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-com-spinner.jpg)

| 配置属性(prop) | 含义 | 默认值|
|:-----:|:-----:|:-----:|
| max | 最大值 | 无穷大 
| min | 最小值 | 0 
| step | 数字间隔 | 1 
| unit | 单位 | px 

####示例

```javascript
{
  component: {
    component: PropComponents.Spinner,
    props:{
      max: 60,
      min: 12,
      step: 1,
      unit: 'px'
    }
  },
  data: 12
}
```

### PropComponents.GridSpinner

![dmp gridspinner](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-com-gridspinner.jpg)

| 配置属性(prop) | 含义 | 默认值| 备注
|:----:|:----:|:----:|:----:|
|options|配置选项|[]|[{name:'width', label:'宽', max: +Infinity, min: 10, step: 1},{...},{...},{...}]

####示例

```javascript
{
  component: {
    component: PropComponents.GridSpinner,
    props: {
      indent: false,
      options: [
        {
          name: 'width',
          label: '宽',
          max: +Infinity,
          min: 10,
          step: 1
        },
        {
          name: 'height',
          label: '高',
          max: +Infinity,
          min: 10,
          step: 1
        },
        {
          name: 'x',
          label: 'X',
          max: +Infinity,
          min: -Infinity,
          step: 1
        },
        {
          name: 'y',
          label: 'Y',
          max: +Infinity,
          min: -Infinity,
          step: 1
        }
      ]
    } 
  },
  data: {
    width: 478,
    height: 360,
    x: 86,
    y: 44
  }
}
```

### PropComponents.TimeSpinner

![dmp timespinner](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-com-timespinner.jpg)


####示例

```javascript
{
  component: PropComponents.TimeSpinner,
  data: {
    time: 0,
    unit: 'hour'  //hour, minute, second
  }
}
```

### PropComponents.Input

![dmp input](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-com-input.jpg)

####示例

```javascript
{
  component: PropComponents.Input,
  data: '文本框'
}
```


### PropComponents.Checkbox

![dmp checkbox](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-com-checkbox.jpg)

####示例

```javascript
{
  component: PropComponents.Checkbox,
  data: true
}
```


### PropComponents.Select

![dmp select](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-com-select.jpg)

| 配置属性(prop) | 含义 | 默认值| 备注
|:-----:|:-----:|:-----:|:-----:|
| style | 样式 | - | 
| options | 选项 | [] | [{ value: '值', text: '文本' }]

####示例

```javascript
{
  component: {
    component: PropComponents.Select,
    props:{
      options:[
        { value: '文字', text: '文字' }, 
        { value: '图片', text: '图片' }
      ]
    }
  },
  data: "文字"
}
```

### PropComponents.Border

![dmp border](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-com-border.jpg)

####示例

```javascript
{
  component: PropComponents.Border,
  data: {
     borderColor: 'transparent',
     borderStyle: 'solid',       //solid(实线), dashed(虚线), dotted(点线)
     borderWidth: 0
  }
}
```

### PropComponents.FontStyle

![dmp fontstyle](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-com-fontstyle.jpg)

####示例

```javascript
{
  component: PropComponents.FontStyle,
  data: {
     fontWeight: 'normal',   //bold, normal
     fontStyle: 'normal',    //italic, normal
     textDecoration: 'none'  //underline, none
  }
}
```


### PropComponents.TextAlign

![dmp textalign](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-com-textalign.jpg)

####示例

```javascript
{
  component: PropComponents.TextAlign,
  data: 'left'  //left, center, right
}
```

### PropComponents.Slider

![dmp slider](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-com-slider.jpg)

| 配置属性(prop) | 含义 | 默认值|
|:-----:|:-----:|:-----:|
| max | 最大值 | 1 
| min | 最小值 | 0 
| step | 数字间隔 | 0.01 

####示例

```javascript
{
  component: {
    component: PropComponents.Slider,
    props: {
      min: 0,
      max: 100,
      step: 1
    }
  },
  data: 50
}
```

<span id="dmp-propcoms-extend"></span>
## 七、扩展样式配置组件PropComponent

开发者可扩展开发样式配置组件，以满足图表的个性配置

基础Prop属性:

| 属性(prop) | 含义 |
|:-----:|:-----:|
| chart | 当前图表的相关配置(数据集、维度等)
| chartData | 当前图表请求返回的数据
| data | 当前配置项的值
| onChange | 配置项值修改后需触发的事件

- react示例

```javascript
import { PropComponents } from 'dmp-chart-sdk'
import MyComponent from './components/mycomponent'

export default {
  chartConfig:[
    {
      field: 'module1',        
      title: '模块1',          
      show: true,            
      spread: true,            
      items: [   
        {
          field: 'customItem',
          label: '自定义配置项',
          component: MyComponent,  //使用自己开发的配置组件
          data: 'test'
        }
      ]             
    }
  }
}
```

mycomponent.jsx

```javascript
import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

class MyComponent extends React.Component {
  static propTypes = {
    chart: PropTypes.object,     //当前图表的相关配置(数据集、维度等)
    chartData: PropTypes.object, //当前图表请求返回的数据
    data: PropTypes.object,      //当前配置项的值
    onChange: PropTypes.func     //配置项值修改后需触发的事件
  }

  constructor(props) {
    super(props)
    this.state = {
      data: props.data
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.chart, this.props.chart)) {
      this.setState({
        data: nextProps.data
      })
    }
  }

  render() {
    const { data } = this.state
    return (
      <div className="diagram-design-config-content">
        <div className="form">
          <input
            type="text"
            className="form-control"
            value={data}
            onChange={this.handleChange}
          />
        </div>
      </div>
    )
  }

  handleChange = (e) => {
    const data = e.target.value
    this.setState({
      data
    }, () => {
      this.props.onChange(data)
    })
  }
}

export default MyComponent

```

- vue示例

```javascript
import { PropComponents, getVueComponent } from 'dmp-chart-sdk'
import MyComponent from './components/mycomponent.vue'

export default {
  chartConfig:[
    {
      field: 'module1',        
      title: '模块1',          
      show: true,            
      spread: true,            
      items: [   
        {
          field: 'customItem',
          label: '自定义配置项',
          component: getVueComponent(MyComponent),  //引入自己开发的vue配置组件
          data: 'test'
        }
      ]             
    }
  }
}
```

mycomponent.vue

```javascript
<template>
  <div className="diagram-design-config-content">
    <div className="form">
      <color-picker :data="color" :onChange="onChangeColor"/>
    </div>
  </div>
</template>

<script>
import { PropComponents, convertToVueComponent } from "dmp-chart-sdk";

export default {
  props: {
    chart: Object,
    chartData: Object,
    data: String,
    onChange: Function
  },
  data() {
    return {
      color: this.data
    };
  },
  components: {
    ColorPicker: convertToVueComponent(PropComponents.ColorPicker)
  },
  methods: {
    onChangeColor(color) {
      this.$set({ color });
      this.onChange(color);
    }
  }
};
</script>
```

### 效果

![dmp propcomponent](http://doc.mypaas.com.cn/dmp/assets/dmpcli/dmp-propcomponent.jpg)

<span id="dmp-dev-suggest"></span>
## 八、开发建议

### 1、平台内置，组件开发不再需要安装的Node包列表：
react
react-dom
react-bootstrap-myui
dmp-chart-sdk
prop-types
echarts
lodash
moment
jquery
isomorphic-fetch

另外平台已引入高德地图开发API
&lt;script src="https://webapi.amap.com/maps?v=1.4.4&key="></script&gt;
