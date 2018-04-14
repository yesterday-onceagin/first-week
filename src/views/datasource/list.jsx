import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';
import Loading from 'react-bootstrap-myui/lib/Loading'

import DataSourceItem from './components/DataSourceItem'
import DatasourceAddDialog from './components/DatasourceAddDialog'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as dataSourceActionCreators } from '@store/modules/datasource/datasource'

import _ from 'lodash'
import TipMixin from '@helpers/TipMixin'
import ConfirmMixin from '@helpers/ConfirmsMixin'
import { baseAlias } from '../../config'
import AuthComponent from '@components/AuthComponent';

import './datasource.less'

const DataSourceList = createReactClass({
  displayName: 'DataSourceList',

  mixins: [TipMixin, ConfirmMixin],

  propTypes: {
    actions: PropTypes.object,
    onChangeNavBar: PropTypes.func
  },

  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      addDialogShow: false
    }
  },

  componentWillMount() {
    // 向MAIN通知navbar显示内容 
    this.props.onChangeNavBar('数据源管理')
  },

  componentDidMount() {
    // 获取数据源列表
    this._fetchDataSources()
  },

  componentDidUpdate(prevProps) {
    const { list, page, total } = this.props
    // 仅当list发生变化时判断
    if (!_.isEqual(list, prevProps.list)) {
      const listEl = $('#datasource-list-wrapper')
      if (listEl.get(0).scrollHeight <= listEl.height() && list.length < total) {
        // 不足发生滚动，继续加载下一页
        this._fetchDataSources(page + 1)
      }
    }
  },

  render() {
    const { list, pending } = this.props
    const { addDialogShow } = this.state
    let dataList = []

    if (list && Array.isArray(list)) {
      dataList = list.map(item => (
        <DataSourceItem
          key={`datasource-item-${item.id}`}
          item={item}
          onDel={this.handleDeleteDataSource.bind(this, item)}
          onEdit={this.handleEditDataSource.bind(this, item)}
        />
      ))
    }

    dataList.unshift((
      <AuthComponent key="datasource-item-add" pagecode='添加数据源' visiblecode="edit">
        <DataSourceItem
          isAdd={true}
          onAdd={this.handleOpenAddDialog}
        />
      </AuthComponent>
    ))

    return (
      <div className="modules-page-container">
        <div className="data-view datasource-page" id="datasource-list-page">
          <div id="datasource-list-wrapper"
            style={this.STYLE_SHEET.wrapStyle}
            onScroll={this.handleScroll}>
            <div className="datasource-list-body" style={this.STYLE_SHEET.listBody}>
              {dataList}
            </div>
          </div>
          <Loading show={pending} containerId='datasource-list-page' />
          {
            addDialogShow && (
              <DatasourceAddDialog
                show={addDialogShow}
                onSure={this.handleGoAddPage}
                onHide={this.handleCloseAddDialog}
              />
            )
          }
        </div>
      </div>
    )
  },

  // 滚动事件
  handleScroll(e) {
    e.stopPropagation()
    const { list, page, total, pending } = this.props
    if (pending) {
      return
    }
    if (list.length >= total) {
      return
    }
    const listEl = $('#datasource-list-wrapper')
    const maxScrollHeight = listEl.get(0).scrollHeight - listEl.height()
    // 加载下一页
    if (maxScrollHeight - listEl.scrollTop() <= 50) {
      this._fetchDataSources(page + 1)
    }
  },

  // 添加数据源
  handleOpenAddDialog() {
    this.setState({
      addDialogShow: true
    });
  },

  // 添加数据源
  handleGoAddPage(mode) {
    this.handleCloseAddDialog()
    this.context.router.push(`${baseAlias}/datasource/detail/${mode}`)
  },

  handleCloseAddDialog() {
    this.setState({
      addDialogShow: false
    });
  },

  // 跳转编辑数据源
  handleEditDataSource(item) {
    const mode = item && item.type ? item.type.toLowerCase() : ''
    this.context.router.push(`${baseAlias}/datasource/detail/${mode}/${item.id}`)
  },

  // 删除数据源
  handleDeleteDataSource(item) {
    this.showConfirm({
      info: <span style={{ lineHeight: '30px' }}>确定要删除该数据源吗？</span>,
      content: '此项操作不可恢复，我已知晓并确认风险',
      checkbox: true,
      ok: () => {
        this.props.actions.deleteDataSource(item.id, (json) => {
          this.hideConfirm();
          if (!json.result) {
            this.showErr(json.msg)
          } else {
            this.showSucc(json.msg)
          }
        })
      }
    })
  },

  // 获取数据源
  _fetchDataSources(page = 1) {
    this.props.actions.fetchDataSources(page, {
      page_size: 20,
      is_buildin: 0
    }, (json) => {
      if (!json.result) {
        this.showErr(json.msg)
      }
    })
  },

  showSucc(msg) {
    this.showTip({
      status: 'success',
      content: msg
    })
  },

  showErr(error) {
    this.showTip({
      status: 'error',
      content: error
    })
  },

  STYLE_SHEET: {
    wrapStyle: {
      maxHeight: '100%',
      overflowY: 'auto',
      overflowX: 'hidden'
    },
    listBody: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginRight: '-25px'
    }
  },
})

const stateToProps = state => ({
  ...state.datasource
})

const dispatchToProps = dispatch => ({
  actions: bindActionCreators(dataSourceActionCreators, dispatch)
})

export default connect(stateToProps, dispatchToProps)(DataSourceList);
