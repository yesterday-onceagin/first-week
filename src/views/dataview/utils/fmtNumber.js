// fmt
export function fmtInteger(ints) {
  const arr = ints.split('').reverse()
  const newArr = []

  arr.forEach((item, i) => {
    if (i % 3 === 2 && i !== (arr.length - 1)) {
      newArr.push(item)
      if (!isNaN(arr[i + 1])) {          //防止-,234,234.34情况
        newArr.push(',')
      }
    } else {
      newArr.push(item)
    }
  })

  return newArr.reverse().join('')
}

// 转换 数字 成 1,222, 2017/08/23新增负数据处理
export default function fmtNumber(value) {
  if (+value >= 0) {
    let int = fmtInteger(value.toString())
    let point = ''
    let decimal = ''
    //  如果存在 类似 12.0000 之类. 
    if (!(Number.isSafeInteger(+value) && value.toString().indexOf('.') === -1)) {
      value = Number(value).toFixed(2)
      const ints = value.toString().split('.')

      int = fmtInteger(ints[0])
      point = '.'
      decimal = ints[1]
    }

    return `${int}${point}${decimal}`
  } else if (+value < 0) {
    let newValue = -value
    const operator = '-'
    let int = fmtInteger(newValue.toString())
    let point = ''
    let decimal = ''

    //  如果存在 类似 12.0000 之类. 
    if (!(Number.isSafeInteger(newValue) && (newValue).toString().indexOf('.') === -1)) {
      newValue = Number(newValue).toFixed(2)
      const ints = newValue.toString().split('.')

      int = fmtInteger(ints[0])
      point = '.'
      decimal = ints[1]
    }
    return `${operator}${int}${point}${decimal}`
  }
  return '-'
}
