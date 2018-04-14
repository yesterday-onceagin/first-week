

export const areaMapStyles = {
  province: {
    strokeWeight: 1,
    fillOpacity: 0.2,
    fillColor: '#336BFF',
    strokeOpacity: 0.5,
    strokeColor: '#2CD5FF',
    bubble: true,
    zIndex: 10,
  },
  city: {
    strokeWeight: 1,
    fillOpacity: 0.1,
    strokeOpacity: 0.5,
    bubble: true,
    fillColor: '#2CD5FF',
    strokeColor: '#2CD5FF',
    zIndex: 11,
  },
  district: {
    strokeWeight: 1,
    fillOpacity: 0.1,
    bubble: true,
    strokeOpacity: 0.5,
    fillColor: '#336BFF',
    strokeColor: '#2CD5FF',
    zIndex: 12
  }
}

const _rgbaToHex = function (color) {
  if (color.substr(0, 1) === '#') {
    return { hex: color, opacity: 0.9 }
  }
  if (color.indexOf('rgb') === -1) {
    return { hex: '#fff', opacity: 0 }
  }
  const digits = /(.*?)rgba\((\d+).*?(\d+).*?(\d+).*?(\d.*)\)/.exec(color)
  
  const red = parseInt(digits[2])
  const green = parseInt(digits[3])
  const blue = parseInt(digits[4])
  const opacity = parseFloat(digits[5])
  
  const rgb = blue | (green << 8) | (red << 16);
  return { hex: `${digits[1]}#${rgb.toString(16)}`, opacity }
}

export const converStyleToMap = function (style/* 包含rgba的 */, level) {
  const defaultStyle = { ...(areaMapStyles[level] || areaMapStyles.province) }
  if (!style) {
    return defaultStyle
  }
  const { background, borderColor } = style
  const fillStyle = background && _rgbaToHex(background)
  const borderStyle = borderColor && _rgbaToHex(borderColor)
  if (fillStyle) {
    defaultStyle.fillColor = fillStyle.hex
    defaultStyle.fillOpacity = fillStyle.opacity
  }
  if (borderStyle) {
    defaultStyle.strokeColor = borderStyle.hex
    defaultStyle.strokeOpacity = borderStyle.opacity
  }

  return defaultStyle
}

export const color2MapPlogonStyle = function (color) {
  const defaultStyle = { ...areaMapStyles.province }
  if (color) {
    const style = _rgbaToHex(color)
    defaultStyle.fillColor = style.hex
    defaultStyle.fillOpacity = style.opacity
    defaultStyle.strokeOpacity = style.opacity
    defaultStyle.strokeColor = style.hex
  }
  return defaultStyle
}
