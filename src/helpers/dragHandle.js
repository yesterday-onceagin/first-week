/**
 * 为 已知 dom 绑定拖拽效果. xy
 */
const getCssValue = ($dom, key, suffix = 'px', defaultValue = 0) => (
  $dom && $dom.css(key) ? +$dom.css(key).replace(suffix, '') : defaultValue
)

export default function dragHandle({ $dom, move_target_selector, drag_selector, cb, axis = 'xy' }) {
  $(document).mousemove(function (e) {
    if (this.move) {
      $('body').css('cursor', 'move');
      const posix = !document.move_target ? { x: 0, y: 0 } : document.move_target.posix;
      if (e.pageY - posix.y < 0) {
        return
      }
      const callback = document.call_down || function () {
        $dom.css({
          top: e.pageY - posix.y,
          left: e.pageX - posix.x,
          transform: 'none'
        });
      };
      callback.call(this, e, posix);
    }
  }).mouseup(function (e) {
    $('body').css('cursor', 'default');
    if (this.move) {
      $.extend(this, {
        move: false,
        move_target: null,
        call_down: false,
        call_up: false
      });
      const height = $dom.height();
      const minHeight = getCssValue($dom, 'minHeight');

      const width = $dom.width();
      const minWidth = getCssValue($dom, 'minWidth');
      const maxWidth = getCssValue($dom, 'maxWidth');

      if (height <= minHeight || width <= minWidth || width >= maxWidth) {
        return false
      }
      const callback = document.call_up || function () {};
      callback.call(this, e);
    }
  });

  const $box = $dom.on('mousedown', move_target_selector, function (e) {
    const offset = $(this).offset();
    this.posix = {
      x: e.pageX - offset.left,
      y: e.pageY - offset.top
    };
    $.extend(document, { move: true, move_target: this });
  }).on('mousedown', drag_selector, (e) => {
    const posix = {
      w: $box.width(),
      h: $box.height(),
      x: e.pageX,
      y: e.pageY
    };
    $.extend(document, { move: true,
      call_down(e) {
        const height = Math.max(30, e.pageY - posix.y + posix.h);
        let style = {};

        if (axis === 'x') {
          style = Object.assign(style, {
            width: Math.max(30, e.pageX - posix.x + posix.w) + 40
          })
        } else if (axis === 'y') {
          style = Object.assign(style, {
            height
          })
        } else {
          style = Object.assign(style, {
            width: Math.max(30, e.pageX - posix.x + posix.w),
            height
          })
        }
        $box.css(style);
        // modal-body
        cb && cb(height)
      } });
    e.preventDefault();
    return false;
  });
}
