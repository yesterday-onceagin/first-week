export default function getOverFlowText(str, len) {
  if (typeof str !== 'string') {
    return '';
  }
  let isOverflow = false;
  let result = str;

  str = str.substr(0, len);

  const enLen = str.match(/[\u0000-\u00FF]/g) ? str.match(/[\u0000-\u00FF]/g).length : 0;
  len += enLen;

  if (result !== str) {
    result = `${str.substr(0, len)}...`;
    isOverflow = true;
  }

  return {
    isOverflow,
    text: result
  };
}
