import React from 'react'
import PropTypes from 'prop-types'
import Row from 'react-bootstrap-myui/lib/Row';
import Col from 'react-bootstrap-myui/lib/Col';
import Input from 'react-bootstrap-myui/lib/Input';
import Select from 'react-bootstrap-myui/lib/Select';
import NumberInput from '../components/NumberInput'
import SelectionButton from './SelectionButton';
import isEqual from 'lodash/isEqual';

import './groups-form.less';

class GroupsFormRow extends React.Component {
  static propTypes = {
    /**
     * 类型
     * @type {[type]}
     */
    type: PropTypes.oneOf(['dateRange', 'day', 'weekday', 'hour', 'minute', 'time', 'radios', 'second']),
    /*
     * 样式
     * @type {[type]}
     */
    style: PropTypes.object,
    /**
     * 映射的属性名
     * @type {[type]}
     */
    field: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    /**
     * 列名
     * @type {[type]}
     */
    text: PropTypes.string,
    /**
     * select 后缀
     * @type {String}
     */
    suffix: PropTypes.string,
    /**
     * 间隔
     * @type {[type]}
     */
    step: PropTypes.number,
    /**
     * 是否禁用
     * @type {[type]}
     */
    disabled: PropTypes.oneOfType([PropTypes.array, PropTypes.number]),
    /**
     * 时间范围选择是否出现复选框
     * @type {[type]}
     */
    checkable: PropTypes.bool,
    /**
     * 默认数据
     * @type {[type]}
     */
    defaultData: PropTypes.object,
    /**
     * 获取数据
     * @type {[type]}
     */
    onGetValues: PropTypes.func
  };

  constructor(props) {
    super(props)

    this.state = {
      noEndDate: false,
      weekDaysDatas: {
        2: '周一',
        3: '周二',
        4: '周三',
        5: '周四',
        6: '周五',
        7: '周六',
        1: '周日'
      },
      info: {}
    }
  }

  componentDidMount() {
    const { defaultData } = this.props
    if (defaultData) {
      this.setState({
        info: Object.assign(this.state.info, defaultData)
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    const { defaultData } = this.props
    if (nextProps.defaultData && !isEqual(defaultData, nextProps.defaultData)) {
      this.setState({
        info: {
          ...this.state.info,
          ...nextProps.defaultData
        }
      })
    }
  }

  render() {
    const { type } = this.props
    switch (type) {
      // case 'dateRange': return this.render_dateRange();
      case 'day': return this.render_day();
      case 'weekday': return this.render_weekey();
      case 'hour': return this.render_hour();
      case 'minute': return this.render_minute();
      case 'second': return this.render_second();
      case 'time': return this.render_time();
      case 'radios': return this.render_radio();
      default: return null;
    }
  }

  render_day() {
    const { info } = this.state
    const { field, text, suffix } = this.props
    return (
      <Row>
        <Col xs={2} className="control-label">{text}</Col>
        <Col xs={10}>
          <Select type="multiple" value={info[field]} maxHeight={200} width={207} openSearch hasIcon showMultipleBar={false} onSelected={this.handleDay.bind(this, field)}>
            {this.forInRenderSelect(1, 32, suffix)}
          </Select>
        </Col>
      </Row>
    )
  }

  render_weekey() {
    const { weekDaysDatas, info } = this.state;
    const { field, text } = this.props;
    const values = info[field] || [];

    return (
      <Row>
        <Col xs={2} className="control-label">{text}</Col>
        <Col xs={10}>
          {
            Object.keys(weekDaysDatas).map((item, key) => <SelectionButton key={key} selected={values.indexOf(item) > -1} onClick={this.handleWeekDay.bind(this, field, item)}>{weekDaysDatas[item]}</SelectionButton>)
          }
        </Col>
      </Row>
    )
  }

  render_hour() {
    const { info } = this.state
    const { field, text } = this.props
    return (
      <Row>
        <Col xs={2} className="control-label">{text}</Col>
        <Col xs={10}>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={0}
            maxValue={59}
            step={1}
            value={+info[field]}
            onChange={this.handleNumberInput.bind(this, field)}
          />
        </Col>
      </Row>
    )
  }

  render_minute() {
    const { info } = this.state
    const { field, text } = this.props

    return (
      <Row>
        <Col xs={2} className="control-label">{text}</Col>
        <Col xs={10}>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={0}
            maxValue={59}
            step={1}
            value={+info[field]}
            onChange={this.handleNumberInput.bind(this, field)}
          />
        </Col>
      </Row>
    )
  }

  render_time() {
    const { info } = this.state
    const { field, text, onlyHour } = this.props
    const style = {
      border: '0 none',
      background: 'transparent',
      display: 'inline-block',
      lineHeight: '31px',
      height: '32px',
      width: '40px',
      textAlign: 'center',
      verticalAlign: 'middle'
    }
    return (
      onlyHour ? <Row>
        <Col xs={2} className="control-label">{text}</Col>
        <Col xs={10}>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={0}
            style={{ width: '80px' }}
            maxValue={23}
            step={1}
            value={+info[field[0]]}
            onChange={this.handleNumberInput.bind(this, field[0])}
          />
          <span style={{ padding: '0 3px' }}> 时 </span>
          <span style={style}>00</span>
          <span style={{ padding: '0 3px' }}> 分 </span>
        </Col>
      </Row> : <Row>
        <Col xs={2} className="control-label">{text}</Col>
        <Col xs={10}>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            style={{ width: '80px' }}
            minValue={0}
            maxValue={23}
            step={1}
            value={+info[field[0]]}
            onChange={this.handleNumberInput.bind(this, field[0])}
          />
          <span style={{ padding: '0 3px' }}> 时 </span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            style={{ width: '80px' }}
            minValue={0}
            maxValue={59}
            step={1}
            value={+info[field[1]]}
            onChange={this.handleNumberInput.bind(this, field[1])}
          />
          <span style={{ padding: '0 3px' }}> 分 </span>
        </Col>
      </Row>
    )
  }

  render_radio() {
    const { info } = this.state
    const { field, text } = this.props
    return (
      <Row>
        <Col xs={2} className="control-label">{text}</Col>
        <Col xs={10} className="inline-row">
          <Input type="radio" value="0" checked={+info[field] === 1} onChange={this.handleExcute.bind(this, field, 1)} label="是" />
          <Input type="radio" value="1" checked={+info[field] === 0} onChange={this.handleExcute.bind(this, field, 0)} label="否" />
        </Col>
      </Row>
    )
  }

  render_second() {
    const { info } = this.state
    const { field, text, range } = this.props

    return (
      <Row>
        <Col xs={2} className="control-label">{text}</Col>
        <Col xs={10}>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={range.min || 0}
            maxValue={range.max || 59}
            step={1}
            value={+info[field]}
            onChange={this.handleExcute.bind(this, field)}
          />
        </Col>
      </Row>
    )
  }

  // 设置 radios
  handleExcute(field, value) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: typeof value === 'object'  ? value.target.value : value
      }
    }, () => {
      this.props.onGetValues(this.state.info)
    })
  }

  // 设置单选
  handleSingeSelect(field, options) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: options.value
      }
    }, () => {
      this.props.onGetValues(this.state.info)
    })
  }

  handleNumberInput(field, value) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: value
      }
    }, () => {
      this.props.onGetValues(this.state.info)
    })
  }

  // 设置 天
  handleDay(field, options) {
    const data = this.state.info[field]
    const values = options.map(item => item.value)

    this.setState({
      info: {
        ...this.state.info,
        [field]: values.length === 0 ? data : values
      }
    }, () => {
      this.props.onGetValues({
        [field]: values.length === 0 ? data : values
      })
    })
  }
  // 设置 周
  handleWeekDay(field, key) {
    const data = this.state.info[field]
    const index = data.indexOf(key)
    let values = []
    index > -1 ? (data.length === 1 ? (values = data) : (data.splice(index, 1))) : (data.push(key))
    values = data
    this.setState({
      info: {
        ...this.state.info,
        [field]: values
      }
    }, () => {
      this.props.onGetValues({ [field]: values })
    })
  }
  // 设置时间
  handeleDate(field, e, picker) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: picker.startDate.format('YYYY-MM-DD')
      }
    }, () => {
      this.props.onGetValues(this.state.info)
    })
  }

  handleCheckNoEndDate() {
    this.setState({
      noEndDate: !this.state.noEndDate
    })
  }

  forInRenderSelect(start, end, sus, reg, step = 1) {
    const renderContainers = []
    for (let i = start; i < end / step; i++) {
      let option
      if (sus) {
        option = +step > 1
          ? <option value={`${i * step}`} key={i}>{`${i * step}${sus}`}</option>
          : <option value={`${i}`} key={i}>{`${i}${sus}`}</option>
      } else if (reg) {
        option = <option value={`${i}`} key={i}>{i < 10 ? `0${i}` : i}</option>
      }
      renderContainers.push(option)
    }
    return renderContainers
  }
}


class GroupsForm extends React.Component {
  static propTypes = {
    uuid: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]),
    /**
     * rows. 定义渲染的
     * @type {[type]}
     */
    type: PropTypes.oneOf(['day', 'week', 'month', 'hour', 'minute', 'second']),
    /**
     * 默认值
     * @type {[type]}
     */
    defaultDatas: PropTypes.object,
    /**
     * onchange
     * func
     */
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      info: {}
    }
  }

  componentDidMount() {
    const { type } = this.props
    let info = {}
    switch (type) {
      case 'month':
        info = {
          day: ['1'],
          hour: '0',
          minute: '0'
        };
        break;
      case 'week':
        info = {
          week: ['1'],
          hour: '0',
          minute: '0'
        };
        break;
      case 'day':
        info = {
          hour: '0',
          minute: '0'
        };
        break;
      case 'hour':
        info = {
          start_hour: '0',
          end_hour: '0',
          step_hour: '1'
        };
        break;
      case 'minute':
        info = {
          minute: '5'
        }
        break;
      case 'second':
        info = {
          second: '5'
        }
        break;
      default:
        break;
    }
    this.setState({
      info
    })
  }

  componentWillReceiveProps(nextProps) {
    const { uuid } = this.props
    if (uuid !== nextProps.uuid) {
      let info = {}
      switch (nextProps.type) {
        case 'month':
          info = {
            day: ['1'],
            hour: '0',
            minute: '0'
          };
          break;
        case 'week':
          info = {
            week: ['1'],
            hour: '0',
            minute: '0'
          };
          break;
        case 'day':
          info = {
            hour: '0',
            minute: '0'
          };
          break;
        case 'hour':
          info = {
            start_hour: '0',
            end_hour: '0',
            step_hour: '1'
          };
          break;
        case 'minute':
          info = {
            minute: '5'
          }
          break;
        case 'second':
          info = {
            second: '5'
          }
          break;
        default:
          break;
      }
      this.setState({
        info: nextProps.defaultDatas ? nextProps.defaultDatas : info
      })
    }
  }

  render() {
    const { type } = this.props
    switch (type) {
      case 'day': return this.render_day();
      case 'week': return this.render_week();
      case 'month': return this.render_month();
      case 'hour': return this.render_hour();
      case 'minute': return this.render_minute();
      case 'second': return this.render_second();
      default: return null;
    }
  }

  render_day() {
    return (
      <div className="groups-from">
        <GroupsFormRow
          type="time"
          field={['hour', 'minute']}
          text="具体时间"
          defaultData={this.mapsDatasInObject(['hour', 'minute'])}
          onGetValues={this.handleGetForms.bind(this)}
        />
        {/*<GroupsFormRow  
          type="radios"
          field= "execute"
          text= "立即执行"
          defaultData={this.mapsDatasInObject('execute')}
          onGetValues={this.handleGetForms.bind(this)}
        />*/}
      </div>
    )
  }

  render_week() {
    return (
      <div className="groups-from">
        <GroupsFormRow
          type="weekday"
          field='week'
          text="选择时间"
          defaultData={this.mapsDatasInObject('week')}
          onGetValues={this.handleGetForms.bind(this)}
        />
        <div className="row gap-row" style={{ height: '15px' }}></div>
        <GroupsFormRow
          type="time"
          field={['hour', 'minute']}
          text="具体时间"
          defaultData={this.mapsDatasInObject(['hour', 'minute'])}
          onGetValues={this.handleGetForms.bind(this)}
        />
        {/*<GroupsFormRow
          type="radios"
          field= "execute"
          text= "立即执行"
          defaultData={this.mapsDatasInObject('execute')}
          onGetValues={this.handleGetForms.bind(this)}
        />*/}
      </div>
    );
  }

  render_month() {
    return (
      <div className="groups-from">
        <GroupsFormRow
          type="day"
          field='day'
          text="选择时间"
          suffix='号'
          defaultData={this.mapsDatasInObject('day')}
          onGetValues={this.handleGetForms.bind(this)}
        />
        <div className="row gap-row" style={{ height: '15px' }}></div>
        <GroupsFormRow
          type="time"
          field={['hour', 'minute']}
          text="具体时间"
          defaultData={this.mapsDatasInObject(['hour', 'minute'])}
          onGetValues={this.handleGetForms.bind(this)}
        />
        {/*<GroupsFormRow
          type="radios"
          field="execute"
          text="立即执行"
          defaultData={this.mapsDatasInObject('execute')}
          onGetValues={this.handleGetForms.bind(this)}
        />*/}
      </div>
    );
  }

  render_hour() {
    return (
      <div className="groups-from">
        <GroupsFormRow
          type="time"
          onlyHour
          field={['start_hour']}
          text="开始时间"
          defaultData={this.mapsDatasInObject(['start_hour'])}
          onGetValues={this.handleGetForms.bind(this)}
        />
        <div className="row gap-row" style={{ height: '15px' }}></div>
        <GroupsFormRow
          type="hour"
          field="step_hour"
          text="间隔时间"
          suffix='小时'
          defaultData={this.mapsDatasInObject('step_hour')}
          onGetValues={this.handleGetForms.bind(this)}
        />
        <div className="row gap-row" style={{ height: '15px' }}></div>
        <GroupsFormRow
          type="time"
          onlyHour
          field={['end_hour']}
          text="结束时间"
          defaultData={this.mapsDatasInObject(['end_hour'])}
          onGetValues={this.handleGetForms.bind(this)}
        />
        {/*<GroupsFormRow
          type="radios"
          field= "execute"
          text= "立即执行"
          defaultData={this.mapsDatasInObject('execute')}
          onGetValues={this.handleGetForms.bind(this)}
        />*/}
      </div>
    );
  }

  render_minute() {
    return (
      <div className="groups-from">
        <GroupsFormRow
          type="second"
          field='minute'
          text="间隔时间"
          range={this.props.range}
          defaultData={this.mapsDatasInObject('minute')}
          onGetValues={this.handleGetForms.bind(this)}
        />
      </div>
    );
  }

  render_second() {
    return (
      <div className="groups-from">
        <GroupsFormRow
          type="second"
          field='second'
          text="间隔时间"
          range={this.props.range}
          defaultData={this.mapsDatasInObject('second')}
          onGetValues={this.handleGetForms.bind(this)}
        />
      </div>
    );
  }

  handleGetForms(info) {
    const { onChange } = this.props
    this.setState({
      info: {
        ...this.state.info,
        ...info
      }
    }, () => {
      onChange && onChange(this.state.info)
    })
  }

  mapsDatasInObject(fields) {
    const { info } = this.state
    const maps = {}
    if (info) {
      switch (typeof fields) {
        case 'string':
          Object.assign(maps, { [fields]: info[fields] });
          break;
        case 'object':
          Array.isArray(fields) && fields.forEach((item) => {
            Object.assign(maps, { [item]: info[item] })
          });
          break;
        default: break;
      }
    }
    return maps;
  }

  getDatas = () => this.state.info;
}

export default GroupsForm
