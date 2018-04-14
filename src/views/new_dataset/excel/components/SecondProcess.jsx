import React from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button';
import Loading from 'react-bootstrap-myui/lib/Loading';
import DatasetResultTable from '../../components/DatasetResultTable';
import DatasetFieldEditor from '../../components/DatasetFieldEditor';

class SecondProcess extends React.Component {
  static PropTypes = {
    onNext: PropTypes.func,
    onPrev: PropTypes.func,
    pending: PropTypes.bool,       // 轮询 状态
    sheetsData: PropTypes.array,   // 
    initState: PropTypes.object    //
  }

  state = {
    sheetActive: 0,
    navActive: 0
  }

  constructor(props) {
    super(props);

    if (props.initState) {
      this.state = {
        ...this.state,
        ...props.initState
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const { initState } = this.props
    if (!_.isEqual(nextProps.initState, initState)) {
      this.setState({
        ...this.state,
        ...nextProps.initState
      })
    }
  }

  render() {
    const { sheetsData, pending, selectSheet, workSheet } = this.props
    const { sheetActive, navActive } = this.state
    const selectSheetName = selectSheet ? workSheet.filter((item, key) => selectSheet.indexOf(key) > -1) : []
    const activeTabData = sheetsData ? sheetsData.find(item => item.sheet_name == selectSheetName[sheetActive]) : null
    const hasError = activeTabData ? !!activeTabData.error_msg : false
    const disabled = pending || (sheetsData && sheetsData.length > 0 ? !sheetsData.some(item => !item.error_msg) : true)

    return <div className="excel-main fixed">
      <div className="main-wrap" id="main-wrap">
        <div className="left-wrap">
          <span>工作表</span>
          <div className="sheet-wrap">
            {
              selectSheetName.map((item, key) => (
                <div key={key} className={sheetActive === key ? 'item active' : 'item'} onClick={this.handleSelect.bind(this, key)}>{item}</div>
              ))
            }
          </div>
        </div>
        <div className="right-wrap">
          <div className="navlist">
            <div className={navActive === 0 ? 'item active' : 'item'} onClick={this.handleNav.bind(this, 0)}>数据预览</div>
            <div className={navActive === 1 ? 'item active' : 'item'} onClick={this.handleNav.bind(this, 1)}>字段设置</div>
            {activeTabData && activeTabData.count > 0 && <div className="tip">显示前100条，一共 <span style={{ color: '#24bbf9' }}>{`${activeTabData.count}`}</span> 条数据</div>}
          </div>
          {
            navActive === 0 && (activeTabData && !hasError ?
              <DatasetResultTable
                data={activeTabData.data}
                head={activeTabData.head}
                editable={false}
              /> : <div className="error-box">
                <div className="error-msg">{activeTabData ? activeTabData.error_msg : '暂时无数据'}</div>
              </div>
            )
          }
          {
            navActive === 1 && (activeTabData && !hasError ?
              <DatasetFieldEditor
                data={activeTabData.field}
                onUpdate={this.handleUpdate.bind(this)}
              /> : <div className="error-box">
                <div className="error-msg">{activeTabData ? activeTabData.error_msg : '暂无数据'}</div>
              </div>
            )
          }
        </div>
        <Loading show={pending} containerId="main-wrap"/>
      </div>
      <div className="footer">
        <Button onClick={this.handlePrev.bind(this)}>上一步</Button>
        <Button disabled={disabled} bsStyle="primary" onClick={this.handleNext.bind(this)}>下一步</Button>
      </div>
    </div>
  }

  handleUpdate(data) {
    this.props.onUpdateDatasetField(this.state.sheetActive, data)
  }

  handlePrev(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    this.props.onPrev({
      secondProcess: this.state
    })
  }

  handleNext(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    this.props.onNext({
      secondProcess: this.state
    })
  }

  handleSelect(active) {
    if (this.state.sheetActive !== active) {
      this.setState({
        sheetActive: active,
        navActive: 0
      })
    }
  }

  handleNav(active) {
    if (this.state.navActive !== active) {
      this.setState({
        navActive: active
      })
    }
  }
}

export default SecondProcess
