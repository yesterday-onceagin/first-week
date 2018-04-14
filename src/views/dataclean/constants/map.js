import { ODPS_SOURCE } from './index';

export const PROCESS_NAV = ['选择待映射表', '表字段映射', '映射完成']

export const DIM_COLUMNS = ['指标值', '总数', '映射']

export const RULE_COLUMNS = ['正则表达式', '映射', '操作']

export const DEFAULT_MAP_OPTIONS = {
  processNav: PROCESS_NAV,
  odps: ODPS_SOURCE.id,
  dim_columns: DIM_COLUMNS,
  rule_columns: RULE_COLUMNS
}
