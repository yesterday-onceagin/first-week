import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';

import _ from 'lodash';

import './role-set-dialog.less';

const NOOP = () => {}

class RoleSetDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    group: PropTypes.object,
    pending: PropTypes.bool,
    roleList: PropTypes.array,
    selectList: PropTypes.array,
    onCreate: PropTypes.func,
    onSure: PropTypes.func,
    onHide: PropTypes.func
  };

  static defaultProps = {
    show: false
  };

  constructor(props) {
    super(props)
    this.state = {
      select: props.selectList.slice()
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.selectList, nextProps.selectList)) {
      this.setState({
        select: nextProps.selectList.slice()
      })
    }
  }

  render() {
    const { show, onHide, roleList, pending, group } = this.props
    const { select } = this.state
    // 是否已经存在和用户组名称一致的角色
    const isExist = roleList.some(item => item.name === `${group.name}角色`)

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '400px', height: '300px' }}
        className="role-set-dialog"
        id="role-set-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>编辑用户组角色</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          {
            roleList.map((item, key) => {
              const selected = select.indexOf(item.id) > -1
              return <div key={key} className="checkbox-wrap" onClick={this.handleSelect.bind(this, item.id, selected)}>
                <Input type="checkbox" checked={selected} onChange={NOOP}/> {item.name}
              </div>
            })
          }
          {
            !isExist && (
              <div className="checkbox-wrap">
                <a href="javascript:;" onClick={this.handleGo.bind(this)}>
                  创建{group.name}角色
                </a>
              </div>
            )
          }
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSure.bind(this)} loading={pending} disabled={pending}>确定</Button>
          <Button bsStyle="default" onClick={onHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  }

  handleGo(e) {
    e.stopPropagation();
    this.props.onCreate()
  }

  handleSure() {
    this.props.onSure(this.state.select)
  }

  handleSelect(id, isExist) {
    if (isExist) {
      const index = this.state.select.findIndex(item => item === id)
      this.state.select.splice(index, 1)
    } else {
      this.state.select.push(id)
    }

    this.setState({
      select: this.state.select
    })
  }
}

export default RoleSetDialog;
