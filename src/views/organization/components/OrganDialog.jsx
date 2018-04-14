import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import GroupTree from '@components/GroupTree';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as userGroupActionCreators } from '@store/modules/organization/userGroup';

import { getArrayFromTree } from '@helpers/groupTreeUtils';

class OrganDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    data: PropTypes.object,
    showErr: PropTypes.func,
    onSure: PropTypes.func,
    onHide: PropTypes.func,
    groupId: PropTypes.string
  };

  static defaultProps = {
    show: false
  };

  constructor(props) {
    super(props);
    this.state = {
      keyword: ''
    }
  }

  componentWillMount() {
    this.props.actions.fetchUserEditableGroupOrgan(this.props.groupId, (json) => {
      if (!json.result) {
        this.props.showErr(json.msg);
      }
    });
  }

  render() {
    const { show, onHide, userEditableOrganTree, organ_pending } = this.props;
    const { keyword } = this.state

    const OrganNodeTemplate = (node) => {
      const checkBoxClassName = node.selected ? (node.selected === 'not-all' ? 'some-checked' : 'checked') : '';
      // 修改organ-tree-node 样式
      const nodeStyle = {
        position: 'relative'
      }
      // 修改 checkbox 样式
      const nodeCheckboxStyle = {
        position: 'absolute',
        top: '0px',
        right: '0px',
        padding: '5px',
        lineHeight: 1
      }

      return (
        <div className="organ-tree-node" style={nodeStyle}>
          {node.name}
          {
            !node.disable && (
              <div style={nodeCheckboxStyle}
                onClick={this.handleSelectOrgan.bind(this, node)}
              >
                <i className={`icon-checkbox  ${checkBoxClassName}`}/>
              </div>
            )
          }
        </div>
      )
    };

    const hasVisibleGroup = Array.isArray(userEditableOrganTree) && userEditableOrganTree.length > 0 && !userEditableOrganTree[0].hidden;

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '650px', height: '596px' }}
        className="data-view-organ-config-dialog"
        id="data-view-organ-config-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>设置组织机构访问权限</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body style={{ overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '53px', padding: '0 5px 15px' }}>
            <div className="form single-search-form" style={{ float: 'right', width: '330px' }}>
              <Input type="text"
                placeholder="请输入关键字"
                value={keyword}
                onChange={this.handleChangeKeyword}
                addonAfter={<i className="dmpicon-search"/>}
                className="search-input-box"
              />
              {
                keyword && <i className="dmpicon-close" onClick={this.handleClearKeyword}/>
              }
            </div>
          </div>
          <div style={{ height: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
            {
              organ_pending ? (
                <div style={{ textAlign: 'center', paddingTop: '150px' }}>加载中...</div>
              ) : (
                hasVisibleGroup ? (
                  <GroupTree
                    className="user-group-organ-tree"
                    data={userEditableOrganTree}
                    nodeTemplate={OrganNodeTemplate}
                    nodeHeight={24}
                  />
                ) : (
                  <div style={{ textAlign: 'center', paddingTop: '150px' }}>没有可以设置的项目</div>
                )
              )
            }
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" loading={organ_pending} onClick={this.handleSaveInfo}>确定</Button>
          <Button bsStyle="default" onClick={onHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  }

  // 输入搜索关键字
  handleChangeKeyword = (e) => {
    const v = e.target.value;

    this.setState({
      keyword: v
    });

    this.props.actions.filterOrganTreeByKeyword(v);
  };

  // 清除搜索关键字
  handleClearKeyword = (e) => {
    e.stopPropagation();

    this.setState({
      keyword: ''
    });

    this.props.actions.filterOrganTreeByKeyword('');
  };

  // 修改信息响应事件
  handleSelectOrgan = (node, e) => {
    e.stopPropagation();

    this.props.actions.selectOrganTreeNode(node);
  };

  // 保存提交
  handleSaveInfo = () => {
    const organList = getArrayFromTree(this.props.userEditableOrganTree)
      .filter(item => item.selected === true && !item.disable)
      .map(item => item.id)

    this.props.onSure({
      group_id: this.props.groupId,
      organ_list: organList
    });
  };
}

const stateToProps = state => ({
  ...state.user_group,
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(userGroupActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(OrganDialog);
