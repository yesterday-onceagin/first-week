import React from 'react'
import PropTypes from 'prop-types'

import Loading from 'react-bootstrap-myui/lib/Loading'
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger'
import Tooltip from 'react-bootstrap-myui/lib/Tooltip'

import _ from 'lodash'
import classnames from 'classnames'

import './key-value-input.less'

// 默认系统内置参数
const DEFAULT_SYS_PARAMS = [{
  key: 'project_code',
  name: 'project_code',
  description: '企业代码',
  values: ['jrj']
}]

/* 
带下拉提示框的input输入框 暂时无用
 */
class InputWithHintBox extends React.PureComponent {
  static propTypes = {
    data: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    height: PropTypes.number,
    hintData: PropTypes.array,
    className: PropTypes.string,
    placeholder: PropTypes.string,
    inputClassName: PropTypes.string,
    style: PropTypes.object,
    readOnly: PropTypes.bool
  };

  static defaultProps = {
    height: 30,
    hintData: [],
    className: '',
    inputClassName: '',
    placeholder: '',
    readOnly: false
  };

  constructor(props) {
    super(props)
    this.state = {
      show: false
    }
    this.uuid = new Date().getTime()
  }

  render() {
    const { data, onChange, hintData, className, inputClassName, style, readOnly, placeholder, height } = this.props
    const { show } = this.state
    // 容器样式
    const containerStyle = {
      ...style,
      height: `${height}px`,
      position: 'relative'
    }
    return (
      <div ref={ (ref) => { this.container = ref }}
        className={`dmp-input-with-hint-box ${className}`}
        style={containerStyle}
      >
        <input
          style={{ width: '100%', height: '100%', lineHeight: `${height - 2}px` }}
          className={inputClassName}
          readOnly={readOnly}
          type="text"
          placeholder={placeholder}
          value={data}
          onChange={onChange}
          onFocus={this.handleOpenHintData.bind(this)}
          onBlur={this.handleCloseHintBox.bind(this)}
        />
        {
          show && Array.isArray(hintData) && hintData.length > 0 && (
            <ul className="hint-box" style={this._calcHintBoxStyle()}>
              {
                hintData.map(value => (
                  <li className="hint-box-item"
                    style={this.STYLE_SHEET.hintItem}
                    key={`hint-box-item-${value}-${this.uuid}`}
                    onClick={() => { onChange(value) }}
                  >
                    {value}
                  </li>
                ))
              }
            </ul>
          )
        }
      </div>
    )
  }

  // 打开输入提示
  handleOpenHintData() {
    this.setState({ show: true })
  }

  // 关闭输入提示
  handleCloseHintBox() {
    setTimeout(() => {
      this.setState({ show: false })
    }, 200)
  }

  // 计算提示框显示的样式
  _calcHintBoxStyle() {
    const { height } = this.props
    
    const $container = $(this.container)
    const width = $container ? $container.width() : '100%'
    const offset = $container ? $container.offset() : 0
    const posFunc = $container ? 'fixed' : 'absolute'
    const top = typeof offset.top === 'number' ? (offset.top + height) : 'initial'
    const left = typeof offset.left === 'number' ? offset.left : 'initial'
    return {
      ...this.STYLE_SHEET.hintBox,
      marginTop: '-1px',
      position: posFunc,
      width,
      top,
      left
    }
  }

  STYLE_SHEET = {
    hintBox: {
      maxHeight: '72px',
      zIndex: 1
    },
    hintItem: {
      width: '100%',
      height: '24px',
      lineHeight: '24px',
      fontSize: '12px'
    }
  };
}

class KeyValueInput extends React.Component {
  static propTypes = {
    data: PropTypes.array.isRequired,                     // 键值对数据（对象数组）
    baseData: PropTypes.array.isRequired,                 // 键值对配置参照（对象数组）
    sysParams: PropTypes.array.isRequired,                // 系统参数
    onChange: PropTypes.func.isRequired,
    pending: PropTypes.bool,
    style: PropTypes.object,
    emptyText: PropTypes.string
  };

  static defaultProps = {
    sysParams: DEFAULT_SYS_PARAMS,
    emptyText: '暂无配置，请添加'
  };

  constructor(props) {
    super(props)
    const { baseData, data } = props
    let newData = data
    if (Array.isArray(baseData) && baseData.length > 0) {
      newData = baseData.map((item) => {
        const findParam = _.find(data, p => p.name === item.name)
        if (findParam) {
          return {
            ...findParam,
            checked: true
          }
        }
        return {
          name: item.name,
          key: item.key,
          value: item.value,
          type: item.type,
          checked: false
        }
      })
    }
    this.state = {
      data: newData
    }
    this.uuid = new Date().getTime()
    this.onChangeTimer = 0
  }

  componentWillReceiveProps(nextProps) {
    const { data, baseData, sysParams, onChange } = nextProps
    // 待更新的data
    let newData = _.cloneDeep(this.state.data)
    // data发生了变化时
    if (!_.isEqual(this.props.data, data)) {
      newData = _.cloneDeep(data)
    }
    // 如果API数据源可用参数发生变更时
    if (!_.isEqual(baseData, this.props.baseData) && Array.isArray(baseData)) {
      // 参照返回的参数和配置的参数重新更新
      const newParams = baseData.map((item) => {
        const findSysParams = _.find(sysParams, d => d.key === item.key)
        // 查找是否存在配置的
        const findParam = _.find(newData, d => d.name === item.name)
        if (findParam) {
          return {
            ...findParam,
            checked: true,
            value: findSysParams ? findSysParams.value : findParam.value
          }
        }
        return {
          checked: item.required,
          name: item.name,
          // 如果不在规定的type范围内 默认设置为query类型
          type: _.keys(this.DEFAULT_TYPES).indexOf(item.type) === -1 ? 'query' : item.type,
          key: item.key || '',
          value: findSysParams ? findSysParams.value : '',
        }
      })
      // 反向更新到外部
      onChange(newParams)
      newData = _.cloneDeep(newParams)
    }
    // 如果系统内置参数更新
    if (!_.isEqual(sysParams, this.props.sysParams) && Array.isArray(sysParams)) {
      newData = newData.map((item) => {
        const findSysParams = _.find(sysParams, d => d.key === item.key)
        if (item.type === 'sys' && findSysParams) {
          item.value = findSysParams.value
        }
        return item
      })
      // 反向更新到外部
      onChange(_.cloneDeep(newData))
    }
    this.setState({ data: newData })
  }

  // componentWillUpdate(nextProps, nextState) {
  //   console.log(nextProps.baseData, nextState.data)
  // }

  render() {
    const { style, emptyText, pending, baseData } = this.props
    const hasValidData = Array.isArray(baseData) && baseData.length > 0

    return (
      <div className="key-value-input-container form" id={`dmp-key-value-input-${this.uuid}`} style={style}>
        {
          hasValidData && (
            <div className="key-value-input-item title-item-line" style={{ paddingRight: '12px' }}>
              <div className="input-item title-item" style={{ minWidth: '110px', width: 'calc(27.5% - 10px)' }}>
                参数名称
              </div>
              <div className="input-item title-item" style={{ minWidth: '200px', width: 'calc(50% - 10px)' }}>
                参数类型
              </div>
              <div className="input-item title-item" style={{ width: '22.5%', marginRight: 0 }}>
                参数默认值
              </div>
            </div>
          )
        }
        <ul className="scroll-container">
          {
            hasValidData ? baseData.map((item, key) => this.renderItem(item, key)) : (
              <li className="key-value-input-item hint-color" style={{ textAlign: 'center' }}>
                {emptyText}
              </li>
            )
          }
        </ul>
        <Loading show={pending} containerId={`dmp-key-value-input-${this.uuid}`} />
      </div>
    )
  }

  // 渲染单行
  renderItem(item, index) {
    const { sysParams } = this.props
    const { name, required, values, description, type, key } = item
    const paramItem = _.find(_.cloneDeep(this.state.data), p => p.name === name) || {}
    const statusClass = classnames('icon-checkbox', { checked: paramItem.checked })
    // 查找是否属于系统参数
    const findSysParams = _.find(sysParams, d => d.key === key)

    return (
      <li key={`key-value-input-item-${this.uuid}-${index}`} className="key-value-input-item">
        <div className={classnames('checkbox-container', { disabled: required })}
          onClick={required ? null : this.handleToggleParamChecked.bind(this, index, paramItem.checked)}
        >
          <i className={statusClass}/>
        </div>
        <OverlayTrigger trigger="hover"
          placement="top"
          overlay={(<Tooltip>{description}</Tooltip>)}>
          <div className="input-item param-name-item" style={{ width: 'calc(27.5% - 30px)', minWidth: '80px' }}>
            {required && <i className="required">*</i>}
            {name}
          </div>
        </OverlayTrigger>
        
        <div className="input-item mid" style={{ minWidth: '190px', width: 'calc(50% - 10px)' }}>
          <div className="input-item fork-select-item" style={{
            fontSize: '12px',
            minWidth: '105px',
            width: type === 'fixed' ? '100%' : 'calc(55% - 5px)',
            lineHeight: '30px',
            cursor: 'default'
          }}>
            {this.DEFAULT_TYPES[type]}
          </div>
          {
            type !== 'fixed' ? (
              <div className="input-item fork-select-item" style={{
                fontSize: '12px',
                minWidth: '75px',
                width: 'calc(45% - 5px)',
                lineHeight: '30px',
                cursor: 'default',
                marginRight: 0
              }}>
                {findSysParams ? findSysParams.description : key}
              </div>
            ) : null
          }
        </div>
        {
          type === 'sys' ? (
            <div className="input-item fork-select-item" style={{
              fontSize: '12px',
              width: '22.5%',
              lineHeight: '30px',
              cursor: 'default',
              marginRight: 0
            }}>
              {paramItem.value}
            </div>
          ) : (
            <InputWithHintBox
              className="input-item last"
              style={{ width: '22.5%', marginRight: 0 }}
              height={30}
              inputClassName="input-text"
              readOnly={true}
              data={paramItem.value}
              hintData={values}
              onChange={this.handleSelected.bind(this, index)}
            />
          )
        }
      </li>
    )
  }

  // 修改参数是否选中
  handleToggleParamChecked(index, currChecked) {
    // copy原data
    const newData = this.state.data.concat()
    // 写入修改
    newData[index].checked = !currChecked
    // 同步
    this.props.onChange(newData)
  }

  // 选择change
  handleSelected(index, value) {
    // copy原data
    const newData = this.state.data.concat()
    // 如果没有发生改变 不处理
    if (newData[index].value === value) {
      return;
    }
    // 写入修改
    newData[index].value = value
    // 同步
    this.props.onChange(newData)
  }

  // 默认类型
  DEFAULT_TYPES = {
    query: 'URL查询参数',
    sys: '系统内置参数',
    fixed: '固定参数'
  };
}

export default KeyValueInput;
