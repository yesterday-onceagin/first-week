import React from 'react'
import PropTypes from 'prop-types'
import reactMixin from 'react-mixin'

import ReportSelectorDialog from '../ReportSelectorDialog'
import GenerateUrlDialog from '../GenerateUrlDialog'
import Sortable from 'react-sortablejs'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as itemDetailActionCreators } from '@store/modules/dataview/itemDetail'

import _ from 'lodash'
import classnames from 'classnames'
import TipMixin from '@helpers/TipMixin'

import { RELEASE_WRAP, NOOP } from '../../../../constants/sortable'

class ReportSelector extends React.Component {
  static propTypes = {
    actions: PropTypes.object,
    sourceId: PropTypes.string,
    dashboardId: PropTypes.string,
    reportSelectors: PropTypes.array,
    dataFeildList: PropTypes.object,
    onChangeIndicator: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      spread: true,
      reportSelectors: _.cloneDeep(props.reportSelectors) || [],
      showUrlDialog: false
    }
  }

  componentWillReceiveProps(nextProps) {
    //修改高级计算字段时，更新已选字段
    const { dataFeildList, sourceId } = this.props
    let { reportSelectors } = this.state
    if (sourceId && nextProps.sourceId === sourceId && dataFeildList && nextProps.dataFeildList && !_.isEqual(nextProps.dataFeildList[sourceId], dataFeildList[sourceId])) {
      reportSelectors = reportSelectors.map(field => ({
        ...field,
        ...this._findFieldDataById(field.dataset_field_id, null, nextProps)
      }))
      this.setState({ reportSelectors })
    }
  }

  render() {
    const { spread, reportSelectors, showUrlDialog } = this.state
    const selectorSortableOptions = indicator => ({
      ...RELEASE_WRAP,
      filter: '.addfield-tips',   // 过滤排序元素
      onAdd: this.handleAddSelector.bind(this, indicator)
    })
    return (
      <div className="indicator-section display-item-section">
        <div className="title" onClick={this.toggleIndicatorGroup.bind(this)}>
          <i className={spread ? 'spread-icon dmpicon-arrow-down' : 'spread-icon dmpicon-arrow-down arrow-right'}></i>
          报告级筛选
        </div>
        <div className={classnames('indicator-fields', { 'indicator-fields-hide': !spread })}>
          <Sortable options={selectorSortableOptions({
            name: '报告级筛选',
            code: 'selectors',
            spread: true
          })} onChange={NOOP} disabled={true}>
            {
              reportSelectors.map((field, fieldIndex) => {
                const { operator, col_value, data_type } = field
                let colValue = []
                if (['in', 'not in', 'between'].indexOf(operator) > -1) {
                  colValue = col_value ? JSON.parse(col_value) : []
                } else if (typeof col_value === 'number') {
                  colValue = [col_value]
                } else {
                  colValue = col_value ? col_value.split(',') : []
                }

                //枚举、字符串做特殊空处理
                const isStr = data_type === '枚举' || data_type === '字符串'
                if (colValue.length > 0 && isStr) {
                  colValue = colValue.map((v) => {
                    if (v === '') {
                      v = '(空)'
                    }
                    return v
                  })
                }
                return (
                  <div className="field-wrap" key={fieldIndex}>
                    <ReportSelectorDialog
                      id={field.main_dataset_field_id}
                      selectorId={field.id}
                      type={field.data_type}
                      alias={field.alias_name}
                      operator={field.operator}
                      colValue={colValue}
                      colName={field.col_name}
                      show={field.show}
                      mode={field.mode}
                      onSave={this.handleSaveSelector.bind(this)}
                      onClose={this.handleCloseSelector.bind(this)}
                      onDel={this.handleDelSelector.bind(this)}
                      onGetField={this.handleGetField.bind(this)}
                      onGetConfig={this.handleGetConfig.bind(this)}
                      setShow={this.handleSetShow.bind(this)}
                    />
                  </div>
                )
              })
            }
            <div className="addfield-tips">
              拖入字段
            </div>
            <div style={{ fontSize: '12px', marginTop: '10px', cursor: 'pointer' }} onClick={this.handleShowUrl.bind(this)}>
              <span>生成URL</span>
            </div>
          </Sortable>
        </div>
        {showUrlDialog && <GenerateUrlDialog
          screenId={this.props.dashboardId}
          reportSelectors={reportSelectors}
          onClose={this.onClose.bind(this)}
        />}
      </div>
    )
  }

  handleShowUrl() {
    this.setState({ showUrlDialog: true })
  }
  onClose() {
    this.setState({ showUrlDialog: false })
  }
  toggleIndicatorGroup() {
    this.setState({
      spread: !this.state.spread
    })
  }
  //设置show or false
  handleSetShow(id, show) {
    const selectors = this.state.reportSelectors.concat()
    const index = _.findIndex(selectors, item => id === item.main_dataset_field_id)
    selectors[index].show = show
    this.setState({
      reportSelectors: [
        ...selectors
      ]
    })
  }
  //首次添加时获取数据集字段
  handleGetField(id, callback) {
    this.props.actions.getReportFieldConfig({
      dashboard_id: this.props.dashboardId,
      main_dataset_field_id: id
    }, (json) => {
      if (json.result) {
        callback && callback(json.data)
      } else {
        this.showErr(json.msg)
      }
    })
  }
  //
  handleGetConfig(id, callback) {
    this.props.actions.getReportSelectorConfig({
      dashboard_filter_id: id
    }, (json) => {
      if (json.result) {
        callback && callback(json.data)
      } else {
        this.showErr(json.msg)
      }
    })
  }

  // 添加筛选字段
  handleAddSelector(indicator, evt) {
    const { id } = evt.clone.dataset
    const field = this._findFieldDataById(id, indicator)
    const { reportSelectors } = this.state
    const isExist = reportSelectors.find(i => i.main_dataset_field_id === id)
    if (field && (field.type === '计算高级' || field.type === '普通高级')) {
      return this.showErr('计算字段不能设置为筛选条件')
    } else if (isExist) {
      return this.showErr('该字段已经被设置为筛选条件')
    } else if (field && !isExist) {
      reportSelectors.push({
        dashboard_id: this.props.dashboardId,
        main_dataset_field_id: field.id,
        dataset_id: field.dataset_id,
        col_name: field.col_name,
        alias_name: field.alias_name,
        field_group: field.field_group,
        type: field.type,
        data_type: field.data_type,
        dataset_relations: [], //新增关联关系
        col_value: '',
        colValue: [],
        expression: null,
        operator: '',
        show: true,
        mode: 'add' //模式为新增filter
      })
    }
    this.setState({
      reportSelectors
    })
  }

  handleSaveSelector(operator, value, id, relatedFields) {
    const selectors = this.state.reportSelectors.concat()
    const index = _.findIndex(selectors, item => id === item.main_dataset_field_id)
    //判断是新增还是编辑
    const { mode } = selectors[index]

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

      //先保存
      if (mode === 'add') {
        this.props.actions.addReportSelector({
          operator,
          dashboard_id: this.props.dashboardId,
          main_dataset_field_id: id,
          col_value: json_value,
          dataset_relations: relatedFields
        }, (json) => {
          if (json.result) {
            selectors[index].col_value = json_value
            selectors[index].colValue = value
            selectors[index].operator = operator
            selectors[index].mode = 'edit'
            selectors[index].id = json.data
            selectors[index].show = false
            //告诉外部新增成功
            this.props.onChangeIndicator('selectors', selectors)
            this.setState({
              reportSelectors: [
                ...selectors
              ]
            })
          } else {
            this.showErr(json.msg)
          }
        })
      } else {
        this.props.actions.editReportSelector({
          id: selectors[index].id,
          dashboard_id: this.props.dashboardId,
          main_dataset_field_id: id,
          col_value: json_value,
          dataset_relations: relatedFields,
          operator
        }, (json) => {
          if (json.result) {
            selectors[index].col_value = json_value
            selectors[index].colValue = value
            selectors[index].operator = operator
            selectors[index].mode = 'edit'
            selectors[index].show = false
            //告诉外部新增成功
            this.props.onChangeIndicator('selectors', selectors)
            this.setState({
              reportSelectors: [
                ...selectors
              ]
            })
          } else {
            this.showErr(json.msg)
          }
        })
      }
    }
  }

  handleDelSelector(id) {
    const selectors = this.state.reportSelectors.concat()
    const index = _.findIndex(selectors, item => id === item.main_dataset_field_id)
    this.props.actions.delReportSelector({
      dashboard_filter_id: selectors[index].id
    }, (json) => {
      if (json.result) {
        //告诉外部新增成功
        selectors.splice(index, 1)
        this.setState({
          reportSelectors: [
            ...selectors
          ]
        }, () => {
          this.props.onChangeIndicator('selectors', selectors)
        })
      } else {
        this.showErr(json.msg)
      }
    })
  }

  handleCloseSelector(show, id, mode) {
    const reportSelectors = this.state.reportSelectors.concat()
    const index = _.findIndex(reportSelectors, item => id === item.main_dataset_field_id)
    if (mode === 'add') {
      reportSelectors.splice(index, 1)
    } else {
      reportSelectors[index].show = false
    }

    this.setState({
      reportSelectors
    })
    this.props.onChangeIndicator('selectors', reportSelectors)
  }

  _findFieldDataById(id, indicator, props) {
    const { sourceId, dataFeildList } = props || this.props
    let field = null
    if (dataFeildList && dataFeildList[sourceId]) {
      Object.values(dataFeildList[sourceId]).every(group => group.every((data) => {
        if (data.id === id) {
          field = _.cloneDeep(data)
          return false
        }
        return true
      }))
    }
    return field
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
reactMixin.onClass(ReportSelector, TipMixin)

const stateToProps = state => ({
  ...state.dataViewItemDetail
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(itemDetailActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(ReportSelector)
