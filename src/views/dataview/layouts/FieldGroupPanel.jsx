import PropTypes from 'prop-types';
import React, { Component } from 'react';
import reactMixin from 'react-mixin';
import uniqueId from 'lodash/uniqueId';
import Sortable from 'react-sortablejs';
import CustomDropDown from '../components/CustomDropDown';
import AliasNameDialog from '../components/AliasNameDialog';
import FormatConfigDialog from '../components/FormatConfigDialog';
import generateDisplayFormat from '../utils/generateDisplayFormat';
import expressionHasAggregateOperator from '@helpers/expressionHasAggregateOperator';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataViewAddOrEditActionCreators } from '../../../redux/modules/dataview/addOrEdit';

import _ from 'lodash'
import TipMixin from '@helpers/TipMixin';
import classnames from 'classnames'

import { CONTAINER_WRAP, NOOP } from '../../../constants/sortable';
import { THROUGH_CHART_TYPE } from '../constants/incOption'

import './field-group-panel.less';

class FieldGroupPanel extends Component {
  static PropTypes = {
    indicators: PropTypes.object,
    chartCode: PropTypes.string,
    chartId: PropTypes.string,
    dashboardId: PropTypes.string,
    onChange: PropTypes.func,
    getData: PropTypes.object
  };

  static defaultProps = {
    onChange: NOOP
  };

  constructor(props) {
    super(props);
    this.state = {
      indicators: {
        图层: [],
        维度: [],
        数值: []
      },
      alias_dialog: {  // 别名窗口
        show: false,
        type: '',
        active: ''
      },
      formatConfigDialog: {
        show: false,
      },
      through_active: -1,
      through_index: -1,  // add | delete 穿透位置
      through_id: ''
    }
  }

  componentDidMount() {
    this.setState({
      ...this.state,
      indicators: this.props.indicators,
      through_active: this.props.through_active
    }, this._checkDropDown)
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      ...this.state,
      indicators: nextProps.indicators,
      through_active: nextProps.through_active
    })
  }

  componentDidUpdate() {
    this._checkDropDown()
  }

  render() {
    const {
      indicators,
      through_active,
      alias_dialog,
      formatConfigDialog
    } = this.state

    const {
      chartCode,
      preIndicators,
      switchingDataSet
    } = this.props

    // 增加 
    const options = name => ({
      ...CONTAINER_WRAP,
      filter: '.tip',                                   // 过滤提醒的classname
      onAdd: this.handleAdd.bind(this, name),
      onStart: this.handleSort.bind(this, 'start', name),
      onMove: this.handleSort.bind(this, 'move', name),
      onEnd: this.handleSort.bind(this, 'end', name)
    })

    const _visiableThrough = () => {
      let through = Array.isArray(indicators['图层']) && indicators['图层'].length > 0
      if (preIndicators && switchingDataSet) {
        through = Array.isArray(preIndicators['图层']) && preIndicators['图层'].length > 0
      }
      return through
    }

    // 图层是否可见
    const visiableThrough = _visiableThrough()
    const visiableGroup = group => ((group === '图层' && visiableThrough) || group !== '图层')
    const classNameGroup = group => (classnames('content', {
      through: (visiableThrough && group === '图层') || (!visiableThrough && group === '维度')
    }))
    const visiableThroughBtn = (group) => {
      const hasIndicator = group === '维度' && Array.isArray(indicators['维度']) && indicators['维度'].length > 0
      const noLayer = indicators['图层'] && indicators['图层'].length === 0
      return !switchingDataSet && hasIndicator && noLayer
    }
    const isThroughChartType = THROUGH_CHART_TYPE.indexOf(chartCode) > -1
    // 指标按钮
    const tipdom = (group) => {
      const num = preIndicators && preIndicators[group]
        ? preIndicators[group].length - indicators[group].length : 0
      const preffix = num > 0 ? num : 0
      const suffix = group === '数值' ? '个度量' : '个维度'

      return preffix > 0 && switchingDataSet &&
        <span className="tip">请拖入 <i style={this.NUM_STYLE}>{preffix}</i> {suffix}</span>
    }
    // 多图层情况
    const hasLayer = group => (group === '图层' && Array.isArray(indicators['图层']) && indicators['图层'].length > 0)

    return <div className="indictor-box-wrap" ref={(node) => { this.indicatorBoxWrap = node }}>
      {
        this.FIELD_GROUPS.map((group, key) => visiableGroup(group) && <div key={key} className="block">
          <div className="title">{group}</div>
          <div className={classNameGroup(group)} data-group={group}>
            <Sortable options={options(group)} onChange={NOOP}>
              {
                Array.isArray(indicators[group]) && indicators[group].map((item, index) => {
                  const indicatorOnly = group === '维度' && indicators['图层'] && indicators['图层'].length > 0

                  const locked = index === 0 && (group === '图层' || indicatorOnly)
                  return item && <CustomDropDown
                    style={{ opacity: 0 }}
                    group={group}
                    data={item}
                    active={through_active}
                    locked={locked}
                    data-id={item.id}
                    chartId={this.props.chartId}
                    type={this.props.chartCode}
                    key={uniqueId()}
                    serial={index}
                    onSelect={this.handleSelectDropItem.bind(this, group, index)}
                    onRemove={this.handleRemove.bind(this)}
                    onSort={this.handleChangeSort.bind(this)}
                    onSearch={this.handleSearchDimValues.bind(this)}
                  />
                })
              }
              {tipdom(group)}
            </Sortable>
            {
              visiableThroughBtn(group) && isThroughChartType && (
                <span className="through-btn" onClick={this.handleAddThrough.bind(this)}>
                  <i className="dmpicon-add" />
                  添加穿透
                </span>
              )
            }
            {
              hasLayer(group) && !switchingDataSet && (
                <span className="through-btn" onClick={this.handleRemoveThrough.bind(this)}>
                  <i className="dmpicon-del" />
                  删除穿透
                </span>
              )
            }
          </div>
        </div>)
      }
      {
        alias_dialog.show && (
          <AliasNameDialog
            show={alias_dialog.show}
            info={indicators[alias_dialog.type][alias_dialog.active]}
            onSure={this.handleSureDialog.bind(this, 'alias')}
            onClose={this.handleCloseDialog.bind(this, 'alias')}
          />
        )
      }
      {
        formatConfigDialog.show && <FormatConfigDialog
          show={formatConfigDialog.show}
          chart_code={chartCode}
          configItem={indicators[formatConfigDialog.type][formatConfigDialog.active]}
          onSure={this.handleSureDialog.bind(this, 'formatConfig')}
          onClose={this.handleCloseDialog.bind(this, 'formatConfig')}
        />
      }
    </div>
  }

  handleSureDialog(mode, data) {
    const { alias_dialog, formatConfigDialog } = this.state
    if (mode === 'alias') {
      const orginal = this.state.indicators[alias_dialog.type][alias_dialog.active]
      const org_alias = orginal.alias || orginal.alias_name || orginal.col_name
      const duplication = this._checkAliasDuplication(data.alias)

      if (org_alias !== data.alias && !duplication) {
        this.state.indicators[alias_dialog.type][alias_dialog.active] = data
        this.handleCloseDialog('alias')
        // 通知到父组件更新
        this.props.onChange('alias_change', this.state.indicators)
      } else if (duplication) {
        this.showErr('别名和其他字段重复，请重新设置别名！')
      } else {
        this.handleCloseDialog('alias')
      }
    } else if (mode === 'formatConfig') {
      this.state.indicators[formatConfigDialog.type][formatConfigDialog.active].display_format = generateDisplayFormat(data)
      this.handleCloseDialog('formatConfig')
      // 通知到父组件更新
      this.props.onChange('formatConfig_change', this.state.indicators)
    }
  }

  // 关闭别名弹窗
  handleCloseDialog(mode) {
    switch (mode) {
      case 'alias':
        this.state.alias_dialog.show = false;
        break;
      case 'markline':
        this.state.chart_config.markLineDialog = false;
        break;
      case 'formatConfig':
        this.state.formatConfigDialog.show = false;
        break;
      default:
        break;
    }
    this.setState({})
  }

  handleAddThrough() {
    const first_dim_item = this.state.indicators['维度'][0]
    this.state.indicators['图层'] = [first_dim_item]
    this.state.through_active = 0
    this.state.through_index = 0
    this.setState({ ...this.state }, () => {
      //this.state.chart_uuid = new Date().getTime()
      this.props.onChange('add_through', this.state)
      this.props.onResize()
    })
  }

  handleRemoveThrough() {
    this.state.through_active = -1
    this.state.through_index = -1
    this.state.through_id = this.state.indicators['图层'][0].id
    this.state.indicators['图层'] = []
    this.setState({ ...this.state }, () => {
      //this.state.chart_uuid = new Date().getTime()
      this.props.onChange('remove_through', this.state)
      this.props.onResize()
    })
  }

  handleAdd(name, evt) {
    const id = evt.clone.dataset.id
    const item = this._findItemById(id)
    const isExist = this.state.indicators[name].find(i => i.id === id)
    //是否是计算高级
    const isNumField = (name === '维度' || name === '图层')
    if (isNumField && item && item.type === '计算高级' && expressionHasAggregateOperator(JSON.parse(item.expression))) {
      return this.showErr('含有聚合函数的高级计算字段不能拖动到维度或图层上')
    }
    if (isExist) {
      return this.showErr('该字段已经被选择')
    }
    // 如果当前的维度为空. 并且当前选择的字段类型为地址
    if (item && !isExist) {
      // 初始化默认的数值化格式, 可以去掉
      this.state.indicators[name].push(Object.assign(item, { formula_mode: '', display_format: generateDisplayFormat() }))
      // 设置
      this.setState({
        ...this.state
      }, () => {
        let changeType = 'add'
        if (name === '图层') {
          changeType = 'add_through'
          this.state.through_index = this.state.indicators['图层'].length - 1
        }
        this.props.onChange(changeType, this.state)
      })
    }
  }

  handleSearchDimValues(params, callback) {
    const cloneData = _.cloneDeep(this.props.getData)
    //请求唯一维度值
    const newDims = []
    cloneData.dims && cloneData.dims.forEach((i) => {
      if (i.dim === params.dim) {
        newDims.push(i)
      }
    })
    cloneData.dims = newDims
    cloneData.dashboard_id = this.props.dashboardId
    this.props.actions.fetchDimsValues(cloneData, (json) => {
      if (json.result) {
        callback(true, this.convertDimData(json.data.data, params.col_name))
      } else {
        callback(false, [])
      }
    })
  }

  convertDimData(data, colName) {
    const list = []
    data.forEach((item) => {
      list.push(item[colName])
    })
    return list
  }

  handleChangeSort(type, index, sort) {
    if (this.state.indicators[type][index]) {
      if (type === '数值') {
        this.state.indicators[type][index].sort = sort || ''
        //清空其他sort值
        this.state.indicators[type].forEach((item, i) => {
          if (i !== index) {
            item.sort = null
          }
        })
        this.state.indicators['维度'].forEach((item) => {
          item.sort = null
          if (item.content) {
            item.content.sort = null
          }
        })
      } else {
        const indicator = this.state.indicators[type][index]
        //赋值
        if (Array.isArray(sort)) {
          indicator.sort = 'CUSTOM'
          if (indicator.content) {
            indicator.content.sort = sort
          } else {
            indicator.content = {}
            indicator.content.sort = sort
          }
        } else {
          indicator.sort = sort || ''
        }
        //清空其他sort值
        this.state.indicators[type].forEach((item, i) => {
          if (i !== index) {
            item.sort = null
            if (item.content) {
              item.content.sort = null
            }
          }
        })
        this.state.indicators['数值'].forEach((item) => {
          item.sort = null
        })
      }
      this.setState({
        ...this.state
      }, () => this.props.onChange('changeSort', this.state))
    }
  }

  handleSort(mode, name, evt) {
    switch (mode) {
      case 'start': {
        this.SORT_SOURCE_GROUP = name
        this.SORT_TARGET_GROUP = ''
        break;
      }
      case 'move': {
        this.SORT_TARGET_GROUP = $(evt.to).parent().attr('data-group')
        break;
      }
      case 'end': {
        const { newIndex, oldIndex } = evt
        const visiableThrough = this.state.indicators['图层'] && this.state.indicators['图层'].length > 0
        if (this.SORT_SOURCE_GROUP === this.SORT_TARGET_GROUP) {
          const case1 = this.SORT_TARGET_GROUP === '图层' && oldIndex * newIndex === 0
          const case2 = visiableThrough && this.SORT_TARGET_GROUP === '维度' && oldIndex * newIndex === 0
          if (oldIndex === newIndex || case1 || case2) {
            // 清空轨迹
            this.SORT_SOURCE_GROUP = ''
            this.SORT_TARGET_GROUP = ''
            return false;
          }
          const clone_data = this.state.indicators[this.SORT_SOURCE_GROUP].slice()

          this.state.indicators[this.SORT_SOURCE_GROUP][newIndex] = clone_data[oldIndex]   // 交换位置
          this.state.indicators[this.SORT_SOURCE_GROUP][oldIndex] = clone_data[newIndex]
          this.setState({ ...this.state }, () => {
            const changeType = this.SORT_TARGET_GROUP === '图层' ? 'sort_through' : 'sort'
            // 清空轨迹
            this.SORT_SOURCE_GROUP = ''
            this.SORT_TARGET_GROUP = ''
            this.props.onChange(changeType, this.state)
          })
        } else {
          let changeType = 'sort'
          // 1、不能从其他组拖入到 图层组
          // 2、不能把图层中拖入到 其他组
          // 3、当图层组存在的时候. 维度组的第一个维度值锁死
          const targetLayer = this.SORT_TARGET_GROUP === '图层' && !!this.SORT_SOURCE_GROUP
          const sourceLayer = this.SORT_SOURCE_GROUP === '图层' && !!this.SORT_TARGET_GROUP
          const case1 = visiableThrough && this.SORT_TARGET_GROUP === '维度' && !!this.SORT_SOURCE_GROUP && newIndex === 0
          const case2 = visiableThrough && this.SORT_SOURCE_GROUP === '维度' && !!this.SORT_TARGET_GROUP && oldIndex === 0
          const case3 = visiableThrough && this.SORT_SOURCE_GROUP === '维度' && !this.SORT_TARGET_GROUP && oldIndex === 0
          const mergeCase = case1 || case2 || case3
          if (targetLayer || sourceLayer || mergeCase) {
            // 清空轨迹
            this.SORT_SOURCE_GROUP = ''
            this.SORT_TARGET_GROUP = ''
            return false
          }
          // 删除图层第一个则删除所有
          if (this.SORT_SOURCE_GROUP === '图层' && !this.SORT_TARGET_GROUP && oldIndex === 0) {
            changeType = 'remove_through'
            this.state.through_id = this.state.indicators['图层'][0].id
            this.state.indicators['图层'] = []
            this.state.through_active = -1
          } else {
            // 1. 判断是否是重复的
            // 2. 删除原组
            // 3. 新的组内增加
            const item = this.state.indicators[this.SORT_SOURCE_GROUP][oldIndex]
            const isNumeral = item && this.SORT_TARGET_GROUP === '维度' && item.type === '计算高级' //是否是高级计算并且是 数值拖动到维度
            const isExist = item && !!this.SORT_TARGET_GROUP &&
              this.state.indicators[this.SORT_TARGET_GROUP].find(indicator => indicator.id === item.id) &&
              this.state.indicators[this.SORT_SOURCE_GROUP].length > oldIndex
            if (isNumeral && expressionHasAggregateOperator(JSON.parse(item.expression))) {
              this.SORT_SOURCE_GROUP = ''       // 清空轨迹
              this.SORT_TARGET_GROUP = ''
              return this.showErr('含有聚合函数高级计算字段不能拖动到维度上')
            }
            if (isExist) {
              this.SORT_SOURCE_GROUP = ''     // 清空轨迹
              this.SORT_TARGET_GROUP = ''
              return this.showErr('重复字段!')
            }
            this.state.indicators[this.SORT_SOURCE_GROUP].splice(oldIndex, 1)
            if (!!this.SORT_TARGET_GROUP && this.state.indicators[this.SORT_TARGET_GROUP]) {
              const indicator = item
              const _isExist = this.state.indicators[this.SORT_TARGET_GROUP].find(_item => _item.id === indicator.id)
              // 同时滞空方式
              indicator.formula_mode = ''
              // 置空排序方式
              indicator.sort = null
              //维度排序置空content
              if (indicator.content) {
                indicator.content.sort = null
              }
              if (!_isExist && indicator) {
                this.state.indicators[this.SORT_TARGET_GROUP].splice(newIndex, 0, indicator)
              }
            } else if (this.SORT_SOURCE_GROUP === '图层' && !this.SORT_TARGET_GROUP) {
              // 删除穿透
              changeType = 'delete_through'
              this.state.through_index = oldIndex
              this.state.through_active = 0
              this.state.through_id = item.id
            }
          }

          this.setState({
            ...this.state,
            indicators: this.state.indicators
          }, () => {
            // 清空轨迹
            this.SORT_SOURCE_GROUP = ''
            this.SORT_TARGET_GROUP = ''
            this.props.onChange(changeType, this.state)
          })
        }
        break;
      }
      default:
        this.SORT_SOURCE_GROUP = ''
        this.SORT_TARGET_GROUP = ''
        break;
    }
  }

  handleRemove(name, index) {
    let type = 'remove_indicator'
    const item = this.state.indicators[name][index]

    this.state.indicators[name].splice(index, 1)
    this.setState({
      ...this.state
    }, () => {
      if (name === '图层') {
        type = 'delete_through'
        this.state.through_index = index
        this.state.through_active = 0
        this.state.through_id = item.id
      }
      this.props.onChange(type, this.state)
    })
  }

  // 选择下拉列表的计算方式
  handleSelectDropItem(group, index, formula_mode) {
    if (formula_mode === '别名') {
      const item = this.state.indicators[group][index]
      const alias = item.alias || item.alias_name || item.col_name

      this.state.indicators[group][index].alias = alias
      this.state.alias_dialog.show = true
      this.state.alias_dialog.type = group
      this.state.alias_dialog.active = index

      this.setState({
        ...this.state
      }, () => {
        this.props.onChange('changeAlias', this.state)
      })
    } else if (formula_mode === '数值显示格式') {
      this.setState({
        formatConfigDialog: {
          ...this.state.formatConfigDialog,
          type: group,
          active: index,
          show: true
        }
      }, () => {
        this.props.onChange('configFormat', this.state)
      })
    } else {
      if (formula_mode === '删除') return
      let changed = false
      if (this.state.indicators[group][index]) {
        changed = true
        this.state.indicators[group][index].formula_mode = formula_mode || (formula_mode === null ? null : '')
      }
      // 如果有更改
      if (changed) {
        this.setState({
          ...this.state
        }, () => {
          this.props.onChange('selectDropDown', this.state)
        })
      }
    }
  }

  _checkAliasDuplication(alias) {
    let duplication = false
    Object.values(this.state.indicators).forEach((group) => {
      group.forEach((indicator) => {
        const _alias = indicator.alias || indicator.alias_name || indicator.col_name
        if (_alias === alias) {
          return duplication = true
        }
      })
    })
    return duplication
  }

  _checkDropDown() {
    const { indicators } = this.state
    const container = this.indicatorBoxWrap

    $(container).find('> .block').each((index, item) => {
      const group = $(item).find('> .content').attr('data-group')
      const $dropdowns = $(item).find('.dropdown')
      const fields = indicators[group].filter(item => !!item)
      const ids = []
      // 和 state 不同步，删除.
      // 同组 id 重复的字段，删除.
      $dropdowns.each((_index, drop) => {
        const id = $(drop).find('.dropdown-toggle').attr('data-id')
        if (!fields.find(field => field.id === id)) {
          $(drop).parent('span').remove()
        }
        if (ids.find(_item => _item === id)) {
          $(drop).parent('span').remove()
        } else {
          ids.push(id)
        }
        $(drop).find('.dropdown-toggle').css('opacity', 1)
      })
    })
  }

  // 根据id 从左侧的tree中找出对应的数据
  _findItemById(id) {
    let item = null
    if (this.props.dataFeildList) {
      Object.values(this.props.dataFeildList).every(group => group.every((data) => {
        if (data.id === id) {
          item = _.cloneDeep(data)
          return false
        }
        return true
      }))
    }
    return item
  }

  showErr(msg) {
    this.showTip({
      status: 'error',
      content: msg
    })
  }

  showScc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  }

  FIELD_GROUPS = ['图层', '维度', '数值'];

  NUM_STYLE = {
    color: '#24BBF9',
    fontSize: '12px',
    fontStyle: 'normal'
  };
}

reactMixin.onClass(FieldGroupPanel, TipMixin)

const stateToProps = state => ({
  ...state.dataViewAddOrEdit
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(dataViewAddOrEditActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(FieldGroupPanel);
