import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import Overlay from 'react-bootstrap-myui/lib/Overlay';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';

import GroupTree from '../../../../components/GroupTree';
import { getFullPath } from '../../../../helpers/groupTreeUtils'

import _ from 'lodash';

import { TYPE_NAMES } from '../../constants';

let searchTimerDialog = 0;

class ThirdProcess extends React.Component {
  static propTypes = {
    savePending: PropTypes.bool,
    folderTree: PropTypes.array,
    sheetsData: PropTypes.array,
    initState: PropTypes.object,
    onSearch: PropTypes.func,
    onPrev: PropTypes.func,
    onSave: PropTypes.func,
    onAddFolder: PropTypes.func,
    onRemoveTempFolders: PropTypes.func,
    onCheckName: PropTypes.func
  }

  state = {
    treeUuid: new Date().getTime(),
    isEdit: false,
    activeNode: null,   // 当前编辑的节点
    parentNode: null,   // 父级节点
    path: '/ ',
    editName: '',
    folderTreeshow: false,
    parent_id: '',
    canEdit: true,
    sheetsData: [],
    pathError: false,
  }

  constructor(props) {
    super(props);

    if (props.initState) {
      this.state = {
        ...this.state,
        ...props.initState
      }
    }

    if (props.sheetsData) {
      this.state.sheetsData = props.sheetsData.slice()
    }
  }

  componentDidMount() {
    // 非添加情况，禁用
    if (!this.state.isEdit) {
      window.onclick = this.handleCloseOverlay.bind(this)
    }
  }

  componentUnmount() {
    window.onclick = null
  }

  componentWillReceiveProps(nextProps) {
    const { initState } = this.props
    if (!_.isEqual(nextProps.initState, initState)) {
      this.setState({
        ...this.state,
        ...nextProps.initState
      })
    }
  }

  render() {
    const { path, sheetsData, isEdit, editName } = this.state
    const { savePending } = this.props
    const validSheetsData = sheetsData.filter(item => !item.error_msg && item.data.length > 0)
    const disabled = !path || validSheetsData.some(item => !item.name && !item.sheet_name) || savePending

    return <div className="excel-main form tip-form">
      <div className="main-wrap">
        {this.renderPath()}
        <div className="row" style={{ marginTop: '10px' }}>
          <div className="col-md-2 col-label">
            保存名称 :
          </div>
          <div className="col-md-8">
            <div className="table-wrap">
              {
                validSheetsData && validSheetsData.map((item, key) => (
                  <div className="table-row" key={key}>
                    <OverlayTrigger
                      trigger="hover"
                      placement="top"
                      overlay={(<Tooltip>{item.sheet_name}</Tooltip>)}
                    >
                      <div className="tr-label">{item.sheet_name}</div>
                    </OverlayTrigger>
                    
                    <div className={`tr-input ${item.error ? 'error' : ''}`}>
                      <Input
                        type="text"
                        value={isEdit ? editName : item.name}
                        disabled={isEdit}
                        placeholder={`请输入数据集名称,默认为（${item.sheet_name}）`}
                        onChange={this.handleChangeName.bind(this, key)}
                      />
                    </div>
                    {!!item.error && <div className="tr-error">{item.error}</div>}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
      <div className="footer">
        <Button onClick={this.handlePrev.bind(this)}>上一步</Button>
        <Button bsStyle="primary" onClick={this.handleSave.bind(this)} loading={savePending} disabled={disabled}>保存</Button>
      </div>
    </div>
  }

  renderPath() {
    const { path, folderTreeshow, isEdit, parent_id } = this.state
    const showClear = !folderTreeshow && !!parent_id
    const showCreate = folderTreeshow
    const disable = isEdit || (!folderTreeshow && !!path)
    return <div className="row">
      <div className="col-md-2 col-label">
        保存路径 :
      </div>
      <div className="col-md-8">
        <div className="input-wrap" onClick={!isEdit ? this.handleOpenOverlay.bind(this) : null}>
          <Input
            type="text"
            value={path}
            disabled={disable}
            ref={(instance) => { this.target = instance }}
            onChange={this.handleInput.bind(this, 'path')}
          />
        </div>
      </div>
      <div className="col-md-2" style={{ paddingLeft: 0 }}>
        {showClear && !isEdit && <span className="clear-btn" onClick={this.handleClear.bind(this)}>清空路径</span>}
        {showCreate && !isEdit && <span className="upload-btn" onClick={this.handleTempAddFolder.bind(this)}>新建文件夹</span>}
      </div>
      <Overlay
        show={this.state.folderTreeshow}
        onHide={this.handleCloseOverlay.bind(this)}
        placement="bottom"
        container={window.body}
        target={() => ReactDOM.findDOMNode(this.target)}
      >
        {this.renderFloderTree()}
      </Overlay>
    </div>
  }

  renderFloderTree() {
    const { folderTree } = this.props
    const { parent_id, treeUuid, activeNode } = this.state;
    const valid_folderTree = folderTree.filter(item => item.hidden === false || item.hidden === undefined)
    const hasFloderTree = Array.isArray(valid_folderTree) && valid_folderTree.length > 0

    // 节点模版
    const nodeTemplate = (node, spread) => {
      const isEditNode = activeNode && node.id === 'tempFolders_id'
      return <div className="file-tree-item file-tree-item-indialog"
        style={this.STYLE_SHEET.container}
        onClick={isEditNode ? null : this.handleChangeCurrFolder.bind(this, node)}
        onDoubleClick={isEditNode ? null : this.handleChangeAndCloseFolder.bind(this)}
      >
        <div className="file-tree-item-icon"
          style={this.STYLE_SHEET.icon}>
          <i className={spread ? 'dmpicon-folder-open' : 'dmpicon-folder-close'}/>
        </div>
        <div className="file-tree-item-name"
          style={this.STYLE_SHEET.name}>
          {isEditNode ? (
            <div className="form">
              <input
                type="text"
                placeholder="请输入名称"
                ref={(instance) => { this.input = instance }}
                value={activeNode.name}
                onClick={this.handleOpenOverlay.bind(this)}
                onChange={this.handleChangeInput.bind(this)}
              />
              <i className="dmpicon-tick"
                onClick={this.handleAddFolder.bind(this)}
                style={this.STYLE_SHEET.tickIcon}
              />
            </div>
          ) : node.name}
        </div>
      </div>
    };
    return (
      <div id="third-process-dialog"
        style={this.STYLE_SHEET.overlay}
        onClick={(e) => { e.nativeEvent && e.nativeEvent.stopPropagation(); }}
      >
        {hasFloderTree ?
          <div>
            <GroupTree
              key={`file-tree-${treeUuid}`}
              data={folderTree}
              activeId={parent_id}
              nodeTemplate={nodeTemplate}
              paddingUnit={22}
              nodeHeight={30} />
          </div> :
          <div style={this.STYLE_SHEET.nothing}>暂无文件夹（将创建在根目录下）</div>
        }
      </div>
    )
  }

  // 强制 更新
  handleChangeName(key, e) {
    this.state.sheetsData[key].name = e.target.value
    this.props.sheetsData[key].name = e.target.value

    this.setState({
      sheetsData: this.state.sheetsData
    })
  }
    
  handleSave(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    this.setState({
      folderTreeshow: false,
    })
    const { sheetsData, isEdit, editName } = this.state
    const promiseStack = []
    const validSheetsData = sheetsData.filter(item => !item.error_msg && item.data.length > 0)

    validSheetsData.forEach((item, key) => {
      // 如果是编辑的情况下，
      if (isEdit) {
        item.name = editName
      }
      promiseStack.push(this._beforeSave(key, item))
    })
      
    Promise.all(promiseStack).then(() => {
      this.props.onSave({
        thirdProcess: this.state
      })
    }).catch((_sheetsData) => {
      this.setState({ _sheetsData })
    })
  }

  handlePrev(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    this.setState({
      folderTreeshow: false
    })

    this.props.onPrev({
      thirdProcess: this.state
    })
  }

  handleInput(field, e) {
    const { value } = e.target

    this.setState({
      [field]: value
    }, () => {
      if (field === 'path') {
        clearTimeout(searchTimerDialog);
        searchTimerDialog = setTimeout(() => {
          this.props.onSearch(value)
        }, 300);
      }
    })
  }

  handleChangeInput(e) {
    this.state.activeNode.name = e.target.value
    this.setState({
      activeNode: this.state.activeNode
    })
  }

  // 切换当前选中的文件夹并关闭
  handleChangeAndCloseFolder() {
    this.setState({
      folderTreeshow: false
    })
  }

  // 切换当前选中的文件夹
  handleChangeCurrFolder(node) {
    // 未变更的时候不处理
    if (node.id === this.state.parent_id) {
      return false;
    }

    const pathArray = [];
    
    getFullPath(this.props.folderTree, node.path.slice(), pathArray, 'name');

    this.setState({
      parent_id: node.id,
      path: `/ ${pathArray.join(' / ')}`,
      parentNode: node,
      canEdit: false,
      pathError: false
    });
    return true
  }

  // 临时新增
  handleTempAddFolder(e) {
    // 关闭overlay
    e.nativeEvent && e.nativeEvent.stopPropagation();
    // 显示面板
    this.setState({
      folderTreeshow: true
    })

    if (this.input) {
      this.props.onShowErr('请先保存上次的操作！')
      $(ReactDOM.findDOMNode(this.input)).focus()
      return false;
    }

    const { parentNode } = this.state
    // 名称
    const name = this._getInitNodeName(parentNode, '新建文件夹')

    const newFolder = {
      ...parentNode,
      name,
      id: 'tempFolders_id',
      type: TYPE_NAMES.folder,
      path: [0],      // 默认为根目录下的
      sub: []
    };

    if (parentNode && parentNode.id) {
      newFolder.parent_path = parentNode.path;
      newFolder.path = parentNode.path.concat([0])
      newFolder.parent_id = parentNode.id
    }
    // 为后台传入 userInfo 中的 user_group_id 字段
    newFolder.user_group_id = this.props.userInfo.group_id

    this.props.onTempAddFolder(newFolder).then(() => {
      this.setState({
        activeNode: newFolder,
        treeUuid: new Date().getTime()
      })
    });
  }

  // 新增文件夹
  handleAddFolder(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();

    const { activeNode } = this.state

    this.setState({
      folderTreeshow: true
    })

    const newFolder = {
      ...activeNode,
      id: ''
    };

    return new Promise((resolve) => {
      this.props.onAddFolder(newFolder, (json) => {
        if (!json.result) {
          this.props.onShowErr(json.msg);
          newFolder.id = 'tempFolders_id'
          this.setState({
            treeUuid: new Date().getTime(),
            activeNode: newFolder
          })
          resolve();
        } else {
          this.props.onShowSucc(json.msg);
          this.setState({
            treeUuid: new Date().getTime(),
            activeNode: null
          })
        }
      });
    })
  }

  handleOpenOverlay(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    this.setState({
      folderTreeshow: true
    }, () => {
      this.props.onSearch('')
    })
  }

  handleCloseOverlay(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    const { activeNode, parentNode, parent_id } = this.state
    const { folderTree, onRemoveTempFolders } = this.props
    // 撤销 temp Folder
    if (activeNode && activeNode.id === 'tempFolders_id') {
      onRemoveTempFolders(activeNode)
    }

    // 如果是没有选中，则应该清空 path
    if (!parent_id) {
      this.state.path = '/ '
      this.state.activeNode = null
    } else {
      // 撤回到原来的数据。
      const pathArray = [];
      if (parentNode) {
        getFullPath(folderTree, parentNode.path.slice(), pathArray, 'name');
      }
      this.state.path = `/ ${pathArray.join(' / ')}`
    }

    this.setState({
      path: this.state.path,
      folderTreeshow: false
    })
  }

  handleClear(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    // 撤销 temp Folder
    if (this.state.activeNode && this.state.activeNode.id === 'tempFolders_id') {
      this.props.onRemoveTempFolders(this.state.activeNode)
    }

    this.setState({
      path: '/ ',
      parent_id: '',
      canEdit: true,
      pathError: false,
      activeNode: null,
      parentNode: null  // 清空父级节点
    })
  }

  _beforeSave(key, data) {
    const { sheetsData, isEdit } = this.state
    return new Promise((resolve, reject) => {
      // 当前的名字不能和本地其他的数据集重名
      const otherSheetsData = sheetsData.filter((item, idx) => key != idx)
      const isRepeat = otherSheetsData.some((item) => {
        const name = item.name || item.sheet_name
        const currName = data.name || data.sheet_name
        return name == currName
      })

      if (isRepeat) {
        sheetsData[key].error = '数据集名称已经存在'
        reject(sheetsData)
      } else if (isEdit) {
        // 如果是编辑的情况下。不校验
        resolve()
      } else {
        this.props.onCheckName({
          name: data.name || data.sheet_name,
          type: 'EXCEL'
        }, (json) => {
          if (json.result) {
            sheetsData[key].error = '';
            resolve()
          } else {
            sheetsData[key].error = '数据集名称已经存在';
            reject(sheetsData)
          }
        })
      }
    })
  }

  // 是否重复定义名字
  _getInitNodeName(node, name) {
    const treeData = this.props.folderTree
    const parent_path = node ? node.path : null
    let target = null

    if (Array.isArray(parent_path)) {
      parent_path.forEach((item, index) => {
        if (index === 0) {
          target = treeData[item]
        } else {
          target = target.sub[item]
        }
      })
    }

    const bortherNode = target ? target.sub : treeData
    // 计数
    let i = 1;
    let initname = name
    // 初始化名字
    const initName = () => {
      if (bortherNode.find(item => item.name === initname)) {
        initname = `${name}_${i}`
        i++;
        initName();
      }
    }

    initName();

    return initname
  }

  STYLE_SHEET = {
    overlay: {
      position: 'absolute',
      width: '490px',
      marginLeft: '0',
      marginTop: '-10px',
      minHeight: '100px',
      padding: '5px 0',
      overflow: 'auto',
      maxHeight: '350px'
    },
    nothing: {
      textAlign: 'center',
      lineHeight: '100px',
      color: '#999'
    },
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
    icon: {
      position: 'absolute',
      left: '0px',
      top: '0px',
      paddingRight: '10px'
    },
    tickIcon: {
      fontSize: '14px',
      position: 'absolute',
      display: 'block',
      padding: '6px',
      right: '1px',
      top: '2px',
      cursor: 'pointer',
      transition: 'color .3s'
    },
  }
}

export default ThirdProcess
