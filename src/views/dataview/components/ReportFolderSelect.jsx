import React from 'react'
import PropTypes from 'prop-types'
import reactMixin from 'react-mixin'

import Button from 'react-bootstrap-myui/lib/Button'
import Dialog from 'react-bootstrap-myui/lib/Dialog'
import GroupTree from '../../../components/GroupTree'

import TipMixin from '../../../helpers/TipMixin'
import { treeFormat, getFullPath } from '../../../helpers/groupTreeUtils'

class ReportFolderSelect extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    onClose: PropTypes.func,
    onSelect: PropTypes.func,
    fetchDataList: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      dataSetTree: [],
      selectedNode: null,
      path: '/'
    }
  }

  componentDidMount() {
    this.props.fetchDataList({ parent_id: '' }, (json) => {
      if (json.result) {
        this.setState({
          dataSetTree: json.data.tree
        })
      }
    })
  }

  render() {
    const { show, onClose } = this.props
    const { selectedNode, path, dataSetTree } = this.state

    // 节点模版
    const nodeTemplate = (node, spread) => {
      if (node === 'root') {
        return <div onClick={this.handleChangeCurrFolder.bind(this, null)}>/</div>
      }
      return (
        <div className="file-tree-item file-tree-item-indialog"
          style={this.STYLE_SHEET.container}
          onClick={this.handleChangeCurrFolder.bind(this, node)}>
          <div className="file-tree-item-icon"
            style={{ position: 'absolute', left: '0px', top: '0px', paddingRight: '10px' }}>
            <i className={spread ? 'dmpicon-folder-open' : 'dmpicon-folder-close'}></i>
          </div>
          <div className="file-tree-item-name"
            style={this.STYLE_SHEET.name}>
            {node.name}
          </div>
        </div>
      );
    }

    return (
      <Dialog
        show={show}
        onHide={onClose}
        backdrop="static"
        size={{ width: '420px' }}>
        <Dialog.Header closeButton>
          <Dialog.Title>选择文件夹</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <form className="form-group" style={{ height: '200px' }}>
            <div className="input-wrapper">
              <input
                type="text"
                value={path}
                disabled
                style={{ width: '100%', lineHeight: '26px', paddingLeft: '5px' }}
              />
            </div>
            <div className="folder-tree-wrapper border">
              <GroupTree
                root
                search
                data={treeFormat(dataSetTree, 0, [], [], true)}
                nodeTemplate={nodeTemplate}
                activeId={selectedNode && selectedNode.id}
                paddingUnit={22}
                nodeHeight={30}
                className="border"
                containerStyle={{ height: '170px', overflowX: 'hidden', overflowY: 'scroll' }}
              />
            </div>
          </form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSubmit.bind(this)} >确定</Button>
          <Button bsStyle="default" onClick={onClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  }

  handleChangeCurrFolder(data) {
    const { dataSetTree } = this.state
    const pathNames = []

    if (data) {
      const tree = treeFormat(dataSetTree, 0, [], [], true)
      const { path } = data
      getFullPath(tree, path.slice(), pathNames, 'name')
    }

    this.setState({
      selectedNode: data,
      path: `/ ${pathNames.join(' / ')}`
    })
  }

  handleSubmit() {
    const { onSelect } = this.props
    const { selectedNode } = this.state
    onSelect(selectedNode ? (selectedNode.id || '') : '')
  }

  STYLE_SHEET = {
    container: {
      position: 'relative',
      paddingLeft: '24px'
    },
    name: {
      width: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
  }
}

reactMixin.onClass(ReportFolderSelect, TipMixin)

export default ReportFolderSelect
