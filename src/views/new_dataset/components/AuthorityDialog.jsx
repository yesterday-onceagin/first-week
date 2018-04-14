import React from 'react';
import PropTypes from 'prop-types';

import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import Select from 'react-bootstrap-myui/lib/Select';
import Input from 'react-bootstrap-myui/lib/Input';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import Loading from 'react-bootstrap-myui/lib/Loading';
import DatePicker from '@components/DatePicker';
import NumberInput from '@components/NumberInput';
import { getDateStr } from '@helpers/dateUtils';
import MicroTree from '@components/MicroTree';
import SwitchButton from '@components/SwitchButton';

import _ from 'lodash';

import { DATASET_FIELD_TYPES } from '../constants'

import './authority-dialog.less'

class AuthToggleItem extends React.Component {
  static PropTypes = {
    node: PropTypes.object,
    field: PropTypes.object,
    auth: PropTypes.object,
    visible: PropTypes.bool,
    onChange: PropTypes.func,
    onChangeVisible: PropTypes.func,      // 设置是否过滤所有
    onDelField: PropTypes.func,           // 删除字段本身
    onFetchFilterOptions: PropTypes.func
  };

  state = {
    expand: false,
    visible: false,
    loading: false,

    // 描述类
    describe: {
      operator: '=',
      value: [],
    },
    // 数值类
    number: {
      operator: '>',
      value: ['0']
    },
    // 日期类
    date: {
      mode: 0,
      include: true,
      operator: '=',
      value: [],
      enddate: 'today'
    }
  };

  componentDidMount() {
    const { visible, auth } = this.props
    if (auth) {
      this.encodeFilters(this.props.auth)
    }
    if (visible) {
      this.setState({
        visible,
        expand: visible
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    const { auth, visible } = this.props
    if (!_.isEqual(auth, nextProps.auth)) {
      this.encodeFilters(nextProps.auth)
    }
    if (visible !== nextProps.visible) {
      this.setState({
        visible: nextProps.visible,
        expand: nextProps.visible
      })
    }
  }

  render() {
    const { field } = this.props
    const { visible, expand } = this.state
    const element = DATASET_FIELD_TYPES[field ? field.data_type : '字符串']

    const bodyContent = () => {
      if (field && field.data_type === '日期') {
        return this.renderDate()
      } else if (field && field.data_type === '数值') {
        return this.renderNumber()
      }
      return this.renderDescribe()
    }

    return <div className={`toggle-item ${expand ? 'expand' : 'unexpand'}`}>
      <div className={`header ${visible ? '' : 'disabled'}`} onClick={visible ? this.handleToggle.bind(this) : null}>
        {element.icon}
        <OverlayTrigger trigger="hover" placement="top" overlay={(<Tooltip>{field.alias_name || field.col_name}</Tooltip>)}>
          <span style={this.STYLE_SHEET.textLimit}>{field.alias_name || field.col_name}</span>
        </OverlayTrigger>
        <OverlayTrigger trigger="hover" placement="top" overlay={(<Tooltip><div style={{ textAlign: 'left' }}>所有：即过滤所有字段<br />部分：即按照设置条件过滤</div></Tooltip>)}>
          <div className="dmp-switch-box-wrap">
            <SwitchButton
              active={visible}
              texts={{ on: '部分', off: '所有' }}
              turnOn={this.handleChecked.bind(this)}
              turnOff={this.handleChecked.bind(this)}
            />
          </div>
        </OverlayTrigger>
        <i className="dmpicon-del" onClick={this.handleDelField.bind(this, field)} />
      </div>
      <div className="body" key="body">
        {bodyContent()}
      </div>
    </div>
  }

  // 日期类型 data_type = "日期"
  renderDate() {
    const { operator, value, include, mode, enddate } = this.state.date
    return [
      <div className="row">
        <div className="row-title" onClick={this.handleChangeMode.bind(this, 0)}>
          <Input type="checkbox" checked={mode === 0} /> 动态时间段
        </div>
        {
          mode === 0 && <div className="content">
            <Select value={operator} style={{ width: '90px', float: 'left' }} onSelected={this.handleDateSelected.bind(this, 'operator')}>
              {
                this.OPTIONS.dynamic.map((item, index) =>
                  <option value={item.operator} key={index}>{item.text}</option>)
              }
            </Select>
            {
              operator === 'far' && <span className="number-wrap">
                <NumberInput
                  changeOnBlur={true}
                  debounce={true}
                  minValue={1}
                  step={1}
                  name="value"
                  value={+value[0]}
                  onChange={this.handleDateNumberValue.bind(this)}
                />
              </span>
            }
            {
              operator === 'far' && <span className="checkbox-wrap" onClick={this.handleDateInclude.bind(this)}>
                <Input type="checkbox" checked={include} /> 包含今天
              </span>
            }
          </div>
        }
      </div>,
      <div className="row">
        <div className="row-title" onClick={this.handleChangeMode.bind(this, 1)}>
          <Input type="checkbox" checked={mode === 1} /> 静态时间段
        </div>
        {
          mode === 1 && <div className="content">
            <DatePicker single={false} value={value} onSelected={this.handleDatePicker.bind(this)} />
          </div>
        }
      </div>,
      <div className="row form">
        <div className="row-title" onClick={this.handleChangeMode.bind(this, 2)}>
          <Input type="checkbox" checked={mode === 2} /> 自定义
        </div>
        {
          mode === 2 && <div className="content">
            <div style={{ marginBottom: '5px' }}>开始时间</div>
            <div style={{ marginBottom: '5px' }}><DatePicker value={value} onSelected={this.handleDatePicker.bind(this)} /></div>
            <div style={{ marginBottom: '5px' }}>结束时间</div>
            <div>
              <Select value={enddate} style={{ width: '90px' }} onSelected={this.handleDateEnd.bind(this)}>
                {
                  this.OPTIONS.enddate.map((item, index) =>
                    <option value={item.value} key={index}>{item.text}</option>)
                }
              </Select>
            </div>
          </div>
        }
      </div>,
    ]
  }

  // 数值类型 data_type = "数值"
  renderNumber() {
    const { operator, value } = this.state.number
    const isBetween = operator === 'between'

    return <div className="row form">
      <div className="item">
        <Select value={operator} style={{ width: '90px' }} onSelected={this.handleSetNumberSelect.bind(this)}>
          {
            this.OPTIONS.number.map((item, index) =>
              <option value={item.operator} key={index}>{item.text}</option>)
          }
        </Select>
      </div>
      <div className="item">
        <Input type="text" value={value[0]} placeholder="请输入数值" style={{ width: '92px' }} onChange={this.handleSetNumberValue.bind(this, 0)} />
      </div>
      {isBetween && <div className="item" style={{ lineHeight: '24px', margin: '0' }}>~</div>}
      {isBetween && <div className="item">
        <Input type="text" value={value[1]} placeholder="请输入数值" style={{ width: '92px' }} onChange={this.handleSetNumberValue.bind(this, 1)} />
      </div>}
    </div>
  }

  // 描述类型 data_type 
  renderDescribe() {
    const { field } = this.props
    const { operator, value } = this.state.describe
    const type = ['in', 'not in'].indexOf(operator) > -1 ? 'multiple' : 'single'

    return <div className="row" id={`describe-row-${field ? field.id : ''}`}>
      <div className="item">
        <Select value={operator} style={{ width: '90px' }} onSelected={this.handleSetDescribe.bind(this, 'operator')}>
          {
            this.OPTIONS.describe.map((item, key) =>
              <option value={item.operator} key={key}>{item.text}</option>)
          }
        </Select>
      </div>
      <div className="item">
        <Select selected={0} value={value.length > 0 ? value : undefined} style={{ width: '90px' }} type={type} openSearch hasIcon={type == 'multiple'} showMultipleBar={false} onSelected={this.handleSetDescribe.bind(this, 'value')}>
          {
            this.FILTER_OPTIONS.map((item, key) =>
              <option value={item.id} key={key}>{item.value}</option>)
          }
        </Select>
      </div>
      <Loading show={this.state.loading} containerId={`describe-row-${field ? field.id : ''}`} />
    </div>
  }

  handleDelField(field, e) {
    e.stopPropagation();
    this.props.onDelField(field)
  }

  handleDateInclude() {
    this.setState({
      date: {
        ...this.state.date,
        include: !this.state.date.include
      }
    }, this.setParentProps)
  }

  handleDatePicker(value) {
    this.setState({
      date: {
        ...this.state.date,
        value
      }
    }, this.setParentProps)
  }

  //
  handleDateSelected(field, option) {
    const value = option.value == 'far' ? [7] : []
    this.setState({
      date: {
        ...this.state.date,
        [field]: option.value,
        value
      }
    }, this.setParentProps)
  }

  // 设置 date
  handleDateNumberValue(value) {
    this.setState({
      date: {
        ...this.state.date,
        value: [value]
      }
    }, this.setParentProps)
  }

  handleDateEnd(option) {
    this.setState({
      date: {
        ...this.state.date,
        enddate: option.value
      }
    }, this.setParentProps)
  }

  // 设置 number 类型的数据
  handleSetNumberSelect(option) {
    this.setState({
      number: {
        ...this.state.number,
        operator: option.value,
        value: ['']
      }
    }, this.setParentProps)
  }

  // 设置 number 类型的 input
  handleSetNumberValue(index, e) {
    const value = this.state.number.value
    value[index] = e.target.value
    this.setState({
      number: {
        ...this.state.number,
        value
      }
    }, this.setParentProps)
  }

  // 设置 describe 类型的数据
  handleSetDescribe(field, option) {
    let values = option.value

    if (field === 'value') {
      if (['in', 'not in'].indexOf(this.state.describe.operator) > -1) {
        values = option.map(item => item.value)
      }
    } else {
      this.state.describe.value = []
    }

    this.setState({
      describe: {
        ...this.state.describe,
        [field]: values
      }
    }, this.setParentProps)
  }

  handleToggle(e) {
    e.stopPropagation();
    const { node, field, onFetchFilterOptions } = this.props
    const un_describe_type = ['日期', '数值']

    // 如果没有展开 并且 data_type == '描述'
    if (!this.state.expand && un_describe_type.indexOf(node.data_type) === -1) {
      // start loding
      this.setState({ loading: true })
      onFetchFilterOptions({
        dataset_field_id: field.id,
        dataset_id: node.id
      }, (json) => {
        if (json.result) {
          this.FILTER_OPTIONS = json.data.map(item => ({
            id: Object.values(item)[0] || '',
            value: Object.values(item)[0] || '(空)'
          }))

          // 默认赋值 this.state.describe.value[0] 
          if (Array.isArray(this.state.describe.value) && this.state.describe.value.length === 0) {
            this.state.describe.value = this.FILTER_OPTIONS[0].id
          }
        }
        // end loding
        this.setState({
          ...this.state,
          loading: false
        }, this.setParentProps)
      })
    }

    this.setState({
      expand: !this.state.expand
    })
  }

  handleChecked(e) {
    e.stopPropagation();

    this.setState({
      visible: !this.state.visible,
      expand: !this.state.visible,
    }, this.setParentProps)
  }

  handleChangeMode(mode) {
    let value = []
    let operator = '='
    let enddate = ''

    if (mode === 1) {
      value = [getDateStr(-30), getDateStr(0)]
      operator = 'between'
    } else if (mode === 2) {
      value = getDateStr(0)
      enddate = this.OPTIONS.enddate[0].value
      operator = 'between'
    }

    this.setState({
      date: {
        ...this.state.date,
        operator,
        value,
        mode,
        enddate
      }
    }, this.setParentProps)
  }

  // 设置 parent component props
  setParentProps() {
    const { field, onChange, onChangeVisible } = this.props
    if (!this.state.visible) {
      // 将不可见的字段通知到 parent
      onChangeVisible(field.id)
    } else {
      // 保存过滤条件
      onChange(field.id, {
        [field.id]: this.decodeFilters()
      })
    }
  }

  // encode json  ->  state
  encodeFilters(data) {
    const { field, node, onFetchFilterOptions } = this.props
    switch (data && data.data_type) {
      case '日期': {
        let value = []
        let mode = 0
        let enddate = 'today'
        let include = true
        let operator = '='

        if (data.operator === 'between') {
          if (Array.isArray(data.col_value)) {
            operator = 'between'
            enddate = data.col_value[1]
            if (this.OPTIONS.enddate.some(item => item.value == enddate)) {
              mode = 2
              value = [data.col_value[0]]
            } else {
              mode = 1
              value = data.col_value
            }
          } else {
            mode = 1
            operator = 'between'
            value = data.col_value[0]
          }
        } else {
          mode = 0
          if (data) {
            switch (data.operator) {
              case '=':
                operator = '=';
                break;
              case 'from_week':
                operator = `from_week${data.col_value}`;
                break;
              case 'from_month':
                operator = `from_month${data.col_value}`;
                break;
              case 'from_quarter':
                operator = `from_quarter${data.col_value}`;
                break;
              case 'from_year':
                operator = `from_year${data.col_value}`;
                break;
              case 'far':
                operator = 'far';
                value = [data.col_value];
                include = true;
                break;
              case 'far_yesterday':
                operator = 'far';
                value = [data.col_value];
                include = false;
                break;
              default:
                break;
            }
          }
        }

        this.state.date = {
          value,
          mode,
          enddate,
          include,
          operator
        }
      }
        break;
      case '数值': {
        this.state.number = {
          operator: data.operator || '>',
          value: data.operator === 'between' ? data.col_value : [data.col_value]
        }
      }
        break;
      default: {
        if (data) {
          this.state.describe = {
            operator: data.operator || '=',
            value: data.col_value || []
          }
          // start loding
          this.setState({ loading: true })
          // 展开 当前数值
          onFetchFilterOptions({
            dataset_field_id: field.id,
            dataset_id: node.id
          }, (json) => {
            if (json.result) {
              this.FILTER_OPTIONS = json.data.map(item => ({
                id: Object.values(item)[0] || '',
                value: Object.values(item)[0] || '(空)'
              }))
              // 默认赋值 this.state.describe.value[0] 
              if (Array.isArray(this.state.describe.value) && this.state.describe.value.length === 0) {
                this.state.describe.value = this.FILTER_OPTIONS[0].id
              }
            }
            // start loding
            this.setState({
              ...this.state,
              loading: false
            }, this.setParentProps)
          })
        }
      }
        break;
    }
    this.setState({
      ...this.state,
      date: this.state.date,
      number: this.state.number,
      describe: this.state.describe
    })
  }
  // decode state -> json
  decodeFilters() {
    const { field } = this.props

    let operator = ''
    let col_value = ''

    switch (field.data_type) {
      case '日期': {
        if (this.state.date.mode === 0) {
          switch (this.state.date.operator) {
            case '=':
              operator = '=';
              col_value = '*';
              break;
            case 'from_week0':
              operator = 'from_week';
              col_value = 0;
              break;
            case 'from_week1':
              operator = 'from_week';
              col_value = 1;
              break;
            case 'from_month0':
              operator = 'from_month';
              col_value = 0;
              break;
            case 'from_month1':
              operator = 'from_month';
              col_value = 1;
              break;
            case 'from_quarter0':
              operator = 'from_quarter';
              col_value = 0;
              break;
            case 'from_quarter1':
              operator = 'from_quarter';
              col_value = 1;
              break;
            case 'from_year0':
              operator = 'from_year';
              col_value = 0;
              break;
            case 'from_year1':
              operator = 'from_year';
              col_value = 1;
              break;
            case 'far':
              operator = this.state.date.include ? 'far' : 'far_yesterday';
              col_value = this.state.date.value[0];
              break;
            default:
              break;
          }
        } else if (this.state.date.mode === 1) {
          operator = 'between'
          col_value = this.state.date.value
        } else if (this.state.date.mode === 2) {
          operator = 'between'
          col_value = [this.state.date.value, this.state.date.enddate]
        }
      } break;
      case '数值': {
        operator = this.state.number.operator
        col_value = this.state.number.operator == 'between' ? this.state.number.value : this.state.number.value[0]
      } break;
      default: {
        operator = this.state.describe.operator
        col_value = this.state.describe.value
      } break;
    }

    return {
      dataset_field_id: field.id,
      dataset_id: field.dataset_id,
      col_name: field.col_name,
      alias_name: field.alias_name,
      field_group: field.field_group,
      type: field.type,
      data_type: field.data_type,
      expression: field.expression,
      col_value,
      operator
    }
  }

  NULL_PREFFIX = '[item.id]::';

  FILTER_OPTIONS = [];

  OPTIONS = {
    enddate: [{
      value: 'today',
      text: '今天'
    }, {
      value: 'yesterday',
      text: '昨天'
    }, {
      value: 'lastweek',
      text: '上周'
    }, {
      value: 'lastmonth',
      text: '上月'
    }],
    number: [{
      text: '区间',
      operator: 'between'
    }, {
      text: '大于',
      operator: '>'
    }, {
      text: '小于',
      operator: '<'
    }, {
      text: '大于等于',
      operator: '>='
    }, {
      text: '小于等于',
      operator: '<='
    }],
    describe: [{
      text: '包含',
      operator: 'in'
    }, {
      text: '不包含',
      operator: 'not in'
    }, {
      text: '等于',
      operator: '='
    }, {
      text: '不等于',
      operator: '!='
    }],
    dynamic: [{
      text: '所有时间',
      operator: '=',
      value: '*'
    }, {
      text: '距今天',
      operator: 'far',
      include: true,
      value: 7
    }, {
      text: '本周',
      operator: 'from_week0'
    }, {
      text: '上周',
      operator: 'from_week1'
    }, {
      text: '本月',
      operator: 'from_month0'
    }, {
      text: '上月',
      operator: 'from_month1'
    }, {
      text: '本季度',
      operator: 'from_quarter0'
    }, {
      text: '上季度',
      operator: 'from_quarter1'
    }, {
      text: '本年',
      operator: 'from_year0'
    }, {
      text: '去年',
      operator: 'from_year1'
    }]
  };

  STYLE_SHEET = {
    // text-overflow(一个字空间)
    textLimit: {
      paddingRight: '14px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '210px',
      height: '100%',
      display: 'inline-block',
      verticalAlign: 'bottom'
    }
  }
}

class AuthorityDialog extends React.Component {
  static PropTypes = {
    show: PropTypes.bool,
    node: PropTypes.object,
    roleList: PropTypes.array,
    datasetField: PropTypes.array,
    pending: PropTypes.bool,
    loading: PropTypes.bool,     // 上否上传成功
    onClose: PropTypes.func,
    onSure: PropTypes.func,
    onFetchDatasetAuthFilters: PropTypes.func,
    onFetchFilterOptions: PropTypes.func,
    onFetchRoleList: PropTypes.func
  };

  static defaultProps = {
    show: false,
  };

  state = {
    initing: false,
    selectRoleIds: [],    //下拉列表选择的数据 [id, id]
    activeRoleId: '',     // 当前选中的角色
    datasetTree: [],
    selectFields: {},     // 以选择的字段id数组. key - value (弹窗中选择的字段)
    filterFields: {},     // 不可见的字段id数组。key - value
    auths: {}             // 已选角色的权限列表. key - value

  };

  componentDidMount() {
    this.initState()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.datasetField) {
      const datasetTree = []
      if (nextProps.datasetField) {
        Object.keys(nextProps.datasetField).forEach((item, index) => {
          datasetTree.push({
            rank: index,
            hidden: false,
            _spread_: true,
            title: item,
            children: nextProps.datasetField[item].map(item => ({ ...item, text: item.alias_name || item.col_name }))
          })
        })
      }

      this.setState({
        datasetTree
      })
    }
  }

  render() {
    const { show, onClose, roleList, datasetField, onFetchFilterOptions, node, loading } = this.props
    const { selectRoleIds, activeRoleId, initing, auths, selectFields, filterFields } = this.state
    // 选择的字段 数组
    const selectFieldsArr = []
    // 所有的字段 数组
    let allFields = []
    // 通过id遍历，寻找选中的字段
    if (datasetField) {
      allFields = _.flatten(Object.values(datasetField))
      const _filterFields = selectFields[activeRoleId]
      if (_filterFields && _filterFields.length > 0) {
        _filterFields.forEach((id) => {
          const item = allFields.find(field => field.id === id)
          selectFieldsArr.push(item)
        })
      }
    }
    // 选择的角色
    const activeRole = roleList.find(item => item.id === activeRoleId) || null
    // 是否全选
    // const unCheckAll = roleList.some(item => selectRoleIds.indexOf(item.id) === -1)
    return show && <Dialog
      show={show}
      onHide={onClose}
      backdrop="static"
      size={{ width: '600px', height: '510px' }}
      id="dataset-authority-dialog"
    >
      <Dialog.Header closeButton>
        <Dialog.Title>数据集授权</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body id="dataset-authority-dialog-body">
        <div className="body-container">
          <div className="left">
            <div className="title">
              角色列表
              {/*<div className="checkbox-wrap" onClick={this.handleSelectAll.bind(this, !unCheckAll)}>
                <Input type="checkbox" checked={!unCheckAll}/>
              </div>*/}
            </div>
            <div className="scroll-view">
              {
                roleList && roleList.map((item, key) => <div className={`item ${item.id === activeRoleId ? 'active' : ''}`} key={key} onClick={this.handleSelectRow.bind(this, item)}>
                  {item.name}
                  <div className="checkbox-wrap" onClick={this.handleCheckRole.bind(this, item)}>
                    <Input type="checkbox" checked={selectRoleIds.indexOf(item.id) > -1} />
                  </div>
                </div>)
              }
            </div>
          </div>
          <div className="right">
            <div className="title">
              <span>{activeRole ? `[${activeRole.name}] 受限字段` : '受限字段'}</span>
              {
                activeRoleId && <OverlayTrigger
                  trigger="click"
                  rootClose
                  placement="bottom"
                  overlay={<Tooltip id="authority-field-tree-dialog">{this.renderToggleOverlay()}</Tooltip>}
                >
                  <i className="dmpicon-add" />
                </OverlayTrigger>
              }
            </div>
            {
              <div className="scroll-view" id="right-wrap">
                {
                  selectFieldsArr.map(item =>
                    <AuthToggleItem
                      key={`${activeRoleId}_${item.id}`}
                      node={node}
                      field={item}
                      visible={filterFields[activeRoleId] ? filterFields[activeRoleId].indexOf(item.id) === -1 : false}
                      auth={auths[activeRoleId] ? auths[activeRoleId][item.id] : {}}
                      onDelField={this.handleRemoveField.bind(this)}
                      onFetchFilterOptions={onFetchFilterOptions}
                      onChange={this.handleSetAuth.bind(this)}
                      onChangeVisible={this.handleVisible.bind(this)}
                    />)
                }
              </div>
            }
          </div>
        </div>
        <Loading show={initing} containerId="dataset-authority-dialog-body" />
      </Dialog.Body>
      <Dialog.Footer>
        <Button bsStyle="primary" onClick={this.handleSure.bind(this)} loading={loading} disabled={loading}>确定</Button>
        <Button bsStyle="default" onClick={onClose}>取消</Button>
      </Dialog.Footer>
    </Dialog>
  }

  renderToggleOverlay() {
    const { datasetTree, selectFields, activeRoleId } = this.state

    const customerNode = node => selectFields[activeRoleId] && selectFields[activeRoleId].indexOf(node.id) > -1 &&
      <div className="select-mark"><i className="dmpicon-tick"></i></div>

    return <div className="tree-inner-wrap">
      {
        datasetTree && datasetTree.map((item, index) => <MicroTree
          data={item}
          key={index}
          showLine={true}
          sort={false}
          customerNode={customerNode}
          events={{
            onSpread: this.handleFolderSpread.bind(this, index),
            onSelect: this.handleSelectTree.bind(this)
          }} />)
      }
    </div>
  }

  // 移除单个字段
  handleRemoveField(field) {
    const { selectFields, activeRoleId, auths, filterFields } = this.state
    const _auths = _.cloneDeep(auths)
    const _selectFields = _.cloneDeep(selectFields)
    const _filterFields = _.cloneDeep(filterFields)
    // selectFields
    if (_selectFields[activeRoleId]) {
      const index = _selectFields[activeRoleId].indexOf(field.id)
      if (index > -1) {
        _selectFields[activeRoleId].splice(index, 1)
      }
    }

    // auths
    if (_auths[activeRoleId]) {
      const item = _auths[activeRoleId][field.id]
      if (item) {
        delete _auths[activeRoleId][field.id]
      }
    }

    //filterFields
    if (_filterFields[activeRoleId]) {
      const index = _filterFields[activeRoleId].indexOf(field.id)
      if (index > -1) {
        _filterFields[activeRoleId].splice(index, 1)
      }
    }

    this.setState({
      selectFields: _selectFields,
      auths: _auths,
      filterFields: _filterFields
    })
  }

  // 选择了所有的角色
  handleSelectAll(checkAll) {
    this.setState({
      selectRoleIds: checkAll ? [] : this.props.roleList.map(item => item.id)
    })
  }

  handleFolderSpread(index) {
    const spread = this.state.datasetTree[index]._spread_

    this.state.datasetTree[index]._spread_ = !spread
    this.setState({
      datasetTree: this.state.datasetTree
    })
  }

  handleSelectTree(node) {
    const { selectFields, filterFields, activeRoleId } = this.state
    const index = selectFields[activeRoleId] ? selectFields[activeRoleId].indexOf(node.id) : -1
    const filter_index = filterFields[activeRoleId] ? filterFields[activeRoleId].indexOf(node.id) : -1

    // 选择的字段
    if (index > -1) {
      selectFields[activeRoleId].splice(index, 1)
    } else {
      if (!selectFields[activeRoleId]) {
        selectFields[activeRoleId] = []
      }
      selectFields[activeRoleId].push(node.id)
    }

    // 过滤字段
    if (filter_index > -1) {
      filterFields[activeRoleId].splice(index, 1)
    } else {
      if (!filterFields[activeRoleId]) {
        filterFields[activeRoleId] = []
      }
      filterFields[activeRoleId].push(node.id)
    }

    this.setState({
      selectFields,
      filterFields
    })
  }

  handleSetAuth(field_id, auth) {
    const { auths, activeRoleId, filterFields } = this.state
    const _auths = _.cloneDeep(auths)
    const _filterFields = _.cloneDeep(filterFields)
    // 权限
    _auths[activeRoleId] = Object.assign({}, _auths[activeRoleId], auth)
    // 删除
    const visibleArr = _filterFields[activeRoleId].slice()
    if (!visibleArr) {
      _filterFields[activeRoleId] = []
    }
    const index = visibleArr.indexOf(field_id)
    // 如果存在
    if (index > -1) {
      visibleArr.splice(index, 1)
      _filterFields[activeRoleId] = visibleArr.slice()
    }
    this.setState({
      auths: _auths,
      filterFields: _filterFields
    })
  }

  handleVisible(field_id) {
    const { filterFields, activeRoleId, auths, selectFields } = this.state
    const _filterFields = _.cloneDeep(filterFields)
    const _selectFields = _.cloneDeep(selectFields)
    const _auths = _.cloneDeep(auths)
    const visibleArr = _filterFields[activeRoleId].slice()

    if (!visibleArr) {
      _filterFields[activeRoleId] = []
    }
    const index = visibleArr.indexOf(field_id)
    // 如果不存在并且是添加
    if (index === -1) {
      _filterFields[activeRoleId].push(field_id)
    }
    // 如果 auths 数据存在
    if (_auths[activeRoleId] && _auths[activeRoleId][field_id]) {
      delete _auths[activeRoleId][field_id]
    }

    this.setState({
      auths: _auths,
      filterFields: _filterFields,
      selectFields: _selectFields
    })
  }

  handleSelectRow(item) {
    // 如果 auths 中包括 item.id 存在数据
    const currAuth = this.state.auths[item.id]
    const index = this.state.selectRoleIds.indexOf(item.id)
    // 不存在的情况下。
    if (!currAuth) {
      this.state.auths[item.id] = {}
    }
    // 存在
    if (index === -1) {
      this.state.selectRoleIds.push(item.id)
    }
    this.setState({
      ...this.state,
      activeRoleId: item.id
    })
  }

  handleSelectRoleIds(option) {
    this.setState({
      selectRoleIds: option.map(item => item.value)
    })
  }

  handleCheckRole(item, e) {
    e.stopPropagation();

    let { selectRoleIds, auths, activeRoleId } = this.state
    const index = selectRoleIds.indexOf(item.id)

    // 已经存在的情况下
    if (index > -1) {
      selectRoleIds.splice(index, 1)
      // 删除权限
      delete auths[item.id]
      // 如果是正在活动的
      if (activeRoleId === item.id) {
        activeRoleId = ''
      }
    } else {
      selectRoleIds.push(item.id)
      // 如果当前没有选中的 角色
      if (!activeRoleId) {
        activeRoleId = item.id
      }
      // 权限
      Object.assign(auths, {
        [item.id]: {}
      })
    }

    this.setState({
      auths,
      selectRoleIds,
      activeRoleId
    })
  }

  handleSure() {
    const { auths, filterFields, selectRoleIds } = this.state
    const { roleList } = this.props
    // 将选中的角色 回传用于 提醒
    const selectRole = roleList.filter(item => selectRoleIds.indexOf(item.id) > -1)

    this.props.onSure(auths, filterFields, selectRole)
  }

  // 编辑的时候，初始化组件 state
  initState() {
    const { onFetchDatasetAuthFilters, node } = this.props
    // start init
    this.setState({ initing: true })
    // 获取可显示的 字段
    this.promiseFetchDataset().then(() => {
      onFetchDatasetAuthFilters({
        dataset_id: node.id
      }, (json) => {
        if (json.result) {
          let auths = this.state.auths
          const selectRoleIds = []      // 下拉列表选择的数据 [id, id]
          let selectFields = {}      // 所有已选择的字段 {key: value}
          let filterFields = {}      // 所有过滤的字段 

          json.data.forEach((item) => {
            selectRoleIds.push(item.role_id)
            // 过滤的字段 [id, id]
            const fields = {
              [item.role_id]: item.hide_field_ids
            }
            // 设置 黑名单的字段
            filterFields = Object.assign({}, filterFields, _.cloneDeep(fields))
            // 已选的字段
            selectFields = Object.assign({}, selectFields, _.cloneDeep(fields))
            // auths 初始化
            auths[item.role_id] = {}

            try {
              const filters = JSON.parse(item.dataset_filter)
              filters.forEach((filter) => {
                auths[item.role_id] = {
                  ...auths[item.role_id],
                  [filter.dataset_field_id]: filter
                }

                // 如果 item.role_id 存在
                if (selectFields[item.role_id]) {
                  const index = selectFields[item.role_id].indexOf(filter.dataset_field_id)
                  if (index === -1) {
                    selectFields[item.role_id].push(filter.dataset_field_id)
                  }
                }
              })
            } catch (error) {
              auths = this.state.auths
            }
          })

          this.setState({
            ...this.state,
            auths,
            selectRoleIds,
            filterFields,
            selectFields,
            activeRoleId: selectRoleIds[0] || ''
          })
        }
        // end initing
        this.setState({ initing: false })
      })
    })
  }

  promiseFetchDataset() {
    const { onFetchRoleList } = this.props
    return new Promise((resolve) => {
      onFetchRoleList({
        page: 1,
        page_size: 10000,
        keyword: ''
      }, (json) => {
        if (json.result) {
          resolve(json.data.items)
        } else {
          // end initing
          this.setState({ initing: false })
        }
      })
    })
  }
}

export default AuthorityDialog
