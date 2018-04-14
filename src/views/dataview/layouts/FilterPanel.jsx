import PropTypes from 'prop-types';
import React, { Component } from 'react';
import reactMixin from 'react-mixin';
import Sortable from 'react-sortablejs';
import ChartFilterDialog from '../components/ChartFilterDialog';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataViewAddOrEditActionCreators } from '../../../redux/modules/dataview/addOrEdit';

import _ from 'lodash';
import TipMixin from '../../../helpers/TipMixin';

import { RELEASE_WRAP, NOOP } from '../../../constants/sortable';


class FilterPanel extends Component {
  static propTypes = {
    actions: PropTypes.object,
    filterOptions: PropTypes.object,
    chartId: PropTypes.string,
    filters: PropTypes.array,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      filters: _.cloneDeep(props.filters)   // 同步到父组件的属性
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.filters, nextProps.filters)) {
      this.setState({
        filters: nextProps.filters
      })
    }
  }

  render() {
    const { filterOptions } = this.props
    const { filters } = this.state

    const OPTIONS = {
      ...RELEASE_WRAP,
      onAdd: this.handleAddFilter.bind(this, '筛选器')
    }

    return <div className="filter-wrap">
      <div className="title">筛选器</div>
      <div className="filter-container">
        <Sortable options={OPTIONS} onChange={NOOP} disabled={true} filter=".nothing" className="chart-filter-sortable" title="筛选器">
          {filters.length > 0 ? filters.map((item, key) =>
            <ChartFilterDialog
              key={key}
              type={item.data_type}
              alias={item.alias_name}
              operator={item.operator}
              colValue={item.colValue}
              colName={item.col_name}
              filterOptions={filterOptions[item.dataset_field_id]}
              show={item.show}
              mode={item.mode}
              onSave={this.handleSaveFilter.bind(this)}
              onClose={this.handleCloseFilter.bind(this)}
              onDel={this.handleDelFilter.bind(this)}
            />) : <div className="nothing">拖拽字段到这里进行筛选</div>}
        </Sortable>
      </div>
    </div>
  }

  handleSaveFilter(operator, value, col_name) {
    const { filters } = this.state
    const index = _.findIndex(filters, item => col_name === item.col_name)

    if (index > -1) {
      //传到后台前 转换（空）为字符串''
      let json_value = ''
      let col_value = []

      if (value.length > 0) {
        col_value = value.map(i => (i === '(空)' ? '' : i))
      }

      if (col_value.length > 0) {
        json_value = ['in', 'not in', 'between'].indexOf(operator) > -1
          ? JSON.stringify(col_value)
          : col_value[0]
      }

      filters[index].col_value = json_value
      filters[index].colValue = value
      filters[index].operator = operator
      filters[index].show = false
      filters[index].mode = 'edit'

      this.setState({ filters })

      this.props.onChange('save', filters)
    }
  }

  handleAddFilter(name, evt) {
    const { actions, chartId } = this.props
    const { filters } = this.state
    const { id } = evt.clone.dataset
    const item = this._findItemById(id)
    const isExist = filters.find(i => i.dataset_field_id === id)

    if (item) {
      Object.assign(item, { formula_mode: '' })
    }

    if (item && item.type === '计算高级') {
      return this.showErr('高级计算字段不能设置为筛选器')
    } else if (isExist) {
      return this.showErr('该字段已经被设置为筛选器')
    } else if (item && !isExist) {
      filters.push({
        dashboard_chart_id: chartId,
        dataset_field_id: item.id,
        dataset_id: item.dataset_id,
        col_name: item.col_name,
        alias_name: item.alias_name,
        field_group: item.field_group,
        type: item.type,
        data_type: item.data_type,
        col_value: '',
        colValue: [],
        expression: null,
        operator: '',
        show: true,
        mode: 'add' //模式为新增filter
      })

      // 获取filterOptions
      if (item.data_type === '枚举' || item.data_type === '字符串') {
        actions.fetchFilterOptions({
          chart_id: chartId,
          dataset_field_id: item.id,
          dataset_id: item.dataset_id
        })
      }

      this.setState({ filters })
      this.props.onChange('add', filters)
    }
  }

  handleDelFilter(col_name) {
    const { filters } = this.state
    _.remove(filters, item => col_name === item.col_name)

    this.setState({ ...this.state })
    this.props.onChange('delete', this.state.filters)
  }

  //关闭filter弹窗
  handleCloseFilter(show, col_name, mode) {
    const { filters } = this.state
    const index = _.findIndex(filters, item => col_name === item.col_name)

    if (mode === 'add') {
      this.state.filters.splice(index, 1)
    } else {
      this.state.filters[index].show = false
    }

    this.setState({ ...this.state })
    this.props.onChange('close', this.state.filters)
  }

  // 根据id 从左侧的tree中找出对应的数据
  _findItemById(id) {
    let item = null
    if (this.props.dataFeildList) {
      Object.values(this.props.dataFeildList).forEach((group) => {
        group.every((data) => {
          if (data.id === id) {
            item = _.cloneDeep(data)
            return false
          }
          return true
        })
      })
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
}

reactMixin.onClass(FilterPanel, TipMixin)

const stateToProps = state => ({
  ...state.dataViewAddOrEdit
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(dataViewAddOrEditActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(FilterPanel);
