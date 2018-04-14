import PropTypes from 'prop-types';
import React from 'react';

import createReactClass from 'create-react-class';

import Button from 'react-bootstrap-myui/lib/Button';
import ProcessNav from '../../components/ProcessNav';
import FirstProcess from './process/FirstProcess';
import BaseSecondProcess from './process/BaseSecondProcess';
import HighSecondProcess from './process/HighSecondProcess';
import ThirdProcess from './process/ThirdProcess';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as labelAddOrEditActionCreators } from '../../redux/modules/label/addOrEdit';

import TipMixin from '../../helpers/TipMixin';
import { baseAlias } from '../../config';

import './add-edit.less';

const LabelAddOrEdit = createReactClass({
  displayName: 'LabelAddOrEdit',
  mixins: [TipMixin],

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      processActive: 0,
      firstProcess: null,
      secondProcess: null, // 高级标签和基础标签无法同时存在
      thirdProcess: null,
      info: {
        org_name: '',
        name: '',
        org_id: '',
        mode: '基础',
        tmpl_id: '',
        sync_detail: 1,
        label_id: '',
        description: '',
        depend_flow_id: '',
        depend_flow_type: '数据清洗',
        schedule: '',
        logical_expression: '',
        expression_groups: '',
        indicator_data: [],
        selected_indicators: []
      },
      savePending: false
    }
  },

  componentWillMount() {
    const { params } = this.props
    // 向MAIN通知navbar显示内容
    this.props.onChangeNavBar([{
      name: '标签定义',
      url: '/label/list'
    }, {
      name: params.detail_name ? `编辑${params.detail_name}` : '新增标签'
    }]);
  },

  componentDidMount() {
    const { params, actions } = this.props
    this.setState({
      info: {
        ...this.state.info,
        org_name: params.org_name,
        org_id: params.org_id,
        tmpl_id: params.tmpl_id,
        label_id: params.detail_id || ''
      }
    })

    if (params.detail_id) {
      actions.fetchLabelItem({ id: params.detail_id }, (json) => {
        if (json.result) {
          const info = {
            ...this.state.info,
            sync_detail: +json.data.label.sync_detail,
            label_tablename: json.data.label.label_tablename || '',
            name: json.data.name || '',
            mode: json.data.label.mode,
            description: json.data.description || '',
            depend_flow_id: json.data.depend_flow_id || '',
            depend_flow_type: '数据清洗',
            schedule: json.data.schedule || ''
          }

          // 第3步数据
          info.selected_indicators = json.data.label.list_cols ? json.data.label.list_cols.map(item => ({
            id: item.indicator_id,
            name: item.indicator_name,
            rank: item.rank
          })) : []

          if (json.data.label.mode === '基础') {
            info.indicator_data = json.data.label.indicators ? json.data.label.indicators.map(indicator => ({
              indicator_id: indicator.indicator_id,
              indicator_name: indicator.indicator_name,
              dimension: indicator.dimensions
            })) : []
          } else {
            info.logical_expression = json.data.label.logical_expression
            info.expression_groups = json.data.label.expression_groups
          }

          this.setState({ info })
        } else {
          this.showErr(json.msg)
        }
      })
    }

    // 获取所有 指标包括维度的数据
    actions.fetchAllIndicators({
      tmpl_id: params.tmpl_id
    })
  },

  render() {
    const { processActive, info, thirdProcess, savePending } = this.state;
    const SecondProcess = info.mode === '基础' ? BaseSecondProcess : HighSecondProcess;
    const disabledSave = thirdProcess && thirdProcess.state.info.length === 0;

    return (
      <div className="modules-page-container">
        <div className="data-view add-edit-list-page has-bg-color">
          <div className="page-nav" style={{ paddingTop: '30px' }}>
            <ProcessNav
              data={this.DEFAULT_OPTIONS.baseProcessNav}
              active={processActive}
            />
          </div>
          <div style={this.MAIN_STYLE_SHEET}>
            {
              processActive === 0 && <FirstProcess
                data={info}
                editable={!!this.props.params.detail_id}
                getComponent={this.handleGetComponent.bind(this, 'firstProcess')}
                onSwitchMode={this.handleSwitchMode}
                onValidSubmit={this.handValidSubmit}
              />
            }
            {
              processActive === 1 && <SecondProcess
                spread={this.props.spread}
                getComponent={this.handleGetComponent.bind(this, 'secondProcess')}
                data={info}
              />
            }
            {
              processActive === 2 && <ThirdProcess
                onUpdate={() => this.setState({})}
                getComponent={this.handleGetComponent.bind(this, 'thirdProcess')}
                data={info}
              />
            }
          </div>
          <div className="page-footer"
            style={{ position: 'absolute', bottom: '0px', left: '0px', right: '0px', lineHeight: '60px' }}>
            <div className="footer">
              {
                processActive !== 0 && (
                  <Button bsStyle="default" bsSize="small" onClick={this.handlePrev}>上一步</Button>
                )
              }
              {
                processActive === 2 ? (
                  <Button disabled={disabledSave} loading={savePending} bsStyle="primary" bsSize="small" onClick={this.handleSave}>保存</Button>
                ) : (
                  <Button bsStyle="primary" bsSize="small" onClick={this.handleNext}>下一步</Button>
                )
              }
            </div>
          </div>
        </div>
      </div>
    );
  },

  handleSwitchMode(mode) {
    this.state.info.mode = mode
    this.setState({
      ...this.state
    })
  },

  handleNext() {
    const { processActive, firstProcess, secondProcess, info } = this.state
    if (processActive === 0) {
      firstProcess.refs.database_form.submit();
    } else if (processActive === 1) {
      // 如果是高级模式。
      if (info.mode !== '基础') {
        const logical_expression = this._encodeExpression(secondProcess.state.select_indicators, secondProcess.state.indicator_data) || ''
        this.props.actions.checkLogic({
          logical_expression
        }, (json) => {
          if (!json.result) {
            this.showErr(json.msg)
            return
          }
          this.state.info = {
            ...this.state.info,
            expression_groups: info.mode !== '基础' ? this._encodeGroups(secondProcess.state.indicator_data) : [],
            logical_expression
          }
          this.setState({
            ...this.state.info,
            processActive: +processActive + 1
          })
        })
      } else {
        this.state.info = {
          ...this.state.info,
          indicator_data: info.mode === '基础' ? secondProcess.state.info.indicator_data : []
        }
        this.setState({
          ...this.state.info,
          processActive: +processActive + 1
        })
      }
    }
  },

  handlePrev() {
    const { processActive, secondProcess, thirdProcess, info } = this.state
    if (processActive === 1) {
      this.state.info = {
        ...this.state.info,
        indicator_data: info.mode === '基础' ? secondProcess.state.info.indicator_data : []
      }
    } else if (processActive === 2) {
      this.state.info = {
        ...this.state.info,
        selected_indicators: thirdProcess.state.info || [],
        expression_groups: info.mode !== '基础' ? this._encodeGroups(secondProcess.state.indicator_data) : [],
        logical_expression: info.mode !== '基础' ? this._encodeExpression(secondProcess.state.select_indicators, secondProcess.state.indicator_data) : ''
      }
    }
    this.setState({
      ...this.state.info,
      processActive: processActive - 1
    })
  },

  handleSave() {
    const { thirdProcess, secondProcess, info } = this.state

    this.state.info.selected_indicators = thirdProcess.state.info
    // 基础标签
    if (info.mode !== '基础') {
      // 高级标签 对所选指标进行转码
      this.state.info.expression_groups = this._encodeGroups(secondProcess.state.indicator_data)
      this.state.info.logical_expression = this._encodeExpression(secondProcess.state.select_indicators, secondProcess.state.indicator_data);
    }

    const data = this._convertData(this.state.info);

    this.setState({ savePending: true });

    // 保存
    this.props.actions.saveLabel(data, (json) => {
      if (json.result) {
        this.showSucc(json.msg);
        setTimeout(() => {
          this.setState({ savePending: false });
          this.context.router.push(`${baseAlias}/label/list`);
        }, 1500);
      } else {
        this.showErr(json.msg)
      }
    })
  },

  handleGetComponent(field, component) {
    this.setState({
      [field]: component
    })
  },

  handValidSubmit() {
    const { processActive, firstProcess } = this.state

    this.state.info = firstProcess.state.info
    this.state.processActive = +processActive + 1

    this.setState({
      ...this.state
    })
  },

  // 处理 高级标签 indicator 过来的数据
  // 表达式编码
  _encodeExpression(select_indicators, indicator_groups) {
    const expression = []
    const operatorsMap = {
      且: 'and',
      或: 'or'
    }
    select_indicators.forEach((item) => {
      if (item.type === 'operator') {
        expression.push(operatorsMap[item.text] || item.text)
      } else if (item.type === 'indicator') {
        const serial = indicator_groups.findIndex(group => group.id === item.id)
        expression.push(`{g:${serial}}`)
      }
    })

    return expression.join(' ')
  },

  // 组编码 ( 由之前的后端生成indicator_id) -> 直接按序号传递
  // 对所选指标数据 转成后台对应格式
  _encodeGroups(indicator_groups) {
    const groups = []
    indicator_groups.forEach((item, index) => {
      let expression = ''
      switch (item.type) {
        case '维度': {
          const data = item.info[item.index || 0]
          const value = data.value ? (Array.isArray(data.value) ? data.value : [data.value]) : []

          expression = JSON.stringify({
            indicator_id: data.id,
            operator: data.operator,
            value
          })
          break
        }
        case '数值': {
          expression = JSON.stringify({
            expression: this._endcodeData(item.info)
          })
          break
        }
        case '描述': {
          const data = item.info[item.index || 0]
          expression = JSON.stringify({
            indicator_id: data.id,
            operator: data.operator,
            value: data.value ? [data.value] : []
          })
          break
        }
        case '日期': {
          const data  = {
            indicator_id: item.indicators.id,
            mode: item.mode,
            value: []
          }

          switch (item.mode) {
            case 1:
              data.value = [item.date]
              break
            case 2:
              data.value = [item.start_date, item.end_date]
              break
            case 3:
              data.value = [item.step_date]
              break
            default:
              break
          }
          expression = JSON.stringify(+item.mode === 1 ? Object.assign(data, { operator: item.operator }) : data)
          break
        }
        case '地址': {
          expression = JSON.stringify({
            indicator_id: item.indicators.id,
            center: item.center,
            radius: item.radius
          })
          break
        }
        default:
          break
      }
      // 无需再提交id, 只是在再次编辑的时候，作为提交数据的位置校验
      groups.push({
        id: index,
        type: item.type,
        expression
      })
    })
    return groups
  },

  _endcodeData(data) {
    const _data = []
    data.forEach((item) => {
      switch (item.type) {
        case '数值':
          _data.push(`{i:${item.id}}`)
          break
        case 'operator':
          _data.push(item.value)
          break
        case 'input':
          _data.push(`{v:${item.value}}`)
          break
        default:
          break
      }
    })
    return _data.join(' ')
  },

  // 对返回数据进行结构 回传给后台
  _convertData(info) {
    const { indicator_data, selected_indicators, label_id,
      sync_detail, logical_expression, expression_groups, mode,
      org_id, tmpl_id, label_tablename,  ...others } = info

    const indicators = []
    const list_cols = []

    indicator_data.forEach((indicator) => {
      const dimensions = []
      indicator.dimension.forEach((item) => {
        dimensions.push({
          ...item,
          indicator_id: indicator.indicator_id,
          indicator_name: indicator.indicator_name
        })
      })
      indicators.push({
        indicator_id: indicator.indicator_id,
        indicator_name: indicator.indicator_name,
        dimensions
      })
    })

    selected_indicators.forEach((item, i) => {
      list_cols.push({
        indicator_id: item.id,
        rank: i
      })
    })

    return {
      ...others,
      id: label_id,
      label: {
        expression_groups: mode === '基础' ? '' : expression_groups,
        logical_expression: mode === '基础' ? '' : logical_expression,
        label_id,
        sync_detail,
        mode,
        label_tablename,
        org_id,
        tmpl_id,
        indicators,
        list_cols
      }
    }
  },

  showSucc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  },

  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    })
  },

  DEFAULT_OPTIONS: {
    baseProcessNav: ['基本信息', '自定义标签', '标签明细指标配置'],
    highProcessNav: ['基本信息', '自定义标签']
  },

  MAIN_STYLE_SHEET: {
    position: 'absolute',
    top: '130px',
    left: 0,
    right: 0,
    bottom: '60px',
    overflowY: 'auto'
  },
})

const stateToProps = state => ({
  ...state.labelAddOrEdit
})

const dispatchToProps = dispatch => ({ actions: bindActionCreators(labelAddOrEditActionCreators, dispatch) })

export default connect(stateToProps, dispatchToProps)(LabelAddOrEdit);
