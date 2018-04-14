import React from 'react'
import PropTypes from 'prop-types'

import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import Select from 'react-bootstrap-myui/lib/Select';

class ConfigDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    data: PropTypes.object,
    onSure: PropTypes.func,
    onHide: PropTypes.func,
    getTableColumns: PropTypes.func,
    tableList: PropTypes.array,
    datasourceId: PropTypes.string
  };

  static defaultProps = {
    show: false,
    tableList: []
  };

  constructor(props) {
    super(props)
    this.state = {
      info: {
        ...props.data,
        odps_table: props.data.odps_table ? props.data.odps_table : (props.tableList[0] ? props.tableList[0].name : '')
      },
      tableColumns: []
    };
  }

  componentDidMount() {
    // 获取表字段
    this.getColumns(this.state.info.odps_table);
  }

  render() {
    const { show, onHide, tableList } = this.props
    const { info, tableColumns } = this.state;

    return (
      <Dialog
        show={show}
        onHide={onHide}
        backdrop="static"
        size={{ width: '550px' }}
        className="data-view-list-add-dialog" id="data-view-list-add-dialog">
        <Dialog.Header closeButton>
          <Dialog.Title>业务指标配置</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <div className="form" style={{ minHeight: '100px' }}>
            <div className="form-group-row form-group-row-2">
              <div className="form-group">
                <label className="control-label">
                  <span><i className="required">*</i>ODPS表名</span>
                </label>
                <div className="input-wrapper">
                  <Select value={info.odps_table}
                    maxHeight={250}
                    width={'100%'}
                    openSearch={true}
                    onSelected={this.handleChangeInfo.bind(this, 'odps_table')}>
                    {
                      tableList.map((table, key) => <option value={table.name} key={key}>{table.name}</option>)
                    }
                  </Select>
                </div>
              </div>
              <div className="form-group">
                <label className="control-label">
                  <span><i className="required">*</i>字段名</span>
                </label>
                <div className="input-wrapper">
                  <Select value={info.odps_field}
                    maxHeight={250}
                    width={'100%'}
                    openSearch={true}
                    onSelected={this.handleChangeInfo.bind(this, 'odps_field')}>
                    {
                      tableColumns.map((col, key) => <option value={col.name} key={key}>{col.name}</option>)
                    }
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSaveInfo}>确定</Button>
          <Button bsStyle="default" onClick={onHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  }

  // 选项变更
  handleChangeInfo = (field, opts) => {
    if (field === 'odps_table' && this.state.info.odps_table !== opts.value) {
      this.setState({
        info: {
          ...this.state.info,
          [field]: opts.value
        }
      }, this.getColumns.bind(this, opts.value));
    } else {
      this.setState({
        info: {
          ...this.state.info,
          [field]: opts.value
        }
      });
    }
  };

  // 保存配置
  handleSaveInfo = () => {
    this.props.onSure(this.state.info);
  };

  // 获取表字段
  getColumns = (odps_table) => {
    this.props.getTableColumns({
      page: 1,
      page_size: 100000,
      id: this.props.datasourceId,
      table_name: odps_table
    }, (json) => {
      if (json.result) {
        let newFiled = json.data.items.length > 0 ? json.data.items[0].name : '';

        if (odps_table === this.props.data.odps_table) {
          newFiled = this.props.data.odps_field || (json.data.items.length > 0 ? json.data.items[0].name : '');
        }

        this.setState({
          tableColumns: json.data.items,
          info: {
            ...this.state.info,
            odps_field: newFiled
          }
        });
      }
    });
  };
}

export default ConfigDialog;
