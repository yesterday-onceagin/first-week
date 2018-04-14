/**
 * grid最大列值 
 */
export const COL_MAX_SIZE = 12

/**
 * grid最小列值
 * @type {Number}
 */
export const COL_MIN_SIZE = 1

/**
 * 格子的最小行值
 */
export const ROW_MIN_SIZE = 1

/**
 * 格子的间距 px
 */
export const MARGIN = 4

export const MAX_COLS = COL_MAX_SIZE + COL_MIN_SIZE

export const MAX_SIZE_X = COL_MAX_SIZE

/**
 * 这里导出默认的分页设置，方便后面使用
 */
export const DEFAULT_GRIDSTER_OPTIONS = {
  avoid_overlapped_widgets: false, //不让你从数据库或是其他途径 生成的 widget 互相覆盖 默认为true
  autogrow_cols: false,
  widget_margins: [MARGIN, MARGIN],
  min_size_x: COL_MIN_SIZE,
  min_size_y: ROW_MIN_SIZE,
  max_cols: MAX_COLS,
  max_size_x: MAX_SIZE_X
}
