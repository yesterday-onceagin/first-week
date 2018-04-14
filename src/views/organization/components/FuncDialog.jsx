import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import GroupTree from '@components/GroupTree';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as userGroupActionCreators } from '@store/modules/organization/userGroup';

import { getArrayFromTree } from '@helpers/groupTreeUtils';

class FuncDialog extends React.Component {
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

  componentWillMount() {
    this.props.actions.fetchUserEditableGroupFunc(this.props.groupId, (json) => {
      if (!json.result) {
        this.props.showErr(json.msg);
      }
    });
  }

  render() {
    const {
      show,
      onHide,
      userEditableFuncTree,
      func_pending
    } = this.props;

    const funcNodeTemplate = (node) => {
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
        <div className="func-tree-node" style={nodeStyle}>
          {node.name}
          {
            !node.disable && (
              <div style={nodeCheckboxStyle}
                onClick={this.handleSelectFunc.bind(this, node)}
              >
                <i className={`icon-checkbox  ${checkBoxClassName}`}/>
              </div>
            )
          }
        </div>
      )
    };

    const hasVisibleFunc = Array.isArray(userEditableFuncTree) && userEditableFuncTree.length > 0;

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '650px' }}
        className="data-view-func-config-dialog"
        id="data-view-func-config-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>设置功能访问权限</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body style={{ overflow: 'hidden' }}>
          <div style={{ height: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
            {
              func_pending ? (
                <div style={{ textAlign: 'center', paddingTop: '150px' }}>加载中...</div>
              ) : (
                hasVisibleFunc ? (
                  <GroupTree
                    className="user-group-func-tree"
                    data={userEditableFuncTree}
                    nodeTemplate={funcNodeTemplate}
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
          <Button bsStyle="primary"
            loading={func_pending}
            onClick={this.handleSaveInfo}
          >
            确定
          </Button>
          <Button bsStyle="default" onClick={onHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  }

  // 修改信息响应事件
  handleSelectFunc = (node, e) => {
    e.stopPropagation();

    this.props.actions.selectFuncTreeNode(node);
  };

  // 保存提交
  handleSaveInfo = () => {
    const funcList = [];
    const appList = [];

    getArrayFromTree(this.props.userEditableFuncTree)
      .filter(item => item.selected === true && !item.disable)
      .forEach((item) => {
        if (item.application_id) {
          funcList.push(item.id);
        } else {
          appList.push(item.id);
        }
      });

    this.props.onSure({
      group_id: this.props.groupId,
      func_list: funcList,
      app_list: appList
    });
  };
}

const stateToProps = state => ({
  ...state.user_group
});

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(userGroupActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(FuncDialog);
