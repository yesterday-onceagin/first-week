/**
 * 数据源类型
 * key: datasource type in lowercase
 * type: datasource type in dmp enums 
 */
const DATA_SOURCE_TYPES = {
  mysql: {
    type: 'MySQL',
    name: 'MySQL'
  },
  odps: {
    type: 'ODPS',
    name: 'ODPS'
  },
  saas: {
    type: 'SaaS',
    name: 'SaaS'
  },
  mysofterp: {
    type: 'MysoftERP',
    name: 'MysoftERP'
  },
  api: {
    type: 'API',
    name: 'API'
  },
  datahub: {
    type: 'DataHub',
    name: 'DataHub',
  },
}

export {
  DATA_SOURCE_TYPES
}
