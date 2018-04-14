import React from 'react'
import PropTypes from 'prop-types'
import DropdownButton from 'react-bootstrap-myui/lib/DropdownButton';
import MenuItem from 'react-bootstrap-myui/lib/MenuItem';
import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Panel from 'react-bootstrap-myui/lib/Panel';
import Loading from 'react-bootstrap-myui/lib/Loading';
import SelectionButton from './SelectionButton';
import TreeHelpers from '../helpers/tree';
import { Tree } from 'rt-tree';
import 'rt-tree/dist/css/rt-select.css';
import './indicator-dialog.less';

class IndicatorDialog extends React.Component {
  static propTypes = {
    /**
     * 显示
     * bool
     */
    show: PropTypes.bool,
    /**
     * 加载状态
     * bool
     */
    pending: PropTypes.bool,
    /**
     * info 默认显示指标
     * @type {object}
     */
    info: PropTypes.object,
    /**
     * 指标数据
     * array
     */
    data: PropTypes.object,
    /**
     * 确定
     * function
     */
    onSure: PropTypes.func,
    /**
     * 关闭
     * function
     */
    onClose: PropTypes.func,
    /**
     * 单选模式
     * @type {bool}
     */
    single: PropTypes.bool,
    /**
     * 类型
     * @type {string}
     */
    type: PropTypes.oneOf(['数值', '维度', '地址']),
    /**
     * 最多能选择多少个
     * @type {number}
     */
    maxSize: PropTypes.number,
    className: PropTypes.string
  };

  static defaultProps = {
    single: false,
    className: ''
  };

  constructor(props) {
    super(props)
    this.state = {
      default_formula_mode: 'sum', // 默认为 求和
      default_formula_mode_dim: 'count', // 计数
      active: props.type,
      filterValue: '',
      data: [],
      indicator: [{
        id: '',  // 指标id
        type: '', // 指标类型
        name: '', // 指标名
        alias: '', // 指标别名
        formula_mode: '', // 指标的操作
        odps_field: '',
        odps_table: '',
        rank: ''
      }]
    }
  }

  componentDidMount() {
    const { info, type, data } = this.props;
    this.setState({
      active: type,
      indicator: [].concat(info),
      data: data && data[type] ? data[type] : []
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps && nextProps.data) {
      this.setState({
        active: nextProps.type,
        data: nextProps.data[nextProps.type]
      })
    }
  }

  render() {
    const { show, pending, onClose, type, single, className } = this.props
    const { indicator, active, filterValue, data } = this.state

    const header = <div>
      {
        type === '数值' ? (
          <DropdownButton title={active}>
            <MenuItem eventKey="1" onClick={this.handleSwitchType.bind(this, '数值')}>数值</MenuItem>
            <MenuItem eventKey="2" onClick={this.handleSwitchType.bind(this, '维度')}>维度</MenuItem>
          </DropdownButton>
        ) : active
      }
      <div className="form pull-right">
        <Input
          type="text"
          value={filterValue}
          placeholder="请输入关键字"
          addonAfter={<i className="dmpicon-search"/>}
          onChange={this.handleFilterMenus.bind(this)}
        />
      </div>
    </div>

    return (
      show && <Dialog
        show={show}
        onHide={onClose}
        backdrop="static"
        size={{ width: '700px', height: '510px' }}
        className={`${className} indicator-select-dialog`}>
        <Dialog.Header closeButton>
          <Dialog.Title>选择指标</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="indicator-select-dialog-wrapper">
            <div className="left">
              <Panel header={header}>
                <div className="tree-wrap">
                  <div className="tree-inner-wrap" id="indicator-select-tree-wrap">
                    {
                      data && data.length > 0 ?
                        <Tree
                          key={new Date().getTime()}
                          bordered={false}
                          expandAll
                          data={data || []}
                          selected={single && indicator[0] ? indicator[0].id : []}
                          onSelect={this.handleSelectTree.bind(this)}
                          onChange={this.handleChangeTree.bind(this)}
                        /> : <div className="nothing">暂无数据！</div>
                    }
                    <Loading show={pending} containerId="indicator-select-tree-wrap"/>
                  </div>
                </div>
              </Panel>
            </div>

            {this.renderRightArea()}
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSure.bind(this)}>确定</Button>
          <Button bsStyle="default" onClick={onClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    )
  }

  renderRightArea() {
    const { maxSize } = this.props
    const { indicator } = this.state
    return (
      <div className="right">
        <Panel header={maxSize ? `已选指标（最多可选择 ${maxSize} 个）` : '已选指标'}>
          <div className="result-body">
            {
              indicator && indicator.map((item, key) => (
                <SelectionButton key={key} selected onClick={this.handleSelectIndicator.bind(this, key)}>
                  {item.name}
                </SelectionButton>
              ))
            }
          </div>
        </Panel>
      </div>
    )
  }

  handleFilterMenus(e) {
    const value = e.target.value
    this.setState({
      filterValue: value
    }, () => {
      const { active } = this.state
      const _data = TreeHelpers.filterTreeDatas(value, this.props.data[active])
      this.setState({
        data: _data.data
      })
    })
  }

  handleSwitchType(type) {
    this.setState({
      active: type
    }, () => {
      const { active, filterValue } = this.state
      const _data = TreeHelpers.filterTreeDatas(filterValue, this.props.data[active])
      this.setState({
        data: _data.data
      })
    })
  }

  handleChangeTree(value, options) {
    const { single, type, maxSize } = this.props
    const { indicator, default_formula_mode, default_formula_mode_dim, active } = this.state
    let _indicator = indicator

    const getItem = () => {
      const __indicator = {
        ...options[0],
        alias: '',
      }

      if (type === '数值') {
        const formula_mode = active === '维度' ? default_formula_mode_dim : default_formula_mode
        Object.assign(__indicator, { formula_mode })
        if (active === '维度') {
          Object.assign(__indicator, { type: '维度' })
        }
      }

      return __indicator
    }

    // 单选
    if (single) {
      _indicator = [getItem()]
    } else if (!maxSize || _indicator.length < maxSize) {
      // 如果存在 maxsize 则小于maxsize, 或者不存在maxsize
      const index = indicator.findIndex(item => item.id === value[0])
      if (index === -1) {
        _indicator.push(getItem())
      }
    }
    this.setState({
      indicator: _indicator
    })
  }

  handleSelectTree(select, value, options) {
    if (options.children && options.children.length > 0) {
      return false
    }
  }

  handleSelectIndicator(key) {
    const { indicator } = this.state

    indicator.splice(key, 1)

    this.setState({
      indicator
    })
  }

  handleSure() {
    const { onSure } = this.props
    const { indicator } = this.state

    onSure && onSure(indicator)
  }
}

export default IndicatorDialog;
