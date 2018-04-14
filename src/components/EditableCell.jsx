import React from 'react'
import PropTypes from 'prop-types'
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger'
import Tooltip from 'react-bootstrap-myui/lib/Tooltip'

class EditableCell extends React.Component {
  static propTypes = {
    data: PropTypes.string,
    placeholder: PropTypes.string,
    onCheck: PropTypes.func,
    lineHeight: PropTypes.number,
    fontSize: PropTypes.number,
    hastip: PropTypes.bool
  };

  static defaultProps = {
    lineHeight: 40,
    fontSize: 14,
    placeholder: '',
    hastip: false
  };

  constructor(props) {
    super(props);
    this.state = {
      isEdit: false,
      content: props.data || ''
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.data !== nextProps.data) {
      this.setState({
        content: nextProps.data || ''
      });
    }
  }

  render() {
    const { data, lineHeight, fontSize, placeholder, hastip } = this.props;

    const { content, isEdit } = this.state;

    const STYLES = {
      cell: {
        position: 'relative',
        width: '100%',
        height: '100%'
      },
      input: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
        lineHeight: `${lineHeight - 4}px`,
        fontSize: `${fontSize}px`,
        width: '100%',
        padding: `1px ${lineHeight - 4}px 1px 14px`
      },
      icon: {
        fontSize: '14px',
        position: 'absolute',
        display: 'block',
        padding: `${(lineHeight - 4 - 14) / 2}px`,
        right: '1px',
        top: '1px',
        cursor: 'pointer',
        transition: 'color .3s'
      },
      text: {
        visibility: 'hidden',
        zIndex: -1,
        position: 'static'
      }
    };

    return isEdit ? (
      <div className="form editable-table-cell" style={STYLES.cell}>
        <input type="text"
          style={STYLES.input}
          ref={(node) => { this.cellEditInputBox = node }}
          placeholder={placeholder}
          value={content}
          onChange={this.handleChangeData.bind(this)}
          onBlur={this.handleStopEdit}
          className="cell-edit-input-box" />
        <i className="dmpicon-tick"
          style={STYLES.icon}
          onClick={this.handleStopEdit}></i>
        <div style={STYLES.text}>
          {data}
        </div>
      </div>
    ) : (
      hastip ? (
        content ? (
          <OverlayTrigger trigger="hover"
            placement="top"
            overlay={(<Tooltip>{content}</Tooltip>)}>
            <div style={{ ...STYLES.cell, padding: '0 14px', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={this.handleStartEdit}>
              {content}
            </div>
          </OverlayTrigger>
        ) : (
          <div style={{ ...STYLES.cell, padding: '0 14px' }}
            onClick={this.handleStartEdit}></div>
        )
      ) : (
        <div style={{ ...STYLES.cell, padding: '0 14px', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={this.handleStartEdit}>
          {content}
        </div>
      )
    );
  }

  // 编辑文字
  handleChangeData(e) {
    this.setState({
      content: e.target.value
    });
  }

  // 进入编辑状态
  handleStartEdit = () => {
    this.setState({ isEdit: true }, () => {
      // 自动聚焦并将光标定位到最后一个字符后
      const inputDom = this.cellEditInputBox
      const v = inputDom.value;
      inputDom.value = '';
      inputDom.focus();
      inputDom.value = v;
    });
  }

  // 退出编辑状态
  handleStopEdit = (e) => {
    e.stopPropagation();
    this.setState({ isEdit: false });
    this.props.onCheck(this.cellEditInputBox.value);
  }
}

export default EditableCell;
