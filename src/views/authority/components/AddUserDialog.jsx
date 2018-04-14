import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import Loading from 'react-bootstrap-myui/lib/Loading';
import SelectionButton from '@components/SelectionButton';
import _ from 'lodash';
import './add-user-dialog.less';

const NOOP = () => {}
const timer = null

class AddUserDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    pending: PropTypes.bool,
    userList: PropTypes.array,
    pagination: PropTypes.object,
    onFetchUserList: PropTypes.func,
    onSure: PropTypes.func,
    onHide: PropTypes.func
  };

  static defaultProps = {
    show: false
  };

  constructor(props) {
    super(props)
    this.state = {
      select: [],
      keyword: ''
    };
  }

  render() {
    const { show, onHide, pending, userList } = this.props
    const { select, keyword  } = this.state

    // 如果 userList 中不存在 id 不在 select 中的项
    const AllSelect = !userList.some((item) => {
      const ids = select.map(item => item.id)
      return ids.indexOf(item.id) === -1
    })

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '634px', height: '500px' }}
        className="add-user-dialog"
        id="add-user-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>添加用户</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="left">
            <div className="title">
              全部
              <div className="form single-search-form" style={{ float: 'right', width: '200px' }}>
                <Input type="text"
                  placeholder="搜索用户"
                  value={keyword}
                  onChange={this.handleChangeKeyword.bind(this)}
                  addonAfter={<i className="dmpicon-search" />}
                  className="search-input-box"
                />
                {
                  keyword && <i className="dmpicon-close" onClick={this.handleClearKeyword.bind(this)}></i>
                }
              </div>
            </div>
            <div className="box-wrap">
              <div className="header">
                <div style={{ width: '200px' }}>用户名</div>
                <div style={{ width: '76px' }} className="checkbox-wrap" onClick={this.handleSelectAll.bind(this, AllSelect)}>&nbsp;<Input type="checkbox" checked={AllSelect} onChange={NOOP}/></div>
              </div>
              <div className="scroll-body" onScroll={this.handleScroll.bind(this)}>
                {
                  userList.map((item, index) => {
                    const isExist = select.some(s => item.id === s.id)
                    return <div className="checkbox-wrap" key={index} onClick={this.handleSelect.bind(this, item, isExist)}>
                      {item.name}
                      <Input type="checkbox" checked={isExist} onChange={NOOP}/>
                    </div>
                  })
                }
              </div>
            </div>
          </div>
          <div className="right">
            <div className="title">已选择 {select.length} 个用户</div>
            <div className="box-wrap">
              {select.map((item, index) => <SelectionButton key={index} selected onClick={this.handleRemove.bind(this, index)}>{item.name}</SelectionButton>)
              }
            </div>
          </div>
          <Loading show={pending} containerId="add-user-dialog"/>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSure.bind(this)}>确定</Button>
          <Button bsStyle="default" onClick={onHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  }

  handleChangeKeyword(e) {
    clearTimeout(timer)
    const value = e.target.value
    this.setState({
      keyword: value
    })

    // 延时
    setTimeout(() => {
      this.props.onFetchUserList(value, 1)
    }, 300)
  }

  handleScroll(e) {
    const scrollTop = e.target.scrollTop
    const scrollHeight = e.target.scrollHeight
    const clientHeight = e.target.clientHeight
    const { page, total, pageSize } = this.props.pagination
    const pending = this.props.pending

    // 如果滚到底了。则加载下一页  （ 20 为误差数）
    if (scrollTop + clientHeight >  scrollHeight - 20 && page < Math.ceil(total / pageSize) && !pending) {
      const nextPage = page + 1
      this.props.onFetchUserList(this.state.keyword, nextPage)
    }
  }

  handleClearKeyword() {
    this.setState({
      keyword: ''
    })

    this.props.onFetchUserList('', 1)
  }

  handleSure() {
    this.props.onSure(this.state.select)
  }

  handleSelectAll(AllSelect) {
    const selectIds = this.props.userList.map(item => item.id)
    // 应该是 针对当前 list 的所有 id
    if (AllSelect) {
      selectIds.forEach((id) => {
        const index = this.state.select.findIndex(item => item.id === id)
        this.state.select.splice(index, 1)
      })
    } else {
      const newSelect = this.state.select.concat(this.props.userList.slice())
      this.state.select = _.uniqBy(newSelect, 'id')
    }
    this.setState({
      select: this.state.select
    })
  }

  handleSelect(item, isExist) {
    if (isExist) {
      const index = this.state.select.findIndex(s => s.id === item.id)
      this.state.select.splice(index, 1)
    } else {
      this.state.select.push(item)
    }

    this.setState({
      select: this.state.select
    })
  }

  handleRemove(index) {
    this.state.select.splice(index, 1)
    this.setState({
      select: this.state.select
    })
  }
}

export default AddUserDialog;
