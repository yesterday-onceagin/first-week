import React from 'react'
import PropTypes from 'prop-types'

import DataTable from 'react-bootstrap-myui/lib/DataTable';
import Loading from 'react-bootstrap-myui/lib/Loading';
import Input from 'react-bootstrap-myui/lib/Input';

import _ from 'lodash';

import './auth-set.less';

const NOOP = () => { }

class AuthSet extends React.Component {
  static PropTypes = {
    data: PropTypes.array,
    pending: PropTypes.bool,
    disabled: PropTypes.bool,
    editable: PropTypes.bool,
    onGetInstance: PropTypes.func
  };

  static defaultProps = {
    editable: true
  };

  state = {
    categoryActive: 0,
    select: []
  };

  componentDidMount() {
    // 钩子函数 返回当前实例
    this.props.onGetInstance && this.props.onGetInstance(this)
    this.setState({
      select: this.props.select
    })
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.select, nextProps.select)) {
      this.setState({
        select: nextProps.select
      })
    }
  }

  render() {
    const { categoryActive } = this.state
    const { data } = this.props

    return <div className="sub-wrap">
      <div className="category-tabs">
        {
          data && data.map((item, key) =>
            <div
              key={key}
              className={`item ${key === categoryActive ? 'active' : ''}`}
              onClick={this.handleSelectTab.bind(this, 'categoryActive', key)}
            >
              {item.func_name}
            </div>)
        }
      </div>
      {data && data.length > 0 && this.renderAuthList()}
    </div>
  }

  renderAuthList() {
    const { categoryActive, select } = this.state
    const { data, pending, editable, disabled } = this.props
    // 如果有子集只展示子集。否则展示 本身
    const activeItem = data[categoryActive]
    // 数据集
    let list = []
    if (activeItem.children && activeItem.children.length > 0) {
      list = activeItem.children.filter(item => item.actions.length > 0)
    } else {
      list = activeItem.actions && activeItem.actions.length > 0 ? [activeItem] : []
    }

    const dataFields = [{
      idField: true,
      name: '序号'
    }, {
      text: '功能',
      name: 'func_name',
    }, {
      text: '操作权限',
      name: 'action'
    }];

    const rowTemplate = <tr>
      <td>%id%</td>
      <td style={{ width: '250px' }}>%func_name%</td>
      <td childrenNode={rowData => rowData.actions.map((item, key) => {
        const group = select.find(item => item.func_code === rowData.func_code)
        // 已选择的 actions
        const func_action_codes = group ? (group.func_action_codes || []) : []
        const _disabled = !editable || disabled
        return <span key={key} className={`checkbox-wrap ${!_disabled ? '' : 'disabled'}`} onClick={this.handleChange.bind(this, rowData.func_code, item.action_code)}>
          <Input type="checkbox" checked={func_action_codes.indexOf(item.action_code) > -1} />
          {item.action_name}
        </span>
      })}></td>
    </tr>

    return <div className="table-panel">
      <DataTable
        tableWrapperId='datatable-wrapper'
        hover
        serialNumber={false}
        bordered={false}
        dataFields={dataFields}
        rowTemplate={rowTemplate}
        emptyText="没有可显示的数据！"
        data={list || []}
      />
      <Loading show={pending} containerId="datatable-wrapper" />
    </div>
  }

  handleChange(func_code, action_code) {
    // 禁用按钮
    if (this.props.disabled || !this.props.editable) {
      return;
    }
    const currGroup = this.state.select.find(item => item.func_code === func_code)
    const currIndex = this.state.select.findIndex(item => item.func_code === func_code)
    // 当前已经存在
    if (currGroup) {
      // 对应的权限项
      const func_action_codes = currGroup.func_action_codes || []
      const index = func_action_codes.indexOf(action_code)
      // 如果已经存在
      if (index > -1) {
        func_action_codes.splice(index, 1)
      } else {
        func_action_codes.push(action_code)
      }

      this.state.select[currIndex].func_code = func_code
      this.state.select[currIndex].func_action_codes = func_action_codes
    } else {
      this.state.select.push({
        func_code,
        func_action_codes: [action_code]
      })
    }

    this.setState({
      select: this.state.select
    })
  }

  handleSelectTab(field, index) {
    this.setState({
      [field]: index
    })
  }

  getAuth() {
    return this.state.select
  }
}

export default AuthSet
