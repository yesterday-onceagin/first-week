import PropTypes from 'prop-types';
import React from 'react';

import Button from 'react-bootstrap-myui/lib/Button'
import Dialog from 'react-bootstrap-myui/lib/Dialog'
import Input from 'react-bootstrap-myui/lib/Input'
import Select from 'react-bootstrap-myui/lib/Select'
import NumberInput from '@components/NumberInput'

import _ from 'lodash'
import classnames from 'classnames'
import formatUnits from '../constants/formatUnits'
import generateDisplayFormat from '../utils/generateDisplayFormat'

import './format-config-dialog.less'

class FormatConfigDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    onSure: PropTypes.func.isRequired,
    onClose: PropTypes.func,
    configItem: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props)
    const { configItem } = this.props
    const dF = configItem.display_format || generateDisplayFormat()
    this.state = {
      columnUnitName: dF.column_unit_name || '',
      displayMode: dF.display_mode || 'num',           //num or percentage
      num: {
        thousandPointSeparator: Boolean(dF.thousand_point_separator) || false,   //使用千分位
        unit: dF.unit || '无',                         //无, 万, 亿
        fixedDecimalPlaces: dF.display_mode === 'num' ? dF.fixed_decimal_places : 0,                          //小数位数
      },
      percentage: {
        fixedDecimalPlaces: dF.display_mode === 'percentage' ? dF.fixed_decimal_places : 0
      }
    }
  }

  render() {
    const { show, onClose } = this.props
    const st = this.state
    const formClass = classnames('form number-fortmat-form', st.displayMode)
    return (
      show && <Dialog
        show={show}
        onHide={onClose}
        backdrop="static"
        size={{ width: '450px', height: '358px' }}
        className="format-config-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>数值显示格式设置</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className={formClass} style={{ width: '100%' }}>
            <div className="form-column">
              <Input
                label="显示为数值"
                type="radio"
                value={'num'}
                checked={st.displayMode === 'num'}
                onChange={this.handleChangeValue.bind(this, 'displayMode')}
              />
            </div>
            <div className="form-column indent num">
              <span className="form-column-label">小数位数</span>
              <div className="number-format-input-box">
                <NumberInput
                  debounce={true}
                  minValue={0}
                  maxValue={5}
                  step={1}
                  disabled={st.displayMode !== 'num'}
                  name="layout-config-size-width"
                  value={+st.num.fixedDecimalPlaces}
                  onChange={this.handleChangeNumberInputValue.bind(this, 'num.fixedDecimalPlaces')}
                />
              </div>
              <div className="number-format-checkbox">
                <Input
                  label="使用千位分隔符"
                  type="checkbox"
                  disabled={st.displayMode !== 'num'}
                  checked={st.num.thousandPointSeparator}
                  onChange={this.handleChangeValue.bind(this, 'num.thousandPointSeparator')}
                />
              </div>
              <div style={{ clear: 'both' }} />
            </div>
            <div className="form-column indent num">
              <span className="form-column-label">数值单位</span>
              <Select
                value={st.num.unit}
                width={140}
                disabled={st.displayMode !== 'num'}
                onSelected={this.handleSelectUnit.bind(this)}
              >
                {
                  formatUnits.map((item, i) => <option key={i} value={item.name}>{item.name}</option>)
                }
              </Select>
            </div>
            <div className="form-column indent num">
              <span className="form-column-label">字段单位</span>
              <Input
                type="text"
                className="input-box"
                placeholder="例如: 元、平方米、kg"
                disabled={st.displayMode !== 'num'}
                name="unit"
                value={st.columnUnitName}
                autoComplete="off"
                onChange={this.handleChangeValue.bind(this, 'columnUnitName')}
              />
            </div>

            <div className="form-column" style={{ paddingTop: '10px' }}>
              <Input
                label="显示为百分数"
                type="radio"
                value={'percentage'}
                checked={st.displayMode === 'percentage'}
                onChange={this.handleChangeValue.bind(this, 'displayMode')}
              />
            </div>
            <div className="form-column indent percentage">
              <span className="form-column-label">小数位数</span>
              <div className="number-format-input-box">
                <NumberInput
                  debounce={true}
                  disabled={st.displayMode !== 'percentage'}
                  minValue={0}
                  maxValue={5}
                  step={1}
                  name="layout-config-size-width"
                  value={+st.percentage.fixedDecimalPlaces}
                  onChange={this.handleChangeNumberInputValue.bind(this, 'percentage.fixedDecimalPlaces')}
                />
              </div>
              <div style={{ clear: 'both' }} />
            </div>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSure.bind(this)}>确定</Button>
          <Button bsStyle="default" onClick={onClose}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    )
  }

  handleChangeNumberInputValue(path, value) {
    this.setState((preState) => {
      _.set(preState, path, value)
      return {
        ...preState
      }
    })
  }

  handleChangeValue(path, e) {
    let newValue = e.currentTarget.value
    if (e.currentTarget.type === 'checkbox') {
      newValue = e.currentTarget.checked
    }
    this.setState((preState) => {
      _.set(preState, path, newValue)
      return {
        ...preState
      }
    })
  }

  handleSelectUnit({ value }) {
    this.setState({
      num: {
        ...this.state.num,
        unit: value
      }
    })
  }

  handleSure() {
    this.props.onSure({ ...this.state })
  }
}

export default FormatConfigDialog
