import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog';
import Button from 'react-bootstrap-myui/lib/Button';
import Input from 'react-bootstrap-myui/lib/Input';
import MapColumnTable from './MapColumnTable';

import { DEFAULT_MAP_OPTIONS } from '../constants/map';

class MapColumnDialog extends React.Component {
  static propTypes = {
    show: PropTypes.bool,
    /**
     * 显示的数据
     * {
          name: 'cloumn',
          pending: true,
          show: true, // 过滤字段
          values: [{
            value: '问询',
            total_record: '121',
            map: '',
            maps: [{
              name: '男'
            },{
              name: '女'
            }] 
          }],
          regex:[{
            value: '12',
            map: ''
          }]
        }
     * 
     */
    data: PropTypes.object,
    /**
     * 当前的 序列号
     */
    active: PropTypes.number,
    /**
     * 事件
     */
    events: PropTypes.shape({
      onHide: PropTypes.func,
      onSave: PropTypes.func
    })
  };

  static defaultProps = {
    show: false
  };

  state = {
    active: 0, // 当前显示的
    info: {}
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps && nextProps.data) {
      const { regex, values } = nextProps.data;

      this.setState({
        info: {
          ...nextProps.data,
          regex: regex ? regex.slice() : [],
          values: values ? values.slice().sort((a, b) => {
            if (Number.parseInt(a.total_record, 10) > Number.parseInt(b.total_record, 10)) {
              return -1;
            } else if (Number.parseInt(a.total_record, 10) < Number.parseInt(b.total_record, 10)) {
              return 1;
            }
            return 0;
          }) : []
        }
      })
    }
  }

  componentDidMount() {
    if (this.props.data) {
      const { regex, values } = this.props.data;

      this.setState({
        info: {
          ...this.props.data,
          regex: regex ? regex.slice() : [],
          values: values ? values.slice().sort((a, b) => {
            if (Number.parseInt(a.total_record, 10) > Number.parseInt(b.total_record, 10)) {
              return -1;
            } else if (Number.parseInt(a.total_record, 10) < Number.parseInt(b.total_record, 10)) {
              return 1;
            }
            return 0;
          }) : []
        }
      })
    }

    $('#table-view-wrap').find('.inner-table-wrap').scroll(function () {
      const sTop = $(this).scrollTop();

      $(this).find('thead')[0].style.transform = `translate(0, ${sTop}px)`;

      if (sTop && sTop > 0) {
        $(this).find('thead').addClass('scrolling-thead');
      } else {
        $(this).find('thead').removeClass('scrolling-thead');
      }
    });
  }

  render() {
    const { show } = this.props;
    const { info, active } = this.state;

    return (
      <Dialog
        id="map-cloumn-dialog"
        show={show}
        backdrop="static"
        onHide={this.handleHide}
        size={{ width: '550px', height: '440px' }}
        className="map-cloumn-dialog"
      >
        <Dialog.Header closeButton>
          <Dialog.Title>指标映射（{info.name}）</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body ref={(instance) => { this.dialog_body = instance }} style={{ position: 'relative' }}>
          <div className="dataview-tab" style={{ height: '44px', width: '100%', paddingBottom: '10px' }}>
            <div className="dataview-tab-btn-container" style={{ width: '240px', marginLeft: '136px' }}>
              <button type="button"
                className={`btn btn-dataview-tab ${active === 0 ? 'active' : ''}`}
                onClick={this.handleSwitch.bind(this, 0)}
              >
                维度映射
              </button>
              <button type="button"
                className={`btn btn-dataview-tab ${active === 1 ? 'active' : ''}`}
                onClick={this.handleSwitch.bind(this, 1)}
              >
                规则映射
              </button>
            </div>
          </div>
          <div className="table-view-wrap" id="table-view-wrap">
            <div className="item dim" style={{ display: active === 0 ? 'block' : 'none' }}>
              <div className="btn-wrap">
                <Button bsStyle="default" onClick={this.handleSameMap}>同名映射</Button>
              </div>
              <div className="inner-table-wrap">
                <MapColumnTable
                  data={info.values}
                  cols={DEFAULT_MAP_OPTIONS.dim_columns}
                  pending={info.pending}
                  container={this.dialog_body}
                  onChange={this.handleChangeMap}
                />
              </div>
            </div>
            <div className="item rule" style={{ display: active === 1 ? 'block' : 'none' }}>
              <div className="btn-wrap">
                <Button bsStyle="default" onClick={this.handleAdd}>添加</Button>
              </div>
              <div className="inner-table-wrap data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      {
                        DEFAULT_MAP_OPTIONS.rule_columns.map((item, i) => (
                          <th key={`thead-th-${i}`}>{item}</th>
                        ))
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {
                      info.regex && info.regex.length > 0 && info.regex.map((item, index) => (
                        <tr key={`tbody-tr-${index}`}>
                          <td>
                            <div className="form">
                              <Input
                                type="text"
                                value={item.pattern || ''}
                                className="table-input"
                                onChange={this.handleChangeInfo.bind(this, 'pattern', index)}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="form">
                              <Input
                                type="text"
                                value={item.value || ''}
                                className="table-input"
                                onChange={this.handleChangeInfo.bind(this, 'value', index)}
                              />
                            </div>
                          </td>
                          <td width="100">
                            <i className="dmpicon-del" onClick={this.handleDelete.bind(this, index)} />
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button bsStyle="primary" onClick={this.handleSave}>保存</Button>
          <Button bsStyle="default" onClick={this.handleHide}>取消</Button>
        </Dialog.Footer>
      </Dialog>
    );
  }

  handleSwitch = (active) => {
    if (this.state.active !== active) {
      this.setState({
        active
      })
    }
  };

  handleChangeInfo = (field, index, e) => {
    this.state.info.regex[index][field] = e.target.value
    this.setState({
      ...this.state
    })
  };

  handleChangeMap = (data) => {
    this.state.info.values = data.slice()
    this.setState({ ...this.state })
  };

  handleAdd = () => {
    this.state.info.regex = this.state.info.regex || []
    this.state.info.regex.push({
      pattern: '',
      value: ''
    })

    this.setState({ ...this.state })
  };

  handleDelete = (index) => {
    this.state.info.regex.splice(index, 1)
    this.setState({ ...this.state })
  };

  handleSameMap = () => {
    const values = this.state.info.values.slice()
    this.state.info.values = values.map((item) => {
      let map = item.map || ''
      if (item.maps && Array.isArray(item.maps)) {
        map = item.maps.filter(_map => _map.name === item.value).length > 0 ? item.value : map
      }
      return {
        ...item,
        map
      }
    })
    this.setState({ ...this.state })
  };

  handleHide = () => {
    this.setState({ info: {} }, this.props.events.onHide);
  };

  handleSave = () => {
    const { active, events } = this.props;

    events.onSave(active, { ...this.state.info })
  };
}

export default MapColumnDialog;
