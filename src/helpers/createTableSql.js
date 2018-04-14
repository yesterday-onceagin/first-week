// 类型映射
const COLUMNS_TYPES = {
  BIGINT: 'bigint',
  STRING: 'varchar(255)',
  BOOLEAN: 'tinyint',
  DOUBLE: 'double',
  DATETIME: 'datetime',
  DECIMAL: 'decimal(36,16)'
};

const CREATE_TABLE = 'CREATE TABLE IF NOT exists';

// const NOT_NULL = 'not null';

const COMMENT = 'comment';

/**
 * 自动组件成sql建表语句
 * @param  {[string]} table_name 表明
 * @param  {[array]} cloums      包含的列数据
 * @return {[string]}            sql语句
 */
function creatSql(table_name, cloums) {
  const sql = [];

  cloums.forEach((item) => {
    sql.push('\t' + '`' + `${item.name}` + '`' + ` ${COLUMNS_TYPES[item.type.toUpperCase()]} ${COMMENT} '${item.comment}',\n`)
  })

  if (sql.length > 0) {
    sql[sql.length - 1] = sql[sql.length - 1].replace(',', '')
  }

  return `${CREATE_TABLE} ` + '`' + `${table_name}` + '`' + ` (\n${sql.join('')});`
}

function encodeSql(sql) {
  return sql.replace(/(\n)+|(\t)+/g, '');
}

export {
  creatSql,
  encodeSql
}
