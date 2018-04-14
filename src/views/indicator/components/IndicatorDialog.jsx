import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';

import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import Select from 'react-bootstrap-myui/lib/Select';
import Input from 'react-bootstrap-myui/lib/Input';
import Loading from 'react-bootstrap-myui/lib/Loading';
import IconButton from '../../../components/IconButton';

import { Form, ValidatedInput } from '../../../components/bootstrap-validation';
import TipMixin from '../../../helpers/TipMixin';

const IndicatorDialog = createReactClass({
  displayName: 'IndicatorDialog',
  mixins: [TipMixin],

  propTypes: {
    show: PropTypes.bool,
    data: PropTypes.object,
    onSure: PropTypes.func,
    onHide: PropTypes.func
  },

  getDefaultProps() {
    return {
      show: false
    };
  },

  getInitialState() {
    return {
      info: {
        type: this.props.data.type || '描述'
      },
      defaultInfo: {},
      rankEdited: false,
      types: ['描述', '数值', '维度', '地址', '日期']
    }
  },

  componentWillMount() {
    if (this.props.data.id) {
      this.props.fetchIndicatorData(this.props.data.id, (json) => {
        if (json.result) {
          this.setState({
            info: json.data,
            defaultInfo: json.data
          });
        } else {
          this.showTip({
            status: 'error',
            content: json.msg
          });
        }
      })
    }
  },

  render() {
    const { show, onHide, data, pending } = this.props
    const { info, types } = this.state;

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '550px' }}
        className="indicator-config-dialog" id="indicator-config-dialog">
        <Dialog.Header closeButton>
          <Dialog.Title>{!data.id ? '添加指标' : `编辑指标(${data.name})`}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body id="indicator-option-dialog-body">
          <Form className="form-horizontal indicator-option-form"
            validationEvent="onBlur"
            onValidSubmit={this.handleSaveInfo}
            ref={(instance) => { this.indicator_option_form = instance }}>
            <ValidatedInput type="text"
              label={<span><i className="required">*</i>指标名称</span>}
              autoComplete="off"
              name="name"
              value={info.name || ''}
              onChange={this.handleChangeInfo.bind(this, 'name')}
              maxLength="20"
              wrapperClassName="input-wrapper"
              validate='required'
              errorHelp={{
                required: '请输入指标名称'
              }} />
            <div className="form-group">
              <label className="control-label">
                <span><i className="required">*</i>类型</span>
              </label>
              <div className="input-wrapper">
                <Select value={info.type} maxHeight={250} width={'100%'} openSearch={false}
                  onSelected={this.handleChangeType.bind(this)}>
                  {
                    types.map((typeName, key) => <option value={typeName} key={key}>{typeName}</option>)
                  }
                </Select>
              </div>
            </div>
            {
              info.type === '维度' && (
                <div className="form-group">
                  <div className="dimension-table-title" style={{ paddingBottom: '10px' }}>
                    <Button bsStyle="default" bsSize="small" className="add-dimension-btn"
                      style={{ minHeight: '22px', height: '22px', lineHeight: '20px', float: 'right', borderRadius: '28px' }}
                      onClick={this.handleAddDimension}>
                      添加维度
                    </Button>
                  </div>
                  <div className="dimension-table-box" style={this.STYLE_SHEET.tableBox}>
                    <div className="dimension-table-head" style={this.STYLE_SHEET.tableTitle}>
                      <div style={{ paddingLeft: '15px', width: '100px', float: 'right' }}>操作</div>
                      <div style={{ paddingLeft: '15px', paddingRight: '120px', width: '100%' }}>维度中文定义</div>
                    </div>
                    {
                      Array.isArray(info.dimension) && info.dimension.length > 0 ? (
                        <ul className="dimension-table-body" style={{ height: '120px', overflow: 'auto' }}>
                          {
                            info.dimension.map((item, index) => (
                              <li className="dragable-dimension-item"
                                key={item.id || index}
                                style={{ height: '40px', lineHeight: '40px' }}>
                                <div style={{ width: '100px', float: 'right' }}>
                                  <IconButton onClick={this.handleDeleteDimension.bind(this, item, index)}
                                    iconClass="dmpicon-del">删除</IconButton>
                                </div>
                                <div style={{ paddingLeft: '15px', paddingRight: '120px', width: '100%' }}>
                                  <span className="dimension-name-span">{item.name}</span>
                                  <Input type="text"
                                    className="dimension-name-input"
                                    onChange={this.handleChangeDimension.bind(this, item, index)}
                                    value={item.name}
                                    placeholder="请输入维度中文定义" />
                                </div>
                              </li>
                            ))
                          }
                        </ul>
                      ) : (
                        <div style={{ height: '120px', lineHeight: '40px', textAlign: 'center' }}>
                            请添加维度
                        </div>
                      )
                    }
                  </div>
                </div>
              )
            }
          </Form>

          <Loading show={show && pending} containerId="indicator-option-dialog-body" />
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={() => { this.indicator_option_form.submit() }}>确定</Button>
          <Button bsStyle="default" onClick={onHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  },

  // 维度排序
  handleDimensionSort({ oldIndex, newIndex }) {
    this.setState({
      rankEdited: true,
      info: {
        ...this.state.info,
        dimension: arrayMove(this.state.info.dimension, oldIndex, newIndex)
      }
    });
  },

  // 编辑维度中文定义
  handleChangeDimension(di, index, e) {
    if (!Array.isArray(this.state.info.dimension) || this.state.info.dimension.length === 0) {
      return;
    }

    const newDimension = this.state.info.dimension.concat();

    newDimension[index].name = e.target.value;

    this.setState({
      info: {
        ...this.state.info,
        dimension: newDimension
      }
    });
  },

  // 删除指标维度
  handleDeleteDimension(di, index) {
    if (!Array.isArray(this.state.info.dimension) || this.state.info.dimension.length === 0) {
      return;
    }

    const newDimension = this.state.info.dimension.concat();
    newDimension.splice(index, 1);

    this.setState({
      info: {
        ...this.state.info,
        dimension: newDimension
      }
    });
  },

  // 添加指标维度
  handleAddDimension() {
    const info = this.state.info;
    let newDimension = [];

    if (Array.isArray(info.dimension)) {
      newDimension = info.dimension.concat();
    }

    const newDi = info.id ? {
      name: '',
      indicator_id: info.id
    } : {
      name: ''
    };

    newDimension.push(newDi);

    this.setState({
      info: {
        ...this.state.info,
        dimension: newDimension
      }
    });
  },

  // 切换类型
  handleChangeType(opts) {
    if (this.state.info && this.state.info.type === opts.value) {
      return;
    }
    this.setState({
      info: {
        ...this.state.info,
        type: opts.value
      }
    });
  },

  // 名称输入
  handleChangeInfo(field, e) {
    this.setState({
      info: {
        ...this.state.info,
        [field]: e.target.value
      }
    })
  },

  // 保存提交
  handleSaveInfo() {
    const info = this.state.info;

    if (info.type === '维度') {
      // 维度数组长度为0或不是数组
      if (!Array.isArray(info.dimension) || info.dimension.length === 0) {
        this.showTip({
          status: 'error',
          content: '未添加维度'
        });
        return;
      }

      let hasErr = false;
      const newDimension = info.dimension.map((item, index) => {
        // 检测无名维度
        if (!item.name) {
          hasErr = true;
        }
        item.rank = index + 1;
        return item;
      });

      if (hasErr) {
        this.showTip({
          status: 'error',
          content: '存在名称为空的维度'
        });
        return;
      }

      info.dimension = newDimension;
    }

    this.props.onSure(info);
  },

  STYLE_SHEET: {
    tableBox: {
      borderWidth: '1px',
      borderStyle: 'solid'
    },
    tableTitle: {
      width: '100%',
      height: '40px',
      lineHeight: '38px',
      fontSize: '14px'
    }
  },
});

export default IndicatorDialog;
