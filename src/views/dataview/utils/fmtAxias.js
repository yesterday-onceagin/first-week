/**
 * 对于 坐标轴的值是 数值类型的来说.
 * 需要对数值 进行相应的 一个值进行格式化。
 * 10,000 - 万
 * 100,000,000 - 亿
 */
// 万
export const WAN = 10000
// 亿
export const YI = 100000000

export default function fmtAxias(value) {
  let text = value

  if (value / YI >= 1) {
    const str = Number(value / YI).toString()
    const decimal = str.split('.')
    const data = decimal.length > 4 ? Number(str).toFixed(4) : Number(str)

    text = `${data} 亿`
  } else if (value / WAN >= 1) {
    const str = Number(value / WAN).toString()
    const decimal = str.split('.')
    const data = decimal.length > 4 ? Number(str).toFixed(4) : Number(str)

    text = `${data} 万`
  }

  return text
}
