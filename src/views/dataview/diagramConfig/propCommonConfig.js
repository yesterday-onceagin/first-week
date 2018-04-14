import Spinner from './propComponents/Spinner'
import ColorPicker from './propComponents/ColorPicker'
import FontStyle from './propComponents/FontStyle'
import TextAlign from './propComponents/TextAlign'
import Border from './propComponents/Border'

// 根据chartCode获取通用配置
const getCommonConfig = (chartCode, customConfig) => {
  // 通用标题配置
  const TITLE_CONFIG = {
    title: '标题',
    field: 'containerTitle',
    // 默认展开，显示当前Group下的所有配置项
    spread: false,
    // 默认启用当前Group配置，开关高亮显示
    show: false,
    scope: 'container.title',
    items: [
      {
        field: 'fontSize',
        // 作用域，用于组件标题的的样式配置（组件内部配置不需要设置作用域）
        scope: 'container.title.fontSize',
        label: '字号',
        component: {
          component: Spinner,
          props: {
            min: 12
          }
        },
        data: 12
      },
      {
        field: 'color',
        scope: 'container.title.color',
        label: '颜色',
        component: ColorPicker,
        data: '#24BCFA'
      },
      {
        field: 'lineHeight',
        scope: 'container.title.lineHeight',
        label: '行高',
        component: {
          component: Spinner,
          props: {
            min: 12
          }
        },
        data: 12
      },
      {
        field: 'fontStyle',
        scope: 'container.title.fontStyle',
        label: '样式',
        component: FontStyle,
        data: {
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'normal'
        }
      },
      {
        field: 'textAlign',
        scope: 'container.title.textAlign',
        label: '对齐',
        component: TextAlign,
        data: 'left'
      }
    ]
  };

  // 通用背景配置
  const BACKGROUND_CONFIG = {
    title: '背景',
    field: 'containerBackground',
    spread: false,
    show: false,
    scope: 'container.background',
    items: [
      {
        field: 'backgroundColor',
        scope: 'container.background.backgroundColor',
        label: '背景颜色',
        component: ColorPicker,
        data: ''
      }
    ]
  };

  // 通用边框配置
  const BORDER_CONFIG = {
    title: '边框',
    field: 'containerBorder',
    spread: false,
    show: false,
    scope: 'container.border',
    items: [
      {
        field: 'border',
        scope: 'container.border.borderStyle',
        label: '',
        component: Border,
        data: {
          borderColor: '',
          borderStyle: 'solid',
          borderWidth: 0
        }
      }
    ]
  };

  let commonConfig = []
  if (!customConfig.find(config => config.field === 'containerTitle')) {
    commonConfig.push(TITLE_CONFIG)
  }
  commonConfig = commonConfig.concat(BACKGROUND_CONFIG, BORDER_CONFIG)

  return commonConfig
}

export {
  getCommonConfig
}
