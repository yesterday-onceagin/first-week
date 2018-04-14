export default function getOffset(obj) {
  const arr = [];
  let offsetL = 0;
  let offsetT = 0;
  while (!!obj && obj !== window.document.body) {
    offsetL += obj.offsetLeft;
    offsetT += obj.offsetTop;
    obj = obj.offsetParent;
  }
  arr.push(offsetL, offsetT);
  return arr;
}
