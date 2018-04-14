import React from 'react'
import PropTypes from 'prop-types'
import Row from 'react-bootstrap-myui/lib/Row';
import Col from 'react-bootstrap-myui/lib/Col';
import Select from 'react-bootstrap-myui/lib/Select';
import DatePicker from '../../../components/DatePicker';
import Input from 'react-bootstrap-myui/lib/Input';

const DATE_OPERATORS = ['>', '=', '<', '>=', '<=']

/**
 * 日期类指标。最后返回的数据格式包含.
 * {
 *   indicator: {id,name},
 *   data: []
 * }
 */

export default class DateSelection extends React.Component {
  static propTypes = {
    //  为了避免切换的时候，将数据清楚. 所以预设了多个字段存储
    info: PropTypes.shape({
      mode: PropTypes.oneOf([1, 2, 3]), // ["日期","日期段","距今日"]
      operator: PropTypes.oneOf(['>', '=', '<', '>=', '<=']),
      date: PropTypes.string,
      start_date: PropTypes.string,
      end_date: PropTypes.string,
      step_date: PropTypes.number
    }),
    getComponent: PropTypes.func
  };

  static defaultProps = {
    mode: 1
  };

  constructor(props) {
    super(props);
    this.state = {
      mode: 1,
      operator: '>',
      date: '',
      start_date: '',
      end_date: '',
      step_date: 1
    }
  }

  componentDidMount() {
    const { getComponent, info } = this.props
    if (info) {
      this.setState({
        ...this.state,
        ...info
      })
    }
    // 通过回调。将子组件完全暴露给父组件，便于同步信息到父组件存储
    getComponent && getComponent(this)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps) {
      this.setState({
        ...this.state,
        ...nextProps.info
      })
    }
  }

  render() {
    const { mode, operator, date, start_date, end_date, step_date } = this.state

    return (
      <div className="form" style={{ marginTop: '10px' }}>
        <Row>
          <Input
            type="checkbox"
            label="日期"
            checked={mode === 1}
            onChange={this.handleChange.bind(this, 'mode', 1)}
          />
        </Row>
        <Row style={{ marginBottom: '10px' }}>
          <Col md={3}>
            <Select value={operator} maxHeight={180} width={70} onSelected={this.handleChange.bind(this, 'operator')}>
              {DATE_OPERATORS.map((item, i) => <option key={`operator-${i}`} value={item}>{item}</option>)}
            </Select>
          </Col>
          <Col md={9}>
            <DatePicker value={date} onSelected={this.handleChange.bind(this, 'date')} />
          </Col>
        </Row>
        <Row>
          <Input
            type="checkbox"
            label="日期段"
            checked={mode === 2}
            onChange={this.handleChange.bind(this, 'mode', 2)}
          />
        </Row>
        <Row style={{ marginBottom: '10px' }}>
          <Col md={12}>
            <DatePicker
              value={start_date ? [start_date, end_date] : []}
              single={false}
              onSelected={this.handleChange.bind(this, 'start_date')}
            />
          </Col>
        </Row>
        <Row>
          <Input
            type="checkbox"
            label="距今日"
            checked={mode === 3}
            onChange={this.handleChange.bind(this, 'mode', 3)}
          />
        </Row>
        <Row style={{ marginLeft: '30px' }}>
          <Input
            type="text"
            value={step_date}
            onChange={this.handleChange.bind(this, 'step_date')}
            style={{ width: '80px' }}
          />
          &nbsp;天
        </Row>
      </div>
    );
  }

  handleChange(field, value) {
    const number_reg = /^[1-9]\d*|0$/;

    switch (field) {
      case 'mode':
        this.state[field] = value
        break
      case 'step_date': {
        const number = value.target.value
        if (number_reg.test(number) || !number) {
          this.state[field] = number
        }
        break
      }
      case 'operator':
        this.state[field] = value.value
        break
      case 'date':
        this.state[field] = value
        break
      case 'start_date':
        this.state.start_date = value[0]
        this.state.end_date = value[1]
        break
      default:
        break
    }
    this.setState({
      ...this.state
    }, () => {
      // 通过回调。同步父组件
      this.props.onChange && this.props.onChange(this.state)
    })
  }
}
