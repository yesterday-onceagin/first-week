import PropTypes from 'prop-types';
import React from 'react';
import reactMixin from 'react-mixin'

import { Select as TreeSelect, Tree } from 'rt-tree'
import Button from 'react-bootstrap-myui/lib/Button'
import Dialog from 'react-bootstrap-myui/lib/Dialog'

import classnames from 'classnames'
import TipMixin from '../../../helpers/TipMixin'

import 'rt-tree/dist/css/rt-select.css'

class MultiScreenSelect extends React.Component {
  static ICON_STYLE_SHEET = {
    fontFamily: "'dmpicon' !important",
    speak: 'none',
    fontStyle: 'normal',
    fontWeight: 'normal',
    fontVariant: 'normal',
    textTransform: 'none',
    lineHeight: 1,
    color: '#24BBF9',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale'
  };

  static propTypes = {
    show: PropTypes.bool,
    onClose: PropTypes.func,
    onSelect: PropTypes.func,
    dataSetTree: PropTypes.array,
    defaultScreens: PropTypes.array
  };

  constructor(props) {
    super(props)
    this.state = {
      selectedScreen: []
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      selectedScreen: nextProps.defaultScreens
    })
  }

  render() {
    const { show, onClose, dataSetTree, onSelect } = this.props
    return (
      <Dialog
        show={show}
        onHide={onClose}
        onEnter={() => { this.tree_select.toggleMenuVisible() }}
        backdrop="static"
        size={{ width: '550px' }}>
        <Dialog.Header closeButton>
          <Dialog.Title>创建多屏</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="form-group" style={{ height: '300px' }}>
            <label className="control-label">选择报告</label>
            <div className="input-wrapper" >
              <TreeSelect ref={(instance) => { this.tree_select = instance }} style={{ width: '100%' }} menuStyle={{ width: '100%', height: '250px' }}>
                <Tree
                  multiple
                  data={dataSetTree || []}
                  defaultExpanded={this.getDefaultExpanded()}
                  selected={this.state.selectedScreen.map(screen => screen.id)}
                  customerIcon={this.genrateIcon}
                  customerNode={{ onAdd: this.onAdd.bind(this), hover: false }} />
              </TreeSelect>
            </div>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={onSelect.bind(this, this.state.selectedScreen)} >确定</Button>
          <Button bsStyle="default" onClick={onClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    )
  }

  getDefaultExpanded() {
    return []
  }

  genrateIcon(item, expanded) {
    let className = expanded ? 'dmpicon-folder-open' : 'dmpicon-folder-close'
    if (item.type !== 'FOLDER') {
      className = 'dmpicon-chart'
    }
    return <i className={className} style={MultiScreenSelect.ICON_STYLE_SHEET} />
  }

  onAdd(data) {
    const selectedScreenIds = this.state.selectedScreen.map(screen => screen.id)
    if (data.type !== 'FOLDER') {
      const checked = selectedScreenIds.indexOf(data.id) !== -1
      const iconClass = classnames('icon-checkbox', { checked })
      return <i className={iconClass} onClick={this.onChangeScreen.bind(this, data, !checked)} />
    }
    return null
  }

  onChangeScreen(data, checked) {
    const selectedScreenIds = this.state.selectedScreen.map(screen => screen.id)

    if (checked) {
      if (selectedScreenIds.length >= 10 && selectedScreenIds.indexOf(data.id) === -1) {
        return this.showTip({
          status: 'error',
          content: '创建多屏最多选择10个报告'
        })
      }

      this.setState(prevState => ({
        selectedScreen: selectedScreenIds.indexOf(data.id) === -1 ? prevState.selectedScreen.concat([data]) : prevState.selectedScreen
      }))
    } else {
      this.setState(prevState => ({
        selectedScreen: prevState.selectedScreen.filter(screen => screen.id !== data.id)
      }))
    }
  }
}

reactMixin.onClass(MultiScreenSelect, TipMixin)

export default MultiScreenSelect
