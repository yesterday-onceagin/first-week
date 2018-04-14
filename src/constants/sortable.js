const GROUP = Symbol('mysoft_sortable_key')
const DRAGABLE_HANDLE = 'mysoft_sortable_handle'
// 数据源 （单个字段）
export const DATA_FIELD = {
  sort: false,      // 不排序
  animation: 150,
  group: {
    name: GROUP,
    pull: 'clone',  // 克隆的方式
    put: false // 
  },
  onClone: () => {}
}

export const RELEASE_WRAP = {
  sort: false,      // 不排序
  animation: 0,
  delay: 0,
  handle: `.${DRAGABLE_HANDLE}`,   // 一个不存在的class。使得区域有效， 但拖拽无效。解决 onmove 事件只在组内生效
  group: {
    name: GROUP,
    pull: false,
    put: true
  }
}

// 因为是直接嵌套 item 的情况
export const CONTAINER_WRAP = {
  sort: true,      // 支持排序
  animation: 0,
  delay: 0,
  group: {
    name: GROUP,
    pull: true,    // 可以拖拽
    put: true      // 可以接收
  },
  onStart: () => {},
  onMove: () => {},
  onEnd: () => {},
  onAdd: () => {},
}

export const NOOP = () => false;
