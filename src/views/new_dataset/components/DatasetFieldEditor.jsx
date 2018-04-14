import React from 'react';
import PropTypes from 'prop-types'
import classnames from 'classnames'

import Select from 'react-bootstrap-myui/lib/Select';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Tooltip from 'react-bootstrap-myui/lib/Tooltip';
import Loading from 'react-bootstrap-myui/lib/Loading';
import EditableCell from '../../../components/EditableCell';

import { DATASET_FIELD_TYPES } from '../constants';
import './dataset-field-editor.less';

class DatasetFieldEditor extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    onUpdate: PropTypes.func,
    pending: PropTypes.bool,
    // @keys: field_group alias_name data_type format visible
    fieldLock: PropTypes.object,
    editable: PropTypes.bool,
  };

  static defaultProps = {
    fieldLock: {},
    editable: true
  };

  constructor(props) {
    super(props);
    this.state = {
      keySpreads: {},
      fieldGroupMenu: {
        show: false,
        target: null
      }
    };

    this.DEFAULT_TH_WIDTH_ARRAY = ['', '220px', '100px', '210px', '70px'];
  }

  render() {
    const { data, pending, style } = this.props;

    return (
      <div className="data-table-wrapper dataset-field-edit-table" id="dataset-field-edit-table" style={style}>
        {
          !data ? (
            <div className="empty-text-cell hint-color"
              style={{ width: '100%', lineHeight: '100px', textAlign: 'center', fontSize: '16px' }}>
              暂无数据
            </div>
          ) : (
            <table className="data-table"
              style={this.STYLE_SHEET.table}>
              <thead style={{ display: 'block' }}>
                <tr style={{ ...this.STYLE_SHEET.theadTr, paddingRight: `${this._checkScrollBarExist() ? 12 : 0}px` }}>
                  <th style={this.STYLE_SHEET.baseTd_1}>名称</th>
                  <th style={this.STYLE_SHEET.baseTd_2}>别名</th>
                  <th style={this.STYLE_SHEET.baseTd_3}>数据类型</th>
                  <th style={this.STYLE_SHEET.baseTd_5}>可见性</th>
                </tr>
              </thead>
              <tbody ref={(node) => { this.dataset_field_edit_table_body = node }} style={this.STYLE_SHEET.tbody}>
                {
                  data && Object.keys(data).map(key => this.renderGroupTr(key, data[key]))
                }
              </tbody>
            </table>
          )
        }
        <Loading show={pending} containerId="dataset-field-edit-table"/>
      </div>
    );
  }

  // 渲染字段类型组
  renderGroupTr(keyName, data) {
    const spread = this.state.keySpreads[keyName] === undefined ? true : this.state.keySpreads[keyName];

    const hasChildren = Array.isArray(data) && data.length > 0;

    const STYLES = {
      tr: {
        display: 'flex',
        flexDirection: 'row',
        height: '30px'
      },
      td: {
        paddingLeft: '50px',
        height: '24px',
        position: 'relative',
        width: '100%',
        display: 'block'
      },
      iconBox: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%'
      },
      triangle: {
        position: 'absolute',
        fontSize: '12px',
        left: '10px',
        top: '50%',
        transform: `scale(.75) translateY(-50%) ${spread ? '' : 'rotateZ(-90deg)'}`
      },
      folder: {
        position: 'absolute',
        fontSize: '14px',
        left: '26px',
        top: '50%',
        transform: 'translateY(-50%)'
      }
    }

    const keyTr = [(
      <tr key={keyName}
        className="dataset-field-key-tr"
        style={STYLES.tr}
        onClick={this.handleToggleKeySpread.bind(this, keyName, spread)}>
        <td colSpan={5} style={STYLES.td}>
          {
            hasChildren && spread ? (
              <div style={{ position: 'absolute', left: '0px', top: '0px', height: '100%' }}>
                <i className="dmpicon-triangle" style={STYLES.triangle}/>
                <i className="dmpicon-folder-open folder-icon" style={STYLES.folder}/>
              </div>
            ) : (
              <div style={{ position: 'absolute', left: '0px', top: '0px', height: '100%' }}>
                <i className="dmpicon-triangle" style={STYLES.triangle}/>
                <i className="dmpicon-folder-close folder-icon" style={STYLES.folder}/>
              </div>
            )
          }
          {keyName}
        </td>
      </tr>
    )];

    if (spread && hasChildren) {
      return keyTr.concat(data.map((item, index) => this.renderFieldTr(keyName, item, index)));
    }
    return keyTr;
  }

  // 渲染字段
  renderFieldTr(key, data, index) {
    // 字段可编辑状态
    const { fieldLock, editable } = this.props
    // 字段类型数组
    const colTypes = Object.getOwnPropertyNames(DATASET_FIELD_TYPES).map(_key => DATASET_FIELD_TYPES[_key]);
    
    const checkboxClass = classnames('icon-checkbox', {
      checked: +data.visible === 1
    })
    const fieldGroupClass = classnames('data-field-col-name-td', {
      locked: fieldLock.field_group
    })
    return (
      <tr style={{ ...this.STYLE_SHEET.tbodyTr, pointerEvents: editable ? 'unset' : 'none' }} key={`${key}-${index}`}>
        <td style={{ position: 'relative', ...this.STYLE_SHEET.baseTd_1 }}
          className={fieldGroupClass}
          ref={`col-name-${data.col_name}`}>
          <OverlayTrigger trigger="hover"
            placement="top"
            overlay={(<Tooltip>{data.col_name}</Tooltip>)}>
            <div style={{ width: '100%', height: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {DATASET_FIELD_TYPES[data.data_type].icon}
              {data.col_name}
            </div>
          </OverlayTrigger>
          {
            !fieldLock.field_group && (
              <span className="link-btn" onClick={this.handleChangeDataType.bind(this, data, key, index, 'field_group', data.col_name, data.field_group, key === '度量' ? '维度' : '度量')}>{`改为${key === '度量' ? '维度' : '度量'}`}</span>
            )
          }
        </td>
        <td style={{ padding: '0px', ...this.STYLE_SHEET.baseTd_2 }}>
          {
            fieldLock.alias_name ? (
              data.alias_name ? (
                <OverlayTrigger trigger="hover"
                  placement="top"
                  overlay={(<Tooltip>{data.alias_name}</Tooltip>)}>
                  <div style={{ whiteSpace: 'nowrap', width: '100%', height: '100%', padding: '0 14px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {data.alias_name}
                  </div>
                </OverlayTrigger>
              ) : (
                <div style={{ width: '100%', height: '100%', padding: '0 14px' }}></div>
              )
            ) : (
              <EditableCell
                data={data.alias_name}
                placeholder="请输入别名"
                hastip={true}
                lineHeight={24}
                fontSize={12}
                onCheck={this.handleConfirmCellText.bind(this, data, key, index, 'alias_name', data.col_name, data.alias_name)}
              />
            )
          }
        </td>
        <td style={{ padding: '0px', whiteSpace: 'nowrap', ...this.STYLE_SHEET.baseTd_3 }}>
          <Select value={data.data_type}
            maxHeight={150}
            width="100%"
            disabled={fieldLock.data_type}
            openSearch={false}
            onSelected={this.handleChangeDataType.bind(this, data, key, index, 'data_type', data.col_name, data.data_type)}>
            {
              colTypes.map((item, _key) => <option value={item.type} key={_key}>{item.name}</option>)
            }
          </Select>
        </td>
        <td style={{ padding: '0px', whiteSpace: 'nowrap', ...this.STYLE_SHEET.baseTd_5 }}>
          <div style={{ width: '100%', textAlign: 'center', cursor: fieldLock.visible ? 'not-allowed' : 'pointer' }}
            onClick={fieldLock.visible ? null : this.handleToggleVisible.bind(this, data, key, index, 'visible', data.col_name, data.visible)}>
            <i className={checkboxClass} style={{ margin: '0px' }} />
          </div>
        </td>
      </tr>
    );
  }

  // 切换字段类型展开
  handleToggleKeySpread(key, currSpread) {
    this.setState({
      keySpreads: {
        ...this.state.keySpreads,
        [key]: !currSpread
      }
    });
  }

  // 更改数据类型
  handleChangeDataType(item, groupKey, index, key, col_name, defaultValue, opts) {
    const value = key === 'field_group' ? opts : opts.value
    if (defaultValue === value) {
      return;
    }
    // 不再这样通过 redux 
    this.props.onUpdate({
      ...item,
      groupKey,
      index,
      key,
      col_name,
      value
    });
  }

  // 提交单元格内容
  handleConfirmCellText(item, groupKey, index, key, col_name, defaultValue, value) {
    if (defaultValue === value) {
      return;
    }
    this.props.onUpdate({
      ...item,
      groupKey,
      index,
      key,
      col_name,
      value
    });
  }

  // 修改字段可见性
  handleToggleVisible(item, groupKey, index, key, col_name, visible = 0) {
    this.props.onUpdate({
      ...item,
      groupKey,
      index,
      key,
      col_name,
      value: +visible === 1 ? 0 : 1
    });
  }

  // 检测是否有滚动条
  _checkScrollBarExist() {
    if (!this.dataset_field_edit_table_body) {
      return false;
    }

    const { clientHeight, scrollHeight } = this.dataset_field_edit_table_body;

    return scrollHeight > clientHeight;
  }

  STYLE_SHEET = {
    table: {
      width: '100%',
      height: '100%',
      display: 'flex',
      overflowX: 'auto',
      flexDirection: 'column'
    },
    theadTr: {
      display: 'flex',
      height: '30px',
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    tbody: {
      display: 'block',
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden'
    },
    tbodyTr: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    baseTd_1: {
      display: 'block',
      minWidth: '150px',
      flex: '1 1 20%'
    },
    baseTd_2: {
      display: 'block',
      minWidth: '220px',
      flex: '1 1 20%'
    },
    baseTd_3: {
      display: 'block',
      width: '100px'
    },
    baseTd_4: {
      display: 'block',
      width: '210px'
    },
    baseTd_5: {
      display: 'block',
      width: '70px'
    },
  };
}

export default DatasetFieldEditor;
