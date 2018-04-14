import React from 'react';

import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';

import IndicatorWidget from '../components/IndicatorWidget';
import IndicatorDialog from '../components/IndicatorDialog';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as labelAddOrEditActionCreators } from '../../../redux/modules/label/addOrEdit';

import '../../../libs/jquery.drag';
import dragHandle from '../../../helpers/dragHandle';
import TipMixin from '../../../helpers/TipMixin';
import './high-second-process.less';

const HighSecondProcess = createReactClass({
  displayName: 'HighSecondProcess',
  mixins: [TipMixin],

  getInitialState() {
    return {
      uuid: new Date().getTime(),
      indicator_data: [],
      select_indicators: [],
      indicator_dialog: {
        type: '',
        show: false,
        active: -1,
        data: null
      }
    }
  },

  componentDidMount() {
    const { allIndicator, getComponent, actions, data } = this.props
    // 返回当前组件信息
    getComponent(this)
    // 整体可拉高
    dragHandle({
      $dom: $(`#page-wrap-${this.PAGE_ID}`),
      move_target_selector: '.modal-title',
      drag_selector: `#coor-${this.PAGE_ID}`,
      axis: 'y'
    })
    // 左侧可拉宽
    dragHandle({
      $dom: $(`#item-left-${this.PAGE_ID}`),
      move_target_selector: '.modal-title',
      drag_selector: `#coor-left-${this.PAGE_ID}`,
      axis: 'x'
    })
    // 如果 indicators 不存在.
    if (allIndicator.length === 0) {
      actions.fetchAllIndicators();
    } else {
      this._covertIndicator(allIndicator)
    }

    // 如果是编辑的话
    if (data.logical_expression && data.expression_groups.length > 0) {
      // 解析组，并将id 再次转成序列号
      this._decodeGroups(data.expression_groups, () => {
        // 解析表达式
        this.state.select_indicators = this._decodeExpression(data.logical_expression, data.expression_groups)
        this.setState({
          ...this.state
        })
      })
    }
  },

  componentWillReceiveProps(nextProps) {
    const { allIndicator } = this.props

    if (nextProps && nextProps.data) {
      const type = nextProps.type || '维度'
      this.setState({
        type,
        data: nextProps.data[type]
      })
    }
    // 当 Indicators 返回很慢的情况. 
    if (nextProps.allIndicator) {
      this._covertIndicator(allIndicator)
    }
  },

  componentDidUpdate(prevProps, prevState) {
    // 避免组件循环更新，非手动操作，不初始化
    if (this.state.uuid !== prevState.uuid) {
      this._initDrag();
    }
  },

  render() {
    const { pending } = this.props

    const {
      indicator_data,
      select_indicators,
      uuid,
      indicator_dialog
    } = this.state

    const selectInc = this._convertSelectInc(select_indicators)

    return (
      <div className="high-second-process" id="indicator_section">
        <div className="page-wrap" id={`page-wrap-${this.PAGE_ID}`}>
          <div className="item left" id={`item-left-${this.PAGE_ID}`}>
            <div className="title">选择指标</div>
            <div className="main-area">
              <div className="btn-add" onClick={this.handleOpenDialog}>
                <i className="dmpicon-add-01"/>
              </div>
              {
                indicator_data.map((item, i) => (
                  <IndicatorWidget
                    key={`indicator-widget-${i}`}
                    type="source"
                    serial={i}
                    data={item}
                    events={this._createEvents()}
                  />
                ))
              }
            </div>
            <div className="operator-area">
              {
                this.OPERATORS.map((item, i) => (
                  <div key={`operator-item-${i}`}
                    className='item'
                    onClick={this.handleAddOperator.bind(this, item)}
                  >
                    {item}
                  </div>
                ))
              }
            </div>
            <div className="drag x_drag" id={`coor-left-${this.PAGE_ID}`}/>
          </div>
          <div className="item right">
            <div className="title">指标组合</div>
            <div className="main-area" id={`main-area-${uuid}`} key={`main-area-${uuid}`}>
              <div className="main-area-wrap"
                id={`main-area-wrap-${this.PAGE_ID}`}
                key={`main-area-wrap-${uuid}`}
              >
                {
                  selectInc.map((item, i) => (
                    <IndicatorWidget
                      key={`select-inc-${i}`}
                      type="target"
                      serial={i}
                      data={item}
                      events={this._createEvents()}
                    />
                  ))
                }
              </div>
            </div>
          </div>
          <div className="drag y_drag" id={`coor-${this.PAGE_ID}`}/>
        </div>
        <Loading show={pending} containerId='indicator_section'/>
        {
          indicator_dialog.show && (
            <IndicatorDialog
              show={indicator_dialog.show}
              type={indicator_dialog.type}
              data={this.INDICATORS}
              pending={pending}
              editable={this.state.indicator_dialog.active > -1}
              info={indicator_dialog.data}
              onSure={this.handleSureDialog.bind(this, 'indicator_dialog')}
              onClose={this.handleCloseDialog.bind(this, 'indicator_dialog')}
            />
          )
        }
      </div>
    )
  },

  // 添加。 重置indicator_dialog
  handleOpenDialog() {
    this.setState({
      indicator_dialog: {
        type: '',
        show: true,
        active: -1,
        data: null
      }
    })
  },

  handleSureDialog(field, type, data) {
    this.state[field].show = false
    // 是否添加组还是 单个 指标
    let group_operator = false

    // indicator 
    // id 的生成策略, 已选指标的最大值 + 1
    const max = this.state.indicator_data.map(item => item.id)
    const id = this.state.indicator_dialog.active > -1 ? this.state.indicator_dialog.active : max.length > 0 ? Math.max.apply(null, max) + 1 : 0;

    let item = null
    let text = ''

    switch (type) {
      case '数值': {
        if (data.info && data.info.length > 0) {
          data.info.forEach((_item) => {
            text += _item.type === '数值' ? ` ${_item.name} ` : ` ${_item.value || ''} `
          })
          // 传给指标块的数据
          item = { ...data, title: '数值条件', id, type, text }
        }
        break;
      }
      case '日期': {
        if (data.indicators) {
          text = +data.mode === 1 ? `${data.operator || ''} ${data.date}` : +data.mode === 2 ? `${data.start_date} 至 ${data.end_date}` : `距今日 ${data.step_date} 天`
          // 传给指标块的数据
          item = { ...data, title: data.indicators.name, id, type, text }
        }
        break;
      }

      case '维度': {
        group_operator = true
        // 遍历
        data.info && data.info.forEach((_item, index) => {
          const max = this.state.indicator_data.map(__item => __item.id)
          const id = this.state.indicator_dialog.active > -1 ? this.state.indicator_dialog.active : max.length > 0 ? Math.max.apply(null, max) + 1 : 0;

          const names = _item.value ? this._getDimensionName(_item.dimension, _item.value) : ''
          const text = names.length > 0 ? `${_item.operator || ''} （${names.join(',')}）` : `${_item.operator || ''} ${names}`
          // 传给指标块的数据
          const item = { ...data, id, title: _item.name, type, text, index }

          if (this.state.indicator_dialog.active > -1) {
            this.state.indicator_data.splice(this.state.indicator_dialog.active, 1, item)
          } else {
            this.state.indicator_data.push(item)
          }
        })

        // 如果是编辑，且编辑内容不存在, 则为删除
        if (data.info.length === 0 && this.state.indicator_dialog.active > -1) {
          this.state.indicator_data.splice(this.state.indicator_dialog.active, 1)
          this.state.select_indicators = this.state.select_indicators.filter(_item => _item.id !== id)
        }
        break;
      }

      case '描述': {
        group_operator = true
        // 遍历
        data.info && data.info.forEach((_item, index) => {
          const max = this.state.indicator_data.map(__item => __item.id)
          const id = this.state.indicator_dialog.active > -1 ? this.state.indicator_dialog.active : max.length > 0 ? Math.max.apply(null, max) + 1 : 0;

          const text = `${_item.operator || ''} ${_item.value || ''}`
          // 传给指标块的数据
          const item = { ...data, title: _item.name, id, type, text, index }

          if (this.state.indicator_dialog.active > -1) {
            this.state.indicator_data.splice(this.state.indicator_dialog.active, 1, item)
          } else {
            this.state.indicator_data.push(item)
          }
        })

        // 如果是编辑，且编辑内容不存在, 则为删除
        if (data.info.length === 0 && this.state.indicator_dialog.active > -1) {
          this.state.indicator_data.splice(this.state.indicator_dialog.active, 1)
          this.state.select_indicators = this.state.select_indicators.filter(_item => _item.id !== id)
        }
        break;
      }

      case '地址': {
        if (data.indicators) {
          text = `中心点：（${data.center}），半径：${data.radius}米`
          // 传给指标块的数据
          item = { ...data, title: data.indicators.name, id, type, text }
        }
        break;
      }
      default:
        break;
    }

    // 如果是单个操作的时候
    if (!group_operator) {
      this.state.indicator_dialog.active > -1 ?
        (item ?
          this.state.indicator_data.splice(this.state.indicator_dialog.active, 1, item) :
          this.state.indicator_data.splice(this.state.indicator_dialog.active, 1)) :
        this.state.indicator_data.push(item)

      // 如果编辑且不存在
      if (this.state.indicator_dialog.active > -1 && !item) {
        this.state.select_indicators = this.state.select_indicators.filter(_item => _item.id !== id)
      }
    }

    this.setState({
      ...this.state
    })
  },

  handleCloseDialog(field) {
    this.state[field].show = false
    this.setState({
      ...this.state
    })
  },

  // 小组件的操作
  handleWidgetAction(type, action, serial, data) {
    if (type === 'target' && action === 'delete') {
      this.state.select_indicators.splice(serial, 1)
    } else if (type !== 'target') {
      // 更改了source 的信息，要同步target
      switch (action) {
        case 'delete': {
          this.state.indicator_data.splice(serial, 1)
          this.state.select_indicators = this.state.select_indicators.filter(item => item.id !== data.id)
          break;
        }
        case 'select': {
          this.state.select_indicators.push({
            type: 'indicator',
            id: data.id
          })
          break;
        }
        case 'edit': {
          this.state.indicator_dialog = {
            type: data.type,
            show: true,
            active: serial,
            data
          }
          break;
        }
        default:
          break;
      }
    }
    this.setState({
      ...this.state,
      uuid: new Date().getTime()
    })
  },

  // 添加操作
  handleAddOperator(item) {
    this.state.select_indicators.push({
      type: 'operator',
      text: item
    })
    this.setState({
      ...this.state,
      uuid: new Date().getTime()
    })
  },

  _initDrag() {
    $(`#main-area-${this.state.uuid} .indicator-widget`).arrangeable({
      dragEndEvent: 'onEndSort'
    });

    $(`#main-area-wrap-${this.PAGE_ID}`).on('onEndSort', () => {
      const oldList = this.state.select_indicators.slice()
      const newList = []
      $(`#main-area-${this.state.uuid}`).find('.indicator-widget').each((index, item) => {
        const serial = $(item).attr('data-serial')
        newList.push(oldList[serial])
      })
      this.setState({
        select_indicators: newList,
        uuid: new Date().getTime()
      })
    })
  },

  _createEvents() {
    const events = ['onDelete', 'onEdit', 'onDrag', 'onSelect']
    const onEvents = {}

    events.forEach((e) => {
      onEvents[e] = this.handleWidgetAction
    })

    return onEvents
  },

  _convertSelectInc() {
    const { select_indicators, indicator_data } = this.state
    const data = []

    select_indicators.forEach((item) => {
      let _item = item
      if (item.type === 'indicator') {
        const indicator = indicator_data.filter(inc => inc.id === item.id)
        _item = {
          ...item,
          title: indicator.length > 0 ? indicator[0].title : '',
          text: indicator.length > 0 ? indicator[0].text : ''
        }
      }
      data.push(_item)
    })

    return data
  },

  _covertIndicator(indicators) {
    const convertTree = (data, field) => {
      for (const j in data) {
        if (data[j].name) {
          data[j].text = data[j].name;
        }
        if (data[j][field]) {
          if (data[j][field].length > 0) {
            data[j].children = data[j][field];
          }
          convertTree(data[j][field], field)
        }
      }
      return data
    }

    const convertIndicators = (indicators) => {
      const groups = (type) => {
        const _groups = []
        indicators.forEach((group) => {
          const indicator = group.indicator.filter(item => item.type === type)
          // 如果指标下的数据为空
          if (indicator.length !== 0) {
            _groups.push({
              ...group,
              indicator
            })
          }
        })
        return _groups;
      }

      this.INDICATORS_TYPES.forEach((item) => {
        this.INDICATORS[item] = convertTree(groups(item), 'indicator')
      })
    }

    return convertIndicators(indicators);
  },

  // 解析表达式和组
  _decodeGroups(expression_group, cb) {
    const arr = []
    expression_group.forEach((item, index) => {
      this._decodeData(item.expression, item.type, (data) => {
        let text = ''
        switch (item.type) {
          case '数值': {
            data && data.forEach((_item) => {
              text += _item.type === '数值' ? ` ${_item.name} ` : ` ${_item.value || ''} `
            })
            arr.push({
              id: index,
              type: '数值',
              title: '数值条件',
              info: data,
              text
            })
            break;
          }
          case '维度': {
            const names = data[0].value ? this._getDimensionName(data[0].dimension, data[0].value) : ''
            text = names.length > 0 ? `${data[0].operator || ''} （${names.join(',')}）` : `${data[0].operator || ''} ${names}`
            arr.push({
              id: index,
              type: '维度',
              title: data[0].name,
              info: data,
              text
            })
            break;
          }
          case '描述': {
            text = `${data[0].operator || ''} ${data[0].value || ''}`
            arr.push({
              id: index,
              type: '描述',
              title: data[0].name,
              info: data,
              text
            })
            break;
          }
          case '日期': {
            text = +data[0].mode === 1 ? `${data[0].operator} ${data[0].date}` : +data[0].mode === 2 ? `${data[0].start_date} 至 ${data[0].end_date}` : `距今日 ${data[0].step_date} 天`
            arr.push({
              ...data[0],
              id: index,
              type: '日期',
              title: data[0].indicators.name,
              text
            })
            break;
          }
          case '地址': {
            text = `中心点：（${data[0].center}），半径：${data[0].radius}米`
            arr.push({
              ...data[0],
              id: index,
              type: '地址',
              title: data[0].indicators.name,
              text
            })
            break;
          }
          default:
            break;
        }
      })
    })

    // 已选指标
    this.state.indicator_data = arr
    // 设置回调.开始解析指标组合
    if (typeof cb === 'function') {
      cb()
    }
  },

  // 同步到弹窗框返回数据
  _decodeData(expression, type, callback) {
    const arr = []
    const iReg = /^{i:.*}$/ // 指标
    const vReg = /^{v:.*}$/ // 数值
    let isInvalid = false // 该指标项是否还存在

    let _expression;

    try {
      _expression = JSON.parse(expression)
    } catch (e) {
      return null
    }

    switch (type) {
      case '数值': {
        _expression.expression.split(' ').forEach((item) => {
          if (iReg.test(item)) {
            const id = item.replace(/{i:/, '').replace(/}/, '')
            const indicator = this._getIndicator(id)

            if (indicator) {
              isInvalid = true
              arr.push(indicator)
            }
          } else if (vReg.test(item)) {
            const value = item.replace(/{v:/, '').replace(/}/, '')
            arr.push({
              type: 'input',
              value
            })
          } else {
            arr.push({
              type: 'operator',
              value: item
            })
          }
        })
        break;
      }
      case '维度': {
        const indicator = this._getIndicator(_expression.indicator_id)
        if (indicator) {
          isInvalid = true
          indicator.operator = _expression.operator
          // 数组
          indicator.value = _expression.value.length > 0 ? (['in', 'not in'].indexOf(_expression.operator) > -1 ? _expression.value : _expression.value[0]) : ''
          arr.push(indicator)
        }
        break;
      }
      case '描述': {
        const indicator = this._getIndicator(_expression.indicator_id)
        if (indicator) {
          isInvalid = true
          indicator.operator = _expression.operator
          // 数组
          indicator.value = _expression.value[0] || ''
          arr.push(indicator)
        }
        break;
      }
      case '日期': {
        const indicator = this._getIndicator(_expression.indicator_id)
        if (indicator) {
          isInvalid = true
          const obj = {
            indicators: indicator,
            value: indicator.name,
            mode: _expression.mode,
            operator: _expression.operator || '',
            start_date: '', // 具体时间 1-> 开始时间 2-> 开始-结束 3-> 距今
            end_date: '',
            date: '',
            step_date: ''
          }
          switch (+_expression.mode) {
            case 1: {
              obj.date = _expression.value[0]
              break;
            }
            case 2: {
              if (_expression.value && _expression.value.length > 0) {
                obj.start_date = _expression.value[0] || ''
                obj.end_date = _expression.value[1] || ''
              }
              break;
            }
            case 3: {
              obj.step_date = _expression.value[0]
              break;
            }
            default:
              break;
          }
          arr.push(obj)
        }
        break;
      }
      case '地址': {
        const indicator = this._getIndicator(_expression.indicator_id)
        if (indicator) {
          isInvalid = true
          arr.push({
            id: _expression.indicator_id,
            indicators: indicator,
            center: _expression.center || [],
            radius: _expression.radius || 1000
          })
        }
        break;
      }
      default:
        break;
    }
    return isInvalid ? callback(arr) : null;
  },

  // 解码
  _decodeExpression(expression, groups) {
    const arr = []
    const operatorsMap = {
      and: '且',
      or: '或'
    }

    expression.split(' ').forEach((item) => {
      // 如果是操作符
      if (!(/^{g:.*}$/.test(item))) {
        arr.push({
          type: 'operator',
          text: operatorsMap[item] || item
        })
      } else {
        const indicatorId = item.replace(/{g:/, '').replace(/}/, '')
        // 假若是 指标id 注意：此处需要使用==进行类型转换 因为id有可能是数值或字符串
        let id = groups.findIndex(_item => (_item.id == indicatorId))
        // 假若是 index
        if (id === -1) {
          // 注意：此处需要使用==进行类型转换 因为id有可能是数值或字符串
          id = groups.findIndex((_item, key) => (key == indicatorId))
        }
        arr.push({
          type: 'indicator',
          id
        })
      }
    })
    return arr
  },

  // 遍历 allindicators. 通过id 获取 indicator
  _getIndicator(id) {
    const { allIndicator } = this.props
    let _indicator = null

    allIndicator.forEach((item) => {
      item.indicator.forEach((indicator) => {
        if (indicator.id === id) {
          _indicator = indicator
        }
      })
    })

    return _indicator
  },

  // 遍历 Dimension
  _getDimensionName(collection, ids) {
    const name = []
    if (ids) {
      ids = typeof ids === 'string' ? [ids] : ids
      ids.forEach((id) => {
        collection.forEach((item) => {
          if (id === item.id) {
            name.push(item.name)
          }
        })
      })
    }
    return name
  },

  INDICATORS: {},
  INDICATORS_TYPES: ['数值', '维度', '日期', '描述', '地址'],
  OPERATORS: ['(', ')', '且', '或'],
  PAGE_ID: new Date().getTime(),
})

const stateToProps = state => ({
  ...state.labelAddOrEdit
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(labelAddOrEditActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(HighSecondProcess);
