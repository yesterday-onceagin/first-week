// 判断一个高级字段是否含有聚合函数
const AGGREGATE_OPERATORS = ['SUM', 'AVG', 'MIN', 'MAX', 'COUNT']

export default function (expression = []) {
  return expression.some(exp => AGGREGATE_OPERATORS.indexOf(exp.op) > -1)
}
