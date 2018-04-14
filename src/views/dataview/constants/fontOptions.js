const FONT_STYLES = [{
  name: '下划线',
  key: 'underline',
  icon: 'U'
}, {
  name: '倾斜',
  key: 'italic',
  icon: 'I'
}, {
  name: '加粗',
  key: 'bold',
  icon: 'B'
}]

const FONT_ALIGNS = [{
  name: '右对齐',
  key: 'right',
  icon: 'dmpicon-align-right'
}, {
  name: '居中',
  key: 'center',
  icon: 'dmpicon-align-center'
}, {
  name: '左对齐',
  key: 'left',
  icon: 'dmpicon-align-left'
}]

const TEXT_FONT_ALIGNS = [{
  name: '两端对齐',
  key: 'justify',
  icon: 'dmpicon-align-justify'
}, ...FONT_ALIGNS]

export {
  FONT_STYLES,
  FONT_ALIGNS,
  TEXT_FONT_ALIGNS
}
