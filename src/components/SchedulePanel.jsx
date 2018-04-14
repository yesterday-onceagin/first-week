import React from 'react'
import PropTypes from 'prop-types'

import Input from 'react-bootstrap-myui/lib/Input'
import Select from 'react-bootstrap-myui/lib/Select'
import NumberInput from './NumberInput'

import { encodeCron, decodeCron } from '@helpers/cron';

import './schedule-panel.less'

const NOOP = () => {}

class SchedulePanel extends React.Component {
  static propTypes = {
    onlyCycle: PropTypes.bool,          // 是否只有周期调度
    needPoint: PropTypes.bool,          // 是否需要标点
    flowList: PropTypes.array,          // flow
    plan: PropTypes.string,             // 类型 
    data: PropTypes.string,             // 数据. 如果是表达式，则为 corn ，否则为 flow_id
    cycleTypes: PropTypes.array,        // corn 选择种类
    onGetInstance: PropTypes.func,      // 获取 实体
    status: PropTypes.string,
  };

  static defaultProps = {
    onlyCycle: false,
    needPoint: true,
    cycleTypes: ['month', 'week', 'day', 'hour', 'minute', 'second'],
    flowList: [],
    plan: 'cycle',
    data: '0 0 0 ? * * *',        // 调度周期表达式
  };

  constructor(props) {
    super(props)
    this.state = {
      status: '启用',                   // 是否启用
      plan: 'cycle',                    // 当前调度方案:  cycle -> 周期; flow -> 流程
      type: 'month',                    // 当前调度周期类型
      depend_flow_id: '',               // 依赖的流程ID
      day: [1],                         // 天
      week: [1],                        // 
      start_hour: 0,                    // 开始时间
      end_hour: 23,                     // 结束时间
      step_hour: 1,                     // 间隔时间
      hour: 0,                          // 时  (间隔)
      minute: 0,                        // 分 （间隔）
      second: 5,                        // 秒 （间隔）
    }
  }

  componentWillReceiveProps(nextProps) {
    const { plan, data, status } = this.props
    if (nextProps.plan !== plan || nextProps.data !== data || status !== nextProps.status) {
      let _data = null
      if (nextProps.plan === 'cycle') {
        _data = decodeCron(nextProps.data)
      } else {
        _data = {
          data: {
            depend_flow_id: nextProps.data
          }
        }
      }
      this.setState({
        ..._data.data,
        status: nextProps.status,
        type: _data.type,
        plan: nextProps.plan
      })
    }
  }

  componentDidMount() {
    // 初始化
    const { onGetInstance, plan, data, status } = this.props
    let _data = null

    if (plan === 'cycle') {
      _data = decodeCron(data)
    } else {
      _data = {
        data: {
          depend_flow_id: data
        }
      }
    }

    this.setState({
      ..._data.data,
      type: _data.type,
      plan,
      status
    })
    // 将当前 对象回传
    onGetInstance(this)
  }

  render() {
    const { plan, type, status, depend_flow_id } = this.state
    const { cycleTypes, flowList, onlyCycle, needPoint } = this.props

    return <div className="schedule-panel">
      {!onlyCycle &&
        <div className="row">
          <div className="col-md-2 col-label">
            开启调度 :
          </div>
          <div className="col-md-8">
            <div className="td-label" onClick={this.handleClick.bind(this, 'status', status === '禁用' ? '启用' : '禁用')}>
              <Input type="checkbox" checked={status === '启用'} onChange={NOOP}/>
            </div>
          </div>
        </div>
      }
      {
        !onlyCycle && status === '启用' &&
        <div className="row">
          <div className="col-md-2 col-label">
            调度方案 :
          </div>
          <div className="col-md-8">
            <div className="td-label" onClick={this.handleClick.bind(this, 'plan', 'cycle')}><Input type="radio" checked={plan === 'cycle'} onChange={NOOP}/> 依赖周期，定时调度</div>
            <div className="td-label" onClick={this.handleClick.bind(this, 'plan', 'flow')}><Input type="radio" checked={plan === 'flow'} onChange={NOOP}/> 依赖流程，等待上游调度结束继续运行</div>
          </div>
        </div>
      }
      {
        !onlyCycle && plan === 'flow' && status === '启用' && <div className="row">
          <div className="col-md-2 col-label">
            调度流程 :
          </div>
          <div className="col-md-8">
            <Select value={depend_flow_id} maxHeight={180} width="100%" onSelected={this.handleSelected.bind(this)}>
              {flowList.map((item, key) => <option key={key} value={item.id}>{item.name}</option>)}
            </Select>
          </div>
        </div>
      }
      {
        plan === 'cycle' && status === '启用' && <div className="row">
          <div className="col-md-2 col-label">
            调度周期 {needPoint && ':'}
          </div>
          <div className="col-md-8">
            {
              cycleTypes.map((ct, key) => (
                <div className="td-label" key={key} onClick={this.handleClick.bind(this, 'type', ct)}>
                  <Input type="radio" checked={type === ct} onChange={NOOP}/> {this.CYCLE_MAP[ct]}
                </div>
              ))
            }
          </div>
        </div>
      }
      {plan === 'cycle' && type === 'month' && status === '启用' && this.renderPerMonth()}
      {plan === 'cycle' && type === 'week' && status === '启用' && this.renderPerWeek()}
      {plan === 'cycle' && type === 'day' && status === '启用' && this.renderPerDay()}
      {plan === 'cycle' && type === 'hour' && status === '启用' && this.renderHour()}
      {plan === 'cycle' && type === 'minute' && status === '启用' && this.renderMinute()}
      {plan === 'cycle' && type === 'second' && status === '启用' && this.renderSecond()}
    </div>
  }

  // 每月
  renderPerMonth() {
    // day 转成 数字
    const day = this.state.day.map(item => +item)
    const { hour, minute } = this.state
    const days = []

    for (let i = 1; i <= 31; i++) {
      days.push((
        <span key={i}
          className={day.indexOf(i) > -1 ? 'select' : ''}
          onClick={this.handleMutiSelect.bind(this, 'day', i)}
        >
          {i}
        </span>
      ))
    }

    return [
      <div className="row" key={0}>
        <div className="col-md-2 col-label">
          选择时间 {this.props.needPoint && ':'}
        </div>
        <div className="col-md-8">
          <div className="month-wrap">
            {days}
          </div>
        </div>
      </div>,
      <div className="row" key={1}>
        <div className="col-md-2 col-label">
          执行时间 {this.props.needPoint && ':'}
        </div>
        <div className="col-md-8">
          <span className="number-input-wrap" title="小时">
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={0}
              maxValue={23}
              step={1}
              value={+hour}
              onChange={this.handleChange.bind(this, 'hour')}
            />
          </span>
          <span> : </span>
          <span className="number-input-wrap" title="分钟">
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={0}
              maxValue={59}
              step={1}
              value={+minute}
              onChange={this.handleChange.bind(this, 'minute')}
            />
          </span>
        </div>
      </div>
    ]
  }

  // 每周
  renderPerWeek() {
    const weekOpts = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const weeks = []

    let { week } = this.state
    // week 转成 数字
    week = week.map(item => +item)
    
    for (let i = 0; i < 7; i++) {
      weeks.push((
        <span key={i}
          className={week.indexOf(i + 1) > -1 ? 'select' : ''}
          onClick={this.handleMutiSelect.bind(this, 'week', i)}
        >
          {weekOpts[i]}
        </span>
      ))
    }

    return [
      <div className="row" key={0}>
        <div className="col-md-2 col-label">
          选择时间 {this.props.needPoint && ':'}
        </div>
        <div className="col-md-8">
          <div className="week-wrap">
            {weeks}
          </div>
        </div>
      </div>,
      this.renderPerMonth()[1]
    ]
  }

  // 每天
  renderPerDay() {
    return this.renderPerMonth()[1]
  }

  // 小时
  renderHour() {
    const { start_hour, end_hour, step_hour } = this.state

    if (+step_hour < 1) {
      this.state.step_hour = 1
    }

    return [
      <div className="row" key={0}>
        <div className="col-md-2 col-label">
          开始时间 {this.props.needPoint && ':'}
        </div>
        <div className="col-md-8">
          <span className="number-input-wrap" title="小时">
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={0}
              maxValue={+(end_hour - step_hour)}
              step={1}
              value={+start_hour}
              onChange={this.handleChange.bind(this, 'start_hour')}
            />
          </span>
          <span> 时 00 分</span>
        </div>
      </div>,
      <div className="row" key={1}>
        <div className="col-md-2 col-label">
          间隔时间 {this.props.needPoint && ':'}
        </div>
        <div className="col-md-8">
          <span className="number-input-wrap" title="小时">
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={1}
              maxValue={+(end_hour - start_hour)}
              step={1}
              value={+step_hour}
              onChange={this.handleChange.bind(this, 'step_hour')}
            />
          </span>
          <span> 小时</span>
        </div>
      </div>,
      <div className="row" key={2}>
        <div className="col-md-2 col-label">
          结束时间 {this.props.needPoint && ':'}
        </div>
        <div className="col-md-8">
          <span className="number-input-wrap" title="小时">
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={(+start_hour) + (+step_hour)}
              maxValue={23}
              step={1}
              value={+end_hour}
              onChange={this.handleChange.bind(this, 'end_hour')}
            />
          </span>
          <span> 时 00 分</span>
        </div>
      </div>
    ]
  }

  // 分钟
  renderMinute() {
    const { minute } = this.state

    if (+minute < 1) {
      this.state.minute = 1
    }

    return <div className="row" key={0}>
      <div className="col-md-2 col-label">
        间隔时间 {this.props.needPoint && ':'}
      </div>
      <div className="col-md-8">
        <span className="number-input-wrap" title="分钟">
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={1}
            maxValue={59}
            step={1}
            value={+minute}
            onChange={this.handleChange.bind(this, 'minute')}
          />
        </span>
        <span> 分钟</span>
      </div>
    </div>
  }

  // 秒
  renderSecond() {
    const { second } = this.state

    if (+second < 5) {
      this.state.second = 5
    }

    return <div className="row" key={0}>
      <div className="col-md-2 col-label">
        间隔时间 {this.props.needPoint && ':'}
      </div>
      <div className="col-md-8">
        <span className="number-input-wrap" title="秒">
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={5}
            maxValue={59}
            step={1}
            value={+second}
            onChange={this.handleChange.bind(this, 'second')}
          />
        </span>
        <span> 秒</span>
      </div>
    </div>
  }

  // 多选日期
  handleMutiSelect(field, i) {
    // 如果是周期. 希望是从1开始
    i = field === 'week' ? i + 1 : i
    let value = this.state[field]
    // 转成纯数字
    value = value.map(item => +item)

    if (value.indexOf(i) > -1) {
      if (value.length > 1) {
        const currIndex = value.findIndex(d => d === i)
        value.splice(currIndex, 1)
      }
    } else {
      value.push(i)
    }

    this.setState({
      [field]: value
    })
  }

  handleSelected(option) {
    this.setState({
      depend_flow_id: option.value
    })
  }

  handleClick(field, value) {
    let newstate = this.state

    if (field === 'type') {
      newstate = {
        day: [1],                         // 天
        week: [1],                        // 
        start_hour: 0,                    // 开始时间
        end_hour: 23,                     // 结束时间
        hour: 0,                          // 时  (间隔)
        minute: 0,                        // 分 （间隔）
        second: 0,                        // 秒 （间隔）  
      }
    }

    this.setState({
      ...newstate,
      [field]: value
    })
  }

  handleChange(field, value) {
    this.setState({
      [field]: +value
    })
  }

  // 返回当前数据
  getData() {
    const { plan, type, depend_flow_id, status } = this.state
    return plan === 'flow' ? {
      status,
      plan,
      depend_flow_id
    } : {
      status,
      plan,
      schedule: encodeCron(type, this.state)
    }
  }

  CYCLE_MAP = {
    month: '每月',
    week: '每周',
    day: '每天',
    hour: '小时',
    minute: '分钟',
    second: '秒'
  }
}

export default SchedulePanel
