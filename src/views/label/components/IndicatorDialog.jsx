import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';

import DropdownButton from 'react-bootstrap-myui/lib/DropdownButton';
import MenuItem from 'react-bootstrap-myui/lib/MenuItem';
import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Panel from 'react-bootstrap-myui/lib/Panel';
import Loading from 'react-bootstrap-myui/lib/Loading';
import { Tree } from 'rt-tree';

import SelectionButton from '../../../components/SelectionButton';
import DateSelection from './DateSelection';
import MapSelection from './MapSelection';
import NumberSelection from './NumberSelection';
import DimSelection from './DimSelection';
import DescribeSelection from './DescribeSelection';

import TipMixin from '../../../helpers/TipMixin';
import TreeHelpers from '../../../helpers/tree';

import 'rt-tree/dist/css/rt-select.css';
import './indicator-dialog.less';

const IndicatorDialog = createReactClass({
  displayName: 'IndicatorDialog',
  mixins: [TipMixin],

  propTypes: {
    show: PropTypes.bool,
    info: PropTypes.object,
    data: PropTypes.array,
    onSure: PropTypes.func,
    onClose: PropTypes.func,
    editable: PropTypes.bool,
    type: PropTypes.string
  },

  getInitialState() {
    return {
      INDICATOR_TYPES: ['日期', '数值', '维度', '描述', '地址'],
      data: [],
      type: this.DEFAULT_TYPE,
      filterValue: '',
      info: null,
      component: null, // 不同类型面板的直接数据存储对象
      indicators: null, // 对于单一指标操作的时候（地址类，时间类，描述类）
      indicators_arr: [] // 对于 描述类 和 维度类的指标 （可以同时编辑多个）
    }
  },

  componentDidMount() {
    const { data, info, editable } = this.props;
    const type = this.props.type || this.DEFAULT_TYPE
    // 如果是 地图 + 日期
    if (info) {
      if (['地址', '日期'].indexOf(type) > -1) {
        const { indicators, ...others } = info
        this.state.info = others
        this.state.indicators = indicators
      } else if (['描述', '维度'].indexOf(type) > -1) {
        const start = info.index ? info.index : 0
        this.state.indicators_arr = editable ? info.info.slice(start, start + 1) : info.info.slice()
      } else if (type === '数值') {
        this.state.indicators_arr = info.info.slice()
      }
    }

    this.setState({
      ...this.state,
      type,
      data: data && data[type] ? data[type] : []
    })
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps) {
      const type = nextProps.type || this.DEFAULT_TYPE

      if (nextProps.info) {
        if (['地址', '日期'].indexOf(type) > -1) {
          const { indicators, ...others } = nextProps.info
          this.state.info = others
          this.state.indicators = indicators
        } else if (['描述', '维度'].indexOf(type) > -1) {
          const start = nextProps.info.index ? nextProps.info.index : 0
          this.state.indicators_arr = nextProps.editable ? nextProps.info.info.slice(start, start + 1) : nextProps.info.info.slice()
        } else if (type === '数值') {
          this.state.indicators_arr = nextProps.info.info.slice()
        }
      }

      this.setState({
        ...this.state,
        type,
        data: nextProps.data[type]
      })
    }
  },

  render() {
    const { show, onClose, pending } = this.props
    const { type, filterValue, data, INDICATOR_TYPES } = this.state

    const header = (
      <div>
        <DropdownButton title={type}>
          {
            INDICATOR_TYPES.map((item, i) => (
              <MenuItem
                key={`menu-item-${i}`}
                eventKey={i}
                onClick={this.handleSwitchType.bind(this, item)}
              >
                {item}
              </MenuItem>
            ))
          }
        </DropdownButton>
        <div className="form pull-right">
          <Input
            type="text"
            value={filterValue}
            placeholder="请输入关键字"
            addonAfter={<i className="dmpicon-search" />}
            onChange={this.handleFilterMenus}
          />
        </div>
      </div>
    )

    // 如果是维度类型，则过滤掉
    let _data = data

    if (type === '维度') {
      _data = []
      data.forEach((item) => {
        const _item = {
          ...item,
          indicator: []
        }
        item.indicator && item.indicator.forEach((inc) => {
          if (inc.dimension && inc.dimension.length > 0) {
            _item.indicator.push(inc)
          }
        })
        if (_item.indicator.length > 0) {
          _data.push(_item)
        }
      })
    }

    return (
      <Dialog
        show={show}
        onHide={onClose}
        backdrop="static"
        size={{ width: '700px', height: '510px' }}
        className="higher-indicator-select-dialog"
      >
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
                      _data && _data.length > 0 ? (
                        <Tree
                          key={new Date().getTime()}
                          bordered={false}
                          expandAll
                          data={_data || []}
                          onSelect={this.handleSelectTree}
                          onChange={this.handleChangeTree}
                        />
                      ) : <div className="nothing">暂无数据！</div>
                    }
                    <Loading show={pending} containerId="indicator-select-tree-wrap" />
                  </div>
                </div>
              </Panel>
            </div>
            {this.renderRightArea()}
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSure}>确定</Button>
          <Button bsStyle="default" onClick={onClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    )
  },

  renderRightArea() {
    const { info, indicators, type, indicators_arr } = this.state

    let Element = (
      <div className="nothing">
        <i className="dmpicon-help" /> 提示：请在左侧添加条件
      </div>
    )

    const header = (
      <div className="">
        <span>
          筛选条件
          {
            ['描述', '维度'].indexOf(type) > -1 && this.props.editable && (
              <span>（<span style={{ color: '#f30' }}>编辑模式下，只能操作单个指标</span>）</span>
            )
          }
        </span>
        {
          ['时间', '日期', '地址'].indexOf(type) > -1 && indicators && (
            <div className="pull-right" style={{ marginTop: '-8px' }}>
              <SelectionButton selected onClick={this.handleClearIndicator}>
                {indicators.name}
              </SelectionButton>
            </div>
          )
        }
      </div>
    )

    if (!!indicators || indicators_arr.length > 0) {
      switch (type) {
        case '日期':
          Element = <DateSelection info={info} getComponent={this.handleGetComponent} onChange={this.handleChange} />;
          break;
        case '地址':
          Element = <MapSelection info={info} getComponent={this.handleGetComponent} />;
          break;
        case '数值':
          Element = <NumberSelection info={indicators_arr} getComponent={this.handleGetComponent} onChange={this.handleChange} />;
          break;
        case '维度':
          Element = <DimSelection info={indicators_arr} getComponent={this.handleGetComponent} onChange={this.handleChange} />;
          break;
        case '描述':
          Element = <DescribeSelection info={indicators_arr} getComponent={this.handleGetComponent} onChange={this.handleChange} />;
          break;
        default:
          break;
      }
    }

    return (
      <div className="right">
        <Panel header={header}>
          {Element}
        </Panel>
      </div>
    )
  },

  handleClearIndicator() {
    this.setState({
      indicators: null
    })
  },

  handleChange(arr) {
    if (['日期', '地址'].indexOf(this.state.type) > -1) {
      this.state.info = arr
    } else {
      this.state.indicators_arr = arr.slice()
    }
    this.setState({ ...this.state })
  },

  // 同步。但不更新，避免触发子组件更新
  handleGetComponent(component) {
    this.state.component = component
  },

  handleFilterMenus(e) {
    const value = e.target.value
    this.setState({
      filterValue: value
    }, () => {
      const { type } = this.state
      const _data = TreeHelpers.filterTreeDatas(value, this.props.data[type])
      this.setState({
        data: _data.data
      })
    })
  },

  handleSwitchType(_type) {
    // 切换的是，清空上次的指标选择
    this.setState({
      type: _type,
      indicators: null,
      indicators_arr: [],
      filterValue: ''
    }, () => {
      const { type, filterValue } = this.state
      const _data = TreeHelpers.filterTreeDatas(filterValue, this.props.data[type])
      this.setState({
        data: _data.data
      })
    })
  },

  handleChangeTree(value, options) {
    const data = {
      ...options[0],
      operator: '',
      value: ''
    }
    // this.state.type = ['时间','日期', '地址']
    if (['时间', '日期', '地址'].indexOf(this.state.type) > -1) {
      this.state.indicators = data
    } else if (this.state.type === '数值') {
      this.state.indicators_arr.push(data)
    } else if (this.props.editable) {
      // 如果是编辑
      this.state.indicators_arr = [data]
    } else {
      this.state.indicators_arr.push(data)
    }
    this.setState({ ...this.state })
  },

  handleSelectTree(select, value, options) {
    if (options.children && options.children.length > 0) {
      return false
    }
    return true
  },

  handleSure() {
    const { type, component, indicators } = this.state
    if (component) {
      if (this.checkState()) {
        this.props.onSure(type, Object.assign({ indicators }, component.state))
      }
    } else {
      this.props.onClose()
    }
  },

  // 检查数据是否完整
  // ['日期','数值','维度', '描述','地址']
  checkState() {
    const { type, component } = this.state

    let booleanState = true;
    let errorMsg = ''

    const state = component.state

    switch (type) {
      case '日期': {
        if (state.mode === 1 && !state.date) {
          booleanState = false
          errorMsg = '请选择日期！'
        } else if (+state.mode === 2 && !state.start_date && !state.end_date) {
          booleanState = false
          errorMsg = '请选择日期段！'
        } else if (+state.mode === 3 && !(state.step_date !== '' && +state.step_date >= 0)) {
          booleanState = false
          errorMsg = '请填写距今日有效间隔！'
        }
        break
      }
      case '数值': {
        for (let i = state.info.length - 1; i >= 0; i--) {
          if (state.info[i].type === 'input' && !state.info[i].value) {
            booleanState = false
            errorMsg = '输入框的值不能为空！'
            break
          }
        }
        break
      }
      case '维度':
      case '描述': {
        for (let i = state.info.length - 1; i >= 0; i--) {
          booleanState = state.info[i].value && state.info[i].operator
          if (!booleanState) {
            errorMsg = '筛选条件不能为空！'
            break
          }
        }
        break
      }
      default:
        break
    }

    if (!booleanState) {
      this.showErr(errorMsg)
      return false
    }
    return booleanState
  },

  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    })
  },

  DEFAULT_TYPE: '日期',
})

export default IndicatorDialog;
