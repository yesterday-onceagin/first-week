import React from 'react';
import PropTypes from 'prop-types'

import classnames from 'classnames';
import _ from 'lodash';

import NumberValue from './NumberValue';

import { TEXT_FONT_ALIGNS } from '../../constants/fontOptions'

/*
  简单单图-文本框配置项
*/
class SimpleTextConfig extends NumberValue {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    const { configInfo } = props
    this.state = {
      field: 'text',
      data: {
        content: configInfo && configInfo.content,
        fontSize: configInfo && configInfo.fontSize,
        color: configInfo && configInfo.color,
        fontStyle: configInfo && configInfo.fontStyle,
        textAlign: configInfo && configInfo.textAlign,
        lineHeight: configInfo && configInfo.lineHeight
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.configInfo, nextProps.configInfo)) {
      this.setState({
        data: _.cloneDeep(nextProps.configInfo)
      })
    }
    if (nextProps.field) {
      this.state.field = nextProps.field
    }
  }

  render() {
    const { field, data } = this.state
    const { content, textAlign } = data

    return (
      <div className="content">
        <div className="layout-config-column form" style={{
          padding: '0 0 10px 0',
          height: '90px'
        }}>
          <textarea className="simple-text-item-text"
            style={this.STYLE_SHEET.simpleTextarea}
            placeholder="请输入文本内容"
            onChange={this.handleChangeSimpleText.bind(this, false)}
            onBlur={this.handleChangeSimpleText.bind(this, true)}
            defaultValue={content}
            value={content}
          />
        </div>
        <NumberValue field={field} {...this.props} />

        <div className="layout-config-column">
          <span className="layout-config-column-title">对齐</span>
          {
            TEXT_FONT_ALIGNS.map((item) => {
              const clsName = classnames('diagram-title-font-align-icon', {
                [item.icon]: true,
                active: item.key === textAlign
              })
              return (
                <i key={`diagram-simple-text-font-align-${item.key}`}
                  title={item.name}
                  className={clsName}
                  onClick={this.handleChange.bind(this, 'textAlign', item.key)}
                />
              )
            })
          }
        </div>
      </div>
    );
  }

  // 更改文字内容
  handleChangeSimpleText(needUpdate, e) {
    const newValue = e.target.value
    this.state.data.content = newValue
    this.setState({ ...this.state })
    // 是否保存
    if (needUpdate) {
      this.props.onChange(this.state.field, 'content', newValue)
    }
  }

  // 更改文字对齐
  handleChange(type, value) {
    _.set(this.state.data, type, value)
    this.setState({ ...this.state }, () => {
      this.props.onChange(this.state.field, type, value)
    })
  }

  STYLE_SHEET = {
    simpleTextarea: {
      width: '100%',
      height: '80px',
      fontSize: '12px',
      lineHeight: '18px',
      padding: '6px 10px'
    }
  };
}

export default SimpleTextConfig
