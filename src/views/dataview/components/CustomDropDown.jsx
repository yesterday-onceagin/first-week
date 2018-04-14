import React from 'react'
import PropTypes from 'prop-types'

import MenuItem from 'react-bootstrap-myui/lib/MenuItem';
import DropdownButton from 'react-bootstrap-myui/lib/DropdownButton';
import CustomSortDialog from './CustomSortDialog'
import { DEFAULT_INC_OPTION, OPTION_MAPS, RESERVE_OPTION_MAPS, SORT_CHART_TYPE } from '../constants/incOption';
import classnames from 'classnames';

class CustomDropDown extends React.Component {
  static PropTypes = {
    layout: PropTypes.string,
    group: PropTypes.oneOf(['维度', '数值', '日期']),
    data: PropTypes.object,
    chartId: PropTypes.string,
    locked: PropTypes.bool,   // 锁定
    active: PropTypes.number, // 序列
    onSelect: PropTypes.func,
    onRemove: PropTypes.func,
    onSort: PropTypes.func,   //排序
    onSearch: PropTypes.func, //查询维度值
    type: PropTypes.string,   //chart_code类型
    sortable: PropTypes.bool  //是否可排序
  };

  constructor(props) {
    super(props);
    this.state = {
      sort: props.data.sort,
      showDialog: false,
      showUrlDialog: false
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data.sort !== this.props.data.sort) {
      this.setState({
        sort: nextProps.data.sort
      })
    }
  }

  render() {
    const { layout, group, code, data, serial, locked, active, type, onRemove, onSort, chartId, onSearch, hasUrlSettings, hasNumsUrlsettings, sortable, isdevtools, ...otherProps } = this.props
    const { sort, showDialog } = this.state
    const { dashboard_jump_config } = data
    //通过isOpen判断是否有跳转设置
    let hasReportRedirect = false
    if (dashboard_jump_config) {
      if (typeof dashboard_jump_config === 'string') {
        try {
          hasReportRedirect = JSON.parse(dashboard_jump_config).isOpen
        } catch (e) {
          hasReportRedirect = false
        }
      } else if (typeof dashboard_jump_config === 'object') {
        hasReportRedirect = dashboard_jump_config.isOpen
      }
    }
    const isSort = sortable || SORT_CHART_TYPE.indexOf(type) > -1
    const title = data.alias || data.alias_name || data.col_name
    const menuItems = data.type === '计算高级' ? DEFAULT_INC_OPTION['计算高级'] : DEFAULT_INC_OPTION[group]
    const iconClass = this._getIconClass()
    const dropdownClass = classnames({
      'dropdown-vertical': layout === 'vertical',
      'fixed-dropdown': locked,
      sortable: true,
      active: serial == active && group === '图层'
    })

    data.formula_mode = this._setFormulaMode(data, menuItems)

    // arrowIcon
    const hasArrowIcon = group === '图层' && +serial !== 0
    // sortIcon
    const hasSortIcon = isSort && this.state.sort && (group === '数值' || group === '维度')
    // operator 
    const hasOperator = menuItems && Array.isArray(menuItems[data.data_type])
    // number-sort 
    const hasNumSortOpt = (group === '数值' || group === '维度') && isSort
    // divider 
    const hasNumDivider = group === '数值' && data.type !== '计算高级'
    // num-operator
    const hasNumOpt = group === '数值'
    // operator-divider
    const hasDivider = menuItems && menuItems[data.data_type] && menuItems[data.data_type].length > 0
    // delete-operator
    const hasDelOperator = !(locked && group === '维度' && serial == 0)

    return <span className={dropdownClass} onClick={this.handleClick.bind(this)}>
      {hasArrowIcon && <i className="dmpicon-arrow-down" style={this.STYLE_SHEET.arrowIcon} />}
      {hasSortIcon && <i className={iconClass} />}
      <DropdownButton
        {...otherProps}
        bsSize="xsmall"
        bsStyle="primary"
        data-id={data.id}
        noCaret={group === '图层'}
        style={hasSortIcon ? this.STYLE_SHEET.sort : {}}
        title={data.formula_mode ? `${title}（${RESERVE_OPTION_MAPS[data.formula_mode]}）` : data.formula_mode === null ? `${title}（默认值）` : title}
        onSelect={this.handleSelect.bind(this)}
      >
        {hasOperator && menuItems[data.data_type].map((item, i) => (item.opt || item.opt === null) && <MenuItem key={i} eventKey={item.text}>{item.text}</MenuItem>)}
        {!isdevtools && hasNumSortOpt &&
          <MenuItem eventKey="排序">
            <span>排序</span>
            {layout === 'vertical' ? <i className="dmpicon-arrow-up" /> : <i className="dmpicon-arrow-down" />}
            <ul className="sub-dropdown">
              <li className={sort === '' ? 'active' : ''} onClick={() => { onSort && onSort(group, serial, '') }}>默认</li>
              <li className={sort === 'ASC' ? 'active' : ''} onClick={() => { onSort && onSort(group, serial, 'ASC') }}>升序</li>
              <li className={sort === 'DESC' ? 'active' : ''} onClick={() => { onSort && onSort(group, serial, 'DESC') }}>降序</li>
              {data.data_type !== '数值' && active < 1 && group === '维度' && <li className={sort === 'CUSTOM' ? 'active' : ''} onClick={this.handleShowDialog.bind(this, 'sort')}>自定义排序</li>}
            </ul>
          </MenuItem>
        }
        {
          !isdevtools && ((hasUrlSettings && group === '维度') || (code === 'numerices' && hasNumsUrlsettings)) && <MenuItem eventKey="跳转设置">
            <span>跳转设置</span>
            {hasReportRedirect && <span style={{ marginLeft: '10px', verticalAlign: '-4%' }}><i className="dmpicon-set" /></span>}
          </MenuItem>
        }
        {!isdevtools && hasNumDivider && hasNumOpt && <MenuItem divider />}
        {!isdevtools && hasNumOpt && <MenuItem eventKey="数值显示格式">数值显示格式</MenuItem>}
        {!isdevtools && hasDivider && hasNumOpt && <MenuItem divider />}
        {!isdevtools && <MenuItem eventKey="别名">别名</MenuItem>}
        {hasDelOperator && <MenuItem eventKey="删除" onClick={() => { onRemove && onRemove(group, serial) }}>删除</MenuItem>}
      </DropdownButton>
      {showDialog && <CustomSortDialog
        show={showDialog}
        data={data}
        chartId={chartId}
        onSure={this.handleSure.bind(this)}
        onClose={this.handleClose.bind(this)}
        onSearch={onSearch}
        group={group}
        serial={serial}
      />}
    </span>
  }
  handleSelect(r, mode) {
    let action = OPTION_MAPS[mode]
    if (mode === '别名' || mode === '数值显示格式' || mode === '删除' || mode === '跳转设置') {
      action = mode
    }
    if (mode === '排序') {
      return false
    }
    this.props.onSelect && this.props.onSelect(action)
  }

  handleShowDialog(key) {
    if (key === 'sort') {
      this.setState({
        showDialog: true
      })
    } else if (key === 'url') {
      this.setState({
        showUrlDialog: true
      })
    }
  }

  handleSure(list) {
    const { group, serial } = this.props
    //发起请求
    this.props.onSort && this.props.onSort(group, serial, list)
  }

  handleClose() {
    this.setState({
      showDialog: false
    })
  }

  handleClick() {
    this.props.onThrough && this.props.onThrough()
  }

  _setFormulaMode(data, menuItems) {
    // debugger
    // 给定默认值, 
    if (data.formula_mode === '') {
      data.formula_mode = menuItems[data.data_type] && menuItems[data.data_type].length > 0 ? menuItems[data.data_type][0].opt : ''
    }

    return data.formula_mode
  }

  _getIconClass() {
    let iconClass

    if (this.state.sort === 'ASC') {
      [, iconClass] = window.DEFAULT_ECHARTS_OPTIONS.sort_method_class
    } else if (this.state.sort === 'DESC') {
      [, , iconClass] = window.DEFAULT_ECHARTS_OPTIONS.sort_method_class
    } else if (this.state.sort === 'CUSTOM') {
      [iconClass] = window.DEFAULT_ECHARTS_OPTIONS.sort_method_class
    }
    return iconClass
  }

  STYLE_SHEET = {
    sort: {
      paddingLeft: '20px'
    },
    arrowIcon: {
      marginRight: '10px',
      display: 'inline-block',
      transform: 'rotate(-90deg) scale(.7)'
    }
  };
}

export default CustomDropDown
