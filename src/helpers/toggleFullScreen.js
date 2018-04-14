function toggleFullScreen() {
  const noMozAndWebkitFull = !document.mozFullScreen && !document.webkitIsFullScreen
  // FIX: 这里document.fullScreenElement条件成立时document.fullScreenElement !== null一定成立 无需多余判断
  if (document.fullScreenElement || noMozAndWebkitFull) {
    if (document.documentElement.requestFullScreen) {
      document.documentElement.requestFullScreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullScreen) {
      document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else if (document.cancelFullScreen) {
    document.cancelFullScreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitCancelFullScreen) {
    document.webkitCancelFullScreen();
  }
}

export default toggleFullScreen
