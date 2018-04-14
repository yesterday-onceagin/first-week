import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Glyphicon from 'react-bootstrap-myui/lib/Glyphicon';
import classnames from 'classnames';
import dragHandle from '../../../helpers/dragHandle';
import './log-dialog.less';

class LogDialog extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      uuid: new Date().getTime()
    }
  }

  componentDidMount() {
    this._autoScroll()
    this._addEvents();
  }

  componentDidUpdate() {
    this._autoScroll()
    this._addEvents();
  }

  render() {
    const { title, data, onFresh, show, onHide, pending } = this.props

    return (
      show && <Dialog
        id={`node-log-dialog-${this.state.uuid}`}
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '700px', height: '500px' }}
        className="node-log-dialog">
        <Dialog.Header closeButton>
          <Dialog.Title>
            {title}
            <i className="dmpicon-refresh2" style={{ position: 'absolute', top: '19px', right: '20px', cursor: 'pointer', color: '#24BBF9' }} onClick={onFresh} title="刷新" />
          </Dialog.Title>
        </Dialog.Header>
        <Dialog.Body id={`log-${this.state.uuid}`}>
          <div className="log-body-wrap">
            <div className="log-body" id={`log-body-${this.state.uuid}`}>
              {
                data.length > 0 ? data.map((item) => {
                  const msg = item.level_name === 'ERROR' ? `File "${item.file_name}", line ${item.line_no}, ${item.message}` : item.message
                  const text = msg.indexOf('\n') > -1 ? msg.split('\n').map(m => <p>{m}</p>) : msg
                  const _class = classnames('row', {
                    error: item.level_name && item.level_name.toLowerCase() === 'error'
                  })

                  return <div className={_class}>
                    <span className="time">{`[${item.created ? item.created.replace(/T/g, ' ') : ''}]：`}</span>
                    <span className="msg">
                      {text}
                      {item.level_name === 'ERROR' && item.exc_text && <p><br />{item.exc_text}</p>}
                    </span>
                  </div>
                }) : <div className="nothing">{pending ? '数据请求中...' : '暂无日志信息！'}</div>
              }
            </div>
          </div>
        </Dialog.Body>
        <div className="drag x_y_drag" id={`coor-${this.state.uuid}`}></div>
      </Dialog>
    )
  }

  _autoScroll() {
    // 默认滚动定位到最后
    if (this.props.show && $(`#log-${this.state.uuid}`)[0]) {
      $(`#log-${this.state.uuid}`).scrollTop($(`#log-${this.state.uuid}`)[0].scrollHeight);
      setTimeout(() => {
        $(`#log-${this.state.uuid}`).scrollTop($(`#log-${this.state.uuid}`)[0].scrollHeight)
      }, 10)
    }
  }

  _addEvents() {
    const { uuid } = this.state

    dragHandle({
      $dom: $(`#node-log-dialog-${uuid}`),
      move_target_selector: '.modal-title',
      drag_selector: `#coor-${uuid}`,
      cb: (height) => {
        // modal-body
        $(`#log-${uuid}`).css({
          height: height - 50
        })
      }
    })
  }
}

LogDialog.PropTypes = {
  pending: PropTypes.bool,
  show: PropTypes.bool,
  title: PropTypes.string,
  data: PropTypes.array,  // 由于是不断查询的结果
  onFresh: PropTypes.func, // 重新刷新日志数据
  onHide: PropTypes.func
}

LogDialog.defaultProps = {
  title: '日志详情'
}

export default LogDialog
