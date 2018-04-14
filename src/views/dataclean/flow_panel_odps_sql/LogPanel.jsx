import React from 'react'
import PropTypes from 'prop-types'

class LogPanel extends React.Component {
  static propTypes = {
    logData: PropTypes.object,
    show: PropTypes.bool
  };

  static defaultProps = {
    logData: {
      task: [],
      content: []
    },
    show: false
  };

  componentDidUpdate() {
    //在要加载的时候 走到末尾
    if (this.logListContext) {
      this.logListContext.scrollTop = this.logListContext.scrollHeight - this.logListContext.clientHeight;
    }
  }

  render() {
    const { logData, show } = this.props;

    const logs = logData.content;

    const listStyle = {
      display: show ? 'block' : 'none'
    };

    return (
      <ul className="log-list" style={listStyle} ref={(instance) => {
        this.logListContext = instance
      }}>
        {
          Array.isArray(logs) && logs.length > 0 && logs.map((log, i) => (
            <li className={`log-list-item  ${log.type || ''}`} key={`log-${i}`}>
              {
                log.type === 'link' ? (
                  <span>
                    LOG VIEW：
                    <a href={log.content} className="log-view-link" target="_blank">
                      {log.content}
                    </a>
                  </span>
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: log.content }}></span>
                )
              }
            </li>
          ))
        }
      </ul>
    );
  }
}

export default LogPanel;
