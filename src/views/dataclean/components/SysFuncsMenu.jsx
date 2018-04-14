import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';
import Loading from 'react-bootstrap-myui/lib/Loading';
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import MicroTree from '../../../components/MicroTree';
import isEqual from 'lodash/isEqual';

const SysFuncsMenu = createReactClass({
  displayName: 'SysFuncsMenu',

  propTypes: {
    show: PropTypes.bool,
    pending: PropTypes.bool,
    funcs: PropTypes.array
  },

  getInitialState() {
    return {
      list: {},
      selfFuncs: {
        _name_: '自定义函数',
        _spread_: false,
        _funcs_: []
      },
      dialog: {
        show: false,
        info: null
      }
    }
  },

  componentDidMount() {
    const { list, selfFuncs } = this.getListData(this.props.funcs);

    this.setState({ list, selfFuncs });
  },

  componentWillReceiveProps(nextProps) {
    if (!isEqual(this.props.funcs, nextProps.funcs)) {
      const { list, selfFuncs } = this.getListData(nextProps.funcs);

      this.setState({ list, selfFuncs });
    }
  },

  render() {
    const { pending } = this.props;
    const { list, selfFuncs } = this.state;

    return (
      <div style={{ display: this.props.show ? 'block' : 'none' }} id="sys-funcs-config">
        {this.renderGroup(selfFuncs)}
        {Object.keys(list).map(key => this.renderClassGroup(list[key]))}
        {this.renderDialog()}
        <Loading show={pending} containerId="sys-funcs-config" />
      </div>
    );
  },

  // class集合
  renderClassGroup(group) {
    const { _spread_, _name_, ...groups } = group;

    return (
      <div>
        <div className={`funcs-title-folder  ${_spread_ ? 'spread' : ''}`}
          onClick={this.handleFolderSpread.bind(this, null, _name_)}
        >
          <i className="dmpicon-triangle" />
          <i className={_spread_ ? 'dmpicon-folder-open' : 'dmpicon-folder-close'} />
          {_name_}
        </div>
        <div className="funcs-list" style={{ display: _spread_ ? 'block' : 'none' }}>
          {Object.keys(groups).map(key => this.renderGroup(groups[key], _name_))}
        </div>
      </div>
    )
  },

  // funcs集合
  renderGroup(group, category = null) {
    return (
      group ? (
        <MicroTree
          data={group}
          sort={false}
          dataField={{
            title: '_name_',
            children: '_funcs_',
            text: 'func_name'
          }}
          events={{
            onSpread: this.handleFolderSpread.bind(this, category),
            onSelect: this.handleOpenFuncDetail
          }}
        />
      ) : null
    )
  },

  // 渲染弹窗
  renderDialog() {
    const { info, show } = this.state.dialog;
    return info ? (
      <Dialog
        show={show}
        backdrop="static"
        onHide={this.handleCloseFuncDetail}
        size={{ width: '600px', height: '450px' }}
        className="sys-funcs-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>{`系统函数（${info.func_name}）`}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <table className="table-scroll-title">
            <thead>
              <tr>
                <th width="120" style={this.STYLE_SHEET.cell}>
                  属性名
                </th>
                <th width="427" style={this.STYLE_SHEET.cell}>
                  属性值
                </th>
              </tr>
            </thead>
          </table>
          <div className="table-scroll-body" style={this.STYLE_SHEET.tbodyContainer}>
            {this.renderTables()}
          </div>
        </Dialog.Body>
      </Dialog>
    ) : null
  },

  // 渲染表格
  renderTables() {
    const { dialog } = this.state

    const cloumns = {
      func_name: '函数名',
      created_on: '创建时间',
      cmd_format: '命令格式',
      param_remark: '参数说明',
      purpose: '用途'
    };

    const _covertStr = (str, type) => {
      // 时间类型截取日期部分
      const arr = type === 'created_on' ? [str.split('T')[0]] : str.split('\n');
      return (
        <div>
          {arr && arr.map((item, i) => <p key={`part-${i}`} style={{ margin: '0px', paddingRight: '5px' }}>{item}</p>)}
        </div>
      );
    }

    return (
      <table>
        <tbody>
          {
            Object.keys(cloumns).map((item, key) => (
              <tr key={key}>
                <td width="120" style={this.STYLE_SHEET.cell}>
                  {cloumns[item]}
                </td>
                <td width="427" style={this.STYLE_SHEET.cell}>
                  {dialog.info[item] ? _covertStr(dialog.info[item], item) : ''}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    )
  },

  // 文件夹展开
  handleFolderSpread(category, type) {
    const { list, selfFuncs } = this.state;

    if (type === '自定义函数') {
      this.setState({
        selfFuncs: {
          ...selfFuncs,
          _spread_: !selfFuncs._spread_
        }
      });
    } else if (category === null) {
      this.setState({
        list: {
          ...list,
          [type]: {
            ...list[type],
            _spread_: !list[type]._spread_
          }
        }
      });
    } else {
      this.setState({
        list: {
          ...list,
          [category]: {
            ...list[category],
            [type]: {
              ...list[category][type],
              _spread_: !list[category][type]._spread_
            }
          }
        }
      });
    }
  },

  // 打开函数详情弹窗
  handleOpenFuncDetail(func) {
    this.setState({
      dialog: {
        show: true,
        info: func
      }
    });
  },

  // 关闭函数详情弹窗
  handleCloseFuncDetail() {
    this.setState({
      dialog: {
        show: false,
        info: null
      }
    });
  },

  // 梳理数据
  getListData(funcsArr) {
    const list = {};
    const selfFuncs = {
      _name_: '自定义函数',
      _spread_: false,
      _funcs_: []
    };

    funcsArr.forEach((func) => {
      const category = func.category || '自定义函数';

      if (category === '自定义函数') {
        selfFuncs._funcs_.push(func);
      } else if (list[category]) {
        if (list[category][func.type]) {
          list[category][func.type]._funcs_.push(func);
        } else {
          list[category][func.type] = {
            _name_: func.type,
            _spread_: false,
            _funcs_: [func]
          }
        }
      } else {
        list[category] = {
          _name_: category,
          _spread_: true,
          [func.type]: {
            _name_: func.type,
            _spread_: false,
            _funcs_: [func]
          }
        }
      }
    });

    return {
      list,
      selfFuncs
    };
  },

  STYLE_SHEET: {
    cell: {
      textAlign: 'left',
      paddingLeft: '20px',
      lineHeight: '40px'
    },
    tbodyContainer: {
      height: `${450 - 50 - 29 - 19 - 42}px`,
      overflowY: 'auto',
      overflowX: 'hidden'
    }
  },
});

export default SysFuncsMenu;
