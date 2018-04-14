import React from 'react';
import PropTypes from 'prop-types'
import Button from 'react-bootstrap-myui/lib/Button';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Select from 'react-bootstrap-myui/lib/Select';
import Input from 'react-bootstrap-myui/lib/Input';
import _ from 'lodash';
import { RESERVE_OPTION_MAPS } from '../constants/incOption';
import './mark-line-dialog.less';

class MarkLineDialog extends React.Component {
  static propTypes = {
    // 显示
    show: PropTypes.bool,
    // 确定
    onSure: PropTypes.func,
    // 关闭
    onClose: PropTypes.func,
    // 下拉列表
    select_list: PropTypes.array,
    // 默认数据
    data: PropTypes.array,
    // 出错提示
    showErr: PropTypes.func,

    chartCode: PropTypes.string,

    field: PropTypes.string
  };

  constructor(props) {
    super(props)
    // 堆叠图类型
    this.DEFAULT_STACK_CODE = ['stack_line', 'stack_area', 'stack_bar', 'horizon_stack_bar']
    // 模式
    this.DEFAULT_MODE = this.DEFAULT_STACK_CODE.indexOf(props.chartCode) > -1 ? ['固定值'] : ['固定值', '计算值']

    this.state = {
      mode_list: this.DEFAULT_MODE,
      calc_list: [{
        value: 'avg',
        text: '平均值'
      }, {
        value: 'max',
        text: '最大值'
      }, {
        value: 'min',
        text: '最小值'
      }],
      data: [{
        name: '辅助线(1)',
        mode: '固定值',
        value: '',  // mode 为固定值生效
        num: '',    // mode 为计算值生效
        formula_mode: '',
      }]
    }
  }

  componentDidMount() {
    if (Array.isArray(this.props.data)) {
      this.setState({
        data: this.props.data.slice().map(item => Object.assign({}, item))  // 避免直接引用
      })
    }
  }

  render() {
    const { show, onClose } = this.props;
    return (
      show && <Dialog
        show={show}
        onHide={onClose}
        backdrop="static"
        size={{ width: '470px' }}
        className="markline-dialog">
        <Dialog.Header closeButton>
          <Dialog.Title>添加辅助线</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="markline-container">
            <div className="title">辅助线设置 <i className="dmpicon-add" onClick={this.handleAddRow.bind(this)}></i></div>
            {this.state.data.length > 0 ? this.renderRow() : <div className="tip">
              <span>你当前还没有横向辅助线</span>
              <span onClick={this.handleAddRow.bind(this)}>点击添加</span>
            </div>}
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSure.bind(this)}>确定</Button>
          <Button bsStyle="default" onClick={onClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    )
  }

  renderRow() {
    const { data, mode_list, calc_list } = this.state
    const { select_list, field } = this.props
    let selectData = _.cloneDeep(select_list)
    if (this.props.chartCode === 'double_axis') {
      selectData = field === 'z' ? select_list.slice(1, 2) : select_list.slice(0, 1)
    }
    // 固定值
    const fiexed_row = (item, index) => (
      <li key={index}>
        <div className="col">
          <Input type="text" value={item.name} placeholder="名称" onChange={this.handleChange.bind(this, index, 'name')} style={{ width: '90px' }} />
        </div>
        <div className="col">
          <Select
            value={item.mode}
            style={{ width: '85px' }}
            maxHeight={180}
            fixContainer={this}
            onSelected={this.handleSelect.bind(this, index, 'mode')}
          >
            {mode_list.map((mode, key) => <option key={key} value={mode}>{mode}</option>)}
          </Select>
        </div>
        <div className="col">
          <Input type="text" value={item.value} onChange={this.handleChange.bind(this, index, 'value')} style={{ width: '188px' }} />
        </div>
        <div className="col opreator">
          <i className="dmpicon-del" onClick={this.handleDelRow.bind(this, index)} />
        </div>
      </li>
    )

    // 计算值
    const calc_row = (item, index) => (
      <li>
        <div className="col">
          <Input type="text" value={item.name} placeholder="名称" onChange={this.handleChange.bind(this, index, 'name')} style={{ width: '90px' }} />
        </div>
        <div className="col">
          <Select
            value={item.mode}
            style={{ width: '85px' }}
            maxHeight={180}
            fixContainer={this}
            onSelected={this.handleSelect.bind(this, index, 'mode')}
          >
            {mode_list.map(mode => <option value={mode}>{mode}</option>)}
          </Select>
        </div>
        <div className="col">
          <Select
            value={item.num}
            style={{ width: '93px' }}
            maxHeight={180}
            fixContainer={this}
            onSelected={this.handleSelect.bind(this, index, 'num')}
          >
            {selectData.map(num => <option value={num.num}>
              {num.formula_mode ? `${num.alias_name || num.col_name}(${RESERVE_OPTION_MAPS[num.formula_mode]})` : `${num.alias_name || num.col_name}`}
            </option>)}
          </Select>
        </div>
        <div className="col">
          <Select
            value={item.formula_mode}
            style={{ width: '85px' }}
            maxHeight={180}
            fixContainer={this}
            onSelected={this.handleSelect.bind(this, index, 'formula_mode')}
          >
            {calc_list.map(calc => <option value={calc.value}>{calc.text}</option>)}
          </Select>
        </div>
        <div className="col opreator">
          <i className="dmpicon-del" onClick={this.handleDelRow.bind(this, index)} />
        </div>
      </li>
    )

    return <ul className="form">{data.map((item, index) => (item.mode === '固定值' ? fiexed_row(item, index) : calc_row(item, index)))}</ul>
  }

  handleChange(rowIndex, field, e) {
    this.state.data[rowIndex][field] = e.target.value
    this.setState({ ...this.state })
  }

  handleSelect(rowIndex, _field, value) {
    this.state.data[rowIndex][_field] = value.value
    // 如果 _field 为 mode, 且为计算值的时候，应该默认 calc 为 第一项. 同事设置 num 为默认的第一项
    if (_field === 'mode' && value.value === '计算值') {
      const { select_list, field } = this.props
      let selectData = _.cloneDeep(select_list)
      if (this.props.chartCode === 'double_axis') {
        selectData = field === 'z' ? select_list.slice(1, 2) : select_list.slice(0, 1)
      }
      this.state.data[rowIndex].num = selectData[0].num
      this.state.data[rowIndex].formula_mode = this.state.calc_list[0].value
    }

    this.setState({ ...this.state })
  }

  handleAddRow() {
    const default_name = this.createDefaultName()
    this.state.data.push({
      name: default_name,
      mode: '固定值',
      value: '', // mode 为固定值生效
      num: '', // mode 为计算值生效
      // formula_mode_num: '',    // mode 为计算值生效
      formula_mode: ''
    })
    this.setState({ ...this.state })
  }

  handleDelRow(index) {
    this.state.data.splice(index, 1)
    this.setState({ ...this.state })
  }

  // 
  handleSure() {
    if (this.checkDataValid()) {
      const data = this.state.data.slice()
      this.props.onSure && this.props.onSure(data)
    }
  }

  createDefaultName(no) {
    no = no || this.state.data.length + 1
    const name = `辅助线(${no})`
    const index = this.state.data.findIndex(item => item.name == name)
    if (index > -1) {
      return this.createDefaultName(no + 1)
    }
    return name
  }

  // 验证
  checkDataValid() {
    // 1、name 值不能为空
    // 2、固定值的情况下. value 不能为空
    const reg = /^(\-|\+)?\d+(\.\d+)?$/;
    let valid = true;

    this.state.data.forEach((item) => {
      if (!item.name) {
        valid = false;
        return this.props.showErr('名称不能为空')
      } else if (item.mode === '固定值' && (!item.value || !reg.test(item.value))) {
        valid = false;
        return this.props.showErr('固定值类型辅助线必须填写一个数值')
      }
    })

    // 名字是否相同
    const names = this.state.data.map(data => data.name)
    const remdub = Array.from(new Set(names))

    if (remdub.length !== this.state.data.length) {
      valid = false;
      return this.props.showErr('名称存在重复')
    }
    return valid;
  }
}

export default MarkLineDialog;
