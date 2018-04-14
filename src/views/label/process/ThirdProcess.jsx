import React from 'react';

import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';
import SelectionButton from '../../../components/SelectionButton';
import IndicatorDialog from '../../../components/IndicatorDialog';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as labelAddOrEditActionCreators } from '../../../redux/modules/label/addOrEdit';

import TipMixin from '../../../helpers/TipMixin';
import indicatorTree from '../../../helpers/indicatorTree';

import './third-process.less';

const ThirdProcess = createReactClass({
  displayName: 'ThirdProcess',
  mixins: [TipMixin],

  getInitialState() {
    return {
      show: false,
      info: []
    }
  },

  componentDidMount() {
    const { actions, data, allIndicator } = this.props
    // 获取所有 指标包括维度的数据
    allIndicator.length === 0 && actions.fetchAllIndicators({
      tmpl_id: data.tmpl_id
    })

    if (data.selected_indicators) {
      this.state.info = data.selected_indicators
      this.setState({ ...this.state })
    }
    this.props.getComponent(this)
  },

  render() {
    const { pending, allIndicator } = this.props
    const { info, show } = this.state

    return (
      <div className="third-process" id="third-process">
        <div className="main-container">
          <div className="indicator-row">
            <div className="row-name">
              <span>
                <div style={{ float: 'left' }} className="required">*</div>
                已选指标：
              </span>
              <i className="dmpicon-add" onClick={this.handleOpenDialog}/>
            </div>
            <div className="section-wrap">
              {
                info.map((item, key) => (
                  <SelectionButton
                    key={`selected-indicator-${key}`}
                    selected
                    onClick={this.handleSelectIndicator.bind(this, key)}
                  >
                    {item.name}
                  </SelectionButton>
                ))
              }
            </div>
          </div>
          <div className="tip">
            <i className="dmpicon-help" style={{ fontSize: '18px' }}/>
             请在此区域设置该标签的明细页默认展示的指标，最多 <b style={{ color: '#2DAAFF' }}>6</b> 个。
          </div>
        </div>
        <Loading show={pending} containerId='third-process'/>
        {
          show && (
            <IndicatorDialog
              show={show}
              pending={pending}
              type={'全部指标'}
              maxSize={6}
              data={{ 全部指标: indicatorTree(allIndicator) }}
              info={info}
              onSure={this.handleSureDialog}
              onClose={this.handleCloseDialog}
            />
          )
        }
      </div>
    );
  },

  handleOpenDialog() {
    this.setState({
      show: true
    })
  },

  handleCloseDialog(cb) {
    this.setState({
      show: false
    }, typeof cb === 'function' ? cb : null)
  },

  handleSelectIndicator(key) {
    const { info } = this.state

    info.splice(key, 1)
    this.setState({
      info
    }, () => {
      this.props.onUpdate && this.props.onUpdate()
    })
  },

  handleSureDialog(select) {
    this.handleCloseDialog(() => {
      this.state.info = select
      this.setState({
        ...this.state
      }, () => {
        this.props.onUpdate && this.props.onUpdate()
      })
    })
  },
})

const stateToProps = state => ({
  ...state.labelAddOrEdit
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(labelAddOrEditActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(ThirdProcess);
