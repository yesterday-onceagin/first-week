import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class'
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import { Form, ValidatedInput } from '../../../components/bootstrap-validation';
import GroupTree from '../../../components/GroupTree';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataSetActionCreators } from '../../../redux/modules/dataset/dataset';

import { getFullPath } from '../../../helpers/groupTreeUtils'

let searchTimerDialog = 0;

const SavePathDialog = createReactClass({
  displayName: 'SavePathDialog',

  propTypes: {
    show: PropTypes.bool,
    savePending: PropTypes.bool,
    name: PropTypes.string,
    tree: PropTypes.array,
    onSure: PropTypes.func,
    onHide: PropTypes.func
  },

  getDefaultProps() {
    return {
      show: false,
      name: '',
    };
  },

  getInitialState() {
    return {
      name: this.props.name,
      path: '/ ',
      parent_id: '',
      canEdit: true
    }
  },

  componentDidMount() {
    // 获取仅有文件夹类型的树
    this.props.actions.fetchDatasetTree(true);
  },

  render() {
    const { show, onHide, folderTree, pending, savePending } = this.props;

    const { name, path, parent_id, canEdit } = this.state;

    const hasFolderTree = Array.isArray(folderTree) && folderTree.length > 0;

    // 节点模版
    const nodeTemplate = (node, spread) => (
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

    return (
      <Dialog
        show={show}
        backdrop="static"
        onHide={onHide}
        size={{ width: '550px' }}
        className="dataset-file-path-dialog" id="dataset-file-path-dialog">
        <Dialog.Header closeButton>
          <Dialog.Title>保存数据集</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Form className="form-horizontal"
            validationEvent="onBlur"
            onValidSubmit={this.handleSaveInfo}
            ref={(instance) => { this.add_dataset_form = instance }}>
            <ValidatedInput type="text"
              label={<span><i className="required">*</i>数据集名称</span>}
              autoComplete="off"
              name="name"
              value={name}
              onChange={this.handleChangeInfo.bind(this, 'name')}
              maxLength="20"
              wrapperClassName="input-wrapper"
              validate='required'
              errorHelp={{
                required: '请输入数据集名称'
              }} />
            <div className="form-group">
              <label className="control-label">
                <span>
                  保存路径
                </span>
                {
                  parent_id && (
                    <span className="clear-path-btn"
                      onClick={this.handleClearPath}
                      style={{ float: 'right', fontSize: '12px', transiton: 'color .3s' }}>
                      清空路径
                    </span>
                  )
                }
              </label>
              {
                !pending && hasFolderTree && (
                  <div className="input-wrapper" style={{ padding: '0px' }}>
                    <input type="text"
                      value={path}
                      disabled={!canEdit}
                      onChange={this.handleChangeInfo.bind(this, 'path')}
                      onBlur={this.handleBlurInfo.bind(this, 'path')}
                      style={{ width: '100%', lineHeight: '26px', padding: '1px 10px' }} />
                  </div>
                )
              }
              <div className="path-config-box"
                style={{ width: '100%', height: '300px', overflowX: 'hidden', overflowY: 'auto', borderWidth: '1px', borderStyle: 'solid' }}>
                {
                  pending && !savePending ? (
                    <div className="hint-color"
                      style={{ textAlign: 'center', paddingTop: '140px' }}>
                      加载中...
                    </div>
                  ) : (
                    hasFolderTree ? (
                      <GroupTree
                        key="file-path-tree"
                        data={folderTree}
                        activeId={parent_id}
                        nodeTemplate={nodeTemplate}
                        paddingUnit={22}
                        nodeHeight={30} />
                    ) : (
                      <div className="hint-color"
                        style={{ textAlign: 'center', paddingTop: '140px' }}>
                            暂无文件夹（将创建在根目录下）
                      </div>
                    )
                  )
                }
              </div>
            </div>
          </Form>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary"
            loading={savePending}
            onClick={() => { this.add_dataset_form.submit() }}>
            确定
          </Button>
          <Button bsStyle="default" onClick={onHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  },

  // 切换当前选中的文件夹
  handleChangeCurrFolder(node) {
    // 未变更的时候不处理
    if (node.id === this.state.parent_id) {
      return;
    }

    const pathArray = [];

    getFullPath(this.props.folderTree, node.path.slice(), pathArray, 'name');

    this.setState({
      parent_id: node.id,
      path: `/ ${pathArray.join(' / ')}`,
      canEdit: false,
      pathError: false
    });
  },

  // 清空路径
  handleClearPath() {
    this.props.onSearch('');
    this.setState({
      path: '/ ',
      parent_id: '',
      canEdit: true
    });
  },

  handleBlurInfo(field) {
    // 如果 parent_id 为空。
    if (field === 'path' && this.state.parent_id == '') {
      this.state.path = '/ '
      this.state.canEdit = true
      this.props.onSearch('');
    }

    this.setState({
      ...this.state,
      [field]: this.state[field]
    })
  },

  // 输入响应
  handleChangeInfo(field, e) {
    const inputValue = e.target.value;

    if (field === 'path' && this.state.canEdit) {
      clearTimeout(searchTimerDialog);

      searchTimerDialog = setTimeout(() => {
        this.props.onSearch(inputValue);
      }, 300);
    }
    this.setState({
      [field]: inputValue
    });
  },

  // 保存
  handleSaveInfo() {
    this.props.onSure(this.state.name, this.state.parent_id);
  },

  STYLE_SHEET: {
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
  },
});


const stateToProps = state => ({
  ...state.dataset,
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(dataSetActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(SavePathDialog);
