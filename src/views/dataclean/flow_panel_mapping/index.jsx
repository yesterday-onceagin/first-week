import React from 'react';

import createReactClass from 'create-react-class';

import Button from 'react-bootstrap-myui/lib/Button';
import Select from 'react-bootstrap-myui/lib/Select';
import Input from 'react-bootstrap-myui/lib/Input';
import MapColumnDialog from '../components/MapColumnDialog';
import Loading from 'react-bootstrap-myui/lib/Loading';
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger';
import Popover from 'react-bootstrap-myui/lib/Popover';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as dataCleanFlowActionCreators } from '../../../redux/modules/dataclean/flow';
import { actions as dataCleanActionCreators } from '../../../redux/modules/dataclean/dataclean';

import classnames from 'classnames';
import TipMixin from '../../../helpers/TipMixin';
import { DEFAULT_MAP_OPTIONS } from '../constants/map';
import './index.less';

const FlowPanelMapping = createReactClass({
  displayName: 'FlowPanelMapping',
  mixins: [TipMixin],

  getInitialState() {
    return {
      uuid: new Date().getTime(),
      isEdit: false,
      isRun: false,
      processActive: 0,
      tables: [], // 待映射表
      columns: [], // 表的列
      column_key: '',
      table: '',
      type: '维度', // 维度指标  其他指标
      mapping: {}, // 映射的内容
      regex_mapping: {}, // 正则表达式
      pending: false,
      dimColums: [], // 维度类指标
      mapCloumnDialog: {
        show: false,
        active: -1
      }
    }
  },

  componentDidMount() {
    const { actions, nodeData } = this.props

    actions.fetchTables(DEFAULT_MAP_OPTIONS.odps, {
      page_size: 100000
    }, (json) => {
      if (json.result) {
        this.setState({
          tables: json.data.items
        })
      }
    })

    // content 内容存在的情况下
    if (nodeData.content) {
      const content = (typeof nodeData.content === 'string') ? JSON.parse(nodeData.content) : nodeData.content
      const {
        table_name,
        mapping,
        regex_mapping
      } = content

      this.setState({
        table: table_name,
        pending: true,
        mapping: mapping ? { ...mapping } : {},
        regex_mapping: regex_mapping ? { ...regex_mapping } : {}
      }, () => {
        this._updateColumns(content.table_name)
      })
    }
  },

  componentWillReceiveProps(nextProps) {
    // 如果从不显示切换到显示 则重新获取数据表(避免从SQL节点执行完回来表有变化)
    if (!this.props.show && nextProps.show) {
      this.props.actions.fetchTables(DEFAULT_MAP_OPTIONS.odps, {
        page_size: 100000
      }, (json) => {
        if (json.result) {
          this.setState({
            tables: json.data.items
          })
        }
      })
    }
  },

  render() {
    const {
      style,
      nodeData
    } = this.props;

    const {
      pending,
      tables,
      table,
      mapCloumnDialog,
      columns,
      column_key,
      uuid,
      type
    } = this.state;

    const _columns = columns.filter(item => item.show && item.dimType === type);

    return (
      <div className="flow-panel-mapping" style={style} id={`flow-panel-mapping-${nodeData.id}`}>
        <div style={{
          padding: '30px 30px 0',
          height: '100%',
          width: '100%',
          position: 'relative'
        }}>
          <div className="form-group" style={{
            width: '450px',
            paddingBottom: '30px',
            marginBottom: '0px'
          }}>
            <label className="control-label">
              <span><i className="required">*</i>选择待映射表</span>
            </label>
            <div className="input-wrapper">
              <Select value={table}
                openSearch
                width="100%"
                maxHeight={180}
                onSelected={this.handleSelect.bind(this, 'table')}
              >
                {
                  tables.map((item, i) => <option key={i} value={item.name}>{item.name}</option>)
                }
              </Select>
            </div>
          </div>

          <div style={this.STYLE_SHEET.container} className="second-process">
            <div className="title">
              <span onClick={this.handleSwitch.bind(this, '维度')}
                className={type === '维度' ? 'active' : ''}
              >
                维度指标
              </span>
              <span onClick={this.handleSwitch.bind(this, '其他')}
                className={type === '其他' ? 'active' : ''}
              >
                其他指标
              </span>
              <div className="form single-search-form" style={{ float: 'right', width: '310px' }}>
                <Input type="text"
                  placeholder="请输入关键字"
                  value={column_key}
                  onChange={this.handleFilterCloumns}
                  addonAfter={<i className="dmpicon-search" />}
                  className="search-input-box"
                />
                {
                  column_key && <i className="dmpicon-close" onClick={this.handleClearKeyword} />
                }
              </div>
            </div>
            <div className="main-wrap">
              <div className="item-wrap" id={`item-wrap-${uuid}`}>
                {
                  table ? (
                    _columns.length > 0 ? columns.map((item, i) => this.renderItem(item, i)) : (
                      <div className="nothing">未找到相关数据！</div>
                    )
                  ) : (
                    <div className="nothing">请先在上方选择待映射表</div>
                  )
                }
              </div>
            </div>
          </div>

          <Button bsStyle="primary"
            className="flow-node-foot-save-btn"
            style={this.STYLE_SHEET.saveBtn}
            onClick={this.handleSave}
          >
            保存
          </Button>
        </div>
        {
          mapCloumnDialog.show && (
            <MapColumnDialog
              show={mapCloumnDialog.show}
              active={mapCloumnDialog.active}
              data={columns[mapCloumnDialog.active]}
              events={{
                onHide: this.handleCloseDialog,
                onSave: this.handleSaveItemMap
              }}
            />
          )
        }
        <Loading show={pending} containerId={`flow-panel-mapping-${nodeData.id}`} />
      </div>
    );
  },

  renderItem(item, index) {
    const menuItems = (
      <Popover className="mapping-tool-pop">
        <div className="item"
          style={{ cursor: 'pointer' }}
          onClick={this.handleCancelMap.bind(this, index)}
        >
          取消映射
        </div>
      </Popover>
    );

    const isValidItem = item && item.show && item.dimType === this.state.type

    return isValidItem ? (
      <div className={classnames('item', { map: this._hasMap(item) })}
        onClick={this.handleOpenDialog.bind(this, index)}
      >
        <div className="item-head">
          <span className="node dmpicon-mapping" />
          <span className="name" title={item.dimName ? `${item.name}（${item.dimName}）` : item.name}>
            {item.dimName ? `${item.name}（${item.dimName}）` : item.name}
          </span>
          {
            this._hasMap(item) && (
              <span className="map-btn">
                <OverlayTrigger
                  trigger="click"
                  placement="bottom"
                  rootClose
                  overlay={menuItems}
                  onClick={(e) => { e.stopPropagation() }}
                >
                  <i className="dmpicon-more" />
                </OverlayTrigger>
              </span>
            )
          }
        </div>
      </div>
    ) : null
  },

  handleSwitch(type) {
    this.setState({
      type
    })
  },

  handleOpenDialog(index) {
    this.setState({
      mapCloumnDialog: {
        show: true,
        active: index
      }
    }, () => {
      this._fetchColumnValue(index);
    })
  },

  handleCloseDialog() {
    const index = this.state.mapCloumnDialog.active;
    const item = this.state.columns[index];
    const column_map = this.state.mapping ? this.state.mapping[item.name] : null;

    if (item.values && item.values.length > 0) {
      this.state.columns[index].values = item.values.map(value => ({
        ...value,
        map: column_map ? (column_map[value.value] || '') : ''
      }))
    }

    this.setState({
      ...this.state,
      mapCloumnDialog: {
        show: false,
        active: -1
      }
    })
  },

  handleSaveItemMap(index, data) {
    let values = {}
    if (Array.isArray(data.values)) {
      data.values.forEach((value) => {
        values = {
          ...values,
          [value.value]: value.map
        }
      })
    }
    this.state.columns[index] = data
    // 取消弹窗
    this.setState({
      columns: this.state.columns,
      mapping: {
        ...this.state.mapping,
        [data.name]: values
      },
      regex_mapping: {
        ...this.state.regex_mapping,
        [data.name]: data.regex || []
      },
      mapCloumnDialog: {
        show: false,
        active: -1
      }
    })
  },

  handleFilterCloumns(e) {
    const value = e.target.value
    this.setState({
      column_key: value
    }, () => {
      this.state.columns = this.state.columns.map((item) => {
        // 如果没有匹配
        item.show = item.name.indexOf(value) > -1
        return item
      })
      this.setState({ ...this.state })
    })
  },

  handleClearKeyword() {
    this.setState({
      column_key: ''
    }, () => {
      this.state.columns = this.state.columns.map((item) => {
        // 如果没有匹配
        item.show = true
        return item
      })
      this.setState({ ...this.state })
    })
  },

  handleCancelMap(index) {
    // 清除 maping 的数据,
    const item = this.state.columns[index];
    const map = this.state.mapping[item.name];

    if (map) {
      Object.keys(map).forEach((key) => {
        this.state.mapping[item.name][key] = ''
      });
    }

    this.state.columns[index].values = this.state.columns[index].values ? this.state.columns[index].values.map((v) => {
      v.map = '';
      return v;
    }) : [];

    // 清除regex_maping映射
    if (this.state.regex_mapping) {
      this.state.regex_mapping[item.name] = [];
    }

    // 清除columns[index]中的数据
    this.state.columns[index].regex = [];

    this.setState({
      ...this.state
    });
  },

  handleSelect(field, option) {
    if (field === 'table' && option.value !== this.state.table) {
      this.state.pending = true
      this._updateColumns(option.value)
    }
    this.state[field] = option.value
    this.setState({
      ...this.state
    })
  },

  handleSave() {
    const { actions, nodeData, events } = this.props;
    const { table, columns } = this.state;

    if (!table) {
      this.showErr('请先在上方选择待映射表');
      return;
    }

    Array.isArray(columns) && columns.forEach((item) => {
      // 重置 values
      if (Array.isArray(item.values)) {
        let values = {}
        item.values.forEach((value) => {
          values = {
            ...values,
            [value.value]: value.map
          }
        })
        this.state.mapping = {
          ...this.state.mapping,
          [item.name]: values
        }
      }
      // 重置 regex
      this.state.regex_mapping = {
        ...this.state.regex_mapping,
        [item.name]: item.regex || []
      }
    });

    const node = {
      ...nodeData,
      content: {
        table_name: table,
        mapping: this.state.mapping,
        regex_mapping: this.state.regex_mapping
      }
    }

    /*
     * 过滤掉为空的映射关系
     * 规则映射
     * 维度映射
     */
    Object.keys(node.content.mapping).forEach((item) => {
      // key == "" 
      if (!item && !node.content.mapping[item]) {
        delete node.content.mapping[item]
      } else {
        const data = node.content.mapping[item]
        // 规则为空的字段去掉
        Object.keys(data).forEach((d) => {
          if (!data[d]) {
            delete node.content.mapping[item][d]
          }
        })
      }
    })
    // maping 可能会导致 内层映射全被删除而 为 a:｛｝
    Object.keys(node.content.mapping).forEach((item) => {
      if (Object.values(node.content.mapping[item]).length === 0) {
        delete node.content.mapping[item]
      }
    })

    // 规则映射去掉不完整的映射
    Object.keys(node.content.regex_mapping).forEach((item) => {
      // key == ""
      if (!item && node.content.regex_mapping[item].length === 0) {
        delete node.content.regex_mapping[item]
      } else {
        // 规则为空
        const data = node.content.regex_mapping[item]
        const _data = []
        data.forEach((_item) => {
          if (!!_item.pattern && !!_item.value) {
            // 直接去掉的话。会影响后面的循环顺序
            _data.push(_item)
          }
        })
        node.content.regex_mapping[item] = _data
        if (_data.length === 0) {
          delete node.content.regex_mapping[item]
        }
      }
    });

    actions.updateFlowNode(node, (json) => {
      if (json.result) {
        // 成功提交
        this.showSucc(json.msg);
        setTimeout(() => {
          events.onCloseTab(nodeData, null);
          events.onReturnToMain();
        }, 1800)
      } else {
        this.showErr(json.msg)
      }
    })
  },

  _updateColumns(table) {
    const { actions } = this.props
    const params = {
      id: DEFAULT_MAP_OPTIONS.odps,
      table_name: table,
      page_size: 10000
    }
    // 获取维度指标. 并入 cloumns
    actions.fetchDimIndicator({
      table_name: table,
      type: '维度'
    }, (json) => {
      if (json.result) {
        // 保存 维度类指标
        this.setState({
          dimColums: json.data
        }, () => {
          // loading
          actions.fetchRDSTableCloumns(params, (_json) => {
            if (_json.result) {
              this.state.columns = _json.data.items ? _json.data.items.filter(item => !item.is_partition) : []
              // 每项都是默认显示的
              // 将维度数据同步到 cloumns
              this.state.columns = this.state.columns.map((item) => {
                const dimColumn = json.data.filter(data => item.name === data.odps_field)
                // 如果是维度
                if (dimColumn.length > 0) {
                  item = {
                    ...item,
                    dimType: dimColumn[0].type,
                    id: dimColumn[0].id,
                    dimName: dimColumn[0].name
                  }
                } else {
                  item.dimType = '其他'
                }
                // 默认为可显示
                item.show = true
                item.pending = true
                return item
              });

              this.state.pending = false;
              // 当没有维度类指标时，将TAB定位到其他
              if (!Array.isArray(this.state.dimColums) || this.state.dimColums.length === 0) {
                this.state.type = '其他';
              }

              this.setState({ ...this.state });
            }

            this.setState({ pending: false });
          })
        })
      } else {
        this.setState({ pending: false })
      }
    })
  },

  _fetchColumnValue(index) {
    const { actions } = this.props
    // 单个列
    const item = this.state.columns[index]
    let maps = []
    const column_map = this.state.mapping ? this.state.mapping[item.name] : null
    const regex = this.state.regex_mapping ? this.state.regex_mapping[item.name] : []

    if (regex) {
      this.state.columns[index].regex = regex;
      this.setState({ ...this.state });
    }
    // values 存在。则立即同步maping信息
    if (item.values && item.values.length > 0) {
      this.state.columns[index].values = item.values.map(value => ({
        ...value,
        map: column_map ? (column_map[value.value] || '') : ''
      }))
      this.setState({ ...this.state });
      return;
    }
    // 开始请求columns 数据
    item.pending = true

    const fetchValue = () => {
      actions.fetchTableColumnValue({
        id: DEFAULT_MAP_OPTIONS.odps,
        table_name: this.state.table,
        column_name: item.name
      }, (__json) => {
        if (__json.data && __json.result) {
          item.values = __json.data.items.map((_item) => {
            const _map = column_map ? column_map[_item.value] : ''
            return Object.assign(_item, {
              map: _map,
              maps
            })
          })
        }
        // loading 结束
        item.pending = false
        this.state.columns[index] = { ...item }
        this.setState({ ...this.state })
      })
    }

    if (item.id) {
      actions.fetchTableColumnDimension({
        indicator_id: item.id
      }, (_json) => {
        if (_json.data) {
          maps = _json.data
        }
        fetchValue()
      })
    } else {
      fetchValue()
    }
  },

  _hasMap(item) {
    // 如果 当前 maping[item] 或者 regex_maping 不 为空的情况下.
    const mapping = this.state.mapping ? (this.state.mapping[item.name] || {}) : {}
    const regex_mapping = this.state.regex_mapping ? (this.state.regex_mapping[item.name] || []) : []

    return regex_mapping.some(item => !!item.value) || Object.values(mapping).some(item => !!item)
  },

  // 错误提示框
  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    })
  },

  // 成功提示框
  showSucc(str) {
    this.showTip({
      status: 'success',
      content: str
    })
  },

  STYLE_SHEET: {
    container: {
      position: 'absolute',
      left: '30px',
      top: '127px',
      right: '30px',
      bottom: '80px',
      height: 'auto',
    },
    saveBtn: {
      position: 'absolute',
      bottom: '50px',
      left: '30px',
      width: '100px',
      minWidth: '100px',
      height: '34px',
      lineHeight: '34px'
    }
  },
})

const stateToProps = state => ({
  ...state.dataclean_flow
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(Object.assign({}, dataCleanFlowActionCreators, dataCleanActionCreators), dispatch)
})

export default connect(stateToProps, dispatchToProps)(FlowPanelMapping);
