import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class'
import classnames from 'classnames'
import { Resizable } from 'react-resizable'
import { DraggableCore } from 'react-draggable'

const GridItem = createReactClass({
  propTypes: {
    children: PropTypes.any,
    className: PropTypes.string,
    margin: PropTypes.array,
    isDraggable: PropTypes.bool,
    isResizable: PropTypes.bool,
    unChangable: PropTypes.bool,
    style: PropTypes.object,
    i: PropTypes.any,
    x: PropTypes.number,
    y: PropTypes.number,
    w: PropTypes.number,
    h: PropTypes.number,
    draggingOffset: PropTypes.object,       // 被一起拖动的参数
    resizingOffset: PropTypes.object,
    onDrag: PropTypes.func,
    onDragStart: PropTypes.func,
    onDragStop: PropTypes.func,
    onResize: PropTypes.func,
    onResizeStart: PropTypes.func,
    onResizeStop: PropTypes.func,
  },

  getInitialState() {
    return {
      dragging: null,
      resizing: null
    }
  },

  render() {
    const { isDraggable, unChangable } = this.props
    const child = React.Children.only(this.props.children)
    const pos = this.calcPosition()
    let transform = `translate(${pos.left}px, ${pos.top}px)`
    if (child.props['data-scale'] && child.props['data-scale'] !== 1) {
      const scaleRate = child.props['data-scale']
      pos.left *= scaleRate
      pos.top *= scaleRate
      transform = `translate(${pos.left}px, ${pos.top}px) scale(${scaleRate})`
    }
    const style = {
      position: 'absolute',
      width: `${pos.width}px`,
      height: `${pos.height}px`,
      transformOrigin: '0 0',
      WebkitTransform: transform,
      MozTransform: transform,
      msTransform: transform,
      OTransform: transform,
      transform
    }
    /* 用于展示宽高XY ----> 
    const posPanel = (
      <div className="diagram-layout-info">
        <span>W：[{pos.width}]</span>
        <span>H：[{pos.height}]</span>
        <span>X：[{pos.left}]</span>
        <span>Y：[{pos.top}]</span>
      </div>
    ) --->暂时不要 */
    let newChild = React.cloneElement(child, {
      className: classnames('free-layout-item', child.props.className, {
        'react-draggable': isDraggable,
        resizing: this.state.resizing,
        'react-draggable-dragging': this.state.dragging,
      }),
      style: { ...child.props.style, ...style }
      // children: [...child.props.children, posPanel] --->暂时不要
    })
    if (unChangable) {
      return newChild
    }
    newChild = this.mixinResizable(newChild, pos)
    newChild = this.mixinDraggable(newChild)
    return newChild
  },

  mixinDraggable(child) {
    return (
      <DraggableCore
        onStart={this.onDragHandler('onDragStart')}
        onDrag={this.onDragHandler('onDrag')}
        onStop={this.onDragHandler('onDragStop')}
      >
        {child}
      </DraggableCore>
    )
  },

  mixinResizable(child, position) {
    return (
      <Resizable
        width={position.width}
        height={position.height}
        onResizeStop={this.onResizeHandler('onResizeStop')}
        onResizeStart={this.onResizeHandler('onResizeStart')}
        onResize={this.onResizeHandler('onResize')}
      >
        {child}
      </Resizable>
    )
  },

  onDragHandler(name) {
    return (e, { node, deltaX, deltaY }) => {
      if (!this.props.isDraggable) {
        return
      }
      // 如果在resize, 那么不让drag
      if (this.state.resizing) return
      const { x, y } = this.props
      const newPos = { left: 0, top: 0 }
      switch (name) {
        case 'onDragStart':
          newPos.left = x
          newPos.top = y
          this.setState({ dragging: newPos })
          break
        case 'onDrag':
          if (!this.state.dragging) throw new Error('onDrag called before onDragStart.')
          newPos.left = this.state.dragging.left + deltaX
          newPos.top = this.state.dragging.top + deltaY
          this.setState({ dragging: newPos })
          break
        case 'onDragStop':
          if (!this.state.dragging) throw new Error('onDragStop called before onDragStart.')
          newPos.left = this.state.dragging.left + deltaX
          newPos.top = this.state.dragging.top + deltaY
          this.setState({ dragging: null })
          break
        default:
          break
      }

      const handler = this.props[name]
      if (handler) {
        handler.call(this, this.props.i, newPos.left, newPos.top, { e, node, deltaX, deltaY })
      }
    }
  },

  onResizeHandler(name) {
    return (e, { node, size }) => {
      if (!this.props.isResizable) {
        return
      }
      this.setState({ resizing: name === 'onResizeStop' ? null : size })
      const handler = this.props[name]
      if (handler) {
        handler.call(this, this.props.i, this.props.w, this.props.h, { e, node, size })
      }
    }
  },

  calcPosition() {
    const { margin, x, y, w, h, isDraggable, isResizable, draggingOffset, resizingOffset } = this.props
    const { dragging, resizing } = this.state
    const out = {
      left: Math.round(x + margin[0]),
      top: Math.round(y + margin[1]),
      width: Math.round(w),
      height: Math.round(h)
    }
    // 优先使用State.resizing
    if (resizing) {
      out.width = +resizing.width
      out.height = +resizing.height
      // 被联动拖动
    } else if (isResizable && resizingOffset) {
      out.width += +resizingOffset.deltaW
      out.height += +resizingOffset.deltaH
    }
    // 优先使用state.dragging
    if (dragging) {
      out.top = Math.round(dragging.top + margin[0])
      out.left = Math.round(dragging.left + margin[1])
      // 被联动缩放
    } else if (isDraggable && draggingOffset) {
      out.top += draggingOffset.deltaY
      out.left += draggingOffset.deltaX
    }

    return out
  }
})

const FreeLayout = createReactClass({
  propTypes: {
    children: PropTypes.any,
    className: PropTypes.string,
    //isDraggable: PropTypes.bool,
    // isResizable: PropTypes.bool,
    onLayoutChange: PropTypes.func,
    onResizeStop: PropTypes.func,
    margin: PropTypes.array,
    unChangable: PropTypes.bool
  },

  getDefaultProps() {
    return {
      unChangable: false
    }
  },

  getInitialState() {
    return {
      resizingOffset: null,  // 累计拖动变化, handle联动拖动
      draggingOffset: null,  // 累计尺寸变化, handle联动缩放
    }
  },

  componentWillMount() {

  },

  render() {
    const { className } = this.props
    return <div className={className}>
      {this.props.children && this.props.children.map((child, i) => this.processGridItem(child, i))}
    </div>
  },

  processGridItem(child, i) {
    const { draggingOffset, resizingOffset } = this.state
    const { margin, unChangable } = this.props
    const pos = child.props['data-grid']
    const isDraggable = child.props['data-draggable']
    const isResizable = child.props['data-resizable']
    return (
      <GridItem
        key={i}
        margin={margin}
        onDragStart={this.onDragStart}
        onDrag={this.onDrag}
        onDragStop={this.onDragStop}
        onResizeStart={this.onResizeStart}
        onResize={this.onResize}
        onResizeStop={this.onResizeStop}
        isDraggable={isDraggable}
        isResizable={isResizable}
        unChangable={unChangable}
        x={+pos.x}
        y={+pos.y}
        w={+pos.w}
        h={+pos.h}
        i={child.props.i}
        draggingOffset={draggingOffset}
        resizingOffset={resizingOffset}
      >
        {child}
      </GridItem>
    )
  },

  onResizeStart(i, oldW, oldH, { size }) {
    this.setState({
      resizingOffset: {
        deltaW: size.width - oldW,
        deltaH: size.height - oldH
      }
    })
  },

  onResize(i, oldW, oldH, { size }) {
    this.setState({
      resizingOffset: {
        deltaW: size.width - oldW,
        deltaH: size.height - oldH
      }
    })
  },

  onResizeStop(i) {
    const { resizingOffset } = this.state
    /* ---->
    let deltaW = 0
    let deltaH = 0
    if (this.state.resizingOffset) {
      deltaW = resizingOffset.deltaW
      deltaH = resizingOffset.deltaH
    } 
    ----> */
    if (resizingOffset && (resizingOffset.deltaW !== 0 || resizingOffset.deltaH !== 0)) {
      const layouts = this.getAllNewLayout()
      this.setState({ resizingOffset: null })
      if (this.props.onLayoutChange) {
        this.props.onLayoutChange(layouts, i)
      }
      if (this.props.onResizeStop) {
        this.props.onResizeStop(layouts)
      }
    }
  },

  // 需要支持 多个 同时移动
  onDragStart(i, x, y, { deltaX, deltaY }) {
    this.setState({
      draggingOffset: { deltaX, deltaY }
    })
  },

  onDrag(i, x, y, { deltaX, deltaY }) {
    this.setState(preState => ({
      draggingOffset: {
        deltaX: +preState.draggingOffset.deltaX + (+deltaX),
        deltaY: +preState.draggingOffset.deltaY + (+deltaY)
      }
    }))
  },

  onDragStop(i) {
    const { deltaX, deltaY } = this.state.draggingOffset
    // 所有的可以拖动的 都需要移动
    if (deltaX !== 0 || deltaY !== 0) {
      const layouts = this.getAllNewLayout()
      this.setState({ draggingOffset: null })
      if (this.props.onLayoutChange) {
        this.props.onLayoutChange(layouts, i)
      }
    }
  },

  getAllNewLayout() {
    const { draggingOffset, resizingOffset } = this.state

    return this.props.children.map((child) => {
      const pos = { ...child.props['data-grid'] }
      const isDraggable = child.props['data-draggable']
      const isResizable = child.props['data-resizable']
      if (isDraggable && draggingOffset) {
        pos.x += draggingOffset.deltaX
        pos.y += draggingOffset.deltaY
      }
      if (isResizable && resizingOffset) {
        pos.w = +pos.w + (+resizingOffset.deltaW)
        pos.h = +pos.h + (+resizingOffset.deltaH)
      }
      return {
        i: child.props.i,
        ...pos
      }
    })
  }
})

export default FreeLayout
