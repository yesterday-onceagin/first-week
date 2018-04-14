import PropTypes from 'prop-types';
import React from 'react';

import createReactClass from 'create-react-class';

import Loading from 'react-bootstrap-myui/lib/Loading';
import DataTable from 'react-bootstrap-myui/lib/DataTable';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

import AuthComponent from '@components/AuthComponent';

import TypeDialog from './TypeDialog';
import IndicatorDialog from './IndicatorDialog';
import IconButton from '../../../components/IconButton';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actions as indicatorActionCreators } from '../../../redux/modules/indicator/indicator';

import TipMixin from '../../../helpers/TipMixin';
import ConfirmMixin from '../../../helpers/ConfirmsMixin';

const TypeDefine = createReactClass({
  displayName: 'TypeDefine',
  mixins: [TipMixin, ConfirmMixin],

  propTypes: {
    templateId: PropTypes.string.isRequired,
    editable: PropTypes.bool
  },

  getInitialState() {
    return {
      currTypeId: '',
      typeDialog: {
        show: false,
        info: {}
      },
      indicatorDialog: {
        show: false,
        info: {}
      }
    }
  },

  componentDidMount() {
    // 获取指标类型列表
    this._getTypeList();
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.typeList.length > 0 && nextProps.typeList.length === 0 && this.state.currTypeId) {
      this.setState({
        currTypeId: ''
      });
    }
  },

  render() {
    const { typeDialog, indicatorDialog } = this.state;
    return (
      <div className="indicator-define" style={this.props.style}>
        <div className="type-list-container" style={this.STYLE_SHEET.typeListContainer}>
          {this.renderTypes()}
          <div className="type-define-split-line" style={this.STYLE_SHEET.splitLine}></div>
        </div>
        <div className="indicator-list-container" style={this.STYLE_SHEET.indicatorListContainer}>
          {this.renderIndicators()}
        </div>
        {
          typeDialog.show && (
            <TypeDialog
              show={typeDialog.show}
              data={typeDialog.info}
              onSure={this.handleSubmitType.bind(this)}
              onHide={this.handleCloseTypeDialog.bind(this)}
            />
          )
        }
        {
          indicatorDialog.show && (
            <IndicatorDialog
              show={indicatorDialog.show}
              pending={this.props.pending_detail}
              data={indicatorDialog.info}
              fetchIndicatorData={this.props.actions.fetchIndicatorData}
              onSure={this.handleSubmitIndicator.bind(this)}
              onHide={this.handleCloseIndicatorDialog.bind(this)}
            />
          )
        }
      </div>
    );
  },

  // 指标类型列表
  renderTypes() {
    const { pending, typeList, editable } = this.props;
    const { currTypeId } = this.state;

    const SortableItem = SortableElement(({ item }) => {
      const clsName = `sortable-item  ${currTypeId && currTypeId === item.id ? 'active' : ''}`

      return (
        <li className={clsName} style={this.STYLE_SHEET.sortableItem} onClick={() => {
          this.handleSelectType(item.id);
        }}>
          {item.name}
          {
            editable && <span className="sortable-item-action-bar" style={this.STYLE_SHEET.leftActBar}>
              <i className="dmpicon-edit"
                style={{ marginRight: '18px', cursor: 'pointer' }}
                onClick={this.handleOpenTypeDialog.bind(this, item)}
              />
              <i className="dmpicon-del"
                style={{ cursor: 'pointer' }}
                onClick={this.handleDeleteType.bind(this, item)}
              />
            </span>
          }
        </li>
      );
    });

    const SortableList = SortableContainer(({ items }) => (
      <ul className="sortable-list indicator-type-list">
        {
          items.map((item, index) => (
            <SortableItem key={item.id} index={index} item={item} disabled={false}/>
          ))
        }
      </ul>
    ));

    return (
      <div id="type-data-table-wrapper" style={{ width: '100%', height: '100%', display: 'flex', flex: 1, flexDirection: 'column' }}>
        <AuthComponent pagecode='指标定义' visiblecode="edit">
          <div className="type-add-btn"
            style={this.STYLE_SHEET.typeAddBtn}
            onClick={this.handleOpenTypeDialog.bind(this, null)}
          >
            <i className="dmpicon-add" style={this.STYLE_SHEET.typeAddIcon} />
            添加指标类型
          </div>
        </AuthComponent>
        <div style={this.STYLE_SHEET.listBox}>
          {
            Array.isArray(typeList) && typeList.length > 0 ? (
              <AuthComponent pagecode='指标定义'>
                <SortableList
                  items={typeList}
                  lockAxis="y"
                  distance={10}
                  lockToContainerEdges={true}
                  onSortEnd={this.handleMoveType}
                />
              </AuthComponent>
            ) : (
              <div style={{ paddingTop: '30px', textAlign: 'center' }}>
                  暂无指标类型
                <a href="javascript:;"
                  style={{ paddingLeft: '8px' }}
                  onClick={this.handleOpenTypeDialog.bind(this, null)}
                >
                    请添加
                </a>
              </div>
            )
          }
        </div>

        <Loading show={pending} containerId="type-data-table-wrapper" />
      </div>
    );
  },

  // 指标列表
  renderIndicators() {
    const { pending_indicator, indicatorList, editable } = this.props;

    const dataFields = [{
      idField: true,
      name: 'id'
    }, {
      name: 'name',
      text: '指标'
    }, {
      name: 'type',
      text: '类型'
    }, {
      name: 'column',
      text: '操作'
    }];

    if (!editable) {
      dataFields.splice(3, 1)
    }

    const rowTemplate = editable ? (
      <tr>
        <td>%id%</td>
        <td>%name%</td>
        <td>%type%</td>
        <td width="150" childrenNode={rowData => (
          <div className="data-table-action-bar" style={{ cursor: 'default', paddingTop: '8px' }}>
            <IconButton
              onClick={this.handleOpenIndicatorDialog.bind(this, rowData)}
              className="datatable-action"
              iconClass="dmpicon-edit"
            >
              编辑
            </IconButton>
            <IconButton
              onClick={this.handleDeleteIndicator.bind(this, rowData)}
              className="datatable-action"
              iconClass="dmpicon-del"
            >
              删除
            </IconButton>
          </div>
        )}></td>
      </tr>
    ) : (
      <tr>
        <td>%id%</td>
        <td>%name%</td>
        <td>%type%</td>
      </tr>
    );

    const emptyText = (
      <div>
        暂无指标
        {
          !this.state.currTypeId && editable && (
            <a href="javascript:;"
              style={{ paddingLeft: '8px' }}
              onClick={this.handleOpenTypeDialog.bind(this, null)}
            >
              请先添加指标类型
            </a>
          )
        }
      </div>
    );

    return (
      <div id="indicator-data-table-wrapper"
        style={{ width: '100%', height: '100%', position: 'relative' }}
      >
        <div className="indicator-list-title" style={this.STYLE_SHEET.indicatorListTitle}>
          指标列表
          {
            !!this.state.currTypeId && (
              <AuthComponent pagecode='指标定义' visiblecode="edit">
                <i className="dmpicon-add"
                  style={this.STYLE_SHEET.indicatorAddIcon}
                  onClick={this.handleOpenIndicatorDialog.bind(this, null)}
                />
              </AuthComponent>
            )
          }
        </div>

        <div className="indicator-list-box"
          style={this.STYLE_SHEET.listBox}
          onScroll={this.handleFixTableHead}
        >
          <AuthComponent pagecode='指标定义' editProp="sortable" enablePointer={true}>
            <DataTable
              tableWrapperId='indicator-datatable-wrapper'
              hover
              sortable
              onSortEnd={this.handleMoveIndicator}
              serialNumber={false}
              bordered={false}
              emptyText={emptyText}
              dataFields={dataFields}
              data={indicatorList}
              rowTemplate={rowTemplate}
            />
          </AuthComponent>
        </div>

        <Loading show={pending_indicator} containerId="indicator-data-table-wrapper" />
      </div>
    );
  },

  // 滚动固定表头
  handleFixTableHead(e) {
    const sTop = $(e.currentTarget).scrollTop();
    if (sTop > 0) {
      $('#indicator-datatable-wrapper thead')
        .addClass('scrolling-thead')
        .css({
          transform: `translateY(${sTop}px)`
        });
    } else {
      $('#indicator-datatable-wrapper thead')
        .removeClass('scrolling-thead')
        .css({
          transform: 'none'
        });
    }
  },

  // 打开添加/编辑指标类型弹窗
  handleOpenTypeDialog(data) {
    this.setState({
      typeDialog: {
        show: true,
        info: data || {}
      }
    });
  },

  // 提交添加/编辑指标类型
  handleSubmitType(data) {
    data.tmpl_id = this.props.templateId;

    if (!data.id) {
      // 新增
      this.props.actions.fetchAddType(data, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.handleCloseTypeDialog();
          this.showSucc(json.msg);
          if (!this.state.currTypeId) {
            this.setState({
              currTypeId: json.data
            });
          }
        }
      });
    } else {
      // 编辑
      this.props.actions.fetchUpdateType(data, (json) => {
        if (!json.result) {
          this.showErr(json.msg);
        } else {
          this.showSucc(json.msg);
          this.handleCloseTypeDialog();
        }
      })
    }
  },

  // 关闭添加/编辑指标类型弹窗
  handleCloseTypeDialog() {
    this.setState({
      typeDialog: {
        show: false,
        info: {}
      }
    });
  },

  // 删除指标类型
  handleDeleteType(type) {
    const typeList = this.props.typeList;
    const currTypeId = this.state.currTypeId;

    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该业务指标类型吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.fetchDeleteType(type.id, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg || '删除失败');
          } else {
            this.showSucc(json.msg || '删除成功');
            if (type.id === currTypeId) {
              // 如果删除的是当前选中的type时
              const remainTypes = typeList.filter(t => (t.id !== currTypeId));
              if (remainTypes.length > 0) {
                this.setState({
                  currTypeId: remainTypes[0].id
                });
                this._getIndicatorList(remainTypes[0].id);
              } else {
                this.setState({
                  currTypeId: ''
                });
                this.props.actions.clearIndicatorList();
              }
            }
          }
        })
      }
    });
  },

  // 选择指标类型
  handleSelectType(id) {
    this.setState({ currTypeId: id });
    this._getIndicatorList(id);
  },

  // 拖动指标类型
  handleMoveType({ oldIndex, newIndex }) {
    const typeList = this.props.typeList;
    const source_id = typeList[oldIndex].id;
    let target_id = '';

    if (oldIndex === newIndex) {
      return;
    } else if (oldIndex > newIndex) {
      target_id = typeList[newIndex].id;
    } else {
      target_id = typeList[newIndex + 1] ? typeList[newIndex + 1].id : '';
    }

    this.props.actions.fetchRankType({
      tmpl_id: this.props.templateId,
      source_id,
      target_id,
      oldIndex,
      newIndex
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      }
    });
  },

  // 打开添加/编辑指标窗口
  handleOpenIndicatorDialog(data) {
    this.setState({
      indicatorDialog: {
        show: true,
        info: data || {}
      }
    })
  },

  // 提交指标新增/编辑
  handleSubmitIndicator(data) {
    const { templateId, actions } = this.props;
    data.tmpl_id = templateId;
    data.type_id = this.state.currTypeId;

    // 判断是新增还是编辑
    const fetchFunc = !data.id ? actions.fetchAddIndicator : actions.fetchUpdateIndicator;

    fetchFunc(data, (json) => {
      if (json.result) {
        this.showSucc(json.msg);
        this.handleCloseIndicatorDialog();
      } else {
        this.showErr(json.msg);
      }
    });
  },

  // 关闭指标添加/编辑窗口
  handleCloseIndicatorDialog() {
    this.setState({
      indicatorDialog: {
        show: false,
        info: {}
      }
    })
  },

  // 删除指标
  handleDeleteIndicator(indicator) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该业务指标吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.fetchDeleteIndicator(indicator.id, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg || '删除失败');
          } else {
            this.showSucc(json.msg || '删除成功');
          }
        })
      }
    });
  },

  // 拖动指标
  handleMoveIndicator({ row_id, data, after_id }) {
    // 取得newIndex和oldIndex, 未改变时不处理
    let newIndex = 0;
    let oldIndex = 0;
    this.props.indicatorList.map((item, index) => {
      if (row_id === item.id) {
        oldIndex = index;
      }
    });
    data.map((item, index) => {
      if (row_id === item.id) {
        newIndex = index;
      }
    });
    if (oldIndex === newIndex) {
      return;
    }

    this.props.actions.fetchRankIndicator({
      type_id: this.state.currTypeId,
      source_id: row_id,
      target_id: after_id,
      data
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      }
    });
  },

  // 获取指标类型列表
  _getTypeList() {
    this.props.actions.fetchTypeList({
      tmpl_id: this.props.templateId
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      } else if (json.data.length > 0) {
        const currTypeId = json.data[0].id;
        this.setState({ currTypeId });
        this._getIndicatorList(currTypeId);
      }
    });
  },

  // 获取指标列表
  _getIndicatorList(typeId) {
    this.props.actions.fetchIndicatorList({
      tmpl_id: this.props.templateId,
      type_id: typeId
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg);
      }
    });
  },

  showSucc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    });
  },

  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    });
  },

  STYLE_SHEET: {
    typeListContainer: {
      width: '222px',
      height: '100%',
      float: 'left',
      paddingRight: '1px',
      position: 'relative'
    },
    typeAddBtn: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: '50px',
      borderBottomStyle: 'solid',
      borderBottomWidth: '1px',
      paddingLeft: '26px',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'color .3s'
    },
    typeAddIcon: {
      fontSize: '20px',
      paddingRight: '10px'
    },
    listBox: {
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      overflow: 'auto'
    },
    sortableItem: {
      width: '100%',
      height: '50px',
      lineHeight: '49px',
      padding: '0 65px 0 26px',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      cursor: 'default',
      position: 'relative',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    leftActBar: {
      position: 'absolute',
      right: '15px',
      top: 0,
      padding: '18px 0 17px',
      lineHeight: 1
    },
    splitLine: {
      width: '1px',
      height: '100%',
      position: 'absolute',
      right: 0,
      top: 0
    },
    indicatorListContainer: {
      width: '100%',
      paddingLeft: '222px',
      height: '100%',
    },
    indicatorListTitle: {
      height: '50px',
      width: '100%',
      padding: '13px 30px 12px',
      lineHeight: '24px',
      fontSize: '16px',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid'
    },
    indicatorAddIcon: {
      float: 'right',
      fontSize: '24px',
      cursor: 'pointer',
      transition: 'color .3s'
    }
  },
});

const stateToProps = state => ({
  ...state.indicator
});

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(indicatorActionCreators, dispatch)
})

TypeDefine.defaultProps = {
  editable: true
}

export default connect(stateToProps, dispatchToProps)(TypeDefine);
