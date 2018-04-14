export default function pxSuffix(val) {
  const numReg = /^(-)?\d+(\.\d+){0,1}$/g
  if (!numReg.test(val)) return val

  if (val || val === 0 || val === '0') {
    return /(-)?\d+(\.\d+){0,1}px$/g.test(val) ? val : `${val}px`
  }
  return val
}
